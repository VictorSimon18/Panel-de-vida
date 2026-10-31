// Service worker: guarda la app en caché para que funcione sin conexión.
// IMPORTANTE: sube VERSION cada vez que publiques cambios, para que el iPhone descargue la nueva versión.

const VERSION = "v0.2.0";
const CACHE = `panel-de-vida-${VERSION}`;

const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/tokens.css",
  "css/base.css",
  "css/components.css",
  "fonts/inter-latin.woff2",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
  "js/app.js",
  "js/db.js",
  "js/state.js",
  "js/game.js",
  "js/ui.js",
  "js/backup.js",
  "js/quickadd.js",
  "js/icons.js",
  "js/charts.js",
  "js/stats.js",
  "js/demo.js",
  "js/views/area.js",
  "js/views/resumen.js",
  "js/views/finanzas.js",
  "js/views/trabajo.js",
  "js/views/habitos.js",
  "js/views/agenda.js",
  "js/views/ajustes.js"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("panel-de-vida-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Primero la caché; si no está, red (y se guarda para la próxima vez)
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => req.mode === "navigate" ? caches.match("index.html") : Response.error()))
  );
});
