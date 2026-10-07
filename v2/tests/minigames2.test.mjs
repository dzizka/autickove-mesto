// Part 11: Počítanie, Skladačka, Bludisko, Písmenká, Hudobná garáž, Križovatka (DESIGN-v2 §12).

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { setup, openGame, screenshot } from "./helpers.mjs";
import { COUNT, LETTERS } from "../js/data/minigames.js";
import { buildMaze } from "../js/games/maze/index.js";
import * as rng from "../js/core/rng.js";

const quiet = (extra = {}) => ({ settings: { sound: false, voice: false }, level: 6, ...extra });

test("every maze can reach every cell", () => {
  for (const n of [5, 7, 9]) {
    for (let seed = 1; seed < 20; seed++) {
      rng.setSeed(seed);
      const walls = buildMaze(n, 3, rng);
      const seen = new Set([0]);
      const q = [0];
      while (q.length) {
        const c = q.shift();
        [[0, -n], [1, 1], [2, n], [3, -1]].forEach(([w, d]) => !walls[c][w] && !seen.has(c + d) && (seen.add(c + d), q.push(c + d)));
      }
      assert.equal(seen.size, n * n, `maze ${n} seed ${seed}`);
    }
  }
});

let env;
before(async () => {
  env = await setup();
});
after(async () => {
  await env.teardown();
});

async function reward(page, timeout = 60000) {
  await page.getByTestId("reward-modal").waitFor({ timeout });
  const stars = Number(await page.getByTestId("reward-stars").getAttribute("data-stars"));
  assert.deepEqual(page.errors, []);
  return stars;
}

test("count: tap to count along, a wrong number shakes, the right one moves on", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 390, storage: quiet(), hash: "#/game/count" });
  for (let r = 0; r < COUNT.rounds; r++) {
    await page.locator(".count-answer").first().waitFor();
    const answer = await page.getByTestId("count-scene").getAttribute("data-answer");
    if (r === 0) {
      await page.locator(".count-item").first().click();
      assert.equal(await page.locator(".count-item.counted").count(), 1);
      await page.locator(`.count-answer:not([data-n="${answer}"])`).first().click();
      await screenshot(page, "390-count");
    }
    await page.locator(`.count-answer[data-n="${answer}"]`).click();
    await page.waitForFunction((a) => document.querySelector("[data-testid=count-scene]")?.dataset.answer !== a || document.querySelector("[data-testid=reward-modal]"), answer, { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(150);
  }
  assert.equal(await reward(page), 3, "one miss is still 3 stars");
  await page.context().close();
});

test("letters on level 2: pictures for letters and letters for pictures", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 1280, storage: quiet({ minigames: { letters: { level: 2, plays: 3, good: 0, best: 2 } } }), hash: "#/game/letters" });
  const modes = new Set();
  for (let r = 0; r < LETTERS.rounds; r++) {
    await page.locator(".let-opt").first().waitFor();
    const answer = await page.getByTestId("mini-stage").getAttribute("data-answer");
    const byLetter = answer.length === 1;
    modes.add(byLetter ? "first" : "pick");
    if (r < 2) await screenshot(page, `1280-letters-${r}`);
    await page.locator(byLetter ? `.let-opt[data-letter="${answer}"]` : `.let-opt[data-word="${answer}"]`).click();
    await page.waitForTimeout(1750);
  }
  assert.equal(await reward(page), 3);
  assert.ok(modes.size >= 1);
  await page.context().close();
});

test("music: listen, honk the melody back, a mistake replays it", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 390, storage: quiet(), hash: "#/game/music" });
  let mistake = true;
  for (let i = 0; i < 8; i++) {
    const ok = await page.waitForFunction(() => document.querySelector("[data-testid=mini-stage]")?.dataset.turn === "child" || document.querySelector("[data-testid=reward-modal]"), null, { timeout: 20000 });
    void ok;
    if (await page.getByTestId("reward-modal").count()) break;
    const melody = (await page.getByTestId("mini-stage").getAttribute("data-melody")).split(",");
    if (mistake) {
      mistake = false;
      await page.locator(`.mus-car[data-i="${(Number(melody[0]) + 1) % 4}"]`).click();
      await screenshot(page, "390-music");
    } else for (const n of melody) await page.locator(`.mus-car[data-i="${n}"]`).click();
    // the cars play again (a longer melody or the same one after a mistake)
    await page.waitForFunction(() => document.querySelector("[data-testid=mini-stage]")?.dataset.turn === "cars" || document.querySelector("[data-testid=reward-modal]"), null, { timeout: 10000 });
  }
  assert.equal(await reward(page), 2, "one mistake → 2 stars");
  await page.context().close();
});

