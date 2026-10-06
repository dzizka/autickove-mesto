// Test drive: a tiny game that exercises the whole game pipeline
// (game interface, guarded loop, ctx.finish, rewards). Only reachable from the test menu.
// The real races replace it in part 1; the "crash" variant tests the loop guard (§3).

import { h } from "../../core/ui.js";

const LANES = 3;

function makeGame({ id, title, crashAfter = null }) {
  let cleanup = [];

  return {
    id,
    title,
    icon: "🚗",
    unlockLevel: 1,
    hidden: true, // not shown on the home screen

    start(view, ctx) {
      const duration = ctx.state().cheats.shortRaces ? 6 : 20;
      const canvas = h("canvas", { class: "demo-canvas", "data-testid": "demo-canvas" });
      const exit = h("button", { class: "icon-btn game-exit", "aria-label": "Domov", "data-testid": "game-exit", onclick: ctx.exit }, "🏠");
      const wrap = h("section", { class: "screen game demo", "data-testid": `screen-game-${id}` }, canvas, exit);
      view.append(wrap);

      const g = canvas.getContext("2d");
      let w = 0;
      let hgt = 0;
      const resize = () => {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        w = wrap.clientWidth || 360;
        hgt = wrap.clientHeight || 600;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(hgt * dpr);
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();
      window.addEventListener("resize", resize);

      // All objects get every coordinate at creation (DESIGN-v2 §3, night-track bug).
      const car = { lane: 1, x: 1, y: 0.85 };
      const coins = [];
      let spawnIn = 0;
      let collected = 0;
      let time = 0;

      const onTap = (e) => {
        const r = canvas.getBoundingClientRect();
        const dir = e.clientX - r.left < r.width / 2 ? -1 : 1;
        car.lane = Math.max(0, Math.min(LANES - 1, car.lane + dir));
        ctx.audio.sfx.tap();
      };
      canvas.addEventListener("pointerdown", onTap);
      cleanup = [() => window.removeEventListener("resize", resize), () => canvas.removeEventListener("pointerdown", onTap)];

      const laneX = (lane) => (w / LANES) * (lane + 0.5);
      const reward = () => ({ coins: collected * 5, xp: 10 + collected * 2 });

      const loop = ctx.createLoop({
        update(dt) {
          time += dt;
          if (crashAfter !== null && time > crashAfter) throw new Error("Simulated frame failure (test)");
          car.x += (car.lane - car.x) * Math.min(1, dt * 12);
          spawnIn -= dt;
          if (spawnIn <= 0) {
            spawnIn = 0.45 + ctx.rng.random() * 0.4;
            coins.push({ lane: ctx.rng.int(0, LANES - 1), y: -0.05, taken: false });
          }
          for (const c of coins) {
            c.y += dt * 0.45;
            if (!c.taken && Math.abs(c.y - car.y) < 0.05 && Math.abs(c.lane - car.x) < 0.5) {
              c.taken = true;
              collected++;
              ctx.audio.sfx.coin();
            }
          }
          for (let i = coins.length - 1; i >= 0; i--) if (coins[i].y > 1.1 || coins[i].taken) coins.splice(i, 1);
          if (time >= duration) ctx.finish(reward());
        },
        draw() {
          g.fillStyle = "#4a4e57";
          g.fillRect(0, 0, w, hgt);
          g.strokeStyle = "#fff";
          g.lineWidth = 4;
          g.setLineDash([24, 24]);
          g.lineDashOffset = -(time * 300) % 48;
          for (let i = 1; i < LANES; i++) {
            g.beginPath();
            g.moveTo((w / LANES) * i, 0);
            g.lineTo((w / LANES) * i, hgt);
            g.stroke();
          }
          g.setLineDash([]);
          g.font = `${Math.round(Math.min(w / LANES, 80) * 0.5)}px sans-serif`;
          g.textAlign = "center";
          g.textBaseline = "middle";
          for (const c of coins) g.fillText("🪙", laneX(c.lane), c.y * hgt);
          const cx = (w / LANES) * (car.x + 0.5);
          g.fillStyle = "#ff5a5f";
          g.beginPath();
          g.roundRect(cx - 26, car.y * hgt - 44, 52, 88, 14);
          g.fill();
          g.fillStyle = "#bfe9ff";
          g.fillRect(cx - 18, car.y * hgt - 26, 36, 18);
          // progress bar instead of a timer number
          g.fillStyle = "rgba(255,255,255,.3)";
          g.fillRect(16, 16, w - 32, 12);
          g.fillStyle = "#ffc93c";
          g.fillRect(16, 16, (w - 32) * Math.min(1, time / duration), 12);
        },
        partial: reward,
      });
      loop.start();
      ctx.speak("Ťukni vľavo alebo vpravo a zbieraj mince!");
    },

    stop() {
      cleanup.forEach((fn) => fn());
      cleanup = [];
    },
  };
}

export const demoGame = makeGame({ id: "demo", title: "Skúšobná jazda" });
export const demoCrashGame = makeGame({ id: "demo-crash", title: "Test zaseknutia", crashAfter: 1 });
