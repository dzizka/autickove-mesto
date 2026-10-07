// Performance on an older tablet (DESIGN-v2 §4.1, part 7): the race runs with the CPU slowed
// down 4× at tablet size, with the heaviest looks (galaxy paint, rainbow neon and trail).

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

const TRACKS = ["city", "forest", "desert", "snow", "night", "space"];

test("every track stays smooth on a 4× slower CPU at tablet size", async () => {
  const results = [];
  for (const track of TRACKS) {
    const page = await openGame(env.browser, env.server.url, { width: 1024, height: 768, storage: { settings: { sound: false, voice: false } } });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.evaluate((t) => {
      window.__game.state.update((s) => {
        for (const id of ["city", "forest", "desert", "snow", "night", "space"]) s.races.tracks[id] = { unlocked: 3, best: { 1: 1 }, challenge: 0, races: 0 };
        s.look = { ...s.look, car: "rocket", color: "galaxy", pattern: "stars", neon: "rainbow", trail: "rainbow", roof: "crown", wing: "double" };
      });
      location.hash = `#/game/race/${t}/3`;
    }, track);
    await page.waitForFunction(() => window.__game.race?.phase === "racing", null, { timeout: 30000 });
    await page.evaluate(() => window.__game.frameTiming.reset());
    await page.waitForTimeout(4000);
    const r = await page.evaluate(() => ({ ...window.__game.frameTiming }));
    if (track === "night") await screenshot(page, "1024-night-perf");
    results.push({ track, fps: r.frames / 4, avgMs: r.busyMs / Math.max(1, r.frames) });
    assert.deepEqual(page.errors, []);
    await page.context().close();
  }
  console.log(results.map((r) => `${r.track}: ${r.fps.toFixed(0)} fps, ${r.avgMs.toFixed(1)} ms`).join("; "));
  for (const r of results) {
    assert.ok(r.fps >= 40, `${r.track}: ${r.fps.toFixed(0)} fps`);
    assert.ok(r.avgMs <= 8, `${r.track}: ${r.avgMs.toFixed(1)} ms of game code per frame`);
  }
});
