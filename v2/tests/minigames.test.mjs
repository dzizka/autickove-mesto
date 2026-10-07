// Part 10: the 🎪 games room and the first four games from v1 (DESIGN-v2 §12).

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { setup, openGame, screenshot, WIDTHS } from "./helpers.mjs";
import { starsFor, miniReward, recordMini, miniProgress } from "../js/systems/minigames.js";
import { MINIGAMES, MINI, PEXESO, REPAIR } from "../js/data/minigames.js";
import { migrate, CURRENT_VERSION } from "../js/core/state.js";

const quiet = (extra = {}) => ({ settings: { sound: false, voice: false }, ...extra });

test("stars, rewards and difficulty that grows by itself", () => {
  assert.equal(starsFor(0, [0, 2]), 3);
  assert.equal(starsFor(2, [0, 2]), 2);
  assert.equal(starsFor(5, [0, 2]), 1);
  assert.equal(starsFor(NaN, [0, 2]), 1);
  assert.ok(miniReward(3, 3).coins > miniReward(1, 3).coins);
  assert.ok(miniReward(1, 3).coins > miniReward(1, 1).coins);
  assert.equal(miniProgress("pexeso").level, 1);
  assert.equal(recordMini({ id: "pexeso", stars: 1, level: 1 }).levelUp, false, "one star does not count");
  assert.equal(recordMini({ id: "pexeso", stars: 2, level: 1 }).levelUp, false);
  assert.deepEqual(recordMini({ id: "pexeso", stars: 3, level: 1 }), { level: 2, levelUp: true });
  for (let i = 0; i < 6; i++) recordMini({ id: "pexeso", stars: 3, level: miniProgress("pexeso").level });
  assert.equal(miniProgress("pexeso").level, MINI.levels, "never above the top level");
  assert.equal(recordMini({ id: "nope", stars: 3, level: 1 }).levelUp, false);
  // data sanity
  assert.ok(PEXESO.pictures.length >= Math.max(...PEXESO.pairs));
  assert.ok(REPAIR.list.length >= Math.max(...REPAIR.choices));
  assert.equal(new Set(MINIGAMES.map((g) => g.id)).size, MINIGAMES.length);
});

test("version-8 saves migrate with an empty games room", () => {
  const s = migrate({ version: 8, coins: 5, level: 3 });
  assert.equal(s.version, CURRENT_VERSION);
  assert.deepEqual(s.minigames, {});
  assert.equal(s.coins, 5);
});

let env;
before(async () => {
  env = await setup();
});
after(async () => {
  await env.teardown();
});

async function finishReward(page) {
  await page.getByTestId("reward-modal").waitFor({ timeout: 30000 });
  const stars = Number(await page.getByTestId("reward-stars").getAttribute("data-stars"));
  assert.ok(stars >= 1 && stars <= 3);
  return stars;
}

for (const width of WIDTHS) {
  test(`${width}px: games room from home, locked games wait for a higher level`, async () => {
    const page = await openGame(env.browser, env.server.url, { width, storage: quiet() });
    await page.getByTestId("home-games").click();
    await page.getByTestId("screen-games").waitFor();
    assert.equal(await page.locator("[data-testid^=mini-][data-locked=false]").count(), MINIGAMES.filter((g) => g.unlockLevel <= 1).length);
    await screenshot(page, `${width}-games-room`);
    await page.getByTestId("mini-repair").click();
    await page.waitForTimeout(200);
    assert.equal(await page.getByTestId("screen-games").count(), 1, "a locked game does not open");
    // the child picks the difficulty: all three open, the recommended one has 👍
    await page.getByTestId("mini-pexeso").click();
    await page.getByTestId("level-picker").waitFor();
    assert.equal(await page.locator(".diff-btn").count(), 3);
    assert.equal(await page.locator(".diff-btn.recommended").getAttribute("data-testid"), "level-1");
    await screenshot(page, `${width}-level-picker`);
    await page.getByTestId("level-3").click();
    await page.getByTestId("screen-game-pexeso").waitFor();
    assert.equal(await page.getByTestId("screen-game-pexeso").getAttribute("data-level"), "3");
    assert.equal(await page.locator(".pex-card").count(), PEXESO.pairs[2] * 2);
    assert.equal(await page.evaluate(() => window.__game.state.getState().minigames.pexeso.pick), 3, "the choice is remembered");
    assert.deepEqual(page.errors, []);
    await page.context().close();
  });
}

