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
  assert.equal(await page.locator("canvas.car-3d").count(), 0, "no 3D canvas");
  assert.equal(await page.locator(".tile-car img").count(), 0);
  await page.getByTestId("tab-wing").click();
  await page.getByTestId("item-wing-none").click();
  assert.equal(await view.getAttribute("data-wing"), "none");
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

// ---------- part 15b: pictures of the 3D car everywhere ----------

test("pictures: side, back and top views have sane anchors; props too", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 390, storage: quiet() });
  const res = await page.evaluate(async () => {
    const { carPic, propPic } = await import("./js/render/car-pics.js");
    const out = {};
    for (const car of ["sedan", "fire", "alien", "tractor"]) {
      const [side, back, top] = await Promise.all(["side", "back", "top"].map((v) => carPic({ car }, v).promise));
      out[car] = { side: side.meta, back: { ...back.meta, w: back.w, h: back.h }, top: { ...top.meta, w: top.w, h: top.h }, sideSize: [side.w, side.h] };
    }
    const cone = await propPic("carkit/cone").promise;
    out.cone = { ...cone.meta, w: cone.w, h: cone.h };
    return out;
  });
  for (const [car, m] of Object.entries(res)) {
    if (car === "cone") continue;
    assert.deepEqual(m.sideSize, [480, 248], `${car}: side picture has the 2D car's viewBox`);
    assert.ok(m.side.wheels.length >= 2 && m.side.wheels.every((x) => x > 0 && x < 240), `${car}: wheels inside the picture`);
    assert.ok(m.side.wheelY > 62 && m.side.wheelY < 124, `${car}: wheels at the bottom`);
    assert.ok(m.side.front[0] > m.side.back[0], `${car}: front points right`);
    assert.ok(m.back.bodyW > 50 && m.back.bodyW <= m.back.w, `${car}: body width`);
    assert.ok(m.back.ay > m.back.h * 0.6 && Math.abs(m.back.ax - m.back.w / 2) < m.back.w * 0.1, `${car}: anchor at the bottom centre`);
    assert.ok(m.top.h > m.top.w, `${car}: from the top the car is longer than wide`);
  }
  assert.ok(res.cone.bodyW > 20 && res.cone.ay > res.cone.h * 0.6);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

for (const width of WIDTHS) {
  test(`${width}px: home road, race and maze show the 3D car's pictures`, async () => {
    const look = { car: "pickup", color: "blue", wing: "big", roof: "crown" };
    const page = await openGame(env.browser, env.server.url, { width, storage: quiet({ look, level: 8 }) });
    assert.equal(await page.getByTestId("home-car").getAttribute("data-car"), "pickup");
    // the moving home road shows the 3D car from behind
    await page.waitForFunction(async () => {
      const { carPic } = await import("./js/render/car-pics.js");
      return carPic(window.__game.state.getState().look, "back").ready;
    }, null, { timeout: 30000, polling: 500 });
    await page.waitForTimeout(500);
    await screenshot(page, `${width}-home-3d`);
    await page.goto(env.server.url + "#/game/race/city/1");
    await page.getByTestId("race-canvas").waitFor();
    await page.waitForFunction(async () => {
      const { carPic } = await import("./js/render/car-pics.js");
      return carPic(window.__game.race.look, "back").ready;
    }, null, { timeout: 30000, polling: 500 });
    await page.waitForTimeout(4000);
    await screenshot(page, `${width}-race-3d`);
    await page.goto(env.server.url + "#/game/maze");
    await page.getByTestId("screen-game-maze").waitFor();
    await page.waitForTimeout(3000);
    await screenshot(page, `${width}-maze-3d`);
    assert.deepEqual(page.errors, []);
    await page.context().close();
  });
}

test("the race waits a moment for the 3D car before the countdown", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 1280, storage: quiet({ look: { car: "garbage", color: "pink" } }), hash: "#/game/race/city/1" });
  await page.getByTestId("race-canvas").waitFor();
  // when the countdown moves on, the picture of the child's car is ready (or 1.5 s passed)
  const t0 = Date.now();
  await page.waitForFunction(() => window.__game.race && window.__game.race.countdown < 2.5, null, { timeout: 15000 });
  const ready = await page.evaluate(async () => (await import("./js/render/car-pics.js")).carPic(window.__game.race.look, "back").ready);
  assert.ok(ready || Date.now() - t0 >= 1400, "the countdown waited for the 3D car");
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test("test drive: the car drives on an empty road, steers and the drive ends", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 390, storage: quiet(), hash: "#/tuning" });
  await page.getByTestId("test-drive").click();
  await page.getByTestId("test-drive-canvas").waitFor();
  await page.waitForTimeout(1500);
  const before = await page.evaluate(() => ({ d: window.__game.testDrive.player.d, lane: window.__game.testDrive.player.lane, rivals: window.__game.testDrive.rivals.length, objects: window.__game.testDrive.objects.length }));
  assert.ok(before.d > 0, "the car moves");
  assert.equal(before.rivals + before.objects, 0, "nothing on the road");
  const box = await page.getByTestId("test-drive-canvas").boundingBox();
  await page.mouse.click(box.x + box.width * 0.9, box.y + box.height * 0.7);
  assert.equal(await page.evaluate(() => window.__game.testDrive.player.lane), before.lane + 1);
  await screenshot(page, "390-test-drive");
  await page.getByTestId("test-drive-close").click();
  assert.equal(await page.getByTestId("test-drive-modal").count(), 0);
  assert.equal(await page.evaluate(() => window.__game.testDrive), null);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
