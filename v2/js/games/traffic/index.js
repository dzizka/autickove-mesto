// 🚦 Križovatka (DESIGN-v2 §12): cars come from the left and from the top. A tap anywhere switches
// the lights (with a short yellow). Cars that meet in the middle only bump, wait and go on:
// there is no losing, a bump just costs a star.

import { h } from "../../core/ui.js";
import { TRAFFIC } from "../../data/minigames.js";
import { miniDef, starsFor } from "../../systems/minigames.js";
import { drawCarTop } from "../../render/car-top.js";
import { emojiAt } from "../../render/road-sprites.js";
import { createShell } from "../mini/shell.js";

let shell = null;
let cleanup = [];

export default {
  id: "traffic",
  title: "Križovatka",
  icon: "🚦",
  unlockLevel: miniDef("traffic").unlockLevel,

  start(view, ctx) {
    shell = createShell(view, ctx, this);
    const sh = shell;
    const L = sh.level - 1;
    const goal = TRAFFIC.cars[L];
    const canvas = h("canvas", { class: "traffic-canvas", "data-testid": "traffic-canvas" });
    sh.stage.append(canvas);
    const g = canvas.getContext("2d");
    let W = 300;
    let H = 300;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = sh.stage.getBoundingClientRect();
      W = Math.max(200, Math.floor(r.width));
      H = Math.max(200, Math.floor(r.height));
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    // the stage gets its final size after layout: follow it
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(resize) : null;
    ro?.observe(sh.stage);
    window.addEventListener("resize", resize);

    let green = "h"; // which way has green: h (from the left) or v (from the top)
    let next = null; // during yellow: the way that gets green next
    let yellowT = 0;
    let spawnT = 1;
    let passed = 0;
    let bumps = 0;
    let time = 0;
    let finished = false;
    let tapped = false;
    const cars = [];
    const booms = [];
    const geo = () => {
      const R = Math.min(W, H) * 0.26;
      return { R, cx: W / 2, cy: H / 2, len: R * 0.42, wid: R * 0.25 };
    };

    const toggle = () => {
      if (finished || next) return;
      tapped = true;
      next = green === "h" ? "v" : "h";
      green = null;
      yellowT = TRAFFIC.yellow;
      ctx.audio.tone(440, 0.1, { type: "square", volume: 0.08 });
    };
    canvas.addEventListener("pointerdown", toggle);
    const key = (e) => (e.key === " " || e.key === "Enter") && (e.preventDefault(), toggle());
    window.addEventListener("keydown", key);
    cleanup = [() => ro?.disconnect(), () => window.removeEventListener("resize", resize), () => window.removeEventListener("keydown", key), () => canvas.removeEventListener("pointerdown", toggle)];

    const inBox = (c, G) => {
      const head = c.s + G.len / 2;
      const tail = c.s - G.len / 2;
      const [a, b] = c.dir === "h" ? [G.cx - G.R / 2, G.cx + G.R / 2] : [G.cy - G.R / 2, G.cy + G.R / 2];
      return head > a && tail < b;
    };

    function spawn(G) {
      const hCount = cars.filter((c) => c.dir === "h").length;
      const vCount = cars.length - hCount;
      const dir = hCount === vCount ? ctx.rng.pick(["h", "v"]) : hCount < vCount ? "h" : "v";
      const start = -G.len;
      if (cars.some((c) => c.dir === dir && c.s - start < G.len * 1.6)) return;
      cars.push({ dir, s: start, v: 0, color: ctx.rng.pick(TRAFFIC.colors), wait: 0, ghost: false, id: time });
    }

    const loop = ctx.createLoop({
      update(dt) {
        if (finished) return;
        time += dt;
        const G = geo();
        const speed = TRAFFIC.speed[L] * (Math.min(W, H) / 600) * 1.4;
        if (next) {
          yellowT -= dt;
          if (yellowT <= 0) {
            green = next;
            next = null;
          }
        }
        spawnT -= dt;
        if (spawnT <= 0 && passed + cars.length < goal) {
          spawnT = TRAFFIC.every[L] * (0.75 + ctx.rng.random() * 0.5);
          spawn(G);
        }
        for (const dir of ["h", "v"]) {
          const line = (dir === "h" ? G.cx : G.cy) - G.R / 2 - G.len / 2 - 6; // where a car's centre stops
          const lane = cars.filter((c) => c.dir === dir).sort((a, b) => b.s - a.s);
          lane.forEach((c, i) => {
            c.wait = Math.max(0, c.wait - dt);
            let limit = Infinity;
            if (green !== dir && c.s <= line + 1) limit = line; // red or yellow: stop before the line
            if (i > 0) limit = Math.min(limit, lane[i - 1].s - G.len * 1.35); // keep a gap
            const target = c.wait > 0 ? 0 : speed;
            c.v += (target - c.v) * Math.min(1, dt * 6);
            const want = c.s + c.v * dt;
            const ns = Math.min(want, Math.max(c.s, limit));
            if (ns < want) c.v = Math.max(0, (ns - c.s) / Math.max(dt, 1e-3)); // held back: really slow down
            c.s = ns;
          });
        }
        // bumps in the middle: both stop for a moment, then sort it out (no losing)
        const inside = cars.filter((c) => !c.ghost && inBox(c, G));
        const hIn = inside.find((c) => c.dir === "h");
        const vIn = inside.find((c) => c.dir === "v");
        if (hIn && vIn) {
          bumps++;
          for (const c of [hIn, vIn]) {
            c.ghost = true;
            c.wait = 0.8;
          }
          booms.push({ t: 0 });
          ctx.audio.sfx.oops();
          ctx.speak("Bum! Prepni semafor skôr.", { interrupt: false });
        }
        for (let i = cars.length - 1; i >= 0; i--) {
          const c = cars[i];
          if (c.s > (c.dir === "h" ? W : H) + G.len) {
            cars.splice(i, 1);
            passed++;
            ctx.audio.sfx.coin();
            sh.progress(passed / goal);
          }
        }
        if (passed >= goal && !finished) {
          finished = true;
          ctx.audio.sfx.win();
          ctx.speak(bumps ? "Všetky autá prešli!" : "Všetky autá prešli bez nárazu! Si super dopravák!");
          sh.later(() => sh.done(starsFor(bumps, TRAFFIC.stars)), 1200);
        }
        sh.stage.dataset.green = green || "yellow";
        sh.stage.dataset.waiting = cars.filter((c) => c.v < 5 && c.wait <= 0).map((c) => c.dir).join("");
      },
      draw() {
        const G = geo();
        g.fillStyle = "#7ccf5a";
        g.fillRect(0, 0, W, H);
        g.fillStyle = "#4a4e57";
        g.fillRect(0, G.cy - G.R / 2, W, G.R);
        g.fillRect(G.cx - G.R / 2, 0, G.R, H);
        g.fillStyle = "#ffffff";
        for (let x = 0; x < W; x += 40) if (Math.abs(x - G.cx) > G.R / 2 + 10) g.fillRect(x, G.cy - 2, 22, 4);
        for (let y = 0; y < H; y += 40) if (Math.abs(y - G.cy) > G.R / 2 + 10) g.fillRect(G.cx - 2, y, 4, 22);
        // zebra crossings
        for (let k = 0; k < 5; k++) {
          g.fillRect(G.cx - G.R / 2 - 18, G.cy - G.R / 2 + (k + 0.3) * (G.R / 5), 12, G.R / 9);
          g.fillRect(G.cx - G.R / 2 + (k + 0.3) * (G.R / 5), G.cy - G.R / 2 - 18, G.R / 9, 12);
        }
        for (const c of cars) {
          const x = c.dir === "h" ? c.s : G.cx - G.R * 0.22;
          const y = c.dir === "h" ? G.cy + G.R * 0.22 : c.s;
          const wob = c.wait > 0 ? Math.sin(time * 40) * 0.08 : 0;
          drawCarTop(g, c.color, x, y, G.wid, { angle: (c.dir === "h" ? Math.PI / 2 : Math.PI) + wob });
        }
        // the two lights at their stop lines
        const lamp = (x, y, dir) => {
          g.fillStyle = "#23252b";
          g.beginPath();
          g.roundRect(x - 16, y - 34, 32, 68, 10);
          g.fill();
          const col = green === dir ? ["#555", "#555", "#2ec27e"] : next ? ["#555", "#ffd23f", "#555"] : ["#ff4d4d", "#555", "#555"];
          col.forEach((c, i) => {
            g.fillStyle = c;
            g.beginPath();
            g.arc(x, y - 20 + i * 20, 8, 0, 6.29);
            g.fill();
          });
        };
        lamp(G.cx - G.R / 2 - 40, G.cy + G.R / 2 + 44, "h");
        lamp(G.cx - G.R / 2 - 40, G.cy - G.R / 2 - 44, "v");
        for (const b of booms) {
          b.t += 1 / 60;
          emojiAt(g, "💥", G.cx, G.cy, G.R * 0.6 * (1 + b.t), Math.max(0, 1 - b.t));
        }
        if (booms.length && booms[0].t > 1) booms.shift();
        if (!tapped) emojiAt(g, "👆", G.cx + G.R, G.cy - G.R, G.R * 0.5, 0.6 + 0.4 * Math.sin(time * 5));
      },
      partial: () => ({ coins: 0, xp: 2 }),
    });
    loop.start();
    ctx.speak("Ťukni a prepni semafor. Púšťaj autá tak, aby do seba nenarazili.");
  },

  stop() {
    cleanup.forEach((fn) => fn());
    cleanup = [];
    shell?.stop();
    shell = null;
  },
};
