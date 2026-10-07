// Everything on and beside the pseudo-3D road (DESIGN-v2 §4.1): scenery, obstacles, pick-ups,
// ramps, boss throws, rivals and traffic (far to near), then the player's car from behind with
// its look and the visible stat effects (shields, turbo, magnet, jump, ghost), and speed lines.

import { RACE } from "../../data/tracks.js";
import { M, SEG, CAM_H, DEPTH, PLAYER_Z, DRAW, LANE, CAR_W, segIndex, fogAt } from "./road.js";
import { drawRoadSprite, emojiAt } from "../../render/road-sprites.js";
import { drawCarBack } from "../../render/car-back.js";
import { drawNeon, updateTrail, drawTrail } from "../../render/effects.js";

// Things on the road are drawn larger than life, so a child spots them early (§4.1).
const BIG = { obstacle: 1.7, coin: 1.4, fuel: 1.4, star: 1.4, powerup: 1.4 };
// Car Kit models for the other cars (part 15b); one kind per colour keeps the pictures few
export const TRAFFIC_KINDS = ["van", "taxi", "pickup", "truck", "jeep", "garbage", "sedan"];
export const RIVAL_KINDS = ["sports", "hatch", "sedan", "luxury"];
export const BOSS_KIND = "truck";
const colourIndex = (list, c) => Math.max(0, (list || []).indexOf(c));
export const rivalKind = (color) => RIVAL_KINDS[[...String(color)].reduce((t, ch) => t + ch.charCodeAt(0), 0) % RIVAL_KINDS.length];
export const trafficKind = (track, color) => TRAFFIC_KINDS[colourIndex(track.traffic, color) % TRAFFIC_KINDS.length];
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const finite = (v, f = 0) => (Number.isFinite(v) ? v : f);

/** Lane (float) → units from the road centre. */
export const laneOffset = (R, lane) => (finite(lane) - (R.lanes - 1) / 2) * LANE;

/** Screen position of a world point (z, off) on a segment projected this frame, or null. */
function placeAt(R, V, z, off) {
  const s = R.segs[segIndex(R, z)];
  if (s.frame !== R.frame || s.p1.cz <= DEPTH) return null;
  const t = clamp01((z - s.z1) / SEG);
  const sc = lerp(s.p1.s, s.p2.s, t);
  return { x: lerp(s.p1.x, s.p2.x, t) + sc * off * V.KX, y: lerp(s.p1.y, s.p2.y, t), u: sc * V.KX };
}

