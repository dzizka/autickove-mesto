// 🔤 Písmenká (DESIGN-v2 §12): first letters. Either a train brings a letter and the child picks
// the picture that starts with it, or a picture is shown and the child picks its first letter.

import { h } from "../../core/ui.js";
import { LETTERS } from "../../data/minigames.js";
import { miniDef, starsFor } from "../../systems/minigames.js";
import { createShell, createRounds, shake } from "../mini/shell.js";

const cap = (w) => w[0].toUpperCase() + w.slice(1);
let shell = null;

export default {
  id: "letters",
  title: "Písmenká",
  icon: "🔤",
  unlockLevel: miniDef("letters").unlockLevel,

  start(view, ctx) {
    shell = createShell(view, ctx, this);
    const sh = shell;
    const L = sh.level - 1;
    const pool = L === 0 ? LETTERS.words.filter((w) => LETTERS.easy.includes(w[0])) : LETTERS.words;
    const letters = [...new Set(pool.map((w) => w[0]))];
    const top = h("div", { class: "let-top", "data-testid": "let-top" });
    const opts = h("div", { class: "let-opts", "data-testid": "let-opts" });
    sh.stage.append(h("div", { class: "let-wrap" }, top, opts));
    const rounds = createRounds(sh, LETTERS.rounds, (misses) => {
      ctx.speak("Super! Poznáš písmenká.");
      sh.done(starsFor(misses, LETTERS.stars));
    });
    let last = null;
    let busy = false;

    function option(content, isRight, sayRight, sayWrong, data) {
      return h(
        "button",
        {
          class: "let-opt",
          ...data,
          onclick: (e) => {
            const btn = e.currentTarget;
            if (busy || sh.over) return;
            if (isRight) {
              busy = true;
              btn.classList.add("right");
              top.classList.add("solved");
              const blank = top.querySelector(".let-blank");
              if (blank) blank.textContent = sh.stage.dataset.answer;
              ctx.audio.sfx.coin();
              ctx.speak(sayRight);
              rounds.right(() => {
                busy = false;
                next();
              }, 1600);
            } else {
              rounds.wrong();
              ctx.audio.sfx.oops();
              shake(btn);
              ctx.speak(sayWrong);
            }
          },
        },
        content,
      );
    }

    function next() {
      if (sh.over) return;
      rounds.start();
      top.classList.remove("solved");
      let word;
      do word = ctx.rng.pick(pool);
      while (word === last && pool.length > 1);
      last = word;
      const [letter, pic, name] = word;
      const mode = ctx.rng.pick(LETTERS.modes[L]);
      sh.stage.dataset.answer = mode === "pick" ? name : letter;
      if (mode === "pick") {
        // a train brings the letter; which picture starts with it?
        top.replaceChildren(h("div", { class: "let-train", "aria-hidden": "true" }, h("span", { class: "loco" }, "🚂"), h("span", { class: "wagon" }, letter)));
        const others = ctx.rng.shuffle(letters.filter((l) => l !== letter)).slice(0, LETTERS.options[L] - 1).map((l) => ctx.rng.pick(pool.filter((w) => w[0] === l)));
        opts.replaceChildren(
          ...ctx.rng.shuffle([word, ...others]).map((w) =>
            option(h("span", { class: "let-pic" }, w[1]), w === word, `Áno! ${cap(w[2])} sa začína na ${letter}.`, `To je ${w[2]}. Skús ešte raz.`, { "data-word": w[2], "aria-label": w[2] }),
          ),
        );
        ctx.speak(`Ktorý obrázok sa začína na písmeno ${letter}?`);
      } else {
        // a picture and its word without the first letter; which letter is missing?
        top.replaceChildren(h("div", { class: "let-big", "aria-hidden": "true" }, pic), h("div", { class: "let-word", "aria-hidden": "true" }, h("b", { class: "let-blank" }, "?"), name.slice(1).toUpperCase()));
        const others = ctx.rng.shuffle(letters.filter((l) => l !== letter)).slice(0, LETTERS.options[L] - 1);
        opts.replaceChildren(
          ...ctx.rng.shuffle([letter, ...others]).map((l) =>
            option(h("span", { class: "let-letter" }, l), l === letter, `Áno! ${letter}, ${name}.`, "Skús ešte raz.", { "data-letter": l, "aria-label": l }),
          ),
        );
        ctx.speak(`${cap(name)}. Na aké písmeno sa začína?`);
      }
    }
    next();
  },

  stop() {
    shell?.stop();
    shell = null;
  },
};
