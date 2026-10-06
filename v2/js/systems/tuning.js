// Car appearance (DESIGN-v2 §5): owned items, the chosen look, buying and random looks.
// Looks have no stats. Unknown ids always fall back to the free default (v1 neon bug).

import { getState, update } from "../core/state.js";
import { emit } from "../core/events.js";
import { CARS } from "../data/cars.js";
import { TUNING } from "../data/tuning.js";
import { spendCoins } from "./economy.js";

export const CATEGORY_IDS = ["car", ...TUNING.map((c) => c.id)];

export function itemsOf(cat) {
  if (cat === "car") return CARS;
  return TUNING.find((c) => c.id === cat)?.items || [];
}

/** Item by id, or the category's free default when the id is unknown. */
export function getItem(cat, id) {
  const items = itemsOf(cat);
  return items.find((i) => i.id === id) || items[0];
}

export function defaultLook() {
  return Object.fromEntries(CATEGORY_IDS.map((c) => [c, itemsOf(c)[0].id]));
}

export function defaultOwned() {
  return Object.fromEntries(CATEGORY_IDS.map((c) => [c, [itemsOf(c)[0].id]]));
}

/** Full item objects for every category; safe for any input (missing, old or broken). */
export function resolveLook(look = {}) {
  const src = look && typeof look === "object" ? look : {};
  return Object.fromEntries(CATEGORY_IDS.map((c) => [c, getItem(c, src[c])]));
}

/** A simple look for rivals and podium cars: just a colour. */
export function colorLook(hex) {
  return { ...defaultLook(), colorHex: hex };
}

export function getLook(s = getState()) {
  return { ...defaultLook(), ...(s.look || {}) };
}

export function isOwned(cat, id, s = getState()) {
  return id === itemsOf(cat)[0]?.id || (s.owned?.[cat] || []).includes(id);
}

export function priceOf(cat, id) {
  return getItem(cat, id)?.price || 0;
}

/** Put an owned item on the car. */
export function select(cat, id) {
  if (!isOwned(cat, id) || !itemsOf(cat).some((i) => i.id === id)) return false;
  update((s) => {
    s.look = { ...getLook(s), [cat]: id };
  });
  emit("lookChanged", { cat, id });
  return true;
}

/** Buy with coins and put it on. Returns false when not affordable. */
export function buy(cat, id) {
  if (!itemsOf(cat).some((i) => i.id === id)) return false;
  if (isOwned(cat, id)) return select(cat, id);
  if (!spendCoins(priceOf(cat, id))) return false;
  update((s) => {
    s.owned[cat] = [...new Set([...(s.owned[cat] || []), id])];
  });
  select(cat, id);
  emit("itemBought", { cat, id });
  return true;
}

/** 🎲 A random look from owned items only. */
export function randomLook(rng) {
  const s = getState();
  const look = {};
  for (const c of CATEGORY_IDS) {
    const owned = itemsOf(c).filter((i) => isOwned(c, i.id, s));
    look[c] = owned[Math.floor(rng.random() * owned.length)]?.id || itemsOf(c)[0].id;
  }
  update((st) => {
    st.look = look;
  });
  emit("lookChanged", { cat: "all" });
  return look;
}

/** Test menu: own everything. */
export function ownAll() {
  update((s) => {
    for (const c of CATEGORY_IDS) s.owned[c] = itemsOf(c).map((i) => i.id);
  });
}
