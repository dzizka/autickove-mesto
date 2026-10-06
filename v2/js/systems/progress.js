// Player level (XP) and the play-time log for the parents' overview.

import { update, getState } from "../core/state.js";
import { emit } from "../core/events.js";

export const MAX_LEVEL = 50;
const LOG_DAYS = 30;

/** XP needed to go from `level` to level + 1. */
export function xpToNext(level) {
  return 40 + 20 * level;
}

/** 0..1 progress inside the current level (1 at max level). */
export function levelProgress(s = getState()) {
  if (s.level >= MAX_LEVEL) return 1;
  return Math.min(1, s.xp / xpToNext(s.level));
}

/** Add XP, handling any number of level-ups. Returns the list of new levels. */
export function addXp(amount) {
  const n = Number.isFinite(amount) && amount > 0 ? Math.round(amount) : 0;
  const gained = [];
  if (!n) return gained;
  update((s) => {
    s.xp += n;
    while (s.level < MAX_LEVEL && s.xp >= xpToNext(s.level)) {
      s.xp -= xpToNext(s.level);
      s.level++;
      gained.push(s.level);
    }
    if (s.level >= MAX_LEVEL) s.xp = 0;
  });
  for (const level of gained) emit("levelUp", { level });
  return gained;
}

export function dayKey(date = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

function todayEntry(s) {
  const key = dayKey();
  s.playLog[key] ??= { seconds: 0, games: {} };
  return s.playLog[key];
}

function pruneLog(s) {
  const keys = Object.keys(s.playLog).sort();
  for (const k of keys.slice(0, Math.max(0, keys.length - LOG_DAYS))) delete s.playLog[k];
}

export function addPlaySeconds(seconds) {
  if (!(seconds > 0)) return;
  update((s) => {
    todayEntry(s).seconds += Math.round(seconds);
    pruneLog(s);
  });
}

export function countGamePlayed(gameId) {
  update((s) => {
    const games = todayEntry(s).games;
    games[gameId] = (games[gameId] || 0) + 1;
  });
}

/** Counts play time while the page is visible. Call once at startup. */
export function startPlayClock(intervalSec = 15) {
  setInterval(() => {
    if (!document.hidden) addPlaySeconds(intervalSec);
  }, intervalSec * 1000);
}
