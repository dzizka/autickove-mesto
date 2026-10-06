// Chest and Garage in the browser (DESIGN-v2 §4.5, §4.6, part 2 "done when":
// the child can find a better part without reading and mount it).

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { setup, openGame, screenshot, WIDTHS } from "./helpers.mjs";

let env;
before(async () => {
  env = await setup();
});
after(async () => {
  await env.teardown();
});

const quiet = { settings: { sound: false, voice: false } };
const power = (page) => page.evaluate(() => Number(document.querySelector("[data-testid=car-power] .power-num")?.textContent));

/** Put parts straight into the bag through the real game code. */
async function seedParts(page, list) {
  await page.evaluate(async (list) => {
    const loot = await import("./js/systems/loot.js");
    const garage = await import("./js/systems/garage.js");
    window.__game.rng.setSeed(5);
    garage.addParts(list.map((o) => loot.generatePart({ ...o, rng: window.__game.rng })));
  }, list);
}

test("after a race the chest opens, parts go to the bag and are marked new", async () => {
  const page = await openGame(env.browser, env.server.url, { storage: { ...quiet, cheats: { shortRaces: true } } });
  await page.evaluate(() => {
    window.__game.rng.setSeed(4);
    window.__game.testTimeScale = 4;
    location.hash = "#/game/race/city/1";
  });
  await page.getByTestId("reward-modal").waitFor({ timeout: 40000 });
  await page.getByTestId("chest").click();
  await page.locator("[data-testid=chest-parts] .part-card").first().waitFor();
  await page.waitForTimeout(1500);
  await screenshot(page, "390-chest");
  const s = await page.evaluate(() => window.__game.state.getState());
  assert.ok(s.inventory.length >= 1 && s.inventory.length <= 3);
  assert.ok(s.inventory.every((p) => p.isNew));
  assert.ok(s.inventory.some((p) => p.rarity !== "common"), "first race guarantees a green part");
  assert.equal(s.loot.races, 1);

  await page.getByTestId("reward-garage").click();
  await page.getByTestId("screen-garage").waitFor();
  assert.ok((await page.locator(".bag-grid .pc-new").count()) >= 1, "NOVÉ badge shown");
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

for (const width of WIDTHS) {
  test(`garage at ${width}px: find the ⬆ part, compare and mount it`, async () => {
    const page = await openGame(env.browser, env.server.url, { width, storage: quiet, hash: "#/garage" });
    await seedParts(page, [
      { rarity: "epic", budget: 60, slot: "engine" },
      { rarity: "common", budget: 4, slot: "tires" },
      { rarity: "good", budget: 30, slot: "mascot" },
      { rarity: "rare", budget: 40, slot: "bumper" },
      { rarity: "common", budget: 6, slot: "tank" },
    ]);
    await page.evaluate(() => (location.hash = "#/home"));
    await page.getByTestId("home-garage").click();
    await page.getByTestId("screen-garage").waitFor();
    await screenshot(page, `${width}-garage`);

    // the better engine shows a green ⬆, the weak tires a red ⬇
    const up = page.locator('.bag-grid .part-card[data-compare="1"][data-rarity="epic"]');
    assert.equal(await up.count(), 1);
    assert.ok((await page.locator('.bag-grid .part-card[data-compare="-1"]').count()) >= 1);
    assert.equal(await page.locator('.slot[data-slot=engine] .slot-better').count(), 1, "slot hints at a better part");

    const before = await power(page);
    await up.click();
    await page.getByTestId("part-detail").waitFor();
    assert.equal(await page.locator(".pd-arrow.up").count(), 1);
    assert.ok((await page.locator(".cmp-row .cmp-old").count()) >= 1, "bars side by side");
    await screenshot(page, `${width}-part-detail`);
    await page.getByTestId("part-equip").click();
    await page.getByTestId("part-detail").waitFor({ state: "detached" });
    const after = await power(page);
    assert.ok(after > before, `power ${before} → ${after}`);
    const engine = await page.evaluate(() => window.__game.state.getState().car.equipped.engine.rarity);
    assert.equal(engine, "epic");
    // the old engine went back to the bag
    assert.equal(await page.evaluate(() => window.__game.state.getState().inventory.filter((p) => p.slot === "engine").length), 1);

    // ✨ Best mounts everything better in one tap
    await page.getByTestId("equip-best").click();
    assert.equal(await page.locator('.bag-grid .part-card[data-compare="1"]').count(), 0);
    assert.ok((await power(page)) >= after);
    assert.equal(await page.getByTestId("equip-best").isDisabled(), true);
    assert.deepEqual(page.errors, []);
    await page.context().close();
  });
}

test("dismantle, lock, upgrade and bag expansion", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 1280, storage: { ...quiet, coins: 5000 }, hash: "#/garage" });
  await seedParts(page, [
    { rarity: "common", budget: 4, slot: "tank" },
    { rarity: "common", budget: 4, slot: "tank" },
    { rarity: "good", budget: 4, slot: "magnet" },
    { rarity: "rare", budget: 4, slot: "magnet" },
  ]);
  await page.evaluate(() => (location.hash = "#/races"));
  await page.evaluate(() => (location.hash = "#/garage"));
  await page.getByTestId("screen-garage").waitFor();

  // lock one grey part: "dismantle grey and green" must keep it
  const greyIds = await page.evaluate(() => window.__game.state.getState().inventory.filter((p) => p.rarity === "common").map((p) => p.uid));
  await page.getByTestId(`part-${greyIds[0]}`).click();
  await page.getByTestId("part-lock").click();
  await page.getByTestId("part-close").click();
  await page.getByTestId("dismantle-low").click();
  await page.getByTestId("confirm-yes").click();
  let s = await page.evaluate(() => window.__game.state.getState());
  assert.deepEqual(s.inventory.map((p) => p.rarity).sort(), ["common", "rare"]);
  assert.ok(s.inventory.find((p) => p.rarity === "common").locked);
  assert.ok(s.scrap > 0);

  // single dismantle of a blue part asks first
  const rare = s.inventory.find((p) => p.rarity === "rare");
  await page.getByTestId(`part-${rare.uid}`).click();
  await page.getByTestId("part-dismantle").click();
  await page.getByTestId("confirm-no").click();
  await page.getByTestId("part-detail").waitFor();
  await page.getByTestId("part-close").click();
  assert.equal(await page.evaluate(() => window.__game.state.getState().inventory.length), 2);

  // upgrade a mounted part to +5: stars appear and power grows
  await page.evaluate(() => window.__game.state.update((s) => (s.scrap = 999)));
  const before = await power(page);
  await page.getByTestId("slot-engine").click();
  for (let i = 0; i < 5; i++) await page.getByTestId("part-upgrade").click();
  assert.equal(await page.getByTestId("part-upgrade").count(), 0, "no upgrade past +5");
  await screenshot(page, "1280-part-upgraded");
  await page.getByTestId("part-close").click();
  s = await page.evaluate(() => window.__game.state.getState());
  assert.equal(s.car.equipped.engine.plus, 5);
  assert.ok((await power(page)) > before);
  assert.equal(await page.locator("[data-testid=slot-engine] .pc-stars").textContent(), "⭐⭐⭐⭐⭐");

  // bigger bag
  await page.getByTestId("bag-expand").click();
  await page.getByTestId("confirm-yes").click();
  assert.equal(await page.evaluate(() => window.__game.state.getState().bagSize), 35);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test("a full bag turns extra parts into scrap", async () => {
  const page = await openGame(env.browser, env.server.url, { storage: { ...quiet, bagSize: 30 } });
  await seedParts(page, Array.from({ length: 33 }, () => ({ rarity: "common", budget: 5 })));
  const s = await page.evaluate(() => window.__game.state.getState());
  assert.equal(s.inventory.length, 30);
  assert.ok(s.scrap >= 3);
  await page.context().close();
});

test("version-2 saves migrate to the current schema with garage fields", async () => {
  const page = await openGame(env.browser, env.server.url, {
    storage: { version: 2, coins: 10, car: { equipped: { engine: { uid: "x1", slot: "engine", rarity: "common", main: { stat: "speed", value: 9 }, subs: [], plus: 0 } } }, inventory: [] },
  });
  const s = await page.evaluate(() => window.__game.state.getState());
  assert.equal(s.version, await page.evaluate(() => window.__game.state.CURRENT_VERSION));
  assert.equal(s.scrap, 0);
  assert.equal(s.bagSize, 30);
  assert.deepEqual(s.loot, { races: 0, gotGood: false, gotRare: false, sinceLegendary: 0 });
  assert.equal(s.car.equipped.engine.uid, "x1", "existing part kept");
  assert.equal(s.car.equipped.engine.budget, 9);
  assert.equal(Object.keys(s.car.equipped).length, 6, "missing slots filled with starter parts");
  await page.goto(env.server.url + "#/garage");
  await page.getByTestId("screen-garage").waitFor();
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
