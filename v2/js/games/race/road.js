// Pseudo-3D road (DESIGN-v2 §4.1): segments with curves and hills, the camera projection,
// the sky with parallax layers and the road surface. Curves and hills are only for the eye:
// the race itself (physics.js) stays straight lanes and metres.

import { RACE } from "../../data/tracks.js";
import { spriteWidth } from "../../render/road-sprites.js";
import { DECOR, MODELS } from "../../data/race-props.js";

export const M = 300; // world units per metre
export const SEG = 200; // segment length in units (2/3 m)
export const CAM_H = 1000; // camera height in units
export const DEPTH = 1 / Math.tan((33 * Math.PI) / 180); // field of view 66°: things ahead look bigger
export const PLAYER_Z = CAM_H * DEPTH; // the camera sits this far behind the car
export const DRAW = 150; // segments drawn (100 m)
export const CAR_W = 540; // car width in units
export const LANE = RACE.laneWidth * M;
const RUMBLE = 4; // segments per kerb stripe
const START = -(14 * M + PLAYER_Z); // road starts a bit behind the grid
const AFTER = 260; // metres of road after the finish line
const FOG = { day: 3, night: 6 }; // fog density (higher = thicker)

const lerp = (a, b, t) => a + (b - a) * t;
const easeIn = (a, b, t) => a + (b - a) * t * t;
const easeOut = (a, b, t) => a + (b - a) * (1 - (1 - t) * (1 - t));
const easeIO = (a, b, t) => a + (b - a) * (0.5 - Math.cos(t * Math.PI) / 2);
const finite = (v, f = 0) => (Number.isFinite(v) ? v : f);

function seeded(seed) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const point = () => ({ cz: 0, s: 0, x: 0, y: 0, w: 0 });

/** Build all segments for a race of `length` metres on `track`. */
export function buildRoad(track, length) {
  const lanes = track.lanes || RACE.lanes;
  const half = (lanes * LANE) / 2;
  const segs = [];
  let y = 0;
  const add = (curve, yEnd) => {
    const i = segs.length;
    const z1 = START + i * SEG;
    const mark = z1 + SEG > 2.3 * M && z1 < 3.5 * M ? "start" : z1 + SEG > length * M && z1 < (length + 2.4) * M ? "finish" : null;
    segs.push({ i, z1, curve: finite(curve), y1: y, y2: finite(yEnd, y), c: Math.floor(i / RUMBLE) % 2, mark, p1: point(), p2: point(), clip: 0, n: -1, frame: -1, scenery: [], land: null, edge: null });
    y = finite(yEnd, y);
  };
  const section = (metres, curve, hill) => {
    const n = Math.max(6, Math.round((finite(metres, 50) * M) / SEG));
    const e = Math.floor(n * 0.3);
    const l = Math.floor(n * 0.3);
    const hold = n - e - l;
    const y0 = y;
    const y1 = y0 + finite(hill) * SEG;
    for (let k = 0; k < n; k++) {
      const c = k < e ? easeIn(0, curve, k / e) : k < e + hold ? curve : easeOut(curve, 0, (k - e - hold) / l);
      add(c, easeIO(y0, y1, (k + 1) / n));
    }
  };
  section(70 + 14, 0, 0); // straight, flat start
  const plan = Array.isArray(track.road) && track.road.length ? track.road : [[100, 0, 0]];
  for (let k = 0; START + segs.length * SEG < (length + AFTER) * M; k++) section(...plan[k % plan.length]);

  const decor = DECOR[track.id] || {};
  placeDecor(segs, track, decor, half, length);
  return { segs, track, lanes, half, length, decor, detail: 1 };
}

/**
 * The surroundings (part 24, DESIGN-v2 §4.1), the same every time on a track: landmarks
 * (bridge, tunnel, rings), rails in stretches, big things away from the road and small things
 * right beside it (each side on its own, so the sides never mirror), posts, lamps, and the
 * grandstands, flags and gates at the start and the finish.
 */
