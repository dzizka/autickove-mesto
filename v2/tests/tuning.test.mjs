// Appearance (DESIGN-v2 §5, part 3 "done when": everything bought is visible in races):
// data sanity, every option renders in both views, every neon and trail drives a race
// without a single error (§3, §10), buying and the showroom.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { CARS } from "../js/data/cars.js";
import { TUNING } from "../js/data/tuning.js";
import { setup, openGame, screenshot, WIDTHS } from "./helpers.mjs";

let env;
before(async () => {
  env = await setup();
});
after(async () => {
  await env.teardown();
});

const quiet = { settings: { sound: false, voice: false } };

test("data: at least 8 cars, 9 categories with 5–15 options, free first item, unique ids", () => {
  assert.ok(CARS.length >= 8);
  for (const kind of ["sedan", "jeep", "taxi", "police", "fire", "formula", "truck", "rocket"]) assert.ok(CARS.some((c) => c.id === kind), kind);
  assert.equal(CARS[0].price, 0);
  assert.deepEqual(TUNING.map((c) => c.id), ["color", "pattern", "wheels", "wing", "sticker", "roof", "neon", "trail", "horn"]);
  for (const c of TUNING) {
    assert.ok(c.items.length >= 5 && c.items.length <= 15, `${c.id}: ${c.items.length}`);
    assert.equal(c.items[0].price, 0, `${c.id} first item is free`);
    assert.equal(new Set(c.items.map((i) => i.id)).size, c.items.length, `${c.id} ids unique`);
    assert.ok(c.items.slice(1).every((i) => i.price > 0));
  }
  assert.ok(TUNING[0].items.some((i) => i.special === "rainbow") && TUNING[0].items.some((i) => i.special === "galaxy"));
});

