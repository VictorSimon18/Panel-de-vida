// Fútbol: temporadas (agosto a julio), partidos con estadísticas, entrenos, rachas y récords.
// Se guardan en habits.workouts con type "futbol" (así siguen contando para el hábito automático de fútbol):
//   entreno: { id, date, type: "futbol", kind: "entrenamiento", minutes, note }
//   partido: { id, date, type: "futbol", kind: "partido", minutes, note,
//              rival, venue: "local"|"visitante", comp, gf, ga, goals, assists, starter, yellow, red, position, rating }
// Los campos del partido son opcionales (los partidos antiguos solo tienen minutos).

// Equipos: cada partido y entreno lleva `team`. null en los filtros = los dos juntos.
export const TEAMS = { sporting: "Sporting Pradillano", fenix: "Fénix de Azara" };
export const TEAM_SHORT = { sporting: "Sporting", fenix: "Fénix" };
export const DEFAULT_TEAM = "sporting";

export const COMPS = { liga: "Liga", copa: "Copa", torneo: "Torneo", amistoso: "Amistoso" };
export const POSITIONS = {
  por: "Portero", dfc: "Defensa central", lat: "Lateral", mcd: "Pivote", mc: "Mediocentro",
  mco: "Mediapunta", ext: "Extremo", dc: "Delantero"
};
export const RESULT = { V: "Victoria", E: "Empate", D: "Derrota" };
export const RESULT_COLOR = { V: "var(--fin)", E: "var(--muted)", D: "var(--danger)" };

// ---------- Temporadas: la 2026/27 va del 1 de agosto de 2026 al 31 de julio de 2027
export const seasonOf = date => { const y = Number(date.slice(0, 4)), m = Number(date.slice(5, 7)); return m >= 8 ? y : y - 1; };
export const seasonLabel = y => `${y}/${String((y + 1) % 100).padStart(2, "0")}`;
export const seasonRange = y => [`${y}-08-01`, `${y + 1}-07-31`];

const all = state => state.habits.workouts.filter(w => w.type === "futbol").sort((a, b) => a.date.localeCompare(b.date));
const inTeam = (w, team) => !team || (w.team || DEFAULT_TEAM) === team;
export const matchesOf = (state, season = null, team = null) => all(state).filter(w => w.kind === "partido" && inTeam(w, team) && (season == null || seasonOf(w.date) === season));
export const trainingsOf = (state, season = null, team = null) => all(state).filter(w => w.kind !== "partido" && inTeam(w, team) && (season == null || seasonOf(w.date) === season));

/** Temporadas con algo apuntado, más la actual, de la más reciente a la más antigua */
export function seasons(state, today, team = null) {
  const set = new Set(all(state).filter(w => inTeam(w, team)).map(w => seasonOf(w.date)));
  set.add(seasonOf(today));
  return [...set].sort((a, b) => b - a);
}

/** "V" | "E" | "D" | null (sin marcador) */
export const resultOf = m => m.gf == null || m.ga == null ? null : m.gf > m.ga ? "V" : m.gf < m.ga ? "D" : "E";

const n = v => Number(v) || 0;
const mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : null;

/** Rachas en una lista de partidos ordenada por fecha: actual (hasta el último) y mejor */
function runs(list, ok) {
  let cur = 0, best = 0;
  for (const m of list) { if (ok(m)) best = Math.max(best, ++cur); else cur = 0; }
  return { current: cur, best };
}

/** Estadísticas de una lista de partidos (de una temporada o de todas) */
export function matchStats(list) {
  const res = list.map(resultOf);
  const withRes = list.filter(m => resultOf(m));
  const rated = list.map(m => m.rating).filter(v => v > 0);
  const goals = list.reduce((s, m) => s + n(m.goals), 0), assists = list.reduce((s, m) => s + n(m.assists), 0);
  const minutes = list.reduce((s, m) => s + n(m.minutes), 0);
  return {
    played: list.length,
    V: res.filter(r => r === "V").length, E: res.filter(r => r === "E").length, D: res.filter(r => r === "D").length,
    gf: withRes.reduce((s, m) => s + n(m.gf), 0), ga: withRes.reduce((s, m) => s + n(m.ga), 0),
    goals, assists, minutes,
    starts: list.filter(m => m.starter === true).length, startsKnown: list.filter(m => m.starter != null).length,
    yellow: list.reduce((s, m) => s + n(m.yellow), 0), red: list.filter(m => m.red).length,
    rating: mean(rated), rated: rated.length,
    minPerGoal: goals ? Math.round(minutes / goals) : null,
    scoring: runs(list, m => n(m.goals) > 0),
    unbeaten: runs(withRes, m => resultOf(m) !== "D"),
    wins: runs(withRes, m => resultOf(m) === "V"),
    last5: list.slice(-5).map(m => ({ id: m.id, r: resultOf(m) })).reverse()
  };
}

/** Goles y asistencias por mes de una temporada (agosto → julio), hasta el mes actual */
export function seasonMonths(state, season, today) {
  const list = matchesOf(state, season);
  const out = [];
  for (let i = 0; i < 12; i++) {
    const y = season + (i >= 5 ? 1 : 0), m = ((7 + i) % 12) + 1;
    const ym = `${y}-${String(m).padStart(2, "0")}`;
    if (ym > today.slice(0, 7)) break;
    const ms = list.filter(x => x.date.startsWith(ym));
    out.push({ ym, label: new Intl.DateTimeFormat("es-ES", { month: "short" }).format(new Date(y, m - 1, 1)).replace(".", ""),
      goals: ms.reduce((s, x) => s + n(x.goals), 0), assists: ms.reduce((s, x) => s + n(x.assists), 0), played: ms.length });
  }
  return out;
}

/** Estadísticas agrupadas por un campo (competición o posición) */
export function groupBy(list, key, labels) {
  const map = new Map();
  for (const m of list) { const k = m[key] || "-"; if (!map.has(k)) map.set(k, []); map.get(k).push(m); }
  return [...map.entries()].map(([k, ms]) => ({ key: k, label: labels[k] || "Sin indicar", ...matchStats(ms) })).sort((a, b) => b.played - a.played);
}

/** Récords de todos los tiempos */
export function records(state, team = null) {
  const list = matchesOf(state, null, team);
  const top = (f, ok = () => true) => list.filter(ok).reduce((b, m) => (f(m) > (b ? f(b) : -Infinity) ? m : b), null);
  const mostGoals = top(m => n(m.goals), m => n(m.goals) > 0);
  const mostAssists = top(m => n(m.assists), m => n(m.assists) > 0);
  const bestRating = top(m => n(m.rating), m => m.rating > 0);
  const bigWin = top(m => n(m.gf) - n(m.ga), m => resultOf(m) === "V");
  const s = matchStats(list);
  return { mostGoals, mostAssists, bestRating, bigWin, total: s, hatTricks: list.filter(m => n(m.goals) >= 3).length };
}

/** Lo del último partido para rellenar el siguiente (competición, posición, titular) */
export function lastMatchDefaults(state, team = null) {
  const m = matchesOf(state, null, team).at(-1);
  return { comp: m?.comp || "liga", position: m?.position || "", starter: m?.starter ?? true, team: team || m?.team || DEFAULT_TEAM };
}
