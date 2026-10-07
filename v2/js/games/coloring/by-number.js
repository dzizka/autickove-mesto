// Paint by number (DESIGN-v2 §7.2): a pixel grid with a number in every cell and a numbered
// palette. A correct cell gets its colour, a wrong one blinks. Cells of the chosen number are
// highlighted, a finished number gets ✔, a bar shows progress. Zoom with + / − or two fingers.
// Unfinished work is saved, so a 24 × 24 picture can be finished another day.

import { h, confetti } from "../../core/ui.js";
import { COLORING } from "../../data/coloring/palette.js";
import { pixelGrid, pictureReward, saveWip, loadWip } from "../../systems/coloring.js";
import { createHistory, createBrushLayer } from "./brush.js";
import { createToolbar } from "./tools.js";

const NUMBER_SAY = ["jednotku", "dvojku", "trojku", "štvorku", "päťku", "šestku", "sedmičku", "osmičku", "deviatku"];

/** Small JPEG of the finished grid with the brush layer on top. */
function gridThumbnail(grid, brushCanvas, size = COLORING.thumbSize) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const g = cv.getContext("2d");
  const cell = size / grid.size;
  grid.cells.forEach((n, i) => {
    g.fillStyle = grid.colors[n - 1];
    g.fillRect((i % grid.size) * cell, Math.floor(i / grid.size) * cell, Math.ceil(cell), Math.ceil(cell));
  });
  try {
    g.drawImage(brushCanvas, 0, 0, size, size);
  } catch {
    /* ignore */
  }
  return cv.toDataURL("image/jpeg", COLORING.thumbQuality);
}