function placeDecor(segs, track, decor, half, length) {
  const rnd = seeded([...track.id].reduce((h, ch) => h * 31 + ch.charCodeAt(0), 7));
  const pick = (list) => list[Math.floor(rnd() * list.length)];
  const between = ([a, b]) => a + Math.floor(rnd() * (b - a + 1));
  const kerb = half * 1.14;
  const at = (z) => Math.max(0, Math.min(segs.length - 1, Math.floor((z - START) / SEG)));
  const start = segs.findIndex((s) => s.mark === "start");
  const finish = segs.findIndex((s) => s.mark === "finish");
  const busy = (i) => (start >= 0 && Math.abs(i - start) < 14) || (finish >= 0 && Math.abs(i - finish) < 14);

  for (const l of decor.landmarks || []) {
    const a = at(l.at * length * M);
    const b = Math.min(at((l.at * length + l.len) * M), finish > 0 ? finish - 30 : segs.length - 1);
    for (let i = a; i <= b; i++) segs[i].land = l.kind;
    if (b > a) segs[a].landStart = l.kind;
  }
  // rails in stretches; a bridge always has its railing
  for (let i = 0, on = false; i < segs.length; ) {
    const n = decor.edge ? between([Math.round(decor.edge.stretch[on ? 0 : 1] * 0.6), decor.edge.stretch[on ? 0 : 1]]) : segs.length;
    for (let k = i; k < Math.min(segs.length, i + n); k++) segs[k].edge = on && decor.edge && !segs[k].land ? decor.edge.kind : null;
    i += n;
    on = !on;
  }
  for (const s of segs) if (s.land === "bridge") s.edge = "bridge";

  const free = (i) => !segs[i].land && !busy(i);
  const put = (i, id, side, off, extra = {}) => segs[i].scenery.push({ id, off: side * off, side, seed: rnd(), ...extra });
  const sea = track.scene?.sea; // the beach: the sea on one side, with its own things (part 25)
  for (const side of [-1, 1]) {
    const onSea = sea && sea.side === side;
    const farList = onSea ? decor.farSea : decor.far;
    const nearList = onSea ? decor.nearSea : decor.near;
    if (farList?.length) {
      for (let i = 4 + between([0, 6]); i < segs.length; i += between(decor.farEvery || [5, 10])) {
        if (!free(i)) continue;
        const id = pick(farList);
        const from = onSea ? half * sea.from + 700 + rnd() * 2600 : kerb + 380 + rnd() * 1700;
        put(i, id, side, from + spriteWidth(id) / 2, { shadow: !!MODELS[id] && !onSea });
      }
    }
    if (nearList?.length) {
      for (let i = 3 + between([0, 4]); i < segs.length; i += between(decor.nearEvery || [6, 10])) {
        if (!free(i)) continue;
        const id = pick(nearList);
        put(i, id, side, kerb + spriteWidth(id) / 2 + 140 + rnd() * 260, { shadow: true, small: true });
      }
    }
  }
  // posts and lamps keep a beat, on both sides in turn
  const beat = (every, id, off) => {
    for (let i = 6, k = 0; i < segs.length; i += every, k++) if (!segs[i].land || segs[i].land === "bridge") put(i, id, k % 2 ? 1 : -1, off, { keep: true });
  };
  if (decor.posts) beat(decor.posts.every, decor.posts.id, kerb + 90);
  if (decor.lamps) beat(decor.lamps, "lamp", kerb + 110);
  // the start and the finish: gates over the road, grandstands and flags beside it
  for (const [i, gate] of [[start, "startGate"], [finish, "gate"]]) {
    if (i < 0) continue;
    segs[i].gate = gate;
    const stands = decor.stands || [];
    stands.forEach((id, k) => {
      const j = Math.max(0, Math.min(segs.length - 1, i + 2 + k * 5));
      for (const side of [-1, 1]) put(j, id, side, kerb + spriteWidth(id) / 2 + 220, { shadow: k === 0, keep: true });
    });
  }
}

