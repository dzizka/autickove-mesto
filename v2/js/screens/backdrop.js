// Calm moving background for the menu screens and the games room (DESIGN-v2 §14, option A):
// sky by the time of day, slow clouds, a far town and hills at the bottom, now and then a
// little car on the far road and a balloon in the sky. Pale and slow, so it never distracts.
// Hidden on the home screen (it has its own road) and in the races; still in the small games;
// still everywhere when the parents turn off "Pohyblivé pozadie".

import { createLoop } from "../core/loop.js";
import { getState } from "../core/state.js";

const FPS = 20;
const HIDDEN = new Set(["home", "game-race"]);
const SKIES = {
  morning: ["#ffd3b0", "#fff1dc"],
  day: ["#9fdcff", "#e8f7ff"],
  evening: ["#ffb08a", "#ffe0c0"],
  night: ["#17204d", "#3c4c8c"],
};
const HOUSE = ["#ffb4a2", "#ffd166", "#8ecae6", "#cdb4db", "#b5e48c", "#a3c4f3", "#f1c0e8", "#fde4cf"];
const CAR = ["#ff5a5f", "#2f80ed", "#ffd23f", "#3ebd4a", "#8f5bd8", "#ff8c42"];

export function dayPhase(date = new Date()) {
  const hr = date.getHours();
  return hr >= 21 || hr < 6 ? "night" : hr < 9 ? "morning" : hr < 18 ? "day" : "evening";
}

