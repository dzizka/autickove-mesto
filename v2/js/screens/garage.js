// Garage B (DESIGN-v2 §4.6): the chosen car on a lift with its 6 parts around it. A tap on a part
// upgrades it for scrap 🔩; the ring shows how far the next ability is. Every car keeps its own
// levels. The cheapest part the child can pay for glows as a hint.

import { h, confetti } from "../core/ui.js";
import { speak, sfx, playNotes } from "../core/audio.js";
import { getState } from "../core/state.js";
import { SLOTS, STATS } from "../data/stats.js";
import { GARAGE } from "../data/garage.js";
import { LEGENDARIES } from "../data/legendaries.js";
import { carStats, carPower, activeLevels, carAbilities } from "../systems/stats.js";
import { upgrade, upgradeCost, nextAbility, hintSlot } from "../systems/garage.js";
import { createCarView } from "../render/car-view.js";
import { buddyBadge } from "./buddy-badge.js";
import { getLook } from "../systems/tuning.js";
import { statPanel, powerBadge } from "./stat-panel.js";

const abilityDef = (id) => LEGENDARIES.find((l) => l.id === id);
const SAY_GAP_MS = 2500;

let carView = null;

/** One big part button: icon in a ring toward the next ability, level, price. */
function partButton(slot, level, scrap, { hint, onTap }) {
  const cost = upgradeCost(level);
  const next = nextAbility(slot.id, level);
  const ring = next ? (level - next.from) / (next.at - next.from) : 1;
  const can = cost !== null && scrap >= cost;
  return h(
    "button",
    {
      class: `part-btn${can ? " can" : ""}${cost === null ? " done" : ""}${hint ? " hint" : ""}`,
      "data-testid": `part-${slot.id}`,
      "data-slot": slot.id,
      "data-level": String(level),
      "data-can": can ? "1" : "0",
      "aria-label": `${slot.name} ${level}`,
      style: { "--ring": `${Math.round(ring * 100)}%`, "--stat": STATS[slot.main].color },
      onclick: (e) => onTap(slot, e.currentTarget),
    },
    h("span", { class: "pb-ring", "aria-hidden": "true" }, h("span", { class: "pb-icon" }, slot.icon)),
    h("span", { class: "pb-level", "data-testid": `level-${slot.id}` }, String(level)),
    next && h("span", { class: "pb-next", "aria-hidden": "true" }, abilityDef(next.id)?.icon),
    h("span", { class: "pb-cost", "aria-hidden": "true" }, cost === null ? "⭐" : `🔩 ${cost}`),
  );
}

/** "+6 ⚡ ⬆" floating up from the part. */
function floatGain(btn, slot) {
  const stat = STATS[slot.main];
  const el = h("span", { class: "pb-gain", "aria-hidden": "true" }, `${stat.icon} +${GARAGE.statPerLevel} `, h("b", {}, "⬆"));
  btn.append(el);
  el.addEventListener("animationend", () => el.remove());
}

export default {
  id: "garage",
  title: "Garáž",
  render(view) {
    const root = h("section", { class: "screen garage", "data-testid": "screen-garage" });
    view.append(root);
    carView = createCarView({ mode: "lift" });
    carView.setLook(getLook());
    let saidAt = 0;
    const say = (text) => {
      if (performance.now() - saidAt < SAY_GAP_MS) return;
      saidAt = performance.now();
      speak(text);
    };

    const onTap = (slot, btn) => {
      const res = upgrade(slot.id);
      if (!res) {
        btn.classList.remove("shake");
        void btn.offsetWidth; // restart the shake
        btn.classList.add("shake");
        sfx.oops();
        say(upgradeCost(activeLevels()[slot.id]) === null ? "Tento diel je už najlepší!" : "Potrebuješ viac súčiastok. Jazdi preteky!");
        return;
      }
      sfx.coin();
      paint();
      const fresh = root.querySelector(`[data-slot="${slot.id}"]`);
      fresh?.classList.add("bump");
      if (fresh) floatGain(fresh, slot);
      root.querySelector(".power-badge")?.classList.add("pop");
      const car = root.querySelector(".lift-car");
      car?.classList.remove("jiggle");
      void car?.offsetWidth;
      car?.classList.add("jiggle");
      const ability = res.ability && abilityDef(res.ability);
      if (ability) {
        confetti(90);
        playNotes(ability.notes);
        saidAt = performance.now();
        speak(`Nová schopnosť! ${ability.name}!`);
      } else if (res.level === GARAGE.maxLevel) {
        sfx.win();
        say(`${slot.name} je na najvyššej úrovni!`);
      }
    };

    const paint = () => {
      const s = getState();
      const levels = activeLevels(s);
      const hint = hintSlot(s);
      const btn = (slot) => partButton(slot, levels[slot.id], s.scrap, { hint: slot.id === hint, onTap });
      const abilities = [...carAbilities(levels)].map(abilityDef).filter(Boolean);
      const lift = h(
        "div",
        { class: "lift card" },
        h("div", { class: "lift-slots left" }, SLOTS.slice(0, 3).map(btn)),
        h("div", { class: "lift-car" }, carView.el, h("div", { class: "lift-post", "aria-hidden": "true" }), buddyBadge()),
        h("div", { class: "lift-slots right" }, SLOTS.slice(3).map(btn)),
      );
      const tools = h(
        "div",
        { class: "garage-tools" },
        powerBadge(carPower(carStats())),
        h("div", { class: "scrap", "data-testid": "scrap", "aria-label": "Súčiastky" }, "🔩 ", String(s.scrap)),
      );
      const abilityRow = abilities.length
        ? h(
            "div",
            { class: "car-abilities", "data-testid": "car-abilities", "aria-label": "Schopnosti auta" },
            abilities.map((a) => h("span", { class: "car-ability", "data-ability": a.id, title: a.name, "aria-hidden": "true" }, a.icon)),
          )
        : null;
      root.replaceChildren(lift, h("div", { class: "card garage-tools-card" }, tools, abilityRow), h("div", { class: "card garage-stats" }, statPanel(carStats())));
    };
    paint();

    speak(hintSlot() ? "Garáž. Ťukni na diel, ktorý svieti, a auto bude silnejšie." : "Garáž. Za súčiastky z pretekov tu vylepšíš diely auta.");
  },
  leave() {
    carView?.destroy();
    carView = null;
  },
};
