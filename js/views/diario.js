// Diario: escribir el día (texto, ánimo, etiquetas y foto), calendario del mes, «en este día» y buscador.

import { getState, update } from "../state.js";
import { esc, openSheet, closeSheet, toast, confirmSheet, uid } from "../ui.js";
import { icon } from "../icons.js";
import { iso, parseISO } from "../stats.js";
import { homeBtn } from "./area.js";
import { MOODS, MOOD_COLOR } from "../sport.js";
import { moodPicker } from "./habitos-forms.js";
import { entryOf, moodOf, hasContent, diaryStreak, onThisDay, searchDiary, allTags } from "../diary.js";
import { photoOf, setPhoto, removePhoto, shrinkPhoto, photoCount } from "../photos.js";

const ui = { ym: iso().slice(0, 7), q: "" };
const longDay = s => { const t = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(parseISO(s)); return t[0].toUpperCase() + t.slice(1); };
const shortDay = s => { const t = new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(parseISO(s)).replace(/\./g, ""); return t[0].toUpperCase() + t.slice(1); };
const monthLabel = ym => { const [y, m] = ym.split("-").map(Number); const s = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(new Date(y, m - 1, 1)); return s[0].toUpperCase() + s.slice(1); };
const shiftMonth = (ym, n) => { const [y, m] = ym.split("-").map(Number); return iso(new Date(y, m - 1 + n, 1)).slice(0, 7); };
const snippet = (t, n = 140) => { const s = String(t || "").trim().replace(/\s+/g, " "); return s.length > n ? s.slice(0, n - 1) + "…" : s; };

/** Fila de una entrada (para listas: recuerdos, búsqueda) */
export function entryRow(state, e, label = shortDay(e.date)) {
  const mood = moodOf(state, e.date), ph = photoOf(e.date);
  return `<button class="item tap diary-row" type="button" data-act="view-entry" data-date="${e.date}">
    ${ph ? `<img class="diary-thumb" src="${ph}" alt="">` : `<span class="diary-thumb none" style="--c:${mood ? MOOD_COLOR[mood] : "var(--muted)"}">${icon.book}</span>`}
    <span class="t">${esc(label)}${mood ? ` <span class="tag" style="--c:${MOOD_COLOR[mood]}">${MOODS[mood]}</span>` : ""}<small>${esc(snippet(e.text, 110)) || (e.tags?.length ? e.tags.map(t => "#" + esc(t)).join(" ") : "Solo foto")}</small></span>
  </button>`;
}

/** Tarjeta del Resumen: escribir hoy o lo escrito, y un recuerdo de este día */
export function diaryCard(state) {
  const today = iso();
  const e = entryOf(state, today);
  const mem = onThisDay(state, today)[0];
  const ph = e ? photoOf(today) : null;
  return `<section class="card diary-card">
    <h2 class="card-h"><span class="h-dot" style="--c:var(--cyan)"></span>Diario<span class="spacer"></span><a href="#diario">Abrir</a></h2>
    ${hasContent(e) ? `<button class="diary-today" type="button" data-act="view-entry" data-date="${today}">
        ${ph ? `<img src="${ph}" alt="">` : ""}<span>${esc(snippet(e.text, 160)) || "Hoy ya tienes tu entrada."}</span></button>`
      : `<button class="btn primary" type="button" data-act="write-today" style="width:100%;margin-top:10px">${icon.plus} ¿Qué tal hoy?</button>`}
    ${mem ? `<div class="diary-mem"><small>${mem.label}</small>${entryRow(state, mem.entry, shortDay(mem.entry.date))}</div>` : ""}
  </section>`;
}

