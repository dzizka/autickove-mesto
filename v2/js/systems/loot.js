// Parts (loot). Part 1 only needs part creation for the starter car and test cars;
// random drops, rarity rolls and the luck "bad-luck counter" arrive in part 2.

import { SLOTS, STARTER_MAIN_VALUE } from "../data/stats.js";

let uidCounter = 0;
const newUid = () => `p${Date.now().toString(36)}${(uidCounter++).toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

/**
 * A part. Every part always has a main stat (DESIGN-v2 §10, loot test).
 * subs: [{ stat, value }], plus: upgrade level 0..5 (part 2).
 */
export function makePart({ slot, rarity = "common", value, subs = [], plus = 0, ilvl = 1 }) {
  const def = SLOTS.find((s) => s.id === slot);
  if (!def) throw new Error(`Unknown slot "${slot}"`);
  const v = Number.isFinite(value) && value > 0 ? Math.round(value) : 1;
  return { uid: newUid(), slot, rarity, ilvl, main: { stat: def.main, value: v }, subs: subs.map((s) => ({ ...s })), plus, isNew: false, locked: false };
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
