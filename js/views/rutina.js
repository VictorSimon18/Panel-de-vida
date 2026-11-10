// Pestaña «Rutina» de Hábitos: la rutina diaria, su cronómetro a pantalla completa y el editor.

import { getState, update } from "../state.js";
import { esc, openSheet, closeSheet, toast, confirmSheet, uid } from "../ui.js";
import { icon } from "../icons.js";
import { iso, addDays, parseISO } from "../stats.js";
import { seg } from "../forms.js";
import { streaks } from "../habits.js";
import { ROUTINE_HABIT, routineSecs, fmtClock, fmtDuration, stepText, completeRoutine, doneOn, hasProgression, weekProgress, undoProgression, PROGRESS_DAYS } from "../routine.js";

const valText = (kind, v) => kind === "time" ? fmtClock(v) : `${v} rep.`;
/** «+5 s/semana (hasta 2:00)» o "" si ese ejercicio no sube */
const incText = s => !(s.inc > 0) ? "" : (s.max > 0 && (s.kind === "time" ? s.secs : s.reps) >= s.max) ? "en su tope"
  : `+${s.inc} ${s.kind === "time" ? "s" : "rep."}/semana${s.max > 0 ? ` (hasta ${valText(s.kind, s.max)})` : ""}`;

/** Aviso de la subida de esta semana, o de por qué no ha subido */
function progressNotice(state) {
  const r = state.routine, last = r.progress?.last;
  if (!last || last.week !== r.progress.week) return "";
  if (last.changes?.length) return `<section class="card rt-up">
    <h2 class="card-h"><span class="h-dot" style="--c:var(--fin)"></span>Esta semana sube<span class="spacer"></span><small class="muted">hiciste ${last.days} de 7 días</small></h2>
    <div class="list">${last.changes.map(c => `<div class="kv"><span>${esc(c.name)}</span><span class="num">${valText(c.kind, c.from)} → <b style="color:var(--fin)">${valText(c.kind, c.to)}</b></span></div>`).join("")}</div>
    <button class="btn small" type="button" data-act="rt-undo" style="margin-top:8px">Deshacer la subida</button>
  </section>`;
  if (last.undone) return "";
  if (hasProgression(r) && last.days < PROGRESS_DAYS) return `<section class="card">
    <h2 class="card-h"><span class="h-dot" style="--c:var(--agenda)"></span>Esta semana se queda igual</h2>
    <p class="hint" style="margin-top:8px">La semana pasada hiciste la rutina ${last.days} de 7 días. Para que suba hacen falta ${PROGRESS_DAYS}.</p>
  </section>`;
  return "";
}

const time = ts => new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(new Date(ts));

export function rutinaTab(state) {
  const r = state.routine;
  if (!r) return "";
  const today = iso();
  const done = doneOn(state, today);
  const h = state.habits.habits.find(x => x.id === ROUTINE_HABIT);
  const st = h ? streaks(state, h) : { current: 0, best: 0 };
  const logDays = new Set((state.habits.routineLog || []).map(l => l.date));
  const days = Array.from({ length: 14 }, (_, i) => iso(addDays(parseISO(today), i - 13)));
  const total = (state.habits.routineLog || []).length;
  const prog = hasProgression(r), wp = weekProgress(state, today);
  return `${progressNotice(state)}<section class="card">
    <h2 class="card-h"><span class="h-dot" style="--c:var(--hab)"></span>Rutina de hoy<span class="spacer"></span>
      ${done.length ? `<span class="tag" style="--c:var(--fin)">Hecha · ${time(done.at(-1).at)}</span>` : `<span class="tag" style="--c:var(--agenda)">Pendiente</span>`}</h2>
    <div class="list rt-steps">${r.steps.map((s, i) => `
      <div class="item"><span class="rt-n num">${i + 1}</span><span class="t">${esc(s.name)}<small>${s.kind === "time" ? "Por tiempo" : "Repeticiones"}${incText(s) ? ` · <span class="rt-inc">${incText(s)}</span>` : ""}</small></span><b class="num">${stepText(s)}</b></div>`).join("")}</div>
    <p class="hint">${r.rest ? `${r.rest} s de descanso entre ejercicios · ` : "Sin descanso · "}unos ${fmtDuration(routineSecs(r))} en total</p>
    <button class="btn primary rt-start" type="button" data-act="rt-start">${icon.bolt} ${done.length ? "Repetir rutina" : "Empezar"}</button>
    <button class="btn" type="button" data-act="rt-edit" style="width:100%;margin-top:8px">Editar rutina</button>
  </section>
  <section class="card">
    <h2 class="card-h">Constancia</h2>
    <div class="week-stats">
      <div><b class="num" style="color:var(--hab)">${st.current}</b><small>${st.current === 1 ? "día seguido" : "días seguidos"}</small></div>
      <div><b class="num">${st.best}</b><small>mejor racha</small></div>
      <div><b class="num">${total}</b><small>${total === 1 ? "vez en total" : "veces en total"}</small></div>
    </div>
    ${prog ? `<div class="kv big"><span>Para subir el lunes</span><b class="num" style="color:${wp.ok ? "var(--fin)" : "var(--fg)"}">${wp.days} de ${wp.need} días${wp.ok ? " ✓" : ""}</b></div>
    <p class="hint" style="margin-top:6px">${wp.ok ? "Conseguido: el lunes suben los ejercicios que tienen subida." : `Te ${wp.left === 1 ? "falta 1 día" : `faltan ${wp.left} días`} esta semana para que el lunes suba.`}</p>`
      : `<p class="hint" style="margin-top:10px">¿Quieres que vaya subiendo sola? En <b>Editar rutina</b> pon a cada ejercicio cuánto sube por semana.</p>`}
    <div class="rt-days">${days.map(d => `<span class="${logDays.has(d) ? "on" : ""}${d === today ? " today" : ""}" title="${d}"><i></i><small>${parseISO(d).getDate()}</small></span>`).join("")}</div>
  </section>`;
}

