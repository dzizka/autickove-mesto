// Colouring book logic (DESIGN-v2 §7): pixel pictures from shapes, unlocking pictures,
// glitter colours and stickers as rewards, unfinished paint-by-number work, and the gallery.
// The gallery lives under its own storage key: small JPEGs would make the AM2: transfer code
// hundreds of kB long, so it stays on the device (DESIGN-v2 §7.4).

import { getState, update } from "../core/state.js";
import { emit } from "../core/events.js";
import { FREE_PICTURES } from "../data/coloring/free.js";
import { PIXEL_PICTURES } from "../data/coloring/pixel.js";
import { GLITTER, COLORING } from "../data/coloring/palette.js";
import { TUNING } from "../data/tuning.js";
import { spendCoins } from "./economy.js";

// written out (not built from STORAGE_KEY): state.js imports this module, so its constants
// are not ready yet while this file is loading
export const GALLERY_KEY = "autickove-mesto-v2-gallery";

export function defaultColoring() {
  return { finished: 0, done: {}, bought: [], glitter: [], wip: {} };
}

// ---------- pixel pictures ----------

function inside(shape, u, v) {
  const [, kind, ...a] = shape;
  if (kind === "rect") return u >= a[0] && u < a[0] + a[2] && v >= a[1] && v < a[1] + a[3];
  if (kind === "circle") return (u - a[0]) ** 2 + (v - a[1]) ** 2 <= a[2] ** 2;
  if (kind === "ellipse") return ((u - a[0]) / a[2]) ** 2 + ((v - a[1]) / a[3]) ** 2 <= 1;
  if (kind === "poly") {
    const p = a[0];
    let hit = false;
    for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) {
      const [xi, yi, xj, yj] = [p[i], p[i + 1], p[j], p[j + 1]];
      if (yi > v !== yj > v && u < ((xj - xi) * (v - yi)) / (yj - yi) + xi) hit = !hit;
    }
    return hit;
  }
  return false;
}

const gridCache = new Map();

/**
 * The paint-by-number grid of a picture: { size, cells: [colour number 1..k], colors: [hex] }.
 * Colours that end up unused are dropped, so every number in the palette can be finished.
 */
export function pixelGrid(picture) {
  if (gridCache.has(picture.id)) return gridCache.get(picture.id);
  const n = picture.size;
  const raw = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const u = (c + 0.5) / n;
      const v = (r + 0.5) / n;
      let color = 0;
      for (const sh of picture.shapes) if (inside(sh, u, v)) color = sh[0];
      raw.push(color);
    }
  }
  const used = [...new Set(raw)].sort((a, b) => a - b);
  const map = new Map(used.map((ci, i) => [ci, i + 1]));
  const grid = { id: picture.id, size: n, cells: raw.map((ci) => map.get(ci)), colors: used.map((ci) => picture.colors[ci] || "#cccccc") };
  gridCache.set(picture.id, grid);
  return grid;
}

export const pixelPicture = (id) => PIXEL_PICTURES.find((p) => p.id === id) || null;
export const freePicture = (id) => FREE_PICTURES.find((p) => p.id === id) || null;

// ---------- unlocking ----------

export function isFreeUnlocked(pic, s = getState()) {
  if (!pic.unlock) return true;
  return s.coloring.bought.includes(pic.id) || s.races.total >= pic.unlock.races;
}

export function buyPicture(id) {
  const pic = freePicture(id);
  if (!pic || isFreeUnlocked(pic)) return !!pic;
  if (!spendCoins(pic.unlock.price)) return false;
  update((s) => s.coloring.bought.push(id));
  return true;
}

export function ownedGlitter(s = getState()) {
  return GLITTER.filter((g) => s.coloring.glitter.includes(g.id)).map((g) => g.id);
}

// ---------- unfinished work (paint by number) ----------

/** Store filled cells as a "0101…" string so a big picture can be finished later. */
export function saveWip(id, filled) {
  update((s) => (s.coloring.wip[id] = filled.map((f) => (f ? "1" : "0")).join("")));
}

export function loadWip(id, size) {
  const str = getState().coloring.wip[id];
  if (typeof str !== "string" || str.length !== size * size) return null;
  return [...str].map((ch) => ch === "1");
}

export function clearWip(id) {
  if (!(id in getState().coloring.wip)) return;
  update((s) => delete s.coloring.wip[id]);
}

// ---------- rewards (§7.4) ----------

export function pictureReward({ mode, size }) {
  const key = mode === "free" ? "free" : size;
  return { coins: COLORING.coins[key] || 15, xp: COLORING.xp[key] || 8 };
}

/**
 * Book-keeping after a finished picture: count it, unlock glitter colours and car stickers
 * on their schedule. Returns { glitter, sticker } that were just unlocked.
 */
export function recordFinished({ id, mode }) {
  let glitter = null;
  let sticker = null;
  update((s) => {
    s.coloring.finished += 1;
    s.coloring.done[id] = (s.coloring.done[id] || 0) + 1;
    if (mode === "number") delete s.coloring.wip[id];
    const n = s.coloring.finished;
    const g = GLITTER.find((x) => x.unlockAt <= n && !s.coloring.glitter.includes(x.id));
    if (g) {
      s.coloring.glitter.push(g.id);
      glitter = g;
    }
    if (COLORING.stickerAt.includes(n)) {
      const items = TUNING.find((c) => c.id === "sticker").items;
      const next = items.find((it) => it.price > 0 && !(s.owned.sticker || []).includes(it.id));
      if (next) {
        s.owned.sticker = [...(s.owned.sticker || []), next.id];
        sticker = next;
      }
    }
  });
  emit("pictureFinished", { id, mode });
  return { glitter, sticker };
}

// ---------- gallery ----------

export function loadGallery() {
  try {
    const list = JSON.parse(localStorage.getItem(GALLERY_KEY) || "[]");
    return Array.isArray(list) ? list.filter((g) => g && typeof g.src === "string") : [];
  } catch {
    return [];
  }
}

/** Add a picture (newest first). At most 40; the oldest ones make room. */
export function addToGallery({ id, mode, src }) {
  const key = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
  const list = [{ id, mode, src, at: Date.now(), key }, ...loadGallery()].slice(0, COLORING.galleryMax);
  for (let keep = list.length; keep > 0; keep--) {
    try {
      localStorage.setItem(GALLERY_KEY, JSON.stringify(list.slice(0, keep)));
      return keep;
    } catch {
      // storage full: drop the oldest and try again
    }
  }
  return 0;
}

export function removeFromGallery(key) {
  try {
    localStorage.setItem(GALLERY_KEY, JSON.stringify(loadGallery().filter((g) => (g.key || g.at) !== key)));
  } catch {
    /* ignore */
  }
}

/** Test menu: unlock every picture and glitter colour. */
export function unlockAllColoring() {
  update((s) => {
    s.coloring.bought = FREE_PICTURES.map((p) => p.id);
    s.coloring.glitter = GLITTER.map((g) => g.id);
  });
}
