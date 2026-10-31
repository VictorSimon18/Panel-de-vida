// Hábitos y deporte: hábitos con rachas, gimnasio, fútbol, cuerpo y bienestar.

import { areaHeader } from "./area.js";
import { esc } from "../ui.js";
import { icon } from "../icons.js";
import { iso, addDays, parseISO } from "../stats.js";
import { heatmap, areaChart, stackChart, ring } from "../charts.js";
import { registerQuickAction } from "../quickadd.js";
import { update } from "../state.js";
import { freqText, habitValue, setHabitValue, streaks, dayLevel, heatDays, habitsToday, isScheduled, isDone, AUTO_LABEL } from "../habits.js";
import { records, sportSummary, wellbeingDays, workoutVolume, avg, kg, MOODS, MOOD_COLOR, QUALITY, FUTBOL_KINDS } from "../sport.js";
import { openHabitForm, openHabitDetail, openDayLog } from "./habitos-forms.js";
import { openWorkoutForm, openRoutineForm, openFutbolForm, openBodyForm, openWellbeingForm, openRecordDetail } from "./deporte-forms.js";

const ui = { tab: "habitos", archived: false };
const TABS = { habitos: "Hábitos", gym: "Gimnasio", futbol: "Fútbol", cuerpo: "Cuerpo", bienestar: "Bienestar" };
const num = n => new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(n);
const shortDate = s => new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(parseISO(s)).replace(".", "");
const dayName = s => { const t = new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric", month: "short" }).format(parseISO(s)).replace(/\./g, ""); return t[0].toUpperCase() + t.slice(1); };

// Botón "+": registro del día; y gimnasio/fútbol desde "Entreno o tiempo"
registerQuickAction("habit", () => openDayLog());

export function render(state) {
  const today = iso();
  const ht = habitsToday(state);
  const doneN = ht.filter(h => h.done).length;
  const sp = sportSummary(state);
  const sl = state.habits.sleep.find(x => x.date === today);
  const md = state.habits.mood.find(x => x.date === today);

  return `
    ${areaHeader(state, "hab")}

    <section class="card">
      <h2 class="card-h"><span class="h-dot" style="--c:var(--hab)"></span>Hoy<span class="spacer"></span></h2>
      <div class="today-hab">
        ${ring(ht.length ? doneN / ht.length * 100 : 0, "#ff3d9a", { size: 64, stroke: 6, label: `${doneN}/${ht.length}` })}
        <div class="today-stats">
          <div><b class="num">${sp.weekGym}</b><small>gimnasio esta semana</small></div>
          <div><b class="num">${sp.weekFutbol}</b><small>fútbol esta semana</small></div>
          <div><b class="num">${sl ? num(sl.hours) + " h" : "—"}</b><small>sueño</small></div>
          <div><b class="num" style="${md ? `color:${MOOD_COLOR[md.value]}` : ""}">${md ? MOODS[md.value] : "—"}</b><small>ánimo</small></div>
        </div>
      </div>
      <button class="btn primary" type="button" data-act="daylog" style="width:100%;margin-top:12px">Registro de hoy</button>
    </section>

    <div class="chips" role="tablist">${Object.entries(TABS).map(([k, l]) =>
      `<button type="button" role="tab" class="chip" data-act="tab" data-tab="${k}" aria-selected="${ui.tab === k}">${l}</button>`).join("")}</div>

    ${({ habitos: habitosTab, gym: gymTab, futbol: futbolTab, cuerpo: cuerpoTab, bienestar: bienestarTab })[ui.tab](state)}`;
}

// ---------- Hábitos
function habitosTab(state) {
  const today = iso();
  const all = state.habits.habits;
  const list = all.filter(h => !!h.archived === ui.archived);
  const archivedN = all.filter(h => h.archived).length;
  const last7 = Array.from({ length: 7 }, (_, i) => iso(addDays(parseISO(today), i - 6)));

  const row = h => {
    const v = habitValue(state, h, today), st = streaks(state, h);
    const done = v >= (h.target || 1);
    return `<div class="habit${done ? " is-done" : ""}">
      <button class="habit-main" type="button" data-act="habit-detail" data-id="${h.id}">
        <span class="habit-top"><b>${esc(h.name)}</b>${st.current ? `<span class="flame num">${icon.flame}${st.current}</span>` : ""}</span>
        <small>${freqText(h)}${h.auto ? ` · auto (${AUTO_LABEL[h.auto]})` : ` · ${num(v)}/${num(h.target)} ${esc(h.unit)}`}</small>
        <span class="dots">${last7.map(d => {
          const sch = isScheduled(h, d) || h.frequency?.type === "weekly";
          return `<i class="${isDone(state, h, d) ? "on" : sch ? "" : "off"}${d === today ? " today" : ""}" title="${d}"></i>`;
        }).join("")}</span>
      </button>
      ${h.auto ? `<span class="tag" style="--c:var(--hab)">Auto</span>` :
        `<div class="stepper"><button class="btn small" type="button" data-act="hstep" data-id="${h.id}" data-n="-1" aria-label="Restar a ${esc(h.name)}">−</button><button class="btn small primary" type="button" data-act="hstep" data-id="${h.id}" data-n="1" aria-label="Sumar a ${esc(h.name)}">+</button></div>`}
    </div>`;
  };

  const days = heatDays(17, today).map(date => ({ date, level: dayLevel(state, date) }));
  return `
    ${all.length ? `<section class="card">
      <h2 class="card-h">Constancia · últimas 17 semanas</h2>
      ${heatmap(days, { color: "#ff3d9a", today })}
      <div class="legend"><span style="--c:rgba(255,61,154,.3)">Algún hábito</span><span style="--c:var(--hab)">Todos los del día</span></div>
    </section>` : ""}
    <section class="card">
      <div class="btn-row"><button class="btn primary" type="button" data-act="new-habit">${icon.plus} Nuevo hábito</button></div>
      ${list.length ? `<div class="habits">${list.map(row).join("")}</div>` : `<div class="empty">${ui.archived ? "No hay hábitos archivados." : "Crea tu primer hábito: beber agua, leer, meditar…<br>Puedes fijar una cantidad y cada cuánto te toca."}</div>`}
      ${archivedN || ui.archived ? `<button class="btn small link-btn" type="button" data-act="toggle-arch">${ui.archived ? "Ver activos" : `Ver archivados (${archivedN})`}</button>` : ""}
    </section>`;
}

// ---------- Gimnasio
function gymTab(state) {
  const routines = state.habits.routines;
  const sessions = state.habits.workouts.filter(w => w.type === "gym").sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  const recs = records(state);
  const rname = id => routines.find(r => r.id === id)?.name || "Entreno libre";
  return `
    <section class="card">
      <h2 class="card-h">Entrenar</h2>
      <div class="routine-picks">
        ${routines.map(r => `<button class="quick" type="button" data-act="start-routine" data-id="${r.id}" style="--c:var(--hab)">${icon.dumbbell}<b>${esc(r.name)}</b><small>${r.exercises.length} ejercicios</small></button>`).join("")}
        <button class="quick" type="button" data-act="start-free" style="--c:var(--cyan)">${icon.plus}<b>Entreno libre</b><small>Sin rutina</small></button>
      </div>
    </section>
    <section class="card">
      <h2 class="card-h">Últimos entrenos<span class="spacer"></span></h2>
      ${sessions.length ? `<div class="list">${sessions.map(w => `
        <button class="item tap" type="button" data-act="edit-workout" data-id="${w.id}">
          <span class="cat-ico" style="--c:var(--hab)"></span>
          <span class="t">${esc(rname(w.routineId))}<small>${dayName(w.date)} · ${(w.exercises || []).length} ejercicios${w.minutes ? ` · ${w.minutes} min` : ""}</small></span>
          <b class="num">${num(workoutVolume(w) / 1000)} t</b>
        </button>`).join("")}</div><p class="hint">t = toneladas movidas (peso × repeticiones).</p>` : `<div class="empty">Aún no hay entrenos. Elige una rutina arriba para empezar.</div>`}
    </section>
    <section class="card">
      <h2 class="card-h">Rutinas<span class="spacer"></span><button class="btn small" type="button" data-act="new-routine">+ Nueva</button></h2>
      ${routines.length ? `<div class="list">${routines.map(r => `
        <button class="item tap" type="button" data-act="edit-routine" data-id="${r.id}">
          <span class="t">${esc(r.name)}<small>${r.exercises.map(e => esc(e.name)).join(" · ")}</small></span>
          ${icon.chevron}
        </button>`).join("")}</div>` : `<div class="empty">Crea rutinas (Torso, Pierna…) con sus ejercicios, series y repeticiones.</div>`}
    </section>
    ${recs.length ? `<section class="card">
      <h2 class="card-h">Récords</h2>
      <div class="list">${recs.map(r => `
        <button class="item tap" type="button" data-act="record" data-name="${esc(r.name)}">
          <span class="t">${esc(r.name)}<small>${r.best.r} reps · ${shortDate(r.best.date)}</small></span>
          <b class="num" style="color:var(--hab)">${kg(r.best.w)}</b>
        </button>`).join("")}</div>
    </section>` : ""}`;
}

// ---------- Fútbol
function futbolTab(state) {
  const sp = sportSummary(state);
  const list = state.habits.workouts.filter(w => w.type === "futbol").sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15);
  return `<section class="card">
    <div class="btn-row"><button class="btn primary" type="button" data-act="new-futbol">${icon.ball} Apuntar sesión</button></div>
    <div class="week-stats">
      <div><b class="num" style="color:var(--hab)">${sp.futbolMonth.sessions}</b><small>sesiones este mes</small></div>
      <div><b class="num">${sp.futbolMonth.minutes}</b><small>minutos este mes</small></div>
      <div><b class="num">${sp.futbolMonth.partidos}</b><small>partidos</small></div>
    </div>
    ${list.length ? `<div class="list">${list.map(w => `
      <button class="item tap" type="button" data-act="edit-futbol" data-id="${w.id}">
        <span class="cat-ico" style="--c:${w.kind === "partido" ? "var(--agenda)" : "var(--hab)"}"></span>
        <span class="t">${FUTBOL_KINDS[w.kind] || "Fútbol"}<small>${dayName(w.date)}${w.note ? ` · ${esc(w.note)}` : ""}</small></span>
        <b class="num">${w.minutes} min</b>
      </button>`).join("")}</div>` : `<div class="empty">Apunta tus entrenamientos y partidos con los minutos jugados.</div>`}
  </section>`;
}

