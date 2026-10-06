// Draws race objects, rivals and the player car with its visible stat effects
// (shield bubbles, turbo flames, magnet aura, jump), plus night lighting.

import { drawCarTop, safeColor } from "../../render/car-top.js";
import { drawNeon, updateTrail, drawTrail } from "../../render/effects.js";
import { drawEmoji, laneToX, distToY } from "./track.js";
const finite = (v, f = 0) => (Number.isFinite(v) ? v : f);

function visible(L, y, margin = 80) {
  return y > -margin && y < L.h + margin;
}

function drawLineAcross(g, L, y, checkered) {
  if (!visible(L, y, 20)) return;
  const sq = L.laneW / 6;
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i * sq < L.roadW; i++) {
      g.fillStyle = checkered ? ((i + row) % 2 ? "#111" : "#fff") : "#fff";
      if (!checkered && row) continue;
      g.fillRect(L.roadX + i * sq, y - sq + row * sq, sq, checkered ? sq : sq / 3);
    }
  }
}

function drawRamp(g, L, x, y, len) {
  const w = L.laneW * 0.8;
  const h = len * L.pxPerM;
  g.fillStyle = "#ffd23f";
  g.beginPath();
  g.moveTo(x - w / 2, y + h / 2);
  g.lineTo(x + w / 2, y + h / 2);
  g.lineTo(x + w * 0.4, y - h / 2);
  g.lineTo(x - w * 0.4, y - h / 2);
  g.closePath();
  g.fill();
  g.fillStyle = "#2b2d33";
  for (let i = 0; i < 3; i++) g.fillRect(x - w * 0.35, y - h / 2 + (i + 0.5) * (h / 3.2), w * 0.7, h / 12);
  drawEmoji(g, "⬆️", x, y, L.laneW * 0.35);
}

export function drawObjects(g, L, race, time) {
  const pd = race.player.d;
  drawLineAcross(g, L, distToY(L, 0, pd), false);
  drawLineAcross(g, L, distToY(L, race.length, pd), true);
  const size = L.laneW * 0.62;

  for (const o of race.objects) {
    if (o.taken) continue;
    const x = laneToX(L, finite(o.x, o.lane));
    let y = distToY(L, finite(o.d), pd);
    if (!visible(L, y)) continue;
    if (o.kind === "ramp") drawRamp(g, L, x, y, o.len);
    else if (o.kind === "coin") {
      const w = Math.abs(Math.cos(time * 5 + o.id)) * 0.6 + 0.4;
      g.save();
      g.translate(x, y);
      g.scale(w, 1);
      drawEmoji(g, "🪙", 0, 0, size * 0.62);
      g.restore();
    } else if (o.kind === "powerup" || o.kind === "fuel" || o.kind === "star") {
      const pulse = 1 + 0.1 * Math.sin(time * 6 + o.id);
      g.fillStyle = o.kind === "fuel" ? "rgba(255,140,66,.35)" : "rgba(255,255,255,.45)";
      g.beginPath();
      g.arc(x, y, size * 0.55 * pulse, 0, 6.29);
      g.fill();
      drawEmoji(g, o.icon, x, y, size * 0.75 * pulse);
    } else if (o.kind === "traffic") {
      const fly = o.hit ? Math.min(1, o.fly / 0.6) : 0;
      if (fly >= 1) continue;
      drawCarTop(g, { traffic: true, colorHex: safeColor(o.color, "#cccccc") }, x + o.spin * fly * L.laneW, y - fly * 40, L.laneW * 0.5, { angle: o.spin * fly * 1.5 });
    } else if (o.warn > 0) {
      // boss throw on its way down: a pulsing target where it will land
      const k = Math.min(1, o.warn / 1.2);
      g.strokeStyle = `rgba(255,60,60,${0.5 + 0.4 * Math.sin(time * 14)})`;
      g.lineWidth = 4;
      g.beginPath();
      g.ellipse(x, y, size * 0.6, size * 0.35, 0, 0, 6.29);
      g.stroke();
      drawEmoji(g, o.icon, x, y - k * L.laneW * 2.2, size * (1 + k * 0.6));
    } else {
      const fly = o.hit ? Math.min(1, o.fly / 0.6) : 0;
      if (fly >= 1) continue;
      y -= fly * 60;
      g.save();
      g.translate(x + o.spin * fly * L.laneW * 0.8, y);
      g.rotate(o.spin * fly * 3);
      drawEmoji(g, o.icon, 0, 0, size * (1 + fly * 0.3), 1 - fly);
      g.restore();
    }
  }

  for (const r of race.rivals) {
    const y = distToY(L, r.d, pd);
    if (!visible(L, y, 140)) continue;
    const x = laneToX(L, r.x);
    if (r.isBoss) {
      // the boss is big, wobbles and wears its face on the roof
      const bw = L.laneW * 0.82;
      drawCarTop(g, { colorHex: safeColor(r.color, "#ffd23f") }, x, y, bw, { angle: Math.sin(time * 3) * 0.06 });
      drawEmoji(g, r.icon, x, y, bw * 0.75);
    } else {
      drawCarTop(g, { colorHex: safeColor(r.color, "#2f80ed") }, x, y, L.laneW * 0.46, { angle: (r.lane - r.x) * 0.25 });
    }
  }
}

