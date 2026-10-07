// Home screen: the child's car on a stage and big buttons for the four pillars.

import { h, bigButton, flyCoins } from "../core/ui.js";
import { speak, sfx } from "../core/audio.js";
import * as rng from "../core/rng.js";
import { getState } from "../core/state.js";
import { questDef, isDone, claimQuest, ensureQuests } from "../systems/quests.js";
import { go } from "../core/router.js";
import { carSide } from "../render/car-side.js";
import { activeBuddy, buddyLook } from "../systems/crew.js";
import { getLook, resolveLook } from "../systems/tuning.js";
import { playNotes } from "../core/audio.js";
import { PILLARS } from "../data/menu.js";
import { showDailyGift } from "./daily.js";
import { dailyReady } from "../systems/daily.js";

let greeted = false;

export default {
  id: "home",
  title: "Domov",
  render(view) {
    const look = getLook();
    const car = carSide(look, { trail: look.trail !== "none", passenger: buddyLook(activeBuddy())?.icon });
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

    // quests (DESIGN-v2 §8): tap to hear the task, tap the 🎁 to take the reward
    ensureQuests(rng);
    const quests = h("div", { class: "home-quests", "data-testid": "quests" });
    const paintQuests = () => {
      quests.replaceChildren(
        ...getState().quests.active.map((q) => {
          const def = questDef(q.id);
          const done = isDone(q);
          const segs = Math.min(5, def.target);
          const lit = Math.floor((q.progress / def.target) * segs);
          return h(
            "button",
            {
              class: `quest${done ? " done" : ""}`,
              "data-testid": `quest-${q.id}`,
              "data-done": String(done),
              "aria-label": def.say,
              onclick: (e) => {
                if (!done) {
                  sfx.tap();
                  speak(def.say);
                  return;
                }
                const from = e.currentTarget;
                const reward = claimQuest(q.id, rng);
                if (!reward) return;
                sfx.win();
                flyCoins(from, reward.coins / 10);
                speak("Úloha splnená! Tu je odmena.");
                paintQuests();
              },
            },
            h("span", { class: "quest-icon", "aria-hidden": "true" }, done ? "🎁" : def.icon),
            h("span", { class: "segs quest-segs" }, Array.from({ length: segs }, (_, i) => h("i", { class: i < lit || done ? "on" : "" }))),
          );
        }),
        h("button", { class: "quest trophy-btn", "data-testid": "open-trophies", "aria-label": "Trofeje", onclick: () => (sfx.tap(), go("trophies")) }, h("span", { class: "quest-icon", "aria-hidden": "true" }, "🏆")),
      );
    };
    paintQuests();

    view.append(
      h(
        "section",
        { class: "screen home", "data-testid": "screen-home" },
        stage,
        h("div", { class: "home-side" }, h("div", { class: "home-grid" }, buttons), quests),
      ),
    );

    if (dailyReady()) {
      // once a day: the gift first, the greeting after it
      greeted = true;
      setTimeout(() => document.querySelector("[data-testid=screen-home]") && showDailyGift({ onDone: () => speak("Vyber si, čo chceš robiť.") }), 400);
      return;
    }
    if (!greeted) {
      greeted = true;
      speak("Ahoj! Vyber si, čo chceš robiť.");
    }
    if (getState().quests.active.some(isDone)) speak("Máš splnenú úlohu! Ťukni na darček.", { interrupt: false });
  },
};
