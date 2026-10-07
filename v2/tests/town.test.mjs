// Part 12: town, album and daily gift (DESIGN-v2 §13).

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { setup, openGame, screenshot, WIDTHS } from "./helpers.mjs";
import { getState, update, replace, defaultState, migrate, todayKey, CURRENT_VERSION } from "../js/core/state.js";
import * as rng from "../js/core/rng.js";
import { BUILDINGS, CITY } from "../js/data/city.js";
import { PAGES, ALBUM, DAILY } from "../js/data/album.js";
import { buildOrUpgrade, rentWaiting, collectRent, nextPrice, buildingLevel } from "../js/systems/city.js";
import { giveStickers, buyPack, upgradeSticker, stickerTier, pageFound } from "../js/systems/album.js";
import { dailyReady, claimDaily, dailyDay } from "../js/systems/daily.js";

const quiet = (extra = {}) => ({ settings: { sound: false, voice: false }, ...extra });
const fresh = (extra = {}) => replace({ ...defaultState(), ...extra });
const H = 3600000;

test("town: build, rent per hour up to the cap, collect, upgrade", () => {
  fresh({ coins: 10000, level: 20 });
  const kiosk = BUILDINGS[0];
  const t0 = Date.now();
  assert.equal(nextPrice(kiosk.id), kiosk.price);
  assert.ok(buildOrUpgrade(kiosk.id, t0));
  assert.equal(buildingLevel(kiosk.id), 1);
  assert.equal(getState().coins, 10000 - kiosk.price);
  assert.equal(rentWaiting(kiosk.id, t0 + 2 * H), kiosk.rent * 2);
  assert.equal(rentWaiting(kiosk.id, t0 + 100 * H), kiosk.rent * CITY.rentCapHours, "rent stops at the cap");
  const before = getState().coins;
  assert.equal(collectRent(kiosk.id, t0 + 2 * H), kiosk.rent * 2);
  assert.equal(getState().coins, before + kiosk.rent * 2);
  assert.equal(rentWaiting(kiosk.id, t0 + 2 * H), 0, "collected rent is gone");
  assert.equal(nextPrice(kiosk.id), kiosk.price * CITY.upgradeFactor);
  assert.ok(buildOrUpgrade(kiosk.id, t0 + 3 * H));
  assert.ok(buildOrUpgrade(kiosk.id, t0 + 3 * H));
  assert.equal(nextPrice(kiosk.id), null, "top level");
  assert.equal(rentWaiting(kiosk.id, t0 + 4 * H), kiosk.rent * 3);
  // locked by level, and no money no house
  fresh({ coins: 10000, level: 1 });
  assert.equal(buildOrUpgrade(BUILDINGS.at(-1).id), false);
  fresh({ coins: 0, level: 20 });
  assert.equal(buildOrUpgrade(kiosk.id), false);
});

test("album: stickers, a full page pays once, spare stickers make silver and gold", () => {
  fresh({ coins: 1000, level: 1 });
  rng.setSeed(3);
  const res = buyPack(rng);
  assert.equal(res.stickers.length, ALBUM.packSize);
  assert.ok(res.stickers.every((x) => PAGES.slice(0, 3).some((p) => p.stickers.includes(x.sticker))), "only open pages");
  assert.equal(getState().coins, 1000 - ALBUM.packPrice);
  // fill the first page by hand → reward once
  const page = PAGES[0];
  update((s) => page.stickers.slice(1).forEach((st) => (s.album.stickers[st] = 1)));
  update((s) => (s.album.stickers[page.stickers[0]] = 0));
  const coins = getState().coins;
  update((s) => (s.album.stickers[page.stickers[0]] = 1));
  const r2 = giveStickers(1, rng);
  assert.equal(pageFound(page), 9);
  assert.equal(r2.pages.filter((p) => p.page.id === page.id).length, 1);
  assert.equal(getState().coins, coins + ALBUM.pageReward);
  assert.equal(giveStickers(1, rng).pages.filter((p) => p.page.id === page.id).length, 0, "only once");
  // upgrades
  const st = page.stickers[0];
  assert.equal(upgradeSticker(st), false, "no spare copies yet");
  update((s) => (s.album.stickers[st] = 1 + ALBUM.tiers[1].cost));
  assert.ok(upgradeSticker(st));
  assert.equal(stickerTier(st), 1);
  update((s) => (s.album.stickers[st] = 1 + ALBUM.tiers[2].cost));
  assert.ok(upgradeSticker(st));
  assert.equal(stickerTier(st), 2);
  assert.equal(upgradeSticker(st), false, "gold is the top");
  // data
  const all = PAGES.flatMap((p) => p.stickers);
  assert.equal(new Set(all).size, all.length, "every sticker is on one page only");
  assert.ok(PAGES.every((p) => p.stickers.length === 9));
});

