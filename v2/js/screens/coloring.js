// Colouring book menu (DESIGN-v2 §7): two modes, 🖌️ free painting by theme and 🔢 paint by
// number by size (⭐ easy, ⭐⭐ medium, ⭐⭐⭐ hard), plus 🖼️ the gallery. Locked free pictures
// open after races or can be bought with coins.

import { h, confirm } from "../core/ui.js";
import { speak, sfx } from "../core/audio.js";
import { getState } from "../core/state.js";
import { startGame, go } from "../core/router.js";
import { THEMES } from "../data/coloring/palette.js";
import { FREE_PICTURES } from "../data/coloring/free.js";
import { PIXEL_PICTURES } from "../data/coloring/pixel.js";
import { canAfford } from "../systems/economy.js";
import { isFreeUnlocked, buyPicture, pixelGrid, loadWip } from "../systems/coloring.js";
import { pictureSvg } from "../games/coloring/free-paint.js";

const SIZES = [
  { size: 10, stars: "⭐", say: "Ľahké obrázky" },
  { size: 16, stars: "⭐⭐", say: "Stredné obrázky" },
  { size: 24, stars: "⭐⭐⭐", say: "Ťažké obrázky" },
];

let mode = "free";
let theme = THEMES[0].id;
let size = 10;

/** Small canvas preview of a pixel picture. */
function pixelPreview(pic) {
  const grid = pixelGrid(pic);
  const cv = h("canvas", { class: "pic-preview" });
  cv.width = cv.height = grid.size;
  const g = cv.getContext("2d");
  grid.cells.forEach((n, i) => {
    g.fillStyle = grid.colors[n - 1];
    g.fillRect(i % grid.size, Math.floor(i / grid.size), 1, 1);
  });
  return cv;
}

export default {
  id: "coloring",
  title: "Omaľovánka",
  render(view) {
    const root = h("section", { class: "screen coloring-menu", "data-testid": "screen-coloring" });
    view.append(root);

    const paint = () => {
      const s = getState();
      const modeBtn = (id, icon, say) =>
        h("button", { class: `chip big-chip${mode === id ? " active" : ""}`, "data-testid": `mode-${id}`, "aria-label": say, onclick: () => ((mode = id), sfx.tap(), speak(say), paint()) }, icon);
      const top = h(
        "div",
        { class: "cm-top" },
        modeBtn("free", "🖌️", "Voľné maľovanie"),
        modeBtn("number", "🔢", "Maľovanie podľa čísel"),
        h("button", { class: "chip big-chip", "data-testid": "open-gallery", "aria-label": "Galéria", onclick: () => (sfx.tap(), go("gallery")) }, "🖼️"),
      );

      let chips;
      let tiles;
      if (mode === "free") {
        chips = THEMES.map((t) => h("button", { class: `chip${theme === t.id ? " active" : ""}`, "data-testid": `theme-${t.id}`, "aria-label": t.name, onclick: () => ((theme = t.id), sfx.tap(), speak(t.name), paint()) }, t.icon));
        tiles = FREE_PICTURES.filter((p) => p.theme === theme).map((p) => {
          const open = isFreeUnlocked(p, s);
          const done = s.coloring.done[p.id] || 0;
          return h(
            "button",
            {
              class: `pic-tile${open ? "" : " locked"}`,
              "data-testid": `pic-${p.id}`,
              "data-open": String(open),
              "aria-label": p.name,
              onclick: async () => {
                if (open) {
                  sfx.tap();
                  return startGame("coloring", "free", p.id);
                }
                if (!canAfford(p.unlock.price)) {
                  sfx.oops();
                  speak("Tento obrázok sa odomkne za preteky. Alebo si naň našetri mince.");
                  return;
                }
                const ok = await confirm({ icon: "🖼️", title: "Odomknúť obrázok?", text: `🪙 ${p.unlock.price}`, say: `Odomknúť obrázok za ${p.unlock.price} mincí?` });
                if (ok && buyPicture(p.id)) {
                  sfx.win();
                  paint();
                }
              },
            },
            pictureSvg(p),
            done > 0 && h("span", { class: "pic-done", "aria-hidden": "true" }, "✔"),
            !open && h("span", { class: "pic-lock", "aria-hidden": "true" }, "🔒", h("small", {}, `🏁${Math.max(0, p.unlock.races - s.races.total)} · 🪙${p.unlock.price}`)),
          );
        });
      } else {
        chips = SIZES.map((z) => h("button", { class: `chip${size === z.size ? " active" : ""}`, "data-testid": `size-${z.size}`, "aria-label": z.say, onclick: () => ((size = z.size), sfx.tap(), speak(z.say), paint()) }, z.stars));
        tiles = PIXEL_PICTURES.filter((p) => p.size === size).map((p) => {
          const wip = loadWip(p.id, p.size);
          const part = wip ? wip.filter(Boolean).length / wip.length : 0;
          return h(
            "button",
            { class: "pic-tile", "data-testid": `pic-${p.id}`, "aria-label": "Obrázok", onclick: () => (sfx.tap(), startGame("coloring", "number", p.id)) },
            pixelPreview(p),
            (s.coloring.done[p.id] || 0) > 0 && h("span", { class: "pic-done", "aria-hidden": "true" }, "✔"),
            part > 0 && h("span", { class: "pic-wip", "aria-hidden": "true" }, h("i", { style: { width: `${part * 100}%` } })),
          );
        });
      }
      root.replaceChildren(top, h("div", { class: "chips cm-chips" }, chips), h("div", { class: "pic-grid", "data-testid": "pic-grid" }, tiles));
    };
    paint();
    speak("Omaľovánka. Vyber si obrázok.");
  },
};
