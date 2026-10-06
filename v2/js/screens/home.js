// Home screen: the child's car on a stage and big buttons for the four pillars.

import { h, bigButton } from "../core/ui.js";
import { speak } from "../core/audio.js";
import { go } from "../core/router.js";
import { carSide } from "../render/car-side.js";
import { getLook, resolveLook } from "../systems/tuning.js";
import { playNotes } from "../core/audio.js";
import { PILLARS } from "../data/menu.js";

let greeted = false;

export default {
  id: "home",
  title: "Domov",
  render(view) {
    const look = getLook();
    const car = carSide(look, { trail: look.trail !== "none" });
    const stage = h(
      "button",
      {
        class: "home-stage",
        "data-testid": "home-car",
        "aria-label": "Tvoje auto, trúbiť",
        onclick: () => {
          playNotes(resolveLook(look).horn.notes);
          stage.classList.remove("hop");
          void stage.offsetWidth; // restart the hop animation
          stage.classList.add("hop");
        },
      },
      h("div", { class: "stage-light", "aria-hidden": "true" }),
      car,
    );

    const buttons = PILLARS.map((p) =>
      bigButton({
        icon: p.icon,
        label: p.label,
        say: p.say,
        color: p.color,
        testId: `home-${p.id}`,
        onClick: () => go(p.id),
      }),
    );

    view.append(
      h(
        "section",
        { class: "screen home", "data-testid": "screen-home" },
        stage,
        h("div", { class: "home-grid" }, buttons),
      ),
    );

    if (!greeted) {
      greeted = true;
      speak("Ahoj! Vyber si, čo chceš robiť.");
    }
  },
};
