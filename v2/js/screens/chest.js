// End-of-race reward: a chest that opens and throws out scrap 🔩, sometimes a golden part
// (+1 level for the weakest part), a candy or an egg (DESIGN-v2 §4.5), then the coins and the
// buttons Home / Again / Garage.

import { h, rewardModal, modal, flyCoins, confetti } from "../core/ui.js";
import { speak, sfx } from "../core/audio.js";
import { go } from "../core/router.js";
import { SLOTS } from "../data/stats.js";
import { LEGENDARIES } from "../data/legendaries.js";
import { hintSlot } from "../systems/garage.js";
import { presentColoringReward } from "./gallery.js";
import { t } from "../core/i18n.js";

const GOLD = "#ffc21a";
const slotDef = (id) => SLOTS.find((s) => s.id === id);
const abilityDef = (id) => LEGENDARIES.find((l) => l.id === id);

/**
 * How far the spare parts go toward the next upgrade (part 22): the bar fills from before to
 * after; when it is full, the part's icon glows with ⬆ (the garage can upgrade it now).
 */
function scrapBar({ before, after, cost, slot }, delay) {
  const pct = (v) => `${Math.round(Math.min(1, v / Math.max(1, cost)) * 100)}%`;
  const fill = h("i", { style: { width: pct(before) } });
  const full = after >= cost;
  const el = h(
    "div",
    { class: `chest-bar${full ? " full" : ""}`, "data-testid": "chest-bar", "data-full": String(full), "aria-hidden": "true" },
    h("span", { class: "cb-icon" }, "🔩"),
    h("span", { class: "cb-track" }, fill),
    h("span", { class: "cb-part" }, slotDef(slot)?.icon || "🔧", full ? h("b", { class: "up" }, "⬆") : null),
  );
  setTimeout(() => (fill.style.width = pct(after)), delay * 1000);
  return el;
}

/** One thing out of the chest: a big icon and a small number or arrow. */
function chestItem(icon, label, { testId, cls = "", aria } = {}) {
  return h("div", { class: `chest-item ${cls}`, "data-testid": testId, "aria-label": aria }, h("span", { class: "ci-icon", "aria-hidden": "true" }, icon), label && h("span", { class: "ci-label" }, label));
}

function chestSvg() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 120 100");
  svg.setAttribute("class", "chest-svg");
  svg.innerHTML = `
    <g class="chest-lid">
      <path d="M10 42 Q10 12 60 12 Q110 12 110 42 Z" fill="#b5651d" stroke="#6b3a10" stroke-width="4"/>
      <rect x="52" y="12" width="16" height="30" fill="#ffd23f" stroke="#a87b00" stroke-width="3"/>
    </g>
    <rect x="10" y="42" width="100" height="50" rx="6" fill="#c97a2b" stroke="#6b3a10" stroke-width="4"/>
    <rect x="52" y="42" width="16" height="50" fill="#ffd23f" stroke="#a87b00" stroke-width="3"/>
    <circle cx="60" cy="58" r="6" fill="#6b3a10"/>`;
  return svg;
}

/**
 * Reward presenter for the router. Shows the chest when the reward has loot,
 * otherwise the plain coin dialog.
 */
const CHEST_REMIND_MS = 5000;
const CHEST_AUTO_OPEN_MS = 12000;

