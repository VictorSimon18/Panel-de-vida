// Pasos (de Salud, a través de los Atajos): hoy frente al objetivo, medias, gráfica, racha y meses.
// Los pasos se guardan como el hábito automático «Pasos»; la distancia y las calorías activas en habits.activity.

import { update } from "../state.js";
import { esc, int, openSheet, closeSheet, toast } from "../ui.js";
import { iso, addDays, parseISO } from "../stats.js";
import { field } from "../forms.js";
import { ring, stackChart } from "../charts.js";
import { habitValue, streaks } from "../habits.js";
import { STEPS_HABIT_ID } from "../inbox.js";

const km1 = n => `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(n)} km`;
const time = ts => new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(new Date(ts));
const mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : null;
const dayName = s => { const t = new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric", month: "short" }).format(parseISO(s)).replace(/\./g, ""); return t[0].toUpperCase() + t.slice(1); };

export function pasosTab(state) {
  const h = state.habits.habits.find(x => x.id === STEPS_HABIT_ID);
  if (!h) return `<section class="card">
    <h2 class="card-h">Pasos</h2>
    <div class="empty">Aún no han llegado pasos de Salud.<br>Añade los pasos al atajo <b>Nutrición al Panel</b>: <a href="#ajustes">Ajustes → Siri y Salud → Cómo crear los Atajos</a> (apartado 8).</div>
  </section>`;

  const today = iso();
  const goal = h.target || 10000;
  const steps = d => habitValue(state, h, d);
  const act = new Map((state.habits.activity || []).map(a => [a.date, a]));
  const logged = new Set(state.habits.logs.filter(l => l.habitId === h.id).map(l => l.date));
  const t = steps(today), ta = act.get(today);
  const lastAt = ta?.at;

  // días ya terminados con dato
  const past = n => Array.from({ length: n }, (_, i) => iso(addDays(parseISO(today), -(i + 1)))).filter(d => logged.has(d));
  const avg7 = mean(past(7).map(steps)), avg30 = mean(past(30).map(steps));
  const hit30 = past(30).filter(d => steps(d) >= goal).length, tot30 = past(30).length;
  const st = streaks(state, h);
  const all = [...logged].map(d => [d, steps(d)]).sort((a, b) => b[1] - a[1]);
  const best = all[0];

  const hoy = `<section class="card">
    <h2 class="card-h"><span class="h-dot" style="--c:var(--hab)"></span>Hoy<span class="spacer"></span>${lastAt ? `<small class="muted">Salud · ${time(lastAt)}</small>` : ""}<button class="btn small" type="button" data-act="steps-goal">Objetivo</button></h2>
    <div class="nutri-hero">
      ${ring(Math.min(100, t / goal * 100), t >= goal ? "#7fcf9b" : "#e88fb4", { size: 76, stroke: 7, label: `${Math.round(t / goal * 100)}%` })}
      <div class="t"><b class="num">${int(t)} pasos</b><small>${t >= goal ? `de ${int(goal)} · <b class="ok">objetivo cumplido</b>` : `de ${int(goal)} · te faltan <b>${int(goal - t)}</b>`}</small></div>
    </div>
    <div class="week-stats">
      <div><b class="num">${ta?.km != null ? km1(ta.km) : "—"}</b><small>distancia</small></div>
      <div><b class="num" style="color:var(--agenda)">${ta?.active != null ? `${int(ta.active)} kcal` : "—"}</b><small>calorías activas</small></div>
      <div><b class="num" style="color:var(--hab)">${st.current}</b><small>${st.current === 1 ? "día" : "días"} de racha</small></div>
    </div>
    ${!logged.has(today) ? `<p class="hint">Hoy aún no han llegado pasos. Se actualizan con el atajo a las 14:00, 18:00 y 23:45.</p>` : ""}
  </section>`;

  const days = Array.from({ length: 14 }, (_, i) => iso(addDays(parseISO(today), i - 13)));
  const evo = `<section class="card">
    <h2 class="card-h">Últimos 14 días</h2>
    <div class="week-stats">
      <div><b class="num">${avg7 != null ? int(avg7) : "—"}</b><small>media 7 días</small></div>
      <div><b class="num">${avg30 != null ? int(avg30) : "—"}</b><small>media 30 días</small></div>
      <div><b class="num" style="color:var(--fin)">${tot30 ? `${hit30}/${tot30}` : "—"}</b><small>días con objetivo (30)</small></div>
    </div>
    ${stackChart(days.map((d, i) => ({ label: String(parseISO(d).getDate()), values: [steps(d)], highlight: i === 13 })), { colors: ["#e88fb4"], unit: "pasos", labelEvery: 2, goal })}
    <div class="legend"><span style="--c:var(--hab)">Pasos al día</span><span style="--c:#ececee">Objetivo ${int(goal)}</span></div>
    <div class="list" style="margin-top:8px">
      ${best ? `<div class="kv"><span>Mejor día</span><span class="num">${int(best[1])} pasos · ${dayName(best[0])}</span></div>` : ""}
      <div class="kv"><span>Mejor racha</span><span class="num">${st.best} ${st.best === 1 ? "día" : "días"}</span></div>
    </div>
  </section>`;

  // meses (los 6 últimos con datos)
  const months = new Map();
  for (const d of logged) {
    const ym = d.slice(0, 7);
    if (!months.has(ym)) months.set(ym, { days: 0, steps: 0, km: 0, hit: 0 });
    const m = months.get(ym);
    m.days++; m.steps += steps(d); m.km += act.get(d)?.km || 0; if (steps(d) >= goal) m.hit++;
  }
  const mlist = [...months.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);
  const mName = ym => { const [y, m] = ym.split("-").map(Number); const s = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(new Date(y, m - 1, 1)); return s[0].toUpperCase() + s.slice(1); };
  const meses = mlist.length ? `<section class="card">
    <h2 class="card-h">Por meses</h2>
    <div class="list">${mlist.map(([ym, m]) => `
      <div class="item"><span class="t">${mName(ym)}<small>${m.days} ${m.days === 1 ? "día" : "días"} · objetivo ${m.hit} ${m.hit === 1 ? "vez" : "veces"}${m.km ? ` · ${km1(m.km)}` : ""}</small></span>
      <b class="num">${int(m.steps / m.days)}<small class="muted" style="font-weight:500"> /día</small></b></div>`).join("")}</div>
  </section>` : "";

  return hoy + evo + meses;
}

/** Cambiar el objetivo diario de pasos (es el objetivo del hábito «Pasos») */
export function openStepsGoal(state) {
  const h = state.habits.habits.find(x => x.id === STEPS_HABIT_ID);
  if (!h) return;
  const sheet = openSheet(`
    <h2>Objetivo de pasos</h2>
    <form id="sg-form">
      ${field("Pasos al día", "sg-goal", `<input class="input" id="sg-goal" type="number" inputmode="numeric" min="1000" max="100000" step="500" value="${esc(h.target || 10000)}">`)}
      <p class="hint">Es el objetivo del hábito <b>Pasos</b>: cuenta para la racha y la XP.</p>
      <div class="btn-row"><button class="btn" type="button" data-close>Cancelar</button><button class="btn primary" type="submit">Guardar</button></div>
    </form>`);
  sheet.querySelector("#sg-form").addEventListener("submit", e => {
    e.preventDefault();
    const v = Math.round(Number(sheet.querySelector("#sg-goal").value));
    if (!(v >= 100)) { toast("Pon un número de pasos válido", { error: true }); return; }
    update(s => { const x = s.habits.habits.find(y => y.id === STEPS_HABIT_ID); if (x) { x.target = v; x.step = Math.max(500, Math.round(v / 10 / 500) * 500); } });
    closeSheet();
    toast("Objetivo guardado");
  });
}
