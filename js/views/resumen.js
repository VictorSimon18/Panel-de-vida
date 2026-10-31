// Pantalla de resumen (variante A · HUD compacto)

import { AREAS, levelFromXp, titleFor } from "../game.js";
import { esc, int, money, longDate, monthName, icon } from "../ui.js";
import { backupDue } from "../backup.js";

export function render(state) {
  const g = state.game;
  const lv = levelFromXp(g.xp);
  const streak = 0; // se calcula en la fase de hábitos

  const areaLevels = Object.values(AREAS).map(a => {
    const al = levelFromXp(g.areaXp[a.key] || 0);
    return `<div style="--c:${a.color}"><div class="lbl">${a.short}</div><div class="lv">Nv. ${al.level}</div><div class="mini"><i style="width:${al.pct}%"></i></div></div>`;
  }).join("");

  const backup = backupDue(state) ? `
    <div class="banner" style="--c:var(--warn)">
      <div class="t"><b>Haz una copia de seguridad</b>${state.settings.lastBackupAt ? "Hace más de 7 días de la última." : "Todavía no has exportado ninguna."} En iPhone es la forma de no perder tus datos.</div>
      <a class="btn small" href="#ajustes">Copiar</a>
    </div>` : "";

  return `
    <header class="topbar">
      <a class="logo" href="#resumen" aria-label="Resumen">PV</a>
      <div class="who"><div class="alias">${esc(state.profile.alias)}</div><div class="title">${titleFor(lv.level)} · Nv. ${lv.level}</div></div>
      <div class="streak" title="Racha de días">🔥 ${streak}</div>
      <a class="icon-btn" href="#ajustes" aria-label="Ajustes">${icon.gear}</a>
    </header>

    ${backup}

    <section class="card" style="display:grid;gap:8px" aria-label="Experiencia">
      <div class="xpmeta"><span>XP global</span><span class="num">${int(lv.into)} / ${int(lv.need)}</span></div>
      <div class="xpbar"><i style="width:${lv.pct}%"></i></div>
      <div class="area-levels">${areaLevels}</div>
    </section>

    <section class="card">
      <h2 class="card-h">Hoy · ${longDate()} <a href="#agenda">Agenda</a></h2>
      <div class="empty">No hay tareas ni eventos para hoy.<br>Pulsa <b>+</b> para añadir el primero.</div>
    </section>

    <section class="card">
      <h2 class="card-h">Hábitos de hoy <a href="#habitos">Hábitos</a></h2>
      <div class="empty">Aún no tienes hábitos.<br>Los crearás en la sección <b>Hábitos</b>.</div>
    </section>

    <section class="card">
      <h2 class="card-h">Dinero · ${monthName()} <a href="#finanzas">Ver</a></h2>
      <div class="num" style="font-size:var(--fs-xxl);font-weight:800;letter-spacing:-.02em;margin-top:6px;color:var(--fin);text-shadow:0 0 16px rgba(57,255,156,.35)">${money(0)}</div>
      <div class="empty">Crea tus cuentas en <b>Finanzas</b> para ver aquí el saldo, lo ingresado, lo gastado y los próximos cargos fijos.</div>
    </section>

    <section class="card">
      <h2 class="card-h">Tu semana</h2>
      <div class="empty">Aquí verás tus horas de trabajo y estudio, y tu sueño, de lunes a domingo.</div>
    </section>`;
}
