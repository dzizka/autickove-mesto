// Sticker album (DESIGN-v2 §13): stickers from packs, games and the daily gift; spare stickers
// turn a sticker silver or gold; a full page pays out once.

import { getState, update } from "../core/state.js";
import { emit } from "../core/events.js";
import { PAGES, ALBUM } from "../data/album.js";
import { spendCoins, addCoins } from "./economy.js";

export const openPages = (s = getState()) => PAGES.filter((p) => s.level >= p.unlockLevel);
export const stickerCount = (st, s = getState()) => s.album?.stickers?.[st] || 0;
export const stickerTier = (st, s = getState()) => Math.max(0, Math.min(ALBUM.tiers.length - 1, s.album?.tiers?.[st] || 0));
export const spare = (st, s = getState()) => Math.max(0, stickerCount(st, s) - 1);
export const pageOf = (st) => PAGES.find((p) => p.stickers.includes(st)) || null;
export const isGold = (st) => {
  const p = pageOf(st);
  return !!p && p.stickers.indexOf(st) >= p.stickers.length - 2;
};
export const pageFound = (page, s = getState()) => page.stickers.filter((st) => stickerCount(st, s) > 0).length;

function pickSticker(rng, s) {
  const pool = openPages(s).flatMap((p) => p.stickers);
  const weights = pool.map((st) => (isGold(st) ? ALBUM.goldWeight : 1) * (stickerCount(st, s) ? 1 : ALBUM.missingBoost));
  let roll = rng.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) if ((roll -= weights[i]) < 0) return pool[i];
  return pool[pool.length - 1];
}

/**
 * Give n stickers. Returns [{ sticker, isNew }] and pays out pages that just got full:
 * { stickers, pages: [{ page, coins }] }.
 */
export function giveStickers(n, rng) {
  const got = [];
  for (let i = 0; i < n; i++) {
    const st = pickSticker(rng, getState());
    const isNew = stickerCount(st) === 0;
    update((s) => {
      s.album.stickers[st] = (s.album.stickers[st] || 0) + 1;
    });
    got.push({ sticker: st, isNew });
  }
  const pages = [];
  for (const page of openPages()) {
    if (getState().album.pagesDone.includes(page.id) || pageFound(page) < page.stickers.length) continue;
    update((s) => s.album.pagesDone.push(page.id));
    addCoins(ALBUM.pageReward);
    pages.push({ page, coins: ALBUM.pageReward });
    emit("albumPageDone", { id: page.id });
  }
  emit("stickersGot", { count: n });
  return { stickers: got, pages };
}

export function buyPack(rng) {
  if (!spendCoins(ALBUM.packPrice)) return null;
  emit("packOpened", {});
  return giveStickers(ALBUM.packSize, rng);
}

/** Next tier for a sticker, paid with spare copies. */
export function upgradeSticker(st) {
  const tier = stickerTier(st);
  const next = ALBUM.tiers[tier + 1];
  if (!next || spare(st) < next.cost) return false;
  update((s) => {
    s.album.stickers[st] -= next.cost;
    s.album.tiers[st] = tier + 1;
  });
  emit("stickerUpgraded", { sticker: st, tier: tier + 1 });
  return true;
}
