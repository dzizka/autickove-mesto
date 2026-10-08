// Toolbar shared by both modes (DESIGN-v2 §7.3): 🪣 bucket, 🖌️ brush in 3 sizes, 🧽 eraser,
// ↩️ undo, 🏠 home, and in free mode ✔ done. Plus the free-mode palette of 16 colours and
// 4 glitter colours (locked ones show 🔒).

import { h } from "../../core/ui.js";
import { COLORS, GLITTER } from "../../data/coloring/palette.js";
import { t } from "../../core/i18n.js";

const SAY = { bucket: "Vedierko", brush: "Štetec", eraser: "Guma" };

/**
 * opts: { onExit, onUndo, onDone?, speak, sfx, extra? (element placed after undo) }
 * Returns { el, state: { tool, size }, refresh(), setUndo(enabled) }.
 */
export function createToolbar({ onExit, onUndo, onDone, onTool, speak, sfx, extra }) {
  const state = { tool: "bucket", size: 1 };
  const toolBtn = (tool, icon) =>
    h("button", { class: "ctool", "data-testid": `tool-${tool}`, "data-tool": tool, "aria-label": SAY[tool], onclick: () => pick(tool) }, icon);
  const bucket = toolBtn("bucket", "🪣");
  const brush = toolBtn("brush", "🖌️");
  const eraser = toolBtn("eraser", "🧽");
  const sizes = h(
    "div",
    { class: "csizes" },
    [0, 1, 2].map((i) =>
      h("button", { class: "csize", "data-testid": `size-${i}`, "aria-label": t("Hrúbka {n}", { n: i + 1 }), onclick: () => ((state.size = i), sfx.tap(), refresh()) }, h("i", { style: { width: `${8 + i * 9}px`, height: `${8 + i * 9}px` } })),
    ),
  );
  const undo = h("button", { class: "ctool", "data-testid": "undo", "aria-label": "Späť", onclick: () => (sfx.back(), onUndo()) }, "↩️");
  const home = h("button", { class: "ctool exit", "data-testid": "game-exit", "aria-label": "Domov", onclick: onExit }, "🏠");
  const done = onDone && h("button", { class: "ctool done", "data-testid": "paint-done", "aria-label": "Hotovo", onclick: onDone }, "✔");

  function pick(tool) {
    state.tool = tool;
    sfx.tap();
    speak(SAY[tool]);
    refresh();
    onTool?.(tool);
  }

  function refresh() {
    for (const b of [bucket, brush, eraser]) b.classList.toggle("on", b.dataset.tool === state.tool);
    sizes.classList.toggle("show", state.tool !== "bucket");
    [...sizes.children].forEach((b, i) => b.classList.toggle("on", i === state.size));
  }
  refresh();

  const el = h("div", { class: "ctoolbar" }, home, bucket, brush, eraser, undo, extra, done, sizes);
  return {
    el,
    state,
    refresh,
    setUndo: (enabled) => (undo.disabled = !enabled),
  };
}

/** Free-mode palette. onPick(colorOrGlitterId). owned: list of unlocked glitter ids. */
export function createPalette({ owned, onPick, onLocked }) {
  let selected = COLORS[0];
  const buttons = [];
  const pick = (value, btn) => {
    selected = value;
    buttons.forEach((b) => b.classList.toggle("on", b === btn));
    onPick(value);
  };
  for (const c of COLORS) {
    const b = h("button", { class: "cswatch", "data-testid": `color-${c.slice(1)}`, "aria-label": "Farba", style: { background: c }, onclick: () => pick(c, b) });
    buttons.push(b);
  }
  for (const gl of GLITTER) {
    const open = owned.includes(gl.id);
    const bg = gl.id === "galaxy" ? `radial-gradient(circle at 40% 40%, ${gl.stops.join(", ")})` : `linear-gradient(135deg, ${gl.stops.join(", ")})`;
    const b = h(
      "button",
      { class: `cswatch glitter${open ? "" : " locked"}`, "data-testid": `color-${gl.id}`, "aria-label": "Trblietavá farba", style: { background: bg }, onclick: () => (open ? pick(gl.id, b) : onLocked?.()) },
      open ? "" : "🔒",
    );
    buttons.push(b);
  }
  buttons[0].classList.add("on");
  return { el: h("div", { class: "cpalette", "data-testid": "palette" }, buttons), get color() { return selected; } };
}