// ---------- Pantalla
export function render(state) {
  const today = iso();
  const st = diaryStreak(state, today);
  const total = (state.diary || []).filter(hasContent).length;
  const mem = onThisDay(state, today);
  const e = entryOf(state, today);
  return `
    <header class="topbar">
      ${homeBtn()}
      <h1 class="page-h">Diario</h1>
    </header>

    <section class="card">
      <h2 class="card-h"><span class="h-dot" style="--c:var(--cyan)"></span>Hoy<span class="spacer"></span><small class="muted">${longDay(today)}</small></h2>
      ${hasContent(e) ? entryRow(state, e, "Tu entrada de hoy") : `<p class="hint" style="margin-top:8px">Una frase basta: qué has hecho, cómo te has sentido, algo que quieras recordar.</p>`}
      <button class="btn primary" type="button" data-act="write-today" style="width:100%;margin-top:10px">${hasContent(e) ? "Editar hoy" : `${icon.plus} Escribir hoy`}</button>
      <div class="week-stats">
        <div><b class="num" style="color:var(--cyan)">${st.current}</b><small>${st.current === 1 ? "día seguido" : "días seguidos"}</small></div>
        <div><b class="num">${total}</b><small>entradas</small></div>
        <div><b class="num">${photoCount()}</b><small>fotos</small></div>
      </div>
    </section>

    ${mem.length ? `<section class="card"><h2 class="card-h">En este día</h2>
      <div class="list">${mem.map(m => entryRow(state, m.entry, `${m.label} · ${shortDay(m.entry.date)}`)).join("")}</div></section>` : ""}

    <section class="card">
      <div class="month-nav" style="margin-top:0">
        <button class="icon-btn" type="button" data-act="month" data-n="-1" aria-label="Mes anterior">${icon.back}</button>
        <b>${monthLabel(ui.ym)}</b>
        <button class="icon-btn" type="button" data-act="month" data-n="1" aria-label="Mes siguiente"${ui.ym >= today.slice(0, 7) ? " disabled" : ""}>${icon.chevron}</button>
      </div>
      ${calendar(state, today)}
      <div class="legend">${Object.entries(MOODS).map(([v, l]) => `<span style="--c:${MOOD_COLOR[v]}">${l}</span>`).join("")}</div>
    </section>

    <section class="card">
      <div class="search"><span>${icon.search}</span><input class="input" type="search" id="diary-search" placeholder="Buscar en el diario…" autocomplete="off" value="${esc(ui.q)}" aria-label="Buscar en el diario"></div>
      ${allTags(state).length ? `<div class="tag-row" style="margin-top:8px">${allTags(state).slice(0, 12).map(t => `<button class="chip small" type="button" data-act="tag" data-tag="${esc(t)}">#${esc(t)}</button>`).join("")}</div>` : ""}
      <div id="diary-results">${ui.q.trim() ? results(state) : ""}</div>
    </section>`;
}

