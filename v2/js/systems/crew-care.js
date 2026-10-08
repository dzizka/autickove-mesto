// Buddies grow also without races (DESIGN-v2 §6.1, part 21): feeding candy 🍬, a daily pat,
// playing the star game with a buddy and the games room. Nothing ever gets worse: no hunger.

import { getState, update, todayKey } from "../core/state.js";
import { emit } from "../core/events.js";
import { CREW_RULES as R } from "../data/crew.js";
import { addBuddyXp, xpToNext, activeBuddy } from "./crew.js";
import { addCoins } from "./economy.js";

const buddy = (id, s = getState()) => s.crew.owned[id] || null;
const maxed = (b) => !b || b.level >= R.maxLevel;

/** XP one candy gives this buddy now (about a third of a level). */
export const feedXp = (b) => Math.ceil(xpToNext(b?.level || 1) * R.feedShare);

export function canFeed(id, s = getState()) {
  return !maxed(buddy(id, s)) && s.crew.candy >= 1;
}

/** Feed one candy: { xp, levels } or null (no candy, or the buddy is on the top level). */
export function feed(id) {
  if (!canFeed(id)) return null;
  const xp = feedXp(buddy(id));
  update((s) => (s.crew.candy -= 1));
  const levels = addBuddyXp(id, xp);
  emit("buddyFed", { id, xp });
  return { xp, levels };
}

/** The first pat of the day gives a little XP: { xp, levels } (xp 0 on later pats). */
export function petXp(id, now = new Date()) {
  const b = buddy(id);
  if (!b) return { xp: 0, levels: [] };
  const day = todayKey(now);
  if (b.petDay === day || maxed(b)) return { xp: 0, levels: [] };
  update(() => (b.petDay = day));
  return { xp: R.petXp, levels: addBuddyXp(id, R.petXp) };
}

/** How many star games with this buddy still count today (0 … playsPerDay). */
export function playsLeft(id, now = new Date(), s = getState()) {
  const b = buddy(id, s);
  if (!b) return 0;
  return b.playDay === todayKey(now) ? Math.max(0, R.playsPerDay - (b.plays || 0)) : R.playsPerDay;
}

/**
 * A star game ended with `caught` stars. It counts while plays are left today:
 * { xp, coins, levels, counted }.
 */
export function recordPlay(id, caught, now = new Date()) {
  const b = buddy(id);
  const n = Math.max(0, Math.round(Number(caught) || 0));
  if (!b || playsLeft(id, now) <= 0) return { xp: 0, coins: 0, levels: [], counted: false };
  const day = todayKey(now);
  update(() => {
    b.plays = b.playDay === day ? (b.plays || 0) + 1 : 1;
    b.playDay = day;
  });
  const xp = maxed(b) ? 0 : n * R.playXpPerStar;
  const coins = n * R.playCoinsPerStar;
  addCoins(coins);
  return { xp, coins, levels: addBuddyXp(id, xp), counted: true };
}

/** Games room: the buddy in the car learns too. Returns { id, xp, levels } or null. */
export function giveMiniXp(stars) {
  const b = activeBuddy();
  if (!b) return null;
  const xp = R.miniXp + (stars >= 3 ? R.miniXp3 : 0);
  return { id: b.id, xp, levels: addBuddyXp(b.id, xp) };
}
