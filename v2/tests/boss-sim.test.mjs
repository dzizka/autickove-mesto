// Part 4 in Node: every boss can be beaten (DESIGN-v2 §9 "done when"), boss throws are always
// dodgeable, every part ability (garage B, §4.4) does something visible.

import { test } from "node:test";
import assert from "node:assert/strict";
import * as rng from "../js/core/rng.js";
import { TRACKS, RACE } from "../js/data/tracks.js";
import { BOSSES } from "../js/data/bosses.js";
import { LEGENDARIES } from "../js/data/legendaries.js";
import { SLOT_ABILITIES, GARAGE } from "../js/data/garage.js";
import { raceEffects, carStats, carPower, recommendedPower, carAbilities, evenLevels } from "../js/systems/stats.js";
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

/** An evenly built car whose power reaches the recommended power of the level (🟢). */
function greenCar(trackId, level) {
  const need = recommendedPower(trackId, level);
  let l = 1;
  while (l < GARAGE.maxLevel && carPower(carStats(evenLevels(l))) < need) l++;
  return evenLevels(l);
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
  const wins = SEEDS.filter((seed) => runBoss({ boss, level: 1, equipped: evenLevels(1), seed }).race.place === 1).length;
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
        assert.ok(blocked.size < race.lanes, "all lanes blocked by a throw");
      }
      race.events.length = 0;
    }
  }
});

test("12 part abilities, two per part, each one shows up in a race", () => {
  assert.equal(LEGENDARIES.length, 12);
  assert.deepEqual(Object.values(SLOT_ABILITIES).flat().sort(), LEGENDARIES.map((l) => l.id).sort(), "every ability belongs to exactly one part level");
  const numeric = { iceShield: "gripOnSnow", headlight: "lightRange", superMagnet: "magnetLanes", endlessTank: "fuelDrain", bubble: "shields" };
  const starter = carStats(evenLevels(1));
  const base = raceEffects(starter);
  for (const leg of LEGENDARIES) {
    const abilities = new Set([leg.id]);
    const fx = raceEffects(starter, abilities);
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

test("abilities come with the part level: none at 5, six at 6, all twelve at 14", () => {
  assert.equal(carAbilities(evenLevels(5)).size, 0);
  assert.deepEqual([...carAbilities(evenLevels(6))].sort(), Object.values(SLOT_ABILITIES).map((a) => a[0]).sort());
  assert.equal(carAbilities(evenLevels(13)).size, 6);
  assert.equal(carAbilities(evenLevels(14)).size, 12);
  assert.deepEqual([...carAbilities({ ...evenLevels(1), engine: 14 })].sort(), [...SLOT_ABILITIES.engine].sort());
});
