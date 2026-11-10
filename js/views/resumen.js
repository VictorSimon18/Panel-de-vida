// Pantalla de resumen (variante A · HUD compacto) conectada a los datos.

import { AREAS, levelFromXp, titleFor } from "../game.js";
import { esc, int, money as eur, longDate, monthName, toast, avatar } from "../ui.js";
import { icon } from "../icons.js";
import { backupDue } from "../backup.js";
import { update } from "../state.js";
import { todayItems, money, week, streak, iso, parseISO } from "../stats.js";
import { habitsToday, habitValue, setHabitValue, AUTO_LABEL } from "../habits.js";
import { toggleTask } from "../agenda.js";
import { weekChart, ring } from "../charts.js";
import { catColor, catLabel } from "../finance.js";
import { openTxForm } from "./finanzas-forms.js";
import { weeklyBanner, closeWeekly } from "./semana.js";
import { diaryCard, viewEntry, openEntryForm } from "./diario.js";

const PRI = { alta: ["Alta", "var(--danger)"], media: ["Media", "var(--agenda)"], baja: ["Baja", "var(--muted)"] };
const shortDate = s => new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(parseISO(s));
const num1 = n => new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1, useGrouping: "always" }).format(n);

const greeting = () => { const h = new Date().getHours(); return h < 6 ? "Buenas noches" : h < 14 ? "Buenos días" : h < 21 ? "Buenas tardes" : "Buenas noches"; };

export function render(state) {
  const g = state.game;
  const lv = levelFromXp(g.xp);
  const days = streak(state);

  return `
    <header class="desk-greeting">
      <h1>${greeting()}, ${esc(state.profile.alias)}<span>${longDate()}</span></h1>
      <div class="streak${days ? "" : " off"}" title="Días seguidos apuntando algo">${icon.flame}<span class="num">${days} ${days === 1 ? "día" : "días"}</span></div>
    </header>
    <header class="topbar">
      <a class="logo" href="#resumen" aria-label="Resumen">${avatar(state)}</a>
      <div class="who"><div class="hello">${greeting()},</div><div class="alias">${esc(state.profile.alias)}</div></div>
      <div class="streak${days ? "" : " off"}" title="Días seguidos apuntando algo">${icon.flame}<span class="num">${days}</span></div>
      <a class="icon-btn" href="#ajustes" aria-label="Ajustes">${icon.gear}</a>
    </header>

    ${banners(state)}
    ${weeklyBanner(state)}

    <div class="cols">
    <div class="col col-1">
    <section class="card hud" aria-label="Experiencia">
      <a class="hud-top" href="#logros" aria-label="Nivel ${lv.level}: ver logros">
        <span class="hud-ring">${ring(lv.pct, "#7cc4e4", { size: 68, stroke: 6 })}<b class="num">${lv.level}</b></span>
        <span class="hud-t">
          <small><em>${titleFor(lv.level)}</em> · ${(g.achievements || []).length} logros</small>
          <b class="num">${int(lv.into)} <i>/ ${int(lv.need)} XP</i></b>
          <small>Te faltan ${int(lv.need - lv.into)} XP para el nivel ${lv.level + 1}</small>
        </span>
        ${icon.chevron}
      </a>
      <div class="area-levels">${Object.values(AREAS).map(a => {
        const al = levelFromXp(g.areaXp[a.key] || 0);
        return `<a href="#${a.route}" style="--c:${a.color}"><span class="al-ico">${icon[a.key]}</span><div class="lbl">${a.short}</div><div class="lv">Nv. ${al.level}</div><div class="mini"><i style="width:${al.pct}%"></i></div></a>`;
      }).join("")}</div>
    </section>

    ${todayCard(state)}
    ${diaryCard(state)}
    </div>
    <div class="col col-2">
    ${habitsCard(state)}
    ${weekCard(state)}
    </div>
    <div class="col col-3">
    ${moneyCard(state)}
    </div>
    </div>`;
}

function banners(state) {
  let out = "";
  if (state.settings.demo) out += `
    <div class="banner" style="--c:var(--cyan)">${icon.sparkle}
      <div class="t"><b>Estás viendo datos de ejemplo</b>Quítalos en Ajustes cuando quieras empezar con los tuyos.</div>
      <a class="btn small" href="#ajustes">Ajustes</a>
    </div>`;
  else if (backupDue(state)) out += `
    <div class="banner" style="--c:var(--warn)">${icon.download}
      <div class="t"><b>Haz una copia de seguridad</b>${state.settings.lastBackupAt ? "Hace más de 7 días de la última." : "Todavía no has exportado ninguna."}</div>
      <a class="btn small" href="#ajustes">Copiar</a>
    </div>`;
  return out;
}