test("daily gift: once a day, bigger every day in a row, back to day 1 after a pause", () => {
  const day = (n) => new Date(2026, 9, n, 10);
  fresh({ daily: { last: todayKey(day(1)), streak: 1 } });
  assert.equal(dailyReady(day(1)), false);
  assert.equal(claimDaily(rng, day(1)), null);
  assert.equal(dailyDay(day(2)), 2);
  const r2 = claimDaily(rng, day(2));
  assert.equal(r2.day, 2);
  assert.equal(r2.coins, DAILY.coins[1]);
  const r3 = claimDaily(rng, day(3));
  assert.equal(r3.day, 3);
  assert.equal(r3.packs, DAILY.packs[2]);
  assert.ok(r3.album.stickers.length > 0, "day 3 brings stickers");
  assert.equal(claimDaily(rng, day(6)).day, 1, "a pause starts again at day 1");
  fresh({ daily: { last: todayKey(day(1)), streak: 30 } });
  assert.equal(dailyDay(day(2)), DAILY.coins.length, "never beyond the last day");
});

test("version-9 saves migrate: empty town and album, the first gift tomorrow", () => {
  const s = migrate({ version: 9, coins: 7 });
  assert.equal(s.version, CURRENT_VERSION);
  assert.deepEqual(s.city, { buildings: {}, rentAt: {} });
  assert.deepEqual(s.album.stickers, {});
  assert.equal(s.daily.last, todayKey());
});

let env;
before(async () => {
  env = await setup();
});
after(async () => {
  await env.teardown();
});

for (const width of WIDTHS) {
  test(`${width}px: build in the town, collect rent, buy stickers in the album`, async () => {
    const page = await openGame(env.browser, env.server.url, { width, storage: quiet({ coins: 2000, level: 3, owned: { car: ["sedan", "jeep", "fire"] } }) });
    await page.getByTestId("home-city").click();
    await page.getByTestId("screen-city").waitFor();
    assert.equal(await page.locator('[data-state="locked"]').count(), BUILDINGS.filter((b) => b.unlockLevel > 3).length);
    await screenshot(page, `${width}-city-empty`);
    for (const id of ["kiosk", "wash"]) {
      await page.getByTestId(`bld-${id}`).click();
      await page.getByTestId("bld-build").click();
      await page.getByTestId("bld-detail").waitFor({ state: "detached" });
    }
    assert.equal(await page.getByTestId("bld-wash").getAttribute("data-state"), "built");
    // three hours later the rent is waiting
    await page.evaluate(() => window.__game.state.update((s) => Object.keys(s.city.rentAt).forEach((k) => (s.city.rentAt[k] -= 3 * 3600000))));
    await page.evaluate(() => (location.hash = "#/home"));
    await page.getByTestId("home-city").click();
    const coins = await page.evaluate(() => window.__game.state.getState().coins);
    await page.getByTestId("rent-wash").click();
    assert.ok((await page.evaluate(() => window.__game.state.getState().coins)) > coins);
    await screenshot(page, `${width}-city`);
    // ▶ opens the building's game
    await page.getByTestId("bld-wash").click();
    await page.getByTestId("bld-open").click();
    await page.getByTestId("screen-game-wash").waitFor();
    await page.getByTestId("game-exit").click();
    // album from the town
    await page.getByTestId("home-city").click();
    await page.getByTestId("open-album").click();
    await page.getByTestId("screen-album").waitFor();
    await page.getByTestId("buy-pack").click();
    await page.getByTestId("pack-modal").waitFor();
    assert.equal(await page.getByTestId("pack-card").count(), ALBUM.packSize);
    await screenshot(page, `${width}-pack`);
    await page.getByTestId("pack-ok").click();
    assert.ok((await page.locator(".alb-slot.got").count()) >= 1);
    await screenshot(page, `${width}-album`);
    assert.deepEqual(page.errors, []);
    await page.context().close();
  });
}

test("the daily gift opens on the home screen once a day", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 390, storage: quiet({ coins: 0, daily: { last: "2000-01-01", streak: 4 } }) });
  await page.getByTestId("daily-modal").waitFor();
  await screenshot(page, "390-daily");
  await page.getByTestId("daily-gift").click();
  await page.getByTestId("daily-coins").waitFor();
  await page.getByTestId("daily-modal").waitFor({ state: "detached", timeout: 5000 });
  const s = await page.evaluate(() => window.__game.state.getState());
  assert.equal(s.coins, DAILY.coins[0], "a long pause starts again at day 1");
  assert.equal(s.daily.streak, 1);
  await page.reload();
  await page.getByTestId("screen-home").waitFor();
  await page.waitForTimeout(700);
  assert.equal(await page.getByTestId("daily-modal").count(), 0, "only once a day");
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
