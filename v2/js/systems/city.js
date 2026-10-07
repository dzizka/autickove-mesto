// Town logic (DESIGN-v2 §13): build and upgrade buildings, rent that waits to be collected.

import { getState, update } from "../core/state.js";
import { emit } from "../core/events.js";
import { BUILDINGS, CITY } from "../data/city.js";
import { spendCoins, addCoins } from "./economy.js";

export const buildingDef = (id) => BUILDINGS.find((b) => b.id === id) || null;
export const buildingLevel = (id, s = getState()) => Math.max(0, Math.min(CITY.maxLevel, s.city?.buildings?.[id] || 0));

/** Coins for the next level (build = level 1), or null at the top. */
export function nextPrice(id, s = getState()) {
  const def = buildingDef(id);
  const lvl = buildingLevel(id, s);
  if (!def || lvl >= CITY.maxLevel) return null;
  return def.price * CITY.upgradeFactor ** lvl;
}

export function isBuildingOpen(id, s = getState()) {
  const def = buildingDef(id);
  return !!def && s.level >= def.unlockLevel;
}

/** Build or upgrade. Rent collected so far is paid out first, so nothing is lost. */
export function buildOrUpgrade(id, now = Date.now()) {
  const price = nextPrice(id);
  if (price === null || !isBuildingOpen(id) || !spendCoins(price)) return false;
  collectRent(id, now);
  update((s) => {
    s.city.buildings[id] = buildingLevel(id, s) + 1;
    s.city.rentAt[id] = now;
  });
  emit("buildingBuilt", { id, level: buildingLevel(id) });
  return true;
}

/** Coins waiting in a building (rent per hour × level, at most CITY.rentCapHours). */
export function rentWaiting(id, now = Date.now(), s = getState()) {
  const lvl = buildingLevel(id, s);
  const def = buildingDef(id);
  if (!lvl || !def) return 0;
  const since = Number(s.city.rentAt?.[id]) || now;
  const hours = Math.max(0, Math.min(CITY.rentCapHours, (now - since) / 3600000));
  return Math.floor(hours * def.rent * lvl);
}

export function collectRent(id, now = Date.now()) {
  const coins = rentWaiting(id, now);
  if (coins < CITY.minCollect) return 0;
  const def = buildingDef(id);
  const lvl = buildingLevel(id);
  // keep the unpaid fraction of an hour
  const perMs = (def.rent * lvl) / 3600000;
  update((s) => {
    const since = Number(s.city.rentAt[id]) || now;
    const capped = Math.max(since, now - CITY.rentCapHours * 3600000);
    s.city.rentAt[id] = Math.min(now, capped + coins / perMs);
  });
  addCoins(coins);
  return coins;
}

export function builtCount(s = getState()) {
  return BUILDINGS.filter((b) => buildingLevel(b.id, s) > 0).length;
}
