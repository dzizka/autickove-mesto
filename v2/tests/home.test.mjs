// Part 14: the moving home background (DESIGN-v2 §14): the child's car drives on a pseudo-3D
// road behind the buttons, the tracks change, a tap honks and jumps, it pauses under a window
// and the parents can stop it.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { setup, openGame, screenshot, WIDTHS } from "./helpers.mjs";
import { isNight } from "../js/screens/home-road.js";
import { migrate, CURRENT_VERSION } from "../js/core/state.js";

const quiet = (extra = {}) => ({ settings: { sound: false, voice: false }, ...extra });
const DAY = ["city", "forest", "desert", "snow"];
const NIGHT = ["night", "space"];

test("evening and night show the night tracks; old saves get the moving background", () => {
  assert.equal(isNight(new Date(2026, 9, 8, 12)), false);
  assert.equal(isNight(new Date(2026, 9, 8, 20)), true);
  assert.equal(isNight(new Date(2026, 9, 8, 5)), true);
  const s = migrate({ version: 11, settings: { sound: false, voice: true } });
  assert.equal(s.version, CURRENT_VERSION);
  assert.deepEqual(s.settings, { sound: false, voice: true, motion: true, lang: null });
});

let env;
before(async () => {
  env = await setup();
});
after(async () => {
  await env.teardown();
});

const road = (page) => page.evaluate(() => ({ d: window.__game.homeRoad?.scene.race.player.d ?? -1, air: window.__game.homeRoad?.scene.race.player.airT ?? 0, track: window.__game.homeRoad?.scene.track.id }));

for (const width of WIDTHS) {
  test(`${width}px: the car drives behind the buttons, honks and jumps, waits under a window`, async () => {
    const page = await openGame(env.browser, env.server.url, { width, storage: quiet({ look: { car: "taxi", neon: "pink" } }) });
    const canvas = page.getByTestId("home-road");
    await canvas.waitFor();
    assert.equal(await canvas.getAttribute("data-motion"), "true");
    const track = await canvas.getAttribute("data-track");
    const hour = await page.evaluate(() => new Date().getHours());
    assert.ok((hour >= 19 || hour < 7 ? NIGHT : DAY).includes(track), `track ${track} fits the time of day`);
    const a = await road(page);
    await page.waitForTimeout(1200);
    const b = await road(page);
    assert.ok(b.d > a.d, "the car drives");
    // the buttons stay on top and work
    const box = await page.getByTestId("home-car").boundingBox();
    assert.ok(box.height >= 180, "a big area to tap the car");
    await page.getByTestId("home-car").click();
    assert.ok((await road(page)).air > 0, "a tap makes the car jump");
    await screenshot(page, `${width}-home-road`);
    // an open window pauses the road
    await page.getByTestId("open-trophies").waitFor();
    await page.evaluate(async () => (await import("./js/core/ui.js")).modal(document.createTextNode("x")));
    const c = await road(page);
    await page.waitForTimeout(800);
    assert.equal((await road(page)).d, c.d, "paused under a window");
    await page.evaluate(async () => (await import("./js/core/ui.js")).closeModal());
    // the next track fades in
    await page.evaluate(() => window.__game.homeRoad.next());
    await page.waitForTimeout(900);
    assert.notEqual(await canvas.getAttribute("data-track"), track);
    // leaving home removes the road
    await page.getByTestId("home-garage").click();
    await page.getByTestId("screen-garage").waitFor();
    assert.equal(await page.getByTestId("home-road").count(), 0);
    assert.deepEqual(page.errors, []);
    await page.context().close();
  });
}

test("parents can stop the moving background: one still picture", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 390, storage: quiet({ settings: { sound: false, voice: false, motion: false } }) });
  const canvas = page.getByTestId("home-road");
  await canvas.waitFor();
  assert.equal(await canvas.getAttribute("data-motion"), "false");
  await page.waitForTimeout(1500);
  assert.equal((await road(page)).d, 0, "the car stands");
  await page.goto(env.server.url + "#/settings");
  await page.getByTestId("screen-settings").waitFor();
  assert.equal(await page.getByTestId("toggle-motion").getAttribute("aria-checked"), "false");
  await page.getByTestId("toggle-motion").click();
  assert.equal(await page.evaluate(() => window.__game.state.getState().settings.motion), true);
  await page.goto(env.server.url + "#/home");
  await canvas.waitFor();
  assert.equal(await canvas.getAttribute("data-motion"), "true");
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
