// The calm moving sky behind the screens and the wide layout on a PC (DESIGN-v2 §14).

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { setup, openGame, screenshot } from "./helpers.mjs";

const quiet = (extra = {}) => ({ settings: { sound: false, voice: false }, ...extra });

let env;
before(async () => {
  env = await setup();
});
after(async () => {
  await env.teardown();
});

test("the sky moves behind the menu, hides at home and in races, stands still in small games", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 1280, storage: quiet({ level: 5 }) });
  const sky = page.getByTestId("backdrop");
  assert.equal(await sky.isHidden(), true, "home has its own road");
  await page.getByTestId("home-garage").click();
  await page.getByTestId("screen-garage").waitFor();
  await page.waitForTimeout(300);
  assert.equal(await sky.isVisible(), true);
  assert.equal(await sky.getAttribute("data-drawn"), "moving");
  await page.goto(env.server.url + "#/game/count");
  await page.getByTestId("screen-game-count").waitFor();
  await page.waitForTimeout(300);
  assert.equal(await sky.getAttribute("data-drawn"), "still", "no motion while the child plays");
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test("1920 px: the showroom and the garage lift use the big screen", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 1920, height: 1080, storage: quiet({ level: 5 }), hash: "#/tuning" });
  await page.getByTestId("showroom").waitFor();
  const room = await page.getByTestId("showroom").boundingBox();
  assert.ok(room.width > 900 && room.height > 650, `showroom ${Math.round(room.width)} × ${Math.round(room.height)}`);
  await screenshot(page, "1920-tuning");
  await page.goto(env.server.url + "#/garage");
  await page.getByTestId("screen-garage").waitFor();
  const lift = await page.locator(".lift-car [data-testid=car-view]").boundingBox();
  assert.ok(lift.height >= 300, `lift ${Math.round(lift.height)}`);
  await page.goto(env.server.url + "#/game/letters");
  await page.locator(".let-opt").first().waitFor();
  assert.ok((await page.locator(".let-opt").first().boundingBox()).width >= 180, "small games grow on a big screen");
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
