// Track and level selection (DESIGN-v2 §4.1): six tracks, levels as stars,
// recommended power as a traffic light, best medal and the boss challenge bar.

import { h } from "../core/ui.js";
import { speak, sfx } from "../core/audio.js";
import { startGame } from "../core/router.js";
import { TRACKS, MEDALS, RACE } from "../data/tracks.js";
import { carStats, carPower, recommendedPower, difficulty } from "../systems/stats.js";
import { trackProgress, isTrackUnlocked, isLevelUnlocked, CHALLENGE_RACES } from "../systems/progress.js";
import { statPanel, powerBadge } from "./stat-panel.js";

const LIGHT = { green: "🟢", yellow: "🟡", red: "🔴" };
const LIGHT_SAY = {
  green: "Túto zvládneš!",
  yellow: "Toto bude ťažké.",
  red: "Na túto ešte potrebuješ silnejšie auto. Ale skúsiť môžeš!",
};

let selected = { track: "city", level: 1 };

export default {
  id: "races",
  title: "Preteky",
  render(view) {
    const power = carPower(carStats());
    if (!isTrackUnlocked(selected.track)) selected = { track: "city", level: 1 };
    if (!isLevelUnlocked(selected.track, selected.level)) selected.level = trackProgress(selected.track).unlocked;

    const trackGrid = h("div", { class: "track-grid", role: "listbox", "aria-label": "Trate" });
    const levelRow = h("div", { class: "level-row" });
    const challenge = h("div", { class: "challenge", "aria-label": "Pruh výziev k bossovi" });
    const startBtn = h(
      "button",
      {
        class: "btn big tomato start-btn",
        "data-testid": "race-start",
        "aria-label": "Štart",
        onclick: () => {
          sfx.tap();
          startGame("race", selected.track, selected.level);
        },
      },
      h("span", { class: "btn-icon", "aria-hidden": "true" }, "🏁"),
      h("span", { class: "btn-label" }, "Štart"),
    );

    function paintTracks() {
      trackGrid.replaceChildren(
        ...TRACKS.map((t) => {
          const open = isTrackUnlocked(t.id);
          const best = Object.values(trackProgress(t.id).best);
          const medal = best.length ? MEDALS[Math.min(...best) - 1] : "";
          return h(
            "button",
            {
              class: `track-card${t.id === selected.track ? " selected" : ""}${open ? "" : " locked"}`,
              style: { "--a": t.colors.ground, "--b": t.colors.road },
              role: "option",
              "aria-selected": String(t.id === selected.track),
              "aria-label": t.name,
              "data-testid": `track-${t.id}`,
              onclick: () => {
                if (!open) {
                  sfx.oops();
                  speak("Túto trať odomkneš medailou na predchádzajúcej trati.");
                  return;
                }
                sfx.tap();
                selected = { track: t.id, level: trackProgress(t.id).unlocked };
                paint();
                speak(`${t.name}. Vyber si úroveň.`);
              },
            },
            h("span", { class: "track-icon", "aria-hidden": "true" }, open ? t.icon : "🔒"),
            h("span", { class: "track-name" }, t.name),
            medal && h("span", { class: "track-medal", "aria-hidden": "true" }, medal),
          );
        }),
      );
    }

    function paintLevels() {
      const prog = trackProgress(selected.track);
      const buttons = [];
      for (let level = 1; level <= RACE.levels; level++) {
        const open = isLevelUnlocked(selected.track, level);
        const light = difficulty(power, recommendedPower(selected.track, level));
        const medal = prog.best[level] ? MEDALS[prog.best[level] - 1] : "";
        buttons.push(
          h(
            "button",
            {
              class: `level-btn${level === selected.level ? " selected" : ""}${open ? "" : " locked"}`,
              "data-testid": `level-${level}`,
              "data-light": light,
              "aria-label": `Úroveň ${level}`,
              onclick: () => {
                if (!open) {
                  sfx.oops();
                  speak("Túto úroveň odomkneš víťazstvom na nižšej úrovni.");
                  return;
                }
                sfx.tap();
                selected.level = level;
                paint();
                speak(LIGHT_SAY[light]);
              },
            },
            h("span", { class: "level-stars", "aria-hidden": "true" }, "⭐".repeat(level)),
            h("span", { class: "level-light", "aria-hidden": "true" }, open ? LIGHT[light] : "🔒"),
            h("span", { class: "level-medal", "aria-hidden": "true" }, medal),
          ),
        );
      }
      levelRow.replaceChildren(...buttons);

      const segs = [];
      for (let i = 0; i < CHALLENGE_RACES; i++) segs.push(h("i", { class: i < prog.challenge ? "on" : "" }));
      challenge.replaceChildren(h("span", { class: "challenge-segs" }, segs), h("span", { class: "challenge-boss locked", "aria-hidden": "true" }, "👑"));
    }

    function paint() {
      paintTracks();
      paintLevels();
    }
    paint();

    view.append(
      h(
        "section",
        { class: "screen races", "data-testid": "screen-races" },
        h("div", { class: "races-car card" }, powerBadge(power), statPanel(carStats())),
        h("div", { class: "races-main" }, trackGrid, h("div", { class: "card level-card" }, levelRow, challenge), startBtn),
      ),
    );
    speak("Preteky. Vyber si trať a ťukni na štart.");
  },
};
