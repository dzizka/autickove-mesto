// Car seen from behind for the pseudo-3D race (DESIGN-v2 §4.1, §5): kind, paint, pattern,
// wheels, wing, sticker and roof item. Neon, trail and the buddy are drawn by the race.
// Sprites are cached per look and size (older tablets).

import { resolveLook } from "../systems/tuning.js";
import { shade } from "./car-side.js";
import { bodyPaint, drawPattern, safeColor } from "./car-top.js";
import { carPic, readyPic, scaledPic } from "./car-pics.js";

const cache = new Map();
const CATS = ["car", "color", "pattern", "wheels", "wing", "sticker", "roof"];

function emoji(g, char, x, y, size) {
  if (!char || !(size > 2)) return;
  g.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(char, x, y);
}
function rr(g, fill, x, y, w, h, r = 0) {
  g.fillStyle = fill;
  g.beginPath();
  g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2)));
  g.fill();
}
function quad(g, fill, ...p) {
  g.fillStyle = fill;
  g.beginPath();
  g.moveTo(p[0], p[1]);
  for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]);
  g.closePath();
  g.fill();
}

/** Painted body block (paint + pattern clipped to it). */
function paintBox(g, color, patternId, x, y, w, h, r, plain) {
  g.save();
  g.translate(x, y);
  const p = bodyPaint(g, color, w, h);
  g.fillStyle = p.fill;
  g.beginPath();
  g.roundRect(0, 0, w, h, Math.min(r, w / 2, h / 2));
  g.fill();
  if (!plain) {
    g.clip();
    drawPattern(g, patternId, color.special, p.base, w, h);
  }
  g.restore();
  return p.base;
}

/**
 * Draw the car with its bottom centre at (0, 0) into context g, body width w.
 * Returns anchors (relative to the bottom centre): win (rear window) and lights.
 */
