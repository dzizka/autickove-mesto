// Part 15a: Car Kit cars in 3D in the showroom and the garage, the 2D car as fallback,
// the new car lineup and the rocket in old saves (DESIGN-v2 §14).

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { setup, openGame, screenshot, WIDTHS } from "./helpers.mjs";
import { CARS, SHAPES } from "../js/data/cars.js";
import { TUNING } from "../js/data/tuning.js";
import { migrate, CURRENT_VERSION } from "../js/core/state.js";

const model = (name) => new URL(`../models/carkit/${name}.glb`, import.meta.url);
const quiet = (extra = {}) => ({ settings: { sound: false, voice: false }, ...extra });

test("every car is a Car Kit model with a 2D shape, wheels and wings have models", () => {
  assert.ok(CARS.length >= 15);
  assert.equal(new Set(CARS.map((c) => c.id)).size, CARS.length);
  assert.equal(CARS[0].price, 0, "the first car is free");
  for (const c of CARS) {
    assert.ok(existsSync(model(c.model)), `model of ${c.id}`);
    assert.ok(SHAPES[c.shape] && c.side && c.top, `2D shape of ${c.id}`);
  }
  for (let i = 1; i < CARS.length; i++) assert.ok(CARS[i].price >= CARS[i - 1].price, "sorted by price");
  const items = (id) => TUNING.find((t) => t.id === id).items;
  for (const w of items("wheels")) assert.ok(existsSync(model(w.model)), `wheel ${w.id}`);
  for (const w of items("wing").slice(1)) assert.ok(w.icon || existsSync(model(w.model)), `wing ${w.id}`);
});

test("old saves: the rocket becomes the rocket car and stays bought", () => {
  const s = migrate({ version: 10, look: { car: "rocket", color: "gold" }, owned: { car: ["sedan", "rocket", "jeep"] } });
  assert.equal(s.version, CURRENT_VERSION);
  assert.equal(s.look.car, "future");
  assert.equal(s.look.color, "gold");
  assert.deepEqual(s.owned.car, ["sedan", "future", "jeep"]);
  assert.equal(migrate({ version: 10 }).look.car, "sedan", "a save without a look gets the default");
});

let env;
before(async () => {
  env = await setup({ webgl: true });
});
after(async () => {
  await env.teardown();
});

for (const width of WIDTHS) {
  test(`${width}px: showroom turns a 3D car, tiles show 3D pictures, a new car is bought`, async () => {
    const page = await openGame(env.browser, env.server.url, { width, storage: quiet({ coins: 3000, level: 5 }), hash: "#/tuning" });
    const view = page.locator("[data-testid=show-car] [data-testid=car-view]");
    await page.locator('[data-testid=show-car] [data-testid=car-view][data-mode="3d"]').waitFor({ timeout: 20000 });
    assert.equal(await view.getAttribute("data-car"), "sedan");
    assert.equal(await view.locator("canvas").count(), 1);
    await page.locator(".tile-car img.car-pic").first().waitFor({ timeout: 30000 });
    // turn the car with a finger (mouse here)
    const box = await view.boundingBox();
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2, { steps: 6 });
    await page.mouse.up();
    // preview the fire truck, buy it, it stays on the turntable
    await page.getByTestId("item-car-fire").click();
    assert.equal(await view.getAttribute("data-car"), "fire");
    await page.getByTestId("buy").click();
    assert.equal(await page.evaluate(() => window.__game.state.getState().look.car), "fire");
    await page.waitForTimeout(1500);
    await screenshot(page, `${width}-showroom-3d`);
    // leaving the screen frees its 3D canvas
    await page.goto(env.server.url + "#/garage");
    await page.locator('.lift-car [data-testid=car-view][data-mode="3d"]').waitFor({ timeout: 20000 });
    assert.equal(await page.locator(".lift-car [data-testid=car-view]").getAttribute("data-car"), "fire");
    assert.equal(await page.locator("canvas.car-3d").count(), 1, "only the garage canvas is left");
    await screenshot(page, `${width}-garage-3d`);
    assert.deepEqual(page.errors, []);
    await page.context().close();
  });
}

test("without WebGL the 2D car stays and everything still works", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 390, storage: quiet({ look: { car: "tractor", wing: "big" } }), hash: "#/tuning" });
  await page.context().addInitScript(() => {
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      return /webgl/.test(type) ? null : get.call(this, type, ...rest);
    };
  });
  await page.reload();
  await page.getByTestId("screen-tuning").waitFor();
  await page.waitForTimeout(1500);
  const view = page.locator("[data-testid=show-car] [data-testid=car-view]");
  assert.equal(await view.getAttribute("data-mode"), "2d");
  assert.equal(await view.getAttribute("data-car"), "tractor");
  assert.ok(await view.locator("svg.car-side").isVisible());
  assert.equal(await page.locator("canvas").count(), 0);
  assert.equal(await page.locator(".tile-car img").count(), 0);
  await page.getByTestId("tab-wing").click();
  await page.getByTestId("item-wing-none").click();
  assert.equal(await view.getAttribute("data-wing"), "none");
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
