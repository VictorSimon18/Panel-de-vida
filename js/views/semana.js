// Resúmenes de la semana y del mes: tarjetas en el Resumen (los lunes y a principios de mes)
// y pantalla «Semanas y meses» para ver cualquiera de los anteriores.

import { esc, int, money } from "../ui.js";
import { icon } from "../icons.js";
import { update } from "../state.js";
import { iso, addDays, parseISO, isoWeekday } from "../stats.js";
import { homeBtn } from "./area.js";
import { weekSummary, weekHasData, lastWeekStart, monthRecap, monthHasData, lastMonth, shiftYm } from "../trends.js";
import { catLabel } from "../finance.js";
import { entryRow, viewEntry } from "./diario.js";

// ws: semana visible (lunes AAAA-MM-DD; null = la pasada) · ym: mes visible (null = el pasado) · mode: qué se ve
const ui = { ws: null, ym: null, mode: "semana" };
/** Abrir la pantalla directamente en los meses (desde la tarjeta del Resumen) */
export const showMonths = () => { ui.mode = "mes"; ui.ym = null; };
const monthName = ym => { const [y, m] = ym.split("-").map(Number); const t = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(new Date(y, m - 1, 1)); return t[0].toUpperCase() + t.slice(1); };
const tile = (label, value, sub = "", color = "") => `<div class="wk-tile"><small>${label}</small><b class="num"${color ? ` style="color:${color}"` : ""}>${value}</b>${sub}</div>`;
const sub = t => `<small class="wk-vs">${t}</small>`;
const num1 = n => new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(n);
const hours = min => `${num1(Math.round(min / 6) / 10)} h`;
const dm = s => new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(parseISO(s)).replace(".", "");
export const weekRange = w => `${dm(w.start)} – ${dm(w.end)}`;

/** Comparación con la semana anterior. good: "down" si bajar es bueno (gasto) */
function vs(cur, prev, good = "up") {
  if (!prev && !cur) return "";
  if (!prev) return `<small class="wk-vs">la anterior: 0</small>`;
  const pct = Math.round((cur - prev) / prev * 100);
  if (!pct) return `<small class="wk-vs">igual que la anterior</small>`;
  const ok = good === "up" ? pct > 0 : pct < 0;
  return `<small class="wk-vs" style="color:${ok ? "var(--fin)" : "var(--agenda)"}">${pct > 0 ? "+" : "−"}${Math.abs(pct)} % vs anterior</small>`;
}

/** Cuadrícula con los datos de una semana */
export function weekGrid(w) {
  const wd = w.weightDelta;
  return `<div class="wk-grid">
    ${tile("Gasto", money(w.spend), vs(w.spend, w.spendPrev, "down"), "var(--fin)")}
    ${tile("Fútbol", w.matches ? `${w.matches} ${w.matches === 1 ? "partido" : "partidos"}` : "—", w.matches ? `<small class="wk-vs">${w.goals} ${w.goals === 1 ? "gol" : "goles"} · ${w.assists} asist.${w.V + w.E + w.D ? ` · ${w.V}V ${w.E}E ${w.D}D` : ""}</small>` : "", "var(--fut)")}
    ${tile("Entrenos", String(w.gym + w.futbolTrain), `<small class="wk-vs">${w.gym} gimnasio · ${w.futbolTrain} fútbol</small>`, "var(--hab)")}
    ${tile("Pasos", w.steps != null ? int(w.steps) : "—", w.steps != null ? `<small class="wk-vs">media de ${w.stepDays} ${w.stepDays === 1 ? "día" : "días"}</small>` : "", "var(--hab)")}
    ${tile("Hábitos", w.habitTracked ? `${w.habitDays}/${w.habitTracked}` : "—", `<small class="wk-vs">días con todos cumplidos</small>`, "var(--hab)")}
    ${tile("Calorías", w.kcal != null ? `${int(w.kcal)} kcal` : "—", w.kcal != null ? `<small class="wk-vs">media de ${w.kcalDays} ${w.kcalDays === 1 ? "día" : "días"}${w.protein != null ? ` · ${int(w.protein)} g proteína` : ""}</small>` : "", "var(--agenda)")}
    ${tile("Peso", w.weight != null ? `${num1(w.weight)} kg` : "—", wd != null ? `<small class="wk-vs" style="color:${wd < -0.04 ? "var(--fin)" : wd > 0.04 ? "var(--agenda)" : ""}">${wd > 0.04 ? "+" : wd < -0.04 ? "−" : "±"}${num1(Math.abs(Math.round(wd * 10) / 10))} kg en la semana</small>` : "")}
    ${tile("Tareas", String(w.tasksDone), `<small class="wk-vs">hechas</small>`, "var(--agenda)")}
  </div>`;
}