/**
 * The player's car with its look (DESIGN-v2 §5: everything bought is visible in races).
 * fx = { look, neon, trail } prepared by the game; dt for the trail particles.
 */
export function drawPlayer(g, L, race, time, fx = {}, dt = 1 / 60) {
  const p = race.player;
  const x = laneToX(L, p.x);
  const y = L.playerY;
  const air = p.airT > 0 ? Math.sin(Math.max(0, Math.min(1, 1 - p.airT / (p.airMax || race.track.airTime))) * Math.PI) : 0;
  const scale = 1 + air * 0.35;
  const w = L.laneW * 0.48 * scale;
  const tilt = Math.max(-0.35, Math.min(0.35, finite(p.vx) * 0.06));
  const wobble = p.slowT > 0 ? Math.sin(time * 30) * 0.15 : 0;

  if (air > 0) {
    g.fillStyle = "rgba(0,0,0,.25)";
    g.beginPath();
    g.ellipse(x, y + 18 + air * 20, w * 0.55, w * 0.25, 0, 0, 6.29);
    g.fill();
  }
  if (p.turboT > 0) {
    for (let i = 0; i < 3; i++) drawEmoji(g, "🔥", x + (i - 1) * w * 0.25, y + w * 1.1 + Math.sin(time * 40 + i) * 4, w * 0.45);
  }
  if (p.magnetT > 0 || race.effects.magnetLanes > 0.5) {
    const strength = p.magnetT > 0 ? 0.35 : 0.15;
    g.strokeStyle = `rgba(255,90,95,${strength})`;
    g.lineWidth = 3;
    const r = (0.5 + race.effects.magnetLanes + (p.magnetT > 0 ? 2.5 : 0)) * L.laneW * 0.5;
    g.beginPath();
    g.arc(x, y, Math.min(r, L.laneW * 2.5) * (0.9 + 0.1 * Math.sin(time * 4)), 0, 6.29);
    g.stroke();
  }

  if (fx.trail) {
    updateTrail(fx.trail, dt, x, y + w * 0.95, Math.max(0, p.speed) * L.pxPerM * 0.7, w);
    drawTrail(g, fx.trail);
  }
  if (fx.neon) drawNeon(g, fx.neon, x, y - air * 20, w * 0.85, w * 1.2, time);
  const ghost = race.ab?.ghostT > 0;
  if (ghost) g.globalAlpha = 0.4 + 0.2 * Math.sin(time * 20);
  drawCarTop(g, fx.look || "#ff5a5f", x, y - air * 20, w, { angle: tilt + wobble });
  g.globalAlpha = 1;
  // a legendary part shows as a small spark on the car (DESIGN-v2 §4.2)
  if (fx.sparkle) drawEmoji(g, "✨", x + w * 0.45, y - w * 0.9 - air * 20, w * 0.35, 0.6 + 0.4 * Math.sin(time * 5));
  // ability popups rise above the car
  for (const pop of fx.popups || []) {
    pop.t += dt;
    drawEmoji(g, pop.icon, x, y - w * 1.2 - pop.t * 60, w * 0.8, Math.max(0, 1 - pop.t / 1.2));
  }
  if (fx.popups) fx.popups = fx.popups.filter((pop) => pop.t < 1.2);

  // Odolnosť is visible: one bubble ring per shield around the car.
  for (let i = 0; i < Math.min(6, p.shields); i++) {
    g.strokeStyle = `rgba(120,200,255,${0.75 - i * 0.1})`;
    g.lineWidth = 3;
    g.beginPath();
    g.ellipse(x, y - air * 20, w * (0.8 + i * 0.13), w * (1.15 + i * 0.13), 0, 0, 6.29);
    g.stroke();
  }
  if (p.slowT > 0) drawEmoji(g, "💫", x, y - w * 1.2, w * 0.6);
}