test("every car × every option renders from the side and from above", async () => {
  const page = await openGame(env.browser, env.server.url, { storage: quiet });
  const result = await page.evaluate(async () => {
    const { carSide } = await import("./js/render/car-side.js");
    const { carSprite } = await import("./js/render/car-top.js");
    const { CATEGORY_IDS, itemsOf } = await import("./js/systems/tuning.js");
    const bad = [];
    let count = 0;
    for (const car of itemsOf("car")) {
      for (const cat of CATEGORY_IDS.filter((c) => c !== "car")) {
        for (const item of itemsOf(cat)) {
          const look = { car: car.id, [cat]: item.id };
          try {
            const svg = carSide(look, { trail: true });
            if (!svg.querySelector("path") || svg.innerHTML.includes("undefined") || svg.innerHTML.includes("NaN")) bad.push(`side ${car.id}/${cat}/${item.id}`);
            const s = carSprite(look, 40);
            if (!(s.canvas.width > 0 && s.canvas.height > 0)) bad.push(`top ${car.id}/${cat}/${item.id}`);
            count++;
          } catch (err) {
            bad.push(`${car.id}/${cat}/${item.id}: ${err.message}`);
          }
        }
      }
    }
    // broken or old looks fall back to safe defaults
    for (const look of [null, {}, { car: "ufo", color: "plaid", neon: 7 }, { colorHex: "nope" }]) {
      try {
        carSide(look ?? undefined);
        carSprite(look ?? {}, 30);
      } catch (err) {
        bad.push(`fallback ${JSON.stringify(look)}: ${err.message}`);
      }
    }
    return { bad, count };
  });
  assert.deepEqual(result.bad, []);
  assert.ok(result.count > 400, `rendered ${result.count}`);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test("every neon and every trail in a race: no error, not even a caught one", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 390, storage: quiet });
  const combos = await page.evaluate(async () => {
    const { itemsOf } = await import("./js/systems/tuning.js");
    const neons = itemsOf("neon").map((i) => i.id);
    const trails = itemsOf("trail").map((i) => i.id);
    const cars = itemsOf("car").map((i) => i.id);
    const n = Math.max(neons.length, trails.length);
    return Array.from({ length: n }, (_, i) => ({ neon: neons[i % neons.length], trail: trails[i % trails.length], car: cars[i % cars.length], color: ["rainbow", "galaxy", "gold", "black"][i % 4], pattern: ["flames", "camo", "stars", "hearts"][i % 4], wheels: i % 2 ? "monster" : "neon", wing: i % 2 ? "double" : "angel", roof: "crown", sticker: "dino" }));
  });
  const tracks = ["city", "night", "snow", "space"];
  for (let i = 0; i < combos.length; i++) {
    const look = combos[i];
    await page.evaluate((look) => {
      window.__game.state.update((s) => (s.look = { ...s.look, ...look }));
    }, look);
    // time scale 6 → about 6 s of race time per second
    await page.evaluate((t) => {
      window.__game.testTimeScale = 6;
      window.__game.state.update((s) => (s.races.tracks[t] = { unlocked: 1, best: { 1: 1 }, challenge: 0, races: 0 }));
      location.hash = `#/game/race/${t}/1`;
    }, tracks[i % tracks.length]);
    await page.locator(`[data-testid=screen-game-race][data-track=${tracks[i % tracks.length]}]`).waitFor();
    await page.waitForFunction(() => window.__game.race?.phase === "racing");
    await page.waitForTimeout(1600);
    if (i < 2) await screenshot(page, `390-race-look-${i}`);
    const info = await page.evaluate(() => ({ look: window.__game.race.look, stats: window.__game.loopStats }));
    for (const [k, v] of Object.entries(look)) assert.equal(info.look[k], v, `race uses the bought ${k}`);
    assert.deepEqual(info.stats, { caughtErrors: 0, crashes: 0 }, JSON.stringify(look));
    await page.evaluate(() => (location.hash = "#/home"));
    await page.getByTestId("screen-home").waitFor();
  }
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

for (const width of WIDTHS) {
  test(`showroom at ${width}px: preview, buy, select, random; the look shows everywhere`, async () => {
    const page = await openGame(env.browser, env.server.url, { width, storage: { ...quiet, coins: 1500 } });
    await page.getByTestId("home-tuning").click();
    await page.getByTestId("screen-tuning").waitFor();
    await screenshot(page, `${width}-showroom`);

    // preview a police car: the car changes, nothing is bought yet
    await page.getByTestId("item-car-police").click();
    assert.equal(await page.locator("[data-testid=show-car] svg").getAttribute("data-car"), "police");
    await page.getByTestId("buy-bar").waitFor();
    await screenshot(page, `${width}-showroom-preview`);
    await page.getByTestId("buy-cancel").click();
    assert.equal(await page.locator("[data-testid=show-car] svg").getAttribute("data-car"), "sedan");

    // buy it
    await page.getByTestId("item-car-police").click();
    await page.getByTestId("buy").click();
    let s = await page.evaluate(() => window.__game.state.getState());
    assert.equal(s.look.car, "police");
    assert.equal(s.coins, 1500 - 900);
    assert.ok(s.owned.car.includes("police"));

    // too expensive: the buy button is disabled and coins stay
    await page.getByTestId("tab-color").click();
    await page.getByTestId("item-color-galaxy").click();
    assert.equal(await page.getByTestId("buy").isDisabled(), true);
    await page.getByTestId("item-color-blue").click();
    await page.getByTestId("buy").click();
    await page.getByTestId("tab-neon").click();
    await page.getByTestId("item-neon-blue").click();
    await page.getByTestId("buy").click();
    s = await page.evaluate(() => window.__game.state.getState());
    assert.equal(s.look.color, "blue");
    assert.equal(s.look.neon, "blue");
    assert.equal(s.coins, 1500 - 900 - 80 - 250);

    // an owned item is selected with one tap
    await page.getByTestId("item-neon-none").click();
    assert.equal(await page.evaluate(() => window.__game.state.getState().look.neon), "none");
    await page.getByTestId("item-neon-blue").click();
    await page.getByTestId("horn").click();
    await page.getByTestId("random-look").click();
    s = await page.evaluate(() => window.__game.state.getState());
    for (const [cat, id] of Object.entries(s.look)) assert.ok(cat === "car" || cat === "color" || cat === "neon" ? s.owned[cat].includes(id) : true, `random picked unowned ${cat}`);
    await page.evaluate(() => window.__game.state.update((st) => (st.look = { ...st.look, car: "police", color: "blue", neon: "blue" })));

    // garage and home show the same car
    await page.getByTestId("nav-garage").click();
    const garageCar = page.locator(".lift-car svg");
    assert.equal(await garageCar.getAttribute("data-car"), "police");
    assert.equal(await garageCar.getAttribute("data-color"), "blue");
    await page.getByTestId("topbar-home").click();
    assert.equal(await page.locator("[data-testid=home-car] svg").getAttribute("data-neon"), "blue");
    await screenshot(page, `${width}-home-look`);
    assert.deepEqual(page.errors, []);
    await page.context().close();
  });
}

test("version-3 saves migrate to the current schema with the starter look", async () => {
  const page = await openGame(env.browser, env.server.url, { storage: { version: 3, coins: 33, scrap: 4, bagSize: 35 } });
  const s = await page.evaluate(() => window.__game.state.getState());
  assert.equal(s.version, await page.evaluate(() => window.__game.state.CURRENT_VERSION));
  assert.equal(s.coins, 33);
  assert.equal(s.bagSize, 35);
  assert.equal(s.look.car, "sedan");
  assert.deepEqual(s.owned.neon, ["none"]);
  await page.context().close();
});
