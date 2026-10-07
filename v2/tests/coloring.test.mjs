// Colouring book (DESIGN-v2 §7, §10; part 6 "done when": a 24 × 24 paint-by-number picture
// can be finished on a phone): data, both modes, tools, rewards and the gallery.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { FREE_PICTURES } from "../js/data/coloring/free.js";
import { PIXEL_PICTURES } from "../js/data/coloring/pixel.js";
import { THEMES, COLORS, GLITTER } from "../js/data/coloring/palette.js";
import { setup, openGame, screenshot } from "./helpers.mjs";

let env;
before(async () => {
  env = await setup();
});
after(async () => {
  await env.teardown();
});

const quiet = { settings: { sound: false, voice: false } };

test("data: 24+ free pictures in 6 themes (6 open), 30+ pixel pictures, palette 16 + 4", async () => {
  assert.ok(FREE_PICTURES.length >= 24);
  assert.equal(new Set(FREE_PICTURES.map((p) => p.id)).size, FREE_PICTURES.length);
  for (const t of THEMES) assert.ok(FREE_PICTURES.some((p) => p.theme === t.id && !p.unlock), `${t.id} has an open picture`);
  assert.ok(FREE_PICTURES.filter((p) => !p.unlock).length >= 6);
  assert.ok(PIXEL_PICTURES.length >= 30);
  assert.equal(COLORS.length, 16);
  assert.equal(GLITTER.length, 4);
  const { pixelGrid } = await import("../js/systems/coloring.js");
  const ranges = { 10: [3, 4], 16: [5, 6], 24: [7, 9] };
  for (const p of PIXEL_PICTURES) {
    const g = pixelGrid(p);
    assert.equal(g.cells.length, p.size * p.size);
    const k = g.colors.length;
    assert.ok(k >= ranges[p.size][0] && k <= ranges[p.size][1], `${p.id}: ${k} colours`);
    for (let n = 1; n <= k; n++) assert.ok(g.cells.includes(n), `${p.id}: number ${n} has no cell`);
  }
  for (const size of [10, 16, 24]) assert.ok(PIXEL_PICTURES.some((p) => p.size === size));
});

