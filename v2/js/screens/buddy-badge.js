// The buddy rides along as a co-driver badge next to the car (play-test: the buddy painted on the
// car looked like a sticker that could not be removed). Face + the icon of what it adds; a tap
// opens the crew. With nobody in the seat it shows an empty seat 💺.

import { h } from "../core/ui.js";
import { sfx } from "../core/audio.js";
import { go } from "../core/router.js";
import { crewDef, activeBuddy } from "../systems/crew.js";
import { abilityIcon, buddyFace } from "./crew.js";

/** A round badge. opts.small for the race HUD; opts.link = false keeps it from opening the crew. */
export function buddyBadge({ small = false, link = true } = {}) {
  const b = activeBuddy();
  const def = b && crewDef(b.id);
  const el = h(
    link ? "button" : "div",
    {
      class: `buddy-badge${small ? " small" : ""}${def ? "" : " empty"}`,
      "data-testid": "buddy-badge",
      "data-buddy": def ? def.id : "",
      "aria-label": def ? def.name : "Kamaráti",
      onclick: link ? () => (sfx.tap(), go("crew")) : null,
    },
    def ? buddyFace(b) : h("span", { class: "bf-icon", "aria-hidden": "true" }, "💺"),
    def && h("span", { class: "buddy-badge-ab", "aria-hidden": "true" }, abilityIcon(def)),
  );
  return el;
}
