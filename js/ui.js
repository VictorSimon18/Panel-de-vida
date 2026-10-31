// Utilidades de interfaz: escape de HTML, formatos, hoja inferior y avisos.

export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
export const money = n => eur.format(n || 0);
export const int = n => new Intl.NumberFormat("es-ES").format(n || 0);

export const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
export const longDate = (d = new Date()) =>
  new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric" }).format(d);
export const monthName = (d = new Date()) =>
  new Intl.DateTimeFormat("es-ES", { month: "long" }).format(d);
export const daysSince = iso => iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : Infinity;

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ---------- Avisos breves
export function toast(msg, { error = false, ms = 2600 } = {}) {
  const root = document.getElementById("toast-root");
  const el = document.createElement("div");
  el.className = "toast" + (error ? " error" : "");
  el.textContent = msg;
  root.replaceChildren(el);
  setTimeout(() => el.remove(), ms);
}

// ---------- Hoja inferior
let closeCurrent = null;

export function openSheet(html, { onOpen, onClose } = {}) {
  closeSheet();
  const root = document.getElementById("sheet-root");
  root.innerHTML = `<div class="sheet-backdrop" data-close></div>
    <div class="sheet" role="dialog" aria-modal="true"><div class="grabber"></div>${html}</div>`;
  const sheet = root.querySelector(".sheet");
  const onKey = e => { if (e.key === "Escape") closeSheet(); };
  root.addEventListener("click", e => { if (e.target.closest("[data-close]")) closeSheet(); });
  document.addEventListener("keydown", onKey);
  closeCurrent = () => {
    document.removeEventListener("keydown", onKey);
    root.innerHTML = "";
    onClose?.();
  };
  onOpen?.(sheet);
  sheet.querySelector("button, input, a")?.focus({ preventScroll: true });
  return sheet;
}

export function closeSheet() {
  const fn = closeCurrent;
  closeCurrent = null;
  fn?.();
}

// Confirmación dentro de la app (sustituye a confirm())
export function confirmSheet({ title, text, ok = "Confirmar", danger = false }) {
  return new Promise(resolve => {
    let answered = false;
    openSheet(`
      <h2>${esc(title)}</h2>
      <p>${esc(text)}</p>
      <div class="btn-row">
        <button class="btn" type="button" data-close>Cancelar</button>
        <button class="btn ${danger ? "danger" : "primary"}" type="button" id="confirm-ok">${esc(ok)}</button>
      </div>`, {
      onOpen: s => s.querySelector("#confirm-ok").addEventListener("click", () => { answered = true; closeSheet(); resolve(true); }),
      onClose: () => { if (!answered) resolve(false); }
    });
  });
}

export const icon = {
  gear: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
  money: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h18v12H3z"/><path d="M3 11h18"/><circle cx="16" cy="15" r="1.2"/></svg>',
  habit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>',
  task: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',
  dumbbell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/></svg>'
};
