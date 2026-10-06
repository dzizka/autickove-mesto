// End-of-race reward: a chest that opens and throws out the new parts (DESIGN-v2 §4.5),
// then the coins and buttons Home / Again / Garage.

import { h, modal, rewardModal, flyCoins, confetti } from "../core/ui.js";
import { speak, sfx } from "../core/audio.js";
import { go } from "../core/router.js";
import { rarityDef, rarityIndex } from "../systems/loot.js";
import { RARITIES } from "../data/loot-bases.js";
import { partCard } from "./part-card.js";

const BEST_SAY = [
  "Truhlica je otvorená! Pozri, čo si našiel.",
  "Zelený diel! Je dobrý.",
  "Modrý diel! Je vzácny!",
  "Fialový diel! Epický!",
  "Oranžový diel! Legendárny!",
];

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
export function presentReward(granted, { onHome, onAgain } = {}) {
  const loot = granted.loot;
  if (!loot?.parts?.length) return rewardModal(granted, { onHome, onAgain });

  const best = Math.max(...loot.parts.map((p) => rarityIndex(p.rarity)));
  const chest = h("button", { class: "chest", "data-testid": "chest", "aria-label": "Otvoriť truhlicu", style: { "--glow": rarityDef(loot.parts[0].rarity).color } }, chestSvg());
  const partsRow = h("div", { class: "chest-parts", "data-testid": "chest-parts" });
  const coinsRow = h("div", { class: "reward-row", "data-testid": "reward-coins" }, "🪙 +", String(granted.coins || 0));
  const garageBtn = h("button", { class: "btn sky", "data-testid": "reward-garage", "aria-label": "Garáž", onclick: () => go("garage") }, "🔧");
  const after = h(
    "div",
    { class: "chest-after" },
    coinsRow,
    loot.scrap > 0 && h("div", { class: "reward-row scrap", "aria-label": "Súčiastky" }, "🔩 +", String(loot.scrap)),
    h(
      "div",
      { class: "modal-row" },
      h("button", { class: "btn sun", "data-testid": "reward-home", "aria-label": "Domov", onclick: () => onHome?.() }, "🏠"),
      onAgain && h("button", { class: "btn grass", "data-testid": "reward-again", "aria-label": "Znova", onclick: () => onAgain() }, "🔁"),
      loot.kept.length > 0 && garageBtn,
    ),
  );

  const box = modal([chest, partsRow, after], { dismissible: false, className: "chest-modal", testId: "reward-modal" });
  let opened = false;
  const open = () => {
    if (opened) return;
    opened = true;
    chest.classList.add("open");
    chest.style.setProperty("--glow", RARITIES[best].color);
    sfx.open();
    if (best >= 2) confetti(best >= 3 ? 90 : 50);
    loot.parts.forEach((p, i) => {
      const card = partCard(p, { compare: true, onClick: () => go("garage") });
      card.style.animationDelay = `${0.25 + i * 0.35}s`;
      partsRow.append(card);
    });
    // a mounted-vs-new ⬆ on any card lights up the garage button
    if (partsRow.querySelector('[data-compare="1"]')) garageBtn.classList.add("pulse");
    setTimeout(() => {
      after.classList.add("show");
      sfx.win();
      if (granted.coins > 0) flyCoins(coinsRow, granted.coins / 5);
    }, 400 + loot.parts.length * 350);
    speak(BEST_SAY[best] || BEST_SAY[0]);
  };
  chest.addEventListener("click", open);
  speak("Truhlica! Ťukni na ňu.");
  setTimeout(open, 1600);
  return box;
}
