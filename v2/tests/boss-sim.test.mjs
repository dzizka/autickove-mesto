// Part 4 in Node: every boss can be beaten (DESIGN-v2 §9 "done when"), boss throws are always
// dodgeable, every legendary ability does something visible, sets add bonuses and a look.

import { test } from "node:test";
import assert from "node:assert/strict";
import * as rng from "../js/core/rng.js";
import { TRACKS, RACE } from "../js/data/tracks.js";
import { BOSSES } from "../js/data/bosses.js";
import { LEGENDARIES } from "../js/data/legendaries.js";
import { SETS } from "../js/data/sets.js";
import { raceEffects, carStats, carPower, recommendedPower, setLook, activeSetBonuses, carAbilities } from "../js/systems/stats.js";
import { starterParts, testParts, generatePart, generateBossPrize, emptyLootHistory } from "../js/systems/loot.js";
import { createRace, step, steer } from "../js/games/race/physics.js";
import { carefulBot } from "./race-bot.mjs";

const SEEDS = Array.from({ length: 12 }, (_, i) => 500 + i * 13);
const track = (id) => TRACKS.find((t) => t.id === id);

function runBoss({ boss, level, equipped, seed, driver = carefulBot }) {
  rng.setSeed(seed);
  const abilities = carAbilities(equipped);
  const race = createRace({ track: track(boss.track), level, effects: raceEffects(carStats(equipped), abilities), rng, abilities, boss });
  let throws = 0;
  while (race.phase !== "finished" && race.time < 200) {
    if (race.phase === "racing") driver(race);
    step(race, 1 / 30);
    throws += race.events.filter((e) => e.type === "bossThrow").length;
    race.events.length = 0;
  }
  return { race, throws };
}

/** A car whose power matches the recommended power of the level (🟢 on the selection screen). */
function greenCar(trackId, level) {
  return testParts(Math.ceil(recommendedPower(trackId, level) / 7.5) + 1, "epic");
}

test("every boss can be beaten with a 🟢 car, and it really throws things", () => {
  for (const boss of BOSSES) {
    for (const level of [1, 3, 5]) {
      const equipped = greenCar(boss.track, level);
      let wins = 0;
      let throws = 0;
      for (const seed of SEEDS) {
        const r = runBoss({ boss, level, equipped, seed });
        assert.equal(r.race.phase, "finished");
        wins += r.race.place === 1 ? 1 : 0;
        throws += r.throws;
      }
      assert.ok(wins / SEEDS.length >= 0.75, `${boss.id} level ${level}: wins ${wins}/${SEEDS.length}`);
      assert.ok(throws >= SEEDS.length * 3, `${boss.id} throws too little (${throws})`);
    }
  }
});

test("the first boss (City, level 1) can be beaten with the starter car", () => {
  const boss = BOSSES.find((b) => b.track === "city");
  const wins = SEEDS.filter((seed) => runBoss({ boss, level: 1, equipped: starterParts(), seed }).race.place === 1).length;
  assert.ok(wins / SEEDS.length >= 0.75, `wins ${wins}/${SEEDS.length}`);
});

test("boss throws show a target first and always leave a free lane", () => {
  const boss = BOSSES.find((b) => b.track === "night");
  for (const seed of SEEDS) {
    rng.setSeed(seed);
    const race = createRace({ track: track("night"), level: 3, effects: raceEffects(carStats(greenCar("night", 3))), rng, boss });
    while (race.phase !== "finished" && race.time < 120) {
      carefulBot(race);
      step(race, 1 / 30);
      for (const e of race.events) {
        if (e.type !== "bossThrow") continue;
        const thing = race.objects[race.objects.length - 1];
        assert.ok(thing.warn > 0, "a throw starts as a warning target");
        const blocked = new Set(race.objects.filter((o) => (o.kind === "obstacle" || o.kind === "traffic") && !o.hit && Math.abs(o.d - thing.d) < 4).map((o) => o.lane));
        assert.ok(blocked.size < RACE.lanes, "all lanes blocked by a throw");
      }
      race.events.length = 0;
    }
  }
});

