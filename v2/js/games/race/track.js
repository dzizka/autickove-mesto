// Track background: ground, road, lane lines, roadside scenery and weather.

import { RACE } from "../../data/tracks.js";

export { emojiSprite, drawEmoji } from "../../render/emoji.js";
import { drawEmoji } from "../../render/emoji.js";

/** Screen layout for a canvas of w × h CSS pixels. */
export function makeLayout(w, h) {
  const roadW = Math.min(w * 0.76, 480);
  const laneW = roadW / RACE.lanes;
  return {
    w,
    h,
    roadX: (w - roadW) / 2,
    roadW,
    laneW,
    pxPerM: laneW / RACE.laneWidth,
    playerY: h * 0.76,
  };
}

export const laneToX = (L, x) => L.roadX + L.laneW * (x + 0.5);
export const distToY = (L, d, playerD) => L.playerY - (d - playerD) * L.pxPerM;

const hash = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Weather particles live here; each gets all coordinates at creation. */
export function createWeather(track, L) {
  const kind = track.weather;
  const count = { leaves: 14, sand: 26, snow: 40, stars: 60, night: 0, none: 0 }[kind] ?? 0;
  const parts = [];
  for (let i = 0; i < count; i++) {
    parts.push({ x: Math.random() * L.w, y: Math.random() * L.h, v: 0.5 + Math.random(), r: 1 + Math.random() * 2.5, phase: Math.random() * 6.28 });
  }
  return { kind, parts };
}

export function drawBackground(g, L, track, playerD, time) {
  const c = track.colors;
  g.fillStyle = c.ground;
  g.fillRect(0, 0, L.w, L.h);

  // ground stripes scroll with distance
  const stripe = 10 * L.pxPerM;
  const offset = (playerD * L.pxPerM) % (stripe * 2);
  g.fillStyle = c.groundAlt;
  for (let y = -stripe * 2 + offset; y < L.h; y += stripe * 2) g.fillRect(0, y, L.w, stripe);

  if (track.weather === "stars") drawStarfield(g, L, playerD, time);

  // road and edges
  g.fillStyle = c.road;
  g.fillRect(L.roadX, 0, L.roadW, L.h);
  g.fillStyle = c.edge;
  const edgeW = Math.max(4, L.laneW * 0.06);
  const kerb = 3 * L.pxPerM;
  const kOff = (playerD * L.pxPerM) % (kerb * 2);
  for (let y = -kerb * 2 + kOff; y < L.h; y += kerb * 2) {
    g.fillRect(L.roadX - edgeW, y, edgeW, kerb);
    g.fillRect(L.roadX + L.roadW, y, edgeW, kerb);
  }

  // dashed lane lines
  g.fillStyle = c.line;
  const dash = 4 * L.pxPerM;
  const dOff = (playerD * L.pxPerM) % (dash * 2.5);
  const lineW = Math.max(3, L.laneW * 0.04);
  for (let i = 1; i < RACE.lanes; i++) {
    const x = L.roadX + L.laneW * i - lineW / 2;
    for (let y = -dash * 2.5 + dOff; y < L.h; y += dash * 2.5) g.fillRect(x, y, lineW, dash);
  }

  drawScenery(g, L, track, playerD);
}

function drawStarfield(g, L, playerD, time) {
  for (let i = 0; i < 50; i++) {
    const x = hash(i) * L.w;
    const y = (hash(i + 99) * L.h + playerD * L.pxPerM * 0.15) % L.h;
    const tw = 0.5 + 0.5 * Math.sin(time * 3 + i);
    g.fillStyle = `rgba(255,255,255,${0.3 + 0.6 * tw})`;
    g.fillRect(x, y, 2, 2);
  }
}

function drawScenery(g, L, track, playerD) {
  const spacing = 11; // metres between scenery slots
  const sideW = L.roadX;
  if (sideW < 24) return;
  const size = Math.min(sideW * 0.7, L.laneW * 0.75);
  const first = Math.floor((playerD - (L.h - L.playerY) / L.pxPerM) / spacing) - 1;
  const last = Math.ceil((playerD + L.playerY / L.pxPerM) / spacing) + 1;
  for (let slot = first; slot <= last; slot++) {
    for (const side of [0, 1]) {
      const r = hash(slot * 2 + side);
      if (r < 0.35) continue;
      const icon = track.scenery[Math.floor(hash(slot * 3 + side + 7) * track.scenery.length)] || "🌳";
      const jitter = hash(slot * 5 + side) * (sideW - size);
      const x = side ? L.roadX + L.roadW + size / 2 + 6 + jitter : sideW - size / 2 - 6 - jitter;
      drawEmoji(g, icon, x, distToY(L, slot * spacing, playerD), size);
    }
  }
}

/** Weather on top of everything except the HUD. */
export function drawWeather(g, L, weather, dt, speed) {
  const { kind, parts } = weather;
  if (!parts.length) return;
  const v = Math.max(0, Number.isFinite(speed) ? speed : 0);
  for (const p of parts) {
    if (kind === "snow") {
      p.y += (40 + v * 6) * p.v * dt;
      p.x += Math.sin(p.y / 40 + p.phase) * 0.6;
      g.fillStyle = "rgba(255,255,255,.9)";
      g.beginPath();
      g.arc(p.x, p.y, p.r + 1, 0, 6.29);
      g.fill();
    } else if (kind === "leaves") {
      p.y += (30 + v * 5) * p.v * dt;
      p.x += Math.sin(p.y / 30 + p.phase) * 1.2;
      g.fillStyle = p.phase > 3 ? "#e8a33d" : "#c4572e";
      g.fillRect(p.x, p.y, p.r * 3, p.r * 2);
    } else if (kind === "sand") {
      p.x += 140 * p.v * dt;
      p.y += (v * 4) * dt;
      g.fillStyle = "rgba(255,236,190,.55)";
      g.fillRect(p.x, p.y, p.r * 6, p.r);
    } else if (kind === "stars") {
      p.y += v * 8 * p.v * dt;
      g.fillStyle = "rgba(180,240,255,.8)";
      g.fillRect(p.x, p.y, 1.5, p.r * 4 + v * 0.3);
    }
    if (p.y > L.h + 10) {
      p.y = -10;
      p.x = Math.random() * L.w;
    }
    if (p.x > L.w + 20) p.x = -20;
  }
}
