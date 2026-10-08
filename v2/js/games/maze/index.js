// 🗺️ Bludisko (DESIGN-v2 §12): drive the child's car through a maze to the garage and pick up
// coins on the way. Arrows, swipes or the keyboard move the car one cell at a time.

import { h } from "../../core/ui.js";
import { MAZE } from "../../data/minigames.js";
import { miniDef } from "../../systems/minigames.js";
import { getLook } from "../../systems/tuning.js";
import { drawCarTop } from "../../render/car-top.js";
import { emojiAt, drawRoadSprite } from "../../render/road-sprites.js";
import { createShell } from "../mini/shell.js";

// dx, dy, wall index on this side, wall index on the other side (0 up, 1 right, 2 down, 3 left)
const DIRS = [
  [0, -1, 0, 2],
  [1, 0, 1, 3],
  [0, 1, 2, 0],
  [-1, 0, 3, 1],
];

/** Depth-first maze, then a few extra doors so there is more than one way. */
export function buildMaze(n, extra, rng) {
  const walls = Array.from({ length: n * n }, () => [true, true, true, true]);
  const seen = new Array(n * n).fill(false);
  const stack = [0];
  seen[0] = true;
  const nb = (c) => DIRS.map((d) => [d, (c % n) + d[0], Math.floor(c / n) + d[1]]).filter(([, x, y]) => x >= 0 && y >= 0 && x < n && y < n);
  while (stack.length) {
    const c = stack[stack.length - 1];
    const open = nb(c).filter(([, x, y]) => !seen[y * n + x]);
    if (!open.length) {
      stack.pop();
      continue;
    }
    const [[, , a, b], x, y] = rng.pick(open);
    const next = y * n + x;
    walls[c][a] = false;
    walls[next][b] = false;
    seen[next] = true;
    stack.push(next);
  }
  for (let i = 0; i < extra; i++) {
    const c = rng.int(0, n * n - 1);
    const opts = nb(c);
    const [[, , a, b], x, y] = rng.pick(opts);
    walls[c][a] = false;
    walls[y * n + x][b] = false;
  }
  return walls;
}

let shell = null;
let cleanup = [];

