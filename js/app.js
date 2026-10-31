// Punto de entrada: carga los datos, enruta entre pantallas y registra el modo sin conexión.

import { loadState, getState, subscribe } from "./state.js";
import { initQuickAdd } from "./quickadd.js";
import { requestPersistence } from "./db.js";
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
  route.view.mount?.(viewEl, getState());
  document.title = name === "resumen" ? "Panel de Vida" : `${route.title} · Panel de Vida`;

  document.querySelectorAll(".tab").forEach(t => {
    if (t.dataset.area === route.area) t.setAttribute("aria-current", "page");
    else t.removeAttribute("aria-current");
  });
  if (changed || scrollTop) window.scrollTo(0, 0);
}

async function start() {
  await loadState();
  initQuickAdd();
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

// Modo sin conexión
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(console.error));
}