test("puzzle: drag the pieces of the own-car picture into place", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 1280, storage: quiet({ minigames: { puzzle: { level: 2, plays: 3, good: 0, best: 2 } } }), hash: "#/game/puzzle" });
  await page.waitForFunction(() => document.querySelector("[data-testid=mini-stage]")?.dataset.ready === "1");
  let first = true;
  while (await page.locator(".pz-piece").count()) {
    const piece = page.locator(".pz-piece").first();
    const i = await piece.getAttribute("data-i");
    const cell = page.locator(`.pz-cell[data-i="${i}"]`);
    if (first) {
      first = false;
      await piece.click();
      await cell.click();
      await screenshot(page, "1280-puzzle");
      continue;
    }
    const a = await piece.boundingBox();
    const b = await cell.boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 6 });
    await page.mouse.up();
  }
  assert.equal(await reward(page), 3);
  await page.context().close();
});

test("maze: drive home with the arrows and the keyboard, picking up coins", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 390, storage: quiet(), hash: "#/game/maze" });
  await page.getByTestId("maze-canvas").waitFor();
  const { n, walls, coins } = await page.evaluate(() => ({ ...window.__game.mini, coins: [...window.__game.mini.coins] }));
  // visit every coin, then go home (shortest paths between targets)
  const path = (from, to) => {
    const prev = new Map([[from, null]]);
    const q = [from];
    while (q.length) {
      const c = q.shift();
      if (c === to) break;
      // never drive through the garage before the last target: arriving there ends the game
      [[0, -n], [1, 1], [2, n], [3, -1]].forEach(([w, d]) => !walls[c][w] && !prev.has(c + d) && (c + d !== n * n - 1 || to === n * n - 1) && (prev.set(c + d, [c, w]), q.push(c + d)));
    }
    const dirs = [];
    for (let c = to; prev.get(c); c = prev.get(c)[0]) dirs.unshift(prev.get(c)[1]);
    return dirs;
  };
  let at = 0;
  const moves = [];
  for (const t of [...coins, n * n - 1]) {
    moves.push(...path(at, t));
    at = t;
  }
  const KEYS = ["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft"];
  for (const [k, dir] of moves.entries()) {
    if (k < 3) await page.locator(`.maze-btn[data-dir="${dir}"]`).dispatchEvent("pointerdown");
    else await page.keyboard.press(KEYS[dir]);
    await page.waitForTimeout(200);
    if (k === 4) await screenshot(page, "390-maze");
  }
  assert.equal(await reward(page), 3, "all coins → 3 stars");
  await page.context().close();
});

test("traffic: switch the lights until every car is through", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 1280, storage: quiet(), hash: "#/game/traffic" });
  const canvas = page.getByTestId("traffic-canvas");
  await canvas.waitFor();
  let shot = false;
  for (let i = 0; i < 200 && !(await page.getByTestId("reward-modal").count()); i++) {
    const { green, waiting } = await page.getByTestId("mini-stage").evaluate((el) => ({ ...el.dataset }));
    const other = green === "h" ? "v" : "h";
    if (green !== "yellow" && (waiting || "").includes(other) && !(waiting || "").includes(green)) await canvas.click({ position: { x: 40, y: 40 } });
    if (!shot && i === 10) {
      shot = true;
      await screenshot(page, "1280-traffic");
    }
    await page.waitForTimeout(400);
  }
  const stars = await reward(page, 5000);
  assert.ok(stars >= 1);
  await page.context().close();
});