/** Speed lines at the screen edges: rýchlosť is felt. */
export function drawSpeedLines(g, L, race, time) {
  const p = race.player;
  const fast = Math.max(0, (p.speed - 26) / 14) + (p.turboT > 0 ? 0.6 : 0);
  if (fast <= 0.05) return;
  g.strokeStyle = `rgba(255,255,255,${Math.min(0.55, fast * 0.4)})`;
  g.lineWidth = 2;
  for (let i = 0; i < 10; i++) {
    const side = i % 2 ? L.roadX + L.roadW + 8 + (i * 13) % 40 : L.roadX - 8 - (i * 17) % 40;
    const y = ((time * 900 + i * 97) % (L.h + 120)) - 60;
    g.beginPath();
    g.moveTo(side, y);
    g.lineTo(side, y + 40 + fast * 40);
    g.stroke();
  }
}

/**
 * Night: darkness with headlights, drawn on a canvas at 1/4 resolution
 * and scaled up (cheap on older tablets, DESIGN-v2 §4.1).
 */
export function createNight(L) {
  const cv = document.createElement("canvas");
  cv.width = Math.max(8, Math.ceil(L.w / 4));
  cv.height = Math.max(8, Math.ceil(L.h / 4));
  return { cv, g: cv.getContext("2d"), scale: 0.25 };
}

export function drawNight(g, L, night, race, lightRange = 1) {
  const n = night.g;
  const s = night.scale;
  n.globalCompositeOperation = "source-over";
  n.clearRect(0, 0, night.cv.width, night.cv.height);
  n.fillStyle = "rgba(4,8,28,.86)";
  n.fillRect(0, 0, night.cv.width, night.cv.height);
  n.globalCompositeOperation = "destination-out";

  const light = (x, y, r, a = 1) => {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !(r > 0)) return; // never NaN (v1 night bug)
    const grad = n.createRadialGradient(x * s, y * s, 0, x * s, y * s, r * s);
    grad.addColorStop(0, `rgba(0,0,0,${a})`);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    n.fillStyle = grad;
    n.beginPath();
    n.arc(x * s, y * s, r * s, 0, 6.29);
    n.fill();
  };

  const p = race.player;
  const px = laneToX(L, p.x);
  const reach = L.laneW * 2.6 * lightRange;
  light(px, L.playerY, L.laneW * 0.9);
  for (let i = 1; i <= 4; i++) light(px, L.playerY - reach * (i / 4), L.laneW * (0.55 + i * 0.22), 0.95);
  for (const r of race.rivals) {
    const y = distToY(L, r.d, p.d);
    if (visible(L, y)) light(laneToX(L, r.x), y - L.laneW * 0.4, L.laneW * 0.7, 0.8);
  }
  for (const o of race.objects) {
    if (o.taken || o.hit || (o.kind !== "traffic" && o.kind !== "powerup" && o.kind !== "fuel")) continue;
    const y = distToY(L, o.d, p.d);
    if (visible(L, y)) light(laneToX(L, o.x), y, L.laneW * 0.5, 0.6);
  }
  g.drawImage(night.cv, 0, 0, L.w, L.h);
}
