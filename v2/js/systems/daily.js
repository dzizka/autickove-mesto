// Daily gift (DESIGN-v2 §13): once per calendar day; days in a row make it bigger.

import { getState, update, todayKey } from "../core/state.js";
import { DAILY } from "../data/album.js";
import { addCoins } from "./economy.js";
import { giveStickers } from "./album.js";

const DAY = 86400000;

export function dailyReady(now = new Date(), s = getState()) {
  return s.daily?.last !== todayKey(now);
}

/** Which gift day (1…7) today's gift is. */
export function dailyDay(now = new Date(), s = getState()) {
  const yesterday = todayKey(new Date(now.getTime() - DAY));
  const streak = s.daily?.last === yesterday ? (s.daily.streak || 0) + 1 : 1;
  return Math.min(DAILY.coins.length, Math.max(1, streak));
}

export function claimDaily(rng, now = new Date()) {
  if (!dailyReady(now)) return null;
  const day = dailyDay(now);
  const yesterday = todayKey(new Date(now.getTime() - DAY));
  update((s) => {
    s.daily.streak = s.daily.last === yesterday ? (s.daily.streak || 0) + 1 : 1;
    s.daily.last = todayKey(now);
  });
  const coins = addCoins(DAILY.coins[day - 1]);
  const packs = DAILY.packs[day - 1] || 0;
  const album = packs ? giveStickers(packs * 3, rng) : null;
  const candy = DAILY.candy?.[day - 1] || 0;
  if (candy) update((s) => (s.crew.candy += candy));
  return { day, coins, packs, album, candy };
}