// ---------- Cuerpo
function cuerpoTab(state) {
  const list = [...state.habits.body].sort((a, b) => b.date.localeCompare(a.date));
  const withW = list.filter(b => b.weight != null);
  const last = withW[0], prev = withW[1];
  const delta = last && prev ? last.weight - prev.weight : null;
  const series = withW.slice(0, 12).reverse();
  return `<section class="card">
    <div class="btn-row"><button class="btn primary" type="button" data-act="new-body">${icon.plus} Nueva medición</button></div>
    ${last ? `
      <div class="body-now">
        <div><small>Peso actual</small><b class="num">${kg(last.weight)}</b></div>
        ${delta != null ? `<span class="tag" style="--c:${delta <= 0 ? "var(--fin)" : "var(--agenda)"}">${delta > 0 ? "+" : delta < 0 ? "−" : "±"}${kg(Math.abs(delta))} desde el ${shortDate(prev.date)}</span>` : ""}
      </div>
      ${series.length > 1 ? areaChart(series.map(b => ({ label: shortDate(b.date), value: b.weight })), { color: "#ff3d9a", format: kg, id: "wt" }) : ""}` : ""}
    ${list.length ? `<div class="list">${list.slice(0, 12).map(b => `
      <button class="item tap" type="button" data-act="edit-body" data-id="${b.id}">
        <span class="t">${dayName(b.date)}<small>${[b.fat != null ? `${num(b.fat)} % grasa` : "", b.waist != null ? `${num(b.waist)} cm cintura` : ""].filter(Boolean).join(" · ") || "Solo peso"}</small></span>
        <b class="num">${b.weight != null ? kg(b.weight) : "—"}</b>
      </button>`).join("")}</div>` : `<div class="empty">Apunta tu peso (y si quieres, % de grasa y cintura) para ver cómo evoluciona.</div>`}
  </section>`;
}

