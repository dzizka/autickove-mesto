// Garage logic (DESIGN-v2 §4.6): bag, equip, best loadout, dismantle, upgrade, lock.

import { getState, update } from "../core/state.js";
import { emit } from "../core/events.js";
import { SLOTS, STAT_IDS } from "../data/stats.js";
import { LOOT, PART_BASES } from "../data/loot-bases.js";
import { partStats, carStats, carPower, raceEffects, recommendedPower } from "./stats.js";
import { rarityIndex, rarityDef, generateDrops, generateBossPrize } from "./loot.js";
import { TRACKS } from "../data/tracks.js";
import * as rng from "../core/rng.js";
import { spendCoins, canAfford } from "./economy.js";
import { candyFromDismantle } from "./crew.js";

export const partPower = (part) => (part ? Math.round(STAT_IDS.reduce((sum, id) => sum + partStats(part)[id], 0)) : 0);
export const partIcon = (part) => part?.icon || PART_BASES[part?.slot]?.[0]?.icon || SLOTS.find((s) => s.id === part?.slot)?.icon || "❓";

export function findPart(uid, s = getState()) {
  const bag = s.inventory.find((p) => p.uid === uid);
  if (bag) return { part: bag, where: "bag" };
  for (const [slot, p] of Object.entries(s.car.equipped)) if (p?.uid === uid) return { part: p, where: slot };
  return null;
}

/** +1 better, -1 worse, 0 same, compared with what is mounted in the part's slot. */
export function compareToEquipped(part, s = getState()) {
  const mounted = s.car.equipped[part.slot];
  if (!mounted || mounted.uid === part.uid) return 0;
  return Math.sign(partPower(part) - partPower(mounted));
}

export function bagFree(s = getState()) {
  return Math.max(0, s.bagSize - s.inventory.length);
}

/**
 * Put new parts into the bag. What does not fit is dismantled into scrap.
 * Returns { kept, scrapped, scrap }.
 */
export function addParts(parts) {
  const kept = [];
  const scrapped = [];
  let scrap = 0;
  update((s) => {
    for (const p of parts) {
      if (p.set) s.setsFound[p.set] = [...new Set([...(s.setsFound[p.set] || []), p.slot])];
      if (p.legendary && !s.legendariesFound.includes(p.legendary)) s.legendariesFound.push(p.legendary);
      if (s.inventory.length < s.bagSize || p.rarity === "legendary") {
        // a legendary never gets scrapped because the bag is full
        s.inventory.push({ ...p, isNew: true });
        kept.push(p);
      } else {
        scrapped.push(p);
        scrap += scrapValue(p);
      }
    }
    s.scrap += scrap;
  });
  if (kept.length) emit("itemDropped", { parts: kept });
  return { kept, scrapped, scrap };
}

export function scrapValue(part) {
  return rarityDef(part.rarity).scrap * (1 + Math.floor((part.budget || 0) / 40)) + (part.plus || 0);
}

/** Mount a bag part; the old part goes back to the bag. */
export function equip(uid) {
  const before = carPower();
  let ok = false;
  update((s) => {
    const i = s.inventory.findIndex((p) => p.uid === uid);
    if (i < 0) return;
    const part = { ...s.inventory[i], isNew: false };
    const old = s.car.equipped[part.slot];
    s.inventory.splice(i, 1);
    if (old) s.inventory.splice(i, 0, old);
    s.car.equipped[part.slot] = part;
    ok = true;
  });
  if (ok) emit("carChanged", { before, after: carPower() });
  return ok;
}

/** ✨ Best: mount the strongest part for every slot. Returns number of swaps. */
export function equipBest() {
  const s = getState();
  let swaps = 0;
  for (const slot of SLOTS.map((x) => x.id)) {
    const mounted = s.car.equipped[slot];
    const best = s.inventory.filter((p) => p.slot === slot).sort((a, b) => partPower(b) - partPower(a))[0];
    if (best && partPower(best) > partPower(mounted)) {
      equip(best.uid);
      swaps++;
    }
  }
  return swaps;
}

export function markSeen(uid) {
  const f = findPart(uid);
  if (!f?.part.isNew) return;
  update(() => {
    f.part.isNew = false;
  });
}

export function markAllSeen() {
  if (!getState().inventory.some((p) => p.isNew)) return;
  update((s) => s.inventory.forEach((p) => (p.isNew = false)));
}