export function startByNumber(view, ctx, pic, cleanup) {
  const { sfx, tone } = ctx.audio;
  const grid = pixelGrid(pic);
  const n = grid.size;
  const total = n * n;
  const filled = loadWip(pic.id, n) || new Array(total).fill(false);
  const counts = grid.colors.map((_, k) => grid.cells.filter((c) => c === k + 1).length);
  const history = createHistory();
  let selected = 1;
  let zoom = 1;
  let finished = false;
  let saveTimer = null;

  const cells = grid.cells.map((num, i) => h("div", { class: "bn-cell", "data-i": String(i), "data-n": String(num) }, h("span", {}, String(num))));
  const gridEl = h("div", { class: "bn-grid", "data-testid": "bn-grid", style: { "--n": String(n) } }, cells);
  const canvas = h("canvas", { class: "brush-layer", "data-testid": "brush-layer" });
  const board = h("div", { class: "bn-board" }, gridEl, canvas);
  const scroller = h("div", { class: "bn-scroller", "data-testid": "bn-scroller" }, board);
  const progressFill = h("i");
  const progress = h("div", { class: "bn-progress", "data-testid": "bn-progress", "aria-label": "Hotovo" }, progressFill);
  const brush = createBrushLayer(canvas, { history, onStroke: () => toolbar.setUndo(true) });

  const leftOf = (k) => grid.cells.reduce((sum, c, i) => sum + (c === k && !filled[i] ? 1 : 0), 0);

  // numbered palette
  const swatches = grid.colors.map((color, k) =>
    h(
      "button",
      { class: "bn-swatch", "data-testid": `num-${k + 1}`, "aria-label": `Číslo ${k + 1}`, style: { "--c": color }, onclick: () => select(k + 1, true) },
      h("span", { class: "bn-num" }, String(k + 1)),
      h("span", { class: "bn-check", "aria-hidden": "true" }, "✔"),
    ),
  );
  const palette = h("div", { class: "bn-palette", "data-testid": "palette" }, swatches);

  function paintCell(cell, i) {
    cell.classList.add("filled");
    cell.style.background = grid.colors[grid.cells[i] - 1];
  }

  function refresh() {
    let done = 0;
    filled.forEach((f) => f && done++);
    progressFill.style.width = `${(done / total) * 100}%`;
    swatches.forEach((sw, k) => sw.classList.toggle("done", leftOf(k + 1) === 0));
    swatches.forEach((sw, k) => sw.classList.toggle("on", k + 1 === selected));
    cells.forEach((c, i) => c.classList.toggle("hl", !filled[i] && grid.cells[i] === selected));
  }

  function select(k, say = false) {
    selected = k;
    sfx.tap();
    refresh();
    if (say) ctx.speak(leftOf(k) ? `Hľadaj ${NUMBER_SAY[k - 1] || "toto číslo"}.` : "Toto číslo je hotové!");
  }

  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveWip(pic.id, filled), 300);
  }

  /** Try to colour cell i with the selected number. */
  function tryFill(i) {
    if (finished || filled[i] || i < 0 || i >= total) return;
    const cell = cells[i];
    if (grid.cells[i] !== selected) {
      cell.classList.remove("wrong");
      void cell.offsetWidth;
      cell.classList.add("wrong");
      return;
    }
    filled[i] = true;
    paintCell(cell, i);
    tone(700 + (i % 7) * 40, 0.05, { type: "triangle", volume: 0.05 });
    history.push({
      undo: () => {
        if (finished) return;
        filled[i] = false;
        cell.classList.remove("filled");
        cell.style.background = "";
        refresh();
        persist();
      },
    });
    toolbar.setUndo(true);
    persist();
    if (leftOf(selected) === 0) {
      sfx.win();
      ctx.speak("Číslo je hotové!", { interrupt: false });
      const next = counts.findIndex((_, k) => leftOf(k + 1) > 0);
      if (next >= 0) selected = next + 1;
    }
    refresh();
    if (filled.every(Boolean)) complete();
  }

  function complete() {
    finished = true;
    clearTimeout(saveTimer);
    board.classList.add("complete");
    sfx.levelUp();
    confetti(100);
    ctx.speak("Hurá! Obrázok je hotový!");
    setTimeout(() => {
      const thumb = gridThumbnail(grid, canvas);
      ctx.finish({ ...pictureReward({ mode: "number", size: n }), extra: { coloring: { id: pic.id, mode: "number", size: n, thumb } } });
    }, 1800);
  }

  // painting by tap and drag (one finger); two fingers zoom
  const pointers = new Map();
  let pinch = null;
  let painting = false;
  const cellAt = (e) => {
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest?.(".bn-cell");
    return el && gridEl.contains(el) ? Number(el.dataset.i) : -1;
  };
  const onDown = (e) => {
    pointers.set(e.pointerId, e);
    if (pointers.size === 2) {
      painting = false;
      brush.end();
      const [a, b] = [...pointers.values()];
      pinch = { dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), zoom, mx: (a.clientX + b.clientX) / 2, my: (a.clientY + b.clientY) / 2 };
      return;
    }
    board.setPointerCapture?.(e.pointerId);
    painting = true;
    if (toolbar.state.tool === "bucket") tryFill(cellAt(e));
    else brush.begin(e, { tool: toolbar.state.tool, color: grid.colors[selected - 1], sizeIndex: toolbar.state.size });
  };
  const onMove = (e) => {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, e);
    if (pinch && pointers.size === 2) {
      // two fingers: pinch to zoom, move together to pan
      const [a, b] = [...pointers.values()];
      setZoom((pinch.zoom * Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)) / Math.max(1, pinch.dist));
      const mx = (a.clientX + b.clientX) / 2;
      const my = (a.clientY + b.clientY) / 2;
      scroller.scrollLeft -= mx - pinch.mx;
      scroller.scrollTop -= my - pinch.my;
      pinch.mx = mx;
      pinch.my = my;
      return;
    }
    if (!painting) return;
    if (toolbar.state.tool === "bucket") tryFill(cellAt(e));
    else brush.move(e);
  };
  const onUp = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (painting) brush.end();
    painting = false;
  };
  board.addEventListener("pointerdown", onDown);
  board.addEventListener("pointermove", onMove);
  board.addEventListener("pointerup", onUp);
  board.addEventListener("pointercancel", onUp);

  function setZoom(z) {
    zoom = Math.max(COLORING.minZoom, Math.min(COLORING.maxZoom, z));
    board.style.setProperty("--zoom", String(zoom));
    brush.resize();
  }
  const zoomBtns = h(
    "div",
    { class: "bn-zoom" },
    h("button", { class: "ctool", "data-testid": "zoom-out", "aria-label": "Oddialiť", onclick: () => (sfx.tap(), setZoom(zoom - 0.5)) }, "➖"),
    h("button", { class: "ctool", "data-testid": "zoom-in", "aria-label": "Priblížiť", onclick: () => (sfx.tap(), setZoom(zoom + 0.5)) }, "➕"),
  );

  const toolbar = createToolbar({
    onExit: ctx.exit,
    onUndo: () => toolbar.setUndo(history.undo() && history.size > 0),
    speak: (t) => ctx.speak(t),
    sfx,
    extra: zoomBtns,
  });
  toolbar.setUndo(false);

  // restore saved work
  filled.forEach((f, i) => f && paintCell(cells[i], i));
  const firstOpen = counts.findIndex((_, k) => leftOf(k + 1) > 0);
  selected = firstOpen >= 0 ? firstOpen + 1 : 1;

  const wrap = h(
    "section",
    { class: `screen game coloring number size-${n}`, "data-testid": "screen-game-coloring", "data-mode": "number", "data-picture": pic.id },
    h("div", { class: "cwork" }, scroller, progress),
    h("div", { class: "cside" }, toolbar.el, palette),
  );
  view.append(wrap);
  setZoom(n >= 24 && window.innerWidth < 600 ? 1.5 : 1);
  refresh();
  const onResize = () => brush.resize();
  window.addEventListener("resize", onResize);
  cleanup.push(() => window.removeEventListener("resize", onResize), () => clearTimeout(saveTimer), () => !finished && filled.some(Boolean) && saveWip(pic.id, filled));
  ctx.speak("Vyber číslo a ťukaj na rovnaké čísla v obrázku.");
  if (window.__game) window.__game.byNumber = { grid, filled, select, tryFill }; // test hook
}