// ---------- Editor
export function openRoutineEditor() {
  const r = structuredClone(getState().routine);
  const row = s => `<div class="rt-edit-row" data-id="${s.id}">
    <input class="input" data-f="name" maxlength="40" autocomplete="off" value="${esc(s.name)}" placeholder="Ejercicio" aria-label="Nombre del ejercicio">
    <select class="input" data-f="kind" aria-label="Tipo"><option value="time"${s.kind === "time" ? " selected" : ""}>Segundos</option><option value="reps"${s.kind === "reps" ? " selected" : ""}>Repeticiones</option></select>
    <input class="input num" data-f="val" inputmode="numeric" autocomplete="off" value="${s.kind === "time" ? s.secs : s.reps}" aria-label="Cantidad">
    <label class="rt-edit-inc"><span>Sube por semana</span><input class="input num" data-f="inc" inputmode="numeric" autocomplete="off" value="${s.inc || ""}" placeholder="0" aria-label="Cuánto sube por semana"></label>
    <label class="rt-edit-inc"><span>Hasta (opcional)</span><input class="input num" data-f="max" inputmode="numeric" autocomplete="off" value="${s.max || ""}" placeholder="sin tope" aria-label="Tope"></label>
    <div class="rt-edit-btns"><button class="btn small" type="button" data-mv="-1" aria-label="Subir">↑</button><button class="btn small" type="button" data-mv="1" aria-label="Bajar">↓</button><button class="btn small" type="button" data-del aria-label="Quitar">✕</button></div>
  </div>`;
  const sheet = openSheet(`
    <h2>Editar rutina</h2>
    <form class="form" id="rt-form" novalidate>
      <div class="field"><label>Descanso entre ejercicios</label>${seg("rest", { 0: "Nada", 15: "15 s", 30: "30 s", 45: "45 s", 60: "1 min" }, String(r.rest || 0))}</div>
      <div class="field"><label>Ejercicios (en orden)</label><div id="rt-rows">${r.steps.map(row).join("")}</div>
        <div class="btn-row" style="margin-top:8px"><button class="btn small" type="button" data-add="time">${icon.plus} Por tiempo</button><button class="btn small" type="button" data-add="reps">${icon.plus} Por repeticiones</button></div>
      </div>
      <p class="hint"><b>Sube por semana:</b> segundos o repeticiones que se añaden cada lunes si la semana anterior hiciste la rutina ${PROGRESS_DAYS} de 7 días. Déjalo vacío para que ese ejercicio no suba. <b>Hasta</b> es el tope (en segundos o repeticiones).</p>
      <p class="hint">Para una plancha lateral por cada lado, pon dos ejercicios (izquierda y derecha).</p>
      <div class="btn-row"><button class="btn" type="button" data-close>Cancelar</button><button class="btn primary" type="submit">Guardar</button></div>
    </form>`);
  const form = sheet.querySelector("#rt-form"), rows = form.querySelector("#rt-rows");
  form.addEventListener("click", e => {
    const add = e.target.closest("[data-add]");
    if (add) {
      const s = add.dataset.add === "time" ? { id: uid(), name: "", kind: "time", secs: 60 } : { id: uid(), name: "", kind: "reps", reps: 10 };
      rows.insertAdjacentHTML("beforeend", row(s)); rows.lastElementChild.querySelector("[data-f=name]").focus(); return;
    }
    const el = e.target.closest(".rt-edit-row");
    if (!el) return;
    if (e.target.closest("[data-del]")) el.remove();
    const mv = e.target.closest("[data-mv]");
    if (mv) { const sib = mv.dataset.mv === "-1" ? el.previousElementSibling : el.nextElementSibling; if (sib) mv.dataset.mv === "-1" ? sib.before(el) : sib.after(el); }
  });
  form.addEventListener("submit", e => {
    e.preventDefault();
    const steps = [];
    for (const el of rows.querySelectorAll(".rt-edit-row")) {
      const name = el.querySelector("[data-f=name]").value.trim(), kind = el.querySelector("[data-f=kind]").value;
      const val = Math.round(Number(el.querySelector("[data-f=val]").value));
      if (!name) { toast("Ponle nombre a cada ejercicio", { error: true }); return; }
      if (!(val > 0) || (kind === "time" ? val > 3600 : val > 1000)) { toast(`Revisa la cantidad de «${name}»`, { error: true }); return; }
      const inc = Math.max(0, Math.round(Number(el.querySelector("[data-f=inc]").value) || 0));
      const max = Math.max(0, Math.round(Number(el.querySelector("[data-f=max]").value) || 0));
      if (inc > 0 && max > 0 && max < val) { toast(`El tope de «${name}» es menor que su cantidad actual`, { error: true }); return; }
      const step = kind === "time" ? { id: el.dataset.id, name, kind, secs: val } : { id: el.dataset.id, name, kind, reps: val };
      if (inc > 0) { step.inc = inc; if (max > 0) step.max = max; }
      steps.push(step);
    }
    if (!steps.length) { toast("Añade al menos un ejercicio", { error: true }); return; }
    const rest = Number(form.querySelector("[name=rest]:checked").value);
    update(s => { s.routine = { ...s.routine, rest, steps }; });   // se conserva la progresión
    closeSheet();
    toast("Rutina guardada");
  });
}

