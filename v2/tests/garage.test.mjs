// Garage B (DESIGN-v2 §4.3–4.8, part 17 "done when": the child upgrades the car without
// reading, and a new car has its own progress). Rules in Node, the screens in the browser.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import * as state from "../js/core/state.js";
import * as rng from "../js/core/rng.js";
import { GARAGE, CHEST, SLOT_ABILITIES } from "../js/data/garage.js";
import { slotStat, levelsOf, activeLevels, carStats, carPower, carAbilities, evenLevels } from "../js/systems/stats.js";
import { upgrade, upgradeCost, canUpgrade, hintSlot, nextAbility, raceScrap, grantRaceLoot, weakestSlot, setAllLevels } from "../js/systems/garage.js";
import { setup, openGame, screenshot, WIDTHS } from "./helpers.mjs";

const quiet = { settings: { sound: false, voice: false } };
const fresh = (extra = {}) => {
  console.warn = () => {}; // no localStorage in Node
  state.replace({ ...state.defaultState(), ...extra });
};

// ---------- rules (Node) ----------

test("levels: stat 8 on level 1, +4 per level; costs grow, level 20 is the end", () => {
  assert.equal(slotStat(1), GARAGE.statBase);
  assert.equal(slotStat(20), GARAGE.statBase + 19 * GARAGE.statPerLevel);
  assert.equal(slotStat(99), slotStat(20), "clamped");
  assert.equal(slotStat(-3), slotStat(1));
  let last = 0;
  for (let l = 1; l < GARAGE.maxLevel; l++) {
    const c = upgradeCost(l);
    assert.ok(Number.isInteger(c) && c >= last && c <= GARAGE.costMax, `cost at ${l}: ${c}`);
    last = c;
  }
  assert.equal(upgradeCost(GARAGE.maxLevel), null);
  assert.equal(carPower(carStats(evenLevels(1))), 48, "starter car power");
  assert.equal(nextAbility("engine", 1).id, SLOT_ABILITIES.engine[0]);
  assert.equal(nextAbility("engine", 6).id, SLOT_ABILITIES.engine[1]);
  assert.equal(nextAbility("engine", 14), null);
});

test("a tap upgrades one part of the chosen car for scrap; no scrap, no upgrade", () => {
  fresh({ scrap: 0 });
  assert.equal(upgrade("engine"), null);
  assert.equal(hintSlot(), null);
  state.update((s) => (s.scrap = upgradeCost(1)));
  assert.ok(canUpgrade("engine"));
  const before = carPower();
  assert.deepEqual(upgrade("engine"), { level: 2, ability: null });
  assert.equal(state.getState().scrap, 0);
  assert.equal(activeLevels().engine, 2);
  assert.equal(carPower() - before, GARAGE.statPerLevel);
  assert.equal(upgrade("nonsense"), null);
});

test("the glowing hint is the cheapest part the child can pay for", () => {
  fresh({ scrap: 1000 });
  state.update((s) => (s.cars[s.look.car] = { ...evenLevels(5), tank: 2 }));
  assert.equal(hintSlot(), "tank");
  assert.equal(weakestSlot(), "tank");
  setAllLevels(20);
  assert.equal(hintSlot(), null, "nothing left to upgrade");
});

test("the ability comes on level 6 and 14 of a part", () => {
  fresh({ scrap: 10000 });
  let got = [];
  for (let i = 0; i < 13; i++) got.push(upgrade("mascot").ability);
  assert.deepEqual(got.filter(Boolean), SLOT_ABILITIES.mascot);
  assert.ok(carAbilities().has("goldCat") && carAbilities().has("ghost"));
});

test("every car keeps its own levels: a new car starts on level 1, the old one keeps its progress", () => {
  fresh({ scrap: 10000 });
  for (let i = 0; i < 5; i++) upgrade("engine");
  const first = state.getState().look.car;
  state.update((s) => (s.look.car = "taxi"));
  assert.deepEqual(activeLevels(), evenLevels(1), "the new car starts from level 1");
  upgrade("tires");
  state.update((s) => (s.look.car = first));
  assert.equal(activeLevels().engine, 6, "back to the old car: progress kept");
  assert.equal(activeLevels().tires, 1);
  assert.equal(levelsOf("taxi").tires, 2);
});