function calendar(state, today) {
  const [y, m] = ui.ym.split("-").map(Number);
  const first = new Date(y, m - 1, 1), days = new Date(y, m, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  let cells = Array.from({ length: lead }, () => `<span class="cal-cell empty"></span>`).join("");
  for (let d = 1; d <= days; d++) {
    const date = `${ui.ym}-${String(d).padStart(2, "0")}`;
    const e = entryOf(state, date), mood = moodOf(state, date), ph = hasContent(e) ? photoOf(date) : null;
    const future = date > today;
    cells += `<button class="cal-cell${hasContent(e) ? " has" : ""}${date === today ? " today" : ""}" type="button" data-act="${future ? "" : "view-entry"}" data-date="${date}"${future ? " disabled" : ""}
      style="${mood ? `--c:${MOOD_COLOR[mood]};` : ""}${ph ? `background-image:url(${ph})` : ""}" aria-label="${shortDay(date)}${hasContent(e) ? ", con entrada" : ""}">
      <span>${d}</span>${hasContent(e) && !ph ? "<i></i>" : ""}</button>`;
  }
  return `<div class="cal-head">${["L", "M", "X", "J", "V", "S", "D"].map(x => `<span>${x}</span>`).join("")}</div><div class="cal-grid">${cells}</div>`;
}

function results(state) {
  const found = searchDiary(state, ui.q);
  if (!found.length) return `<div class="empty">Nada coincide con «${esc(ui.q.trim())}».</div>`;
  return `<p class="hint" style="margin-top:8px">${found.length} ${found.length === 1 ? "entrada" : "entradas"}</p><div class="list">${found.slice(0, 50).map(e => entryRow(state, e)).join("")}</div>`;
}

// ---------- Ver una entrada
export function viewEntry(date) {
  const s = getState();
  const e = entryOf(s, date);
  if (!hasContent(e)) { openEntryForm(date); return; }
  const mood = moodOf(s, date), ph = photoOf(date);
  const sheet = openSheet(`
    <h2>${longDay(date)}</h2>
    ${mood ? `<p><span class="tag" style="--c:${MOOD_COLOR[mood]}">${MOODS[mood]}</span></p>` : ""}
    ${ph ? `<img class="diary-photo" src="${ph}" alt="Foto del día">` : e.photoV ? `<p class="hint">La foto aún no ha llegado a este dispositivo; se descargará al sincronizar.</p>` : ""}
    ${e.text ? `<div class="diary-text">${esc(e.text).replace(/\n/g, "<br>")}</div>` : ""}
    ${e.tags?.length ? `<div class="tag-row" style="margin-top:10px">${e.tags.map(t => `<span class="tag" style="--c:var(--cyan)">#${esc(t)}</span>`).join("")}</div>` : ""}
    <div class="btn-row"><button class="btn" type="button" id="de-edit">Editar</button><button class="btn primary" type="button" data-close>Cerrar</button></div>`);
  sheet.querySelector("#de-edit").addEventListener("click", () => openEntryForm(date));
}

// ---------- Escribir o editar
export function openEntryForm(date = iso()) {
  const s = getState();
  const e = entryOf(s, date);
  let photo = photoOf(date);          // foto actual (o la nueva elegida)
  let photoChanged = false;
  const sheet = openSheet(`
    <h2>${date === iso() ? "Hoy" : longDay(date)}</h2>
    <form class="form" id="de-form" novalidate>
      <div class="field"><label>¿Cómo te has sentido?</label>${moodPicker(moodOf(s, date))}</div>
      <div class="field"><label for="de-text">¿Qué ha pasado hoy?</label>
        <textarea class="input" id="de-text" rows="6" maxlength="4000" placeholder="Escribe lo que quieras recordar…">${esc(e?.text || "")}</textarea></div>
      <div class="field"><label for="de-tags">Etiquetas (separadas por comas)</label>
        <input class="input" id="de-tags" autocomplete="off" value="${esc((e?.tags || []).join(", "))}" placeholder="p. ej. amigos, viaje, partido"></div>
      <div class="field"><label>Foto del día</label>
        <div class="de-photo" id="de-photo">${photo ? `<img src="${photo}" alt="">` : ""}</div>
        <div class="btn-row">
          <label class="btn" for="de-file">${photo ? "Cambiar foto" : "Añadir foto"}</label>
          <button class="btn" type="button" id="de-nophoto"${photo ? "" : " hidden"}>Quitar foto</button>
        </div>
        <input type="file" id="de-file" accept="image/*" hidden>
      </div>
      <div class="btn-row">
        ${hasContent(e) ? `<button class="btn danger" type="button" id="de-del">Borrar</button>` : `<button class="btn" type="button" data-close>Cancelar</button>`}
        <button class="btn primary" type="submit">Guardar</button>
      </div>
    </form>`);
  const form = sheet.querySelector("#de-form");
  const paintPhoto = () => {
    form.querySelector("#de-photo").innerHTML = photo ? `<img src="${photo}" alt="">` : "";
    form.querySelector("label[for=de-file]").textContent = photo ? "Cambiar foto" : "Añadir foto";
    form.querySelector("#de-nophoto").hidden = !photo;
  };
  form.querySelector("#de-file").addEventListener("change", async ev => {
    const f = ev.target.files?.[0];
    if (!f) return;
    try { photo = await shrinkPhoto(f); photoChanged = true; paintPhoto(); }
    catch { toast("No se pudo leer esa imagen", { error: true }); }
  });
  form.querySelector("#de-nophoto").addEventListener("click", () => { photo = null; photoChanged = true; paintPhoto(); });

  form.addEventListener("submit", async ev => {
    ev.preventDefault();
    const text = form.querySelector("#de-text").value.trim();
    const tags = [...new Set(form.querySelector("#de-tags").value.split(",").map(t => t.trim().replace(/^#/, "").toLowerCase()).filter(Boolean))].slice(0, 10);
    const mood = Number(form.querySelector("[name=mood]:checked")?.value || 0);
    if (!text && !tags.length && !photo && !mood) { toast("Escribe algo, elige el ánimo o añade una foto", { error: true }); return; }
    let photoV = e?.photoV || null;
    if (photoChanged) photoV = photo ? await setPhoto(date, photo) : (await removePhoto(date), null);
    update(st => {
      st.diary ||= [];
      const cur = st.diary.find(x => x.date === date);
      const data = { text, tags, photoV, updatedAt: new Date().toISOString() };
      if (cur) Object.assign(cur, data); else st.diary.push({ id: uid(), date, ...data });
      const prev = st.habits.mood.find(x => x.date === date);
      st.habits.mood = st.habits.mood.filter(x => x.date !== date);
      if (mood) st.habits.mood.push({ id: prev?.id || uid(), date, value: mood, note: prev?.note || "" });
    });
    closeSheet();
    toast(hasContent(e) ? "Entrada actualizada" : "Guardado en tu diario");
  });
  sheet.querySelector("#de-del")?.addEventListener("click", async () => {
    if (!await confirmSheet({ title: "¿Borrar la entrada de este día?", text: "Se borran el texto, las etiquetas y la foto. El ánimo se mantiene.", ok: "Borrar", danger: true })) return;
    await removePhoto(date);
    update(st => { st.diary = (st.diary || []).filter(x => x.date !== date); });
    toast("Entrada borrada");
  });
}

export function mount(root, _state, signal) {
  root.addEventListener("click", ev => {
    const b = ev.target.closest("[data-act]");
    if (!b || !b.dataset.act) return;
    const rerender = () => window.dispatchEvent(new Event("pv:render"));
    switch (b.dataset.act) {
      case "write-today": openEntryForm(iso()); break;
      case "view-entry": viewEntry(b.dataset.date); break;
      case "month": ui.ym = shiftMonth(ui.ym, Number(b.dataset.n)); rerender(); break;
      case "tag": ui.q = b.dataset.tag; root.querySelector("#diary-search").value = ui.q; paint(root); break;
    }
  }, { signal });
  root.querySelector("#diary-search")?.addEventListener("input", ev => { ui.q = ev.target.value; paint(root); }, { signal });
}

function paint(root) { root.querySelector("#diary-results").innerHTML = ui.q.trim() ? results(getState()) : ""; }
