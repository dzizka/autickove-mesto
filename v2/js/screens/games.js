// 🎪 Hry: the games room with the activities from v1 (DESIGN-v2 §12). Big tiles with an icon,
// the difficulty as stars; locked games show 🔒 and the level they open on.

import { h } from "../core/ui.js";
import { speak, sfx } from "../core/audio.js";
import { getState } from "../core/state.js";
import { startGame } from "../core/router.js";
import { MINIGAMES, MINI } from "../data/minigames.js";
import { miniProgress } from "../systems/minigames.js";

export default {
  id: "games",
  title: "Hry",
  render(view) {
    const s = getState();
    const tiles = MINIGAMES.map((g) => {
      const locked = s.level < g.unlockLevel;
      const lvl = miniProgress(g.id, s).level;
      return h(
        "button",
        {
          class: `btn big ${g.color} game-tile${locked ? " locked" : ""}`,
          "data-testid": `mini-${g.id}`,
          "data-locked": String(locked),
          "aria-label": g.name,
          onclick: () => {
            if (locked) {
              sfx.oops();
              speak("Táto hra sa otvorí na vyššom leveli. Jazdi preteky a hraj sa!");
              return;
            }
            sfx.tap();
            speak(g.say);
            startGame(g.id);
          },
        },
        h("span", { class: "btn-icon", "aria-hidden": "true" }, locked ? "🔒" : g.icon),
        h("span", { class: "btn-label" }, g.name),
        locked
          ? h("span", { class: "tile-need", "aria-hidden": "true" }, "⭐", String(g.unlockLevel))
          : h("span", { class: "tile-stars", "aria-hidden": "true" }, Array.from({ length: MINI.levels }, (_, i) => h("i", { class: i < lvl ? "on" : "" }, "★"))),
      );
    });
    view.append(h("section", { class: "screen games-room", "data-testid": "screen-games" }, h("div", { class: "games-grid" }, tiles)));
    speak("Vyber si hru.", { interrupt: false });
  },
};
