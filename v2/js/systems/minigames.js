// Games room logic (DESIGN-v2 §12): difficulty per game that grows by itself, stars and rewards.

import { getState, update } from "../core/state.js";
import { MINI, MINIGAMES } from "../data/minigames.js";

export const miniDef = (id) => MINIGAMES.find((g) => g.id === id) || null;
export const isMini = (id) => !!miniDef(id);

const clampLevel = (n) => Math.max(1, Math.min(MINI.levels, Math.round(Number(n) || 1)));

export function miniProgress(id, s = getState()) {
  const m = s.minigames?.[id] || {};
  return { level: clampLevel(m.level), plays: m.plays || 0, good: m.good || 0, best: m.best || 0 };
}

/** 3, 2 or 1 star: `value` (mistakes, seconds…) against the limits [for 3, for 2]. */
export function starsFor(value, [three, two]) {
  const v = Number.isFinite(value) ? value : Infinity;
  return v <= three ? 3 : v <= two ? 2 : 1;
}

export function miniReward(level, stars) {
  const l = clampLevel(level) - 1;
  const st = Math.max(1, Math.min(3, stars || 1)) - 1;
  return { coins: Math.round(MINI.baseCoins[l] * MINI.starFactor[st]), xp: MINI.baseXp[l] };
}

/**
 * Count a finished game. Two results with ≥ 2 stars on the current level move the game
 * one level up (never down). Returns { level, levelUp }.
 */
export function recordMini({ id, stars, level }) {
  if (!isMini(id)) return { level: 1, levelUp: false };
  let levelUp = false;
  let now = 1;
  update((s) => {
    s.minigames ||= {};
    const m = (s.minigames[id] ||= { level: 1, plays: 0, good: 0, best: 0 });
    m.level = clampLevel(m.level);
    m.plays = (m.plays || 0) + 1;
    m.best = Math.max(m.best || 0, stars || 0);
    if (stars >= 2 && clampLevel(level) === m.level && m.level < MINI.levels) {
      m.good = (m.good || 0) + 1;
      if (m.good >= MINI.levelUpAfter) {
        m.level += 1;
        m.good = 0;
        levelUp = true;
      }
    }
    now = m.level;
  });
  return { level: now, levelUp };
}
