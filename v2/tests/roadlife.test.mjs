// Part 25: animals that walk onto the road (with a ⚠ sign first), puddles that only splash, and
// the new Farm and Beach tracks after Space (DESIGN-v2 §4.1).

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import * as rng from "../js/core/rng.js";
import { TRACKS, RACE } from "../js/data/tracks.js";
import { BOSSES } from "../js/data/bosses.js";
import { DECOR } from "../js/data/race-props.js";
import { EN } from "../js/data/i18n/en.js";
import { raceEffects, carStats, evenLevels } from "../js/systems/stats.js";
import { generateCourse } from "../js/games/race/spawner.js";
import { createRace, step } from "../js/games/race/physics.js";
import { setup, openGame, screenshot, WIDTHS } from "./helpers.mjs";

const track = (id) => TRACKS.find((t) => t.id === id);
const starter = raceEffects(carStats(evenLevels(1)));
const strong = raceEffects(carStats(evenLevels(40)));

test("Farm and Beach come after Space, each with a boss, decor and English names", () => {
  assert.deepEqual(TRACKS.map((t) => t.id).slice(-3), ["space", "farm", "beach"]);
  for (const id of ["farm", "beach"]) {
    const t = track(id);
    assert.ok(BOSSES.some((b) => b.track === id), `boss of ${id}`);
    assert.ok(DECOR[id], `decor of ${id}`);
    assert.ok(EN[t.name], `English name of ${t.name}`);
    assert.ok(EN[BOSSES.find((b) => b.track === id).name], `English boss name on ${id}`);
  }
  assert.ok(track("beach").rivalBase > track("farm").rivalBase && track("farm").rivalBase > track("space").rivalBase, "harder after Space");
  for (const text of ["Pozor, zvieratko na ceste! Obíď ho.", "Hop! Zvieratko uskočilo. Nabudúce ho obíď.", "Čľap!"]) assert.ok(EN[text], text);
});

test("every animal has a ⚠ sign before it on its side and stops in a lane that leaves one free", () => {
  let animals = 0;
  for (const t of TRACKS.filter((tr) => tr.animals?.length)) {
    for (let seed = 1; seed <= 8; seed++) {
      rng.setSeed(seed);
      const objs = generateCourse({ track: t, level: 4, length: 1000, rng });
      for (const a of objs.filter((o) => o.kind === "animal")) {
        animals++;
        const sign = objs.find((o) => o.kind === "sign" && Math.abs(o.d - (a.d - RACE.animalSign)) < 0.01);
        assert.ok(sign && sign.icon === a.icon, `${t.id}: sign before ${a.icon}`);
        assert.ok((a.dir > 0 && sign.x < 0 && a.x < 0) || (a.dir < 0 && sign.x > t.lanes - 1 && a.x > t.lanes - 1), `${t.id}: animal and sign wait on the same side`);
        assert.ok(a.goal >= 0 && a.goal < t.lanes);
        const near = objs.filter((o) => o.kind === "obstacle" && o.d > a.d - 16 && o.d < a.d + 4);
        assert.equal(near.length, 0, `${t.id}: nothing else blocks the road at the animal`);
      }
      for (const pd of objs.filter((o) => o.kind === "puddle")) {
        assert.ok(!objs.some((o) => (o.kind === "obstacle" || o.kind === "animal") && Math.abs(o.d - pd.d) < 10), `${t.id}: a puddle is never at an obstacle`);
        assert.equal(pd.color, t.puddle);
      }
    }
  }
  assert.ok(animals > 30, `enough animals (${animals})`);
});

/** A race with one object ahead, the player driving straight in `lane`. */
function lone(trackId, kind, effects, avoid = false) {
  rng.setSeed(3);
  const race = createRace({ track: track(trackId), level: 1, effects, rng });
  const all = generateCourse({ track: { ...track(trackId), animals: [track(trackId).animals[0]] }, level: 5, length: 1000, rng });
  const obj = all.find((o) => o.kind === kind);
  race.objects = [obj, ...all.filter((o) => o.kind === "sign" && o.icon === obj.icon && o.d < obj.d && o.d > obj.d - 20)];
  race.player.lane = race.player.x = avoid ? (obj.goal + 1) % race.lanes : obj.goal;
  race.player.d = obj.d - 150;
  race.phase = "racing";
  const events = [];
  for (let i = 0; i < 1200 && race.player.d < obj.d + 10; i++) {
    step(race, 1 / 60);
    events.push(...race.events.splice(0));
    if (kind === "animal" && race.player.d > obj.d - 6 && race.player.d < obj.d - 5) obj.atArrival = obj.x;
  }
  return { race, obj, events };
}

test("an animal is in its lane before the car arrives, even with the fastest car", () => {
  for (const t of TRACKS.filter((tr) => tr.animals?.length)) {
    for (const effects of [starter, strong]) {
      const { obj, events } = lone(t.id, "animal", effects, true);
      assert.ok(events.some((e) => e.type === "animal"), `${t.id}: the animal starts walking (sound, speech)`);
      assert.ok(Math.abs(obj.atArrival - obj.goal) < 0.05, `${t.id}: stands in lane ${obj.goal}, not ${obj.atArrival}`);
    }
  }
});

test("driving into an animal: it hops away and the car slows; a puddle only splashes", () => {
  const hit = lone("farm", "animal", { ...starter, shields: 0 });
  assert.ok(hit.obj.hit && hit.events.some((e) => e.type === "hop") && hit.race.player.hits === 1);
  const pud = lone("beach", "puddle", starter);
  assert.ok(pud.obj.splashed && pud.events.some((e) => e.type === "splash"));
  assert.equal(pud.race.player.hits, 0);
  assert.equal(pud.race.player.slowT, 0);
});

// ---------- browser ----------

let env;
before(async () => {
  env = await setup();
});
after(async () => {
  await env.teardown();
});

for (const width of WIDTHS) {
  test(`${width}px: eight tracks on the race screen, Farm and Beach race with an animal`, async () => {
    const all = Object.fromEntries(TRACKS.map((t) => [t.id, { unlocked: 2, best: { 1: 1 }, challenge: 0, races: 1 }]));
    const page = await openGame(env.browser, env.server.url, { width, storage: { version: 18, settings: { sound: false, voice: false, motion: false }, cheats: { shortRaces: true }, races: { tracks: all } }, hash: "#/races" });
    await page.getByTestId("track-beach").waitFor();
    assert.equal(await page.locator(".track-card").count(), 8);
    await screenshot(page, `${width}-races-8`);
    for (const id of ["farm", "beach"]) {
      await page.evaluate((id) => (location.hash = `#/game/race/${id}/2`), id);
      await page.waitForFunction(() => window.__game.race?.phase === "racing", null, { timeout: 30000 });
      await page.evaluate(() => {
        const r = window.__game.race;
        const a = r.objects.find((o) => o.kind === "animal" && o.d > r.player.d + 40);
        if (a) r.player.d = a.d - 40;
      });
      await page.waitForTimeout(700);
      await screenshot(page, `${width}-race-${id}`);
      await page.evaluate(() => (location.hash = "#/races"));
      await page.getByTestId("track-beach").waitFor();
    }
    assert.deepEqual(page.errors, []);
    await page.context().close();
  });
}