function drawBack(g, r, w, plain) {
  const kind = r.car.shape || r.car.id; // 2D drawing of the car kind
  const color = plain ? { value: plain } : r.color;
  const pattern = r.pattern.id;
  const wheels = r.wheels;
  const lift = wheels.big ? w * 0.14 : 0;
  const tire = "#1d1e23";
  const rim = safeColor(wheels.rim, "#d9dde3");
  const out = { win: null, lights: [] };

  // wheels (wide for the formula)
  const formula = kind === "formula";
  const ww = w * (wheels.big || formula ? 0.27 : 0.2);
  const wh = w * (wheels.big ? 0.46 : formula ? 0.36 : 0.3);
  const wx = formula ? w * 0.5 : w * 0.36;
  for (const sx of [-1, 1]) {
    rr(g, tire, sx * wx - ww / 2, -wh, ww, wh, ww * 0.3);
    rr(g, rim, sx * wx - ww * 0.22, -wh * 0.62, ww * 0.44, wh * 0.24, ww * 0.1);
  }

  let base;
  let top; // y of the roof (for the roof item)
  if (kind === "fire" || kind === "truck") {
    const bw = w * (kind === "truck" ? 1.04 : 0.98);
    const bh = w * (kind === "truck" ? 1.12 : 0.98);
    base = paintBox(g, color, pattern, -bw / 2, -lift - w * 0.18 - bh, bw, bh, w * 0.06, plain || kind === "fire");
    top = -lift - w * 0.18 - bh;
    const ink = shade(base, -0.25);
    g.fillStyle = ink;
    if (kind === "truck") {
      g.fillRect(-w * 0.012, top + w * 0.06, w * 0.024, bh - w * 0.12);
      g.fillRect(-w * 0.2, top + bh * 0.5, w * 0.06, w * 0.03);
      g.fillRect(w * 0.14, top + bh * 0.5, w * 0.06, w * 0.03);
    } else {
      for (let y = top + bh * 0.2; y < top + bh * 0.85; y += bh * 0.09) g.fillRect(-bw * 0.4, y, bw * 0.8, w * 0.015);
      g.fillStyle = "#c9ced6"; // ladder on top
      g.fillRect(-bw * 0.3, top - w * 0.08, w * 0.04, w * 0.08);
      g.fillRect(bw * 0.3 - w * 0.04, top - w * 0.08, w * 0.04, w * 0.08);
      g.fillRect(-bw * 0.32, top - w * 0.1, bw * 0.64, w * 0.035);
    }
    out.lights = [[-bw * 0.4, -lift - w * 0.3], [bw * 0.4, -lift - w * 0.3]];
  } else if (kind === "formula") {
    base = paintBox(g, color, pattern, -w * 0.27, -lift - w * 0.42, w * 0.54, w * 0.3, w * 0.1, plain);
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.arc(0, -lift - w * 0.5, w * 0.11, 0, 6.29);
    g.fill();
    rr(g, "#2b2d33", -w * 0.08, -lift - w * 0.53, w * 0.16, w * 0.05, w * 0.02);
    top = -lift - w * 0.62;
    out.lights = [[0, -lift - w * 0.18]];
    out.win = [0, -lift - w * 0.5];
  } else if (kind === "rocket") {
    for (const sx of [-1, 1]) quad(g, "#ff5a5f", sx * w * 0.3, -lift - w * 0.2, sx * w * 0.62, -lift - w * 0.12, sx * w * 0.3, -lift - w * 0.7);
    g.save();
    g.beginPath();
    g.ellipse(0, -lift - w * 0.6, w * 0.38, w * 0.5, 0, 0, 6.29);
    g.clip();
    base = paintBox(g, color, pattern, -w * 0.4, -lift - w * 1.12, w * 0.8, w * 1.04, 0, plain);
    g.restore();
    g.fillStyle = "#3a3d46";
    g.beginPath();
    g.arc(0, -lift - w * 0.22, w * 0.12, 0, 6.29);
    g.fill();
    top = -lift - w * 1.08;
    out.win = [0, -lift - w * 0.72];
    out.lights = [[0, -lift - w * 0.22]];
    rr(g, "#bfe9ff", -w * 0.14, -lift - w * 0.84, w * 0.28, w * 0.22, w * 0.11);
  } else {
    // sedan, jeep, taxi, police
    const jeep = kind === "jeep";
    const bodyTop = -lift - w * (jeep ? 0.66 : 0.6);
    base = paintBox(g, color, pattern, -w * 0.5, bodyTop, w, w * (jeep ? 0.5 : 0.44), w * 0.1, plain);
    const cabB = bodyTop + w * 0.02;
    const cabT = bodyTop - w * (jeep ? 0.4 : 0.34);
    const [bW, tW] = jeep ? [0.92, 0.84] : [0.8, 0.58];
    const cab = plain ? shade(plain, -0.08) : shade(base, -0.08);
    quad(g, cab, -w * bW / 2, cabB, w * bW / 2, cabB, w * tW / 2, cabT, -w * tW / 2, cabT);
    const inset = w * 0.06;
    quad(g, "#9fd3ff", -w * bW / 2 + inset, cabB - w * 0.03, w * bW / 2 - inset, cabB - w * 0.03, w * tW / 2 - inset * 0.7, cabT + w * 0.05, -w * tW / 2 + inset * 0.7, cabT + w * 0.05);
    quad(g, "rgba(255,255,255,.45)", -w * 0.22, cabB - w * 0.03, -w * 0.1, cabB - w * 0.03, -w * 0.04, cabT + w * 0.05, -w * 0.14, cabT + w * 0.05);
    out.win = [0, (cabB + cabT) / 2];
    top = cabT;
    if (jeep) {
      g.fillStyle = "#23252b";
      g.beginPath();
      g.arc(0, bodyTop + w * 0.24, w * 0.15, 0, 6.29);
      g.fill();
    }
    if (kind === "taxi") rr(g, "#ffd23f", -w * 0.14, cabT - w * 0.08, w * 0.28, w * 0.08, w * 0.02);
    if (kind === "police") {
      rr(g, "#ff3b3b", -w * 0.2, cabT - w * 0.06, w * 0.2, w * 0.06, w * 0.02);
      rr(g, "#3b7bff", 0, cabT - w * 0.06, w * 0.2, w * 0.06, w * 0.02);
    }
    if (kind === "police" || kind === "taxi") top -= w * 0.07;
    out.lights = [[-w * 0.33, bodyTop + w * 0.12], [w * 0.33, bodyTop + w * 0.12]];
    rr(g, "#2b2d33", -w * 0.47, -lift - w * 0.22, w * 0.94, w * 0.07, w * 0.03);
    rr(g, "#ffffff", -w * 0.1, bodyTop + w * 0.22, w * 0.2, w * 0.08, w * 0.02);
  }
  for (const [lx, ly] of out.lights) rr(g, "#ff2d2d", lx - w * 0.08, ly - w * 0.04, w * 0.16, w * 0.08, w * 0.03);

  if (!plain) {
    // spoiler (the formula always has its big rear wing)
    const size = formula ? Math.max(1.3, r.wing.size || 0) : r.wing.size || 0;
    if (size) {
      const ws = w * (0.55 + 0.3 * size);
      const wy = formula ? -lift - w * 0.72 : top + w * 0.02;
      const wc = safeColor(r.wing.color, "#2b2d33");
      g.fillStyle = wc;
      g.fillRect(-ws * 0.3, wy, w * 0.03, w * 0.1);
      g.fillRect(ws * 0.3 - w * 0.03, wy, w * 0.03, w * 0.1);
      rr(g, wc, -ws / 2, wy - w * 0.05, ws, w * 0.06, w * 0.02);
      if (r.wing.double) rr(g, wc, -ws / 2, wy - w * 0.14, ws, w * 0.05, w * 0.02);
      top = Math.min(top, wy - w * (r.wing.double ? 0.14 : 0.05));
    }
    const stickerY = kind === "fire" || kind === "truck" ? -lift - w * 0.55 : kind === "formula" ? -lift - w * 0.27 : kind === "rocket" ? -lift - w * 0.45 : -lift - w * 0.42;
    const stickerX = kind === "jeep" ? w * 0.3 : 0;
    emoji(g, r.sticker.icon, stickerX, stickerY, w * 0.2);
    emoji(g, r.roof.icon, 0, top - w * 0.15, w * 0.32);
  }
  out.top = top;
  return out;
}

