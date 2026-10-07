// 🧩 Skladačka (DESIGN-v2 §12): a picture of the child's own car on a road is cut into pieces.
// Drag each piece to its place (or tap the piece, then the place). Easy levels show a faint picture.

import { h } from "../../core/ui.js";
import { PUZZLE } from "../../data/minigames.js";
import { miniDef, starsFor } from "../../systems/minigames.js";
import { getLook } from "../../systems/tuning.js";
import { carSide } from "../../render/car-side.js";
import { drawRoadSprite } from "../../render/road-sprites.js";
import { createShell, shake } from "../mini/shell.js";

const SIZE = 600;
let shell = null;
let cleanup = [];

/** The picture: sky, sun, scenery, a road and the child's car. Resolves to a data URL. */
async function makePicture(rng) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = SIZE;
  const g = cv.getContext("2d");
  const sc = rng.pick(PUZZLE.skies);
  const grad = g.createLinearGradient(0, 0, 0, SIZE);
  grad.addColorStop(0, sc.sky[0]);
  grad.addColorStop(1, sc.sky[1]);
  g.fillStyle = grad;
  g.fillRect(0, 0, SIZE, SIZE);
  g.fillStyle = sc.sun;
  g.beginPath();
  g.arc(470, 110, 55, 0, 6.29);
  g.fill();
  g.fillStyle = sc.ground;
  g.fillRect(0, 360, SIZE, 240);
  const u = 0.13;
  drawRoadSprite(g, rng.pick(["house", "tower"]), 140, 380, u * 0.9, { seed: rng.random() });
  drawRoadSprite(g, rng.pick(["tree", "pine", "palm"]), 430, 385, u, { seed: rng.random() });
  drawRoadSprite(g, "bush", 540, 395, u, { seed: 0.8 });
  g.fillStyle = "#4a4e57";
  g.fillRect(0, 430, SIZE, 120);
  g.fillStyle = "#ffffff";
  for (let x = 10; x < SIZE; x += 90) g.fillRect(x, 486, 50, 8);
  const svg = carSide(getLook());
  svg.setAttribute("width", "440");
  svg.setAttribute("height", "227");
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
  await new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      g.drawImage(img, 80, 300, 440, 227);
      resolve();
    };
    img.onerror = resolve; // the picture still works without the car
    img.src = url;
  });
  return cv.toDataURL("image/png");
}

export default {
  id: "puzzle",
  title: "Skladačka",
  icon: "🧩",
  unlockLevel: miniDef("puzzle").unlockLevel,

  start(view, ctx) {
    run(view, ctx, this).catch((err) => {
      console.error("[puzzle] failed", err);
      ctx.crash({});
    });
  },

  stop() {
    cleanup.forEach((fn) => fn());
    cleanup = [];
    shell?.stop();
    shell = null;
  },
};

async function run(view, ctx, game) {
  shell = createShell(view, ctx, game);
  const sh = shell;
  const L = sh.level - 1;
  const n = PUZZLE.size[L];
  const board = h("div", { class: "pz-board", "data-testid": "pz-board", style: { "--n": n } });
  const tray = h("div", { class: "pz-tray", "data-testid": "pz-tray" });
  sh.stage.append(h("div", { class: "pz-wrap" }, board, tray));
  ctx.speak("Poskladaj obrázok. Potiahni dielik na jeho miesto.");
  const img = await makePicture(ctx.rng);
  if (sh.over) return;
  board.style.setProperty("--img", `url(${img})`);
  board.style.setProperty("--ghost", String(PUZZLE.ghost[L]));
  const bgPos = (i) => `${((i % n) / (n - 1)) * 100}% ${(Math.floor(i / n) / (n - 1)) * 100}%`;
  const cells = Array.from({ length: n * n }, (_, i) => h("button", { class: "pz-cell", "data-i": String(i), "aria-label": "Miesto", onclick: (e) => selected && drop(selected, e.currentTarget) }));
  board.append(...cells);
  let selected = null;
  let drag = null;
  let left = n * n;
  let mistakes = 0;

  const select = (p) => {
    selected?.classList.remove("sel");
    selected = p;
    p?.classList.add("sel");
  };
  function drop(piece, cell) {
    if (sh.over || cell.classList.contains("full")) return;
    if (cell.dataset.i !== piece.dataset.i) {
      mistakes++;
      ctx.audio.sfx.oops();
      shake(cell);
      return;
    }
    cell.classList.add("full");
    cell.style.backgroundPosition = bgPos(Number(cell.dataset.i));
    piece.remove();
    select(null);
    ctx.audio.sfx.coin();
    left--;
    sh.progress(1 - left / (n * n));
    if (!left) {
      board.classList.add("done");
      ctx.audio.sfx.win();
      ctx.speak("Obrázok je hotový!");
      sh.later(
        () =>
          sh.done(
            starsFor(
              mistakes,
              PUZZLE.stars.map((k) => k * n),
            ),
          ),
        1400,
      );
    }
  }

  tray.append(
    ...ctx.rng.shuffle([...cells.keys()]).map((i) => {
      const piece = h("button", { class: "pz-piece", "data-i": String(i), "aria-label": "Dielik", style: { backgroundImage: `url(${img})`, backgroundPosition: bgPos(i), "--n": n } });
      piece.addEventListener("pointerdown", (e) => {
        if (sh.over) return;
        ctx.audio.sfx.tap();
        select(piece);
        drag = { piece, id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false };
        piece.setPointerCapture?.(e.pointerId);
      });
      return piece;
    }),
  );
  const move = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0;
    const dy = e.clientY - drag.y0;
    if (Math.hypot(dx, dy) > 10) drag.moved = true;
    if (drag.moved) {
      drag.piece.classList.add("drag");
      drag.piece.style.transform = `translate(${dx}px, ${dy}px)`;
    }
  };
  const up = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { piece, moved } = drag;
    drag = null;
    piece.classList.remove("drag");
    piece.style.transform = "";
    if (!moved) return;
    const cell = cells.find((c) => {
      const r = c.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    });
    if (cell) drop(piece, cell);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);
  cleanup = [() => window.removeEventListener("pointermove", move), () => window.removeEventListener("pointerup", up), () => window.removeEventListener("pointercancel", up)];
  sh.stage.dataset.ready = "1";
}