test("pexeso: pairs, a mistake, stars and the next level", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 390, storage: quiet({ minigames: { pexeso: { level: 1, plays: 1, good: 1, best: 3 } } }), hash: "#/game/pexeso" });
  await page.getByTestId("screen-game-pexeso").waitFor();
  await page.waitForFunction(() => window.__game.mini?.ready());
  const pics = await page.locator(".pex-card").evaluateAll((els) => els.map((e) => e.dataset.pic));
  assert.equal(pics.length, PEXESO.pairs[0] * 2);
  const click = async (i) => {
    await page.waitForFunction(() => window.__game.mini?.ready());
    await page.getByTestId(`card-${i}`).click();
  };
  // one wrong pair first
  const a = 0;
  const wrong = pics.findIndex((p, i) => i !== a && p !== pics[a]);
  await click(a);
  await click(wrong);
  await page.waitForTimeout(PEXESO.showMs + 150);
  await screenshot(page, "390-pexeso");
  const done = new Set();
  for (let i = 0; i < pics.length; i++) {
    if (done.has(i)) continue;
    const j = pics.findIndex((p, k) => k !== i && p === pics[i]);
    done.add(i).add(j);
    await click(i);
    await click(j);
  }
  const stars = await finishReward(page);
  assert.equal(stars, 3, "1 mistake with 3 pairs is still 3 stars");
  assert.equal(await page.getByTestId("reward-harder").count(), 1, "the game gets harder");
  const s = await page.evaluate(() => window.__game.state.getState());
  assert.equal(s.minigames.pexeso.level, 2);
  assert.ok(s.coins > 0);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test("wash: scrub the mud, rinse the foam, the car shines", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 1280, storage: quiet(), hash: "#/game/wash" });
  await page.getByTestId("screen-game-wash").waitFor();
  const box = await page.getByTestId("wash-canvas").boundingBox();
  const sweep = async () => {
    for (let y = box.y + 6; y < box.y + box.height; y += box.height / 14) {
      await page.mouse.move(box.x + 4, y);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width - 4, y, { steps: 18 });
      await page.mouse.up();
    }
  };
  await sweep();
  for (let i = 0; i < 4 && (await page.evaluate(() => window.__game.mini?.phase())) === 0; i++) await sweep();
  assert.equal(await page.evaluate(() => window.__game.mini.phase()), 1, "mud is gone, foam is left");
  await screenshot(page, "1280-wash-foam");
  for (let i = 0; i < 5 && (await page.getByTestId("reward-modal").count()) === 0; i++) {
    if ((await page.evaluate(() => window.__game.mini?.phase())) !== 1) break;
    await sweep();
  }
  await finishReward(page);
  assert.equal((await page.evaluate(() => window.__game.state.getState())).minigames.wash.plays, 1);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

for (const width of WIDTHS) {
  test(`${width}px: repair: the right tool fixes it, a wrong one only shakes`, async () => {
    const page = await openGame(env.browser, env.server.url, { width, storage: quiet({ level: 2 }), hash: "#/game/repair" });
    await page.getByTestId("screen-game-repair").waitFor();
    let first = true;
    for (let i = 0; i < REPAIR.problems[0]; i++) {
      await page.locator(".rep-tool:not([disabled])").first().waitFor();
      const need = await page.getByTestId("mini-stage").getAttribute("data-need");
      if (first) {
        await page.locator(`.rep-tool:not([data-tool="${need}"])`).first().click();
        first = false;
        if (width === 390) await screenshot(page, "390-repair");
      }
      await page.locator(`.rep-tool[data-tool="${need}"]`).click();
      await page.waitForTimeout(950);
    }
    const stars = await finishReward(page);
    assert.equal(stars, 2, "one mistake → 2 stars");
    assert.deepEqual(page.errors, []);
    await page.context().close();
  });
}

for (const level of [1, 3]) {
  test(`parking on level ${level}: drag cars to their spots${level === 3 ? " (also by dots)" : ""}`, async () => {
    const width = level === 1 ? 390 : 1280;
    const page = await openGame(env.browser, env.server.url, { width, storage: quiet({ level: 2, minigames: { park: { level, plays: 4, good: 0, best: 3 } } }), hash: "#/game/park" });
    await page.getByTestId("screen-game-park").waitFor();
    let tapped = false;
    let dotsSeen = false;
    for (let wave = 0; wave < 3; wave++) {
      await page.locator(".park-car").first().waitFor();
      if (await page.locator('.park-car[data-mode="dots"]').count()) dotsSeen = true;
      if (wave === 1) await screenshot(page, `${width}-park-${level}`);
      while (await page.locator(".park-car").count()) {
        const car = page.locator(".park-car").first();
        const key = await car.getAttribute("data-key");
        const spot = page.locator(`.park-spot:not(.full)[data-key="${key}"]`);
        if (!tapped) {
          // tap the car, then the spot
          tapped = true;
          await car.click();
          await spot.click();
          continue;
        }
        const from = await car.boundingBox();
        const to = await spot.boundingBox();
        await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
        await page.mouse.down();
        await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
        await page.mouse.up();
      }
      await page.waitForTimeout(1000);
    }
    const stars = await finishReward(page);
    assert.equal(stars, 3);
    assert.equal(dotsSeen, level === 3, "dots only from level 3");
    assert.deepEqual(page.errors, []);
    await page.context().close();
  });
}
