// Fotos del diario: se guardan APARTE del resto de datos (en IndexedDB, clave "diary-photos") para que
// cada cambio pequeño no tenga que volver a subir todas las fotos. La entrada del diario solo guarda
// la versión de su foto (photoV); la sincronización sube y baja las fotos por meses (ver sync.js).

import { dbGet, dbSet } from "./db.js";
import { uid } from "./ui.js";

const KEY = "diary-photos";        // { "AAAA-MM-DD": { v, src } }
const QUEUE = "diary-photo-queue"; // { "AAAA-MM": marca } meses con cambios pendientes de subir
let cache = {};
let queue = {};

export async function loadPhotos() {
  cache = (await dbGet(KEY).catch(() => null)) || {};
  const q = await dbGet(QUEUE).catch(() => null);
  queue = q && !Array.isArray(q) ? q : {};
}

const save = () => dbSet(KEY, cache);
const saveQueue = () => dbSet(QUEUE, queue);
// la marca cambia en cada cambio: si se añade otra foto del mismo mes mientras se sube, el mes sigue pendiente
const mark = async ym => { queue[ym] = uid(); await saveQueue(); };

export const photoOf = date => cache[date]?.src || null;
export const photoVersion = date => cache[date]?.v || null;
export const photoCount = () => Object.keys(cache).length;

/** Guarda la foto de un día (data URL). Devuelve la versión, que se apunta en la entrada. */
export async function setPhoto(date, src) {
  const v = uid();
  cache[date] = { v, src };
  await save();
  await mark(date.slice(0, 7));
  return v;
}

export async function removePhoto(date) {
  if (!cache[date]) return;
  delete cache[date];
  await save();
  await mark(date.slice(0, 7));
}

// ---------- Para la sincronización
/** Meses pendientes con su marca: [[ym, marca], …] */
export const pendingMonths = () => Object.entries(queue);
export async function donePending(done) { for (const [ym, stamp] of done) if (queue[ym] === stamp) delete queue[ym]; await saveQueue(); }
/** Fotos de un mes: { fecha: { v, src } } */
export const monthPhotos = ym => Object.fromEntries(Object.entries(cache).filter(([d]) => d.startsWith(ym)));
/** Guarda fotos bajadas de la nube (sin marcarlas para subir) */
export async function storeRemote(list) { for (const [d, p] of list) cache[d] = p; await save(); }
/** Quita las fotos locales que ya no tiene ninguna entrada (borradas en otro dispositivo) */
export async function pruneOrphans(entries) {
  const keep = new Set(entries.filter(e => e.photoV).map(e => e.date));
  const pend = new Set(Object.keys(queue));
  let changed = false;
  for (const d of Object.keys(cache)) if (!keep.has(d) && !pend.has(d.slice(0, 7))) { delete cache[d]; changed = true; }
  if (changed) await save();
}

// ---------- Copias de seguridad y borrado
export const allPhotos = () => ({ ...cache });
export async function replaceAllPhotos(map = {}) {
  const months = new Set([...Object.keys(cache), ...Object.keys(map)].map(d => d.slice(0, 7)));
  cache = { ...map };
  await save();
  for (const ym of months) await mark(ym);
}

// ---------- Leer fotos del usuario (JPG, PNG… y HEIC/HEIF de iPhone)
const isHeic = f => /image\/hei[cf]/i.test(f.type || "") || /\.(heic|heif)$/i.test(f.name || "");
let heicLib = null;

/** Carga el decodificador de HEIC la primera vez que hace falta (js/vendor/heic2any.min.js, MIT) */
function loadHeic() {
  return heicLib ||= new Promise((resolve, reject) => {
    if (window.heic2any) return resolve(window.heic2any);
    const el = document.createElement("script");
    el.src = new URL("./vendor/heic2any.min.js", import.meta.url).href;
    el.onload = () => window.heic2any ? resolve(window.heic2any) : reject(new Error("heic"));
    el.onerror = () => { heicLib = null; reject(new Error("heic-red")); };
    document.head.appendChild(el);
  });
}

/** Decodifica con el propio navegador → { img, w, h, close } */
function decode(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => resolve({ img, w: img.naturalWidth, h: img.naturalHeight, close: () => URL.revokeObjectURL(url) });
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("imagen")); };
    img.src = url;
  });
}

/**
 * Lee una imagen elegida por el usuario. Safari entiende HEIC, pero Chrome, Edge y Firefox no:
 * en ese caso se convierte a JPEG antes (onConvert avisa de que va a tardar unos segundos).
 */
export async function readImage(file, { onConvert } = {}) {
  try { return await decode(file); }
  catch (e) { if (!isHeic(file)) throw e; }
  onConvert?.();
  let out;
  try {
    const heic2any = await loadHeic();
    out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 });
  } catch (e) { throw new Error(e?.message === "heic-red" ? "heic-red" : "heic"); }   // el decodificador lanza objetos sueltos: se unifican
  if (Array.isArray(out)) out = out[0];              // un HEIC puede traer varias imágenes: se usa la primera
  return decode(out);
}

/** Texto para el aviso cuando falla una foto */
export const photoErrorText = err =>
  err?.message === "heic-red" ? "Para abrir fotos HEIC hace falta conexión la primera vez. Conéctate o prueba con una JPG."
  : err?.message === "heic" ? "No se pudo convertir esa foto HEIC. Prueba con una JPG."
  : "No se pudo leer esa imagen";

/** Imagen → JPEG de como mucho `max` px por lado (≈ 30-40 KB con 480 px), como data URL */
export async function shrinkPhoto(file, max = 480, quality = 0.72, hooks) {
  const im = await readImage(file, hooks);
  try {
    const k = Math.min(1, max / Math.max(im.w, im.h));
    const c = document.createElement("canvas");
    c.width = Math.round(im.w * k); c.height = Math.round(im.h * k);
    c.getContext("2d").drawImage(im.img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", quality);
  } finally { im.close(); }
}

/** Imagen → JPEG cuadrado (recorte centrado) de size × size, como data URL (foto de perfil) */
export async function squarePhoto(file, size = 256, hooks) {
  const im = await readImage(file, hooks);
  try {
    const side = Math.min(im.w, im.h);
    const c = document.createElement("canvas");
    c.width = c.height = size;
    c.getContext("2d").drawImage(im.img, (im.w - side) / 2, (im.h - side) / 2, side, side, 0, 0, size, size);
    return c.toDataURL("image/jpeg", 0.85);
  } finally { im.close(); }
}
