// Formularios del área Fútbol: partido (con resultado y tus estadísticas) y entreno.

import { getState, update } from "../state.js";
import { openSheet, closeSheet, toast, confirmSheet, esc, uid } from "../ui.js";
import { iso } from "../stats.js";
import { seg, field } from "../forms.js";
import { COMPS, POSITIONS, RESULT, resultOf, lastMatchDefaults } from "../futbol.js";

const parseNum = s => { const t = String(s ?? "").trim().replace(",", "."); const v = Number(t); return t && Number.isFinite(v) ? v : null; };
const counter = (id, label, value) => `<div class="field fb-counter"><label for="${id}">${label}</label>
  <div class="counter"><button class="btn small" type="button" data-step="-1" data-for="${id}" aria-label="Menos">−</button>
  <input class="input num" id="${id}" inputmode="numeric" autocomplete="off" value="${value ?? 0}">
  <button class="btn small" type="button" data-step="1" data-for="${id}" aria-label="Más">+</button></div></div>`;

// ---------- Partido
export function openMatchForm(id = null) {
  const m = id ? getState().habits.workouts.find(x => x.id === id) : null;
  const def = lastMatchDefaults(getState());
  const v = (k, d) => m?.[k] ?? d;
  const sheet = openSheet(`
    <h2>${m ? "Editar partido" : "Nuevo partido"}</h2>
    <form class="form" id="mt-form" novalidate>
      <div class="row2">
        ${field("Fecha", "mt-date", `<input class="input" type="date" id="mt-date" value="${v("date", iso())}">`)}
        ${field("Rival", "mt-rival", `<input class="input" id="mt-rival" maxlength="40" autocomplete="off" value="${esc(v("rival", ""))}" placeholder="p. ej. CD Ejemplo">`)}
      </div>
      <div class="field"><label>Competición</label>${seg("comp", COMPS, v("comp", def.comp))}</div>
      <div class="field"><label>Campo</label>${seg("venue", { local: "Local", visitante: "Visitante" }, v("venue", "local"))}</div>
      <div class="field"><label>Resultado (tu equipo – rival)</label>
        <div class="score-row">
          <input class="input num" id="mt-gf" inputmode="numeric" autocomplete="off" value="${m?.gf ?? ""}" placeholder="0" aria-label="Goles de tu equipo">
          <span>–</span>
          <input class="input num" id="mt-ga" inputmode="numeric" autocomplete="off" value="${m?.ga ?? ""}" placeholder="0" aria-label="Goles del rival">
          <b class="score-res" id="mt-res"></b>
        </div>
      </div>

      <h3 class="form-h">Tu partido</h3>
      <div class="field"><label>Has jugado de</label>${seg("starter", { si: "Titular", no: "Suplente" }, v("starter", def.starter) ? "si" : "no")}</div>
      ${field("Minutos jugados", "mt-min", `<input class="input" id="mt-min" inputmode="numeric" autocomplete="off" value="${m?.minutes || ""}" placeholder="90">`)}
      <div class="quick-add" id="mt-mins">${[90, 80, 70, 60, 45, 30, 15].map(x => `<button class="chip" type="button" data-min="${x}">${x}</button>`).join("")}</div>
      <div class="row2">
        ${counter("mt-goals", "Goles", m?.goals ?? 0)}
        ${counter("mt-assists", "Asistencias", m?.assists ?? 0)}
      </div>
      ${field("Posición", "mt-pos", `<select class="input" id="mt-pos"><option value="">Sin indicar</option>${Object.entries(POSITIONS).map(([k, l]) => `<option value="${k}"${k === v("position", def.position) ? " selected" : ""}>${l}</option>`).join("")}</select>`)}
      <div class="field"><label>Tarjetas</label>${seg("cards", { 0: "Ninguna", 1: "Amarilla", 2: "Doble", r: "Roja" }, m?.red && !(m?.yellow >= 2) ? "r" : String(Math.min(2, m?.yellow || 0)))}</div>
      <div class="field"><label for="mt-rating">Tu nota: <b id="mt-rating-v" class="num">${m?.rating ? String(m.rating).replace(".", ",") : "sin nota"}</b></label>
        <input type="range" id="mt-rating" min="0" max="10" step="0.5" value="${m?.rating || 0}" class="range">
        <div class="range-ends"><span>Sin nota</span><span>10</span></div>
      </div>
      ${field("Comentario (opcional)", "mt-note", `<input class="input" id="mt-note" maxlength="120" autocomplete="off" value="${esc(m?.note || "")}" placeholder="p. ej. Gol de cabeza en el 85'">`)}
      <div class="btn-row">
        ${m ? `<button class="btn danger" type="button" id="mt-del">Borrar</button>` : `<button class="btn" type="button" data-close>Cancelar</button>`}
        <button class="btn primary" type="submit">Guardar</button>
      </div>
    </form>`);
  const form = sheet.querySelector("#mt-form");
  const $ = s => form.querySelector(s);

  const paintRes = () => {
    const r = resultOf({ gf: parseNum($("#mt-gf").value), ga: parseNum($("#mt-ga").value) });
    $("#mt-res").textContent = r ? RESULT[r] : "";
    $("#mt-res").dataset.r = r || "";
  };
  paintRes();
  form.addEventListener("input", e => {
    if (e.target.id === "mt-gf" || e.target.id === "mt-ga") paintRes();
    if (e.target.id === "mt-rating") $("#mt-rating-v").textContent = Number(e.target.value) ? String(e.target.value).replace(".", ",") : "sin nota";
  });
  form.addEventListener("click", e => {
    const mb = e.target.closest("[data-min]");
    if (mb) $("#mt-min").value = mb.dataset.min;
    const sb = e.target.closest("[data-step]");
    if (sb) { const inp = $("#" + sb.dataset.for); inp.value = Math.max(0, (parseInt(inp.value, 10) || 0) + Number(sb.dataset.step)); }
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    const minutes = parseNum($("#mt-min").value);
    if (!(minutes >= 0) || minutes > 150) { toast("Indica los minutos que has jugado", { error: true }); return; }
    const gf = parseNum($("#mt-gf").value), ga = parseNum($("#mt-ga").value);
    if ((gf == null) !== (ga == null)) { toast("Pon los goles de los dos equipos (o deja el resultado vacío)", { error: true }); return; }
    const goals = parseInt($("#mt-goals").value, 10) || 0, assists = parseInt($("#mt-assists").value, 10) || 0;
    if (gf != null && goals > gf) { toast("Has marcado más goles que tu equipo: revisa el resultado", { error: true }); return; }
    const cards = form.querySelector("[name=cards]:checked").value;
    const rating = Number($("#mt-rating").value) || null;
    const data = {
      type: "futbol", kind: "partido", date: $("#mt-date").value || iso(), minutes: Math.round(minutes),
      rival: $("#mt-rival").value.trim(), comp: form.querySelector("[name=comp]:checked").value,
      venue: form.querySelector("[name=venue]:checked").value, gf, ga, goals, assists,
      starter: form.querySelector("[name=starter]:checked").value === "si",
      yellow: cards === "r" ? 0 : Number(cards), red: cards === "r" || cards === "2",
      position: $("#mt-pos").value || null, rating, note: $("#mt-note").value.trim()
    };
    update(st => {
      if (m) Object.assign(st.habits.workouts.find(x => x.id === m.id), data);
      else st.habits.workouts.push({ id: uid(), ...data });
    });
    closeSheet();
    const r = resultOf(data);
    toast(m ? "Partido actualizado" : `Partido guardado${r ? ` · ${RESULT[r].toLowerCase()} ${gf}-${ga}` : ""}${goals ? ` · ${goals} ${goals === 1 ? "gol" : "goles"}` : ""}`);
  });
  sheet.querySelector("#mt-del")?.addEventListener("click", async () => {
    if (!await confirmSheet({ title: "¿Borrar este partido?", text: "No se puede deshacer.", ok: "Borrar", danger: true })) return;
    update(st => { st.habits.workouts = st.habits.workouts.filter(x => x.id !== m.id); });
    toast("Partido borrado");
  });
}

