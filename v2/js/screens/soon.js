// Placeholder screen for pillars that are not built yet (DESIGN-v2 §9).

import { h } from "../core/ui.js";
import { speak, sfx } from "../core/audio.js";
import { goHome } from "../core/router.js";

export function makeSoonScreen({ id, icon, label }) {
  return {
    id,
    title: label,
    render(view) {
      const say = `${label}. Toto sa ešte stavia. Čoskoro to bude hotové!`;
      view.append(
        h(
          "section",
          { class: "screen soon", "data-testid": `screen-${id}` },
          h("div", { class: "soon-icon", "aria-hidden": "true" }, icon),
          h("div", { class: "soon-cones", "aria-hidden": "true" }, "🚧👷🚧"),
          h("h1", { class: "screen-title" }, label),
          h(
            "button",
            {
              class: "btn big sun",
              "data-testid": "back-home",
              "aria-label": "Domov",
              onclick: () => {
                sfx.back();
                goHome();
              },
            },
            h("span", { class: "btn-icon", "aria-hidden": "true" }, "🏠"),
            h("span", { class: "btn-label" }, "Domov"),
          ),
        ),
      );
      speak(say);
    },
  };
}
