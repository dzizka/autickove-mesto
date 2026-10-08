// Things on the road that move or splash (part 25, DESIGN-v2 §4.1): animals that walk onto the
// road and stop in one lane, the ⚠ sign with the animal that warns early, puddles and the
// splash when the car drives through one; and the ramps. Positions come from scene.js (placeAt).

import { emojiAt } from "../../render/road-sprites.js";
import { LANE } from "./road.js";

const lerp = (a, b, t) => a + (b - a) * t;

/** An animal: walks with a little bounce, faces where it goes, hops away when bumped. */
export function drawAnimal(g, p, o, t) {
  const size = 1500 * p.u; // big like the obstacles (RACE_DRAW.obstacle), so it shows early
  if (!(size > 1)) return;
  const walking = o.walking && Math.abs(o.x - o.goal) > 0.04;
  const hop = o.hit ? Math.sin(Math.min(1, o.fly / 0.6) * Math.PI) * 900 * p.u : 0;
  const bob = walking ? Math.abs(Math.sin(t * 11 + o.id)) * 120 * p.u : 0;
  g.save();
  g.fillStyle = "rgba(0,0,0,.2)";
  g.beginPath();
  g.ellipse(p.x, p.y, 320 * p.u, 70 * p.u, 0, 0, 6.29);
  g.fill();
  if (o.hit) g.globalAlpha *= 1 - Math.min(1, o.fly / 0.6) * 0.6;
  g.translate(p.x, p.y - size * 0.5 - bob - hop);
  // animal emoji look to the left: going right, turn it round
  const goesRight = (o.hit || !o.walking ? o.dir : Math.sign(o.goal - o.x) || o.dir) > 0;
  if (goesRight) g.scale(-1, 1);
  emojiAt(g, o.icon, 0, 0, size);
  g.restore();
}

/** The warning sign beside the road: a red triangle with the animal inside. */
export function drawSign(g, p, o) {
  const u = p.u;
  if (!(u * 700 > 2)) return;
  const top = p.y - 2100 * u;
  g.fillStyle = "#8a9099";
  g.fillRect(p.x - 30 * u, top + 400 * u, 60 * u, 1700 * u);
  const tri = (r, c) => {
    g.fillStyle = c;
    g.beginPath();
    g.moveTo(p.x, top - r * 1.05);
    g.lineTo(p.x + r * 1.1, top + r * 0.85);
    g.lineTo(p.x - r * 1.1, top + r * 0.85);
    g.closePath();
    g.fill();
  };
  tri(620 * u, "#e8463a");
  tri(450 * u, "#ffffff");
  emojiAt(g, o.icon, p.x, top + 130 * u, 450 * u);
}

/** A puddle lying flat on the road between its near (a) and far (b) edge. */
export function drawPuddle(g, a, b, o, t) {
  const cx = (a.x + b.x) / 2;
  const cy = (a.y + b.y) / 2;
  const rx = LANE * 0.36 * (a.u + b.u) * 0.5;
  const ry = Math.max(1, (a.y - b.y) / 2);
  if (!(rx > 1)) return;
  g.save();
  g.globalAlpha *= 0.88;
  g.fillStyle = o.color;
  g.beginPath();
  g.ellipse(cx, cy, rx, ry, 0, 0, 6.29);
  g.fill();
  g.globalAlpha *= 0.45;
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.ellipse(cx - rx * 0.3, cy - ry * 0.25, rx * 0.35, ry * 0.2, 0, 0, 6.29);
  g.fill();
  if (o.splashed) {
    g.strokeStyle = "#ffffff";
    g.lineWidth = Math.max(1, rx * 0.03);
    const k = (t * 1.5) % 1;
    g.beginPath();
    g.ellipse(cx, cy, rx * (0.3 + 0.7 * k), ry * (0.3 + 0.7 * k), 0, 0, 6.29);
    g.stroke();
  }
  g.restore();
}

/** A ramp between its near (a) and far (b) edge: the far edge is raised, chevrons point up. */
export function drawRamp(g, a, b) {
  const wa = LANE * 0.42 * a.u;
  const wb = LANE * 0.42 * b.u;
  const lift = 260 * b.u; // the far edge is raised
  g.fillStyle = "#c98a00";
  g.beginPath();
  g.moveTo(a.x - wa, a.y);
  g.lineTo(a.x + wa, a.y);
  g.lineTo(b.x + wb, b.y - lift);
  g.lineTo(b.x - wb, b.y - lift);
  g.fill();
  g.fillStyle = "#ffd23f";
  for (let k = 0; k < 3; k++) {
    const t1 = (k + 0.2) / 3;
    const t2 = (k + 0.6) / 3;
    const y1 = lerp(a.y, b.y - lift, t1);
    const y2 = lerp(a.y, b.y - lift, t2);
    const w1 = lerp(wa, wb, t1) * 0.7;
    const w2 = lerp(wa, wb, t2) * 0.7;
    const x1 = lerp(a.x, b.x, t1);
    const x2 = lerp(a.x, b.x, t2);
    g.beginPath(); // chevron ⌃
    g.moveTo(x1 - w1, y1);
    g.lineTo(x2, y2);
    g.lineTo(x1 + w1, y1);
    g.lineTo(x1 + w1 * 0.6, y1);
    g.lineTo(x2, y2 + (y1 - y2) * 0.45);
    g.lineTo(x1 - w1 * 0.6, y1);
    g.fill();
  }
}

/** Drops flying up on both sides of the car for a moment after a puddle. */
export function drawSplash(g, V, x, fx, dt) {
  const s = fx.splash;
  if (!s) return;
  s.t += dt;
  if (s.t > 0.8) {
    fx.splash = null;
    return;
  }
  const w = V.carPx;
  const y0 = V.carY - w * 0.05;
  g.save();
  g.globalAlpha = 1 - s.t / 0.8;
  for (let k = 0; k < 16; k++) {
    const side = k % 2 ? 1 : -1;
    const a = 0.25 + (k % 8) * 0.12;
    const r = w * (0.4 + s.t * 1.6 * (0.6 + (k % 5) * 0.1));
    const dx = side * (w * 0.45 + Math.cos(a) * r * 0.6);
    const dy = -Math.sin(a) * r * 1.1 + s.t * s.t * w * 2.2;
    g.fillStyle = k % 3 ? s.color : "#ffffff";
    g.beginPath();
    g.arc(x + dx, y0 + dy, Math.max(1.5, w * 0.035), 0, 6.29);
    g.fill();
  }
  g.restore();
}
