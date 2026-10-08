// Showroom (DESIGN-v2 §5): the car on a turning platform under a spotlight, 📯 horn,
// 🎲 random look, car kinds and 9 tuning categories. Unowned items are previewed on the
// car first and bought with coins; looks never change stats. Each car kind has its own
// part levels from the garage, so the badge shows the power of the car on the platform.

import { h, toast, confetti } from "../core/ui.js";
import { speak, sfx, playNotes } from "../core/audio.js";
import * as rng from "../core/rng.js";
import { TUNING, CARS_TAB } from "../data/tuning.js";
import { canAfford } from "../systems/economy.js";
import { itemsOf, getLook, resolveLook, isOwned, priceOf, select, buy, randomLook, fitsCar } from "../systems/tuning.js";
import { carSidePic } from "../render/car-side.js";
import { createCarView } from "../render/car-view.js";
import { buddyBadge } from "./buddy-badge.js";
import { openTestDrive } from "../games/race/test-drive.js";
import { carStats, carPower, levelsOf } from "../systems/stats.js";
import { powerBadge } from "./stat-panel.js";

const TABS = [CARS_TAB, ...TUNING];
const MINI_CAR = new Set(["car", "pattern", "wheels", "wing", "neon"]);
const SAY = { car: "Autá", color: "Farba", pattern: "Vzor", wheels: "Kolesá", wing: "Spojler", sticker: "Nálepka", roof: "Strecha", neon: "Neón", trail: "Stopa", horn: "Klaksón" };

let tab = "car";
let carView = null;

/** A tab icon: an emoji, or a small drawn spoiler (there is no emoji for one). */
function tabIcon(icon) {
  if (icon !== "spoiler") return icon;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 40 28");
  svg.setAttribute("class", "tab-svg");
  svg.innerHTML = '<rect x="3" y="4" width="34" height="7" rx="3" fill="#ff5a5f" stroke="#2b2d33" stroke-width="2"/><rect x="9" y="10" width="4" height="10" fill="#2b2d33"/><rect x="27" y="10" width="4" height="10" fill="#2b2d33"/><rect x="2" y="20" width="36" height="5" rx="2" fill="#9aa0a6"/>';
  return svg;
}

function swatch(item) {
  const bg = item.special === "rainbow" ? "linear-gradient(90deg,#ff5a5f,#ffd23f,#3ebd4a,#2ab7ca,#8f5bd8)" : item.special === "galaxy" ? "radial-gradient(circle at 40% 40%,#7b5cff,#3b2f7a 50%,#140f33)" : item.special === "gold" ? "linear-gradient(180deg,#fff2a8,#e8b923,#a87b00)" : item.value;
  return h("span", { class: "swatch", style: { background: bg } });
}

function tileFace(cat, item, look) {
  if (cat === "color") return swatch(item);
  if (MINI_CAR.has(cat)) {
    return h("span", { class: "tile-car" }, carSidePic({ ...look, [cat]: item.id }));
  }
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
    carView = createCarView({ mode: "turntable" });

    function paint() {
      const look = shownLook();
      carView.setLook(look, { trail: look.trail !== "none" });
      const stage = h(
        "div",
        { class: "showroom", "data-testid": "showroom" },
        h("div", { class: "spotlight", "aria-hidden": "true" }),
        buddyBadge(),
        // every car kind keeps its own part levels (§4.6): a new car starts weak
        h("div", { class: "show-power", "data-testid": "show-power" }, powerBadge(carPower(carStats(levelsOf(resolveLook(look).car.id), true)))),
        h("div", { class: "turntable", "aria-hidden": "true" }),
        h("div", { class: "show-car", "data-testid": "show-car" }, carView.el),
      );

      const buttons = h(
        "div",
        { class: "show-buttons" },
        h("button", { class: "btn sun", "data-testid": "horn", "aria-label": "Trúbiť", onclick: () => playNotes(resolveLook(look).horn.notes) }, "📯 Trúbiť"),
        h(
          "button",
          {
            class: "btn sky",
            "data-testid": "test-drive",
            "aria-label": "Skúšobná jazda",
            onclick: () => {
              sfx.open();
              carView.pause(true);
              openTestDrive(shownLook(), { onClose: () => carView?.pause(false) });
            },
          },
          "🛣️ Jazda",
        ),
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

      // a spoiler or a roof item does not fit every car: its tab is not shown then (part 18)
      const carId = resolveLook(look).car.id;
      const tabsHere = TABS.filter((t) => fitsCar(t.id, carId));
      if (!tabsHere.some((t) => t.id === tab)) tab = "car";
      const tabs = h(
        "div",
        { class: "tune-tabs", role: "tablist" },
        tabsHere.map((t) =>
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
                carView.focus(tab);
                sfx.tap();
                speak(SAY[t.id]);
                paint();
              },
            },
            tabIcon(t.icon),
          ),
        ),
      );

      const current = getLook();
      const grid = h(
        "div",
        { class: `tune-grid cat-${tab}`, "data-testid": "tune-grid" },
        // cheapest first (the free one is always first)
        [...itemsOf(tab)].sort((a, b) => a.price - b.price).map((item) => {
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
                carView.focus(tab);
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
  leave() {
    carView?.destroy();
    carView = null;
  },
};