/** Tarjeta del lunes en el Resumen (la semana pasada), hasta que se cierra */
export function weeklyBanner(state, today = iso()) {
  if (isoWeekday(parseISO(today)) !== 1) return "";
  const ws = lastWeekStart(today);
  if (state.settings.weeklySeen === ws) return "";
  const w = weekSummary(state, ws);
  if (!weekHasData(w)) return "";
  return `<section class="card weekly" aria-label="Resumen de la semana pasada">
    <h2 class="card-h"><span class="h-dot" style="--c:var(--cyan)"></span>Tu semana pasada<span class="spacer"></span><small class="muted">${weekRange(w)}</small></h2>
    ${weekGrid(w)}
    <div class="btn-row" style="margin-top:12px">
      <button class="btn" type="button" data-act="weekly-close" data-ws="${ws}">Cerrar</button>
      <a class="btn primary" href="#semana">Ver semanas</a>
    </div>
  </section>`;
}

// ---------- Mes
/** Cuadrícula con los datos de un mes, más el mejor día y el mayor gasto */
export function monthGrid(state, r) {
  const wd = r.weightDelta;
  const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;
  return `<div class="wk-grid">
    ${tile("Gasto", money(r.spend), vs(r.spend, r.spendPrev, "down").replace("vs anterior", "vs mes anterior").replace("la anterior", "el anterior"), "var(--fin)")}
    ${tile(r.net >= 0 ? "Ahorro" : "Balance", `${r.net > 0 ? "+" : ""}${money(r.net)}`, sub(`ingresos ${money(r.income)}`), r.net >= 0 ? "var(--fin)" : "var(--hab)")}
    ${tile("Fútbol", r.matches ? plural(r.matches, "partido", "partidos") : "—", r.matches ? sub(`${plural(r.goals, "gol", "goles")} · ${r.assists} asist.${r.V + r.E + r.D ? ` · ${r.V}V ${r.E}E ${r.D}D` : ""}${r.rating != null ? ` · nota ${num1(r.rating)}` : ""}`) : "", "var(--fut)")}
    ${tile("Entrenos", String(r.gym + r.futbolTrain), sub(`${r.gym} gimnasio · ${r.futbolTrain} fútbol`), "var(--hab)")}
    ${tile("Rutina", `${r.routineDays}/${r.daysCount}`, sub("días hecha"), "var(--hab)")}
    ${tile("Hábitos", r.habitTracked ? `${r.habitDays}/${r.habitTracked}` : "—", sub("días con todos cumplidos"), "var(--hab)")}
    ${tile("Pasos", r.steps != null ? int(r.steps) : "—", r.steps != null ? sub(`media de ${plural(r.stepDays, "día", "días")}`) : "", "var(--hab)")}
    ${tile("Calorías", r.kcal != null ? `${int(r.kcal)} kcal` : "—", r.kcal != null ? sub(`media de ${plural(r.kcalDays, "día", "días")}${r.protein != null ? ` · ${int(r.protein)} g proteína` : ""}`) : "", "var(--agenda)")}
    ${tile("Peso", r.weight != null ? `${num1(r.weight)} kg` : "—", wd != null ? `<small class="wk-vs" style="color:${wd < -0.04 ? "var(--fin)" : wd > 0.04 ? "var(--agenda)" : ""}">${wd > 0.04 ? "+" : wd < -0.04 ? "−" : "±"}${num1(Math.abs(Math.round(wd * 10) / 10))} kg en el mes</small>` : "")}
    ${tile("Tareas", String(r.tasksDone), sub("hechas"), "var(--agenda)")}
    ${tile("Diario", String(r.diaryDays), sub(r.diaryDays === 1 ? "día escrito" : "días escritos"), "var(--cyan)")}
    ${r.top ? tile("Mayor gasto", money(-r.top.amount), sub(esc(r.top.note || catLabel(state, r.top.categoryId).split(" › ").pop())), "var(--fg)") : ""}
  </div>
  ${r.best ? `<div class="diary-mem"><small>Tu mejor día</small>${entryRow(state, r.best)}</div>` : ""}`;
}

