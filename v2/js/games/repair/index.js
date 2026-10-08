// 🔧 Servis (DESIGN-v2 §12): something is wrong with the child's car. The voice says what,
// a mark shows where, and the child picks the right tool. Then the car drives off.

import { h } from "../../core/ui.js";
import { REPAIR } from "../../data/minigames.js";
import { miniDef, starsFor } from "../../systems/minigames.js";
import { getLook, resolveLook } from "../../systems/tuning.js";
import { carSidePic } from "../../render/car-side.js";
import { createShell, shake } from "../mini/shell.js";
import { t } from "../../core/i18n.js";

/** Where a problem shows on the side view (viewBox 240 × 124). */
function spot(side, at) {
  const w = side.wheels;
  switch (at) {
    case "rearWheel":
      return [w[0], side.wheelY];
    case "frontWheel":
      return [w[w.length - 1], side.wheelY];
    case "front":
      return side.front;
    case "back":
      return side.back;
    case "engine":
      return [side.front[0] - 30, side.front[1] - 6];
    case "roof":
      return [side.roof[0], side.roof[1] + 8];
    default:
      return side.sticker;
  }
}

let shell = null;

export default {
  id: "repair",
  title: "Servis",
  icon: "🔧",
  unlockLevel: miniDef("repair").unlockLevel,

  start(view, ctx) {
    shell = createShell(view, ctx, this);
    const sh = shell;
    const L = sh.level - 1;
    const look = getLook();
    const side = resolveLook(look).car.side;
    const problems = ctx.rng.shuffle(REPAIR.list).slice(0, REPAIR.problems[L]);
    const marks = h("div", { class: "rep-marks" });
    const carEl = carSidePic(look);
    const car = h("div", { class: "rep-car" }, carEl, marks);
    // the 3D car's picture knows where its own wheels, lights and roof are
    const place = (mark, at) => {
      const [x, y] = spot(carEl.geometry || side, at);
      Object.assign(mark.style, { left: `${(x / 240) * 100}%`, top: `${(y / 124) * 100}%` });
    };
    carEl.picReady.then(() => {
      const mark = marks.firstElementChild;
      if (mark) place(mark, mark.dataset.at);
    });
    const tools = h("div", { class: "rep-tools", "data-testid": "rep-tools" });
    sh.stage.append(h("div", { class: "rep-wrap" }, h("div", { class: "rep-lift" }, car), tools));
    let step = 0;
    let mistakes = 0;

    function next() {
      if (sh.over) return;
      sh.progress(step / problems.length);
      if (step >= problems.length) {
        tools.replaceChildren();
        marks.replaceChildren();
        car.classList.add("drive-off");
        ctx.audio.playNotes([[392, 0.12, "square"], [523, 0.12, "square"], [659, 0.12, "square"], [784, 0.25, "square"]]);
        ctx.speak("Auto je opravené! Ide na skúšobnú jazdu.");
        sh.later(() => sh.done(starsFor(mistakes, REPAIR.stars)), 1800);
        return;
      }
      const p = problems[step];
      const mark = h("span", { class: "rep-mark", "data-testid": "rep-mark", "data-at": p.at }, p.mark, h("i", {}, "!"));
      place(mark, p.at);
      marks.replaceChildren(mark);
      sh.stage.dataset.need = p.tool;
      const others = ctx.rng.shuffle(REPAIR.list.map((q) => q.tool).filter((t) => t !== p.tool)).slice(0, REPAIR.choices[L] - 1);
      tools.replaceChildren(
        ...ctx.rng.shuffle([p.tool, ...others]).map((t) =>
          h(
            "button",
            {
              class: "rep-tool",
              "data-tool": t,
              "aria-label": "Nástroj",
              onclick: (e) => {
                const btn = e.currentTarget;
                if (sh.over || btn.disabled) return;
                if (t === p.tool) {
                  tools.querySelectorAll("button").forEach((b) => (b.disabled = true));
                  btn.classList.add("use");
                  mark.replaceChildren("✨");
                  mark.classList.add("fixed");
                  ctx.audio.sfx.coin();
                  step++;
                  sh.later(next, 900);
                } else {
                  mistakes++;
                  ctx.audio.sfx.oops();
                  shake(btn);
                  ctx.speak("To nie je ono. Skús iný nástroj.");
                }
              },
            },
            t,
          ),
        ),
      );
      ctx.speak(`${t(p.say)} ${t("Čo potrebuješ?")}`);
    }
    next();
  },

  stop() {
    shell?.stop();
    shell = null;
  },
};
