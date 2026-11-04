// Área Fútbol: temporada, partidos, entrenos y estadísticas.

import { areaHeader } from "./area.js";
import { esc, int, openSheet, closeSheet, toast } from "../ui.js";
import { getState } from "../state.js";
import { icon } from "../icons.js";
import { iso, parseISO } from "../stats.js";
import { stackChart } from "../charts.js";
import { registerQuickAction } from "../quickadd.js";
import { COMPS, POSITIONS, RESULT, RESULT_COLOR, seasonOf, seasonLabel, seasons, matchesOf, trainingsOf, resultOf, matchStats, seasonMonths, groupBy, records } from "../futbol.js";
import { openMatchForm, openTrainingForm } from "./futbol-forms.js";
import { openWorkoutForm } from "./deporte-forms.js";

const ui = { tab: "temporada", season: null };
const TABS = { temporada: "Temporada", partidos: "Partidos", entrenos: "Entrenos", stats: "Estadísticas" };
const num1 = v => new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(v);
const dayName = s => { const t = new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric", month: "short" }).format(parseISO(s)).replace(/\./g, ""); return t[0].toUpperCase() + t.slice(1); };
const shortDate = s => new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "2-digit" }).format(parseISO(s)).replace(".", "");

// Botón "+" → "Entreno o partido"
registerQuickAction("train", () => {
  const sheet = openSheet(`
    <h2>¿Qué quieres apuntar?</h2>
    <div class="quick-grid">
      <button class="quick" type="button" data-pick="partido" style="--c:var(--fut)">${icon.ball}<b>Partido</b><small>Resultado, goles, nota…</small></button>
      <button class="quick" type="button" data-pick="entreno" style="--c:var(--fut)">${icon.clock}<b>Entreno de fútbol</b><small>Minutos</small></button>
      <button class="quick" type="button" data-pick="gym" style="--c:var(--hab)">${icon.dumbbell}<b>Gimnasio</b><small>Con tus rutinas</small></button>
    </div>`);
  sheet.addEventListener("click", e => {
    const b = e.target.closest("[data-pick]");
    if (!b) return;
    closeSheet();
    if (b.dataset.pick === "partido") openMatchForm();
    else if (b.dataset.pick === "entreno") openTrainingForm();
    else if (getState().settings.gymSource === "hevy") toast("Apunta el entreno en Hevy y luego impórtalo en Hábitos → Gimnasio", { ms: 4000 });
    else openWorkoutForm();
  });
});

const resDot = r => `<span class="res-dot" style="--c:${r ? RESULT_COLOR[r] : "var(--line)"}" title="${r ? RESULT[r] : "Sin resultado"}">${r || "·"}</span>`;

export function render(state) {
  const today = iso();
  const list = seasons(state, today);
  if (ui.season == null || !list.includes(ui.season)) ui.season = seasonOf(today);
  const i = list.indexOf(ui.season);
  return `
    ${areaHeader(state, "fut")}
    <div class="season-bar">
      <button class="icon-btn" type="button" data-act="season" data-n="1" aria-label="Temporada anterior"${i >= list.length - 1 ? " disabled" : ""}>${icon.back}</button>
      <b>Temporada ${seasonLabel(ui.season)}</b>
      <button class="icon-btn" type="button" data-act="season" data-n="-1" aria-label="Temporada siguiente"${i <= 0 ? " disabled" : ""}>${icon.chevron}</button>
    </div>
    <div class="chips" role="tablist">${Object.entries(TABS).map(([k, l]) =>
      `<button type="button" role="tab" class="chip" data-act="tab" data-tab="${k}" aria-selected="${ui.tab === k}">${l}</button>`).join("")}</div>
    ${({ temporada: temporadaTab, partidos: partidosTab, entrenos: entrenosTab, stats: statsTab })[ui.tab](state, today)}`;
}

const addBtns = `<div class="btn-row">
  <button class="btn primary" type="button" data-act="new-match">${icon.ball} Nuevo partido</button>
  <button class="btn" type="button" data-act="new-training">${icon.plus} Entreno</button></div>`;