export function segIndex(R, z) {
  return Math.max(0, Math.min(R.segs.length - 1, Math.floor((z - START) / SEG)));
}

/** Screen geometry for a canvas of w × h CSS pixels. */
export function makeView(w, h) {
  const horizon = h * (w > h ? 0.4 : 0.44);
  const carY = h * 0.9;
  const carPx = Math.min(w * 0.22, h * 0.2);
  return { w, h, horizon, carY, carPx, KX: (carPx * CAM_H) / CAR_W, KY: carY - horizon };
}

/** Fog 0..1 for the n-th segment ahead. */
export function fogAt(n, k) {
  return 1 - Math.exp(-((n / DRAW) ** 2) * k);
}

export function fogDensity(track, lightRange = 1) {
  return track.scene?.night ? FOG.night / Math.max(1, lightRange) : FOG.day;
}

/** Metres of road ahead where the fog is less than half (reaction time, §4.1). */
export function clearViewMetres(track, lightRange = 1) {
  const n = DRAW * Math.sqrt(Math.log(2) / fogDensity(track, lightRange));
  return (n * SEG) / M - PLAYER_Z / M;
}

function project(p, wy, wz, camX, camY, camZ, V, half) {
  p.cz = wz - camZ;
  p.s = DEPTH / p.cz;
  p.x = V.w / 2 - p.s * camX * V.KX;
  p.y = V.horizon - p.s * (wy - camY) * V.KY;
  p.w = p.s * half * V.KX;
}

function quad(g, c, x1, y1, w1, x2, y2, w2) {
  g.fillStyle = c;
  g.beginPath();
  g.moveTo(x1 - w1, y1);
  g.lineTo(x1 + w1, y1);
  g.lineTo(x2 + w2, y2);
  g.lineTo(x2 - w2, y2);
  g.fill();
}

function drawSegment(g, V, R, s, fog, fogColor) {
  const sc = R.track.scene;
  const a = s.p1;
  const b = s.p2;
  const ay = a.y + 1; // 1 px overlap hides seams
  // under a bridge the grass is a river (part 24)
  g.fillStyle = s.land === "bridge" && R.decor?.water ? R.decor.water[s.c] : sc.grass[s.c];
  g.fillRect(0, b.y, V.w, ay - b.y);
  if (sc.sea && s.land !== "bridge") {
    // the beach (part 25): the sea from `from` × half the road outwards, with a line of foam
    const k = sc.sea.side * sc.sea.from;
    const xa = a.x + a.w * k;
    const xb = b.x + b.w * k;
    const edge = sc.sea.side < 0 ? 0 : V.w;
    g.fillStyle = sc.sea.colors[s.c];
    g.beginPath();
    g.moveTo(edge, ay);
    g.lineTo(xa, ay);
    g.lineTo(xb, b.y);
    g.lineTo(edge, b.y);
    g.fill();
    const f = sc.sea.side * 0.12;
    quad(g, sc.sea.foam, xa + a.w * f * 0.5, ay, a.w * 0.06, xb + b.w * f * 0.5, b.y, b.w * 0.06);
  }
  quad(g, sc.rumble[s.c], a.x, ay, a.w * 1.1, b.x, b.y, b.w * 1.1);
  if (s.mark === "finish") {
    const cols = R.lanes * 4;
    for (let k = 0; k < cols; k++) {
      const f1 = -1 + (2 * k) / cols;
      const f2 = -1 + (2 * (k + 1)) / cols;
      g.fillStyle = (k + s.i) % 2 ? "#111111" : "#ffffff";
      g.beginPath();
      g.moveTo(a.x + a.w * f1, ay);
      g.lineTo(a.x + a.w * f2, ay);
      g.lineTo(b.x + b.w * f2, b.y);
      g.lineTo(b.x + b.w * f1, b.y);
      g.fill();
    }
  } else {
    quad(g, s.mark === "start" ? "#f4f4f4" : sc.road[s.c], a.x, ay, a.w, b.x, b.y, b.w);
    if (s.c && !s.mark) {
      const l1 = a.w * 0.03;
      const l2 = b.w * 0.03;
      for (let k = 1; k < R.lanes; k++) {
        const f = -1 + (2 * k) / R.lanes;
        quad(g, sc.line, a.x + a.w * f, ay, l1, b.x + b.w * f, b.y, l2);
      }
    }
  }
  if (s.land === "tunnel") {
    g.fillStyle = "rgba(0,0,0,.22)"; // dimmer inside a tunnel
    g.fillRect(0, b.y, V.w, ay - b.y);
  }
  if (fog > 0.02) {
    g.globalAlpha = fog;
    g.fillStyle = fogColor;
    g.fillRect(0, b.y, V.w, ay - b.y);
    g.globalAlpha = 1;
  }
}

