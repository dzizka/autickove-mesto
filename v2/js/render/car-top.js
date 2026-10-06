// Car seen from above, drawn on canvas. Sprites are cached per colour and size,
// so a race draws images instead of paths every frame (older tablets, DESIGN-v2 §4.1).

import { shade } from "./car-side.js";

const cache = new Map();

/** Safe colour: falls back instead of returning undefined (DESIGN-v2 §3, rainbow-neon bug). */
export function safeColor(c, fallback = "#ff5a5f") {
  return typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c) ? c : fallback;
}

/**
 * Car sprite (canvas) facing up. width in CSS px; height = 1.85 × width.
 * kind: "car" (default) | "truck" for traffic.
 */
export function carSprite(color, width, { kind = "car", dpr = 1 } = {}) {
  const c = safeColor(color);
  const w = Math.max(8, Math.round(width));
  const key = `${c}|${w}|${kind}|${dpr}`;
  if (cache.has(key)) return cache.get(key);
  const h = Math.round(w * (kind === "truck" ? 2.1 : 1.85));
  const pad = Math.ceil(w * 0.12);
  const cv = document.createElement("canvas");
  cv.width = Math.ceil((w + pad * 2) * dpr);
  cv.height = Math.ceil((h + pad * 2) * dpr);
  const g = cv.getContext("2d");
  g.scale(dpr, dpr);
  g.translate(pad, pad);
  const dark = shade(c, -0.22);
  const light = shade(c, 0.2);

  // wheels
  g.fillStyle = "#23252b";
  const ww = w * 0.2;
  const wh = h * 0.2;
  for (const [x, y] of [[-ww * 0.35, h * 0.14], [w - ww * 0.65, h * 0.14], [-ww * 0.35, h * 0.68], [w - ww * 0.65, h * 0.68]]) {
    g.beginPath();
    g.roundRect(x, y, ww, wh, ww * 0.35);
    g.fill();
  }
  // body
  g.fillStyle = c;
  g.strokeStyle = dark;
  g.lineWidth = Math.max(1.5, w * 0.06);
  g.beginPath();
  g.roundRect(0, 0, w, h, [w * 0.42, w * 0.42, w * 0.28, w * 0.28]);
  g.fill();
  g.stroke();
  if (kind === "truck") {
    g.fillStyle = light;
    g.beginPath();
    g.roundRect(w * 0.08, h * 0.36, w * 0.84, h * 0.6, w * 0.1);
    g.fill();
  } else {
    // shine stripe and roof
    g.fillStyle = light;
    g.beginPath();
    g.roundRect(w * 0.42, h * 0.04, w * 0.16, h * 0.9, w * 0.08);
    g.fill();
  }
  // windows
  g.fillStyle = "#bfe9ff";
  g.beginPath();
  g.roundRect(w * 0.14, h * 0.2, w * 0.72, h * 0.17, w * 0.12);
  g.fill();
  if (kind !== "truck") {
    g.beginPath();
    g.roundRect(w * 0.18, h * 0.66, w * 0.64, h * 0.11, w * 0.1);
    g.fill();
  }
  // lights
  g.fillStyle = "#fff6b0";
  g.fillRect(w * 0.1, 0, w * 0.2, h * 0.04);
  g.fillRect(w * 0.7, 0, w * 0.2, h * 0.04);
  g.fillStyle = "#ff4d4d";
  g.fillRect(w * 0.1, h * 0.96, w * 0.2, h * 0.04);
  g.fillRect(w * 0.7, h * 0.96, w * 0.2, h * 0.04);

  const sprite = { canvas: cv, w: w + pad * 2, h: h + pad * 2, bodyW: w, bodyH: h };
  cache.set(key, sprite);
  if (cache.size > 120) cache.delete(cache.keys().next().value);
  return sprite;
}

/** Draw a car centred at (x, y). */
export function drawCarTop(g, color, x, y, width, opts = {}) {
  const s = carSprite(color, width, opts);
  const cx = Number.isFinite(x) ? x : 0;
  const cy = Number.isFinite(y) ? y : 0;
  if (opts.angle) {
    g.save();
    g.translate(cx, cy);
    g.rotate(opts.angle);
    g.drawImage(s.canvas, -s.w / 2, -s.h / 2, s.w, s.h);
    g.restore();
  } else {
    g.drawImage(s.canvas, cx - s.w / 2, cy - s.h / 2, s.w, s.h);
  }
  return s;
}
