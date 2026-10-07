// Trophy shelf (DESIGN-v2 §8): earned trophies shine, the others are grey shadows.
// Tapping a trophy reads its name aloud.

import { h } from "../core/ui.js";
import { speak, sfx } from "../core/audio.js";
import { getState } from "../core/state.js";
import { TROPHIES } from "../data/trophies.js";
import { checkTrophies } from "../systems/trophies.js";

export default {
  id: "trophies",
  title: "Trofeje",
  render(view) {
    checkTrophies();
    const s = getState();
    const earned = TROPHIES.filter((t) => s.trophies[t.id]).length;
    view.append(
      h(
        "section",
        { class: "screen trophies", "data-testid": "screen-trophies" },
        h("div", { class: "card trophy-head" }, h("span", { class: "trophy-big", "aria-hidden": "true" }, "🏆"), h("span", { class: "segs trophy-segs", "aria-label": "Trofeje" }, TROPHIES.map((t) => h("i", { class: s.trophies[t.id] ? "on" : "" })))),
        h(
          "div",
          { class: "trophy-grid", "data-testid": "trophy-grid" },
          TROPHIES.map((t) =>
            h(
              "button",
              {
                class: `trophy${s.trophies[t.id] ? " earned" : ""}`,
                "data-testid": `trophy-${t.id}`,
                "data-earned": String(!!s.trophies[t.id]),
                "aria-label": t.name,
                onclick: () => {
                  sfx.tap();
                  speak(s.trophies[t.id] ? `${t.name}. Máš ju!` : `${t.name}. Túto trofej ešte nemáš.`);
                },
              },
              h("span", { class: "trophy-icon", "aria-hidden": "true" }, t.icon),
            ),
          ),
        ),
      ),
    );
    speak(earned ? "Tvoje trofeje. Ťukni na trofej a poviem ti, za čo je." : "Trofeje. Zatiaľ žiadna, ale čoskoro nejakú získaš!");
  },
};