function seeded(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

/** The far town and hills, drawn once per screen size. */
function farLayer(w, h, night) {
  const cv = document.createElement("canvas");
  const lh = Math.round(Math.min(220, h * 0.26));
  cv.width = w;
  cv.height = lh;
  const g = cv.getContext("2d");
  const rnd = seeded(7);
  // hills
  g.fillStyle = night ? "#2a4a4a" : "#bfe6b0";
  g.beginPath();
  g.moveTo(0, lh);
  for (let x = 0; x <= w; x += 40) g.lineTo(x, lh * 0.45 + Math.sin(x / 170) * lh * 0.12 + Math.sin(x / 61) * lh * 0.04);
  g.lineTo(w, lh);
  g.fill();
  // houses and towers
  for (let x = -10; x < w; ) {
    const bw = 26 + rnd() * 46;
    const bh = lh * (0.25 + rnd() * 0.45);
    const y = lh * 0.86 - bh;
    g.fillStyle = night ? "#34406e" : HOUSE[Math.floor(rnd() * HOUSE.length)];
    g.globalAlpha = night ? 1 : 0.75;
    g.fillRect(x, y, bw, bh + lh);
    g.globalAlpha = 1;
    // windows (lit at night)
    for (let wy = y + 8; wy < lh * 0.8; wy += 14) {
      for (let wx = x + 6; wx < x + bw - 8; wx += 12) {
        if (rnd() < 0.55) continue;
        g.fillStyle = night ? (rnd() < 0.7 ? "#ffd86b" : "#4a5688") : "rgba(255,255,255,.7)";
        g.fillRect(wx, wy, 6, 7);
      }
    }
    x += bw + 4 + rnd() * 30;
  }
  // the far road
  g.fillStyle = night ? "#2b2f45" : "#9aa3b3";
  g.fillRect(0, lh * 0.86, w, lh * 0.14);
  g.fillStyle = night ? "rgba(255,240,170,.5)" : "rgba(255,255,255,.8)";
  for (let x = 0; x < w; x += 34) g.fillRect(x, lh * 0.925, 16, 2);
  return { cv, h: lh };
}

function cloud(g, x, y, s, alpha) {
  g.fillStyle = `rgba(255,255,255,${alpha})`;
  g.beginPath();
  for (const [dx, dy, r] of [[0, 0, 22], [24, -10, 26], [52, 0, 20], [28, 6, 22]]) {
    g.moveTo(x + dx * s + r * s, y + dy * s);
    g.arc(x + dx * s, y + dy * s, r * s, 0, 6.29);
  }
  g.fill();
}

function littleCar(g, x, y, color, dir) {
  g.fillStyle = color;
  g.beginPath();
  g.roundRect(x - 13, y - 9, 26, 8, 3);
  g.roundRect(x - 7 + dir * 2, y - 14, 13, 6, 3);
  g.fill();
  g.fillStyle = "#2b2d33";
  for (const wx of [-7, 7]) {
    g.beginPath();
    g.arc(x + wx, y - 1, 3, 0, 6.29);
    g.fill();
  }
}

/** Start once; it follows the screen changes by itself. Returns { stop() }. */
export function startBackdrop() {
  const canvas = document.createElement("canvas");
  canvas.className = "backdrop";
  canvas.dataset.testid = "backdrop";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const g = canvas.getContext("2d");

  let w = 0;
  let h = 0;
  let phase = dayPhase();
  let far = null;
  let t = 0;
  let wait = 0;
  let last = 0;
  const rnd = Math.random;
  const clouds = Array.from({ length: 6 }, (_, i) => ({ x: rnd() * 1.2 - 0.1, y: 0.06 + rnd() * 0.32, s: 0.7 + rnd() * 0.9, v: 4 + rnd() * 8, i }));
  let cars = [];
  let balloon = null;
  let carIn = 2;

  const resize = () => {
    w = Math.max(1, innerWidth);
    h = Math.max(1, innerHeight);
    canvas.width = w;
    canvas.height = h;
    phase = dayPhase();
    far = farLayer(w, h, phase === "night");
  };

  function draw() {
    const [top, bottom] = SKIES[phase] || SKIES.day;
    const night = phase === "night";
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, top);
    sky.addColorStop(1, bottom);
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);
    if (night) {
      const rs = seeded(3);
      for (let i = 0; i < 90; i++) {
        g.fillStyle = `rgba(255,255,255,${0.35 + 0.4 * Math.abs(Math.sin(t * 0.6 + i))})`;
        g.fillRect(rs() * w, rs() * h * 0.6, 1.6, 1.6);
      }
    }
    // sun or moon, top right
    g.fillStyle = night ? "#fff7d6" : "rgba(255,243,176,.9)";
    g.beginPath();
    g.arc(w * 0.86, h * 0.12, Math.min(48, w * 0.04), 0, 6.29);
    g.fill();
    for (const c of clouds) cloud(g, ((c.x * w + t * c.v) % (w + 240)) - 120, c.y * h, c.s, night ? 0.12 : 0.75);
    if (balloon) {
      const bx = balloon.x + (t - balloon.t0) * 14;
      const by = balloon.y + Math.sin(t) * 6;
      g.fillStyle = balloon.c;
      g.beginPath();
      g.ellipse(bx, by, 14, 17, 0, 0, 6.29);
      g.fill();
      g.strokeStyle = "rgba(80,60,40,.6)";
      g.beginPath();
      g.moveTo(bx, by + 17);
      g.lineTo(bx, by + 28);
      g.stroke();
      g.fillStyle = "#a0703c";
      g.fillRect(bx - 4, by + 28, 8, 6);
      if (bx > w + 40) balloon = null;
    }
    g.drawImage(far.cv, 0, h - far.h);
    const roadY = h - far.h * 0.05;
    for (const c of cars) littleCar(g, c.x, roadY - (c.dir > 0 ? 0 : far.h * 0.05), c.color, c.dir);
  }

  function step(dt) {
    t += dt;
    carIn -= dt;
    if (carIn <= 0) {
      carIn = 4 + Math.random() * 7;
      const dir = Math.random() < 0.5 ? 1 : -1;
      cars.push({ x: dir > 0 ? -30 : w + 30, dir, v: 40 + Math.random() * 30, color: CAR[Math.floor(Math.random() * CAR.length)] });
    }
    for (const c of cars) c.x += c.dir * c.v * dt;
    cars = cars.filter((c) => c.x > -40 && c.x < w + 40);
    if (!balloon && Math.random() < dt / 40) balloon = { x: -30, y: h * (0.15 + Math.random() * 0.25), t0: t, c: CAR[Math.floor(Math.random() * CAR.length)] };
  }

  const visible = () => !HIDDEN.has(document.body.dataset.screen || "");
  const moving = () => getState().settings.motion !== false && document.body.dataset.mode !== "game" && !matchMedia("(prefers-reduced-motion: reduce)").matches;

  const loop = createLoop({
    update() {},
    draw() {
      const now = performance.now() / 1000;
      const dt = Math.min(0.2, now - (last || now));
      last = now;
      const show = visible();
      canvas.hidden = !show;
      if (!show) return;
      wait += dt;
      if (wait < 1 / FPS) return;
      if (moving()) step(wait);
      else if (canvas.dataset.drawn === "still") return; // a still picture is drawn once
      canvas.dataset.drawn = moving() ? "moving" : "still";
      wait = 0;
      draw();
    },
  });
  // redraw the still picture when the screen or setting changes
  const mo = new MutationObserver(() => delete canvas.dataset.drawn);
  mo.observe(document.body, { attributes: true, attributeFilter: ["data-screen", "data-mode"] });
  addEventListener("resize", () => (resize(), delete canvas.dataset.drawn));
  resize();
  loop.start();
  return {
    stop() {
      loop.stop();
      mo.disconnect();
      canvas.remove();
    },
  };
}
