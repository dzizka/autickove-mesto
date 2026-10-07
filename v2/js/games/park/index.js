// 🅿️ Parkovisko (DESIGN-v2 §12): drag each car to the free spot of the same colour
// (or, later, with the same number of dots). Tapping the car and then the spot works too.

import { h } from "../../core/ui.js";
import { PARK } from "../../data/minigames.js";
import { miniDef, starsFor } from "../../systems/minigames.js";
import { colorLook } from "../../systems/tuning.js";
import { carSide } from "../../render/car-side.js";
import { createShell, shake } from "../mini/shell.js";

const KINDS = ["sedan", "jeep", "taxi", "police"];
const dots = (n) => h("span", { class: "park-dots", "aria-hidden": "true" }, Array.from({ length: n }, () => h("i")));

let shell = null;
let cleanup = [];

export default {
  id: "park",
  title: "Parkovisko",
  icon: "🅿️",
  unlockLevel: miniDef("park").unlockLevel,

  start(view, ctx) {
    shell = createShell(view, ctx, this);
    const sh = shell;
    const L = sh.level - 1;
    const lot = h("div", { class: "park-lot", "data-testid": "park-lot" });
    const queue = h("div", { class: "park-queue", "data-testid": "park-queue" });
    sh.stage.append(h("div", { class: "park-wrap" }, lot, queue));
    let wave = 0;
    let mistakes = 0;
    let left = 0;
    let count = 0;
    let selected = null;
    let drag = null;

    const select = (car) => {
      selected?.classList.remove("sel");
      selected = car;
      car?.classList.add("sel");
    };

    function place(car, spot) {
      if (spot.classList.contains("full") || sh.over) return;
      if (spot.dataset.key !== car.dataset.key) {
        mistakes++;
        ctx.audio.sfx.oops();
        shake(spot);
        ctx.speak(car.dataset.mode === "dots" ? "Spočítaj bodky a skús iné miesto." : "Toto miesto má inú farbu.");
        return;
      }
      spot.classList.add("full");
      spot.replaceChildren(car.querySelector("svg"));
      car.remove();
      select(null);
      ctx.audio.sfx.coin();
      left--;
      sh.progress((wave - 1 + (count - left) / count) / PARK.waves);
      if (!left) sh.later(nextWave, 900);
    }

    function nextWave() {
      if (sh.over) return;
      if (wave >= PARK.waves) {
        ctx.speak("Všetky autá sú zaparkované!");
        sh.done(starsFor(mistakes, PARK.stars));
        return;
      }
      wave++;
      count = left = PARK.cars[L];
      const byDots = sh.level >= PARK.dotsFromLevel && wave > 1;
      let pairs;
      if (byDots) {
        const ns = ctx.rng.shuffle([1, 2, 3, 4, 5]).slice(0, count);
        pairs = ns.map((n) => ({ key: `d${n}`, n, hex: ctx.rng.pick(PARK.colors).hex }));
      } else {
        pairs = ctx.rng.shuffle(PARK.colors).slice(0, count).map((c) => ({ key: c.hex, hex: c.hex, n: 0 }));
      }
      lot.style.setProperty("--n", String(count));
      lot.replaceChildren(
        ...ctx.rng.shuffle(pairs).map((p) =>
          h(
            "button",
            { class: `park-spot${byDots ? " dots" : ""}`, "data-key": p.key, "aria-label": "Parkovacie miesto", style: byDots ? {} : { "--spot": p.hex }, onclick: (e) => (selected ? place(selected, e.currentTarget) : ctx.speak("Najprv ťukni na auto.")) },
            byDots ? dots(p.n) : h("span", { class: "park-p", "aria-hidden": "true" }, "P"),
          ),
        ),
      );
      queue.replaceChildren(
        ...ctx.rng.shuffle(pairs).map((p) => {
          const car = h("button", { class: "park-car", "data-key": p.key, "data-mode": byDots ? "dots" : "color", "aria-label": "Auto" }, carSide({ ...colorLook(p.hex), car: ctx.rng.pick(KINDS) }), byDots ? dots(p.n) : null);
          car.addEventListener("pointerdown", (e) => startDrag(e, car));
          return car;
        }),
      );
      ctx.speak(byDots ? "Zaparkuj každé auto tam, kde je rovnako veľa bodiek." : wave === 1 ? "Potiahni každé auto na miesto s rovnakou farbou." : "Ďalšie autá prichádzajú!");
    }

    function startDrag(e, car) {
      if (sh.over) return;
      ctx.audio.sfx.tap();
      select(car);
      drag = { car, id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false };
      car.setPointerCapture?.(e.pointerId);
    }
    const move = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x0;
      const dy = e.clientY - drag.y0;
      if (Math.hypot(dx, dy) > 10) drag.moved = true;
      if (drag.moved) {
        drag.car.classList.add("drag");
        drag.car.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`;
      }
    };
    const up = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const { car, moved } = drag;
      drag = null;
      car.classList.remove("drag");
      car.style.transform = "";
      if (!moved) return; // a tap keeps the car selected for a tap on a spot
      const spot = [...lot.children].find((s) => {
        const r = s.getBoundingClientRect();
        return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      });
      if (spot) place(car, spot);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    cleanup = [() => window.removeEventListener("pointermove", move), () => window.removeEventListener("pointerup", up), () => window.removeEventListener("pointercancel", up)];
    nextWave();
  },

  stop() {
    cleanup.forEach((fn) => fn());
    cleanup = [];
    shell?.stop();
    shell = null;
  },
};