function todayCard(state) {
  const { pending, done, total } = todayItems(state);
  const header = `<h2 class="card-h"><span class="h-dot" style="--c:var(--agenda)"></span>Hoy · ${longDate()}<span class="spacer"></span>${total ? `<span class="count num">${done.length}/${total}</span>` : ""}<a href="#agenda">Agenda</a></h2>`;
  if (!total) return `<section class="card">${header}<div class="empty">Nada pendiente para hoy.<br>Pulsa <b>+</b> para añadir una tarea o un evento.</div></section>`;

  const row = it => {
    if (it.kind === "event") return `
      <div class="item"><span class="tick event">${icon.clock}</span>
        <div class="t">${esc(it.title)}<small>Evento${it.place ? ` · ${esc(it.place)}` : ""}</small></div>
        <span class="tag num" style="--c:var(--hab)">${it.time}</span></div>`;
    const [pl, pc] = PRI[it.priority] || PRI.media;
    return `
      <button class="item tap${it.done ? " is-done" : ""}" type="button" data-task="${it.id}" aria-pressed="${!!it.done}">
        <span class="tick" style="--c:${pc}">${icon.check}</span>
        <span class="t">${esc(it.title)}<small>${it.overdue ? `<span style="color:var(--danger)">Atrasada</span>` : "Tarea"}${it.time ? ` · antes de las ${it.time}` : ""}</small></span>
        ${it.done ? "" : `<span class="tag" style="--c:${pc}">${pl}</span>`}
      </button>`;
  };
  return `<section class="card">${header}<div class="list">${pending.map(row).join("")}${done.map(row).join("")}</div></section>`;
}

function habitsCard(state) {
  const list = habitsToday(state);
  const doneN = list.filter(h => h.done).length;
  const header = `<h2 class="card-h"><span class="h-dot" style="--c:var(--hab)"></span>Hábitos de hoy<span class="spacer"></span>${list.length ? `<span class="count num">${doneN}/${list.length}</span>` : ""}<a href="#habitos">Hábitos</a></h2>`;
  if (!state.habits.habits.length) return `<section class="card">${header}<div class="empty">Aún no tienes hábitos.<br>Los crearás en la sección <b>Hábitos</b>.</div></section>`;
  if (!list.length) return `<section class="card">${header}<div class="empty">Hoy no te toca ningún hábito. Día libre.</div></section>`;

  return `<section class="card">${header}<div class="list">${list.map(h => `
    <button class="item tap${h.done ? " is-done" : ""}" type="button" data-habit="${h.id}"${h.auto ? ` data-auto="${h.auto}"` : ""} aria-pressed="${h.done}">
      ${ring(h.pct, "#e88fb4", { size: 34, stroke: 4 })}
      <span class="t">${esc(h.name)}<small class="num">${num1(h.value)} / ${num1(h.target)} ${esc(h.unit)}${h.weekly ? ` · ${h.weekly.done}/${h.weekly.goal} esta semana` : ""}</small></span>
      <span class="tick" style="--c:var(--hab)">${icon.check}</span>
    </button>`).join("")}</div></section>`;
}