/**
 * Cached sprite. look: tuning ids, or { colorHex, car } for rivals and traffic.
 * Returns { canvas, w, h, ax, ay, win, lights } in CSS pixels (ax, ay = bottom centre).
 */
export function carBackSprite(look, width, dpr = 1) {
  const plain = typeof look?.colorHex === "string" && /^#[0-9a-f]{6}$/i.test(look.colorHex) ? look.colorHex : null;
  const r = resolveLook(look || {});
  const w = Math.max(6, Math.round(width));
  const key = plain ? `${plain}|${r.car.id}|${w}|${dpr}` : `${CATS.map((c) => r[c].id).join("|")}|${w}|${dpr}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const cw = Math.ceil(w * 1.9);
  const ch = Math.ceil(w * 1.8);
  const cv = document.createElement("canvas");
  cv.width = Math.ceil(cw * dpr);
  cv.height = Math.ceil(ch * dpr);
  const g = cv.getContext("2d");
  g.scale(dpr, dpr);
  g.translate(cw / 2, ch - 1);
  const a = drawBack(g, r, w, plain);
  const sprite = { canvas: cv, w: cw, h: ch, ax: cw / 2, ay: ch - 1, win: a.win, lights: a.lights };
  cache.set(key, sprite);
  if (cache.size > 120) cache.delete(cache.keys().next().value);
  return sprite;
}

/**
 * Draw a car from behind with its bottom centre at (x, y), body width `width` (CSS px).
 * Small sizes snap to steps, so far-away cars reuse a few cached sprites.
 */
export function drawCarBack(g, look, x, y, width, { angle = 0, alpha = 1, dpr = 1, yaw = 0 } = {}) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !(width > 2)) return null;
  // the picture of the 3D car (part 15b) once it is ready, the 2D drawing until then
  const pic = backPic(look, yaw);
  if (pic) return drawPic(g, pic, x, y, width, angle, alpha, dpr);
  const step = width < 40 ? 4 : width < 120 ? 8 : 16;
  const sw = Math.max(8, Math.round(width / step) * step);
  const s = carBackSprite(look, sw, dpr);
  const k = width / sw;
  g.save();
  if (alpha !== 1) g.globalAlpha *= Math.max(0, Math.min(1, alpha));
  g.translate(x, y);
  if (angle) g.rotate(angle);
  g.drawImage(s.canvas, -s.ax * k, -s.ay * k, s.w * k, s.h * k);
  g.restore();
  return { sprite: s, k };
}

/** Draw a ready 3D picture with the same anchors as the 2D sprite (bottom centre, body width). */
export function drawPic(g, pic, x, y, width, angle = 0, alpha = 1, dpr = 1) {
  const m = pic.meta;
  const f = width / m.bodyW; // picture pixels → canvas pixels
  const s = scaledPic(pic, width * dpr);
  g.save();
  if (alpha !== 1) g.globalAlpha *= Math.max(0, Math.min(1, alpha));
  g.translate(x, y);
  if (angle) g.rotate(angle);
  g.drawImage(s.canvas, -m.ax * f, -m.ay * f, pic.w * f, pic.h * f);
  g.restore();
  return { sprite: { win: m.win, lights: m.lights, top: m.top }, k: f };
}

/**
 * Where the car meets the road, relative to its bottom centre, in canvas pixels:
 * { cx, cy, rx, ry }. The 3D picture knows its footprint; the 2D drawing sits on its line.
 */
export function backFoot(look, width, yaw = 0) {
  const pic = backPic(look, yaw);
  if (!pic?.meta.foot) return { cx: 0, cy: 0, rx: width * 0.62, ry: width * 0.1, top: -width * 0.9 };
  const f = width / pic.meta.bodyW;
  const m = pic.meta.foot;
  return { cx: m.cx * f, cy: m.cy * f, rx: m.rx * f, ry: m.ry * f, top: (pic.meta.top?.[1] ?? -pic.meta.bodyW) * f };
}

/** The picture seen from this side, or straight from behind while that one is being made. */
function backPic(look, yaw) {
  const l = look || {};
  return (yaw && readyPic(carPic(l, "back", { yaw }))) || readyPic(carPic(l, "back"));
}
