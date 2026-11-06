// Rutina diaria con cronómetro (plancha, flexiones…): ejercicios por tiempo o por repeticiones,
// con descanso entre ellos. Al terminarla se marca sola el hábito «Rutina diaria» (auto "routine").
// state.routine:            { rest: segundos, steps: [{ id, name, kind: "time"|"reps", secs?, reps? }] }
// state.habits.routineLog:  [{ id, date, at, secs, steps }]  (cada vez que la terminas)

import { uid } from "./ui.js";
import { iso } from "./stats.js";
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