export function toggleLock(uid) {
  const f = findPart(uid);
  if (!f) return false;
  update(() => {
    f.part.locked = !f.part.locked;
  });
  return f.part.locked;
}

/** Dismantle a bag part (not mounted, not locked). Returns { scrap, candy } gained. */
export function dismantle(uid) {
  let gained = 0;
  let removed = null;
  update((s) => {
    const i = s.inventory.findIndex((p) => p.uid === uid && !p.locked);
    if (i < 0) return;
    removed = s.inventory[i];
    gained = scrapValue(removed);
    s.inventory.splice(i, 1);
    s.scrap += gained;
  });
  const candy = removed ? candyFromDismantle([removed], rng) : 0;
  if (gained) emit("partsDismantled", { count: 1, scrap: gained, candy });
  return { scrap: gained, candy };
}

/** "Dismantle all grey and green": unlocked common + good parts in the bag. */
export function dismantleableLow(s = getState()) {
  return s.inventory.filter((p) => !p.locked && rarityIndex(p.rarity) <= 1);
}

export function dismantleLow() {
  const list = dismantleableLow();
  if (!list.length) return { count: 0, scrap: 0, candy: 0 };
  const ids = new Set(list.map((p) => p.uid));
  const scrap = list.reduce((sum, p) => sum + scrapValue(p), 0);
  update((s) => {
    s.inventory = s.inventory.filter((p) => !ids.has(p.uid));
    s.scrap += scrap;
  });
  const candy = candyFromDismantle(list, rng);
  emit("partsDismantled", { count: list.length, scrap, candy });
  return { count: list.length, scrap, candy };
}

export function upgradeCost(part) {
  const plus = part.plus || 0;
  if (plus >= LOOT.maxPlus) return null;
  return {
    scrap: (plus + 1) * (rarityIndex(part.rarity) + 1) * LOOT.upgradeScrapStep,
    coins: Math.round((plus + 1) * LOOT.upgradeCoinsStep * (1 + (part.budget || 0) / LOOT.upgradeBudgetDiv)),
  };
}

export function canUpgrade(part, s = getState()) {
  const cost = upgradeCost(part);
  return !!cost && s.scrap >= cost.scrap && canAfford(cost.coins);
}

/** +1 upgrade (up to +5). Works for mounted and bag parts. */
export function upgrade(uid) {
  const f = findPart(uid);
  if (!f || !canUpgrade(f.part)) return false;
  const cost = upgradeCost(f.part);
  const before = carPower();
  spendCoins(cost.coins);
  update((s) => {
    s.scrap -= cost.scrap;
    f.part.plus = (f.part.plus || 0) + 1;
  });
  emit("partUpgraded", { uid, plus: f.part.plus });
  if (f.where !== "bag") emit("carChanged", { before, after: carPower() });
  return true;
}

export function bagPrice(s = getState()) {
  if (s.bagSize >= LOOT.bagMax) return null;
  return LOOT.bagPriceBase + (s.bagSize - LOOT.bagStart) * LOOT.bagPricePerSlot;
}

export function expandBag() {
  const price = bagPrice();
  if (price === null || !spendCoins(price)) return false;
  update((s) => {
    s.bagSize = Math.min(LOOT.bagMax, s.bagSize + LOOT.bagStep);
  });
  return true;
}


/**
 * Chest after a race (DESIGN-v2 §4.5): 3/2/1/1 parts by place, quality by track level
 * and luck, with the first-race guarantees and the bad-luck counter.
 */
export function grantRaceLoot({ track, level, place, bossWin = false }) {
  const trackIndex = Math.max(0, TRACKS.findIndex((t) => t.id === track));
  // a boss win: the sure epic (or legendary) prize plus two normal parts
  const count = bossWin ? 2 : LOOT.dropsByPlace[Math.max(0, Math.min(3, (place || 4) - 1))];
  const { parts, history } = generateDrops({
    count,
    budget: recommendedPower(track, level) * LOOT.partBudgetShare,
    level,
    trackIndex,
    luck: raceEffects(carStats()).luck,
    rng,
    history: getState().loot,
  });
  let hist = history;
  if (bossWin) {
    const prize = generateBossPrize({ budget: recommendedPower(track, level) * LOOT.partBudgetShare, rng, history: hist });
    hist = prize.history;
    parts.unshift(prize.part);
  }
  update((s) => {
    s.loot = hist;
  });
  const { kept, scrapped, scrap } = addParts(parts);
  return { parts, kept, scrapped, scrap, bossPrize: bossWin ? parts[0] : null };
}