// ---------- Cronómetro a pantalla completa (fuera de la vista, para que no se corte al repintar)
let run = null;

function beep(freq = 880, dur = 0.12) {
  try {
    const ctx = run?.audio; if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = freq; o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.25, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.start(); o.stop(ctx.currentTime + dur);
  } catch { /* sin sonido */ }
}

function phasesOf(r) {
  const out = [];
  r.steps.forEach((s, i) => {
    out.push(s.kind === "time" ? { type: "work", step: s, secs: s.secs } : { type: "reps", step: s });
    if (i < r.steps.length - 1 && r.rest > 0) out.push({ type: "rest", secs: r.rest, next: r.steps[i + 1] });
  });
  return out;
}

export function startRoutine() {
  if (run) return;
  const r = getState().routine;
  const el = document.createElement("div");
  el.id = "rt-run"; el.className = "rt-run"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true");
  document.body.appendChild(el);
  run = { r, phases: phasesOf(r), i: -1, el, startedAt: Date.now(), paused: false, remaining: 0, endsAt: 0, lastBeep: null, timer: null, audio: null, wake: null };
  try { run.audio = new (window.AudioContext || window.webkitAudioContext)(); } catch { /* sin sonido */ }
  navigator.wakeLock?.request("screen").then(w => { if (run) run.wake = w; else w.release(); }).catch(() => {});
  el.addEventListener("click", onRunClick);
  next();
  run.timer = setInterval(tick, 200);
}

function next() {
  run.i++;
  run.lastBeep = null;
  if (run.i >= run.phases.length) return finish();
  const p = run.phases[run.i];
  if (p.secs) { run.remaining = p.secs; run.endsAt = Date.now() + p.secs * 1000; }
  if (p.type !== "rest") beep(1320, 0.25);
  paint();
}

function tick() {
  if (!run || run.paused || run.done) return;
  const p = run.phases[run.i];
  if (!p?.secs) return;
  run.remaining = (run.endsAt - Date.now()) / 1000;
  const whole = Math.ceil(run.remaining);
  if (whole <= 3 && whole > 0 && run.lastBeep !== whole) { run.lastBeep = whole; beep(880, 0.1); }
  if (run.remaining <= 0) { beep(1320, 0.35); next(); return; }
  paintTime();
}

