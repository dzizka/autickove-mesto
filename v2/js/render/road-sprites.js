// Hand-drawn race sprites for the pseudo-3D view (DESIGN-v2 §4.1): scenery, obstacles and
// pick-ups, drawn with canvas shapes instead of emoji. Sizes are in "sprite units"
// (300 per metre); `u` is pixels per unit at the sprite's distance. (x, y) = bottom centre.

import { emojiSprite } from "./emoji.js";
import { propPic, readyPic } from "./car-pics.js";
import { drawPropPic } from "./car-back.js";
import { MODELS, DECOR, RACE_DRAW, TRACK_MOOD } from "../data/race-props.js";

/** Rough widths in sprite units of the 2D-only sprites, used to keep scenery off the road. */
export const SPRITE_WIDTH = { lamp: 300, planet: 1500, ufo: 1200 };

/** Width in sprite units of a sprite or model id (built models without w: their real size). */
export function spriteWidth(id, pic = null) {
  const m = MODELS[id];
  if (m) return m.w || (pic?.meta.size?.[0] || 4) * 300;
  return SPRITE_WIDTH[id] || 600;
}

/**
 * The 3D picture of model `id` for a track (part 24). o = { track (id), side (−1 | 1 beside the
 * road: seen a little from the road), scenery (sharpness), lazy }. Null without WebGL.
 */
export function modelPic(id, o = {}) {
  const m = MODELS[id];
  if (!m) return null;
  const mood = TRACK_MOOD[o.track];
  const opts = { ...m.opts, mood, lazy: !!o.lazy };
  if (mood !== "night") delete opts.windows; // lit windows only at night
  if (o.scenery) opts.ppu = RACE_DRAW.sceneryPpu;
  if (m.turn && o.side) opts.yaw = -Math.sign(o.side);
  if (m.face && o.side) opts.rot = -Math.sign(o.side) * m.face; // turned towards the road
  return propPic(m.path, opts);
}

/** Start making every picture a track needs (obstacles first); returns the cache entries. */
export function trackPics(track, { lazy = false } = {}) {
  const d = DECOR[track.id] || {};
  const pics = (track.obstacles || []).map((id) => modelPic(id, { track: track.id, lazy }));
  pics.push(propPic(`proc:startGate:${track.lanes}`, { lazy }), propPic(`proc:gate:${track.lanes}`, { lazy }));
  const beside = [...new Set([...(d.near || []), ...(d.far || []), ...(d.farSea || []), ...(d.nearSea || []), ...(d.stands || []), d.posts?.id].filter(Boolean))];
  for (const id of beside) for (const side of MODELS[id]?.turn || MODELS[id]?.face ? [-1, 1] : [0]) pics.push(modelPic(id, { track: track.id, side, scenery: true, lazy }));
  return pics.filter(Boolean);
}

const isEmoji = (id) => typeof id === "string" && /[^\x20-\x7e]/.test(id);

/** Emoji scaled from a fixed-size cached sprite (no cache churn with changing sizes). */
export function emojiAt(g, char, x, y, size, alpha = 1) {
  if (!(size > 1) || !Number.isFinite(x) || !Number.isFinite(y)) return;
  const cv = emojiSprite(char, size > 56 ? 128 : 64);
  const k = size / (cv.width / 1.3);
  const w = cv.width * k;
  const a = g.globalAlpha;
  g.globalAlpha = a * Math.max(0, Math.min(1, alpha));
  g.drawImage(cv, x - w / 2, y - w / 2, w, w);
  g.globalAlpha = a;
}

function poly(g, c, ...p) {
  g.fillStyle = c;
  g.beginPath();
  g.moveTo(p[0], p[1]);
  for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]);
  g.fill();
}
function circle(g, c, x, y, r) {
  if (!(r > 0.3)) return;
  g.fillStyle = c;
  g.beginPath();
  g.arc(x, y, r, 0, 6.29);
  g.fill();
}
function ellipse(g, c, x, y, rx, ry, rot = 0) {
  if (!(rx > 0.3 && ry > 0.3)) return;
  g.fillStyle = c;
  g.beginPath();
  g.ellipse(x, y, rx, ry, rot, 0, 6.29);
  g.fill();
}
function rect(g, c, x, y, w, h, r = 0) {
  if (w < 0) {
    x += w;
    w = -w;
  }
  if (!(w > 0.3 && h > 0.3)) return;
  g.fillStyle = c;
  if (r > 0) {
    g.beginPath();
    g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
    g.fill();
  } else g.fillRect(x, y, w, h);
}

const HOUSE = ["#f4a261", "#e9c46a", "#8ecae6", "#f28482", "#b5e48c", "#cdb4db"];

