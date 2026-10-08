// Pictures of the 3D cars for the whole game (part 15b, DESIGN-v2 §14): the same Car Kit
// model seen from the side (home, games, town), from behind (races) and from the top (maze,
// crossing). Pictures are made in the background and cached; until one is ready, and on
// devices without WebGL, the old 2D drawing is used, so nothing ever waits for 3D.

import "../core/state.js"; // first: state and tuning import each other (see core/state.js)
import { resolveLook } from "../systems/tuning.js";

const LOOK_KEYS = ["car", "color", "pattern", "wheels", "wing", "sticker", "roof", "neon", "trail"];
const MAX_PICS = 160;

let webgl = null;
/** True when the browser can draw WebGL. Tests and the parents' switch can turn 3D off. */
export function hasWebGL() {
  if (window.__game?.no3d) return false;
  if (webgl === null) {
    try {
      // a GPU that only draws in software (old laptops, blocked drivers) would make 3D slow:
      // then the game keeps its 2D cars. Automated tests run with software WebGL on purpose.
      const opts = navigator.webdriver ? {} : { failIfMajorPerformanceCaveat: true };
      const cv = document.createElement("canvas");
      const gl = cv.getContext("webgl2", opts) || cv.getContext("webgl", opts);
      webgl = !!gl;
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      webgl = false;
    }
  }
  return webgl;
}

/** Cache key of a look (tuning ids or { colorHex, car }) plus picture options. */
export function lookKey(look = {}, opts = {}) {
  const r = resolveLook(look);
  return [...LOOK_KEYS.map((k) => r[k].id), look.colorHex || "", opts.passenger || ""].join("|");
}

const pics = new Map(); // key → { ready, img, meta, w, h, promise, scaled: Map }

// pictures that can wait (cars seen a little from the side) are made one by one with pauses,
// so a race keeps running smoothly while they are made
let later = Promise.resolve();
const LATER_GAP_MS = 150;
const pause = () => new Promise((r) => (window.requestIdleCallback ? requestIdleCallback(() => r(), { timeout: 600 }) : setTimeout(r, LATER_GAP_MS)));

function remember(key, make, lazy = false) {
  let e = pics.get(key);
  if (e) return e;
  e = { ready: false, img: null, meta: null, scaled: new Map(), promise: null };
  pics.set(key, e);
  if (pics.size > MAX_PICS) pics.delete(pics.keys().next().value);
  let start = make;
  if (lazy) {
    const turn = later.then(() => new Promise((r) => setTimeout(r, LATER_GAP_MS))).then(pause);
    start = () => turn.then(make);
  }
  e.promise = start()
    .then(async (res) => {
      let img = res.bitmap;
      if (!img) {
        img = new Image();
        img.src = res.url;
        await img.decode();
      }
      Object.assign(e, { ready: true, img, meta: res.meta, w: res.w, h: res.h, url: res.url });
      return e;
    })
    .catch((err) => {
      console.warn("[car-pics] picture failed, keeping the 2D drawing", err);
      e.failed = true;
      return null;
    });
  if (lazy) later = e.promise; // the next one waits until this one is done
  return e;
}

const snapshot = () => import("./three/snapshot.js");

/** Picture of a car: view "side" | "back" | "top". Returns the cache entry (maybe not ready). */
export function carPic(look, view, opts = {}) {
  if (!hasWebGL()) return null;
  const yaw = view === "back" ? Math.sign(opts.yaw || 0) : 0; // −1, 0, 1: seen a little from the side
  const key = `${view}${yaw || ""}|${lookKey(look, opts)}`;
  return remember(key, () => snapshot().then((m) => m.renderPicture("car", { r: resolveLook(look), opts: { colorHex: look?.colorHex || null, passenger: opts.passenger || null }, view, yaw })), yaw !== 0);
}

/**
 * Picture of a prop (cone, tree, house…) from behind, like the race camera sees it.
 * opts (part 24): { yaw (−1, 0, 1), rot, ppu, tint, tintK, snow, mood, windows } – see snapshot.js;
 * lazy = made later, one by one (scenery seen while a race is not starting).
 */
