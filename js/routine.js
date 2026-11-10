// Rutina diaria con cronómetro (plancha, flexiones…): ejercicios por tiempo o por repeticiones,
// con descanso entre ellos. Al terminarla se marca sola el hábito «Rutina diaria» (auto "routine").
// state.routine:            { rest: segundos, steps: [{ id, name, kind: "time"|"reps", secs?, reps?, inc?, max? }],
//                             progress: { week, last: { week, days, changes: [{ id, name, kind, from, to }] } } }
//   inc = cuánto sube ese ejercicio cada semana (segundos o repeticiones; 0 = no sube); max = tope opcional.
// state.habits.routineLog:  [{ id, date, at, secs, steps }]  (cada vez que la terminas)

import { uid } from "./ui.js";
import { iso, addDays, parseISO, weekStart } from "./stats.js";
import { setHabitValue } from "./habits.js";

export const ROUTINE_HABIT = "hb-rutina";

export const defaultRoutine = () => ({
  rest: 30,
  steps: [
    { id: uid(), name: "Plancha", kind: "time", secs: 60 },
    { id: uid(), name: "Plancha lateral (izquierda)", kind: "time", secs: 60 },
    { id: uid(), name: "Plancha lateral (derecha)", kind: "time", secs: 60 },
    { id: uid(), name: "Flexiones", kind: "reps", reps: 20 }
  ]
});

/** Crea la rutina y su hábito automático si aún no existen. Se llama al arrancar. */
export function ensureRoutine(s) {
  if (!s.routine?.steps) s.routine = defaultRoutine();
  s.habits.routineLog ||= [];
  if (!s.habits.habits.some(h => h.id === ROUTINE_HABIT)) {
    s.habits.habits.push({ id: ROUTINE_HABIT, name: "Rutina diaria", unit: "vez", target: 1, step: 1, auto: "routine",
      frequency: { type: "daily" }, archived: false, createdAt: iso() });
  }
}

/** Duración aproximada en segundos (las repeticiones se cuentan como 40 s) */
export const routineSecs = r => r.steps.reduce((a, st) => a + (st.kind === "time" ? st.secs : 40), 0) + Math.max(0, r.steps.length - 1) * (r.rest || 0);

export const fmtClock = secs => { const s = Math.max(0, Math.ceil(secs)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
export const fmtDuration = secs => { const m = Math.round(secs / 60); return m < 1 ? `${Math.round(secs)} s` : `${m} min`; };
export const stepText = st => st.kind === "time" ? fmtClock(st.secs) : `${st.reps} rep.`;

/** Guarda que la has hecho hoy (o el día indicado) */
export function completeRoutine(s, { secs, date = iso() } = {}) {
  s.habits.routineLog ||= [];
  s.habits.routineLog.push({ id: uid(), date, at: new Date().toISOString(), secs: Math.round(secs || 0),
    steps: s.routine.steps.map(st => ({ name: st.name, kind: st.kind, secs: st.secs, reps: st.reps })) });
  setHabitValue(s, ROUTINE_HABIT, date, 1);
}

export const doneOn = (state, date) => (state.habits.routineLog || []).filter(l => l.date === date);

// ---------- Progresión semanal: cada lunes sube si la semana anterior la hiciste 5 de 7 días
export const PROGRESS_DAYS = 5;
const valOf = st => st.kind === "time" ? st.secs : st.reps;
const mondayOf = (today = iso()) => iso(weekStart(parseISO(today)));
/** Días distintos con la rutina hecha entre dos fechas (incluidas) */
const daysDone = (state, from, to) => new Set((state.habits.routineLog || []).filter(l => l.date >= from && l.date <= to).map(l => l.date)).size;

export const hasProgression = r => (r?.steps || []).some(st => st.inc > 0 && !(st.max > 0 && valOf(st) >= st.max));
/** ¿Falta evaluar esta semana? (para no tocar los datos si no hace falta) */
export const progressionDue = (state, today = iso()) => !!state.routine && state.routine.progress?.week !== mondayOf(today);

/** Muta el estado: evalúa la semana pasada y sube los ejercicios que toque. Devuelve los cambios hechos. */
export function applyProgression(s, today = iso()) {
  const r = s.routine;
  if (!r) return [];
  const ws = mondayOf(today);
  r.progress ||= {};
  if (r.progress.week === ws) return [];
  const first = !r.progress.week;          // primera vez: solo se marca la semana, sin subir
  r.progress.week = ws;
  if (first) return [];
  const prevStart = iso(addDays(parseISO(ws), -7)), prevEnd = iso(addDays(parseISO(ws), -1));
  const days = daysDone(s, prevStart, prevEnd);
  const changes = [];
  if (days >= PROGRESS_DAYS) {
    for (const st of r.steps) {
      if (!(st.inc > 0)) continue;
      const from = valOf(st);
      const to = st.max > 0 ? Math.min(st.max, from + st.inc) : from + st.inc;
      if (to <= from) continue;
      if (st.kind === "time") st.secs = to; else st.reps = to;
      changes.push({ id: st.id, name: st.name, kind: st.kind, from, to });
    }
  }
  r.progress.last = { week: ws, days, changes };
  return changes;
}

/** Deshace la subida de esta semana (no vuelve a aplicarse hasta el lunes siguiente) */
export function undoProgression(s) {
  const last = s.routine?.progress?.last;
  if (!last?.changes?.length) return false;
  for (const c of last.changes) {
    const st = s.routine.steps.find(x => x.id === c.id);
    if (!st) continue;
    if (st.kind === "time") st.secs = c.from; else st.reps = c.from;
  }
  last.changes = []; last.undone = true;
  return true;
}

/** Cómo va esta semana: días hechos y si el lunes subirá */
export function weekProgress(state, today = iso()) {
  const ws = mondayOf(today);
  const days = daysDone(state, ws, iso(addDays(parseISO(ws), 6)));
  return { days, need: PROGRESS_DAYS, ok: days >= PROGRESS_DAYS, left: Math.max(0, PROGRESS_DAYS - days) };
}
