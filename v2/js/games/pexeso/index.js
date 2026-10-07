// 🃏 Pexeso (DESIGN-v2 §12): turn two cards, find the pairs. Easier levels show all cards first.

import { h } from "../../core/ui.js";
import { PEXESO } from "../../data/minigames.js";
import { miniDef, starsFor } from "../../systems/minigames.js";
import { createShell } from "../mini/shell.js";

let shell = null;

export default {
  id: "pexeso",
  title: "Pexeso",
  icon: "🃏",
  unlockLevel: miniDef("pexeso").unlockLevel,

  start(view, ctx) {
    shell = createShell(view, ctx, this);
    const sh = shell;
    const L = sh.level - 1;
    const pairs = PEXESO.pairs[L];
    const pics = ctx.rng.shuffle(PEXESO.pictures).slice(0, pairs);
    const deck = ctx.rng.shuffle([...pics.keys(), ...pics.keys()]);
    let open = [];
    let lock = false;
    let mistakes = 0;
    let found = 0;

    const cards = deck.map((k, i) =>
      h(
        "button",
        { class: "pex-card", "data-testid": `card-${i}`, "data-pic": String(k), "aria-label": "Kartička", onclick: () => flip(i) },
        h("span", { class: "pex-back", "aria-hidden": "true" }, "🏁"),
        h("span", { class: "pex-face", "aria-hidden": "true" }, pics[k]),
      ),
    );
    const grid = h("div", { class: "pex-grid", style: { "--cols": PEXESO.columns[L] }, "data-testid": "pex-grid" }, cards);
    sh.stage.append(grid);

    function flip(i) {
      const card = cards[i];
      if (lock || sh.over || card.classList.contains("up")) return;
      card.classList.add("up");
      ctx.audio.sfx.tap();
      open.push(i);
      if (open.length < 2) return;
      const [a, b] = open;
      open = [];
      if (deck[a] === deck[b]) {
        found++;
        sh.progress(found / pairs);
        sh.later(() => {
          cards[a].classList.add("done");
          cards[b].classList.add("done");
          ctx.audio.sfx.coin();
        }, 250);
        if (found === pairs) {
          sh.later(() => {
            ctx.speak("Našiel si všetky dvojice!");
            sh.done(starsFor(mistakes, PEXESO.stars.map((f) => Math.round(pairs * f))));
          }, 900);
        } else if (found === 1) ctx.speak("Dvojica! Hľadaj ďalšie.", { interrupt: false });
      } else {
        mistakes++;
        lock = true;
        sh.later(() => {
          cards[a].classList.remove("up");
          cards[b].classList.remove("up");
          lock = false;
        }, PEXESO.showMs);
      }
    }

    // easy levels: show everything for a moment first
    const peek = PEXESO.peekMs[L];
    if (peek > 0) {
      lock = true;
      cards.forEach((c) => c.classList.add("up"));
      sh.later(() => {
        cards.forEach((c) => c.classList.remove("up"));
        lock = false;
      }, peek);
    }
    ctx.speak("Nájdi dvojice rovnakých obrázkov.");
    if (window.__game) window.__game.mini = { ready: () => !lock };
  },

  stop() {
    shell?.stop();
    shell = null;
    if (window.__game) window.__game.mini = null;
  },
};
