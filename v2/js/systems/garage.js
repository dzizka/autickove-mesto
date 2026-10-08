// Garage B (DESIGN-v2 §4.5–4.7): every car keeps its own part levels; a tap upgrades a part
// with scrap 🔩. The chest after a race gives scrap, sometimes a golden part (+1 level for
// the weakest part), a candy for the buddies.

import { getState, update } from "../core/state.js";
import { emit } from "../core/events.js";
import { SLOTS } from "../data/stats.js";
import { GARAGE, SLOT_ABILITIES, CHEST } from "../data/garage.js";
import { TRACKS } from "../data/tracks.js";
import * as rng from "../core/rng.js";
import { addCoins } from "./economy.js";
import { SLOT_IDS, clampLevel, levelsOf, activeCarId, activeLevels, carStats, carPower, raceEffects } from "./stats.js";

export const slotDef = (slot) => SLOTS.find((s) => s.id === slot);

/** 🔩 for the upgrade from `level` to the next one; null when the part is done (top level). */
export function upgradeCost(level) {
  const l = clampLevel(level);
  if (l >= GARAGE.maxLevel) return null;
  return Math.min(GARAGE.costMax, Math.round(GARAGE.costBase * GARAGE.costGrowth ** (l - 1)));
}

/** The next ability of a part: { id, at, from } (from = level of the previous step), or null. */
export function nextAbility(slot, level) {
  const l = clampLevel(level);
  const i = GARAGE.abilityLevels.findIndex((at) => l < at);
  if (i < 0) return null;
  return { id: SLOT_ABILITIES[slot][i], at: GARAGE.abilityLevels[i], from: i ? GARAGE.abilityLevels[i - 1] : 1 };
}

/** The ability a part gets exactly on `level` (11 or 27), else null. */
export function abilityAt(slot, level) {
  const i = GARAGE.abilityLevels.indexOf(level);
  return i < 0 ? null : SLOT_ABILITIES[slot][i];
}

export function canUpgrade(slot, s = getState()) {
  const cost = upgradeCost(levelsOf(activeCarId(s), s)[slot]);
  return cost !== null && s.scrap >= cost;
}

/** The cheapest part the child can upgrade now (it glows as a hint), or null. */
export function hintSlot(s = getState()) {
  const lv = activeLevels(s);
  const options = SLOT_IDS.filter((id) => canUpgrade(id, s)).sort((a, b) => lv[a] - lv[b]);
  return options[0] || null;
}

function setLevel(carId, slot, level) {
  update((s) => {
    s.cars ??= {};
    s.cars[carId] = { ...levelsOf(carId, s), [slot]: clampLevel(level) };
  });
}

/**
 * Upgrade one part of the chosen car by one level for scrap.
 * Returns { level, ability } or null (not enough scrap, or the part is done).
 */
export function upgrade(slot) {
  const s = getState();
  if (!SLOT_IDS.includes(slot) || !canUpgrade(slot, s)) return null;
  const car = activeCarId(s);
  const level = levelsOf(car, s)[slot] + 1;
  const before = carPower();
  update((st) => (st.scrap -= upgradeCost(level - 1)));
  setLevel(car, slot, level);
  const ability = abilityAt(slot, level);
  emit("partUpgraded", { car, slot, level, ability });
  emit("carChanged", { before, after: carPower() });
  return { level, ability };
}

/** Test menu: put every part of the chosen car on `level`. */
export function setAllLevels(level) {
  const car = activeCarId();
  update((s) => {
    s.cars ??= {};
    s.cars[car] = Object.fromEntries(SLOT_IDS.map((id) => [id, clampLevel(level)]));
  });
}

/** Sum of part levels of a car (6 = new car). */
export const carLevel = (carId, s = getState()) => Object.values(levelsOf(carId, s)).reduce((a, b) => a + b, 0);

