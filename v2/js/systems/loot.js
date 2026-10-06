// Parts (loot): creation, rarity rolls, drops after a race, guarantees and the
// bad-luck counter (DESIGN-v2 §4.4, §4.5, §4.8). Pure logic: no state, no DOM.

import { SLOTS, STARTER_MAIN_VALUE } from "../data/stats.js";
import { RARITIES, LOOT, PART_BASES } from "../data/loot-bases.js";
import { MAIN_SHARE, SIDE_STAT_WEIGHTS } from "../data/affixes.js";
import { LEGENDARIES } from "../data/legendaries.js";

let uidCounter = 0;
const newUid = () => `p${Date.now().toString(36)}${(uidCounter++).toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
const slotDef = (slot) => SLOTS.find((s) => s.id === slot);
export const rarityIndex = (id) => Math.max(0, RARITIES.findIndex((r) => r.id === id));
export const rarityDef = (id) => RARITIES[rarityIndex(id)];

/**
 * A part. Every part always has a main stat (DESIGN-v2 §10, loot test).
 * subs: [{ stat, value }], plus: upgrade level 0..5, budget: stat budget it was rolled with.
 */
export function makePart({ slot, rarity = "common", value, subs = [], plus = 0, icon, budget, legendary = null, isNew = false }) {
  const def = slotDef(slot);
  if (!def) throw new Error(`Unknown slot "${slot}"`);
  const v = Number.isFinite(value) && value > 0 ? Math.round(value) : 1;
  return {
    uid: newUid(),
    slot,
    icon: icon || PART_BASES[slot]?.[0]?.icon || def.icon,
    rarity: rarityDef(rarity).id,
    budget: Number.isFinite(budget) ? Math.round(budget) : v,
    main: { stat: def.main, value: v },
    subs: subs.map((s) => ({ stat: s.stat, value: Math.max(1, Math.round(s.value)) })),
    plus,
    legendary,
    isNew,
    locked: false,
  };
}

export function starterParts() {
  return Object.fromEntries(SLOTS.map((s) => [s.id, makePart({ slot: s.id, value: STARTER_MAIN_VALUE })]));
}

/** Test-menu car with every main stat at `value` and one side stat on each part. */
export function testParts(value, rarity = "epic") {
  return Object.fromEntries(
    SLOTS.map((s, i) => {
      const side = SLOTS[(i + 1) % SLOTS.length].main;
      return [s.id, makePart({ slot: s.id, value, rarity, subs: [{ stat: side, value: Math.round(value / 4) }] })];
    }),
  );
}

function weightedPick(rng, entries) {
  const total = entries.reduce((s, [, w]) => s + Math.max(0, w), 0);
  if (total <= 0) return entries[0][0];
  let roll = rng.random() * total;
  for (const [value, w] of entries) if ((roll -= Math.max(0, w)) < 0) return value;
  return entries[entries.length - 1][0];
}

/** Rarity weights for a race; higher level/track and more luck shift drops up. */
export function rarityWeights({ level = 1, trackIndex = 0, luck = 0 }) {
  const steps = Math.max(0, level - 1) + trackIndex * LOOT.trackBoost * 5;
  return RARITIES.map((r, i) => {
    let w = r.weight * (1 + r.levelBoost * steps);
    if (i > 0) w *= 1 + Math.max(0, luck) * LOOT.luckBoost;
    return [r.id, w];
  });
}

export function rollRarity({ level, trackIndex, luck, rng, min = "common" }) {
  const minI = rarityIndex(min);
  const entries = rarityWeights({ level, trackIndex, luck }).filter(([id, w]) => rarityIndex(id) >= minI && w > 0);
  return entries.length ? weightedPick(rng, entries) : min;
}

/** Roll one part of the given rarity with a stat budget. */
export function generatePart({ rarity, budget, rng, slot, legendary = null }) {
  const s = slot || SLOTS[Math.floor(rng.random() * SLOTS.length)].id;
  const def = slotDef(s);
  const r = rarityDef(rarity);
  const bases = PART_BASES[s] || [{ icon: def.icon }];
  const icon = bases[Math.floor(rng.random() * bases.length)].icon;
  const total = Math.max(2, budget * r.power * (1 + (rng.random() * 2 - 1) * LOOT.jitter));
  const n = r.subs;
  const share = MAIN_SHARE[n] ?? MAIN_SHARE[MAIN_SHARE.length - 1];
  const pool = Object.entries(SIDE_STAT_WEIGHTS).filter(([stat]) => stat !== def.main);
  const subs = [];
  for (let i = 0; i < n && pool.length; i++) {
    const stat = weightedPick(rng, pool);
    pool.splice(pool.findIndex(([st]) => st === stat), 1);
    subs.push({ stat, value: ((total * (1 - share)) / n) * (0.8 + rng.random() * 0.4) });
  }
  return makePart({ slot: s, rarity: r.id, value: total * share, subs, icon, budget, legendary, isNew: true });
}

export function emptyLootHistory() {
  return { races: 0, gotGood: false, gotRare: false, sinceLegendary: 0 };
}

/** Chance of a legendary in this race (bad-luck counter); 0 while none exist. */
export function legendaryChance(history) {
  if (!LEGENDARIES.length) return 0;
  return Math.min(1, LOOT.legendaryBaseChance + LOOT.legendaryPerRace * history.sinceLegendary);
}

/**
 * Drops for one finished race.
 * @returns {{ parts: object[], history: object }} history is the updated copy
 */
export function generateDrops({ count, budget, level = 1, trackIndex = 0, luck = 0, rng, history = emptyLootHistory() }) {
  const h = { ...emptyLootHistory(), ...history };
  h.races += 1;
  const parts = [];
  let legendaryLeft = rng.random() < legendaryChance(h) ? 1 : 0;
  for (let i = 0; i < Math.max(1, count); i++) {
    let min = "common";
    if (i === 0 && !h.gotRare && h.races >= LOOT.guaranteeRareRace) min = "rare";
    else if (i === 0 && !h.gotGood && h.races >= LOOT.guaranteeGoodRace) min = "good";
    let rarity = rollRarity({ level, trackIndex, luck, rng, min });
    let legendary = null;
    if (legendaryLeft) {
      legendaryLeft = 0;
      rarity = "legendary";
      legendary = LEGENDARIES[Math.floor(rng.random() * LEGENDARIES.length)].id;
    }
    const part = generatePart({ rarity, budget, rng, legendary });
    parts.push(part);
    const ri = rarityIndex(part.rarity);
    if (ri >= 1) h.gotGood = true;
    if (ri >= 2) h.gotRare = true;
  }
  h.sinceLegendary = parts.some((p) => p.rarity === "legendary") ? 0 : h.sinceLegendary + 1;
  return { parts, history: h };
}
