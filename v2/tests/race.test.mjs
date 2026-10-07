// Races in the browser: selection screen, a full race to the podium and reward,
// and every track × level driven with random steering without a single error (DESIGN-v2 §10).

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { setup, openGame, screenshot, WIDTHS, openChest } from "./helpers.mjs";

const TRACKS = ["city", "forest", "desert", "snow", "night", "space"];
let env;
before(async () => {
  env = await setup();
});
after(async () => {
  await env.teardown();
});

const fresh = { version: 2, cheats: { shortRaces: true }, settings: { sound: false, voice: false } };

for (const width of WIDTHS) {
  test(`race selection and a full race to the podium at ${width}px`, async () => {
    const page = await openGame(env.browser, env.server.url, { width, storage: fresh });
    await page.getByTestId("home-races").click();
    await page.getByTestId("screen-races").waitFor();
    // starter car: City level 1 is green, forest locked
    assert.equal(await page.getByTestId("level-1").getAttribute("data-light"), "green");
    assert.match(await page.getByTestId("track-forest").getAttribute("class"), /locked/);
    await screenshot(page, `${width}-races`);

    await page.evaluate(() => {
      window.__game.rng.setSeed(3);
      window.__game.testTimeScale = 3;
    });
    await page.getByTestId("race-start").click();
    await page.getByTestId("screen-game-race").waitFor();
    await page.waitForTimeout(1500);
    await screenshot(page, `${width}-race-city`);
    // drive: dodge with the keyboard like the careful bot would
    await page.evaluate(() => {
      const g = window.__game;
      g.__drive = setInterval(() => {
        const r = g.race;
        if (!r || r.phase !== "racing") return;
        const p = r.player;
        const blocked = (lane) => r.objects.some((o) => (o.kind === "obstacle" || o.kind === "traffic") && !o.hit && Math.abs(o.x - lane) < 0.7 && o.d > p.d - 2 && o.d < p.d + p.speed * 1.1 + 8);
        if (Math.abs(p.x - p.lane) < 0.2 && blocked(p.lane)) {
          const to = [p.lane - 1, p.lane + 1].find((l) => l >= 0 && l < 3 && !blocked(l));
          if (to !== undefined) window.dispatchEvent(new KeyboardEvent("keydown", { key: to < p.lane ? "ArrowLeft" : "ArrowRight" }));
        }
      }, 30);
    });
    await page.getByTestId("podium").waitFor({ timeout: 30000 });
    const place = Number(await page.getByTestId("podium").getAttribute("data-place"));
    await screenshot(page, `${width}-podium`);
    await page.getByTestId("reward-modal").waitFor({ timeout: 8000 });
    await screenshot(page, `${width}-race-reward`);
    await page.evaluate(() => clearInterval(window.__game.__drive));

    const s = await page.evaluate(() => window.__game.state.getState());
    assert.equal(s.races.total, 1);
    assert.equal(s.races.tracks.city.best[1], place);
    assert.ok(s.coins > 0, "coins credited");
    if (place === 1) assert.equal(s.races.tracks.city.unlocked, 2);
    assert.equal(s.races.tracks.city.challenge, 1);
    assert.deepEqual(await page.evaluate(() => window.__game.loopStats), { caughtErrors: 0, crashes: 0 });

    await openChest(page);
    await page.getByTestId("reward-home").click();
    await page.getByTestId("screen-home").waitFor();
    assert.deepEqual(page.errors, []);
    await page.context().close();
  });
}

test("every track × level drives 20 s with random steering, no errors", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 390, storage: { ...fresh, cheats: { shortRaces: false } } });
  await page.evaluate(() => window.__game.state.update((s) => (s.races.tracks = Object.fromEntries(["city", "forest", "desert", "snow", "night", "space"].map((id) => [id, { unlocked: 5, best: { 1: 1 }, challenge: 0, races: 0 }])))));
  for (const track of TRACKS) {
    for (let level = 1; level <= 5; level++) {
      await page.evaluate(({ track, level }) => {
        window.__game.testTimeScale = 8;
        location.hash = `#/game/race/${track}/${level}`;
      }, { track, level });
      await page.locator(`[data-testid=screen-game-race][data-track=${track}][data-level="${level}"]`).waitFor();
      await page.evaluate(() => {
        window.__game.__rand = setInterval(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: Math.random() < 0.5 ? "ArrowLeft" : "ArrowRight" })), 60);
      });
      await page.waitForTimeout(2600); // ≈ 20 s of race time
      if (level === 3) await screenshot(page, `390-track-${track}`);
      const info = await page.evaluate(() => {
        clearInterval(window.__game.__rand);
        const r = window.__game.race;
        return { d: r?.player.d, phase: r?.phase, stats: window.__game.loopStats };
      });
      assert.ok(info.d > 100, `${track} ${level}: car did not move (${info.d})`);
      assert.deepEqual(info.stats, { caughtErrors: 0, crashes: 0 }, `${track} ${level}`);
      await page.evaluate(() => (location.hash = "#/home"));
      await page.getByTestId("screen-home").waitFor();
    }
  }
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test("stats are visible in the race: a strong car starts with shields and is faster", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 1280, storage: fresh });
  const measure = async () => {
    await page.evaluate(() => {
      window.__game.testTimeScale = 1;
      location.hash = "#/game/race/city/1";
    });
    await page.getByTestId("screen-game-race").waitFor();
    await page.waitForFunction(() => window.__game.race?.phase === "racing");
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => ({ shields: window.__game.race.effects.shields, speed: window.__game.race.player.speed }));
    await page.evaluate(() => (location.hash = "#/home"));
    await page.getByTestId("screen-home").waitFor();
    return r;
  };
  const weak = await measure();
  await page.evaluate(() => window.__game.state.update((s) => (s.car.equipped = Object.fromEntries(Object.entries(s.car.equipped).map(([k, p]) => [k, { ...p, main: { ...p.main, value: 100 } }])))));
  await page.evaluate(() => (location.hash = "#/game/race/city/1"));
  await page.waitForFunction(() => window.__game.race?.phase === "racing");
  await page.waitForTimeout(1200);
  await screenshot(page, "1280-race-strong");
  await page.evaluate(() => (location.hash = "#/home"));
  await page.getByTestId("screen-home").waitFor();
  const strong = await measure();
  assert.equal(weak.shields, 0);
  assert.ok(strong.shields >= 3, `shields ${strong.shields}`);
  assert.ok(strong.speed > weak.speed * 1.2, `${strong.speed} vs ${weak.speed}`);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test("version-1 saves migrate to the current schema with the starter car", async () => {
  const page = await openGame(env.browser, env.server.url, { storage: { version: 1, coins: 70, settings: { sound: true, voice: false } } });
  const s = await page.evaluate(() => window.__game.state.getState());
  assert.equal(s.version, await page.evaluate(() => window.__game.state.CURRENT_VERSION));
  assert.equal(s.coins, 70);
  assert.equal(Object.keys(s.car.equipped).length, 6);
  for (const part of Object.values(s.car.equipped)) assert.ok(part.main && part.main.value > 0);
  assert.deepEqual(s.races, { tracks: {}, total: 0, wins: 0 });
  await page.context().close();
});
