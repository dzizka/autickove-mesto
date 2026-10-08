// 🎁 Daily gift (DESIGN-v2 §13): shown on the home screen once a day. Seven boxes show the days
// in a row; the child taps the big gift to open it.

import { h, modal, closeModal, flyCoins, confetti } from "../core/ui.js";
import { speak, sfx } from "../core/audio.js";
import * as rng from "../core/rng.js";
import { DAILY } from "../data/album.js";
import { dailyReady, dailyDay, claimDaily } from "../systems/daily.js";
import { showStickers } from "./album.js";

export function showDailyGift({ onDone } = {}) {
  if (!dailyReady()) return false;
  const day = dailyDay();
  const days = DAILY.coins.map((_, i) =>
    h("span", { class: `day-box${i + 1 < day ? " past" : i + 1 === day ? " today" : ""}`, "aria-hidden": "true" }, i + 1 < day ? "✅" : DAILY.packs[i] ? "🎴" : DAILY.candy?.[i] ? "🍬" : "🪙"),
  );
  const gift = h(
    "button",
    {
      class: "daily-gift",
      "data-testid": "daily-gift",
      "aria-label": "Otvoriť darček",
      onclick: (e) => {
        const res = claimDaily(rng);
        if (!res) return closeModal();
        sfx.open();
        confetti(60);
        flyCoins(e.currentTarget, Math.min(15, res.coins / 10));
        gift.classList.add("open");
        gift.textContent = "🪙";
        coins.textContent = `🪙 +${res.coins}${res.candy ? `  🍬 +${res.candy}` : ""}`;
        coins.hidden = false;
        speak(res.packs ? "Mince a nálepky! Príď aj zajtra." : "Mince! Príď aj zajtra, darček bude väčší.");
        setTimeout(() => {
          closeModal();
          if (res.album) showStickers(res.album, { title: "🎁", onClose: onDone });
          else onDone?.();
        }, 1600);
      },
    },
    "🎁",
  );
  const coins = h("div", { class: "reward-row", "data-testid": "daily-coins", hidden: true });
  modal([h("div", { class: "day-row" }, days), gift, coins], { dismissible: false, testId: "daily-modal", className: "daily-modal" });
  speak(day > 1 ? "Darček na dnes! Prišiel si znova, tak je väčší. Ťukni naň." : "Darček na dnes! Ťukni naň.");
  return true;
}
