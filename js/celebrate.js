// Celebraciones: burbuja "+XP", pantalla de subida de nivel con confeti y avisos de logro.
// Se muestran en cola, una detrás de otra. Respetan "reducir movimiento" del sistema.

import { AREAS } from "./game.js";
import { esc } from "./ui.js";
import { icon } from "./icons.js";

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const queue = [];
let busy = false;

/** Burbuja flotante "+15 XP" */
export function xpPop(n) {
  if (!(n > 0)) return;
  const el = document.createElement("div");
  el.className = "xp-pop";
  el.textContent = `+${n} XP`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

/** Recibe los eventos de syncGame y los encola */
export function celebrate(events) {
  if (!events?.length) return;
  // primero la subida de nivel global, luego áreas y logros; los logros que llegan juntos van en un solo aviso
  const achs = events.filter(e => e.type === "achievement");
  const rest = events.filter(e => e.type !== "achievement").sort((a, b) => (a.type === "level" ? -1 : 0) - (b.type === "level" ? -1 : 0));
  queue.push(...rest);
  if (achs.length === 1) queue.push(achs[0]);
  else if (achs.length > 1) queue.push({ type: "achievements", list: achs.map(e => e.achievement) });
  if (!busy) next();
}

function next() {
  const ev = queue.shift();
  if (!ev) { busy = false; return; }
  busy = true;
  if (ev.type === "level") levelUp(ev, next);
  else if (ev.type === "area") banner({
    color: AREAS[ev.areas[0].area].hex,
    kicker: "Subida de nivel",
    title: ev.areas.map(u => `${AREAS[u.area].short} · Nv. ${u.level}`).join("  ·  "),
    text: "Sigue así en esta área."
  }, next);
  else if (ev.type === "achievement") {
    const a = ev.achievement;
    banner({ color: a.area === "all" ? "#22e5ff" : AREAS[a.area].hex, kicker: "Logro desbloqueado", title: a.name, text: a.desc, trophy: true }, next);
  } else if (ev.type === "achievements") {
    banner({ color: "#22e5ff", kicker: `${ev.list.length} logros desbloqueados`, title: ev.list.map(a => a.name).join(" · "), text: "Míralos en la pantalla de Logros.", trophy: true }, next);
  } else next();
}

// ---------- Aviso compacto (logros y niveles de área)
function banner({ color, kicker, title, text, trophy }, done) {
  const el = document.createElement("div");
  el.className = "celebrate-banner";
  el.style.setProperty("--c", color);
  el.setAttribute("role", "status");
  el.innerHTML = `
    <span class="cb-ico">${trophy ? icon.trophy : icon.bolt}</span>
    <span class="cb-t"><small>${esc(kicker)}</small><b>${esc(title)}</b><span>${esc(text)}</span></span>`;
  document.body.appendChild(el);
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    el.classList.add("out");
    setTimeout(() => { el.remove(); done(); }, reduced() ? 0 : 250);
  };
  el.addEventListener("click", close);
  setTimeout(close, 3000);
}

// ---------- Pantalla de subida de nivel global
function levelUp(ev, done) {
  const el = document.createElement("div");
  el.className = "levelup";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", `Has subido al nivel ${ev.level}`);
  el.innerHTML = `
    <canvas class="confetti" aria-hidden="true"></canvas>
    <div class="lu-box">
      <small class="lu-kicker">¡Subida de nivel!</small>
      <div class="lu-level"><span>Nv.</span><b class="num">${ev.level}</b></div>
      ${ev.newTitle ? `<p class="lu-title">Nuevo título: <b>${esc(ev.title)}</b></p>` : `<p class="lu-title">${esc(ev.title)}</p>`}
      ${ev.areas.length ? `<div class="lu-areas">${ev.areas.map(u => `<span class="tag" style="--c:${AREAS[u.area].hex}">${AREAS[u.area].short} · Nv. ${u.level}</span>`).join("")}</div>` : ""}
      <button class="btn primary" type="button">Continuar</button>
    </div>`;
  document.body.appendChild(el);
  const btn = el.querySelector("button");
  btn.focus({ preventScroll: true });
  const stop = reduced() ? () => {} : confetti(el.querySelector("canvas"));
  const close = () => {
    stop();
    el.classList.add("out");
    setTimeout(() => { el.remove(); done(); }, reduced() ? 0 : 250);
  };
  btn.addEventListener("click", close);
  // tocar el fondo también cierra
  el.addEventListener("click", e => { if (!e.target.closest(".lu-box")) close(); });
  el.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
}

// Confeti neón dibujado en canvas (sin librerías)
function confetti(canvas) {
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const resize = () => { canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr; };
  resize();
  const colors = ["#22e5ff", "#39ff9c", "#ff3d9a", "#ffb020", "#4d8bff", "#e8f1ff"];
  const parts = Array.from({ length: 140 }, () => ({
    x: innerWidth / 2 + (Math.random() - .5) * 80, y: innerHeight * .42,
    vx: (Math.random() - .5) * 11, vy: -Math.random() * 13 - 4,
    w: 4 + Math.random() * 6, h: 6 + Math.random() * 10, r: Math.random() * Math.PI, vr: (Math.random() - .5) * .3,
    c: colors[Math.floor(Math.random() * colors.length)]
  }));
  let raf, t0 = performance.now();
  const tick = now => {
    const t = (now - t0) / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += .32; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.globalAlpha = Math.max(0, 1 - t / 3.2);
      ctx.fillStyle = p.c; ctx.shadowColor = p.c; ctx.shadowBlur = 8;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (t < 3.3) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  addEventListener("resize", resize);
  return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); };
}
