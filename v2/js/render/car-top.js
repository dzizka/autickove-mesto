// Car seen from above, drawn on canvas, with the appearance layers that read from above:
// kind, paint, pattern, wheels, wing, sticker and roof item. Neon and trail are animated,
// so they live in render/effects.js. Sprites are cached per look and size (older tablets).

import { carPic, readyPic, scaledPic } from "./car-pics.js";
import { resolveLook } from "../systems/tuning.js";
import { TRAFFIC_TOP } from "../data/cars.js";
import { shade, luminance } from "./car-side.js";

const cache = new Map();
const isHex = (v) => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);

/** Safe colour: falls back instead of returning undefined (DESIGN-v2 §3, rainbow-neon bug). */
export function safeColor(c, fallback = "#ff5a5f") {
  return isHex(c) ? c : fallback;
}

function emoji(g, char, x, y, size) {
  if (!char) return;
  g.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(char, x, y);
}

export function bodyPaint(g, color, w, h) {
  if (color.special === "rainbow") {
    const grad = g.createLinearGradient(0, 0, 0, h);
    ["#ff5a5f", "#ff8c42", "#ffd23f", "#3ebd4a", "#2ab7ca", "#8f5bd8"].forEach((c, i) => grad.addColorStop(i / 5, c));
    return { fill: grad, base: "#ff8c42", outline: "#7a2d6e" };
  }
  if (color.special === "galaxy") {
    const grad = g.createRadialGradient(w * 0.4, h * 0.4, 1, w * 0.5, h * 0.5, h * 0.7);
    grad.addColorStop(0, "#7b5cff");
    grad.addColorStop(0.5, "#3b2f7a");
    grad.addColorStop(1, "#140f33");
    return { fill: grad, base: "#3b2f7a", outline: "#120e2e" };
  }
  if (color.special === "gold") {
    const grad = g.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, "#a87b00");
    grad.addColorStop(0.5, "#fff2a8");
    grad.addColorStop(1, "#a87b00");
    return { fill: grad, base: "#e8b923", outline: "#8a6a00" };
  }
  const base = safeColor(color.value);
  return { fill: base, base, outline: shade(base, -0.22) };
}