function moneyCard(state) {
  const m = money(state);
  const header = `<h2 class="card-h"><span class="h-dot" style="--c:var(--fin)"></span>Dinero<span class="spacer"></span><a href="#finanzas">Ver</a></h2>`;
  if (!m.hasAccounts) return `<section class="card">${header}<div class="money-big num">${eur(0)}</div><div class="empty">Crea tus cuentas en <b>Finanzas</b> para ver aquí el saldo y tus últimos movimientos.</div></section>`;
  const fin = state.finance;
  const accName = id => fin.accounts.find(a => a.id === id)?.name || "Cuenta borrada";
  // últimos movimientos (de una transferencia solo se muestra la salida)
  const last = fin.transactions.filter(t => !(t.transferId && t.amount > 0))
    .sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id))).slice(0, 5);
  const next = m.upcoming[0];
  return `<section class="card">${header}
    <div class="money-big num">${eur(m.total)}</div>
    <div class="money-sub">Saldo total de tus ${fin.accounts.length} ${fin.accounts.length === 1 ? "cuenta" : "cuentas"}</div>
    <div class="split">
      <div><small>Ingresado en ${monthName()}</small><b class="num pos">+${eur(m.income)}</b></div>
      <div><small>Gastado en ${monthName()}</small><b class="num neg">${eur(m.expense)}</b></div>
    </div>
    <h3 class="card-h" style="margin-top:14px">Últimos movimientos</h3>
    ${last.length ? `<div class="list tight">${last.map(t => t.transferId ? `
      <button class="item tap" type="button" data-tx="${t.id}">
        <span class="cat-ico" style="--c:var(--cyan)">⇄</span>
        <span class="t">${esc(t.note || "Transferencia")}<small>${shortDate(t.date)} · ${esc(accName(t.accountId))} → ${esc(accName(fin.transactions.find(x => x.transferId === t.transferId && x.amount > 0)?.accountId))}</small></span>
        <b class="num">${eur(-t.amount)}</b></button>` : `
      <button class="item tap" type="button" data-tx="${t.id}">
        <span class="cat-ico" style="--c:${catColor(state, t.categoryId)}"></span>
        <span class="t">${esc(t.note || catLabel(state, t.categoryId))}<small>${shortDate(t.date)} · ${esc(catLabel(state, t.categoryId).split(" › ").pop())} · ${esc(accName(t.accountId))}</small></span>
        <b class="num ${t.amount > 0 ? "pos" : ""}">${t.amount > 0 ? "+" : ""}${eur(t.amount)}</b></button>`).join("")}</div>`
      : `<div class="empty">Aún no hay movimientos. Pulsa <b>+</b> para apuntar un gasto o un ingreso.</div>`}
    ${next ? `<p class="hint" style="margin-top:8px">Próximo cargo fijo: <b>${esc(next.name)}</b> · ${shortDate(next.nextDate)} · ${eur(next.amount)}</p>` : ""}
  </section>`;
}

function weekCard(state) {
  const w = week(state);
  const header = `<h2 class="card-h"><span class="h-dot" style="--c:var(--fut)"></span>Tu semana<span class="spacer"></span><a class="btn small" href="#semana">Semanas</a></h2>`;
  if (!w.hasData) return `<section class="card">${header}<div class="empty">Aquí verás tus horas de deporte (gimnasio y fútbol) y tu sueño, de lunes a domingo.</div></section>`;
  return `<section class="card">${header}
    <div class="week-stats">
      <div><b class="num" style="color:var(--fut)">${num1(w.totalHours)} h</b><small>de deporte</small></div>
      <div><b class="num" style="color:var(--cyan)">${w.avgSleep != null ? num1(w.avgSleep) + " h" : "—"}</b><small>sueño medio</small></div>
      <div><b class="num" style="color:var(--hab)">${w.workouts}</b><small>entrenos</small></div>
    </div>
    ${weekChart({ bars: w.hours, line: w.sleep, labels: w.labels, today: w.todayIdx })}
    <div class="legend"><span style="--c:var(--fut)">Horas de deporte</span><span style="--c:var(--cyan)">Horas de sueño</span></div>
  </section>`;
}

// ---------- Interacción: marcar tareas y hábitos desde el resumen
export function mount(root, _state, signal) {
  root.addEventListener("click", e => {
    const tx = e.target.closest("[data-tx]");
    if (tx) { openTxForm({ id: tx.dataset.tx }); return; }
    const da = e.target.closest("[data-act=view-entry], [data-act=write-today]");
    if (da) { if (da.dataset.act === "write-today") openEntryForm(iso()); else viewEntry(da.dataset.date); return; }
    const wc = e.target.closest("[data-act=weekly-close]");
    if (wc) { closeWeekly(wc.dataset.ws); toast("Lo tienes cuando quieras en «Semanas»"); return; }
    const t = e.target.closest("[data-task]");
    if (t) {
      let r = null;
      update(s => { r = toggleTask(s, t.dataset.task); });
      if (r?.next) toast(`Hecha · la siguiente es el ${parseISO(r.next).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`);
      return;
    }
    const h = e.target.closest("[data-habit]");
    if (h?.dataset.auto) { const a = h.dataset.auto; toast(a === "routine" ? "Se marca solo al terminar la rutina en Hábitos → Rutina" : ["steps", "kcal", "protein"].includes(a) ? `Se marca solo con ${AUTO_LABEL[a]} al llegar al objetivo` : `Se marca solo al apuntar ${AUTO_LABEL[a]}`); return; }
    if (h) {
      update(s => {
        const habit = s.habits.habits.find(x => x.id === h.dataset.habit);
        if (!habit || habit.auto) return;
        const today = iso();
        const value = habitValue(s, habit, today);
        setHabitValue(s, habit.id, today, value >= (habit.target || 1) ? 0 : habit.target || 1);
      });
    }
  }, { signal });
}
