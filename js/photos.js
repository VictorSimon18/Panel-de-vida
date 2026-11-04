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

/** Imagen → JPEG de como mucho `max` px por lado (≈ 30-40 KB con 480 px) */
export function shrinkPhoto(file, max = 480, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("imagen")); };
    img.src = url;
  });
}