const R = 108, C = 2 * Math.PI * R;
function paint() {
  const p = run.phases[run.i];
  const doneSteps = run.phases.slice(0, run.i).filter(x => x.type !== "rest").length;
  const totalSteps = run.r.steps.length;
  const upcoming = run.phases.slice(run.i + 1).find(x => x.type !== "rest")?.step;
  const label = p.type === "rest" ? "Descanso" : p.step.name;
  const color = p.type === "rest" ? "var(--cyan)" : "var(--hab)";
  run.el.innerHTML = `
    <div class="rt-top"><span class="num">${Math.min(doneSteps + (p.type === "rest" ? 0 : 1), totalSteps)} / ${totalSteps}</span><button class="icon-btn" type="button" data-rt="close" aria-label="Salir">✕</button></div>
    <div class="rt-body" style="--c:${color}">
      <small class="rt-kind">${p.type === "rest" ? "Respira" : p.type === "reps" ? "Repeticiones" : "Aguanta"}</small>
      <h2 class="rt-name">${esc(label)}</h2>
      ${p.type === "reps" ? `<div class="rt-reps"><b class="num">${p.step.reps}</b><small>repeticiones</small></div>
        <button class="btn primary rt-big" type="button" data-rt="done">Hecho</button>`
      : `<svg class="rt-ring" viewBox="0 0 240 240" aria-hidden="true"><circle cx="120" cy="120" r="${R}" class="bg"/><circle cx="120" cy="120" r="${R}" class="fg" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="0" transform="rotate(-90 120 120)"/></svg>
        <div class="rt-time num" id="rt-time">${fmtClock(run.remaining)}</div>`}
      <p class="rt-next">${p.type === "rest" ? `Siguiente: <b>${esc(p.next.name)}</b> · ${stepText(p.next)}` : upcoming ? `Después: ${esc(upcoming.name)}` : "¡Es el último!"}</p>
    </div>
    ${p.type === "reps" ? `<div class="rt-ctrl"><button class="btn" type="button" data-rt="skip">Saltar</button></div>`
      : `<div class="rt-ctrl"><button class="btn" type="button" data-rt="pause">${run.paused ? "Seguir" : "Pausa"}</button><button class="btn" type="button" data-rt="skip">${p.type === "rest" ? "Saltar descanso" : "Saltar"}</button></div>`}`;
  paintTime();
}

function paintTime() {
  const p = run.phases[run.i];
  if (!p?.secs) return;
  const t = run.el.querySelector("#rt-time"), fg = run.el.querySelector(".rt-ring .fg");
  if (t) t.textContent = fmtClock(run.remaining);
  if (fg) fg.setAttribute("stroke-dashoffset", (C * (1 - Math.max(0, run.remaining) / p.secs)).toFixed(1));
}

async function onRunClick(e) {
  const b = e.target.closest("[data-rt]");
  if (!b || !run) return;
  const a = b.dataset.rt;
  if (a === "pause") {
    if (run.paused) { run.paused = false; run.endsAt = Date.now() + run.remaining * 1000; }
    else { run.paused = true; run.remaining = (run.endsAt - Date.now()) / 1000; }
    paint();
  } else if (a === "skip" || a === "done") next();
  else if (a === "close") {
    if (run.done) return stop();
    const wasPaused = run.paused;
    if (!wasPaused) { run.paused = true; run.remaining = (run.endsAt - Date.now()) / 1000; }
    if (await confirmSheet({ title: "¿Dejar la rutina?", text: "No se guardará como hecha hoy.", ok: "Dejarla", danger: true })) stop();
    else if (run && !wasPaused) { run.paused = false; run.endsAt = Date.now() + run.remaining * 1000; }
  }
}

function finish() {
  run.done = true;
  clearInterval(run.timer);
  const secs = (Date.now() - run.startedAt) / 1000;
  update(s => completeRoutine(s, { secs }));
  const h = getState().habits.habits.find(x => x.id === ROUTINE_HABIT);
  const st = h ? streaks(getState(), h) : { current: 1 };
  run.el.innerHTML = `
    <div class="rt-top"><span></span><button class="icon-btn" type="button" data-rt="close" aria-label="Cerrar">✕</button></div>
    <div class="rt-body" style="--c:var(--fin)">
      <div class="rt-check">${icon.check}</div>
      <h2 class="rt-name">¡Rutina hecha!</h2>
      <p class="rt-next">${fmtDuration(secs)} · ${st.current} ${st.current === 1 ? "día seguido" : "días seguidos"}</p>
    </div>
    <div class="rt-ctrl"><button class="btn primary rt-big" type="button" data-rt="close">Cerrar</button></div>`;
}

function stop() {
  if (!run) return;
  clearInterval(run.timer);
  run.wake?.release?.().catch?.(() => {});
  run.audio?.close?.().catch?.(() => {});
  run.el.remove();
  run = null;
}

/** Deshacer la subida de esta semana */
export function undoRoutineUp() {
  let ok = false;
  update(s => { ok = undoProgression(s); });
  toast(ok ? "Subida deshecha: vuelve a como estaba" : "No hay ninguna subida que deshacer");
}
