// Race balance in Node (no browser): stats must be felt (DESIGN-v2 §4.3, part 1 "done when"),
// the easiest track is winnable with the starter car (§1), and the course is always passable (§3).

import { test } from "node:test";
import assert from "node:assert/strict";
import * as rng from "../js/core/rng.js";
import { TRACKS } from "../js/data/tracks.js";
import { raceEffects, carStats, recommendedPower, carPower, difficulty, evenLevels } from "../js/systems/stats.js";
import { generateCourse } from "../js/games/race/spawner.js";
import { createRace, step, finalOrder } from "../js/games/race/physics.js";
import { runRace, carefulBot, randomBot } from "./race-bot.mjs";

const SEEDS = Array.from({ length: 16 }, (_, i) => 1000 + i * 7);
const starter = raceEffects(carStats(evenLevels(1)));
const strong = raceEffects(carStats(evenLevels(20)));
const track = (id) => TRACKS.find((t) => t.id === id);

function stats(trackId, level, effects, driverFactory) {
  let places = 0;
  let wins = 0;
  let time = 0;
  for (const seed of SEEDS) {
    rng.setSeed(seed);
    const race = runRace({ track: track(trackId), level, effects, rng, driver: driverFactory() });
    assert.equal(race.phase, "finished", `race did not finish (${trackId} ${level}, seed ${seed})`);
    places += race.place;
    wins += race.place === 1 ? 1 : 0;
    // race time compared with the rivals: a fast car runs in slow motion on screen (RACE.visibleCap)
    time += race.player.finishTime * race.view;
  }
  return { place: places / SEEDS.length, wins: wins / SEEDS.length, time: time / SEEDS.length };
}

test("the starter car wins the easiest track (City 1) when driving carefully", () => {
  const r = stats("city", 1, starter, () => carefulBot);
  assert.ok(r.wins >= 0.9, `wins only ${Math.round(r.wins * 100)} %`);
});

test("even random tapping on City 1 usually reaches the podium", () => {
  const r = stats("city", 1, starter, randomBot);
  assert.ok(r.place <= 2.5, `average place ${r.place}`);
});

test("a strong car is clearly faster than the starter car on every track", () => {
  for (const t of TRACKS) {
    const weak = stats(t.id, 3, starter, () => carefulBot);
    const good = stats(t.id, 3, strong, () => carefulBot);
    assert.ok(good.time < weak.time * 0.8, `${t.id}: ${good.time.toFixed(1)} s vs ${weak.time.toFixed(1)} s`);
    assert.ok(good.place < weak.place || good.place === 1, `${t.id}: place ${good.place} vs ${weak.place}`);
  }
});

test("the hardest level needs a strong car; the starter car cannot win it", () => {
  const weak = stats("space", 5, starter, () => carefulBot);
  const good = stats("space", 5, strong, () => carefulBot);
  assert.equal(weak.wins, 0);
  assert.ok(good.wins >= 0.6, `strong car wins only ${Math.round(good.wins * 100)} %`);
});

test("recommended power: green for the starter on City 1, red on Space 5", () => {
  const p = carPower(carStats(evenLevels(1)));
  assert.equal(difficulty(p, recommendedPower("city", 1)), "green");
  assert.equal(difficulty(p, recommendedPower("space", 5)), "red");
  const strongPower = carPower(carStats(evenLevels(20)));
  assert.equal(difficulty(strongPower, recommendedPower("space", 5)), "green");
});

test("each stat has a visible effect", () => {
  const base = carStats(evenLevels(1));
  const bump = (stat) => raceEffects({ ...base, [stat]: base[stat] + 60 });
  assert.ok(bump("speed").topSpeed > starter.topSpeed * 1.25);
  assert.ok(bump("handling").laneStiffness > starter.laneStiffness * 2);
  assert.ok(bump("armor").shields >= starter.shields + 2);
  assert.ok(bump("armor").slowTime < starter.slowTime * 0.7);
  assert.ok(bump("fuel").fuelDrain < starter.fuelDrain * 0.6);
  assert.ok(bump("magnet").magnetLanes > starter.magnetLanes + 1);
});

test("handling: a strong car changes lanes faster and slides less on snow", () => {
  const settle = (effects, trackId) => {
    rng.setSeed(5);
    const race = createRace({ track: track(trackId), level: 1, effects, rng });
    race.objects = [];
    race.phase = "racing";
    race.player.lane = 2;
    let t = 0;
    let overshoot = 0;
    while (t < 2 && !(Math.abs(race.player.x - 2) < 0.05 && Math.abs(race.player.vx) < 0.2 && t > 0.05)) {
      step(race, 1 / 60);
      overshoot = Math.max(overshoot, race.player.x - 2);
      t += 1 / 60;
    }
    return { t, overshoot };
  };
  const weakCity = settle(starter, "city");
  const strongCity = settle(strong, "city");
  const weakSnow = settle(starter, "snow");
  const strongSnow = settle(strong, "snow");
  assert.ok(strongCity.t < weakCity.t * 0.75, `${strongCity.t} vs ${weakCity.t}`);
  assert.ok(weakSnow.overshoot > 0.15, `starter car does not slide on snow (${weakSnow.overshoot})`);
  assert.ok(strongSnow.overshoot < weakSnow.overshoot / 2);
});

test("every course row leaves a free lane and all objects have finite coordinates", () => {
  for (const t of TRACKS) {
    for (let level = 1; level <= 5; level++) {
      for (const seed of SEEDS.slice(0, 6)) {
        rng.setSeed(seed);
        const objs = generateCourse({ track: t, level, length: 1000, rng });
        for (const o of objs) {
          for (const key of ["lane", "x", "d", "len", "speed", "fly"]) assert.ok(Number.isFinite(o[key]), `${t.id}: ${o.kind}.${key} = ${o[key]}`);
        }
        const solid = objs.filter((o) => o.kind === "obstacle");
        for (const o of solid) {
          const lanesHere = new Set(solid.filter((s) => Math.abs(s.d - o.d) < 4).map((s) => s.lane));
          assert.ok(lanesHere.size < t.lanes, `${t.id} ${level}: all lanes blocked at ${o.d}`);
        }
      }
    }
  }
});

test("podium order puts every car exactly once and matches the place", () => {
  rng.setSeed(77);
  const race = runRace({ track: track("forest"), level: 2, effects: starter, rng, driver: carefulBot });
  const order = finalOrder(race);
  assert.equal(order.length, 4);
  assert.equal(order.findIndex((r) => r.isPlayer) + 1, race.place);
});
