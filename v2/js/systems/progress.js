// Player level (XP) and the play-time log for the parents' overview.

import { update, getState } from "../core/state.js";
import { emit } from "../core/events.js";
import { TRACKS } from "../data/tracks.js";

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

// ---------- race progress (DESIGN-v2 §4.1) ----------

const TRACK_ORDER = TRACKS.map((t) => t.id);
export const CHALLENGE_RACES = 3; // races on a track that fill the boss challenge bar

export function trackProgress(trackId, s = getState()) {
  const t = s.races.tracks[trackId] || {};
  return { unlocked: t.unlocked || 1, best: t.best || {}, challenge: t.challenge || 0, races: t.races || 0 };
}

/** Best place ever on the track (any level), or null. */
function bestPlace(trackId, s) {
  const places = Object.values(trackProgress(trackId, s).best).filter(Number.isFinite);
  return places.length ? Math.min(...places) : null;
}

/** A track opens after a medal (top 3) on the previous one. */
export function isTrackUnlocked(trackId, s = getState()) {
  const i = TRACK_ORDER.indexOf(trackId);
  if (i <= 0) return i === 0;
  const prev = bestPlace(TRACK_ORDER[i - 1], s);
  return prev !== null && prev <= 3;
}

export function isLevelUnlocked(trackId, level, s = getState()) {
  return isTrackUnlocked(trackId, s) && level >= 1 && level <= trackProgress(trackId, s).unlocked;
}

/** What a result would unlock, without changing anything (used by the podium). */
export function previewUnlocks({ track, level, place }, s = getState()) {
  const p = trackProgress(track, s);
  const out = { level: null, track: null };
  if (place === 1 && level === p.unlocked && level < 5) out.level = level + 1;
  const i = TRACK_ORDER.indexOf(track);
  const next = TRACK_ORDER[i + 1];
  if (next && place <= 3 && !isTrackUnlocked(next, s)) out.track = next;
  return out;
}

/** Store a finished race. Returns what got unlocked. */
export function recordRace({ track, level, place }) {
  if (!TRACK_ORDER.includes(track) || !(level >= 1 && level <= 5) || !(place >= 1 && place <= 4)) return { level: null, track: null };
  const unlocks = previewUnlocks({ track, level, place });
  update((s) => {
    const p = trackProgress(track, s);
    p.races += 1;
    p.challenge = Math.min(CHALLENGE_RACES, p.challenge + 1);
    p.best = { ...p.best, [level]: Math.min(p.best[level] ?? 9, place) };
    if (unlocks.level) p.unlocked = unlocks.level;
    s.races.tracks[track] = p;
    s.races.total += 1;
    if (place === 1) s.races.wins += 1;
  });
  return unlocks;
}

/** Test menu: open every track and level. */
export function unlockAllTracks() {
  update((s) => {
    for (const id of TRACK_ORDER) {
      const p = trackProgress(id, s);
      p.unlocked = 5;
      p.best = { ...p.best, 1: Math.min(p.best[1] ?? 3, 3) };
      s.races.tracks[id] = p;
    }
  });
}

// ---------- bosses (DESIGN-v2 §4.5) ----------

/** The boss comes when the challenge bar of a track is full. */
export function isBossReady(trackId, s = getState()) {
  return isTrackUnlocked(trackId, s) && trackProgress(trackId, s).challenge >= CHALLENGE_RACES;
}

export function bossWins(trackId, s = getState()) {
  return s.bosses?.[trackId] || 0;
}

/** After a boss race: a win empties the challenge bar and counts the win; a loss keeps the bar full. */
export function recordBoss({ track, bossWin }) {
  if (!TRACK_ORDER.includes(track)) return;
  update((s) => {
    const p = trackProgress(track, s);
    if (bossWin) {
      p.challenge = 0;
      s.bosses[track] = (s.bosses[track] || 0) + 1;
    } else {
      p.challenge = CHALLENGE_RACES;
    }
    s.races.tracks[track] = p;
  });
}

/** Test menu: fill every challenge bar. */
export function readyAllBosses() {
  update((s) => {
    for (const id of TRACK_ORDER) s.races.tracks[id] = { ...trackProgress(id, s), challenge: CHALLENGE_RACES };
  });
}
