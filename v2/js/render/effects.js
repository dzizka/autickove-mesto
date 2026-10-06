// Animated appearance effects drawn every frame in races: neon glow under the car and the
// trail behind it. Every particle gets all fields when created; every colour has a fallback
// (the v1 rainbow neon crashed on a negative colour index, DESIGN-v2 §3).

import { drawEmoji } from "./emoji.js";
import { safeColor } from "./car-top.js";

const RAINBOW = ["#ff5a5f", "#ff8c42", "#ffd23f", "#3ebd4a", "#2ab7ca", "#8f5bd8"];
const finite = (v, f = 0) => (Number.isFinite(v) ? v : f);

/** Index into a list that is always valid, also for negative or NaN input. */
export function safeIndex(i, length) {
  if (!(length > 0)) return 0;
  const n = Math.floor(finite(i));
  return ((n % length) + length) % length;
}

export function neonColor(neon, time) {
  if (!neon?.value) return null;
  if (neon.special === "rainbow") return RAINBOW[safeIndex(finite(time) * 6, RAINBOW.length)];
  if (neon.special === "fire") return finite(time) * 20 % 2 < 1 ? "#ff7a1a" : "#ffb02e";
  return safeColor(neon.value, "#3ab0ff");
}

export function drawNeon(g, neon, x, y, w, h, time) {
  const color = neonColor(neon, time);
  if (!color || !Number.isFinite(x) || !Number.isFinite(y) || !(w > 0) || !(h > 0)) return;
  const r = Math.max(w, h) * 0.75;
  const grad = g.createRadialGradient(x, y, r * 0.2, x, y, r);
  grad.addColorStop(0, color);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.save();
  g.globalAlpha = 0.75;
  g.fillStyle = grad;
  g.beginPath();
  g.ellipse(x, y, w * 0.95, h * 0.62, 0, 0, 6.29);
  g.fill();
  g.restore();
}

export function createTrail(item) {
  return { item: item?.style ? item : null, parts: [], spawn: 0, n: 0 };
}

/**
 * Spawn and move particles. (x, y) = rear of the car on screen, scroll = road speed in px/s.
 */
export function updateTrail(trail, dt, x, y, scroll, size) {
  if (!trail.item) return;
  const d = Math.max(0, Math.min(0.1, finite(dt)));
  trail.spawn -= d;
  if (scroll > 20 && trail.spawn <= 0 && Number.isFinite(x) && Number.isFinite(y)) {
    trail.spawn = trail.item.style === "rainbow" ? 0.02 : 0.07;
    trail.n++;
    trail.parts.push({
      x: x + (Math.random() - 0.5) * size * 0.4,
      y,
      vx: (Math.random() - 0.5) * 30,
      life: 0,
      max: trail.item.style === "rainbow" ? 0.45 : 0.8,
      size: size * (0.35 + Math.random() * 0.2),
      color: RAINBOW[safeIndex(trail.n, RAINBOW.length)],
    });
  }
  for (const p of trail.parts) {
    p.life += d;
    p.y += finite(scroll) * d;
    p.x += p.vx * d;
  }
  trail.parts = trail.parts.filter((p) => p.life < p.max);
  if (trail.parts.length > 80) trail.parts.splice(0, trail.parts.length - 80);
}

export function drawTrail(g, trail) {
  const it = trail.item;
  if (!it) return;
  for (const p of trail.parts) {
    const a = Math.max(0, 1 - p.life / p.max);
    if (it.style === "rainbow") {
      g.globalAlpha = a;
      for (let i = 0; i < 5; i++) {
        g.fillStyle = RAINBOW[safeIndex(i, RAINBOW.length)];
        g.fillRect(p.x - p.size * 0.6 + i * p.size * 0.24, p.y, p.size * 0.24, p.size * 0.6);
      }
      g.globalAlpha = 1;
    } else if (it.style === "puff" || it.style === "bubble") {
      g.globalAlpha = a * 0.8;
      g.strokeStyle = g.fillStyle = safeColor(it.color, "#c9d1dc");
      g.lineWidth = 2;
      g.beginPath();
      g.arc(p.x, p.y, p.size * (0.4 + p.life), 0, 6.29);
      if (it.style === "puff") g.fill();
      else g.stroke();
      g.globalAlpha = 1;
    } else {
      drawEmoji(g, it.icon, p.x, p.y, p.size, a);
    }
  }
}
