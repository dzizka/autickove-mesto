// 🔢 Počítanie (DESIGN-v2 §12): count the things and tap the right number. Tapping a thing
// counts it aloud ("jeden, dva, tri…"), so the child can count along. Level 3 adds a + b.

import { h } from "../../core/ui.js";
import { COUNT, NUMBER_WORDS } from "../../data/minigames.js";
import { miniDef, starsFor } from "../../systems/minigames.js";
import { createShell, createRounds, shake, dotsEl } from "../mini/shell.js";

let shell = null;

export default {
  id: "count",
  title: "Počítanie",
  icon: "🔢",
  unlockLevel: miniDef("count").unlockLevel,

  start(view, ctx) {
    shell = createShell(view, ctx, this);
    const sh = shell;
    const L = sh.level - 1;
    const scene = h("div", { class: "count-scene", "data-testid": "count-scene" });
    const answers = h("div", { class: "count-answers", "data-testid": "count-answers" });
    sh.stage.append(h("div", { class: "count-wrap" }, scene, answers));
    const rounds = createRounds(sh, COUNT.rounds, (misses) => {
      ctx.speak("Výborne, vieš počítať!");
      sh.done(starsFor(misses, COUNT.stars));
    });

    function group(icon, n) {
      let counted = 0;
      return h(
        "div",
        { class: "count-group" },
        Array.from({ length: n }, (_, i) =>
          h(
            "button",
            {
              class: "count-item",
              "aria-label": "Vec",
              style: { animationDelay: `${i * 0.05}s` },
              onclick: (e) => {
                const el = e.currentTarget;
                if (el.classList.contains("counted")) return;
                el.classList.add("counted");
                counted++;
                ctx.audio.tone(500 + counted * 40, 0.08, { type: "triangle", volume: 0.12 });
                ctx.speak(NUMBER_WORDS[counted] || String(counted));
              },
            },
            icon,
          ),
        ),
      );
    }

    function next() {
      if (sh.over) return;
      rounds.start();
      const icon = ctx.rng.pick(COUNT.items);
      const sum = ctx.rng.random() < COUNT.sumChance[L];
      let answer;
      if (sum) {
        const a = ctx.rng.int(1, 5);
        const b = ctx.rng.int(1, Math.min(5, COUNT.max[L] - a));
        answer = a + b;
        scene.replaceChildren(group(icon, a), h("span", { class: "count-plus", "aria-hidden": "true" }, "+"), group(icon, b));
        ctx.speak("Koľko ich je spolu?");
      } else {
        answer = ctx.rng.int(1, COUNT.max[L]);
        scene.replaceChildren(group(icon, answer));
        ctx.speak("Koľko ich je? Môžeš na ne ťukať a počítať.");
      }
      scene.dataset.answer = String(answer);
      const opts = new Set([answer]);
      while (opts.size < COUNT.options[L]) {
        const c = answer + ctx.rng.int(-3, 3);
        if (c >= 1 && c <= Math.max(COUNT.max[L], answer + 2)) opts.add(c);
      }
      answers.replaceChildren(
        ...ctx.rng.shuffle([...opts]).map((n) =>
          h(
            "button",
            {
              class: "count-answer",
              "data-n": String(n),
              "aria-label": NUMBER_WORDS[n] || String(n),
              onclick: (e) => {
                const btn = e.currentTarget;
                if (sh.over || answers.dataset.busy === "1") return;
                if (n === answer) {
                  answers.dataset.busy = "1";
                  btn.classList.add("right");
                  ctx.audio.sfx.coin();
                  ctx.speak(`Áno! ${NUMBER_WORDS[n] || n}.`);
                  rounds.right(() => {
                    answers.dataset.busy = "";
                    next();
                  }, 1100);
                } else {
                  rounds.wrong();
                  ctx.audio.sfx.oops();
                  shake(btn);
                  ctx.speak("Skús ešte raz.");
                }
              },
            },
            h("b", {}, String(n)),
            dotsEl(n),
          ),
        ),
      );
    }
    next();
  },

  stop() {
    shell?.stop();
    shell = null;
  },
};
