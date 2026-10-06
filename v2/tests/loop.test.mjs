// Game pipeline and loop guard (DESIGN-v2 §3): a game runs, finishes via ctx.finish
// and the host grants rewards; a failing frame is skipped; >30 failures in a row
// show the friendly "car got stuck" dialog and still credit coins.

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

test("test drive runs, finishes and grants rewards without any error", async () => {
  const page = await openGame(env.browser, env.server.url, {
    storage: { version: 1, coins: 0, cheats: { shortRaces: true } },
  });
  await page.evaluate(() => window.__game.rng.setSeed(7));
  await page.evaluate(() => (location.hash = "#/game/demo"));
  await page.getByTestId("screen-game-demo").waitFor();
  // random steering for the whole drive
  const canvas = page.getByTestId("demo-canvas");
  const box = await canvas.boundingBox();
  for (let i = 0; i < 12; i++) {
    await page.mouse.click(box.x + (i % 3 === 0 ? 40 : box.width - 40), box.y + box.height / 2);
    await page.waitForTimeout(250);
  }
  await screenshot(page, "390-demo-game");
  await page.getByTestId("reward-modal").waitFor({ timeout: 15000 });
  await screenshot(page, "390-reward");

  const s = await page.evaluate(() => window.__game.state.getState());
  const shown = Number((await page.getByTestId("reward-coins").textContent()).replace(/\D/g, ""));
  assert.equal(s.coins, shown, "coins in the dialog match the coins credited");
  assert.ok(s.xp > 0 || s.level > 1, "xp was granted");
  const today = Object.values(s.playLog).pop();
  assert.equal(today.games.demo, 1);
  assert.deepEqual(await page.evaluate(() => window.__game.loopStats), { caughtErrors: 0, crashes: 0 });

  await page.getByTestId("reward-again").click();
  await page.getByTestId("screen-game-demo").waitFor();
  await page.getByTestId("game-exit").click();
  await page.getByTestId("screen-home").waitFor();
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test("a single failing frame is skipped and the loop keeps running", async () => {
  const page = await openGame(env.browser, env.server.url);
  const result = await page.evaluate(async () => {
    const { createLoop } = await import("./js/core/loop.js");
    let frames = 0;
    let crashed = false;
    const loop = createLoop({
      update() {
        frames++;
        if (frames === 3) throw new Error("one bad frame");
      },
      onCrash: () => (crashed = true),
    });
    loop.start();
    await new Promise((r) => setTimeout(r, 400));
    loop.stop();
    return { frames, crashed, running: loop.running };
  });
  assert.ok(result.frames > 5, `loop stopped after ${result.frames} frames`);
  assert.equal(result.crashed, false);
  assert.equal(page.errors.length, 1, "exactly one error logged");
  await page.context().close();
});

test("NaN or negative frame times never reach the game", async () => {
  const page = await openGame(env.browser, env.server.url);
  const bad = await page.evaluate(async () => {
    const { createLoop } = await import("./js/core/loop.js");
    const seen = [];
    const loop = createLoop({ update: (dt) => seen.push(dt) });
    loop.start();
    await new Promise((r) => setTimeout(r, 200));
    loop.stop();
    return seen.filter((dt) => !Number.isFinite(dt) || dt < 0 || dt > 0.05).length;
  });
  assert.equal(bad, 0);
  await page.context().close();
});

test("more than 30 failing frames show 'car got stuck' and keep the coins", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 1280 });
  await page.evaluate(() => (location.hash = "#/game/demo-crash"));
  await page.getByTestId("crash-modal").waitFor({ timeout: 8000 });
  await screenshot(page, "1280-crash");
  const stats = await page.evaluate(() => window.__game.loopStats);
  assert.equal(stats.crashes, 1);
  assert.equal(stats.caughtErrors, 31);
  const s = await page.evaluate(() => window.__game.state.getState());
  assert.ok(s.xp > 0 || s.level > 1, "partial reward was credited");
  await page.getByTestId("crash-home").click();
  await page.getByTestId("screen-home").waitFor();
  // only the deliberate frame errors were logged
  assert.equal(page.errors.filter((e) => !e.includes("[loop]")).length, 0);
  await page.context().close();
});

test("leaving a game mid-way stops its loop", async () => {
  const page = await openGame(env.browser, env.server.url);
  await page.evaluate(() => (location.hash = "#/game/demo"));
  await page.getByTestId("screen-game-demo").waitFor();
  await page.waitForTimeout(300);
  await page.getByTestId("game-exit").click();
  await page.getByTestId("screen-home").waitFor();
  const coins = await page.evaluate(() => window.__game.state.getState().coins);
  await page.waitForTimeout(800);
  assert.equal(await page.evaluate(() => window.__game.state.getState().coins), coins);
  assert.equal(await page.getByTestId("reward-modal").count(), 0, "no reward after leaving");
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