// ---------- Temporada
function temporadaTab(state, today) {
  const ms = matchesOf(state, ui.season), tr = trainingsOf(state, ui.season);
  const s = matchStats(ms);
  if (!ms.length && !tr.length) return `<section class="card">${addBtns}
    <div class="empty">Aún no hay nada en la temporada ${seasonLabel(ui.season)}.<br>Apunta tus partidos con el resultado, tus goles, asistencias y tu nota para ver aquí tu temporada.</div></section>`;
  const trMin = tr.reduce((a, w) => a + (w.minutes || 0), 0);
  return `<section class="card">${addBtns}
    <div class="fut-hero">
      <div class="fut-big"><b class="num">${s.goals}</b><small>goles</small></div>
      <div class="fut-big"><b class="num">${s.assists}</b><small>asistencias</small></div>
      <div class="fut-big"><b class="num">${s.played}</b><small>partidos</small></div>
    </div>
    ${s.V + s.E + s.D ? `<div class="vde">
      <span style="--c:var(--fin)"><b class="num">${s.V}</b> V</span><span style="--c:var(--muted)"><b class="num">${s.E}</b> E</span><span style="--c:var(--danger)"><b class="num">${s.D}</b> D</span>
      <span class="muted">Goles del equipo ${s.gf}–${s.ga}</span>
    </div>` : ""}
    ${s.last5.length ? `<div class="last5"><small>Últimos partidos</small><div>${s.last5.map(x => resDot(x.r)).join("")}</div></div>` : ""}
    <div class="week-stats">
      <div><b class="num" style="color:var(--fut)">${s.rating != null ? num1(s.rating) : "—"}</b><small>nota media</small></div>
      <div><b class="num">${int(s.minutes)}</b><small>minutos jugados</small></div>
      <div><b class="num">${s.startsKnown ? `${Math.round(s.starts / s.startsKnown * 100)} %` : "—"}</b><small>de titular</small></div>
    </div>
    <div class="list" style="margin-top:10px">
      <div class="kv"><span>Racha marcando</span><span class="num">${s.scoring.current} ${s.scoring.current === 1 ? "partido" : "partidos"} · mejor ${s.scoring.best}</span></div>
      <div class="kv"><span>Racha sin perder</span><span class="num">${s.unbeaten.current} · mejor ${s.unbeaten.best}</span></div>
      ${s.minPerGoal ? `<div class="kv"><span>Minutos por gol</span><span class="num">${s.minPerGoal}'</span></div>` : ""}
      <div class="kv"><span>Entrenos</span><span class="num">${tr.length} · ${int(trMin / 60)} h</span></div>
      ${s.yellow || s.red ? `<div class="kv"><span>Tarjetas</span><span class="num">${s.yellow} ${s.yellow === 1 ? "amarilla" : "amarillas"} · ${s.red} ${s.red === 1 ? "roja" : "rojas"}</span></div>` : ""}
    </div>
  </section>
  ${ms.length ? `<section class="card"><h2 class="card-h">Últimos partidos<span class="spacer"></span><a href="#" data-act="tab" data-tab="partidos">Ver todos</a></h2>
    <div class="list">${ms.slice(-3).reverse().map(matchItem).join("")}</div></section>` : ""}`;
}

function matchItem(m) {
  const r = resultOf(m);
  const bits = [m.goals ? `${m.goals} ${m.goals === 1 ? "gol" : "goles"}` : "", m.assists ? `${m.assists} asist.` : "", m.minutes != null ? `${m.minutes}'` : "", m.rating ? `nota ${num1(m.rating)}` : ""].filter(Boolean).join(" · ");
  return `<button class="item tap" type="button" data-act="edit-match" data-id="${m.id}">
    ${resDot(r)}
    <span class="t">${m.rival ? `${m.venue === "visitante" ? "en " : "vs "}${esc(m.rival)}` : "Partido"}<small>${dayName(m.date)}${m.comp ? ` · ${COMPS[m.comp]}` : ""}${bits ? ` · ${bits}` : ""}</small></span>
    <b class="num">${r ? `${m.gf}–${m.ga}` : ""}</b>
  </button>`;
}

// ---------- Partidos
function partidosTab(state) {
  const ms = matchesOf(state, ui.season).reverse();
  if (!ms.length) return `<section class="card">${addBtns}<div class="empty">No hay partidos en la temporada ${seasonLabel(ui.season)}.</div></section>`;
  return `<section class="card">${addBtns}<div class="list">${ms.map(matchItem).join("")}</div></section>`;
}

// ---------- Entrenos
function entrenosTab(state, today) {
  const tr = trainingsOf(state, ui.season).reverse();
  const month = today.slice(0, 7);
  const thisMonth = tr.filter(w => w.date.startsWith(month));
  const min = tr.reduce((a, w) => a + (w.minutes || 0), 0);
  return `<section class="card">
    <div class="btn-row"><button class="btn primary" type="button" data-act="new-training">${icon.plus} Apuntar entreno</button></div>
    <div class="week-stats">
      <div><b class="num" style="color:var(--fut)">${tr.length}</b><small>en la temporada</small></div>
      <div><b class="num">${thisMonth.length}</b><small>este mes</small></div>
      <div><b class="num">${num1(min / 60)} h</b><small>en total</small></div>
    </div>
    ${tr.length ? `<div class="list">${tr.map(w => `
      <button class="item tap" type="button" data-act="edit-training" data-id="${w.id}">
        <span class="cat-ico" style="--c:var(--fut)"></span>
        <span class="t">Entreno<small>${dayName(w.date)}${w.note ? ` · ${esc(w.note)}` : ""}</small></span>
        <b class="num">${w.minutes} min</b>
      </button>`).join("")}</div>` : `<div class="empty">Apunta tus entrenamientos con los minutos.</div>`}
  </section>`;
}