test("chest scrap: more for a better place, track and level; never below the minimum", () => {
  const a = raceScrap({ track: "city", level: 1, place: 1 });
  assert.ok(a >= upgradeCost(1), "the first race pays for the first upgrade");
  assert.ok(raceScrap({ track: "city", level: 1, place: 4 }) >= CHEST.scrapMin);
  assert.ok(raceScrap({ track: "space", level: 5, place: 1 }) > raceScrap({ track: "space", level: 1, place: 1 }));
  assert.ok(raceScrap({ track: "space", level: 1, place: 1 }) > a);
  for (const t of ["city", "space"]) for (let p = 1; p < 4; p++) assert.ok(raceScrap({ track: t, level: 3, place: p }) >= raceScrap({ track: t, level: 3, place: p + 1 }));
  assert.ok(raceScrap({ track: "night", level: 2, place: 1, bossWin: true }) > raceScrap({ track: "night", level: 2, place: 1 }));
});

test("a golden part upgrades the weakest part for free; a beaten boss always gives one", () => {
  fresh();
  state.update((s) => (s.cars[s.look.car] = { ...evenLevels(4), magnet: 2 }));
  rng.setSeed(2);
  const r = grantRaceLoot({ track: "city", level: 1, place: 1, bossWin: true });
  assert.deepEqual(r.golden, { slot: "magnet", level: 3, ability: null });
  assert.equal(r.candy, 1);
  assert.equal(state.getState().scrap, r.scrap);
  let golden = 0;
  for (let i = 0; i < 500; i++) golden += grantRaceLoot({ track: "city", level: 1, place: 2 }).golden ? 1 : 0;
  assert.ok(golden > 10 && golden < 80, `golden parts in 500 chests: ${golden}`);
});

test("v12 → v13: the chosen car gets levels from its parts, bag parts become scrap", () => {
  const part = (slot, value, plus = 0) => ({ uid: slot, slot, rarity: "rare", main: { stat: "x", value }, subs: [], plus });
  const old = {
    version: 12,
    look: { car: "police" },
    scrap: 10,
    car: { equipped: { engine: part("engine", 8), tires: part("tires", 50, 5), bumper: null, tank: part("tank", 500) } },
    inventory: [{ rarity: "common" }, { rarity: "epic" }, { rarity: "legendary" }],
    bagSize: 40,
    setsFound: { police: ["engine"] },
    legendariesFound: ["ghost"],
    loot: { races: 3 },
    trophies: { firstWin: 1, firstEpic: 2, plus5: 3 },
  };
  const s = state.migrate(old);
  assert.equal(s.version, state.CURRENT_VERSION);
  // 50 × (1 + 0.08 × 5) = 70 → 1 + round(62 / 6) = 11
  assert.deepEqual(s.cars.police, { engine: 1, tires: 11, bumper: 1, tank: 20 });
  assert.deepEqual(levelsOf("police", s), { engine: 1, tires: 11, bumper: 1, tank: 20, magnet: 1, mascot: 1 });
  assert.equal(s.scrap, 10 + 1 + 8 + 16);
  for (const k of ["car", "inventory", "bagSize", "setsFound", "legendariesFound", "loot"]) assert.ok(!(k in s), `${k} removed`);
  assert.deepEqual(s.trophies, { firstWin: 1 });
  assert.deepEqual(state.migrate({ version: 12, scrap: "x" }).scrap, 0);
});

// ---------- screens (browser) ----------

let env;
before(async () => {
  env = await setup();
});
after(async () => {
  await env.teardown();
});

const level = (page, slot) => page.getByTestId(`part-${slot}`).getAttribute("data-level").then(Number);
const power = (page) => page.evaluate(() => Number(document.querySelector("[data-testid=car-power] .power-num")?.textContent));