/**
 * Project and draw the road for this frame. cam = { z, x, frame, fog } (units).
 * Returns { base, camY } and leaves every drawn segment with projected p1/p2, n and clip.
 */
export function renderRoad(g, V, R, cam) {
  const { segs } = R;
  const base = segIndex(R, cam.z);
  const b0 = segs[base];
  const pz = cam.z + PLAYER_Z;
  const ps = segs[segIndex(R, pz)];
  const camY = lerp(ps.y1, ps.y2, Math.max(0, Math.min(1, (pz - ps.z1) / SEG))) + CAM_H;
  let maxy = V.h;
  let x = 0;
  let dx = -b0.curve * Math.max(0, Math.min(1, (cam.z - b0.z1) / SEG));
  const fogColor = R.track.scene.fog;
  for (let n = 0; n < DRAW && base + n < segs.length; n++) {
    const s = segs[base + n];
    project(s.p1, s.y1, s.z1, cam.x - x, camY, cam.z, V, R.half);
    project(s.p2, s.y2, s.z1 + SEG, cam.x - x - dx, camY, cam.z, V, R.half);
    x += dx;
    dx += s.curve;
    s.clip = maxy;
    s.n = n;
    s.frame = cam.frame;
    if (s.p1.cz <= DEPTH || s.p2.y >= s.p1.y || s.p2.y >= maxy) continue;
    drawSegment(g, V, R, s, fogAt(n, cam.fog), fogColor);
    maxy = s.p2.y;
  }
  return { base, camY };
}

// ---------- sky ----------

function layerCanvas(w, h, dpr, draw) {
  const cv = document.createElement("canvas");
  cv.width = Math.max(1, Math.ceil(w * dpr));
  cv.height = Math.max(1, Math.ceil(h * dpr));
  const g = cv.getContext("2d");
  g.scale(dpr, dpr);
  draw(g);
  return cv;
}

function silhouette(g, kind, w, h, color, layer, night) {
  const rnd = seeded(99 + layer * 17);
  g.fillStyle = color;
  if (kind === "skyline") {
    for (let x = 0; x < w; ) {
      const bw = w * (0.03 + rnd() * 0.05);
      const bh = h * (0.25 + rnd() * 0.55) * (layer ? 0.75 : 1);
      g.fillStyle = color;
      g.fillRect(x, h - bh, bw + 1, bh);
      if (night && layer) {
        g.fillStyle = "#ffd86b";
        for (let wy = h - bh + 6; wy < h - 4; wy += 9) for (let wx = x + 4; wx < x + bw - 4; wx += 8) if (rnd() < 0.35) g.fillRect(wx, wy, 3, 4);
      }
      x += bw;
    }
    return;
  }
  const amp = h * (layer ? 0.45 : 0.8);
  g.beginPath();
  g.moveTo(0, h);
  for (let x = 0; x <= w; x += 4) {
    const p = (x / w) * Math.PI * 2;
    let y;
    if (kind === "mountains") {
      const k = layer ? 9 : 6;
      const tri = Math.abs(((x / w) * k) % 1 - 0.5) * 2;
      y = amp * (0.35 + 0.65 * (1 - tri)) + amp * 0.08 * Math.sin(p * 23);
    } else if (kind === "dunes") y = amp * (0.45 + 0.3 * Math.sin(p * 3 + layer) + 0.15 * Math.sin(p * 7 + layer * 2));
    else y = amp * (0.5 + 0.25 * Math.sin(p * 4 + layer) + 0.15 * Math.sin(p * 9 + layer * 2));
    g.lineTo(x, h - Math.max(0, y));
  }
  g.lineTo(w, h);
  g.fill();
  if (kind === "mountains" && !layer) {
    g.fillStyle = "#ffffff";
    const k = 6;
    for (let i = 0; i < k; i++) {
      const px = ((i + 0.5) / k) * w;
      g.beginPath();
      g.moveTo(px, h - amp);
      g.lineTo(px - w * 0.022, h - amp * 0.8);
      g.lineTo(px + w * 0.022, h - amp * 0.8);
      g.fill();
    }
  }
}

