// 🎵 Hudobná garáž (DESIGN-v2 §12): four cars honk a melody, the child honks it back.
// Every success makes the melody one note longer; a mistake just plays it again.

import { h } from "../../core/ui.js";
import { MUSIC } from "../../data/minigames.js";
import { miniDef, starsFor } from "../../systems/minigames.js";
import { colorLook } from "../../systems/tuning.js";
import { carSide } from "../../render/car-side.js";
import { createShell, shake } from "../mini/shell.js";

let shell = null;

export default {
  id: "music",
  title: "Hudobná garáž",
  icon: "🎵",
  unlockLevel: miniDef("music").unlockLevel,

  start(view, ctx) {
    shell = createShell(view, ctx, this);
    const sh = shell;
    const L = sh.level - 1;
    const goal = MUSIC.goal[L];
    const melody = Array.from({ length: MUSIC.start[L] }, () => ctx.rng.int(0, MUSIC.cars.length - 1));
    let pos = 0;
    let busy = true;
    let mistakes = 0;

    const sign = h("div", { class: "mus-sign", "data-testid": "mus-sign", "aria-hidden": "true" }, "👂");
    const cars = MUSIC.cars.map((c, i) =>
      h(
        "button",
        { class: "mus-car", "data-i": String(i), "aria-label": "Auto", style: { "--mc": c.hex }, onclick: () => press(i) },
        h("span", { class: "mus-note", "aria-hidden": "true" }, "🎵"),
        carSide({ ...colorLook(c.hex), car: ["sedan", "jeep", "taxi", "police"][i] }),
      ),
    );
    sh.stage.append(h("div", { class: "mus-wrap" }, sign, h("div", { class: "mus-cars" }, cars)));

    function honk(i) {
      const car = cars[i];
      car.classList.remove("on");
      void car.offsetWidth;
      car.classList.add("on");
      ctx.audio.tone(MUSIC.cars[i].note, 0.32, { type: "square", volume: 0.1 });
      sh.later(() => car.classList.remove("on"), 330);
    }

    function play() {
      busy = true;
      pos = 0;
      sign.textContent = "👂";
      sh.stage.dataset.melody = melody.join(",");
      melody.forEach((n, i) => sh.later(() => honk(n), 600 + i * MUSIC.gap[L]));
      sh.later(() => {
        busy = false;
        sign.textContent = "👆";
        sh.stage.dataset.turn = "child";
        ctx.speak("Teraz ty!");
      }, 600 + melody.length * MUSIC.gap[L]);
      sh.stage.dataset.turn = "cars";
    }

    function press(i) {
      if (busy || sh.over) return;
      honk(i);
      if (melody[pos] === i) {
        pos++;
        if (pos < melody.length) return;
        busy = true;
        sh.progress((melody.length - MUSIC.start[L] + 1) / (goal - MUSIC.start[L] + 1));
        if (melody.length >= goal) {
          sign.textContent = "🎉";
          ctx.audio.sfx.win();
          ctx.speak("Bravo! Zahral si celú pesničku!");
          sh.later(() => sh.done(starsFor(mistakes, MUSIC.stars)), 1300);
          return;
        }
        sign.textContent = "⭐";
        sh.later(() => ctx.audio.sfx.coin(), 350);
        ctx.speak("Výborne! Teraz bude dlhšia.", { interrupt: false });
        melody.push(ctx.rng.int(0, MUSIC.cars.length - 1));
        sh.later(play, 1500);
      } else {
        mistakes++;
        busy = true;
        shake(cars[i]);
        ctx.audio.sfx.oops();
        ctx.speak("Ups! Počúvaj ešte raz.");
        sh.later(play, 1500);
      }
    }

    ctx.speak("Autíčka zahrajú melódiu. Počúvaj a pozeraj, potom ju zatrúb po nich.");
    sh.later(play, 2600);
  },

  stop() {
    shell?.stop();
    shell = null;
  },
};
