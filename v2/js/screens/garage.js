// Garage (DESIGN-v2 §4.6): the car on a lift with its 6 slots, ✨ Best, car stats,
// the parts bag with filters, dismantling of grey and green parts and bag expansion.

import { h, confirm, toast } from "../core/ui.js";
import { speak, sfx } from "../core/audio.js";
import { getState } from "../core/state.js";
import { SLOTS } from "../data/stats.js";
import { carStats, carPower, activeSetBonuses, setLook } from "../systems/stats.js";
import { partPower, compareToEquipped, equipBest, dismantleableLow, dismantleLow, bagPrice, expandBag } from "../systems/garage.js";
import { canAfford } from "../systems/economy.js";
import { carSide } from "../render/car-side.js";
import { getLook } from "../systems/tuning.js";
import { partCard, openPartDetail } from "./part-card.js";
import { openSetBook } from "./set-book.js";
import { statPanel, powerBadge } from "./stat-panel.js";

let filter = "all";

function sortedBag(s) {
  return [...s.inventory]
    .filter((p) => filter === "all" || p.slot === filter)
    .sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0) || compareToEquipped(b) - compareToEquipped(a) || partPower(b) - partPower(a));
}

export default {
  id: "garage",
  title: "Garáž",
  render(view) {
    const root = h("section", { class: "screen garage", "data-testid": "screen-garage" });
    view.append(root);

    const paint = () => {
      const s = getState();
      const power = carPower(carStats());
      const better = s.inventory.some((p) => compareToEquipped(p) > 0);
      const low = dismantleableLow(s).length;
      const price = bagPrice(s);

      const slotBtn = (slot) => {
        const part = s.car.equipped[slot.id];
        return h(
          "div",
          { class: "slot", "data-slot": slot.id },
          part ? partCard(part, { compare: false, testId: `slot-${slot.id}`, onClick: () => openPartDetail(part.uid, { onChange: paint }) }) : h("div", { class: "part-card empty" }, slot.icon),
          h("span", { class: "slot-icon", "aria-hidden": "true" }, slot.icon),
          s.inventory.some((p) => p.slot === slot.id && compareToEquipped(p) > 0) && h("span", { class: "slot-better", "aria-hidden": "true" }, "⬆"),
        );
      };

      const lift = h(
        "div",
        { class: "lift card" },
        h("div", { class: "lift-slots left" }, SLOTS.slice(0, 3).map(slotBtn)),
        h("div", { class: "lift-car" }, carSide({ ...getLook(), ...setLook() }), h("div", { class: "lift-post", "aria-hidden": "true" })),
        h("div", { class: "lift-slots right" }, SLOTS.slice(3).map(slotBtn)),
      );

      const tools = h(
        "div",
        { class: "garage-tools" },
        powerBadge(power),
        h(
          "button",
          {
            class: `btn grass${better ? " pulse" : ""}`,
            "data-testid": "equip-best",
            disabled: !better,
            onclick: () => {
              const before = power;
              const swaps = equipBest();
              sfx.win();
              speak(swaps ? "Super! Auto má najlepšie diely." : "Auto už má najlepšie diely.");
              paint();
              if (carPower(carStats()) > before) root.querySelector(".power-badge")?.classList.add("pop");
            },
          },
          "✨ Najlepšie",
        ),
        h("div", { class: "scrap", "data-testid": "scrap", "aria-label": "Súčiastky" }, "🔩 ", String(s.scrap)),
        h("button", { class: "btn small sky", "data-testid": "open-sets", "aria-label": "Kniha setov", onclick: openSetBook }, "📖"),
        ...activeSetBonuses().map((b) => h("span", { class: `set-badge${b.pieces >= 3 ? " full" : ""}`, style: { "--set": b.set.color }, "data-testid": `active-set-${b.set.id}` }, b.set.icon, " ", String(b.pieces))),
      );

      const bagFill = Math.min(100, (s.inventory.length / s.bagSize) * 100);
      const chips = [{ id: "all", icon: "🎒" }, ...SLOTS].map((c) =>
        h(
          "button",
          {
            class: `chip${filter === c.id ? " active" : ""}`,
            "data-testid": `filter-${c.id}`,
            "aria-label": c.name || "Všetko",
            onclick: () => {
              filter = c.id;
              sfx.tap();
              paint();
            },
          },
          c.icon,
        ),
      );
      const bagParts = sortedBag(s);
      const bag = h(
        "div",
        { class: "bag card" },
        h(
          "div",
          { class: "bag-head" },
          h("div", { class: "bag-meter", "aria-label": "Plná taška", "data-testid": "bag-meter" }, h("span", { "aria-hidden": "true" }, "🎒"), h("span", { class: "bag-bar" }, h("i", { style: { width: `${bagFill}%` }, class: bagFill >= 90 ? "full" : "" })), h("small", {}, `${s.inventory.length}/${s.bagSize}`)),
          price !== null &&
            h(
              "button",
              {
                class: "btn small sun",
                "data-testid": "bag-expand",
                disabled: !canAfford(price),
                onclick: async (e) => {
                  const ok = await confirm({ icon: "🎒", title: "Väčšia taška?", text: `+5 miest za ${price} 🪙`, say: "Chceš väčšiu tašku?" });
                  if (ok && expandBag()) {
                    sfx.win();
                    speak("Taška je väčšia!");
                  }
                  paint();
                },
              },
              "➕🎒",
            ),
          h(
            "button",
            {
              class: "btn small ghost",
              "data-testid": "dismantle-low",
              disabled: !low,
              onclick: async () => {
                const ok = await confirm({ icon: "🔩", title: "Rozobrať sivé a zelené?", text: `Rozoberie sa ${low} dielov. Zamknuté 🔒 ostanú.`, say: "Rozobrať všetky sivé a zelené diely?", danger: true });
                if (!ok) return;
                const res = dismantleLow();
                sfx.coin();
                toast(`+${res.scrap}`, { icon: "🔩" });
                speak("Rozobrané. Máš nové súčiastky.");
                paint();
              },
            },
            "🔩 ",
            h("span", { class: "dot grey" }),
            h("span", { class: "dot green" }),
          ),
        ),
        h("div", { class: "chips" }, chips),
        bagParts.length
          ? h("div", { class: "bag-grid", "data-testid": "bag-grid" }, bagParts.map((p) => partCard(p, { onClick: () => openPartDetail(p.uid, { onChange: paint }) })))
          : h("p", { class: "bag-empty", "aria-hidden": "true" }, "🎒 🏁 ➡️ 🧰"),
      );

      // phone: car, ✨ Best, bag, stats (the ⬆ parts come right after the car)
      root.replaceChildren(lift, h("div", { class: "card garage-tools-card" }, tools), bag, h("div", { class: "card garage-stats" }, statPanel(carStats())));
    };
    paint();

    const better = getState().inventory.some((p) => compareToEquipped(p) > 0);
    speak(better ? "Garáž. Máš lepší diel! Hľadaj zelenú šípku hore." : "Garáž. Ťukni na diel a pozri sa naň.");
  },
};
