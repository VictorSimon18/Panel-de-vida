// Diario: una entrada por día con texto, etiquetas y foto (la foto se guarda aparte, ver photos.js).
// El ánimo del día es el mismo de Bienestar (habits.mood), para no apuntarlo dos veces.

import { iso, addDays, parseISO } from "./stats.js";

export const entryOf = (state, date) => (state.diary || []).find(e => e.date === date) || null;
export const moodOf = (state, date) => state.habits.mood.find(m => m.date === date)?.value || null;
export const hasContent = e => !!(e && (e.text?.trim() || e.photoV || e.tags?.length));

/** Racha de días seguidos escribiendo (hasta hoy, o hasta ayer si hoy aún no) y la mejor */
export function diaryStreak(state, today = iso()) {
  const days = new Set((state.diary || []).filter(hasContent).map(e => e.date));
  let d = parseISO(today);
  if (!days.has(today)) d = addDays(d, -1);
  let current = 0;
  while (days.has(iso(d))) { current++; d = addDays(d, -1); }
  let best = 0, run = 0, prev = null;
  for (const x of [...days].sort()) {
    run = prev && iso(addDays(parseISO(prev), 1)) === x ? run + 1 : 1;
    best = Math.max(best, run); prev = x;
  }
  return { current, best };
}

/** «En este día»: entradas del mismo día de meses y años anteriores (hace 1 mes, hace 1 año…) */
export function onThisDay(state, today = iso()) {
  const t = parseISO(today), out = [];
  const add = (date, label) => { const e = entryOf(state, date); if (hasContent(e)) out.push({ label, entry: e }); };
  // primero los años (los recuerdos más especiales), luego hace un mes
  for (let y = 1; y <= 10; y++) {
    const d = new Date(t.getFullYear() - y, t.getMonth(), t.getDate());
    if (d.getDate() === t.getDate()) add(iso(d), y === 1 ? "Hace un año" : `Hace ${y} años`);
  }
  const monthAgo = new Date(t.getFullYear(), t.getMonth() - 1, t.getDate());
  if (monthAgo.getDate() === t.getDate()) add(iso(monthAgo), "Hace un mes");
  return out;
}

const fold = t => String(t ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
/** Busca en el texto y las etiquetas (todas las palabras deben aparecer) */
export function searchDiary(state, q) {
  const words = fold(q).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return (state.diary || []).filter(hasContent)
    .filter(e => { const hay = fold(`${e.text} ${(e.tags || []).join(" ")}`); return words.every(w => hay.includes(w)); })
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Etiquetas usadas, de más a menos frecuentes */
export function allTags(state) {
  const m = new Map();
  for (const e of state.diary || []) for (const t of e.tags || []) m.set(t, (m.get(t) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
}