export default {
  id: "maze",
  title: "Bludisko",
  icon: "🗺️",
  unlockLevel: miniDef("maze").unlockLevel,

  start(view, ctx) {
    shell = createShell(view, ctx, this);
    const sh = shell;
    const L = sh.level - 1;
    const n = MAZE.size[L];
    const walls = buildMaze(n, MAZE.extraDoors[L], ctx.rng);
    const goal = n * n - 1;
    // coins only where the car can drive without passing the garage (arriving there ends the game)
    const reach = new Set([0]);
    for (const q = [0]; q.length; ) {
      const c = q.shift();
      if (c === goal) continue;
      DIRS.forEach(([dx, dy, w]) => {
        const next = c + dy * n + dx;
        if (!walls[c][w] && !reach.has(next)) reach.add(next) && q.push(next);
      });
    }
    const free = ctx.rng.shuffle([...reach].filter((c) => c !== 0 && c !== goal));
    const coins = new Set(free.slice(0, MAZE.coins[L]));
    const total = coins.size;
    const look = getLook();
    const car = { cell: 0, x: 0, y: 0, angle: Math.PI / 2, from: null, t: 1 };
    let got = 0;
    let done = false;

    const canvas = h("canvas", { class: "maze-canvas", "data-testid": "maze-canvas" });
    const pad = h(
      "div",
      { class: "maze-pad" },
      ["⬆️", "⬅️", "➡️", "⬇️"].map((icon, k) => {
        const dir = [0, 3, 1, 2][k];
        return h("button", { class: `maze-btn d${dir}`, "data-dir": String(dir), "aria-label": "Smer", onpointerdown: () => (ctx.audio.sfx.tap(), step(dir)) }, icon);
      }),
    );
    sh.stage.append(h("div", { class: "maze-wrap" }, canvas, pad));
    const g = canvas.getContext("2d");
    let S = 300;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = sh.stage.getBoundingClientRect();
      const wide = r.width > r.height;
      S = Math.max(160, Math.floor(Math.min(wide ? r.width - 260 : r.width - 8, wide ? r.height - 8 : r.height - 200, 1000)));
      canvas.width = S * dpr;
      canvas.height = S * dpr;
      canvas.style.width = `${S}px`;
      canvas.style.height = `${S}px`;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const queued = []; // taps during a move are kept (quick little fingers)
    function step(dir) {
      if (done || sh.over) return;
      if (car.t < 1) {
        if (queued.length < 3) queued.push(dir);
        return;
      }
      if (walls[car.cell][dir]) {
        ctx.audio.tone(180, 0.08, { type: "square", volume: 0.06 });
        return;
      }
      const [dx, dy] = DIRS[dir];
      car.from = car.cell;
      car.cell += dy * n + dx;
      car.t = 0;
      car.angle = [0, Math.PI / 2, Math.PI, -Math.PI / 2][dir];
      sh.stage.dataset.cell = String(car.cell);
    }
    function arrive() {
      if (coins.delete(car.cell)) {
        got++;
        ctx.audio.sfx.coin();
        sh.progress(got / (total + 1));
      }
      if (car.cell === goal && !done) {
        done = true;
        sh.progress(1);
        ctx.audio.sfx.win();
        ctx.speak(got === total ? "Si doma a máš všetky mince!" : "Si doma v garáži!");
        const share = got / Math.max(1, total);
        sh.later(() => sh.done(share >= MAZE.stars[0] ? 3 : share >= MAZE.stars[1] ? 2 : 1), 1200);
      }
    }

    // swipes on the maze: one cell per half-cell of finger movement
    let swipe = null;
    const down = (e) => (swipe = { x: e.clientX, y: e.clientY, id: e.pointerId });
    const move = (e) => {
      if (!swipe || e.pointerId !== swipe.id) return;
      const dx = e.clientX - swipe.x;
      const dy = e.clientY - swipe.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < S / n / 2) return;
      step(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy > 0 ? 2 : 0);
      swipe = { ...swipe, x: e.clientX, y: e.clientY };
    };
    const up = () => (swipe = null);
    const key = (e) => {
      const dir = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3, w: 0, d: 1, s: 2, a: 3 }[e.key.length === 1 ? e.key.toLowerCase() : e.key];
      if (dir !== undefined) {
        e.preventDefault();
        step(dir);
      }
    };
    canvas.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("keydown", key);
    cleanup = [() => window.removeEventListener("resize", resize), () => window.removeEventListener("pointermove", move), () => window.removeEventListener("pointerup", up), () => window.removeEventListener("keydown", key)];

    const loop = ctx.createLoop({
      update(dt) {
        if (car.t < 1) {
          car.t = Math.min(1, car.t + dt / 0.16);
          if (car.t >= 1) {
            arrive();
            if (queued.length) step(queued.shift());
          }
        }
      },
      draw(time) {
        const c = S / n;
        g.fillStyle = "#7ccf5a";
        g.fillRect(0, 0, S, S);
        g.fillStyle = "#e9e2d0";
        for (let i = 0; i < n * n; i++) g.fillRect((i % n) * c + c * 0.08, Math.floor(i / n) * c + c * 0.08, c * 0.84, c * 0.84);
        // open sides join the paths
        for (let i = 0; i < n * n; i++) {
          const x = (i % n) * c;
          const y = Math.floor(i / n) * c;
          if (!walls[i][1]) g.fillRect(x + c * 0.9, y + c * 0.08, c * 0.2, c * 0.84);
          if (!walls[i][2]) g.fillRect(x + c * 0.08, y + c * 0.9, c * 0.84, c * 0.2);
        }
        for (const i of coins) drawRoadSprite(g, "coin", (i % n + 0.5) * c, (Math.floor(i / n) + 0.5) * c + c * 0.22, c / 900, { t: time, seed: i / 7 });
        emojiAt(g, "🏠", (goal % n + 0.5) * c, (Math.floor(goal / n) + 0.5) * c, c * 0.7);
        const from = car.from ?? car.cell;
        const t = car.t;
        const cx = ((from % n) + ((car.cell % n) - (from % n)) * t + 0.5) * c;
        const cy = (Math.floor(from / n) + (Math.floor(car.cell / n) - Math.floor(from / n)) * t + 0.5) * c;
        drawCarTop(g, look, cx, cy, c * 0.42, { angle: car.angle });
      },
    });
    loop.start();
    ctx.speak("Dovez auto domov do garáže. Cestou zbieraj mince.");
    if (window.__game) window.__game.mini = { n, walls, coins, car };
  },

  stop() {
    cleanup.forEach((fn) => fn());
    cleanup = [];
    shell?.stop();
    shell = null;
    if (window.__game) window.__game.mini = null;
  },
};
