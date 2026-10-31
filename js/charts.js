// Gráficos en SVG dibujados a mano (sin librerías).
// Todos usan una única escala por eje y colores tomados de los tokens.

const r1 = n => Math.round(n * 10) / 10;

/**
 * Barras semanales con línea superpuesta opcional.
 * bars/line: arrays de 7 valores (null = sin dato). today: índice del día actual (0 = lunes).
 */
export function weekChart({ bars, line, labels, today = -1, barColor = "#4d8bff", lineColor = "#22e5ff", max, unit = "h" }) {
  const w = 330, h = 140, pad = { l: 24, r: 8, t: 12, b: 22 };
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const all = [...bars, ...(line || [])].filter(v => v != null);
  const top = max ?? Math.max(4, Math.ceil(Math.max(0, ...all) / 2) * 2);
  const y = v => pad.t + ih - (v / top) * ih;
  const slot = iw / 7, bw = slot * .5;
  const cx = i => pad.l + slot * i + slot / 2;

  let g = "";
  // rejilla: 0, mitad y máximo
  [0, top / 2, top].forEach(v => {
    g += `<line x1="${pad.l}" x2="${w - pad.r}" y1="${r1(y(v))}" y2="${r1(y(v))}" stroke="rgba(120,170,255,.1)"/>`;
    g += `<text x="${pad.l - 6}" y="${r1(y(v) + 3)}" font-size="9" fill="#56668f" text-anchor="end">${r1(v)}</text>`;
  });
  // barras
  bars.forEach((v, i) => {
    const isToday = i === today;
    if (v != null && v > 0) {
      g += `<rect x="${r1(cx(i) - bw / 2)}" y="${r1(y(v))}" width="${r1(bw)}" height="${r1(y(0) - y(v))}" rx="3" fill="url(#wc-bar)"${isToday ? ` style="filter:drop-shadow(0 0 5px ${barColor})"` : ""}><title>${labels[i]}: ${r1(v)} ${unit}</title></rect>`;
    } else if (today === -1 || i <= today) {
      g += `<rect x="${r1(cx(i) - bw / 2)}" y="${r1(y(0) - 2)}" width="${r1(bw)}" height="2" rx="1" fill="rgba(120,170,255,.18)"/>`;
    }
    g += `<text x="${r1(cx(i))}" y="${h - 6}" font-size="10" text-anchor="middle" fill="${isToday ? "#e8f1ff" : "#8a9cc4"}" font-weight="${isToday ? 700 : 500}">${labels[i]}</text>`;
  });
  // línea
  if (line) {
    const pts = line.map((v, i) => v == null ? null : [cx(i), y(v)]);
    let d = "", pen = false;
    pts.forEach(p => { if (!p) { pen = false; return; } d += `${pen ? "L" : "M"}${r1(p[0])} ${r1(p[1])} `; pen = true; });
    if (d) g += `<path d="${d}" fill="none" stroke="${lineColor}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" style="filter:drop-shadow(0 0 4px ${lineColor})"/>`;
    const last = pts.reduce((a, p, i) => p ? i : a, -1);
    pts.forEach((p, i) => { if (p) g += `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="${i === last ? 3.5 : 2.2}" fill="${lineColor}"/>`; });
  }

  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Gráfico de la semana">
    <defs><linearGradient id="wc-bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${barColor}"/><stop offset="1" stop-color="${barColor}" stop-opacity=".25"/></linearGradient></defs>
    ${g}</svg>`;
}

/** Anillo de progreso (0–100) con texto central opcional. */
export function ring(pct, color, { size = 44, stroke = 5, label = "" } = {}) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, p = Math.max(0, Math.min(100, pct));
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r1(r)}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="${stroke}"/>
    ${p > 0 ? `<circle cx="${size / 2}" cy="${size / 2}" r="${r1(r)}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
      stroke-dasharray="${r1(c)}" stroke-dashoffset="${r1(c * (1 - p / 100))}" transform="rotate(-90 ${size / 2} ${size / 2})" style="filter:drop-shadow(0 0 3px ${color})"/>` : ""}
    ${label ? `<text x="50%" y="50%" dy=".35em" text-anchor="middle" font-size="${size * .26}" font-weight="700" fill="#e8f1ff">${label}</text>` : ""}
  </svg>`;
}