export function presentReward(granted, { onHome, onAgain, onGames, gamesIcon, gamesLabel } = {}) {
  if (granted.coloringReward) return presentColoringReward(granted, { onHome });
  const loot = granted.loot;
  if (!loot) return rewardModal(granted, { onHome, onAgain, onGames, gamesIcon, gamesLabel });

  const golden = loot.golden;
  const ability = golden?.ability ? abilityDef(golden.ability) : null;
  const chest = h("button", { class: "chest", "data-testid": "chest", "aria-label": "Otvoriť truhlicu", style: { "--glow": golden ? GOLD : "#ffd23f" } }, chestSvg());
  const itemsRow = h("div", { class: "chest-parts", "data-testid": "chest-parts" });
  const coinsRow = h("div", { class: "reward-row", "data-testid": "reward-coins" }, "🪙 +", String(granted.coins || 0));
  const garageBtn = h("button", { class: "btn sky", "data-testid": "reward-garage", "aria-label": "Garáž", onclick: () => go("garage") }, "🔧");
  const after = h(
    "div",
    { class: "chest-after" },
    coinsRow,
    h("div", { class: "modal-row" }, h("button", { class: "btn sun", "data-testid": "reward-home", "aria-label": "Domov", onclick: () => onHome?.() }, "🏠"), onAgain && h("button", { class: "btn grass", "data-testid": "reward-again", "aria-label": "Znova", onclick: () => onAgain() }, "🔁"), garageBtn),
  );

  const box = modal([chest, itemsRow, after], { dismissible: false, className: "chest-modal", testId: "reward-modal" });
  let opened = false;
  const open = () => {
    if (opened) return;
    opened = true;
    chest.classList.add("open");
    sfx.open();
    const items = [];
    if (loot.scrap > 0) items.push(chestItem("🔩", `+${loot.scrap}`, { testId: "chest-scrap", cls: "scrap", aria: "Súčiastky" }));
    // a finished car turns spare parts into coins (part 22)
    if (loot.coins > 0) items.push(chestItem("🔩➡🪙", `+${loot.coins}`, { testId: "chest-scrap-coins", cls: "scrap-coins", aria: "Mince" }));
    if (golden) {
      const slot = slotDef(golden.slot);
      items.push(
        h(
          "div",
          { class: "chest-item golden", "data-testid": "chest-golden", "data-slot": golden.slot, "aria-label": "Zlatý diel" },
          h("span", { class: "ci-icon", "aria-hidden": "true" }, slot.icon),
          h("span", { class: "ci-label" }, h("b", { class: "up" }, "⬆"), String(golden.level)),
          ability && h("span", { class: "ci-ability", "aria-hidden": "true" }, ability.icon),
        ),
      );
    }
    if (loot.candy) items.push(chestItem("🍬", `+${loot.candy}`, { testId: "chest-candy", aria: "Cukrík" }));
    if (granted.egg) items.push(chestItem("🥚", null, { testId: "chest-egg", cls: "egg", aria: "Vajíčko" }));
    items.forEach((el, i) => {
      el.style.animationDelay = `${0.25 + i * 0.35}s`;
      itemsRow.append(el);
    });
    if (loot.bar) itemsRow.after(scrapBar(loot.bar, 0.4 + items.length * 0.35));
    if (golden) confetti(ability ? 90 : 50);
    if (golden || hintSlot()) garageBtn.classList.add("pulse");
    setTimeout(() => {
      after.classList.add("show");
      sfx.win();
      if (granted.coins > 0) flyCoins(coinsRow, granted.coins / 5);
    }, 400 + items.length * 350);
    const what = golden ? t("Zlatý diel! {name} je silnejší.", { name: t(slotDef(golden.slot).name) }) + (ability ? ` ${t("Nová schopnosť: {name}!", { name: t(ability.name) })}` : "") : loot.coins > 0 ? t("Auto je hotové, súčiastky sú mince!") : t("Súčiastky do garáže!");
    if (granted.boss && granted.extra?.bossWin) speak(t("Poklad od bossa! {what} A vajíčko s kamarátom!", { what }));
    else speak(what);
  };
  chest.addEventListener("click", open);
  if (granted.boss && granted.extra?.bossWin) chest.classList.add("boss-chest");
  // The child opens the chest. A reminder comes after a while, and only a child who
  // walked away gets it opened automatically (DESIGN-v2 §4.5).
  speak("Truhlica! Ťukni na ňu.");
  setTimeout(() => !opened && box.isConnected && speak("Ťukni na truhlicu!"), CHEST_REMIND_MS);
  setTimeout(() => box.isConnected && open(), CHEST_AUTO_OPEN_MS);
  return box;
}