// ---------- Bienestar: sueño y ánimo
function bienestarTab(state) {
  const days = wellbeingDays(state, 14);
  const has = days.some(d => d.sleep != null || d.mood != null);
  const aSleep = avg(days.map(d => d.sleep)), aMood = avg(days.map(d => d.mood)), aQ = avg(days.map(d => d.quality));
  const recent = days.slice().reverse().filter(d => d.sleep != null || d.mood != null).slice(0, 7);
  return `<section class="card">
    <div class="btn-row"><button class="btn primary" type="button" data-act="wellbeing">${icon.moon} Apuntar sueño y ánimo</button></div>
    ${has ? `
      <div class="week-stats">
        <div><b class="num" style="color:var(--cyan)">${aSleep != null ? num(aSleep) + " h" : "—"}</b><small>sueño medio</small></div>
        <div><b class="num">${aQ != null ? QUALITY[Math.round(aQ)] : "—"}</b><small>calidad media</small></div>
        <div><b class="num" style="${aMood ? `color:${MOOD_COLOR[Math.round(aMood)]}` : ""}">${aMood != null ? MOODS[Math.round(aMood)] : "—"}</b><small>ánimo medio</small></div>
      </div>
      <h3 class="card-h" style="margin-top:14px">Sueño · últimos 14 días</h3>
      ${stackChart(days.map((d, i) => ({ label: d.label, values: [d.sleep || 0], highlight: i === days.length - 1 })), { colors: ["#22e5ff"], labelEvery: 2 })}
      <h3 class="card-h" style="margin-top:10px">Ánimo</h3>
      <div class="mood-strip">${days.map(d => `<span title="${d.date}"><i style="${d.mood ? `background:${MOOD_COLOR[d.mood]};box-shadow:0 0 6px ${MOOD_COLOR[d.mood]}` : ""}"></i><small>${d.label}</small></span>`).join("")}</div>
      <div class="list">${recent.map(d => `
        <button class="item tap" type="button" data-act="edit-wb" data-date="${d.date}">
          <span class="t">${dayName(d.date)}<small>${d.sleep != null ? `${num(d.sleep)} h · ${QUALITY[d.quality] || ""}` : "Sin sueño apuntado"}</small></span>
          ${d.mood ? `<span class="tag" style="--c:${MOOD_COLOR[d.mood]}">${MOODS[d.mood]}</span>` : ""}
        </button>`).join("")}</div>`
    : `<div class="empty">Apunta cada día cuánto has dormido y cómo te sientes para ver tus tendencias.</div>`}
  </section>`;
}

