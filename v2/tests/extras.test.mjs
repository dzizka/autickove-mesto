// Part 7 (DESIGN-v2 §8): quests on the home screen, trophies, the parents' overview.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { QUESTS, QUEST_SLOTS } from "../js/data/quests.js";
import { TROPHIES } from "../js/data/trophies.js";
import { setup, openGame, screenshot, WIDTHS, openChest } from "./helpers.mjs";

let env;
before(async () => {
  env = await setup();
});
after(async () => {
  await env.teardown();
});

const quiet = { settings: { sound: false, voice: false }, cheats: { shortRaces: true } };

test("data: quest and trophy ids are unique, every quest has a reward and a spoken text", () => {
  assert.equal(new Set(QUESTS.map((q) => q.id)).size, QUESTS.length);
  assert.equal(new Set(TROPHIES.map((t) => t.id)).size, TROPHIES.length);
  for (const q of QUESTS) assert.ok(q.reward.coins > 0 && q.say && q.target > 0, q.id);
  assert.ok(TROPHIES.length >= 15);
  assert.equal(QUEST_SLOTS, 3);
});

test("3 quests on the home screen; races move them; a finished quest pays out and is replaced", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 390, storage: { ...quiet, coins: 0 } });
  await page.getByTestId("quests").waitFor();
  let active = await page.evaluate(() => window.__game.state.getState().quests.active);
  assert.equal(active.length, 3);
  assert.equal(new Set(active.map((q) => q.id)).size, 3);
  // force a race quest in and drive a race
  await page.evaluate(() => window.__game.state.update((s) => (s.quests.active = [{ id: "race3", progress: 2 }, { id: "paint1", progress: 0 }, { id: "upgrade1", progress: 0 }])));
  await page.evaluate(() => {
    window.__game.testTimeScale = 6;
    location.hash = "#/game/race/city/1";
  });
  await page.getByTestId("reward-modal").waitFor({ timeout: 40000 });
  await openChest(page);
  await page.getByTestId("reward-home").click();
  await page.getByTestId("screen-home").waitFor();
  await screenshot(page, "390-home-quests");
  assert.equal(await page.getByTestId("quest-race3").getAttribute("data-done"), "true");
  const coinsBefore = await page.evaluate(() => window.__game.state.getState().coins);
  await page.getByTestId("quest-race3").click();
  const s = await page.evaluate(() => window.__game.state.getState());
  assert.equal(s.coins, coinsBefore + 50);
  assert.equal(s.quests.done, 1);
  assert.equal(s.quests.active.length, 3);
  assert.ok(!s.quests.active.some((q) => q.id === "race3"), "the claimed quest was replaced");
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test("garage and colouring events count for quests", async () => {
  const page = await openGame(env.browser, env.server.url, { storage: { ...quiet, coins: 1000 } });
  const r = await page.evaluate(async () => {
    const q = await import("./js/systems/quests.js");
    const loot = await import("./js/systems/loot.js");
    const garage = await import("./js/systems/garage.js");
    const tuning = await import("./js/systems/tuning.js");
    const g = window.__game;
    g.state.update((s) => (s.quests.active = [{ id: "dismantle3", progress: 0 }, { id: "equip1", progress: 0 }, { id: "tune1", progress: 0 }]));
    garage.addParts(Array.from({ length: 3 }, () => loot.generatePart({ rarity: "common", budget: 2, rng: g.rng })));
    garage.addParts([loot.generatePart({ rarity: "epic", budget: 80, rng: g.rng, slot: "engine" })]);
    garage.dismantleLow();
    garage.equipBest();
    tuning.buy("color", "blue");
    return g.state.getState().quests.active.map((x) => [x.id, q.isDone(x)]);
  });
  assert.deepEqual(r, [["dismantle3", true], ["equip1", true], ["tune1", true]]);
  await page.context().close();
});

for (const width of WIDTHS) {
  test(`trophies: old progress earns trophies, shelf at ${width}px`, async () => {
    const page = await openGame(env.browser, env.server.url, { width, storage: { ...quiet, races: { tracks: {}, total: 12, wins: 11 } } });
    await page.getByTestId("open-trophies").click();
    await page.getByTestId("screen-trophies").waitFor();
    assert.equal(await page.getByTestId("trophy-firstWin").getAttribute("data-earned"), "true");
    assert.equal(await page.getByTestId("trophy-wins10").getAttribute("data-earned"), "true");
    assert.equal(await page.getByTestId("trophy-allBosses").getAttribute("data-earned"), "false");
    await screenshot(page, `${width}-trophies`);
    await page.getByTestId("topbar-home").click();
    await page.waitForTimeout(300);
    assert.equal(await page.locator(".toast").count(), 1, "a new trophy is announced");
    assert.deepEqual(page.errors, []);
    await page.context().close();
  });

  test(`parents' overview at ${width}px: 7 days of play time, games, car`, async () => {
    const page = await openGame(env.browser, env.server.url, { width, storage: quiet });
    await page.evaluate(async () => {
      const { dayKey } = await import("./js/systems/progress.js");
      window.__game.state.update((s) => {
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          s.playLog[dayKey(d)] = { seconds: (i + 1) * 300, games: { race: i + 2, coloring: i } };
        }
      });
    });
    await page.getByTestId("gear").click();
    await page.getByTestId("open-parents").click();
    await page.getByTestId("screen-parents").waitFor();
    await screenshot(page, `${width}-parents`);
    assert.equal(await page.locator(".pa-col").count(), 7);
    assert.match(await page.getByTestId("screen-parents").textContent(), /Spolu 140 min/);
    assert.match(await page.getByTestId("screen-parents").textContent(), /Preteky35×/);
    assert.match(await page.getByTestId("parents-car").textContent(), /Sila auta48/);
    await page.getByTestId("back-home").click();
    await page.getByTestId("screen-home").waitFor();
    assert.deepEqual(page.errors, []);
    await page.context().close();
  });
}

test("version-7 saves migrate to the current schema with quests and trophies", async () => {
  const page = await openGame(env.browser, env.server.url, { storage: { version: 7, coins: 3 } });
  const s = await page.evaluate(() => window.__game.state.getState());
  assert.equal(s.version, await page.evaluate(() => window.__game.state.CURRENT_VERSION));
  assert.equal(s.quests.active.length, 3, "quests are filled on start");
  assert.deepEqual(s.trophies, {});
  await page.context().close();
});