/** Gráfico de área con puntos [{ label, value }]. El eje Y se ajusta al rango de los datos. */
export function areaChart(points, { color = "#39ff9c", format = v => v, id = "ac" } = {}) {
  const w = 330, h = 136, pad = { l: 8, r: 8, t: 24, b: 22 };
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const vals = points.map(p => p.value);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (hi === lo) { hi += 1; lo -= 1; }
  const span = hi - lo; lo -= span * .15; hi += span * .1;
  const x = i => pad.l + (points.length === 1 ? iw / 2 : (iw * i) / (points.length - 1));
  const y = v => pad.t + ih - ((v - lo) / (hi - lo)) * ih;
  const line = points.map((p, i) => `${i ? "L" : "M"}${r1(x(i))} ${r1(y(p.value))}`).join(" ");
  const area = `${line} L${r1(x(points.length - 1))} ${pad.t + ih} L${r1(x(0))} ${pad.t + ih} Z`;
  const last = points.length - 1;
  // como mucho ~6 etiquetas en el eje X para que no se pisen
  const step = Math.max(1, Math.ceil(points.length / 6));
  const showLabel = i => i === last || (i % step === 0 && last - i >= step);
  let g = `<line x1="${pad.l}" x2="${w - pad.r}" y1="${pad.t + ih}" y2="${pad.t + ih}" stroke="rgba(120,170,255,.12)"/>`;
  g += `<path d="${area}" fill="url(#${id}-fill)"/>`;
  g += `<path d="${line}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" style="filter:drop-shadow(0 0 4px ${color})"/>`;
  points.forEach((p, i) => {
    g += `<circle cx="${r1(x(i))}" cy="${r1(y(p.value))}" r="${i === last ? 3.5 : 2}" fill="${color}"><title>${p.label}: ${format(p.value)}</title></circle>`;
    if (showLabel(i)) g += `<text x="${r1(x(i))}" y="${h - 6}" font-size="10" text-anchor="${i === 0 ? "start" : i === last ? "end" : "middle"}" fill="${i === last ? "#e8f1ff" : "#8a9cc4"}" font-weight="${i === last ? 700 : 500}">${p.label}</text>`;
  });
  // valor actual siempre arriba a la derecha, sin pisar la línea
  g += `<text x="${w - pad.r}" y="10" font-size="11" font-weight="700" text-anchor="end" fill="${color}">${format(points[last].value)}</text>`;
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Evolución">
    <defs><linearGradient id="${id}-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>${g}</svg>`;
}

/**
 * Barras apiladas. points: [{ label, values: [a, b, …] | null, highlight }]
 * (null = día futuro, sin barra). colors: un color por serie, de abajo arriba.
 */
