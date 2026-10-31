// Gamificación: niveles y títulos.
// Los valores de XP por acción y los logros se definen en la fase 7.

export const AREAS = {
  fin:  { key: "fin",  name: "Finanzas",           short: "Finanzas", color: "var(--fin)",    route: "finanzas" },
  work: { key: "work", name: "Trabajo y estudios", short: "Trabajo",  color: "var(--work)",   route: "trabajo" },
  hab:  { key: "hab",  name: "Hábitos y deporte",  short: "Hábitos",  color: "var(--hab)",    route: "habitos" },
  ag:   { key: "ag",   name: "Agenda y tareas",    short: "Agenda",   color: "var(--agenda)", route: "agenda" }
};

// XP necesaria para pasar del nivel n al n+1: 100, 150, 200, 250…
export const xpToNext = level => 100 + 50 * (level - 1);

export function levelFromXp(xp) {
  let level = 1, rest = xp;
  while (rest >= xpToNext(level)) { rest -= xpToNext(level); level++; }
  const need = xpToNext(level);
  return { level, into: rest, need, pct: Math.round((rest / need) * 100) };
}

const TITLES = [
  [1, "Novato"], [3, "Iniciado"], [5, "Runner"], [10, "Netrunner"],
  [15, "Operador"], [20, "Ciberninja"], [30, "Arquitecto"], [40, "Leyenda neón"]
];
export const titleFor = level => TITLES.filter(([l]) => level >= l).pop()[1];
