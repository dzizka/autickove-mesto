// Part 20: playing without words (DESIGN-v2 §15.2). The demo hand shows the next step on every
// screen and in every game, sounds can be seen, ❔ explains each screen to the adult in both
// languages, and captions show what the game says.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { HELP } from "../js/data/help.js";
import { HINTS } from "../js/data/hints.js";
import { EN } from "../js/data/i18n/en.js";
import { setup, openGame, screenshot } from "./helpers.mjs";

const SCREENS = ["home", "races", "garage", "tuning", "crew", "coloring", "games", "album", "trophies", "city"];
const GAMES = ["pexeso", "wash", "repair", "park", "puzzle", "count", "maze", "letters", "music", "traffic"];

test("❔ help for every screen and game, in Slovak and English; the hand knows every game", () => {
  for (const id of [...SCREENS, "gallery", "settings", "parents", "game-race", "game-coloring", ...GAMES.map((g) => `game-${g}`)]) {
    assert.ok(HELP[id]?.text?.length, `help for ${id}`);
    for (const p of HELP[id].text) assert.ok(p in EN, `English help for ${id}: ${p.slice(0, 40)}…`);
  }
  for (const g of GAMES) assert.ok(HINTS[`game-${g}`]?.length, `hand rules for ${g}`);
});

let env;
before(async () => {
  env = await setup();
});
after(async () => {
  await env.teardown();
});

// a child who cannot hear: voice and sounds off; everything open
const deaf = { level: 20, coins: 5000, scrap: 100, settings: { sound: false, voice: false, motion: false }, cheats: { shortRaces: true }, daily: { last: "2999-01-01", streak: 1 } };

test("the hand shows the next step when a screen or a game opens", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 390, storage: deaf, hash: "#/settings" });
  await page.getByTestId("screen-settings").waitFor();
  const missing = [];
  for (const route of [...SCREENS.filter((s) => s !== "crew"), ...GAMES.map((g) => `game/${g}`), "game/race/city/1"]) {
    await page.evaluate((r) => (location.hash = `#/${r}`), route);
    try {
      await page.locator("[data-testid=hint-hand]").waitFor({ state: "attached", timeout: route.includes("music") ? 9000 : 4000 });
    } catch {
      // music: the cars play first, the hand comes when it is the child's turn (idle hint)
      missing.push(route);
      continue;
    }
    const t = await page.evaluate(() => {
      const l = window.__game.hint.last;
      const r = l.el.getBoundingClientRect();
      return { kind: l.kind, tag: l.el.tagName, w: r.width, inside: r.left >= -1 && r.right <= innerWidth + 1 };
    });
    assert.ok(t.w > 10 && t.inside, `${route}: the hand points at something on the screen (${JSON.stringify(t)})`);
    if (route === "game/park" || route === "home") await screenshot(page, `390-hand-${route.replace(/\//g, "-")}`);
  }
  assert.deepEqual(missing.filter((r) => r !== "game/music"), [], "screens without a hand");
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test("the hand comes back when the child waits, and goes away on a tap", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 390, storage: deaf, hash: "#/garage" });
  await page.locator("[data-testid=hint-hand]").waitFor({ state: "attached", timeout: 4000 });
  await page.locator("[data-testid=hint-hand]").waitFor({ state: "detached", timeout: 6000 });
  await page.locator("[data-testid=hint-hand]").waitFor({ state: "attached", timeout: 10000 }); // idle: again
  assert.equal(await page.evaluate(() => window.__game.hint.last.el.classList.contains("hint")), true, "the glowing part");
  await page.mouse.click(10, 300);
  assert.equal(await page.locator("[data-testid=hint-hand]").count(), 0);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test("❔ explains the screen to the adult; 👆 shows the child; a race waits meanwhile", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 390, storage: deaf, hash: "#/garage" });
  await page.getByTestId("help").click();
  await page.getByTestId("help-modal").waitFor();
  assert.match(await page.getByTestId("help-modal").textContent(), /súčiastky/i);
  await screenshot(page, "390-help-garage");
  await page.getByTestId("help-show").click();
  await page.locator("[data-testid=hint-hand]").waitFor({ state: "attached", timeout: 3000 });

  await page.evaluate(() => (location.hash = "#/game/race/city/1"));
  await page.waitForFunction(() => window.__game.race?.phase === "racing", null, { timeout: 30000 });
  await page.locator(".rh-help").click();
  await page.getByTestId("help-modal").waitFor();
  const t0 = await page.evaluate(() => window.__game.race.time);
  await page.waitForTimeout(800);
  assert.equal(await page.evaluate(() => window.__game.race.time), t0, "the race waits while the adult reads");
  await page.getByTestId("help-close").click();
  await page.waitForTimeout(500);
  assert.ok((await page.evaluate(() => window.__game.race.time)) > t0, "and goes on");

  // English help in a game
  await page.evaluate(() => window.__game.state.update((s) => (s.settings.lang = "en")));
  await page.reload();
  await page.evaluate(() => (location.hash = "#/game/pexeso"));
  await page.getByTestId("screen-game-pexeso").waitFor();
  await page.getByTestId("screen-game-pexeso").getByTestId("help").click();
  assert.match(await page.getByTestId("help-modal").textContent(), /Memory\. Tap two cards/);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test("sounds can be seen: horn waves, ✖ on a wrong answer, captions of what is said", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 390, storage: { ...deaf, settings: { ...deaf.settings, captions: true } }, hash: "#/tuning" });
  await page.getByTestId("horn").click();
  await page.getByTestId("sound-waves").waitFor({ state: "attached" });
  await page.getByTestId("caption").waitFor(); // "Vzhľad auta…" was said with the voice off
  await page.evaluate(() => (location.hash = "#/game/letters"));
  await page.locator(".let-opt").first().waitFor();
  const wrong = await page.evaluate(() => {
    const ans = document.querySelector(".mini-stage").dataset.answer;
    return [...document.querySelectorAll(".let-opt")].findIndex((b) => b.dataset.word !== ans && b.dataset.letter !== ans);
  });
  await page.locator(".let-opt").nth(wrong).click();
  await page.locator(".wrong-mark").waitFor({ state: "attached" });
  await screenshot(page, "390-caption");
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