function drawRamp(g, R, V, o) {
  const off = laneOffset(R, o.x);
  const a = placeAt(R, V, (o.d - o.len / 2) * M, off);
  const b = placeAt(R, V, (o.d + o.len / 2) * M, off);
  if (!a || !b) return;
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

function drawFinishArch(g, V, s) {
  const a = s.p1;
  const pole = Math.max(2, a.w * 0.04);
  const h = a.s * 1700 * V.KX; // 1700 units high
  const top = a.y - h;
  for (const side of [-1, 1]) {
    g.fillStyle = "#e4e9f0";
    g.fillRect(a.x + side * a.w * 1.12 - pole / 2, top, pole, h);
  }
  const bw = a.w * 2.24;
  const bh = h * 0.16;
  const cells = 16;
  for (let k = 0; k < cells; k++) {
    for (let r = 0; r < 2; r++) {
      g.fillStyle = (k + r) % 2 ? "#111111" : "#ffffff";
      g.fillRect(a.x - bw / 2 + (k * bw) / cells, top + (r * bh) / 2, bw / cells + 0.5, bh / 2 + 0.5);
    }
  }
}

function drawObject(g, R, V, o, p0, t, night) {
  if (o.kind === "ramp") return drawRamp(g, R, V, o);
  const p = { ...p0, u: p0.u * (BIG[o.kind] || 1) };
  if (o.kind === "obstacle" && !o.hit && !(o.warn > 0)) {
    g.fillStyle = "rgba(0,0,0,.22)";
    g.beginPath();
    g.ellipse(p.x, p.y, 300 * p.u, 70 * p.u, 0, 0, 6.29);
    g.fill();
  }
  if (o.warn > 0) {
    // boss throw on its way down: a pulsing red target where it will land
    const k = Math.min(1, o.warn / 1.2);
    g.strokeStyle = `rgba(255,60,60,${0.55 + 0.4 * Math.sin(t * 14)})`;
    g.lineWidth = Math.max(2, LANE * 0.03 * p.u);
    g.beginPath();
    g.ellipse(p.x, p.y, LANE * 0.4 * p.u, LANE * 0.12 * p.u, 0, 0, 6.29);
    g.stroke();
    emojiAt(g, o.icon, p.x, p.y - 400 * p.u - k * 2400 * p.u, 650 * p.u);
    return;
  }
  const fly = o.hit ? Math.min(1, o.fly / 0.6) : 0;
  g.save();
  if (fly) {
    g.globalAlpha *= 1 - fly;
    g.translate(p.x + o.spin * fly * LANE * p.u, p.y - fly * 900 * p.u);
    g.rotate(o.spin * fly * 3);
    g.translate(-p.x, -p.y);
  }
  if (o.kind === "traffic") {
    const r = drawCarBack(g, { colorHex: o.color, car: trafficKind(R.track, o.color) }, p.x, p.y, CAR_W * 0.95 * p.u);
    if (night && r) tailGlow(g, p.x, p.y, r, CAR_W * p.u);
  } else if (o.kind === "coin" || o.kind === "fuel" || o.kind === "star") {
    drawRoadSprite(g, o.kind, p.x, p.y, p.u, { t, seed: (o.id % 97) / 97 });
  } else if (o.kind === "powerup") {
    const cy = p.y - 330 * p.u;
    const pulse = 1 + 0.08 * Math.sin(t * 6 + o.id);
    g.fillStyle = "rgba(255,255,255,.55)";
    g.beginPath();
    g.arc(p.x, cy, 250 * p.u * pulse, 0, 6.29);
    g.fill();
    g.strokeStyle = "rgba(255,255,255,.9)";
    g.lineWidth = Math.max(1, 25 * p.u);
    g.stroke();
    emojiAt(g, o.icon, p.x, cy, 340 * p.u * pulse);
  } else if (!drawRoadSprite(g, o.icon, p.x, p.y, p.u, { t, night, seed: (o.id % 89) / 89 })) {
    emojiAt(g, o.icon, p.x, p.y - 300 * p.u, 600 * p.u);
  }
  g.restore();
}

function tailGlow(g, x, y, r, w) {
  const k = r.k;
  g.save();
  g.globalCompositeOperation = "lighter";
  g.fillStyle = "rgba(255,40,40,.35)";
  for (const [lx, ly] of r.sprite.lights) {
    g.beginPath();
    g.arc(x + lx * k, y + ly * k, w * 0.14, 0, 6.29);
    g.fill();
  }
  g.restore();
}

function drawRival(g, R, V, r, p, t, night, near) {
  const lean = (r.lane - r.x) * 0.12;
  if (r.isBoss) {
    const w = CAR_W * 1.35 * p.u;
    const res = drawCarBack(g, { colorHex: r.color, car: BOSS_KIND }, p.x, p.y, w, { angle: Math.sin(t * 3) * 0.04, alpha: near });
    emojiAt(g, r.icon, p.x, p.y - w * 1.45, w * 0.7, near);
    if (night && res) tailGlow(g, p.x, p.y, res, w);
    return;
  }
  const res = drawCarBack(g, { colorHex: r.color, car: rivalKind(r.color) }, p.x, p.y, CAR_W * p.u, { angle: lean, alpha: near });
  if (night && res) tailGlow(g, p.x, p.y, res, CAR_W * p.u);
}

/**
 * Draw sprites far → near on the segments projected by renderRoad.
 * view = { base, camZ, fog, time }.
 */
export function drawScene(g, V, R, race, view) {
  const { base, camZ, fog, time: t } = view;
  const sc = R.track.scene;
  const night = !!sc.night;
  const buckets = new Map();
  const put = (z, item) => {
    const i = segIndex(R, z);
    if (i <= base || i >= base + DRAW) return;
    let list = buckets.get(i);
    if (!list) buckets.set(i, (list = []));
    list.push(item);
  };
  for (const o of race.objects) {
    if (o.taken || (o.hit && o.fly >= 0.6) || !Number.isFinite(o.d)) continue;
    put(o.d * M, { z: o.d * M, o });
  }
  for (const r of race.rivals) if (Number.isFinite(r.d)) put(r.d * M, { z: r.d * M, r });
  const finishZ = R.length * M;
  const finishSeg = segIndex(R, finishZ);

  for (let n = DRAW - 1; n > 0; n--) {
    const s = R.segs[base + n];
    if (!s || s.frame !== R.frame || s.p1.cz <= DEPTH) continue;
    const list = buckets.get(s.i);
    if (!s.scenery.length && !list && s.i !== finishSeg) continue;
    g.save();
    if (s.clip < V.h) {
      g.beginPath();
      g.rect(0, 0, V.w, s.clip);
      g.clip();
    }
    g.globalAlpha = 1 - fogAt(n, fog);
    const a = s.p1;
    const u = a.s * V.KX;
    for (const sp of s.scenery) drawRoadSprite(g, sp.id, a.x + sp.off * u, a.y, u, { night, seed: sp.seed, side: sp.side, t, snow: R.track.id === "snow" });
    if (s.i === finishSeg) drawFinishArch(g, V, s);
    if (list) {
      list.sort((x, y) => y.z - x.z);
      for (const it of list) {
        const rel = it.z - camZ;
        if (it.o) {
          if (rel < PLAYER_Z * 0.55) continue;
          const p = placeAt(R, V, it.z, laneOffset(R, it.o.x));
          if (p) drawObject(g, R, V, it.o, p, t, night);
        } else {
          const near = clamp01((rel - PLAYER_Z * 0.7) / (PLAYER_Z * 0.3));
          if (near <= 0) continue;
          const p = placeAt(R, V, it.z, laneOffset(R, it.r.x));
          if (p) drawRival(g, R, V, it.r, p, t, night, near);
        }
      }
    }
    g.restore();
  }
}

/** Screen x of the player's car; the camera follows it most of the way. */
export function playerScreenX(V, R, race, camX) {
  return V.w / 2 + ((laneOffset(R, race.player.x) - camX) * V.KX) / CAM_H;
}

/** The player's car with its look (DESIGN-v2 §5) and visible stat effects. */
export function drawPlayer(g, V, R, race, fx, camX, time, dt) {
  const p = race.player;
  const x = playerScreenX(V, R, race, camX);
  const w = V.carPx;
  const air = p.airT > 0 ? Math.sin(clamp01(1 - p.airT / (p.airMax || race.track.airTime)) * Math.PI) : 0;
  const ground = V.carY + Math.sin(time * 18) * w * 0.006 * Math.min(1, p.speed / RACE.baseSpeed);
  const y = ground - air * w * 0.9;
  const lean = Math.max(-0.3, Math.min(0.3, finite(p.vx) * 0.05)) + (p.slowT > 0 ? Math.sin(time * 30) * 0.12 : 0);

  // shadow, magnet field and neon on the ground
  g.fillStyle = `rgba(0,0,0,${0.3 - air * 0.15})`;
  g.beginPath();
  g.ellipse(x, ground, w * (0.62 - air * 0.15), w * 0.1, 0, 0, 6.29);
  g.fill();
  if (p.magnetT > 0 || race.effects.magnetLanes > 0.5) {
    const reach = Math.min(2.5, 0.5 + race.effects.magnetLanes + (p.magnetT > 0 ? 2.5 : 0));
    g.strokeStyle = `rgba(255,90,95,${p.magnetT > 0 ? 0.55 : 0.25})`;
    g.lineWidth = 3;
    g.beginPath();
    g.ellipse(x, ground, w * 0.6 * reach * (0.95 + 0.05 * Math.sin(time * 4)), w * 0.14 * reach, 0, 0, 6.29);
    g.stroke();
  }
  if (fx.neon) drawNeon(g, fx.neon, x, ground - w * 0.04, w * 0.75, w * 0.2, time);
  if (fx.trail) {
    updateTrail(fx.trail, dt, x, ground - w * 0.15, 140 + Math.max(0, p.speed) * 6, w * 0.6);
    drawTrail(g, fx.trail);
  }
  if (p.turboT > 0) {
    for (const sx of [-0.22, 0.22]) {
      const fl = w * (0.25 + 0.08 * Math.sin(time * 50 + sx * 9));
      g.fillStyle = "#ff8c1a";
      g.beginPath();
      g.moveTo(x + sx * w - w * 0.07, y - w * 0.1);
      g.lineTo(x + sx * w + w * 0.07, y - w * 0.1);
      g.lineTo(x + sx * w, y - w * 0.1 + fl);
      g.fill();
      g.fillStyle = "#ffe14d";
      g.beginPath();
      g.moveTo(x + sx * w - w * 0.035, y - w * 0.1);
      g.lineTo(x + sx * w + w * 0.035, y - w * 0.1);
      g.lineTo(x + sx * w, y - w * 0.1 + fl * 0.6);
      g.fill();
    }
  }
  const ghost = race.ab?.ghostT > 0;
  const car = drawCarBack(g, fx.look || {}, x, y, w, { angle: lean, alpha: ghost ? 0.45 + 0.2 * Math.sin(time * 20) : 1, dpr: fx.dpr || 1 });
  if (car && R.track.scene.night) tailGlow(g, x, y, car, w);
  // the crew buddy rides along, its face in the rear window (DESIGN-v2 §6)
  if (car && fx.buddy?.icon && car.sprite.win) emojiAt(g, fx.buddy.icon, x + car.sprite.win[0] * car.k, y + car.sprite.win[1] * car.k, w * 0.3);
  if (fx.sparkle) emojiAt(g, "✨", x + w * 0.5, y - w * 0.95, w * 0.22, 0.6 + 0.4 * Math.sin(time * 5));
  for (const pop of fx.popups || []) {
    pop.t += dt;
    emojiAt(g, pop.icon, x, y - w * 1.2 - pop.t * 80, w * 0.5, Math.max(0, 1 - pop.t / 1.2));
  }
  if (fx.popups) fx.popups = fx.popups.filter((pop) => pop.t < 1.2);
  // Odolnosť is visible: one bubble ring per shield around the car
  for (let i = 0; i < Math.min(6, p.shields); i++) {
    g.strokeStyle = `rgba(120,200,255,${0.8 - i * 0.1})`;
    g.lineWidth = 3;
    g.beginPath();
    g.ellipse(x, y - w * 0.4, w * (0.68 + i * 0.07), w * (0.52 + i * 0.07), 0, 0, 6.29);
    g.stroke();
  }
  if (p.slowT > 0) emojiAt(g, "💫", x, y - w * 1.05, w * 0.35);
  return x;
}

/** Night: the headlights light up the road ahead. */
export function drawHeadlights(g, V, x, lightRange = 1) {
  const w = V.carPx;
  const far = V.horizon + V.KY * Math.max(0.04, 0.16 / lightRange);
  g.save();
  g.globalCompositeOperation = "lighter";
  g.fillStyle = "rgba(255,240,170,.14)";
  g.beginPath();
  g.moveTo(x - w * 0.35, V.carY - w * 0.35);
  g.lineTo(x + w * 0.35, V.carY - w * 0.35);
  g.lineTo(V.w / 2 + w * 1.6, far);
  g.lineTo(V.w / 2 - w * 1.6, far);
  g.fill();
  g.restore();
}

/** Speed lines from the horizon: rýchlosť and turbo are felt. */
export function drawSpeedLines(g, V, race, time) {
  const p = race.player;
  const fast = Math.max(0, (p.speed - RACE.baseSpeed * 1.08) / 10) + (p.turboT > 0 ? 0.7 : 0);
  if (fast <= 0.05) return;
  const cx = V.w / 2;
  const cy = V.horizon;
  const R0 = Math.hypot(V.w, V.h) * 0.5;
  g.strokeStyle = `rgba(255,255,255,${Math.min(0.5, fast * 0.35)})`;
  g.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    const side = i % 2 ? 1 : -1;
    const ang = (side > 0 ? 0.15 : Math.PI - 0.15) + side * (0.08 + ((i * 0.37) % 0.9));
    const ph = (time * 2.2 + i * 0.29) % 1;
    const r1 = R0 * (0.35 + ph * 0.6);
    const r2 = r1 + R0 * (0.08 + fast * 0.06);
    g.beginPath();
    g.moveTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
    g.lineTo(cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2);
    g.stroke();
  }
}
