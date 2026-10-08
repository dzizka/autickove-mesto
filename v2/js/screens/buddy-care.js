// Buddy care on the crew card (DESIGN-v2 §6.1, part 21): 🍬 feed a candy, ⭐ play the star game
// (three dots = plays left today) and the daily pat. Every gain shows as "⬆ +XP" over the buddy.

import { h, confetti } from "../core/ui.js";
import { speak, sfx, playNotes } from "../core/audio.js";
import { go } from "../core/router.js";
import { getState } from "../core/state.js";
import { CREW_RULES } from "../data/crew.js";
import { canFeed, feed, feedXp, playsLeft, petXp } from "../systems/crew-care.js";
import { t } from "../core/i18n.js";

/** "⬆ +12" (and ⭐ for a new level) floating over the buddy. */
export function xpPop(card, xp, levels = []) {
  const face = card?.querySelector(".buddy-pet") || card;
  if (!face || !(xp > 0)) return;
  const el = h("span", { class: "xp-pop", "aria-hidden": "true", "data-testid": "xp-pop" }, `⬆ +${xp}${levels.length ? " ⭐" : ""}`);
  face.append(el);
  setTimeout(() => el.remove(), 1300);
  if (levels.length) {
    sfx.levelUp();
    confetti(50);
  }
}

/** The first pat of the day also gives XP (called after the hearts). */
export function petGrowth(card, id) {
  const r = petXp(id);
  xpPop(card, r.xp, r.levels);
}

/** A candy flies from the 🍬 button into the buddy's mouth. */
function flyCandy(from, to) {
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  const c = h("span", { class: "feed-candy", "aria-hidden": "true" }, "🍬");
  c.style.left = `${a.left + a.width / 2 - 18}px`;
  c.style.top = `${a.top}px`;
  document.body.append(c);
  requestAnimationFrame(() => {
    c.style.transform = `translate(${b.left + b.width / 2 - a.left - a.width / 2}px, ${b.top + b.height * 0.45 - a.top}px) scale(.5)`;
    c.style.opacity = "0.2";
  });
  setTimeout(() => c.remove(), 600);
}

/** The 🍬 and ⭐ buttons for the buddy on the card. */
export function careButtons(b, def, { card, paint }) {
  const s = getState();
  const top = b.level >= CREW_RULES.maxLevel;
  const left = playsLeft(b.id);
  const feedBtn = h(
    "button",
    {
      class: `btn sun care-btn${canFeed(b.id, s) ? "" : " dim"}`,
      "data-testid": "feed",
      "aria-label": "Nakŕmiť cukríkom",
      "data-hint": canFeed(b.id, s) ? "1" : null,
      onclick: (e) => {
        const btn = e.currentTarget;
        if (top) return speak(t("{name} je už najsilnejší!", { name: t(def.name) }));
        if (!canFeed(b.id)) {
          sfx.oops();
          return speak("Cukríky sú v truhlici po pretekoch a v dennom darčeku.");
        }
        const face = card().querySelector(".buddy-pet");
        flyCandy(btn, face);
        const res = feed(b.id);
        playNotes([[660, 0.07, "triangle"], [880, 0.07, "triangle"], [1175, 0.12, "triangle"]]);
        setTimeout(() => {
          paint();
          xpPop(card(), res.xp, res.levels);
        }, 520);
        speak(t("Mňam! {name} rastie.", { name: t(def.name) }));
      },
    },
    "🍬 ",
    h("small", { class: "cost" }, `+${feedXp(b)}`),
  );
  const playBtn = h(
    "button",
    {
      class: `btn grass care-btn${left ? " pulse" : ""}`,
      "data-testid": "play-buddy",
      "aria-label": "Hrať sa s kamarátom",
      onclick: () => {
        sfx.tap();
        go(`game/buddy/${b.id}`);
      },
    },
    "⭐",
    h("span", { class: "care-dots", "aria-hidden": "true", "data-testid": "plays-left", "data-left": String(left) }, Array.from({ length: CREW_RULES.playsPerDay }, (_, i) => h("i", { class: i < left ? "on" : "" }))),
  );
  return [feedBtn, playBtn];
}