/** Tarjeta de los 3 primeros días del mes en el Resumen (el mes pasado), hasta que se cierra */
export function monthlyBanner(state, today = iso()) {
  if (Number(today.slice(8, 10)) > 3) return "";
  const ym = lastMonth(today);
  if (state.settings.monthlySeen === ym) return "";
  const r = monthRecap(state, ym, today);
  if (!monthHasData(r)) return "";
  return `<section class="card weekly" aria-label="Resumen del mes pasado">
    <h2 class="card-h"><span class="h-dot" style="--c:var(--cyan)"></span>Tu mes pasado<span class="spacer"></span><small class="muted">${monthName(ym)}</small></h2>
    ${monthGrid(state, r)}
    <div class="btn-row" style="margin-top:12px">
      <button class="btn" type="button" data-act="monthly-close" data-ym="${ym}">Cerrar</button>
      <a class="btn primary" href="#semana" data-act="open-months">Ver meses</a>
    </div>
  </section>`;
}
export const closeMonthly = ym => update(s => { s.settings.monthlySeen = ym; });

/** Al cerrar la tarjeta: no volver a mostrarla esta semana (se guarda y se sincroniza) */
export const closeWeekly = ws => update(s => { s.settings.weeklySeen = ws; });

// ---------- Pantalla «Semanas»
export function render(state) {
  const today = iso();
  const head = `
    <header class="topbar">
      ${homeBtn()}
      <h1 class="page-h">Semanas y meses</h1>
    </header>
    <div class="chips" role="tablist">
      <button type="button" role="tab" class="chip" data-act="mode" data-mode="semana" aria-selected="${ui.mode === "semana"}">Semana</button>
      <button type="button" role="tab" class="chip" data-act="mode" data-mode="mes" aria-selected="${ui.mode === "mes"}">Mes</button>
    </div>`;
  if (ui.mode === "mes") {
    const ym = ui.ym || lastMonth(today);
    const r = monthRecap(state, ym, today);
    return `${head}
    <section class="card">
      <div class="month-nav" style="margin-top:0">
        <button class="icon-btn" type="button" data-act="mo" data-n="-1" aria-label="Mes anterior">${icon.back}</button>
        <b>${monthName(ym)}<small class="muted" style="display:block;font-weight:500">${r.current ? "en curso" : ym === lastMonth(today) ? "mes pasado" : ""}</small></b>
        <button class="icon-btn" type="button" data-act="mo" data-n="1" aria-label="Mes siguiente"${r.current ? " disabled" : ""}>${icon.chevron}</button>
      </div>
      ${monthHasData(r) ? monthGrid(state, r) : `<div class="empty">No hay nada apuntado este mes.</div>`}
      ${r.current ? `<p class="hint">El mes aún no ha terminado: los datos cambiarán hasta el último día.</p>` : ""}
    </section>`;
  }
  const ws = ui.ws || lastWeekStart(today);
  const w = weekSummary(state, ws);
  const isCurrent = ws > lastWeekStart(today);
  const label = isCurrent ? "Esta semana (en curso)" : ws === lastWeekStart(today) ? "Semana pasada" : `Semana del ${dm(ws)}`;
  return `${head}
    <section class="card">
      <div class="month-nav" style="margin-top:0">
        <button class="icon-btn" type="button" data-act="wk" data-n="-1" aria-label="Semana anterior">${icon.back}</button>
        <b>${esc(label)}<small class="muted" style="display:block;font-weight:500">${weekRange(w)}</small></b>
        <button class="icon-btn" type="button" data-act="wk" data-n="1" aria-label="Semana siguiente"${isCurrent ? " disabled" : ""}>${icon.chevron}</button>
      </div>
      ${weekHasData(w) ? weekGrid(w) : `<div class="empty">No hay nada apuntado esta semana.</div>`}
      ${isCurrent ? `<p class="hint">La semana aún no ha terminado: los datos cambiarán hasta el domingo.</p>` : ""}
    </section>`;
}

export function mount(root, _state, signal) {
  root.addEventListener("click", e => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const rerender = () => window.dispatchEvent(new Event("pv:render"));
    switch (b.dataset.act) {
      case "mode": ui.mode = b.dataset.mode; rerender(); break;
      case "wk": ui.ws = iso(addDays(parseISO(ui.ws || lastWeekStart()), 7 * Number(b.dataset.n))); rerender(); break;
      case "mo": ui.ym = shiftYm(ui.ym || lastMonth(), Number(b.dataset.n)); rerender(); break;
      case "view-entry": viewEntry(b.dataset.date); break;
    }
  }, { signal });
}