/** Sky, stars and two parallax layers, drawn once per screen size. */
export function createBackdrop(track, V, dpr = 1) {
  const sc = track.scene;
  const H = Math.max(8, V.horizon);
  const sky = layerCanvas(V.w, H, dpr, (g) => {
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, sc.sky[0]);
    grad.addColorStop(1, sc.sky[1]);
    g.fillStyle = grad;
    g.fillRect(0, 0, V.w, H);
    if (sc.stars) {
      const rnd = seeded(5);
      for (let i = 0; i < 140; i++) {
        g.fillStyle = `rgba(255,255,255,${0.35 + rnd() * 0.6})`;
        const r = 0.6 + rnd() * 1.3;
        g.fillRect(rnd() * V.w, rnd() * H * 0.95, r, r);
      }
    }
  });
  const layers = sc.far === "space" ? [] : [0, 1].map((layer) => {
    const lw = Math.ceil(V.w * 2);
    const lh = Math.ceil(H * 0.32);
    return { cv: layerCanvas(lw, lh, dpr, (g) => silhouette(g, sc.far, lw, lh, sc.hills[layer], layer, !!sc.night)), w: lw, h: lh, f: 0.3 + layer * 0.35 };
  });
  return { sky, layers, sc };
}

export function drawBackdrop(g, V, bd, skyX) {
  g.drawImage(bd.sky, 0, 0, V.w, V.horizon + 1);
  const sc = bd.sc;
  const sx = V.w * 0.74 - ((skyX * V.w * 0.08) % V.w);
  const sy = V.horizon * 0.3;
  const r = Math.min(V.w, V.h) * 0.05;
  if (sc.sun === "sun" || sc.sun === "bigSun") {
    const k = sc.sun === "bigSun" ? 1.6 : 1;
    g.fillStyle = "rgba(255,240,150,.45)";
    g.beginPath();
    g.arc(sx, sy, r * 1.5 * k, 0, 6.29);
    g.fill();
    g.fillStyle = "#fff3b0";
    g.beginPath();
    g.arc(sx, sy, r * k, 0, 6.29);
    g.fill();
  } else if (sc.sun === "moon") {
    g.fillStyle = "#fff7d6";
    g.beginPath();
    g.arc(sx, sy, r, 0, 6.29);
    g.fill();
  } else if (sc.sun === "planet") {
    g.fillStyle = "#ff8c5a";
    g.beginPath();
    g.arc(V.w * 0.22, V.horizon * 0.35, r * 1.5, 0, 6.29);
    g.fill();
    g.fillStyle = "rgba(255,255,255,.25)";
    g.beginPath();
    g.arc(V.w * 0.22 - r * 0.4, V.horizon * 0.35 - r * 0.4, r * 0.6, 0, 6.29);
    g.fill();
  }
  for (const L of bd.layers) {
    const off = (((skyX * V.w * L.f) % L.w) + L.w) % L.w;
    const y = V.horizon - L.h + 1;
    g.drawImage(L.cv, -off, y, L.w, L.h);
    g.drawImage(L.cv, L.w - off, y, L.w, L.h);
  }
  g.fillStyle = sc.fog;
  g.fillRect(0, V.horizon, V.w, V.h - V.horizon);
}