test("boss prize: always epic (often a set piece) or legendary", () => {
  rng.setSeed(1);
  let sets = 0;
  let legends = 0;
  for (let i = 0; i < 2000; i++) {
    const { part } = generateBossPrize({ budget: 40, rng, history: emptyLootHistory() });
    assert.ok(part.rarity === "epic" || part.rarity === "legendary");
    if (part.set) sets++;
    if (part.legendary) legends++;
  }
  assert.ok(sets > 600 && sets < 1100, `set pieces ${sets}`);
  assert.ok(legends > 200 && legends < 420, `legendaries ${legends}`);
});

test("12 legendary abilities, each one shows up in a race", () => {
  assert.equal(LEGENDARIES.length, 12);
  const numeric = { iceShield: "gripOnSnow", headlight: "lightRange", superMagnet: "magnetLanes", endlessTank: "fuelDrain", bubble: "shields" };
  const base = raceEffects(carStats(starterParts()));
  for (const leg of LEGENDARIES) {
    const equipped = { ...starterParts(), [leg.slot]: generatePart({ rarity: "legendary", budget: 30, rng, legendary: leg.id }) };
    const abilities = carAbilities(equipped);
    assert.ok(abilities.has(leg.id));
    const fx = raceEffects(carStats(equipped), abilities);
    if (numeric[leg.id]) assert.notEqual(fx[numeric[leg.id]], base[numeric[leg.id]], `${leg.id} changes ${numeric[leg.id]}`);
    if (leg.id === "headlight" || leg.id === "iceShield" || leg.id === "superMagnet" || leg.id === "endlessTank") continue; // no event, the effect is constant
    // event abilities: drive a full race on a track with ramps and watch for the event
    let seen = false;
    for (const seed of SEEDS.slice(0, 6)) {
      rng.setSeed(seed);
      const race = createRace({ track: track("forest"), level: 4, effects: fx, rng, abilities });
      while (race.phase !== "finished" && race.time < 150 && !seen) {
        if (race.phase === "racing") {
          // drive straight into things so ghost and springs get a chance
          if (!["ghost", "springs", "jumper"].includes(leg.id)) carefulBot(race);
        }
        step(race, 1 / 30);
        seen = race.events.some((e) => e.type === "ability" && e.id === leg.id);
        race.events.length = 0;
      }
      if (seen) break;
    }
    assert.ok(seen, `${leg.id} never fired`);
  }
});

test("sets: 2 parts give a small bonus, 3 parts a big bonus and the set look", () => {
  for (const set of SETS) {
    const slots = Object.keys(set.pieces);
    const make = (n) => {
      const eq = starterParts();
      slots.slice(0, n).forEach((slot) => (eq[slot] = generatePart({ rarity: "epic", budget: 30, rng, slot, set: set.id })));
      return eq;
    };
    const one = make(1);
    const two = make(2);
    const three = make(3);
    assert.equal(activeSetBonuses(one).length, 0);
    assert.equal(activeSetBonuses(two)[0].pieces, 2);
    const stat = set.bonus2[0].stat;
    // compare to the same parts without the set tag
    const untag = (eq) => Object.fromEntries(Object.entries(eq).map(([k, p]) => [k, { ...p, set: null }]));
    assert.ok(carStats(two)[stat] > carStats(untag(two))[stat], `${set.id} 2-piece bonus`);
    assert.ok(carStats(three)[stat] - carStats(untag(three))[stat] > carStats(two)[stat] - carStats(untag(two))[stat], `${set.id} 3-piece bonus is bigger`);
    assert.deepEqual(setLook(two), {});
    assert.deepEqual(setLook(three), set.look);
    assert.ok(carPower(carStats(three)) > carPower(carStats(untag(three))));
  }
});
