// Part 4 in the browser: the boss button, every boss race to the chest with a sure epic (or
// legendary) part and an egg, legendary abilities in real races, and the set book.

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

async function superCar(page) {
  await page.evaluate(async () => {
    const loot = await import("./js/systems/loot.js");
    window.__game.state.update((s) => (s.car.equipped = loot.testParts(100, "epic")));
  });
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

test("every boss: race, win, sure epic or legendary prize and an egg", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 390, storage: quiet });
  await superCar(page);
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
    const prize = await page.locator(".chest-parts .boss-prize").getAttribute("data-rarity");
    assert.ok(prize === "epic" || prize === "legendary", `${track}: prize ${prize}`);
    await page.getByTestId("reward-home").click();
    await page.getByTestId("screen-home").waitFor();
  }
  const s = await page.evaluate(() => window.__game.state.getState());
  assert.equal(s.eggs.length, 6);
  assert.deepEqual(await page.evaluate(() => window.__game.loopStats), { caughtErrors: 0, crashes: 0 });
  assert.deepEqual(page.errors.filter((e) => !e.includes("speech")), []);
  await page.context().close();
});

test("all 12 legendary abilities in real races without a single error", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 390, storage: { ...quiet, cheats: { shortRaces: false } } });
  const groups = await page.evaluate(async () => {
    const { LEGENDARIES } = await import("./js/data/legendaries.js");
    // one legendary per slot per run → as many runs as needed
    const runs = [];
    for (const leg of LEGENDARIES) {
      let run = runs.find((r) => !r.some((l) => l.slot === leg.slot));
      if (!run) runs.push((run = []));
      run.push(leg);
    }
    return runs.map((r) => r.map((l) => l.id));
  });
  for (const [i, ids] of groups.entries()) {
    for (const track of ["night", "snow"]) {
      await page.evaluate(async (ids) => {
        const loot = await import("./js/systems/loot.js");
        const { LEGENDARIES } = await import("./js/data/legendaries.js");
        window.__game.state.update((s) => {
          s.car.equipped = loot.starterParts();
          for (const id of ids) {
            const def = LEGENDARIES.find((l) => l.id === id);
            s.car.equipped[def.slot] = loot.generatePart({ rarity: "legendary", budget: 40, rng: window.__game.rng, legendary: id });
          }
          for (const t of ["night", "snow"]) s.races.tracks[t] = { unlocked: 1, best: { 1: 1 }, challenge: 0, races: 0 };
          s.races.tracks.desert = { unlocked: 1, best: { 1: 1 }, challenge: 0, races: 0 };
          s.races.tracks.forest = { unlocked: 1, best: { 1: 1 }, challenge: 0, races: 0 };
          s.races.tracks.city = { unlocked: 1, best: { 1: 1 }, challenge: 0, races: 0 };
        });
        window.__game.testTimeScale = 8;
      }, ids);
      await page.evaluate((t) => (location.hash = `#/game/race/${t}/1`), track);
      await page.locator(`[data-testid=screen-game-race][data-track=${track}]`).waitFor();
      await page.waitForFunction(() => window.__game.race?.phase === "racing");
      await page.waitForTimeout(3000); // ≈ 24 s of race time: coin rain, bubbles, stars…
      if (i === 0 && track === "night") await screenshot(page, "390-race-legendaries");
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

test("set book: found pieces light up, a full set shows its bonus and look in the garage", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 1280, storage: quiet, hash: "#/garage" });
  await page.evaluate(async () => {
    const loot = await import("./js/systems/loot.js");
    const garage = await import("./js/systems/garage.js");
    const rng = window.__game.rng;
    garage.addParts(["engine", "tires", "bumper"].map((slot) => loot.generatePart({ rarity: "epic", budget: 60, rng, slot, set: "police" })));
    garage.addParts([loot.generatePart({ rarity: "epic", budget: 60, rng, slot: "magnet", set: "space" })]);
    garage.addParts([loot.generatePart({ rarity: "legendary", budget: 60, rng, legendary: "ghost" })]);
  });
  await page.evaluate(() => (location.hash = "#/races"));
  await page.evaluate(() => (location.hash = "#/garage"));
  await page.getByTestId("open-sets").click();
  await page.getByTestId("set-book").waitFor();
  assert.equal(await page.locator("[data-testid=set-police] .set-piece.found").count(), 3);
  assert.equal(await page.locator("[data-testid=set-space] .set-piece.found").count(), 1);
  assert.equal(await page.locator("[data-testid=set-fire] .set-piece.found").count(), 0);
  await screenshot(page, "1280-set-book");
  await page.getByRole("button", { name: "✖" }).click();

  // mount the police set: big bonus, siren on the roof
  for (const slot of ["engine", "tires", "bumper"]) {
    const uid = await page.evaluate((slot) => window.__game.state.getState().inventory.find((p) => p.set === "police" && p.slot === slot).uid, slot);
    await page.getByTestId(`part-${uid}`).click();
    await page.getByTestId("part-equip").click();
  }
  await page.getByTestId("active-set-police").waitFor();
  assert.equal(await page.locator(".lift-car svg").getAttribute("data-roof"), "siren");

  // the legendary shows its ability in the detail
  const ghost = await page.evaluate(() => window.__game.state.getState().inventory.find((p) => p.legendary).uid);
  await page.getByTestId(`part-${ghost}`).click();
  assert.match(await page.getByTestId("part-ability").textContent(), /Duch/);
  await screenshot(page, "1280-legendary-detail");
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test("version-4 saves migrate with empty set book, bosses and eggs", async () => {
  const page = await openGame(env.browser, env.server.url, { storage: { version: 4, coins: 12 } });
  const s = await page.evaluate(() => window.__game.state.getState());
  assert.equal(s.version, await page.evaluate(() => window.__game.state.CURRENT_VERSION));
  assert.deepEqual([s.setsFound, s.bosses, s.eggs, s.legendariesFound], [{}, {}, [], []]);
  await page.context().close();
});
