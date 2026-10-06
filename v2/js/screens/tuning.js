// Showroom (DESIGN-v2 §5): the car on a turning platform under a spotlight, 📯 horn,
// 🎲 random look, car kinds and 9 tuning categories. Unowned items are previewed on the
// car first and bought with coins; looks never change stats.

import { h, toast, confetti } from "../core/ui.js";
import { speak, sfx, playNotes } from "../core/audio.js";
import * as rng from "../core/rng.js";
import { TUNING, CARS_TAB } from "../data/tuning.js";
import { canAfford } from "../systems/economy.js";
import { itemsOf, getLook, resolveLook, isOwned, priceOf, select, buy, randomLook } from "../systems/tuning.js";
import { carSide } from "../render/car-side.js";

const TABS = [CARS_TAB, ...TUNING];
const MINI_CAR = new Set(["car", "pattern", "wheels", "wing", "neon"]);
const SAY = { car: "Autá", color: "Farba", pattern: "Vzor", wheels: "Kolesá", wing: "Krídlo", sticker: "Nálepka", roof: "Strecha", neon: "Neón", trail: "Stopa", horn: "Klaksón" };

let tab = "car";

function swatch(item) {
  const bg = item.special === "rainbow" ? "linear-gradient(90deg,#ff5a5f,#ffd23f,#3ebd4a,#2ab7ca,#8f5bd8)" : item.special === "galaxy" ? "radial-gradient(circle at 40% 40%,#7b5cff,#3b2f7a 50%,#140f33)" : item.special === "gold" ? "linear-gradient(180deg,#fff2a8,#e8b923,#a87b00)" : item.value;
  return h("span", { class: "swatch", style: { background: bg } });
}

function tileFace(cat, item, look) {
  if (cat === "color") return swatch(item);
  if (MINI_CAR.has(cat)) return h("span", { class: "tile-car" }, carSide({ ...look, [cat]: item.id }));
  return h("span", { class: "tile-icon", "aria-hidden": "true" }, item.icon || "🚫");
}

export default {
  id: "tuning",
  title: "Vzhľad",
  render(view) {
    let preview = null; // { cat, id } of an unowned item shown on the car
    const root = h("section", { class: "screen tuning", "data-testid": "screen-tuning" });
    view.append(root);

    const shownLook = () => (preview ? { ...getLook(), [preview.cat]: preview.id } : getLook());

    function paint() {
      const look = shownLook();
      const stage = h(
        "div",
        { class: "showroom", "data-testid": "showroom" },
        h("div", { class: "spotlight", "aria-hidden": "true" }),
        h("div", { class: "turntable", "aria-hidden": "true" }),
        h("div", { class: "show-car", "data-testid": "show-car" }, carSide(look, { trail: look.trail !== "none" })),
      );

      const buttons = h(
        "div",
        { class: "show-buttons" },
        h("button", { class: "btn sun", "data-testid": "horn", "aria-label": "Trúbiť", onclick: () => playNotes(resolveLook(look).horn.notes) }, "📯 Trúbiť"),
        h(
          "button",
          {
            class: "btn plum",
            "data-testid": "random-look",
            "aria-label": "Náhodne",
            onclick: () => {
              preview = null;
              randomLook(rng);
              sfx.open();
              speak("Náhodný vzhľad!");
              paint();
            },
          },
          "🎲 Náhodne",
        ),
      );

      let buyBar = null;
      if (preview) {
        const price = priceOf(preview.cat, preview.id);
        const afford = canAfford(price);
        buyBar = h(
          "div",
          { class: `buy-bar${afford ? "" : " poor"}`, "data-testid": "buy-bar" },
          h("span", { class: "buy-price" }, "🪙 ", String(price)),
          h(
            "button",
            {
              class: "btn grass",
              "data-testid": "buy",
              disabled: !afford,
              "aria-label": "Kúpiť",
              onclick: () => {
                if (!buy(preview.cat, preview.id)) return;
                preview = null;
                sfx.win();
                confetti(50);
                speak("Kúpené! Super vzhľad.");
                toast("Kúpené ✔");
                paint();
              },
            },
            "✔ Kúpiť",
          ),
          h("button", { class: "btn ghost", "data-testid": "buy-cancel", "aria-label": "Zrušiť", onclick: () => ((preview = null), sfx.back(), paint()) }, "✖"),
        );
      }

      const tabs = h(
        "div",
        { class: "tune-tabs", role: "tablist" },
        TABS.map((t) =>
          h(
            "button",
            {
              class: `chip${t.id === tab ? " active" : ""}`,
              role: "tab",
              "aria-selected": String(t.id === tab),
              "aria-label": t.name,
              "data-testid": `tab-${t.id}`,
              onclick: () => {
                tab = t.id;
                preview = null;
                sfx.tap();
                speak(SAY[t.id]);
                paint();
              },
            },
            t.icon,
          ),
        ),
      );

      const current = getLook();
      const grid = h(
        "div",
        { class: `tune-grid cat-${tab}`, "data-testid": "tune-grid" },
        itemsOf(tab).map((item) => {
          const owned = isOwned(tab, item.id);
          const on = current[tab] === item.id;
          const previewing = preview && preview.cat === tab && preview.id === item.id;
          return h(
            "button",
            {
              class: `tile${on ? " on" : ""}${owned ? "" : " locked"}${previewing ? " previewing" : ""}`,
              "data-testid": `item-${tab}-${item.id}`,
              "data-owned": String(owned),
              "aria-label": item.name || item.id,
              onclick: () => {
                if (tab === "horn") playNotes(item.notes);
                else sfx.tap();
                if (owned) {
                  preview = null;
                  select(tab, item.id);
                } else {
                  preview = { cat: tab, id: item.id };
                  speak(canAfford(item.price) ? `Stojí to ${item.price} mincí. Chceš to kúpiť?` : "Na toto ešte nemáš dosť mincí. Vyhraj preteky!");
                }
                paint();
              },
            },
            tileFace(tab, item, current),
            on && h("span", { class: "tile-check", "aria-hidden": "true" }, "✔"),
            !owned && h("span", { class: "tile-price" }, "🪙", String(item.price)),
          );
        }),
      );

      root.replaceChildren(h("div", { class: "tune-top" }, stage, buttons, buyBar), h("div", { class: "card tune-panel" }, tabs, grid));
    }

    paint();
    speak("Vzhľad auta. Vyber si, čo sa ti páči.");
  },
};

