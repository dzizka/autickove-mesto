// Colouring book game module (DESIGN-v2 §7): #/game/coloring/free/<id> or #/game/coloring/number/<id>.
// Both modes end with ctx.finish({ coins, xp, extra: { coloring: { id, mode, thumb } } });
// the host credits coins, saves the picture to the gallery and hands out glitter and stickers.

import { freePicture, pixelPicture, isFreeUnlocked } from "../../systems/coloring.js";
import { FREE_PICTURES } from "../../data/coloring/free.js";
import { PIXEL_PICTURES } from "../../data/coloring/pixel.js";
import { startFreePaint } from "./free-paint.js";
import { startByNumber } from "./by-number.js";

let cleanup = [];

export default {
  id: "coloring",
  title: "Omaľovánka",
  icon: "🖍️",
  unlockLevel: 1,

  start(view, ctx) {
    const [mode, id] = ctx.params;
    cleanup = [];
    if (mode === "number") {
      startByNumber(view, ctx, pixelPicture(id) || PIXEL_PICTURES[0], cleanup);
    } else {
      const pic = freePicture(id);
      startFreePaint(view, ctx, pic && isFreeUnlocked(pic) ? pic : FREE_PICTURES[0], cleanup);
    }
  },

  stop() {
    cleanup.forEach((fn) => fn());
    cleanup = [];
    if (window.__game) window.__game.byNumber = null;
  },
};
