// 🧽 Umyváreň (DESIGN-v2 §12): the child's own car is covered in mud. Scrub it with the sponge
// (mud turns into foam), then rinse the foam with the shower, and the car shines.

import { h } from "../../core/ui.js";
import { WASH } from "../../data/minigames.js";
import { miniDef, starsFor } from "../../systems/minigames.js";
import { getLook, resolveLook } from "../../systems/tuning.js";
import { carSide } from "../../render/car-side.js";
import { createShell } from "../mini/shell.js";

const VB_W = 240; // car-side viewBox
const VB_H = 124;
const K = 1.5; // mask pixels per viewBox unit
const TOOLS = ["🧽", "🚿"];

let shell = null;
let cleanup = [];

export default {
  id: "wash",
  title: "Umyváreň",
  icon: "🧽",
  unlockLevel: miniDef("wash").unlockLevel,

  start(view, ctx) {
    shell = createShell(view, ctx, this);
    const sh = shell;
    const L = sh.level - 1;
    const look = getLook();
    const side = resolveLook(look).car.side;

    const mud = h("canvas", { class: "wash-layer", "data-testid": "wash-canvas" });
    const foam = h("canvas", { class: "wash-layer foam" });
    const tool = h("span", { class: "wash-tool", "aria-hidden": "true" }, TOOLS[0]);
    const box = h("div", { class: "wash-car" }, carSide(look), foam, mud);
    const bubbles = h("div", { class: "wash-fx", "aria-hidden": "true" });
    sh.stage.append(h("div", { class: "wash-wrap" }, box, bubbles, tool));

    for (const c of [mud, foam]) {
      c.width = VB_W * K;
      c.height = VB_H * K;
    }
    const gm = mud.getContext("2d", { willReadFrequently: true });
    const gf = foam.getContext("2d", { willReadFrequently: true });
    // mud only on the car: body and wheels
    const shape = new Path2D(side.body);
    for (const x of side.wheels) shape.addPath(circlePath(x, side.wheelY, side.wheelR + 2));
    gm.save();
    gm.scale(K, K);
    gm.clip(shape);
    for (let i = 0; i < WASH.blobs[L]; i++) {
      gm.fillStyle = ctx.rng.pick(WASH.mud);
      gm.beginPath();
      gm.arc(10 + ctx.rng.random() * 220, 10 + ctx.rng.random() * 105, 7 + ctx.rng.random() * 16, 0, 6.29);
      gm.fill();
    }
    for (let i = 0; i < 10; i++) {
      gm.fillStyle = ctx.rng.pick(WASH.mud);
      gm.fillRect(20 + ctx.rng.random() * 200, 50 + ctx.rng.random() * 20, 4, 14 + ctx.rng.random() * 16);
    }
    gm.restore();

    const dirt = (g) => {
      const d = g.getImageData(0, 0, VB_W * K, VB_H * K).data;
      let n = 0;
      for (let i = 3; i < d.length; i += 16) if (d[i] > 40) n++;
      return n;
    };
    const mudTotal = Math.max(1, dirt(gm));
    let foamTotal = 1;
    let phase = 0; // 0 sponge, 1 shower, 2 done
    let last = null;
    let moves = 0;
    const t0 = performance.now();
    const radius = WASH.brush[L] * VB_W * K;

    function stroke(g, p, erase) {
      g.save();
      g.globalCompositeOperation = erase ? "destination-out" : "source-over";
      g.lineCap = "round";
      g.lineWidth = radius * 2;
      if (last) {
        g.beginPath();
        g.moveTo(last.x, last.y);
        g.lineTo(p.x, p.y);
        g.stroke();
      }
      g.beginPath();
      g.arc(p.x, p.y, radius, 0, 6.29);
      g.fill();
      g.restore();
    }

    function addFoam(p) {
      // foam where the mud was (only on the car)
      gf.save();
      gf.scale(K, K);
      gf.clip(shape);
      gf.setTransform(1, 0, 0, 1, 0, 0);
      gf.fillStyle = "rgba(255,255,255,.92)";
      for (let i = 0; i < 3; i++) {
        gf.beginPath();
        gf.arc(p.x + (Math.random() - 0.5) * radius * 1.6, p.y + (Math.random() - 0.5) * radius * 1.6, radius * (0.35 + Math.random() * 0.35), 0, 6.29);
        gf.fill();
      }
      gf.restore();
    }

    function fx(e, icon) {
      const r = sh.stage.getBoundingClientRect();
      const b = h("span", { class: "wash-bubble", style: { left: `${e.clientX - r.left}px`, top: `${e.clientY - r.top}px` } }, icon);
      bubbles.append(b);
      sh.later(() => b.remove(), 900);
    }

    function scrub(e) {
      if (phase > 1 || sh.over) return;
      const r = mud.getBoundingClientRect();
      const p = { x: ((e.clientX - r.left) / r.width) * VB_W * K, y: ((e.clientY - r.top) / r.height) * VB_H * K };
      const sr = sh.stage.getBoundingClientRect();
      tool.style.transform = `translate(${e.clientX - sr.left}px, ${e.clientY - sr.top}px)`;
      if (phase === 0) {
        stroke(gm, p, true);
        addFoam(p);
      } else stroke(gf, p, true);
      last = p;
      moves++;
      if (moves % 4 === 0) fx(e, phase === 0 ? "🫧" : "💧");
      if (moves % 8 === 0) {
        ctx.audio.tone(600 + Math.random() * 300, 0.04, { volume: 0.05 });
        check();
      }
    }

    function check() {
      if (phase === 0) {
        const clean = 1 - dirt(gm) / mudTotal;
        sh.progress(clean * 0.5);
        if (clean >= WASH.cleanAt) {
          gm.clearRect(0, 0, mud.width, mud.height);
          phase = 1;
          last = null;
          foamTotal = Math.max(1, dirt(gf));
          tool.textContent = TOOLS[1];
          ctx.audio.sfx.open();
          ctx.speak("Blato je preč! Teraz osprchuj penu vodou.");
        }
      } else if (phase === 1) {
        const clean = 1 - dirt(gf) / foamTotal;
        sh.progress(0.5 + clean * 0.5);
        if (clean >= WASH.cleanAt) {
          gf.clearRect(0, 0, foam.width, foam.height);
          phase = 2;
          tool.textContent = "✨";
          box.classList.add("shine");
          ctx.audio.sfx.win();
          ctx.speak("Auto sa leskne ako nové!");
          const seconds = (performance.now() - t0) / 1000;
          sh.later(() => sh.done(starsFor(seconds, WASH.stars)), 1500);
        }
      }
    }

    const down = (e) => {
      last = null;
      mud.setPointerCapture?.(e.pointerId);
      tool.classList.add("on");
      scrub(e);
    };
    const move = (e) => {
      if (e.buttons || e.pointerType === "touch") scrub(e);
    };
    const up = () => {
      last = null;
      tool.classList.remove("on");
      check();
    };
    mud.addEventListener("pointerdown", down);
    mud.addEventListener("pointermove", move);
    mud.addEventListener("pointerup", up);
    cleanup = [() => mud.removeEventListener("pointerdown", down), () => mud.removeEventListener("pointermove", move), () => mud.removeEventListener("pointerup", up)];
    ctx.speak("Auto je celé od blata. Drhni ho prstom so špongiou.");
    if (window.__game) window.__game.mini = { phase: () => phase };
  },

  stop() {
    cleanup.forEach((fn) => fn());
    cleanup = [];
    shell?.stop();
    shell = null;
    if (window.__game) window.__game.mini = null;
  },
};

function circlePath(x, y, r) {
  const p = new Path2D();
  p.arc(x, y, r, 0, Math.PI * 2);
  return p;
}