export function propPic(path, opts = {}) {
  if (!hasWebGL()) return null;
  const o = typeof opts === "number" ? { scale: opts } : opts;
  const key = `prop|${path}|${["scale", "yaw", "rot", "ppu", "tint", "tintK", "snow", "mood", "windows"].map((k) => o[k] ?? "").join("|")}`;
  return remember(key, () => snapshot().then((m) => m.renderPicture("prop", { ...o, path, view: "back" })), !!o.lazy);
}

/** A ready picture or null (and the picture is made in the background). */
export function readyPic(entry) {
  return entry?.ready ? entry : null;
}

/** Make these pictures now (e.g. before a race), resolve when ready or after `ms`. */
export function preload(entries, ms = 2500) {
  const list = entries.filter(Boolean).map((e) => e.promise);
  return Promise.race([Promise.all(list), new Promise((r) => setTimeout(r, ms))]);
}

/**
 * The picture scaled to `px` pixels of body width (snapped, cached): smooth when small.
 * Returns { canvas, k } where k turns picture pixels into canvas pixels.
 */
export function scaledPic(e, px) {
  const step = px < 48 ? 4 : px < 160 ? 12 : 32;
  const target = Math.max(4, Math.min(e.meta.bodyW, Math.round(px / step) * step));
  let c = e.scaled.get(target);
  if (!c) {
    const k = target / e.meta.bodyW;
    c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(e.w * k));
    c.height = Math.max(1, Math.round(e.h * k));
    const g = c.getContext("2d");
    g.imageSmoothingQuality = "high";
    g.drawImage(e.img, 0, 0, c.width, c.height);
    e.scaled.set(target, c);
    if (e.scaled.size > 12) e.scaled.delete(e.scaled.keys().next().value);
  }
  return { canvas: c, k: c.width / e.w };
}

/**
 * The picture halved as often as it can be while staying at least `px` pixels of body width
 * (part 24). Many props at many sizes: a few halvings made once each are cheaper than a
 * freshly scaled copy for every size, and the browser scales the rest while drawing.
 */
export function mipPic(e, px) {
  if (!e.mips) e.mips = [e.img];
  const want = Math.max(0, Math.min(6, Math.floor(Math.log2(e.meta.bodyW / Math.max(1, px)))));
  while (e.mips.length <= want) {
    const prev = e.mips[e.mips.length - 1];
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(prev.width / 2));
    c.height = Math.max(1, Math.round(prev.height / 2));
    const g = c.getContext("2d");
    g.imageSmoothingQuality = "high";
    g.drawImage(prev, 0, 0, c.width, c.height);
    e.mips.push(c);
  }
  return e.mips[want];
}

/**
 * A car from the side for the page (home, podium, games, town). The 2D car shows at once and
 * is swapped for the 3D picture when it is ready. el.picReady resolves with the picture (or null).
 */
export function sideCarEl(svg, look = {}, opts = {}) {
  const el = document.createElement("span");
  el.className = "car-pic-wrap";
  for (const k of ["car", "color", "pattern", "wheels", "wing", "sticker", "roof", "neon", "trail"]) if (svg.dataset[k]) el.dataset[k] = svg.dataset[k];
  if (opts.passenger) el.dataset.passenger = opts.passenger;
  el.append(svg);
  const entry = carPic(look, "side", opts);
  el.dataset.pic = entry && !entry.failed ? "wait" : "2d";
  el.picReady = entry
    ? entry.promise.then((e) => {
        if (!e) {
          el.dataset.pic = "2d";
          return null;
        }
        const img = document.createElement("img");
        img.className = `car-pic ${svg.getAttribute("class") || ""}`;
        img.alt = "";
        img.src = e.url;
        img.draggable = false;
        el.replaceChildren(img);
        el.dataset.pic = "3d";
        el.geometry = e.meta;
        return e;
      })
    : Promise.resolve(null);
  return el;
}