test("after a race the chest shows scrap and the garage button leads to a glowing part", async () => {
  const page = await openGame(env.browser, env.server.url, { storage: { ...quiet, cheats: { shortRaces: true } } });
  await page.evaluate(() => {
    window.__game.rng.setSeed(4);
    window.__game.testTimeScale = 4;
    location.hash = "#/game/race/city/1";
  });
  await page.getByTestId("reward-modal").waitFor({ timeout: 40000 });
  await page.getByTestId("chest").click();
  await page.getByTestId("chest-scrap").waitFor();
  await page.waitForTimeout(1500);
  await screenshot(page, "390-chest");
  const s = await page.evaluate(() => window.__game.state.getState());
  assert.ok(s.scrap >= 3, `scrap ${s.scrap}`);
  assert.match(await page.getByTestId("chest-scrap").textContent(), new RegExp(`\\+${s.scrap}`));
  assert.ok(await page.getByTestId("reward-garage").evaluate((b) => b.classList.contains("pulse")), "garage button glows: an upgrade is affordable");
  await page.getByTestId("reward-garage").click();
  await page.getByTestId("screen-garage").waitFor();
  assert.equal(await page.locator(".part-btn.hint").count(), 1, "one part glows");
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

for (const width of WIDTHS) {
  test(`garage at ${width}px: tap the glowing part, it gets stronger; without scrap nothing happens`, async () => {
    const page = await openGame(env.browser, env.server.url, { width, storage: { ...quiet, scrap: 40 }, hash: "#/garage" });
    await page.getByTestId("screen-garage").waitFor();
    assert.equal(await page.locator(".part-btn").count(), 6);
    assert.equal(await page.locator("[data-testid=stat-panel] .stat-num").count(), 6, "car stats as numbers");
    await screenshot(page, `${width}-garage`);
    // all parts fit on the screen next to the car, big enough for a finger
    for (const b of await page.locator(".part-btn").all()) {
      const box = await b.boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= width + 1, "part button inside the screen");
      assert.ok(box.width >= 64 && box.height >= 64, `part button ${box.width}×${box.height}`);
    }

    const slot = await page.locator(".part-btn.hint").getAttribute("data-slot");
    const p0 = await power(page);
    await page.getByTestId(`part-${slot}`).click();
    assert.equal(await level(page, slot), 2);
    assert.equal(await power(page), p0 + 4);
    assert.equal(await page.evaluate(() => window.__game.state.getState().scrap), 40 - 3);
    await page.locator(".pb-gain").first().waitFor();

    // spend everything: the buttons turn grey and a tap changes nothing
    await page.evaluate(() => window.__game.state.update((s) => (s.scrap = 0)));
    await page.evaluate(() => (location.hash = "#/home"));
    await page.evaluate(() => (location.hash = "#/garage"));
    await page.getByTestId("screen-garage").waitFor();
    assert.equal(await page.locator(".part-btn.can").count(), 0);
    await page.getByTestId("part-engine").click();
    assert.equal(await page.getByTestId("part-engine").evaluate((b) => b.classList.contains("shake")), true);
    assert.equal(await level(page, "engine"), slot === "engine" ? 2 : 1);

    // the levels survive a reload
    await page.evaluate(() => window.__game.state.saveNow());
    await page.reload();
    await page.getByTestId("screen-garage").waitFor();
    assert.equal(await level(page, slot), 2);
    assert.deepEqual(page.errors, []);
    await page.context().close();
  });
}

test("level 6 gives an ability with confetti; it shows in the garage and in the race", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 1280, storage: { ...quiet, scrap: 500 }, hash: "#/garage" });
  await page.evaluate(() => window.__game.state.update((s) => (s.cars[s.look.car] = { engine: 5 })));
  await page.evaluate(() => (location.hash = "#/home"));
  await page.evaluate(() => (location.hash = "#/garage"));
  await page.getByTestId("screen-garage").waitFor();
  await page.getByTestId("part-engine").click();
  await page.locator(".confetti, [class*=confetti]").first().waitFor({ state: "attached" });
  await page.locator("[data-testid=car-abilities] [data-ability=rocketStart]").waitFor();
  await screenshot(page, "1280-garage-ability");
  await page.evaluate(() => {
    window.__game.state.update((s) => (s.cheats.shortRaces = true));
    location.hash = "#/game/race/city/1";
  });
  await page.waitForFunction(() => window.__game.race);
  assert.deepEqual(await page.evaluate(() => [...window.__game.race.abilities]), ["rocketStart"]);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test("the showroom shows the power of every car kind: a new car is weaker", async () => {
  const page = await openGame(env.browser, env.server.url, { storage: { ...quiet, owned: { car: ["sedan", "taxi"] } }, hash: "#/tuning" });
  await page.evaluate(async () => (await import("./js/systems/garage.js")).setAllLevels(10));
  await page.evaluate(() => (location.hash = "#/home"));
  await page.evaluate(() => (location.hash = "#/tuning"));
  await page.getByTestId("show-power").waitFor();
  const sedan = Number(await page.locator("[data-testid=show-power] .power-num").textContent());
  await page.evaluate(() => window.__game.state.update((s) => (s.look.car = "taxi")));
  await page.evaluate(() => (location.hash = "#/home"));
  await page.evaluate(() => (location.hash = "#/tuning"));
  await page.getByTestId("show-power").waitFor();
  const taxi = Number(await page.locator("[data-testid=show-power] .power-num").textContent());
  assert.ok(sedan > taxi, `${sedan} vs ${taxi}`);
  await screenshot(page, "390-showroom-power");
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