/** Scrap 🔩 from the chest (§4.5): better track and level give more, the place and luck share. */
export function raceScrap({ track, level = 1, place = 4, bossWin = false, luck = 0 }) {
  const ti = Math.max(0, TRACKS.findIndex((t) => t.id === track));
  const base = CHEST.scrapBase + CHEST.scrapPerTrack * ti + CHEST.scrapPerLevel * (Math.max(1, level) - 1);
  const share = CHEST.placeShare[Math.max(0, Math.min(3, (place || 4) - 1))];
  return Math.max(CHEST.scrapMin, Math.round(base * share * (1 + Math.max(0, luck) * CHEST.luckScrap) * (bossWin ? CHEST.bossScrap : 1)));
}

/** The weakest part of the car (first in slot order on a tie), or null when all are done. */
export function weakestSlot(levels = activeLevels()) {
  const open = SLOT_IDS.filter((id) => levels[id] < GARAGE.maxLevel);
  return open.sort((a, b) => levels[a] - levels[b])[0] || null;
}

/** True when every part of the chosen car is on the top level. */
export const carFinished = (s = getState()) => weakestSlot(activeLevels(s)) === null;

/**
 * Scrap 🔩 from anywhere (chest, games room, daily present). A finished car does not need it:
 * then it becomes coins (part 22), so scrap never piles up and a new car starts from zero.
 * Returns { scrap, coins }.
 */
export function giveScrap(n) {
  const amount = Math.max(0, Math.round(Number(n) || 0));
  if (!amount) return { scrap: 0, coins: 0 };
  if (carFinished()) return { scrap: 0, coins: addCoins(amount * CHEST.finishedCoinsPerScrap) };
  update((s) => (s.scrap += amount));
  return { scrap: amount, coins: 0 };
}

/** How far the scrap goes toward the cheapest next upgrade: { slot, cost } or null. */
export function nextUpgrade(s = getState()) {
  const lv = activeLevels(s);
  const slot = SLOT_IDS.filter((id) => upgradeCost(lv[id]) !== null).sort((a, b) => lv[a] - lv[b])[0];
  return slot ? { slot, cost: upgradeCost(lv[slot]) } : null;
}

/**
 * The chest after a race. Returns { scrap, coins, golden: { slot, level, ability } | null,
 * candy, bar: { before, after, cost, slot } | null }. The golden part upgrades the weakest part
 * of the chosen car for free (+2 levels).
 */
export function grantRaceLoot({ track, level, place, bossWin = false }) {
  const luck = raceEffects(carStats()).luck;
  let scrap = raceScrap({ track, level, place, bossWin, luck });
  let golden = null;
  const goldenChance = Math.min(CHEST.goldenMax, CHEST.goldenChance + luck * CHEST.goldenLuck);
  const before = getState().scrap;
  if (bossWin || rng.random() < goldenChance) {
    const car = activeCarId();
    const slot = weakestSlot(levelsOf(car));
    if (slot) {
      const from = levelsOf(car)[slot];
      const lv = Math.min(GARAGE.maxLevel, from + GARAGE.goldenLevels);
      const p0 = carPower();
      setLevel(car, slot, lv);
      // an ability on any of the levels it jumped over counts
      let ability = null;
      for (let l = from + 1; l <= lv; l++) ability = abilityAt(slot, l) || ability;
      golden = { slot, level: lv, ability };
      emit("carChanged", { before: p0, after: carPower() });
    } else scrap += CHEST.goldenScrap; // a finished car: becomes coins below
  }
  const got = giveScrap(scrap);
  const candy = bossWin || rng.random() < CHEST.candyChance ? 1 : 0;
  if (candy) update((s) => (s.crew.candy += candy));
  const next = nextUpgrade();
  const bar = next && got.scrap ? { before: Math.min(before, next.cost), after: Math.min(getState().scrap, next.cost), cost: next.cost, slot: next.slot } : null;
  return { scrap: got.scrap, coins: got.coins, golden, candy, bar };
}