export function stackChart(points, { colors = ["#4d8bff", "#22e5ff"], unit = "h", id = "sc", labelEvery = 1 } = {}) {
  const w = 330, h = 140, pad = { l: 24, r: 6, t: 12, b: 22 };
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const totals = points.map(p => p.values ? p.values.reduce((s, v) => s + (v || 0), 0) : 0);
  const top = Math.max(4, Math.ceil(Math.max(0, ...totals) / 2) * 2);
  const y = v => pad.t + ih - (v / top) * ih;
  const slot = iw / points.length, bw = Math.min(26, slot * .56);
  const cx = i => pad.l + slot * i + slot / 2;
  let g = "";
  [0, top / 2, top].forEach(v => {
    g += `<line x1="${pad.l}" x2="${w - pad.r}" y1="${r1(y(v))}" y2="${r1(y(v))}" stroke="rgba(120,170,255,.1)"/>`;
    g += `<text x="${pad.l - 6}" y="${r1(y(v) + 3)}" font-size="9" fill="#56668f" text-anchor="end">${r1(v)}</text>`;
  });
  points.forEach((p, i) => {
    const x0 = r1(cx(i) - bw / 2);
    if (p.values && totals[i] > 0) {
      let acc = 0;
      const n = p.values.length;
      p.values.forEach((v, k) => {
        if (!v) return;
        const y1 = y(acc + v), y0 = y(acc);
        const isTop = p.values.slice(k + 1).every(x => !x);
        g += `<rect x="${x0}" y="${r1(y1)}" width="${r1(bw)}" height="${r1(Math.max(1, y0 - y1))}" rx="${isTop ? 3 : 0}" fill="${colors[k % colors.length]}" fill-opacity="${k === 0 ? .85 : .9}"${p.highlight ? ` style="filter:drop-shadow(0 0 5px ${colors[k % colors.length]})"` : ""}/>`;
        acc += v;
      });
      g += `<rect x="${x0}" y="${r1(y(totals[i]))}" width="${r1(bw)}" height="${r1(y(0) - y(totals[i]))}" fill="transparent"><title>${p.label}: ${r1(totals[i])} ${unit}</title></rect>`;
    } else if (p.values) {
      g += `<rect x="${x0}" y="${r1(y(0) - 2)}" width="${r1(bw)}" height="2" rx="1" fill="rgba(120,170,255,.18)"/>`;
    }
    if (i % labelEvery === 0 || p.highlight) g += `<text x="${r1(cx(i))}" y="${h - 6}" font-size="10" text-anchor="middle" fill="${p.highlight ? "#e8f1ff" : "#8a9cc4"}" font-weight="${p.highlight ? 700 : 500}">${p.label}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Gráfico de horas">${g}</svg>`;
}

/**
 * Mapa de calor tipo calendario: columnas = semanas, filas = días (L…D).
 * days: [{ date, level: 0-4 | null }] en orden, empezando en lunes. color: color base.
 */
export function heatmap(days, { color = "#ff3d9a", today = null } = {}) {
  const weeks = Math.ceil(days.length / 7);
  const cell = 14, gap = 3, left = 14, topPad = 14;
  const w = left + weeks * (cell + gap), h = topPad + 7 * (cell + gap);
  const alpha = [0, .25, .5, .78, 1];
  let g = "";
  ["L", "", "X", "", "V", "", "D"].forEach((l, i) => { if (l) g += `<text x="0" y="${topPad + i * (cell + gap) + cell - 3}" font-size="9" fill="#56668f">${l}</text>`; });
  let lastMonth = null;
  days.forEach((d, i) => {
    const col = Math.floor(i / 7), row = i % 7;
    const x = left + col * (cell + gap), y = topPad + row * (cell + gap);
    const m = d.date.slice(5, 7);
    if (row === 0 && m !== lastMonth) {
      lastMonth = m;
      const name = new Intl.DateTimeFormat("es-ES", { month: "short" }).format(new Date(d.date + "T12:00")).replace(".", "");
      if (col < weeks - 1) g += `<text x="${x}" y="9" font-size="9" fill="#8a9cc4">${name}</text>`;
    }
    const future = today && d.date > today;
    if (future) return;
    let fill = "rgba(255,255,255,.05)", extra = "";
    if (d.level == null) fill = "rgba(255,255,255,.02)";
    else if (d.level > 0) { fill = color; extra = ` fill-opacity="${alpha[d.level]}"${d.level === 4 ? ` style="filter:drop-shadow(0 0 3px ${color})"` : ""}`; }
    const isToday = d.date === today;
    g += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="3" fill="${fill}"${extra}${isToday ? ` stroke="#e8f1ff" stroke-width="1.2"` : ""}><title>${d.date}</title></rect>`;
  });
  return `<div class="heat-wrap"><svg class="heat" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Mapa de calor">${g}</svg></div>`;
}
