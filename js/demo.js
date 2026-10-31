// Datos de ejemplo para ver el panel "vivo" antes de apuntar nada.
// Se generan alrededor de la fecha actual. Se cargan y se quitan desde Ajustes.

import { defaultState } from "./state.js";
import { iso, addDays, weekStart } from "./stats.js";
import { defaultCategories } from "./finance.js";

// Aleatorio reproducible: siempre salen los mismos datos
function rng(seed = 7) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

export function buildDemo(alias) {
  const s = defaultState();
  s.profile.alias = alias;
  s.settings.demo = true;
  s.settings.lastBackupAt = new Date().toISOString();
  const r = rng();
  const now = new Date();
  const today = iso(now);
  const d = n => iso(addDays(now, n));
  const month = today.slice(0, 7);
  let id = 0;
  const nid = p => `${p}${++id}`;

  // ---- Finanzas
  s.finance.accounts = [
    { id: "acc-banco", name: "Banco", type: "banco", initial: 980 },
    { id: "acc-efectivo", name: "Efectivo", type: "efectivo", initial: 120 },
    { id: "acc-ahorro", name: "Ahorro", type: "ahorro", initial: 1400 }
  ];
  s.finance.categories = defaultCategories();
  const tx = (date, amount, categoryId, note, accountId = "acc-banco") =>
    s.finance.transactions.push({ id: nid("tx"), date, amount, accountId, categoryId, note });
  for (let k = 5; k >= 1; k--) {
    const m0 = iso(new Date(now.getFullYear(), now.getMonth() - k, 1)).slice(0, 7);
    tx(`${m0}-01`, 1850, "c-nomina", "Nómina");
    tx(`${m0}-01`, -650, "c-casa-alquiler-o-hipoteca", "Alquiler");
    tx(`${m0}-12`, -Math.round((520 + r() * 420) * 100) / 100, "c-comida-supermercado", "Compras del mes");
    tx(`${m0}-20`, -Math.round((80 + r() * 160) * 100) / 100, "c-ocio-salidas", "Ocio");
  }
  tx(`${month}-01`, 1850, "c-nomina", "Nómina");
  tx(`${month}-01`, -650, "c-casa-alquiler-o-hipoteca", "Alquiler");
  for (let i = 0; i < 14; i++) {
    const day = d(-Math.floor(r() * Math.min(now.getDate() - 1, 27)));
    const pick = r();
    if (pick < .45) tx(day, -Math.round((18 + r() * 55) * 100) / 100, "c-comida-supermercado", "Supermercado");
    else if (pick < .7) tx(day, -Math.round((9 + r() * 30) * 100) / 100, "c-comida-restaurantes", "Cena fuera", "acc-efectivo");
    else if (pick < .85) tx(day, -Math.round((5 + r() * 20) * 100) / 100, "c-transporte-combustible", "Gasolina");
    else tx(day, -Math.round((10 + r() * 40) * 100) / 100, "c-ocio-salidas", "Ocio");
  }
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nm = (day) => iso(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), day));
  s.finance.recurring = [
    { id: "rec-alquiler", name: "Alquiler", amount: -650, accountId: "acc-banco", categoryId: "c-casa-alquiler-o-hipoteca", every: "month", nextDate: nm(1), day: 1 },
    { id: "rec-netflix", name: "Netflix", amount: -12.99, accountId: "acc-banco", categoryId: "c-subs-streaming", every: "month", nextDate: nm(3), day: 3 },
    { id: "rec-gym", name: "Gimnasio", amount: -39.9, accountId: "acc-banco", categoryId: "c-deporte-gimnasio", every: "month", nextDate: nm(5), day: 5 }
  ];
  s.finance.transactions.push(
    { id: nid("tx"), date: d(-3), amount: -200, accountId: "acc-banco", categoryId: null, note: "Ahorro del mes", transferId: "trf1" },
    { id: nid("tx"), date: d(-3), amount: 200, accountId: "acc-ahorro", categoryId: null, note: "Ahorro del mes", transferId: "trf1" });
  s.finance.goals = [{ id: "goal-viaje", name: "Viaje a Japón", target: 3000, saved: 1400, deadline: iso(new Date(now.getFullYear() + 1, 6, 1)), history: [] },
    { id: "goal-colchon", name: "Fondo de emergencia", target: 2000, saved: 650, deadline: null, history: [] }];

  // ---- Trabajo y estudios (últimos 13 días)
  s.work.projects = [
    { id: "prj-informe", name: "Informe trimestral", kind: "trabajo", milestones: [] },
    { id: "prj-sql", name: "Curso de SQL", kind: "estudio", milestones: [] }
  ];
  for (let i = 13; i >= 0; i--) {
    const day = addDays(now, -i), wd = (day.getDay() + 6) % 7;
    if (wd < 5) s.work.entries.push({ id: nid("w"), date: iso(day), minutes: Math.round((300 + r() * 180) / 15) * 15, projectId: "prj-informe", kind: "trabajo" });
    if (r() < .6) s.work.entries.push({ id: nid("w"), date: iso(day), minutes: Math.round((30 + r() * 90) / 15) * 15, projectId: "prj-sql", kind: "estudio" });
  }
  s.work.learning = [{ id: "lrn-sql", name: "Curso de SQL", type: "curso", done: 12, total: 40, unit: "lecciones" }];

  // ---- Hábitos (últimos 21 días; hoy a medias)
  s.habits.habits = [
    { id: "hb-agua", name: "Agua", unit: "L", target: 2, frequency: { type: "daily" } },
    { id: "hb-leer", name: "Leer", unit: "págs.", target: 20, frequency: { type: "daily" } },
    { id: "hb-gym", name: "Gimnasio", unit: "sesión", target: 1, frequency: { type: "weekly", times: 4 } },
    { id: "hb-medit", name: "Meditar", unit: "min", target: 10, frequency: { type: "days", days: [1, 3, 5] } }
  ];
  for (let i = 21; i >= 1; i--) {
    const day = d(-i);
    s.habits.logs.push({ id: nid("l"), habitId: "hb-agua", date: day, value: r() < .85 ? 2 : 1.5 });
    if (r() < .75) s.habits.logs.push({ id: nid("l"), habitId: "hb-leer", date: day, value: 20 + Math.round(r() * 10) });
  }
  s.habits.logs.push({ id: nid("l"), habitId: "hb-agua", date: today, value: 1.5 });
  s.habits.logs.push({ id: nid("l"), habitId: "hb-leer", date: today, value: 12 });

  const ws = weekStart(now);
  [0, 2].forEach(off => {
    const day = addDays(ws, off);
    if (iso(day) <= today) {
      s.habits.workouts.push({ id: nid("wo"), date: iso(day), type: "gym", minutes: 70, sets: [] });
      s.habits.logs.push({ id: nid("l"), habitId: "hb-gym", date: iso(day), value: 1 });
    }
  });
  s.habits.workouts.push({ id: nid("wo"), date: d(-5), type: "futbol", minutes: 90 });

  for (let i = 13; i >= 0; i--) {
    s.habits.sleep.push({ id: nid("s"), date: d(-i), hours: Math.round((6.2 + r() * 2.2) * 10) / 10, quality: 3 + Math.round(r() * 2) });
    s.habits.mood.push({ id: nid("m"), date: d(-i), value: 3 + Math.round(r() * 2) });
  }
  s.habits.body = [{ id: "bd1", date: d(-7), weight: 76.4 }, { id: "bd2", date: today, weight: 75.9 }];

  // ---- Agenda
  s.agenda.tasks = [
    { id: "tk1", title: "Entregar informe trimestral", due: today, time: "18:00", priority: "alta", tags: ["trabajo"], done: false },
    { id: "tk2", title: "Lección 13 del curso de SQL", due: today, priority: "media", tags: ["estudio"], done: false },
    { id: "tk3", title: "Pagar la cuota del equipo", due: d(-1), priority: "media", tags: ["fútbol"], done: false },
    { id: "tk4", title: "Comprar proteína", due: today, priority: "baja", tags: [], done: true, doneAt: new Date().toISOString() },
    { id: "tk5", title: "Revisar presupuesto de noviembre", due: d(2), priority: "media", tags: ["finanzas"], done: false }
  ];
  s.agenda.events = [
    { id: "ev1", title: "Fútbol 7 con el equipo", start: `${today}T20:30`, end: `${today}T22:00`, place: "Polideportivo" },
    { id: "ev2", title: "Cena con amigos", start: `${d(1)}T21:00`, place: "" }
  ];

  // ---- Juego (XP de ejemplo)
  s.game.areaXp = { fin: 520, work: 860, hab: 1240, ag: 380 };
  s.game.xp = 2340;
  return s;
}