// ---------- Estadísticas
function statsTab(state, today) {
  const ms = matchesOf(state, ui.season);
  const months = seasonMonths(state, ui.season, today);
  const rec = records(state);
  const row = g => `<div class="nw-row" role="row"><span>${esc(g.label)}</span><span class="num">${g.played}</span><span class="num">${g.goals}</span><span class="num">${g.assists}</span><span class="num">${g.V + g.E + g.D ? `${g.V}-${g.E}-${g.D}` : "—"}</span></div>`;
  const table = (title, groups) => groups.length ? `<h3 class="card-h" style="margin-top:14px">${title}</h3>
    <div class="nw-table fut-table" role="table"><div class="nw-row head" role="row"><span></span><span>PJ</span><span>G</span><span>A</span><span>V-E-D</span></div>${groups.map(row).join("")}</div>` : "";
  const recLine = (label, m, val) => m ? `<button class="kv tap-kv" type="button" data-act="edit-match" data-id="${m.id}"><span>${label}</span><span class="num">${val} · ${m.rival ? esc(m.rival) + ", " : ""}${shortDate(m.date)}</span></button>` : "";
  return `<section class="card">
    <h2 class="card-h">Goles y asistencias por mes</h2>
    ${months.some(x => x.goals || x.assists) ? `${stackChart(months.map((x, i) => ({ label: x.label, values: [x.goals, x.assists], highlight: i === months.length - 1 })), { colors: ["#7ea6f0", "#7cc4e4"], unit: "", id: "ga" })}
      <div class="legend"><span style="--c:#7ea6f0">Goles</span><span style="--c:#7cc4e4">Asistencias</span></div>` : `<div class="empty">Aún no hay goles ni asistencias esta temporada.</div>`}
    ${table("Por competición", groupBy(ms, "comp", COMPS))}
    ${table("Por posición", groupBy(ms.filter(m => m.position), "position", POSITIONS))}
  </section>
  <section class="card">
    <h2 class="card-h">Récords (todas las temporadas)</h2>
    ${rec.total.played ? `<div class="list">
      ${recLine("Más goles en un partido", rec.mostGoals, `${rec.mostGoals?.goals} ${rec.mostGoals?.goals === 1 ? "gol" : "goles"}`)}
      ${recLine("Más asistencias", rec.mostAssists, `${rec.mostAssists?.assists}`)}
      ${recLine("Mejor nota", rec.bestRating, num1(rec.bestRating?.rating || 0))}
      ${recLine("Mayor victoria", rec.bigWin, `${rec.bigWin?.gf}–${rec.bigWin?.ga}`)}
      <div class="kv"><span>Hat-tricks</span><span class="num">${rec.hatTricks}</span></div>
      <div class="kv"><span>En total</span><span class="num">${rec.total.played} partidos · ${rec.total.goals} goles · ${rec.total.assists} asist.</span></div>
    </div>` : `<div class="empty">Aquí aparecerán tus mejores partidos.</div>`}
  </section>`;
}

export function mount(root, _state, signal) {
  root.addEventListener("click", e => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const id = b.dataset.id;
    const rerender = () => window.dispatchEvent(new Event("pv:render"));
    switch (b.dataset.act) {
      case "tab": e.preventDefault(); ui.tab = b.dataset.tab; rerender(); break;
      case "season": { const list = seasons(getState(), iso()); ui.season = list[list.indexOf(ui.season) + Number(b.dataset.n)] ?? ui.season; rerender(); break; }
      case "new-match": openMatchForm(); break;
      case "edit-match": openMatchForm(id); break;
      case "new-training": openTrainingForm(); break;
      case "edit-training": openTrainingForm(id); break;
    }
  }, { signal });
  const chips = root.querySelector(".chips"), sel = chips?.querySelector('[aria-selected="true"]');
  if (sel && sel.offsetLeft + sel.offsetWidth > chips.scrollLeft + chips.clientWidth) chips.scrollLeft = sel.offsetLeft - 16;
}
