// Gallery (DESIGN-v2 §7.4): finished pictures, newest first, at most 40, plus the reward
// dialog after a finished picture (coins, sometimes a glitter colour or a car sticker).

import { h, modal, closeModal, confirm, confetti, flyCoins } from "../core/ui.js";
import { speak, sfx } from "../core/audio.js";
import { go, goHome } from "../core/router.js";
import { loadGallery, removeFromGallery } from "../systems/coloring.js";
import { COLORING } from "../data/coloring/palette.js";

function openPicture(item, onChange) {
  modal(
    [
      h("img", { class: "gallery-big", src: item.src, alt: "" }),
      h(
        "div",
        { class: "modal-row" },
        h("button", { class: "btn ghost", "data-testid": "gallery-close", "aria-label": "Zavrieť", onclick: closeModal }, "✖"),
        h(
          "button",
          {
            class: "btn tomato",
            "data-testid": "gallery-delete",
            "aria-label": "Zmazať",
            onclick: async () => {
              const ok = await confirm({ icon: "🗑️", title: "Zmazať obrázok?", say: "Naozaj zmazať obrázok?", danger: true });
              if (ok) {
                removeFromGallery(item.key || item.at);
                onChange();
              }
            },
          },
          "🗑️",
        ),
      ),
    ],
    { testId: "gallery-view" },
  );
}

export default {
  id: "gallery",
  title: "Galéria",
  render(view) {
    const root = h("section", { class: "screen gallery", "data-testid": "screen-gallery" });
    view.append(root);
    const paint = () => {
      const list = loadGallery();
      root.replaceChildren(
        h("div", { class: "gallery-head" }, h("button", { class: "btn sun", "data-testid": "back-coloring", "aria-label": "Omaľovánka", onclick: () => go("coloring") }, "🖍️"), h("span", { class: "gallery-count", "aria-hidden": "true" }, "🖼️")),
        list.length
          ? h("div", { class: "gallery-grid", "data-testid": "gallery-grid" }, list.map((item) => h("button", { class: "gallery-item", "data-testid": "gallery-item", "aria-label": "Obrázok", onclick: () => openPicture(item, paint) }, h("img", { src: item.src, alt: "" }))))
          : h("p", { class: "bag-empty", "aria-hidden": "true" }, "🖍️ ➡️ 🖼️"),
      );
    };
    paint();
    const n = loadGallery().length;
    speak(n ? "Galéria. Tu sú tvoje obrázky." : "Galéria je zatiaľ prázdna. Vymaľuj obrázok!");
    if (n >= COLORING.galleryMax) speak("Galéria je plná. Najstaršie obrázky sa nahradia novými.", { interrupt: false });
  },
};

/** Reward after a finished picture; used by the router's reward presenter. */
export function presentColoringReward(granted, { onHome } = {}) {
  const r = granted.coloringReward;
  const coins = h("div", { class: "reward-row", "data-testid": "reward-coins" }, "🪙 +", String(granted.coins || 0));
  const extras = [];
  if (r.glitter) extras.push(h("div", { class: "reward-unlock", "data-testid": "reward-glitter" }, h("span", { class: "cswatch glitter", style: { background: `linear-gradient(135deg, ${r.glitter.stops.join(", ")})` } }), " 🔓"));
  if (r.sticker) extras.push(h("div", { class: "reward-unlock", "data-testid": "reward-sticker" }, h("span", { class: "sticker-big" }, r.sticker.icon), " 🚗"));
  const box = modal(
    [
      r.thumb && h("img", { class: "reward-picture", src: r.thumb, alt: "" }),
      coins,
      ...extras,
      h(
        "div",
        { class: "modal-row" },
        h("button", { class: "btn sun", "data-testid": "reward-home", "aria-label": "Domov", onclick: () => (onHome || goHome)() }, "🏠"),
        h("button", { class: "btn plum", "data-testid": "reward-coloring", "aria-label": "Ďalší obrázok", onclick: () => go("coloring") }, "🖍️"),
        h("button", { class: "btn sky", "data-testid": "reward-gallery", "aria-label": "Galéria", onclick: () => go("gallery") }, "🖼️"),
      ),
    ],
    { dismissible: false, testId: "reward-modal" },
  );
  sfx.win();
  confetti();
  speak(r.glitter ? "Krásny obrázok! A máš novú trblietavú farbu!" : r.sticker ? "Krásny obrázok! A máš novú nálepku na auto!" : "Krásny obrázok! Je v galérii.");
  if (granted.coins > 0) setTimeout(() => flyCoins(coins, granted.coins / 5), 300);
  return box;
}
