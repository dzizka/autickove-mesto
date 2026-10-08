// Part 8: fixes after the first play-test (DESIGN-v2 §4.1, §4.3, §4.5).

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { RACE, TRACKS } from "../js/data/tracks.js";
import { makeView, clearViewMetres, LANE, CAM_H } from "../js/games/race/road.js";
import { createRace, step, visibleScale } from "../js/games/race/physics.js";
import { raceEffects, carStats, evenLevels } from "../js/systems/stats.js";
import * as rng from "../js/core/rng.js";
import { setup, openGame } from "./helpers.mjs";

const quiet = { settings: { sound: false, voice: false } };

test("a child has at least 1 s to react on every track, also at night", () => {
  const capped = RACE.baseSpeed * RACE.visibleCap;
  for (const t of TRACKS) {
    const seconds = clearViewMetres(t, 1) / capped;
    assert.ok(seconds >= 1, `${t.id}: ${seconds.toFixed(2)} s`);
  }
  const night = TRACKS.find((t) => t.scene.night);
  assert.ok(clearViewMetres(night, 2) > clearViewMetres(night, 1) * 1.3, "Svetlomet sees further at night");
});

// phones are played upright; tablets and computers either way
test("lanes and the car are big enough on every screen", () => {
  for (const [w, h] of [[390, 844], [360, 740], [768, 1024], [1024, 768], [1280, 800], [1920, 1080]]) {
    const V = makeView(w, h);
    const lanePx = (LANE * V.KX) / CAM_H;
    assert.ok(lanePx >= 60, `${w}×${h}: lane ${lanePx.toFixed(0)} px`);
    assert.ok(V.carPx >= 60, `${w}×${h}: car ${V.carPx.toFixed(0)} px`);
    assert.ok(V.horizon > 0 && V.carY < h, `${w}×${h}: horizon and car on screen`);
  }
});

test("a strong car moves on screen no faster than the cap, but still wins by more", () => {
  const strong = raceEffects(carStats(evenLevels(40)));
  const starter = raceEffects(carStats(evenLevels(1)));
  assert.ok(strong.topSpeed > RACE.baseSpeed * RACE.visibleCap * 1.2, "the test car really is fast");
  assert.equal(visibleScale(starter.topSpeed), 1);
  for (const effects of [strong, starter]) {
    rng.setSeed(3);
    const race = createRace({ track: TRACKS[0], level: 1, effects, rng });
    for (let i = 0; i < 200; i++) step(race, 0.05); // countdown + 7 s of racing
    const d0 = race.player.d;
    for (let i = 0; i < 20; i++) step(race, 0.05); // 1 s
    const onScreen = race.player.d - d0;
    assert.ok(onScreen <= RACE.baseSpeed * RACE.visibleCap * 1.01, `moves ${onScreen.toFixed(1)} m/s on screen`);
  }
  // relative to the rivals the strong car still pulls away faster
  rng.setSeed(4);
  const race = createRace({ track: TRACKS[0], level: 1, effects: strong, rng });
  while (race.phase !== "finished") step(race, 0.05);
  assert.equal(race.place, 1);
  const behind = Math.min(...race.rivals.map((r) => race.length - r.d));
  assert.ok(behind > 50, `rivals far behind at the finish (${behind.toFixed(0)} m)`);
});

let env;
before(async () => {
  env = await setup();
});
after(async () => {
  await env.teardown();
});

test("the chest waits for the child's tap", async () => {
  const page = await openGame(env.browser, env.server.url, { storage: { ...quiet, cheats: { shortRaces: true } } });
  await page.evaluate(() => {
    window.__game.testTimeScale = 8;
    location.hash = "#/game/race/city/1";
  });
  await page.getByTestId("chest").waitFor({ timeout: 40000 });
  await page.waitForTimeout(3000);
  assert.equal(await page.locator(".chest.open").count(), 0, "still closed after 3 s");
  await page.getByTestId("chest").click();
  await page.getByTestId("chest-scrap").waitFor();
  assert.match(await page.getByTestId("chest-scrap").textContent(), /\+\d+/, "scrap as a number with +");
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
