// Part 4 in the browser: the boss button, every boss race to the chest with a sure golden
// part and an egg, and the 12 part abilities (garage B, §4.4) in real races.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { setup, openGame, screenshot } from "./helpers.mjs";

let env;
before(async () => {
  env = await setup();
});
after(async () => {
  await env.teardown();
});

const quiet = { settings: { sound: false, voice: false }, cheats: { shortRaces: true } };
const TRACKS = ["city", "forest", "desert", "snow", "night", "space"];

/** The careful driver from the Node tests, run inside the page through key presses. */
async function startDriver(page) {
  await page.evaluate(() => {
    const g = window.__game;
    clearInterval(g.__drive);
    g.__drive = setInterval(() => {
      const r = g.race;
      if (!r || r.phase !== "racing") return;
      const p = r.player;
      const blocked = (lane) => r.objects.some((o) => (o.kind === "obstacle" || o.kind === "traffic") && !o.hit && Math.abs(o.x - lane) < 0.7 && o.d > p.d - 2 && o.d < p.d + p.speed * 1.1 + 8);
      if (Math.abs(p.x - p.lane) < 0.2 && blocked(p.lane)) {
        const to = [p.lane - 1, p.lane + 1].find((l) => l >= 0 && l < 3 && !blocked(l));
        if (to !== undefined) window.dispatchEvent(new KeyboardEvent("keydown", { key: to < p.lane ? "ArrowLeft" : "ArrowRight" }));
      }
    }, 25);
  });
}

/** Every part of the chosen car on `level`. */
async function carLevel(page, level) {
  await page.evaluate(async (level) => (await import("./js/systems/garage.js")).setAllLevels(level), level);
}

test("boss button: locked until the challenge bar is full, then it glows", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 390, storage: quiet, hash: "#/races" });
  await page.getByTestId("screen-races").waitFor();
  assert.equal(await page.getByTestId("boss-start").getAttribute("data-ready"), "false");
  await page.getByTestId("boss-start").click();
  assert.equal(await page.locator("[data-testid=screen-game-race]").count(), 0, "locked boss does not start");
  await page.evaluate(() => window.__game.state.update((s) => (s.races.tracks.city = { unlocked: 1, best: {}, challenge: 3, races: 3 })));
  await page.evaluate(() => (location.hash = "#/home"));
  await page.evaluate(() => (location.hash = "#/races"));
  assert.equal(await page.getByTestId("boss-start").getAttribute("data-ready"), "true");
  await screenshot(page, "390-races-boss-ready");
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test("every boss: race, win, sure golden part and an egg", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 390, storage: quiet });
  await carLevel(page, 38);
  for (const track of TRACKS) {
    await page.evaluate((track) => {
      window.__game.state.update((s) => {
        for (const id of ["city", "forest", "desert", "snow", "night", "space"]) s.races.tracks[id] = { unlocked: 5, best: { 1: 1 }, challenge: id === track ? 3 : 0, races: 3 };
      });
      window.__game.testTimeScale = 5;
      location.hash = "#/races";
    }, track);
    await page.getByTestId(`track-${track}`).click();
    await page.getByTestId("boss-start").click();
    await page.locator(`[data-testid=screen-game-race][data-track=${track}]:not([data-boss=""])`).waitFor();
    await startDriver(page);
    await page.waitForFunction(() => window.__game.race?.phase === "racing");
    await page.waitForTimeout(1200);
    if (track === "city" || track === "night") await screenshot(page, `390-boss-${track}`);
    await page.getByTestId("reward-modal").waitFor({ timeout: 40000 });
    await page.getByTestId("chest").click();
    await page.getByTestId("chest-egg").waitFor();
    if (track === "city") {
      await page.waitForTimeout(1500);
      await screenshot(page, "390-boss-chest");
    }
    const s = await page.evaluate(() => window.__game.state.getState());
    assert.equal(s.bosses[track], 1, `${track} boss counted as beaten`);
    assert.equal(s.races.tracks[track].challenge, 0, "challenge bar emptied");
    assert.equal(await page.getByTestId("chest-golden").count(), 1, `${track}: a golden part`);
    await carLevel(page, 38); // the golden part upgraded one part to 40: back for the next boss
    await page.getByTestId("reward-home").click();
    await page.getByTestId("screen-home").waitFor();
  }
  const s = await page.evaluate(() => window.__game.state.getState());
  assert.equal(s.eggs.length, 6);
  assert.deepEqual(await page.evaluate(() => window.__game.loopStats), { caughtErrors: 0, crashes: 0 });
  assert.deepEqual(page.errors.filter((e) => !e.includes("speech")), []);
  await page.context().close();
});

test("all 12 part abilities in real races without a single error", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 390, storage: { ...quiet, cheats: { shortRaces: false } } });
  // level 11: the first ability of every part; level 27: both abilities of every part
  for (const [i, level] of [11, 27].entries()) {
    for (const track of ["night", "snow"]) {
      await carLevel(page, level);
      const ids = await page.evaluate(async (level) => {
        const { SLOT_ABILITIES } = await import("./js/data/garage.js");
        window.__game.state.update((s) => {
          for (const t of ["city", "forest", "desert", "night", "snow"]) s.races.tracks[t] = { unlocked: 1, best: { 1: 1 }, challenge: 0, races: 0 };
        });
        window.__game.testTimeScale = 8;
        return Object.values(SLOT_ABILITIES).flatMap((a) => (level >= 27 ? a : [a[0]]));
      }, level);
      await page.evaluate((t) => (location.hash = `#/game/race/${t}/1`), track);
      await page.locator(`[data-testid=screen-game-race][data-track=${track}]`).waitFor();
      await page.waitForFunction(() => window.__game.race?.phase === "racing");
      await page.waitForTimeout(3000); // ≈ 24 s of race time: coin rain, bubbles, stars…
      if (i === 1 && track === "night") await screenshot(page, "390-race-legendaries");
      const info = await page.evaluate(() => ({ ab: [...window.__game.race.abilities], stats: window.__game.loopStats }));
      assert.deepEqual(info.ab.sort(), [...ids].sort());
      assert.deepEqual(info.stats, { caughtErrors: 0, crashes: 0 }, ids.join(","));
      await page.evaluate(() => (location.hash = "#/home"));
      await page.getByTestId("screen-home").waitFor();
    }
  }
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test("version-4 saves migrate to the current schema with no bosses and eggs yet", async () => {
  const page = await openGame(env.browser, env.server.url, { storage: { version: 4, coins: 12 } });
  const s = await page.evaluate(() => window.__game.state.getState());
  assert.equal(s.version, await page.evaluate(() => window.__game.state.CURRENT_VERSION));
  assert.deepEqual([s.bosses, s.eggs, s.cars], [{}, [], {}]);
  assert.ok(!("setsFound" in s) && !("inventory" in s));
  await page.context().close();
});
