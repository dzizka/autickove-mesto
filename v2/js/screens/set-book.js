// Set book (DESIGN-v2 §4.7): 4 sets of 3 parts. Found parts are coloured, missing ones
// are grey shadows. Bonuses are shown as stat icons: 2 parts small, 3 parts big + look.

import { h, modal, closeModal } from "../core/ui.js";
import { speak } from "../core/audio.js";
import { getState } from "../core/state.js";
import { SETS } from "../data/sets.js";
import { STATS } from "../data/stats.js";
import { setCounts } from "../systems/stats.js";
import { getItem } from "../systems/tuning.js";

const bonusIcons = (bonus) => bonus.map((b) => STATS[b.stat]?.icon || "").join("");

export function openSetBook() {
  const s = getState();
  const counts = setCounts();
  const rows = SETS.map((set) => {
    const found = s.setsFound[set.id] || [];
    const mountedSlots = Object.entries(s.car.equipped).filter(([, p]) => p?.set === set.id).map(([slot]) => slot);
    const n = counts[set.id] || 0;
    const lookIcons = Object.entries(set.look).map(([cat, id]) => getItem(cat, id)?.icon).filter(Boolean).join("");
    return h(
      "div",
      { class: `set-row${n >= 2 ? " active" : ""}`, style: { "--set": set.color }, "data-testid": `set-${set.id}`, "data-count": String(n) },
      h("span", { class: "set-icon", "aria-hidden": "true" }, set.icon),
      h(
        "span",
        { class: "set-pieces" },
        Object.entries(set.pieces).map(([slot, icon]) =>
          h("span", { class: `set-piece${found.includes(slot) ? " found" : ""}${mountedSlots.includes(slot) ? " mounted" : ""}`, "data-slot": slot, "aria-hidden": "true" }, icon),
        ),
      ),
      h(
        "span",
        { class: "set-bonus" },
        h("span", { class: `sb${n >= 2 ? " on" : ""}` }, "2 ", bonusIcons(set.bonus2)),
        h("span", { class: `sb${n >= 3 ? " on" : ""}` }, "3 ", bonusIcons(set.bonus3), " ", lookIcons),
      ),
    );
  });
  modal([h("h2", {}, "📖 Kniha setov"), h("div", { class: "set-book" }, rows), h("div", { class: "modal-row" }, h("button", { class: "btn ghost", onclick: closeModal }, "✖"))], { className: "wide", testId: "set-book" });
  speak("Kniha setov. Nájdi všetky tri diely a auto dostane veľký bonus a nový vzhľad!");
}