test("24 × 24 paint by number on a phone: zoom, wrong cell blinks, drag paints, undo, finish", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 390, storage: { ...quiet, coins: 0 } });
  await page.getByTestId("home-coloring").click();
  await page.getByTestId("mode-number").click();
  await page.getByTestId("size-24").click();
  await screenshot(page, "390-coloring-menu-number");
  await page.getByTestId("pic-p-raceday").click();
  await page.getByTestId("bn-grid").waitFor();

  // big enough to tap: zoom in until a cell is at least 30 px
  for (let i = 0; i < 4; i++) {
    const w = await page.locator(".bn-cell").first().evaluate((el) => el.getBoundingClientRect().width);
    if (w >= 30) break;
    await page.getByTestId("zoom-in").click();
  }
  const cellW = await page.locator(".bn-cell").first().evaluate((el) => el.getBoundingClientRect().width);
  assert.ok(cellW >= 30, `cell ${cellW}px`);
  await screenshot(page, "390-number-24");

  const grid = await page.evaluate(() => ({ cells: window.__game.byNumber.grid.cells, colors: window.__game.byNumber.grid.colors }));
  // a wrong cell blinks and stays empty
  await page.getByTestId("num-1").click();
  const wrong = grid.cells.findIndex((c) => c !== 1);
  await page.locator(`.bn-cell[data-i="${wrong}"]`).click();
  assert.match(await page.locator(`.bn-cell[data-i="${wrong}"]`).getAttribute("class"), /wrong/);
  assert.equal(await page.evaluate((i) => window.__game.byNumber.filled[i], wrong), false);

  // highlight: every empty cell of number 1 is marked
  assert.equal(await page.locator(".bn-cell.hl").count(), grid.cells.filter((c) => c === 1).length);

  // drag along the top row (sky = 1): all touched cells of number 1 get coloured
  const first = page.locator('.bn-cell[data-i="0"]');
  const fifth = page.locator('.bn-cell[data-i="4"]');
  await first.scrollIntoViewIfNeeded();
  const a = await first.boundingBox();
  const b = await fifth.boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
  await page.mouse.up();
  const dragged = await page.evaluate(() => window.__game.byNumber.filled.slice(0, 5));
  assert.deepEqual(dragged, [true, true, true, true, true]);

  // undo removes the last coloured cell
  await page.getByTestId("undo").click();
  assert.equal(await page.evaluate(() => window.__game.byNumber.filled.filter(Boolean).length), 4);

  // finish the rest with real taps for one more number, then the test hook for speed
  await page.getByTestId("num-2").click();
  const twos = grid.cells.map((c, i) => (c === 2 ? i : -1)).filter((i) => i >= 0).slice(0, 6);
  for (const i of twos) await page.locator(`.bn-cell[data-i="${i}"]`).click();
  assert.ok(twos.every((i) => grid.cells[i] === 2));
  await page.evaluate(() => {
    const bn = window.__game.byNumber;
    for (let n = 1; n <= bn.grid.colors.length; n++) {
      bn.select(n);
      bn.grid.cells.forEach((c, i) => c === n && bn.tryFill(i));
    }
  });
  await page.waitForTimeout(600);
  await screenshot(page, "390-number-24-done");
  await page.getByTestId("reward-modal").waitFor({ timeout: 6000 });
  await screenshot(page, "390-coloring-reward");
  const s = await page.evaluate(() => window.__game.state.getState());
  assert.equal(s.coins, 60, "24 × 24 gives 60 coins");
  assert.equal(s.coloring.finished, 1);
  assert.equal(s.coloring.done["p-raceday"], 1);
  assert.equal(s.coloring.wip["p-raceday"], undefined, "unfinished work cleared");
  const gallery = await page.evaluate(() => JSON.parse(localStorage.getItem("autickove-mesto-v2-gallery")));
  assert.equal(gallery.length, 1);
  assert.match(gallery[0].src, /^data:image\/jpeg;base64,/);
  assert.ok(gallery[0].src.length < 20000, `thumbnail is small (${gallery[0].src.length} chars)`);

  await page.getByTestId("reward-gallery").click();
  await page.getByTestId("gallery-item").waitFor();
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test("unfinished paint-by-number work is kept and shown in the menu", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 390, storage: quiet, hash: "#/game/coloring/number/p-cat" });
  await page.getByTestId("bn-grid").waitFor();
  await page.evaluate(() => {
    const bn = window.__game.byNumber;
    bn.select(1);
    bn.grid.cells.forEach((c, i) => c === 1 && bn.tryFill(i));
  });
  await page.getByTestId("game-exit").click();
  await page.getByTestId("screen-home").waitFor();
  await page.evaluate(() => (location.hash = "#/game/coloring/number/p-cat"));
  await page.getByTestId("bn-grid").waitFor();
  const restored = await page.locator(".bn-cell.filled").count();
  const ones = await page.evaluate(() => window.__game.byNumber.grid.cells.filter((c) => c === 1).length);
  assert.equal(restored, ones);
  assert.match(await page.getByTestId("num-1").getAttribute("class"), /done/);
  await page.getByTestId("game-exit").click();
  await page.evaluate(() => (location.hash = "#/coloring"));
  await page.getByTestId("mode-number").click();
  await page.getByTestId("size-16").click();
  assert.equal(await page.locator("[data-testid=pic-p-cat] .pic-wip").count(), 1);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test("free painting: bucket, brush over fills, eraser, undo, done → gallery and glitter on the 2nd picture", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 1280, storage: quiet });
  await page.getByTestId("home-coloring").click();
  await page.getByTestId("screen-coloring").waitFor();
  await screenshot(page, "1280-coloring-menu");
  for (let round = 1; round <= 2; round++) {
    await page.evaluate(() => (location.hash = "#/coloring"));
    await page.getByTestId("mode-free").click();
    await page.getByTestId(round === 1 ? "theme-cars" : "theme-space").click();
    await page.getByTestId(round === 1 ? "pic-car" : "pic-rocket").click();
    await page.getByTestId("free-stage").waitFor();

    // empty picture cannot be finished
    await page.getByTestId("paint-done").click();
    assert.equal(await page.getByTestId("reward-modal").count(), 0);

    // bucket fills the tapped area
    await page.getByTestId("color-2f80ed").click();
    const area = page.locator("[data-area]").nth(2);
    await area.click({ force: true });
    assert.equal(await area.getAttribute("fill"), "#2f80ed");
    await page.getByTestId("color-ffd23f").click();
    await page.locator("[data-area]").nth(0).click({ position: { x: 5, y: 5 }, force: true });
    assert.equal(await page.locator("[data-area]").nth(0).getAttribute("fill"), "#ffd23f");

    // undo the background
    await page.getByTestId("undo").click();
    assert.equal(await page.locator("[data-area]").nth(0).getAttribute("fill"), "#ffffff");

    // brush over the filled area, then erase part of it
    await page.getByTestId("tool-brush").click();
    await page.getByTestId("size-2").click();
    await page.getByTestId("color-ff3b3b").click();
    const box = await page.getByTestId("free-stage").boundingBox();
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.55, { steps: 10 });
    await page.mouse.up();
    await page.getByTestId("tool-eraser").click();
    await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.3);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.8, { steps: 6 });
    await page.mouse.up();
    const pixels = await page.getByTestId("brush-layer").evaluate((cv) => {
      const d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data;
      let red = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 200) red++;
      return red;
    });
    assert.ok(pixels > 100, "brush stroke is on the layer");
    if (round === 1) await screenshot(page, "1280-free-paint");
    await page.getByTestId("paint-done").click();
    await page.getByTestId("reward-modal").waitFor();
    if (round === 2) {
      await page.getByTestId("reward-glitter").waitFor();
      await screenshot(page, "1280-coloring-reward-glitter");
    }
  }
  const s = await page.evaluate(() => window.__game.state.getState());
  assert.equal(s.coins, 40);
  assert.deepEqual(s.coloring.glitter, ["gold"]);
  const gallery = await page.evaluate(() => JSON.parse(localStorage.getItem("autickove-mesto-v2-gallery")).map((g) => g.id));
  assert.deepEqual(gallery, ["rocket", "car"], "newest first");

  // the gold glitter is now in the palette and fills with a gradient
  await page.evaluate(() => (location.hash = "#/game/coloring/free/house"));
  await page.getByTestId("free-stage").waitFor();
  await page.getByTestId("color-gold").click();
  await page.locator("[data-area]").nth(1).click({ force: true });
  assert.equal(await page.locator("[data-area]").nth(1).getAttribute("fill"), "url(#gl-gold)");
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test("locked pictures open after races or for coins; a car sticker after the 3rd picture", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 390, storage: { ...quiet, coins: 70, coloring: { finished: 2, done: {}, bought: [], glitter: ["gold"], wip: {} } }, hash: "#/coloring" });
  await page.getByTestId("mode-free").click();
  await page.getByTestId("theme-animals").click();
  await screenshot(page, "390-coloring-menu-free");
  assert.equal(await page.getByTestId("pic-fish").getAttribute("data-open"), "false");
  await page.getByTestId("pic-fish").click();
  await page.getByTestId("confirm-yes").click();
  assert.equal(await page.getByTestId("pic-fish").getAttribute("data-open"), "true");
  assert.equal(await page.evaluate(() => window.__game.state.getState().coins), 10);
  // too expensive: nothing happens
  await page.getByTestId("pic-butterfly").click();
  assert.equal(await page.getByTestId("modal").count(), 0);
  // races open pictures too
  await page.evaluate(() => window.__game.state.update((s) => (s.races.total = 5)));
  await page.getByTestId("theme-cars").click();
  await page.getByTestId("theme-animals").click();
  assert.equal(await page.getByTestId("pic-butterfly").getAttribute("data-open"), "true");

  // 3rd finished picture → a sticker for the car
  const stickersBefore = await page.evaluate(() => window.__game.state.getState().owned.sticker.length);
  await page.evaluate(() => (location.hash = "#/game/coloring/number/p-heart"));
  await page.getByTestId("bn-grid").waitFor();
  await page.evaluate(() => {
    const bn = window.__game.byNumber;
    for (let n = 1; n <= bn.grid.colors.length; n++) {
      bn.select(n);
      bn.grid.cells.forEach((c, i) => c === n && bn.tryFill(i));
    }
  });
  await page.getByTestId("reward-sticker").waitFor({ timeout: 6000 });
  assert.equal(await page.evaluate(() => window.__game.state.getState().owned.sticker.length), stickersBefore + 1);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test("gallery keeps at most 40 pictures and can delete one", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 1280, storage: quiet });
  await page.evaluate(async () => {
    const c = await import("./js/systems/coloring.js");
    const cv = document.createElement("canvas");
    cv.width = cv.height = 8;
    const src = cv.toDataURL("image/jpeg", 0.5);
    for (let i = 0; i < 41; i++) c.addToGallery({ id: `x${i}`, mode: "free", src });
  });
  await page.evaluate(() => (location.hash = "#/gallery"));
  await page.getByTestId("gallery-grid").waitFor();
  assert.equal(await page.getByTestId("gallery-item").count(), 40);
  await screenshot(page, "1280-gallery");
  await page.getByTestId("gallery-item").first().click();
  await page.getByTestId("gallery-delete").click();
  await page.getByTestId("confirm-yes").click();
  assert.equal(await page.getByTestId("gallery-item").count(), 39);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test("version-6 saves migrate to the current schema with an empty colouring book", async () => {
  const page = await openGame(env.browser, env.server.url, { storage: { version: 6, coins: 8 } });
  const s = await page.evaluate(() => window.__game.state.getState());
  assert.equal(s.version, await page.evaluate(() => window.__game.state.CURRENT_VERSION));
  assert.deepEqual(s.coloring, { finished: 0, done: {}, bought: [], glitter: [], wip: {} });
  await page.context().close();
});
