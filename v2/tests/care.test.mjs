// Part 21: buddies grow also without races (DESIGN-v2 §6.1), the games room pays better and
// candy comes from more places. Rules in Node, the screens in the browser.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import * as state from "../js/core/state.js";
import { CREW_RULES as R } from "../js/data/crew.js";
import { DAILY } from "../js/data/album.js";
import { MINI } from "../js/data/minigames.js";
import { xpToNext, setActive } from "../js/systems/crew.js";
import { feed, feedXp, canFeed, petXp, playsLeft, recordPlay, giveMiniXp } from "../js/systems/crew-care.js";
import { miniReward } from "../js/systems/minigames.js";
import { setup, openGame, screenshot, WIDTHS } from "./helpers.mjs";

const fresh = (crew = {}) => {
  console.warn = () => {};
  const s = state.defaultState();
  s.crew = { ...s.crew, owned: { bunny: { id: "bunny", level: 1, xp: 0, stage: 0, hat: "none", glasses: "none", pets: 0 } }, active: "bunny", ...crew };
  state.replace(s);
};
const bunny = () => state.getState().crew.owned.bunny;

test("a candy feeds about a third of a level; no candy, no feeding", () => {
  fresh({ candy: 3 });
  assert.equal(feedXp(bunny()), Math.ceil(xpToNext(1) * R.feedShare));
  const fed = [feed("bunny"), feed("bunny"), feed("bunny")];
  assert.ok(fed.every(Boolean));
  assert.equal(state.getState().crew.candy, 0);
  assert.equal(bunny().level, 2, "three candies make a level");
  assert.equal(feed("bunny"), null);
  assert.equal(canFeed("bunny"), false);
  state.update((s) => ((s.crew.candy = 5), (bunny().level = R.maxLevel)));
  assert.equal(feed("bunny"), null, "a buddy on the top level does not eat");
  assert.equal(feed("nobody"), null);
});

test("the first pat of a day gives XP, later pats only hearts", () => {
  fresh();
  const d1 = new Date(2026, 9, 8, 10);
  assert.equal(petXp("bunny", d1).xp, R.petXp);
  assert.equal(petXp("bunny", d1).xp, 0);
  assert.equal(petXp("bunny", new Date(2026, 9, 9, 10)).xp, R.petXp, "next day again");
});

test("three star games a day per buddy count; then they are just for fun", () => {
  fresh();
  const d = new Date(2026, 9, 8, 10);
  assert.equal(playsLeft("bunny", d), R.playsPerDay);
  const coins0 = state.getState().coins;
  const r = recordPlay("bunny", 10, d);
  assert.deepEqual([r.xp, r.coins, r.counted], [10 * R.playXpPerStar, 10 * R.playCoinsPerStar, true]);
  assert.equal(state.getState().coins, coins0 + r.coins);
  recordPlay("bunny", 1, d);
  recordPlay("bunny", 1, d);
  assert.equal(playsLeft("bunny", d), 0);
  assert.equal(recordPlay("bunny", 20, d).counted, false);
  assert.equal(playsLeft("bunny", new Date(2026, 9, 9, 8)), R.playsPerDay, "a new day, new plays");
});

test("the games room teaches the buddy in the car and pays like a race", () => {
  fresh();
  assert.equal(giveMiniXp(3).xp, R.miniXp + R.miniXp3);
  assert.equal(giveMiniXp(1).xp, R.miniXp);
  setActive(null);
  assert.equal(giveMiniXp(3), null, "nobody in the car");
  assert.ok(miniReward(1, 3).coins >= 40 && miniReward(3, 3).coins >= 100, "games room pays 40–120");
  assert.ok(MINI.candy3 > 0 && DAILY.candy.reduce((a, b) => a + b, 0) >= 5, "candy from 3 stars and the daily present");
});

test("v16 → v17 keeps the buddies as they were", () => {
  const s = state.migrate({ version: 16, crew: { owned: { pig: { id: "pig", level: 4, xp: 3, stage: 0 } }, active: "pig", candy: 7 } });
  assert.equal(s.version, state.CURRENT_VERSION);
  assert.deepEqual([s.crew.owned.pig.level, s.crew.candy], [4, 7]);
});

// ---------- browser ----------

let env;
before(async () => {
  env = await setup();
});
after(async () => {
  await env.teardown();
});

const withBuddy = {
  version: 17,
  settings: { sound: false, voice: false, motion: false },
  cheats: { shortRaces: true },
  daily: { last: "2999-01-01", streak: 1 },
  crew: { owned: { bunny: { id: "bunny", level: 3, xp: 0, stage: 0, hat: "none", glasses: "none", pets: 0 } }, active: "bunny", candy: 4, clothes: { hat: ["none"], glasses: ["none"] }, eggsEver: 1, pets: 0 },
};

for (const width of WIDTHS) {
  test(`${width}px: feed a candy, pat, then play the star game with the buddy`, async () => {
    const page = await openGame(env.browser, env.server.url, { width, storage: withBuddy, hash: "#/crew" });
    await page.getByTestId("buddy-card").waitFor();
    const xp0 = await page.evaluate(() => window.__game.state.getState().crew.owned.bunny.xp);
    await page.getByTestId("feed").click();
    await page.getByTestId("xp-pop").waitFor({ state: "attached" });
    const s1 = await page.evaluate(() => window.__game.state.getState().crew);
    assert.equal(s1.candy, 3);
    assert.ok(s1.owned.bunny.xp > xp0);
    await page.getByTestId("pet").click();
    assert.ok(await page.evaluate(() => !!window.__game.state.getState().crew.owned.bunny.petDay));
    await screenshot(page, `${width}-crew-care`);
    assert.equal(await page.getByTestId("plays-left").getAttribute("data-left"), "3");

    await page.getByTestId("play-buddy").click();
    await page.getByTestId("screen-game-buddy").waitFor();
    // the buddy runs under the stars: follow the lowest star like a child would
    await page.evaluate(() => {
      window.__chase = setInterval(() => {
        const bp = window.__game.buddyPlay;
        const low = bp?.stars.slice().sort((a, b) => b.y - a.y)[0];
        if (low) bp.pal.to = low.x;
      }, 30);
    });
    await page.waitForTimeout(2500);
    await screenshot(page, `${width}-buddy-play`);
    await page.getByTestId("reward-modal").waitFor({ timeout: 15000 });
    await page.getByTestId("reward-buddy").waitFor();
    const b = await page.evaluate(() => window.__game.state.getState().crew.owned.bunny);
    assert.equal(b.plays, 1);
    await page.getByTestId("reward-games").click(); // 🐣 back to the buddies
    await page.getByTestId("screen-crew").waitFor();
    assert.equal(await page.getByTestId("plays-left").getAttribute("data-left"), "2");
    assert.deepEqual(page.errors, []);
    await page.context().close();
  });
}
