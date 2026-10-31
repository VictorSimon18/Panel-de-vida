// Punto de entrada: carga los datos, enruta entre pantallas y registra el modo sin conexión.

import { loadState, getState, subscribe, update } from "./state.js";
import { ensureFinance } from "./finance.js";
import { initQuickAdd } from "./quickadd.js";
import { requestPersistence } from "./db.js";
import { toast } from "./ui.js";
import * as resumen from "./views/resumen.js";
import * as finanzas from "./views/finanzas.js";
import * as trabajo from "./views/trabajo.js";
import * as habitos from "./views/habitos.js";
import * as agenda from "./views/agenda.js";
import * as ajustes from "./views/ajustes.js";

const ROUTES = {
  resumen:  { view: resumen,  title: "Resumen" },
  finanzas: { view: finanzas, title: "Finanzas",           area: "fin" },
  trabajo:  { view: trabajo,  title: "Trabajo y estudios", area: "work" },
  habitos:  { view: habitos,  title: "Hábitos y deporte",  area: "hab" },
  agenda:   { view: agenda,   title: "Agenda",             area: "ag" },
  ajustes:  { view: ajustes,  title: "Ajustes" }
};

const viewEl = document.getElementById("view");
let currentRoute = null;
let mountCtl = null;

const routeName = () => {
  const r = location.hash.replace("#", "");
  return ROUTES[r] ? r : "resumen";
};

function render({ scrollTop = false } = {}) {
  const name = routeName();
  const route = ROUTES[name];
  const changed = name !== currentRoute;
  currentRoute = name;

  viewEl.classList.toggle("enter", changed);
  viewEl.innerHTML = route.view.render(getState());
  mountCtl?.abort();
  mountCtl = new AbortController();
  route.view.mount?.(viewEl, getState(), mountCtl.signal);
  document.title = name === "resumen" ? "Panel de Vida" : `${route.title} · Panel de Vida`;

  document.querySelectorAll(".tab").forEach(t => {
    if (t.dataset.area === route.area) t.setAttribute("aria-current", "page");
    else t.removeAttribute("aria-current");
  });
  if (changed || scrollTop) window.scrollTo(0, 0);
}

async function start() {
  await loadState();
  // Categorías por defecto y gastos fijos que hayan vencido desde la última vez
  update(s => { ensureFinance(s); });
  initQuickAdd();
  // Las vistas pueden pedir repintarse al cambiar su estado interno (pestaña, mes…)
  window.addEventListener("pv:render", () => { const y = window.scrollY; render(); window.scrollTo(0, y); });
  window.addEventListener("hashchange", () => render({ scrollTop: true }));
  // Al cambiar los datos, se vuelve a pintar la pantalla actual sin mover el scroll
  subscribe(() => {
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
  });
  render();
  requestPersistence();
}

start().catch(err => {
  console.error(err);
  viewEl.innerHTML = `<div class="card"><h2 class="card-h">No se pudo abrir la app</h2><p class="muted">${String(err.message || err)}</p></div>`;
});

// Modo sin conexión y actualizaciones automáticas
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  // Cuando se publica una versión nueva, el service worker la instala y la app se recarga sola
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || reloading) return;
    reloading = true;
    try { sessionStorage.setItem("pv-updated", "1"); } catch { /* sin almacenamiento */ }
    location.reload();
  });
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").then(reg => {
      // Comprobar si hay versión nueva cada vez que la app vuelve a primer plano
      document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") reg.update().catch(() => {}); });
    }).catch(console.error);
  });
  try {
    if (sessionStorage.getItem("pv-updated")) {
      sessionStorage.removeItem("pv-updated");
      setTimeout(() => toast("App actualizada a la última versión"), 600);
    }
  } catch { /* sin almacenamiento */ }
}