/**
 * Draw sprite `id`. o = { night, seed (0..1), side (-1|1), t (seconds), snow, track, scenery, lazy }.
 * Unknown ids that are emoji are drawn as emoji; returns false for anything else.
 */
export function drawRoadSprite(g, id, x, y, u, o = {}) {
  if (!(u > 0) || !Number.isFinite(x) || !Number.isFinite(y)) return false;
  const s = (v) => v * u;
  const seed = o.seed ?? 0.5;
  const t = o.t || 0;
  if (MODELS[id]) {
    // a 3D model picture (part 24); its 2D drawing until the picture is ready
    const pic = readyPic(modelPic(id, { track: o.track, side: o.side, scenery: o.scenery, lazy: o.lazy }));
    if (pic) {
      drawPropPic(g, pic, x, y, s(spriteWidth(id, pic)));
      return true;
    }
    id = MODELS[id].fb;
    if (!id) return true; // nothing to draw until the picture is ready
  }
  switch (id) {
    case "tree":
      rect(g, "#7a5230", x - s(50), y - s(380), s(100), s(380));
      circle(g, "#2e8b3d", x, y - s(560), s(300));
      circle(g, "#3aa04a", x - s(150), y - s(450), s(200));
      circle(g, "#45b356", x + s(140), y - s(480), s(190));
      return true;
    case "bush":
      circle(g, "#3f9b4b", x - s(160), y - s(140), s(160));
      circle(g, "#4cb35a", x + s(120), y - s(150), s(170));
      circle(g, "#58c466", x, y - s(230), s(170));
      if (seed > 0.5) for (let k = 0; k < 4; k++) circle(g, "#ff7eb6", x - s(180) + s(k * 120), y - s(160 + (k % 2) * 90), s(28));
      return true;
    case "pine":
    case "snowPine": {
      const snow = id === "snowPine";
      rect(g, "#6b4a2b", x - s(40), y - s(200), s(80), s(200));
      for (let k = 0; k < 3; k++) {
        const w = 400 - k * 90;
        const b = 180 + k * 230;
        poly(g, snow ? "#2f6f4f" : "#256b3a", x - s(w), y - s(b), x + s(w), y - s(b), x, y - s(b + 380));
        if (snow) poly(g, "#ffffff", x - s(w * 0.45), y - s(b + 210), x + s(w * 0.45), y - s(b + 210), x, y - s(b + 380));
      }
      return true;
    }
    case "palm":
      g.strokeStyle = "#9b6a3c";
      g.lineWidth = s(70);
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + s(140), y - s(500), x + s(60), y - s(1000));
      g.stroke();
      for (let k = 0; k < 5; k++) ellipse(g, k % 2 ? "#2e8b3d" : "#3aa04a", x + s(60) + Math.cos(k * 1.3) * s(220), y - s(1000) + Math.sin(k * 1.3) * s(60), s(260), s(70), k * 1.3);
      return true;
    case "house": {
      const hh = 900 + seed * 900;
      rect(g, o.night ? "#2c3157" : HOUSE[Math.floor(seed * HOUSE.length)], x - s(700), y - s(hh), s(1400), s(hh));
      poly(g, o.night ? "#1d2140" : "#b5523b", x - s(780), y - s(hh), x + s(780), y - s(hh), x, y - s(hh + 450));
      for (let wy = 200; wy < hh - 150; wy += 280) {
        for (let wx = -520; wx < 500; wx += 300) {
          const lit = (wx + wy + Math.floor(seed * 9)) % 3 !== 0;
          rect(g, o.night ? (lit ? "#ffd86b" : "#3a3f6b") : "#cfeeff", x + s(wx), y - s(hh - wy + 120), s(160), s(150), s(20));
        }
      }
      if (o.snow) rect(g, "#ffffff", x - s(780), y - s(hh + 40), s(1560), s(80), s(40));
      return true;
    }
    case "tower": {
      const hh = 2000 + seed * 1400;
      rect(g, o.night ? "#262a4d" : seed > 0.5 ? "#9fb4c7" : "#c7b299", x - s(550), y - s(hh), s(1100), s(hh));
      for (let wy = 160; wy < hh - 100; wy += 240) {
        for (let wx = -440; wx < 420; wx += 220) {
          const lit = o.night ? ((wx * 7 + wy * 3 + Math.floor(seed * 99)) % 5 !== 0 ? "#ffd86b" : "#343a66") : "#dff3ff";
          rect(g, lit, x + s(wx), y - s(hh - wy + 100), s(120), s(130));
        }
      }
      return true;
    }
    case "lamp": {
      const dir = (o.side || 1) < 0 ? 1 : -1; // the arm reaches over the road
      rect(g, "#555b66", x - s(25), y - s(1100), s(50), s(1100));
      rect(g, "#555b66", x, y - s(1100), s(300 * dir), s(40));
      const lx = x + s(280 * dir);
      if (o.night) circle(g, "rgba(255,220,120,.22)", lx, y - s(1050), s(340));
      circle(g, "#ffe28a", lx, y - s(1050), s(60));
      return true;
    }
    case "mushroom":
      rect(g, "#f3ead8", x - s(70), y - s(300), s(140), s(300), s(40));
      ellipse(g, "#e8463a", x, y - s(320), s(260), s(170));
      for (const [dx, dy] of [[-120, 360], [60, 420], [140, 320], [-20, 300]]) circle(g, "#ffffff", x + s(dx), y - s(dy), s(32));
      return true;
    case "cactus":
    case "cactusSmall": {
      const k = id === "cactus" ? 1 : 0.7;
      const c = "#3f9b4b";
      rect(g, c, x - s(70 * k), y - s(700 * k), s(140 * k), s(700 * k), s(70 * k));
      rect(g, c, x - s(250 * k), y - s(520 * k), s(110 * k), s(300 * k), s(55 * k));
      rect(g, c, x - s(250 * k), y - s(330 * k), s(250 * k), s(100 * k), s(50 * k));
      rect(g, c, x + s(150 * k), y - s(600 * k), s(110 * k), s(260 * k), s(55 * k));
      rect(g, c, x, y - s(440 * k), s(260 * k), s(100 * k), s(50 * k));
      if (id === "cactusSmall") circle(g, "#ff7eb6", x, y - s(700 * k), s(40));
      return true;
    }
    case "rock":
      ellipse(g, "#7d7d86", x, y - s(170), s(270), s(190));
      ellipse(g, "#9a9aa3", x - s(60), y - s(230), s(140), s(95));
      return true;
    case "snowman":
      circle(g, "#ffffff", x, y - s(170), s(170));
      circle(g, "#f4f8ff", x, y - s(430), s(120));
      circle(g, "#ffffff", x, y - s(610), s(85));
      poly(g, "#ff7a1a", x, y - s(620), x + s(110), y - s(605), x, y - s(590));
      circle(g, "#222", x - s(30), y - s(640), s(12));
      circle(g, "#222", x + s(25), y - s(640), s(12));
      rect(g, "#e8463a", x - s(110), y - s(540), s(220), s(40), s(20));
      return true;
    case "crystal":
    case "crystalRock": {
      const solid = id === "crystalRock";
      const c1 = seed < 0.5 ? "#00e5ff" : "#ff3df2";
      if (!solid) g.globalCompositeOperation = "lighter";
      poly(g, solid ? "#8f5bd8" : c1, x - s(160), y, x - s(60), y - s(520), x + s(40), y - s(700), x + s(160), y);
      poly(g, solid ? "#b98cff" : c1, x + s(40), y, x + s(150), y - s(380), x + s(260), y);
      g.globalCompositeOperation = "source-over";
      return true;
    }
    case "planet": {
      const py = y - s(1700 + seed * 1300);
      const c = seed < 0.5 ? "#ff8c5a" : "#7ad7ff";
      circle(g, c, x, py, s(450));
      circle(g, "rgba(255,255,255,.25)", x - s(140), py - s(140), s(160));
      g.strokeStyle = "rgba(255,255,255,.7)";
      g.lineWidth = s(50);
      g.beginPath();
      g.ellipse(x, py, s(760), s(170), -0.3, 0, 6.29);
      g.stroke();
      return true;
    }
    case "ufo": {
      const uy = y - s(1500 + seed * 800) + Math.sin(t * 2 + seed * 6) * s(60);
      ellipse(g, "#9ff6ff", x, uy - s(110), s(220), s(150));
      ellipse(g, "#b7bdc9", x, uy, s(520), s(120));
      for (let k = -2; k <= 2; k++) circle(g, (Math.floor(t * 4) + k) % 2 ? "#ffd23f" : "#ff3df2", x + s(k * 180), uy + s(20), s(36));
      return true;
    }
    // ---- obstacles ----
    case "cone":
      poly(g, "#ff7a1a", x - s(130), y, x + s(130), y, x, y - s(340));
      poly(g, "#ffffff", x - s(75), y - s(140), x + s(75), y - s(140), x + s(48), y - s(210), x - s(48), y - s(210));
      rect(g, "#ff7a1a", x - s(170), y - s(30), s(340), s(30));
      return true;
    case "barrier":
      rect(g, "#555", x - s(260), y - s(260), s(30), s(260));
      rect(g, "#555", x + s(230), y - s(260), s(30), s(260));
      rect(g, "#ffffff", x - s(320), y - s(340), s(640), s(130), s(20));
      for (let k = 0; k < 3; k++) poly(g, "#e8463a", x + s(-300 + k * 210), y - s(210), x + s(-215 + k * 210), y - s(210), x + s(-130 + k * 210), y - s(340), x + s(-215 + k * 210), y - s(340));
      return true;
    case "crate":
      rect(g, "#c08a4a", x - s(240), y - s(480), s(480), s(480), s(20));
      g.strokeStyle = "#8a5a2b";
      g.lineWidth = s(40);
      g.strokeRect(x - s(220), y - s(460), s(440), s(440));
      g.beginPath();
      g.moveTo(x - s(220), y - s(460));
      g.lineTo(x + s(220), y - s(20));
      g.stroke();
      return true;
    case "barrel":
      rect(g, "#2f80ed", x - s(200), y - s(540), s(400), s(540), s(60));
      rect(g, "#1f5fb8", x - s(200), y - s(400), s(400), s(40));
      rect(g, "#1f5fb8", x - s(200), y - s(180), s(400), s(40));
      ellipse(g, "#5aa0ff", x, y - s(540), s(200), s(40));
      return true;
    case "log":
      rect(g, "#7a5230", x - s(400), y - s(220), s(800), s(220), s(110));
      ellipse(g, "#c99a62", x + s(350), y - s(110), s(80), s(105));
      ellipse(g, "#a87a45", x + s(350), y - s(110), s(40), s(55));
      return true;
    case "stump":
      rect(g, "#7a5230", x - s(200), y - s(300), s(400), s(300), s(30));
      ellipse(g, "#c99a62", x, y - s(300), s(200), s(60));
      ellipse(g, "#a87a45", x, y - s(300), s(100), s(30));
      return true;
    case "tumbleweed":
      g.strokeStyle = "#a0763f";
      g.lineWidth = s(30);
      for (let k = 0; k < 4; k++) {
        g.beginPath();
        g.ellipse(x, y - s(220), s(220), s(190), k + t * 3, 0, 6.29);
        g.stroke();
      }
      return true;
    case "iceBlock":
      rect(g, "#bfe9ff", x - s(260), y - s(500), s(520), s(500), s(40));
      poly(g, "#e8f8ff", x - s(260), y - s(500), x + s(260), y - s(500), x + s(180), y - s(580), x - s(180), y - s(580));
      rect(g, "rgba(255,255,255,.7)", x - s(180), y - s(430), s(70), s(260), s(30));
      return true;
    case "snowball":
      circle(g, "#ffffff", x, y - s(240), s(240));
      circle(g, "#dfeaf5", x + s(70), y - s(180), s(120));
      return true;
    case "asteroid":
      circle(g, "#6f6a80", x, y - s(270), s(270));
      circle(g, "#5a566a", x - s(80), y - s(320), s(60));
      circle(g, "#5a566a", x + s(90), y - s(200), s(45));
      return true;
    case "satellite":
      rect(g, "#c7ccd6", x - s(130), y - s(460), s(260), s(260), s(20));
      rect(g, "#2f5fd0", x - s(520), y - s(400), s(360), s(140));
      rect(g, "#2f5fd0", x + s(160), y - s(400), s(360), s(140));
      circle(g, "#ffffff", x, y - s(540), s(80));
      rect(g, "#888", x - s(15), y - s(200), s(30), s(200));
      return true;
    // ---- pick-ups ----
    case "coin": {
      const cy = y - s(260 + Math.sin(t * 5 + seed * 9) * 40);
      const wob = Math.abs(Math.cos(t * 4 + seed * 7));
      ellipse(g, "#c98a00", x, cy, s(150) * wob + s(15), s(150));
      ellipse(g, "#ffd23f", x, cy, s(120) * wob + s(10), s(120));
      ellipse(g, "#fff6b0", x - s(30) * wob, cy - s(40), s(25) * wob + 1, s(30));
      return true;
    }
    case "fuel":
      rect(g, "#e8463a", x - s(170), y - s(460), s(340), s(420), s(40));
      rect(g, "#b8322a", x - s(110), y - s(520), s(160), s(80), s(20));
      rect(g, "#ffd23f", x + s(60), y - s(540), s(80), s(80), s(20));
      rect(g, "rgba(255,255,255,.35)", x - s(120), y - s(400), s(50), s(300), s(25));
      return true;
    case "star": {
      const cy = y - s(320);
      const r = s(200) * (1 + 0.1 * Math.sin(t * 6 + seed * 5));
      circle(g, "rgba(255,230,120,.35)", x, cy, r * 1.4);
      g.fillStyle = "#ffd23f";
      g.beginPath();
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + (k * Math.PI) / 5;
        const rr = k % 2 ? r * 0.45 : r;
        g.lineTo(x + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }
      g.fill();
      return true;
    }
    default:
      if (isEmoji(id)) {
        emojiAt(g, id, x, y - s(300), s(600));
        return true;
      }
      return false;
  }
}
