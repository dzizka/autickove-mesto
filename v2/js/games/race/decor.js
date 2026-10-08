// The road's surroundings that are not single pictures (part 24, DESIGN-v2 §4.1): rails along
// the road, bridge railings, tunnels with their entrance, glowing space rings, the gates over the start
// and the finish, and soft shadows under scenery. Drawn per segment, far to near (scene.js).

import { propPic, readyPic } from "../../render/car-pics.js";
import { drawPropPic } from "../../render/car-back.js";

const TUNNEL_H = 2000; // units (6.7 m; the camera is at 1000)
const TUNNEL_W = 1.32; // × half the road
const RING_H = 2300;

// rail colours: [band, shade, post], with a darker set for night
const RAILS = {
  guardrail: { band: ["#dfe3ea", "#8f98a4"], post: "#7d8590", h: [150, 270], posts: 4 },
  bridge: { band: ["#ffffff", "#c8ccd4"], post: "#e8463a", h: [170, 320], posts: 3, deck: "#8a8f99" },
  fence: { band: ["#b07a4a", "#7a4e2d"], post: "#7a4e2d", h: [140, 330], posts: 3, double: true },
  wall: { band: ["#e3ac6c", "#b9834b"], post: "#f0c58a", h: [0, 210], posts: 0, solid: true },
  glow: { band: ["#7df9ff", "#ff6ad5"], post: "#7df9ff", h: [170, 215], posts: 0, glow: true },
};
const NIGHT = { guardrail: { band: ["#8f96a8", "#4c5263"], post: "#4c5263" }, bridge: { band: ["#b9bfcc", "#6d7384"], post: "#a33a33" } };

/** x and y on screen at a projected point p for `off` units from the road centre and height h. */
const X = (p, R, off) => p.x + p.w * (off / R.half);
const Y = (p, V, h) => p.y - p.s * V.KX * h;
// tunnels and rings use the road's own vertical scale, so their roof is always above the eye
// (sprites use KX, which on a tall phone screen would put a 6 m roof below the camera)
const YT = (p, V, h) => p.y - p.s * V.KY * h;

function quad(g, c, ax, ay, bx, by, cx, cy, dx, dy) {
  g.fillStyle = c;
  g.beginPath();
  g.moveTo(ax, ay);
  g.lineTo(bx, by);
  g.lineTo(cx, cy);
  g.lineTo(dx, dy);
  g.fill();
}

/**
 * A rail (guardrail, fence, wall, glow, bridge railing) on both sides from segment s to segment
 * e (far away a few segments are drawn as one piece: fewer shapes, the same look).
 */
export function drawEdge(g, V, R, s, night, e = s) {
  const base = RAILS[s.edge];
  if (!base) return;
  const k = { ...base, ...(night ? NIGHT[s.edge] : null) };
  const a = s.p1;
  const b = e.p2;
  if (a.y - b.y < 0.4 && a.s * V.KX * base.h[1] < 0.6) return; // too small to see
  const [h0, h1] = k.h;
  if (k.glow) g.globalCompositeOperation = "lighter";
  for (const side of [-1, 1]) {
    const off = side * R.half * 1.16;
    const ax = X(a, R, off);
    const bx = X(b, R, off);
    if (k.deck) quad(g, k.deck, ax, a.y, bx, b.y, bx, Y(b, V, -260), ax, Y(a, V, -260)); // the bridge's side
    const band = (lo, hi, c) => quad(g, c, ax, Y(a, V, hi), bx, Y(b, V, hi), bx, Y(b, V, lo), ax, Y(a, V, lo));
    if (k.double) {
      band(h0, h0 + 45, k.band[s.c]);
      band(h1 - 45, h1, k.band[s.c]);
    } else {
      band(h0, h1, k.band[s.c]);
      if (!k.solid && !k.glow) band(h0, h0 + (h1 - h0) * 0.3, k.band[1]);
      if (k.solid) band(h1 - 40, h1, k.post);
    }
    if (k.posts && s.i % k.posts === 0 && a.s * V.KX * 45 > 0.5) {
      const w = Math.max(1, a.s * V.KX * 45);
      g.fillStyle = k.post;
      g.fillRect(ax - w / 2, Y(a, V, h1 + 30), w, a.y - Y(a, V, h1 + 30));
    }
  }
  g.globalCompositeOperation = "source-over";
}

/** Inside a tunnel: walls, ceiling and a lamp now and then. */
export function drawTunnel(g, V, R, s) {
  const c = R.decor.tunnel || {};
  const a = s.p1;
  const b = s.p2;
  const W = R.half * TUNNEL_W;
  const shade = s.c ? 0.88 : 1;
  for (const side of [-1, 1]) {
    const ax = X(a, R, side * W);
    const bx = X(b, R, side * W);
    quad(g, mix(c.wall, shade), ax, a.y, bx, b.y, bx, YT(b, V, TUNNEL_H), ax, YT(a, V, TUNNEL_H));
    // a coloured stripe along the wall
    quad(g, mix(c.ceil, 0.9), ax, YT(a, V, 520), bx, YT(b, V, 520), bx, YT(b, V, 600), ax, YT(a, V, 600));
  }
  quad(g, mix(c.ceil, shade), X(a, R, -W), YT(a, V, TUNNEL_H), X(b, R, -W), YT(b, V, TUNNEL_H), X(b, R, W), YT(b, V, TUNNEL_H), X(a, R, W), YT(a, V, TUNNEL_H));
  if (s.i % 8 === 0) {
    for (const side of [-0.5, 0.5]) {
      const lw = W * 0.12;
      quad(g, c.light || "#fff3b0", X(a, R, side * W - lw), YT(a, V, TUNNEL_H - 5), X(b, R, side * W - lw), YT(b, V, TUNNEL_H - 5), X(b, R, side * W + lw), YT(b, V, TUNNEL_H - 5), X(a, R, side * W + lw), YT(a, V, TUNNEL_H - 5));
    }
  }
}

