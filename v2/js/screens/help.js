// ❔ Help for the adult (DESIGN-v2 §15.2, part 20): a short explanation of the current screen in
// the game's language and a 👆 button that shows the child the next step with the demo hand.

import { h, modal, closeModal } from "../core/ui.js";
import { sfx } from "../core/audio.js";
import { on } from "../core/events.js";
import { HELP } from "../data/help.js";
import { hint } from "../core/hint.js";

let current = "home";
let open = false;

/** True while the help window is open: a race waits meanwhile. */
export const helpOpen = () => open;
on("screenShown", ({ id }) => (current = id));

/** The help text of a screen (for tests: every screen and game has one). */
export const helpFor = (id) => HELP[id] || null;

export function openHelp(id = current) {
  const def = helpFor(id);
  if (!def) return null;
  sfx.tap();
  open = true;
  return modal(
    [
      h("div", { class: "modal-icon", "aria-hidden": "true" }, def.icon),
      h("p", { class: "help-for" }, "Pre dospelého"),
      ...def.text.map((p) => h("p", { class: "help-text" }, p)),
      h(
        "div",
        { class: "modal-row" },
        h("button", { class: "btn ghost", "data-testid": "help-close", "aria-label": "Zavrieť", onclick: () => closeModal() }, "✖"),
        h(
          "button",
          {
            class: "btn grass",
            "data-testid": "help-show",
            "aria-label": "Ukáž dieťaťu",
            onclick: () => {
              closeModal();
              setTimeout(() => hint.show(), 350); // after the window is gone
            },
          },
          "👆 ",
          "Ukáž dieťaťu",
        ),
      ),
    ],
    { className: "help-modal", testId: "help-modal", onClose: () => (open = false) },
  );
}

/** The round ❔ button (top bar, games). */
export function helpButton(cls = "icon-btn") {
  return h("button", { class: `${cls} help-btn`, "data-testid": "help", "aria-label": "Pomoc", onclick: () => openHelp() }, "❓");
}
