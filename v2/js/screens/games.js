// 🎪 Hry: the games room with the activities from v1 (DESIGN-v2 §12). Big tiles with an icon,
// the difficulty as stars; locked games show 🔒 and the level they open on. A tap asks for the
// difficulty: ★ / ★★ / ★★★, the recommended one glows 👍 (DESIGN-v2 §12, part 13).

import { h, modal, closeModal } from "../core/ui.js";
import { speak, sfx } from "../core/audio.js";
import { getState } from "../core/state.js";
import { startGame } from "../core/router.js";
import { MINIGAMES, MINI } from "../data/minigames.js";
import { miniProgress } from "../systems/minigames.js";

/** The child picks the difficulty; all three are open, the recommendation glows. */
function pickLevel(g) {
  const prog = miniProgress(g.id);
  const current = prog.pick || prog.level;
  modal(
    [
      h("div", { class: "modal-icon", "aria-hidden": "true" }, g.icon),
      h(
        "div",
        { class: "level-pick" },
        MINI.levelNames.map((name, i) =>
          h(
            "button",
            {
              class: `btn big diff-btn lv${i + 1}${i + 1 === current ? " last" : ""}${i + 1 === prog.level ? " recommended" : ""}`,
              "data-testid": `level-${i + 1}`,
              "aria-label": name,
              onclick: () => {
                sfx.tap();
                closeModal();
                startGame(g.id, i + 1);
              },
            },
            h("span", { class: "lv-stars", "aria-hidden": "true" }, "★".repeat(i + 1)),
            h("span", { class: "btn-label" }, name),
            i + 1 === prog.level && h("span", { class: "lv-thumb", "aria-hidden": "true" }, "👍"),
          ),
        ),
      ),
      h("div", { class: "modal-row" }, h("button", { class: "btn ghost", "data-testid": "level-close", onclick: closeModal }, "✖")),
    ],
    { testId: "level-picker", className: "level-modal" },
  );
  speak(`${g.say} Vyber si: ľahké, stredné, alebo ťažké.`);
}

export default {
  id: "games",
  title: "Hry",
  render(view) {
    const s = getState();
    const tiles = MINIGAMES.map((g) => {
      const locked = s.level < g.unlockLevel;
      const prog = miniProgress(g.id, s);
      const lvl = prog.pick || prog.level;
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
            pickLevel(g);
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