export function drawPattern(g, id, special, base, w, h) {
  const ink = luminance(base) > 0.62 ? "rgba(0,0,0,.22)" : "rgba(255,255,255,.55)";
  g.fillStyle = ink;
  if (special === "galaxy") {
    g.fillStyle = "#fff";
    for (let i = 0; i < 12; i++) g.fillRect((i * 37) % w, (i * 53) % h, 1.5, 1.5);
    g.fillStyle = ink;
  }
  if (id === "stripes") {
    g.fillRect(w * 0.36, 0, w * 0.1, h);
    g.fillRect(w * 0.54, 0, w * 0.1, h);
  } else if (id === "dots") {
    for (let y = h * 0.08; y < h; y += w * 0.3) for (let x = w * 0.2; x < w; x += w * 0.3) g.fillRect(x - 2, y - 2, 4, 4);
  } else if (id === "flames") {
    g.fillStyle = "#ff8c1a";
    for (let i = 0; i < 4; i++) g.fillRect(w * (0.12 + i * 0.2), 0, w * 0.12, h * (0.16 + (i % 2) * 0.08));
    g.fillStyle = "#ffe14d";
    for (let i = 0; i < 4; i++) g.fillRect(w * (0.15 + i * 0.2), 0, w * 0.06, h * (0.1 + (i % 2) * 0.05));
  } else if (id === "checker") {
    const s = w / 6;
    for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) if ((x / s + y / s) % 2 < 1 && y > h * 0.4 && y < h * 0.62) g.fillRect(x, y, s, s);
  } else if (id === "zigzag") {
    g.strokeStyle = ink;
    g.lineWidth = Math.max(2, w * 0.06);
    g.beginPath();
    for (let y = 0, i = 0; y <= h; y += w * 0.2, i++) g.lineTo(i % 2 ? w * 0.35 : w * 0.65, y);
    g.stroke();
  } else if (id === "stars" || id === "hearts") {
    g.font = `${Math.round(w * 0.28)}px sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    if (id === "hearts") g.fillStyle = luminance(base) > 0.62 ? "#ff4f8b" : "#ffd1e3";
    for (let i = 0; i < 4; i++) g.fillText(id === "stars" ? "★" : "♥", w * (i % 2 ? 0.3 : 0.7), h * (0.15 + i * 0.22));
  } else if (id === "camo") {
    ["#4b5a2a", "#7a6a3a", "#2f3a1c"].forEach((c, k) => {
      g.fillStyle = c;
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.ellipse(((i * 31 + k * 13) % 100) / 100 * w, ((i * 29 + k * 23) % 100) / 100 * h, w * 0.16, w * 0.1, 0, 0, 6.29);
        g.fill();
      }
    });
  }
}

/**
 * Sprite (canvas) facing up.
 * look: tuning ids (see systems/tuning.js), { colorHex } for a plain car, or "traffic".
 */
export function carSprite(look, width, { dpr = 1 } = {}) {
  const traffic = look?.traffic === true;
  const r = resolveLook(traffic ? {} : look);
  const colorHex = isHex(look?.colorHex) ? look.colorHex : null;
  const t = traffic ? TRAFFIC_TOP : r.car.top;
  const w0 = Math.max(8, Math.round(width));
  const key = traffic || colorHex ? `${colorHex}|${traffic}|${w0}|${dpr}` : `${CATS.map((c) => r[c].id).join("|")}|${w0}|${dpr}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const w = Math.round(w0 * (t.width || 1));
  const h = Math.round(w0 * t.len);
  const pad = Math.ceil(w0 * 0.3);
  const cv = document.createElement("canvas");
  cv.width = Math.ceil((w0 + pad * 2) * dpr);
  cv.height = Math.ceil((h + pad * 2) * dpr);
  const g = cv.getContext("2d");
  g.scale(dpr, dpr);
  g.translate(pad + (w0 - w) / 2, pad);
  const p = bodyPaint(g, colorHex || traffic ? { value: colorHex || "#cccccc" } : r.color, w, h);
  const wheels = r.wheels;

  // wheels (wide stance for the formula)
  const ww = w0 * (wheels.big ? 0.26 : 0.2);
  const wh = h * 0.18;
  const wx = t.width ? (w0 - w) / 2 + w0 * 0.05 : ww * 0.35;
  g.fillStyle = "#23252b";
  for (const [x, y] of [[-wx, h * 0.12], [w - ww + wx, h * 0.12], [-wx, h * 0.7], [w - ww + wx, h * 0.7]]) {
    g.beginPath();
    g.roundRect(x, y, ww, wh, ww * 0.35);
    g.fill();
    g.fillStyle = safeColor(wheels.rim, "#d9dde3");
    g.fillRect(x + ww * 0.3, y + wh * 0.35, ww * 0.4, wh * 0.3);
    g.fillStyle = "#23252b";
  }
  if (t.extra === "fins") {
    g.fillStyle = "#ff5a5f";
    g.beginPath();
    g.moveTo(-w * 0.35, h);
    g.lineTo(w * 0.2, h * 0.7);
    g.lineTo(w * 0.8, h * 0.7);
    g.lineTo(w * 1.35, h);
    g.closePath();
    g.fill();
  }

  // body
  g.fillStyle = p.fill;
  g.strokeStyle = p.outline;
  g.lineWidth = Math.max(1.5, w0 * 0.06);
  g.beginPath();
  if (t.nose) {
    g.moveTo(w / 2, 0);
    g.quadraticCurveTo(w, h * 0.12, w, h * 0.35);
    g.lineTo(w, h);
    g.lineTo(0, h);
    g.lineTo(0, h * 0.35);
    g.quadraticCurveTo(0, h * 0.12, w / 2, 0);
  } else g.roundRect(0, 0, w, h, [w * t.radius, w * t.radius, w * 0.22, w * 0.22]);
  g.fill();
  g.save();
  g.clip();
  if (!traffic && !colorHex) drawPattern(g, r.pattern.id, r.color.special, p.base, w, h);
  g.restore();
  g.stroke();

  // windows and kind extras
  g.fillStyle = "#bfe9ff";
  if (t.cabin) {
    g.beginPath();
    g.roundRect(w * 0.14, h * t.cabin[0], w * 0.72, h * (t.cabin[1] - t.cabin[0]), w * 0.12);
    g.fill();
  }
  if (t.rear) {
    g.beginPath();
    g.roundRect(w * 0.18, h * t.rear[0], w * 0.64, h * (t.rear[1] - t.rear[0]), w * 0.1);
    g.fill();
  }
  if (t.extra === "trailer" || t.extra === "box" || t.extra === "ladder") {
    g.fillStyle = t.extra === "ladder" ? "rgba(0,0,0,.12)" : shade(p.base, 0.15);
    g.fillRect(w * 0.08, h * 0.26, w * 0.84, h * 0.7);
    if (t.extra === "ladder") {
      g.strokeStyle = "#e4e9f0";
      g.lineWidth = 2;
      g.strokeRect(w * 0.32, h * 0.28, w * 0.36, h * 0.66);
      for (let y = h * 0.32; y < h * 0.94; y += h * 0.06) g.fillRect(w * 0.32, y, w * 0.36, 2);
    }
  } else if (t.extra === "lightbar") {
    g.fillStyle = "#ff3b3b";
    g.fillRect(w * 0.18, h * 0.42, w * 0.32, h * 0.06);
    g.fillStyle = "#3b7bff";
    g.fillRect(w * 0.5, h * 0.42, w * 0.32, h * 0.06);
  } else if (t.extra === "sign") {
    g.fillStyle = "#ffd23f";
    g.fillRect(w * 0.25, h * 0.42, w * 0.5, h * 0.07);
  } else if (t.extra === "cockpit") {
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.arc(w / 2, h * 0.47, w * 0.28, 0, 6.29);
    g.fill();
    g.fillStyle = "#2b2d33";
    g.fillRect(-w * 0.3, h * 0.02, w * 1.6, h * 0.04);
  }
  // lights
  g.fillStyle = "#fff6b0";
  g.fillRect(w * 0.1, 0, w * 0.2, h * 0.03);
  g.fillRect(w * 0.7, 0, w * 0.2, h * 0.03);
  g.fillStyle = "#ff4d4d";
  g.fillRect(w * 0.1, h * 0.97, w * 0.2, h * 0.03);
  g.fillRect(w * 0.7, h * 0.97, w * 0.2, h * 0.03);

  if (!traffic && !colorHex) {
    if (r.wing.size) {
      g.fillStyle = safeColor(r.wing.color, "#2b2d33");
      const ws = w0 * (0.6 + 0.35 * r.wing.size);
      g.fillRect(w / 2 - ws / 2, h * 0.9, ws, h * 0.05);
      if (r.wing.double) g.fillRect(w / 2 - ws / 2, h * 0.83, ws, h * 0.04);
    }
    emoji(g, r.sticker.icon, w / 2, h * 0.12 + w * 0.12, w * 0.32);
    emoji(g, r.roof.icon, w / 2, h * 0.52, w * 0.5);
  }

  const sprite = { canvas: cv, w: w0 + pad * 2, h: h + pad * 2, bodyW: w, bodyH: h };
  cache.set(key, sprite);
  if (cache.size > 160) cache.delete(cache.keys().next().value);
  return sprite;
}

