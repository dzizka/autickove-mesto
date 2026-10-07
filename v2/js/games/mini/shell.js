// Frame shared by the games-room games (DESIGN-v2 §12): 🏠 exit, difficulty stars, a progress
// bar instead of numbers, 🔊 repeat, timers that stop with the game, and the finish with stars.

import { h } from "../../core/ui.js";
import { miniProgress, miniReward } from "../../systems/minigames.js";
import { MINI } from "../../data/minigames.js";

export function createShell(view, ctx, game) {
  const level = miniProgress(game.id).level;
  const fill = h("i");
  const stage = h("div", { class: "mini-stage", "data-testid": "mini-stage" });
  const wrap = h(
    "section",
    { class: `screen game mini mini-${game.id}`, "data-testid": `screen-game-${game.id}`, "data-level": String(level) },
    h(
      "div",
      { class: "mini-top" },
      h("button", { class: "icon-btn", "data-testid": "game-exit", "aria-label": "Domov", onclick: ctx.exit }, "🏠"),
      h("span", { class: "mini-level", "aria-label": "Obtiažnosť" }, Array.from({ length: MINI.levels }, (_, i) => h("i", { class: i < level ? "on" : "" }, "★"))),
      h("div", { class: "mini-progress", "data-testid": "mini-progress" }, fill),
      h("button", { class: "icon-btn", "data-testid": "mini-repeat", "aria-label": "Zopakovať", onclick: () => ctx.audio.repeat() }, "🔊"),
    ),
    stage,
  );
  view.append(wrap);

  const timers = new Set();
  let over = false;
  return {
    level,
    stage,
    wrap,
    get over() {
      return over;
    },
    progress(f) {
      fill.style.width = `${Math.round(Math.max(0, Math.min(1, f)) * 100)}%`;
    },
    /** setTimeout that is cancelled when the game stops. */
    later(fn, ms) {
      const t = setTimeout(() => {
        timers.delete(t);
        if (!over) fn();
      }, ms);
      timers.add(t);
      return t;
    },
    /** Finish with 1–3 stars; the host grants coins and XP. */
    done(stars) {
      if (over) return;
      over = true;
      this.progress(1);
      ctx.finish({ ...miniReward(level, stars), stars, extra: { mini: { id: game.id, stars, level } } });
    },
    stop() {
      over = true;
      timers.forEach(clearTimeout);
      timers.clear();
    },
  };
}

/** A little shake on a wrong answer (restarts the animation). */
export function shake(el) {
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
}