// ---------- Entreno
export function openTrainingForm(id = null) {
  const w = id ? getState().habits.workouts.find(x => x.id === id) : null;
  const sheet = openSheet(`
    <h2>${w ? "Editar entreno" : "Entreno de fútbol"}</h2>
    <form class="form" id="tr-form" novalidate>
      <div class="row2">
        ${field("Fecha", "tr-date", `<input class="input" type="date" id="tr-date" value="${w?.date || iso()}">`)}
        ${field("Minutos", "tr-min", `<input class="input" id="tr-min" inputmode="numeric" autocomplete="off" value="${w?.minutes || ""}" placeholder="90">`)}
      </div>
      <div class="quick-add">${[60, 75, 90, 120].map(x => `<button class="chip" type="button" data-min="${x}">${x} min</button>`).join("")}</div>
      ${field("Nota (opcional)", "tr-note", `<input class="input" id="tr-note" maxlength="80" autocomplete="off" value="${esc(w?.note || "")}" placeholder="p. ej. Táctica y finalización">`)}
      <div class="btn-row">
        ${w ? `<button class="btn danger" type="button" id="tr-del">Borrar</button>` : `<button class="btn" type="button" data-close>Cancelar</button>`}
        <button class="btn primary" type="submit">Guardar</button>
      </div>
    </form>`);
  const form = sheet.querySelector("#tr-form");
  form.querySelector(".quick-add").addEventListener("click", e => { const b = e.target.closest("[data-min]"); if (b) form.querySelector("#tr-min").value = b.dataset.min; });
  form.addEventListener("submit", e => {
    e.preventDefault();
    const minutes = parseNum(form.querySelector("#tr-min").value);
    if (!(minutes > 0)) { toast("Indica los minutos", { error: true }); return; }
    const data = { type: "futbol", kind: "entrenamiento", date: form.querySelector("#tr-date").value || iso(), minutes: Math.round(minutes), note: form.querySelector("#tr-note").value.trim() };
    update(st => {
      if (w) Object.assign(st.habits.workouts.find(x => x.id === w.id), data);
      else st.habits.workouts.push({ id: uid(), ...data });
    });
    closeSheet();
    toast(w ? "Entreno actualizado" : `Entreno de ${data.minutes} min apuntado`);
  });
  sheet.querySelector("#tr-del")?.addEventListener("click", async () => {
    if (!await confirmSheet({ title: "¿Borrar este entreno?", text: "No se puede deshacer.", ok: "Borrar", danger: true })) return;
    update(st => { st.habits.workouts = st.habits.workouts.filter(x => x.id !== w.id); });
    toast("Entreno borrado");
  });
}