/** The tunnel's entrance: a hill (or rock, or mountain) with a round-topped hole. */
export function drawPortal(g, V, R, s) {
  const c = R.decor.tunnel || {};
  const a = s.p1;
  const W = R.half * TUNNEL_W;
  const F = W + 9000;
  const top = TUNNEL_H + 2600;
  const hill = (lift) => {
    g.moveTo(X(a, R, -F), a.y + 2);
    g.lineTo(X(a, R, -F), YT(a, V, top * 0.35 - lift));
    g.bezierCurveTo(X(a, R, -F * 0.55), YT(a, V, top * 1.05 - lift), X(a, R, F * 0.55), YT(a, V, top * 1.05 - lift), X(a, R, F), YT(a, V, top * 0.35 - lift));
    g.lineTo(X(a, R, F), a.y + 2);
    g.closePath();
  };
  const hole = () => {
    const l = X(a, R, -W);
    const r = X(a, R, W);
    const tp = YT(a, V, TUNNEL_H);
    const rad = Math.min((r - l) / 2, (a.y - tp) * 0.6);
    g.moveTo(l, a.y + 2);
    g.lineTo(l, tp + rad);
    g.quadraticCurveTo(l, tp, l + rad, tp);
    g.lineTo(r - rad, tp);
    g.quadraticCurveTo(r, tp, r, tp + rad);
    g.lineTo(r, a.y + 2);
    g.closePath();
  };
  g.beginPath();
  hill(0);
  hole();
  g.fillStyle = c.top || "#62c162";
  g.fill("evenodd");
  g.beginPath();
  hill(1100);
  hole();
  g.fillStyle = c.face || "#9aa3ad";
  g.fill("evenodd");
  // the stone frame round the hole
  g.beginPath();
  hole();
  g.strokeStyle = mix(c.face || "#9aa3ad", 0.7);
  g.lineWidth = Math.max(2, a.s * V.KX * 160);
  g.stroke();
}

/** Space: glowing rings over the road. */
export function drawRing(g, V, R, s, t) {
  if (s.i % 10) return;
  const a = s.p1;
  const W = R.half * 1.35;
  g.save();
  g.globalCompositeOperation = "lighter";
  g.strokeStyle = (s.i / 10) % 2 ? "rgba(255,90,220,.85)" : "rgba(80,240,255,.85)";
  g.lineWidth = Math.max(2, a.s * V.KX * (110 + 25 * Math.sin(t * 5 + s.i)));
  g.beginPath();
  g.ellipse(a.x, a.y, X(a, R, W) - a.x, a.y - YT(a, V, RING_H), 0, Math.PI, Math.PI * 2);
  g.stroke();
  g.restore();
}

/** The gate over the start or the finish (a 3D picture; a simple arch until it is ready). */
export function drawGate(g, V, R, s) {
  const a = s.p1;
  const pic = readyPic(propPic(`proc:${s.gate}:${R.lanes}`, { lazy: !!R.lazyPics }));
  if (pic) {
    drawPropPic(g, pic, a.x, a.y, a.s * V.KX * pic.meta.size[0] * 300);
    return;
  }
  if (s.gate !== "gate") return;
  const pole = Math.max(2, a.w * 0.04);
  const h = a.s * 1700 * V.KX;
  const top = a.y - h;
  for (const side of [-1, 1]) {
    g.fillStyle = "#e4e9f0";
    g.fillRect(a.x + side * a.w * 1.12 - pole / 2, top, pole, h);
  }
  const bw = a.w * 2.24;
  const bh = h * 0.16;
  for (let k = 0; k < 16; k++) {
    for (let r = 0; r < 2; r++) {
      g.fillStyle = (k + r) % 2 ? "#111111" : "#ffffff";
      g.fillRect(a.x - bw / 2 + (k * bw) / 16, top + (r * bh) / 2, bw / 16 + 0.5, bh / 2 + 0.5);
    }
  }
}

/** A soft shadow on the ground under something `w` units wide. */
export function groundSpot(g, x, y, w, u, night) {
  const rx = w * 0.46 * u;
  if (!(rx > 1)) return;
  g.fillStyle = night ? "rgba(0,0,0,.25)" : "rgba(20,40,20,.2)";
  g.beginPath();
  g.ellipse(x, y, rx, rx * 0.2, 0, 0, 6.29);
  g.fill();
}

/** A colour made darker (k < 1). */
function mix(hex, k) {
  const n = parseInt(String(hex || "#888888").slice(1), 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${ch(n >> 16)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}