const CATS = ["car", "color", "pattern", "wheels", "wing", "sticker", "roof"];

/** Draw a car centred at (x, y). `look` as for carSprite; a plain hex string also works. */
export function drawCarTop(g, look, x, y, width, opts = {}) {
  const l = typeof look === "string" ? { colorHex: look } : look;
  // the 3D car seen from above (part 15b) once its picture is ready
  const pic = l?.traffic ? null : readyPic(carPic(l || {}, "top"));
  if (pic && Number.isFinite(x) && Number.isFinite(y)) {
    const f = width / pic.meta.bodyW;
    const sc = scaledPic(pic, width * (opts.dpr || 1));
    g.save();
    g.translate(x, y);
    if (opts.angle) g.rotate(Number.isFinite(opts.angle) ? opts.angle : 0);
    g.drawImage(sc.canvas, -pic.meta.ax * f, -pic.meta.ay * f, pic.w * f, pic.h * f);
    g.restore();
    return null;
  }
  const s = carSprite(l, width, opts);
  const cx = Number.isFinite(x) ? x : 0;
  const cy = Number.isFinite(y) ? y : 0;
  if (opts.angle) {
    g.save();
    g.translate(cx, cy);
    g.rotate(Number.isFinite(opts.angle) ? opts.angle : 0);
    g.drawImage(s.canvas, -s.w / 2, -s.h / 2, s.w, s.h);
    g.restore();
  } else {
    g.drawImage(s.canvas, cx - s.w / 2, cy - s.h / 2, s.w, s.h);
  }
  return s;
}
