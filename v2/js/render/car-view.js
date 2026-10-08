// The car as 3D (part 15a) with the 2D drawing as a safe fallback. The 2D car shows at once;
// the 3D car replaces it when three.js, WebGL and the model are ready. Without WebGL (old
// tablet, broken driver, lost context) the game simply keeps the 2D car.

import { carSide } from "./car-side.js";
import { resolveLook } from "../systems/tuning.js";
import { hasWebGL } from "./car-pics.js";

export { hasWebGL };

const LOOK_KEYS = ["car", "color", "pattern", "wheels", "wing", "sticker", "roof", "neon", "trail"];

// what the car turns to when a tuning category changes: back, side or front corner
const FACING = { wing: Math.PI, trail: Math.PI, sticker: Math.PI / 2, wheels: Math.PI / 2, pattern: Math.PI / 2, roof: 0.7, neon: 0.7, color: 0.7, car: 0.7 };

const lookKey = (r, opts) => [...LOOK_KEYS.map((k) => r[k].id), opts.colorHex || "", opts.passenger || "", opts.trail ? 1 : 0].join("|");

/**
 * A car on a turntable (showroom) or a lift (garage).
 * Returns { el, setLook(look, { passenger, trail }), focus(category), destroy() }.
 */
export function createCarView({ mode = "turntable" } = {}) {
  const el = document.createElement("div");
  el.className = "car-view";
  el.dataset.stand = mode;
  el.dataset.testid = "car-view";
  el.dataset.mode = "2d";
  const flat = document.createElement("div");
  flat.className = "car-flat";
  el.append(flat);

  let stage = null;
  let dead = false;
  let pending = null; // the newest look while three.js is still loading
  let shownKey = "";
  let timer = 0;
  let lastShow = 0;
  const SETTLE_MS = 150; // fast taps through the tiles build only the car the child stops at

  const show = (r, opts) => {
    const key = lookKey(r, opts);
    if (key === shownKey) return;
    shownKey = key;
    stage.show(r, opts).catch((err) => {
      console.warn("[car-view] 3D car failed, keeping the 2D car", err);
      shownKey = "";
    });
  };

  if (hasWebGL()) {
    import("./three/stage.js")
      .then(({ createStage }) => {
        if (dead) return;
        stage = createStage(el, {
          mode,
          onReady: () => (el.dataset.mode = "3d"),
          onLost: () => (el.dataset.mode = "2d"),
        });
        if (pending) show(...pending);
      })
      .catch((err) => console.warn("[car-view] three.js could not load, keeping the 2D car", err));
  }

  return {
    el,
    setLook(look, { passenger = null, trail = false } = {}) {
      const r = resolveLook(look);
      for (const k of LOOK_KEYS) el.dataset[k] = r[k].id;
      if (passenger) el.dataset.passenger = passenger;
      else delete el.dataset.passenger;
      flat.replaceChildren(carSide(look, { passenger, trail }));
      pending = [r, { passenger, trail, colorHex: look.colorHex || null }];
      if (!stage) return;
      clearTimeout(timer);
      const now = performance.now();
      if (now - lastShow > SETTLE_MS) show(...pending); // the first tap shows at once
      else timer = setTimeout(() => !dead && show(...pending), SETTLE_MS);
      lastShow = now;
    },
    pause(on) {
      stage?.pause(on);
    },
    /** Turn the 3D car to show this tuning category. */
    focus(cat) {
      if (cat in FACING) stage?.face(FACING[cat]);
    },
    destroy() {
      dead = true;
      clearTimeout(timer);
      stage?.destroy();
      stage = null;
    },
  };
}
