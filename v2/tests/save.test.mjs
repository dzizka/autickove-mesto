// Saving: progress survives a reload, AM2: export/import round-trips,
// old schema versions migrate, broken codes are rejected kindly.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { setup, openGame } from "./helpers.mjs";

let env;
before(async () => {
  env = await setup();
});
after(async () => {
  await env.teardown();
});

test("progress is saved and survives a reload", async () => {
  const page = await openGame(env.browser, env.server.url);
  await page.evaluate(() => {
    window.__game.state.update((s) => {
      s.coins = 1234;
      s.settings.voice = false;
    });
    window.__game.state.saveNow();
  });
  await page.reload();
  await page.waitForFunction(() => window.__game);
  const s = await page.evaluate(() => window.__game.state.getState());
  assert.equal(s.coins, 1234);
  assert.equal(s.settings.voice, false);
  assert.equal(s.version, await page.evaluate(() => window.__game.state.CURRENT_VERSION));
  assert.match(await page.getByTestId("coins").textContent(), /1\s?234/);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test("export code → start over → import restores the same progress", async () => {
  const page = await openGame(env.browser, env.server.url);
  const code = await page.evaluate(() => {
    window.__game.state.update((s) => {
      s.coins = 777;
      s.level = 5;
      s.playLog["2026-10-01"] = { seconds: 600, games: { demo: 2 } };
    });
    return window.__game.exportCode();
  });
  assert.match(code, /^AM2:[A-Za-z0-9+/=]+$/);

  await page.evaluate(() => window.__game.state.reset());
  assert.equal(await page.evaluate(() => window.__game.state.getState().coins), 0);

  // import through the real dialog
  await page.getByTestId("gear").click();
  await page.getByTestId("open-transfer").click();
  await page.getByTestId("import-code").fill(code.slice(0, 20) + "\n  " + code.slice(20)); // whitespace from copying is ignored
  await page.getByTestId("import-check").click();
  await page.getByTestId("import-confirm").click();
  await page.getByTestId("screen-home").waitFor();

  const s = await page.evaluate(() => window.__game.state.getState());
  assert.equal(s.coins, 777);
  assert.equal(s.level, 5);
  assert.deepEqual(s.playLog["2026-10-01"], { seconds: 600, games: { demo: 2 } });
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("autickove-mesto-v2")).coins);
  assert.equal(stored, 777);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test("non-ASCII data (Slovak names) survives export/import", async () => {
  const page = await openGame(env.browser, env.server.url);
  const ok = await page.evaluate(() => {
    const g = window.__game;
    g.state.update((s) => (s.note = "Žltý kôň čľapká ďaleko 🚗"));
    const back = g.parseCode(g.exportCode());
    return back.note === "Žltý kôň čľapká ďaleko 🚗";
  });
  assert.ok(ok);
  await page.context().close();
});

test("bad codes show a message and change nothing", async () => {
  const page = await openGame(env.browser, env.server.url);
  await page.evaluate(() => window.__game.state.update((s) => (s.coins = 50)));
  await page.getByTestId("gear").click();
  await page.getByTestId("open-transfer").click();
  for (const bad of ["hello", "AM2:!!!notbase64", "AM1:eyJjb2lucyI6MX0=", "AM2:" + Buffer.from('{"version":99}').toString("base64")]) {
    await page.getByTestId("import-code").fill(bad);
    await page.getByTestId("import-check").click();
    await page.locator("[data-testid=import-msg] .error").waitFor();
    assert.equal(await page.getByTestId("import-confirm").count(), 0, `code accepted: ${bad}`);
  }
  assert.equal(await page.evaluate(() => window.__game.state.getState().coins), 50);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test("a version-0 save (no version field) migrates to the current schema", async () => {
  const v0 = { coins: 42, xp: 3, level: 2, sound: false, voice: true };
  const page = await openGame(env.browser, env.server.url, { storage: v0 });
  const s = await page.evaluate(() => window.__game.state.getState());
  const current = await page.evaluate(() => window.__game.state.CURRENT_VERSION);
  assert.equal(s.version, current);
  assert.equal(s.coins, 42);
  assert.equal(s.level, 2);
  assert.deepEqual(s.settings, { sound: false, voice: true, motion: true });
  assert.equal("sound" in s, false);
  assert.ok(s.playLog && s.cheats, "missing defaults were filled in");
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test("a v0 transfer code is migrated on import", async () => {
  const page = await openGame(env.browser, env.server.url);
  const s = await page.evaluate(() => {
    const json = JSON.stringify({ coins: 9, sound: true, voice: false });
    return window.__game.parseCode("AM2:" + btoa(json));
  });
  assert.equal(s.coins, 9);
  assert.equal(s.settings.voice, false);
  await page.context().close();
});

test("a corrupted save starts fresh and keeps the broken copy aside", async () => {
  const page = await openGame(env.browser, env.server.url, { storage: "{not json" });
  const s = await page.evaluate(() => window.__game.state.getState());
  assert.equal(s.coins, 0);
  const kept = await page.evaluate(() => Object.keys(localStorage).some((k) => k.startsWith("autickove-mesto-v2-broken-")));
  assert.ok(kept, "broken save was not kept");
  // the load logs one console error on purpose; nothing else may fail
  assert.equal(page.errors.filter((e) => !e.includes("[state]")).length, 0);
  await page.context().close();
});

test("start over asks twice and then clears progress", async () => {
  const page = await openGame(env.browser, env.server.url);
  await page.evaluate(() => window.__game.state.update((s) => (s.coins = 500)));
  await page.getByTestId("gear").click();
  await page.getByTestId("start-over").click();
  await page.getByTestId("confirm-no").click();
  assert.equal(await page.evaluate(() => window.__game.state.getState().coins), 500);
  await page.getByTestId("start-over").click();
  await page.getByTestId("confirm-yes").click();
  await page.getByTestId("confirm-yes").click();
  await page.getByTestId("screen-home").waitFor();
  assert.equal(await page.evaluate(() => window.__game.state.getState().coins), 0);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