// ---------- Interacción
export function mount(root, _state, signal) {
  root.addEventListener("click", e => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const id = b.dataset.id;
    const rerender = () => window.dispatchEvent(new Event("pv:render"));
    switch (b.dataset.act) {
      case "tab": ui.tab = b.dataset.tab; rerender(); break;
      case "toggle-arch": ui.archived = !ui.archived; rerender(); break;
      case "daylog": openDayLog(); break;
      case "new-habit": openHabitForm(); break;
      case "habit-detail": openHabitDetail(id); break;
      case "hstep": update(s => {
        const h = s.habits.habits.find(x => x.id === id);
        const today = iso();
        setHabitValue(s, h.id, today, Math.max(0, habitValue(s, h, today) + Number(b.dataset.n) * (h.step || h.target || 1)));
      }); break;
      case "start-routine": openWorkoutForm({ routineId: id }); break;
      case "start-free": openWorkoutForm({ routineId: "" }); break;
      case "edit-workout": openWorkoutForm({ id }); break;
      case "new-routine": openRoutineForm(); break;
      case "edit-routine": openRoutineForm(id); break;
      case "record": openRecordDetail(b.dataset.name); break;
      case "new-futbol": openFutbolForm(); break;
      case "edit-futbol": openFutbolForm(id); break;
      case "new-body": openBodyForm(); break;
      case "edit-body": openBodyForm(id); break;
      case "wellbeing": openWellbeingForm(); break;
      case "edit-wb": openWellbeingForm(b.dataset.date); break;
    }
  }, { signal });
}
