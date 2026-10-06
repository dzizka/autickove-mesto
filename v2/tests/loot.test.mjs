// Loot in Node (DESIGN-v2 §10): 10 000 parts, rarity spread by the table, every part has a
// main stat; guarantees for the first races; drops by place; level and luck shift rarity up.

import { test } from "node:test";
import assert from "node:assert/strict";
import * as rng from "../js/core/rng.js";
import { RARITIES, RARITY_IDS, LOOT } from "../js/data/loot-bases.js";
import { SLOTS, STAT_IDS } from "../js/data/stats.js";
import { generatePart, rollRarity, generateDrops, emptyLootHistory, rarityWeights, starterParts, legendaryChance } from "../js/systems/loot.js";
import { partStats, carStats, carPower, recommendedPower } from "../js/systems/stats.js";

test("10 000 parts: every part has a main stat and the right number of side stats", () => {
  rng.setSeed(42);
  const counts = Object.fromEntries(RARITY_IDS.map((id) => [id, 0]));
  for (let i = 0; i < 10000; i++) {
    const rarity = rollRarity({ level: 1 + (i % 5), trackIndex: i % 6, luck: (i % 4) * 0.3, rng });
    const p = generatePart({ rarity, budget: 8 + (i % 120), rng });
    counts[p.rarity]++;
    assert.ok(SLOTS.some((s) => s.id === p.slot), `bad slot ${p.slot}`);
    assert.ok(p.main && STAT_IDS.includes(p.main.stat), "part without main stat");
    assert.equal(p.main.stat, SLOTS.find((s) => s.id === p.slot).main, "main stat matches the slot");
    assert.ok(Number.isFinite(p.main.value) && p.main.value >= 1, `main value ${p.main.value}`);
    const def = RARITIES.find((r) => r.id === p.rarity);
    assert.equal(p.subs.length, def.subs, `${p.rarity} has ${p.subs.length} side stats`);
    assert.equal(new Set(p.subs.map((s) => s.stat)).size, p.subs.length, "side stats are distinct");
    assert.ok(p.subs.every((s) => s.stat !== p.main.stat && s.value >= 1), "side stat repeats main or is empty");
    assert.ok(p.icon && p.uid && p.isNew === true);
    assert.ok(Object.values(partStats(p)).every(Number.isFinite));
  }
  // all rarities appear, rarer ones less often, and no legendary before part 4
  assert.ok(counts.common + counts.good > counts.rare && counts.rare > counts.epic && counts.epic > 0 && counts.common > counts.epic * 3, JSON.stringify(counts));
  assert.equal(counts.legendary, 0);
});

test("base weights at level 1 match the rarity table (±2 %)", () => {
  rng.setSeed(7);
  const n = 20000;
  const counts = Object.fromEntries(RARITY_IDS.map((id) => [id, 0]));
  for (let i = 0; i < n; i++) counts[rollRarity({ level: 1, trackIndex: 0, luck: 0, rng })]++;
  const total = RARITIES.reduce((s, r) => s + r.weight, 0);
  for (const r of RARITIES) assert.ok(Math.abs(counts[r.id] / n - r.weight / total) < 0.02, `${r.id}: ${counts[r.id] / n}`);
});

test("higher levels, later tracks and more luck give better parts", () => {
  const share = (opts) => {
    const w = rarityWeights(opts);
    const total = w.reduce((s, [, x]) => s + x, 0);
    return (w[2][1] + w[3][1]) / total; // blue + purple
  };
  assert.ok(share({ level: 5, trackIndex: 0 }) > share({ level: 1, trackIndex: 0 }) * 2);
  assert.ok(share({ level: 1, trackIndex: 5 }) > share({ level: 1, trackIndex: 0 }) * 1.5);
  assert.ok(share({ level: 1, trackIndex: 0, luck: 1 }) > share({ level: 1, trackIndex: 0, luck: 0 }) * 1.3);
});

test("first green part in race 1 and first blue part by race 2, for every seed", () => {
  for (let seed = 1; seed <= 300; seed++) {
    rng.setSeed(seed);
    let history = emptyLootHistory();
    const seen = [];
    for (let race = 1; race <= 3; race++) {
      const res = generateDrops({ count: 1, budget: 10, rng, history });
      history = res.history;
      seen.push(...res.parts.map((p) => p.rarity));
      if (race === 1) assert.ok(seen.some((r) => r !== "common"), `seed ${seed}: no green in race 1`);
      if (race === 2) assert.ok(seen.some((r) => ["rare", "epic", "legendary"].includes(r)), `seed ${seed}: no blue by race 2`);
    }
    assert.equal(history.races, 3);
    assert.ok(history.sinceLegendary <= 3, "bad-luck counter counts races without a legendary");
  }
});

test("drops by place: 3 / 2 / 1 / 1 parts", () => {
  rng.setSeed(9);
  LOOT.dropsByPlace.forEach((count, i) => {
    const { parts } = generateDrops({ count, budget: 20, rng, history: { ...emptyLootHistory(), gotGood: true, gotRare: true } });
    assert.equal(parts.length, [3, 2, 1, 1][i]);
  });
});

test("bad-luck counter: the chance grows every race and a legendary is sure by race 60", () => {
  assert.ok(legendaryChance({ sinceLegendary: 10 }) > legendaryChance({ sinceLegendary: 0 }));
  assert.equal(legendaryChance({ sinceLegendary: LOOT.legendaryHardPity - 1 }), 1);
  let firsts = [];
  for (let seed = 1; seed <= 200; seed++) {
    rng.setSeed(seed);
    let history = { ...emptyLootHistory(), gotGood: true, gotRare: true };
    for (let race = 1; race <= 60; race++) {
      const res = generateDrops({ count: 2, budget: 30, rng, history });
      history = res.history;
      const leg = res.parts.find((p) => p.rarity === "legendary");
      if (leg) {
        assert.ok(leg.legendary && leg.subs.length === 2, "legendary has an ability and 2 side stats");
        firsts.push(race);
        break;
      }
    }
    assert.equal(firsts.length, seed, `seed ${seed}: no legendary in 60 races`);
  }
  const avg = firsts.reduce((a, b) => a + b, 0) / firsts.length;
  assert.ok(avg > 10 && avg < 45, `first legendary on average in race ${avg.toFixed(1)}: rare but not too rare`);
});

test("drops feel like progress: a car full of blue parts from a race beats its recommended power", () => {
  rng.setSeed(11);
  for (const [track, level] of [["city", 3], ["snow", 2], ["space", 4]]) {
    const budget = recommendedPower(track, level) * LOOT.partBudgetShare;
    const equipped = Object.fromEntries(SLOTS.map((s) => [s.id, generatePart({ rarity: "rare", budget, rng, slot: s.id })]));
    assert.ok(carPower(carStats(equipped)) >= recommendedPower(track, level), track);
  }
  const starter = carPower(carStats(starterParts()));
  const cityGreen = generatePart({ rarity: "good", budget: recommendedPower("city", 1) * LOOT.partBudgetShare, rng });
  const total = Object.values(partStats(cityGreen)).reduce((a, b) => a + b, 0);
  assert.ok(total >= starter / 6, "a green part from City 1 is not worse than a starter part");
});
