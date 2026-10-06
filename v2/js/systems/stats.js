// Car stats: sum of equipped parts (sets and crew buddy join in parts 4 and 5),
// stat bars, car power, and how stats turn into race effects.

import { STATS, STAT_IDS, EFFECTS } from "../data/stats.js";
import { RACE, TRACKS } from "../data/tracks.js";
import { getState } from "../core/state.js";

const num = (v) => (Number.isFinite(v) ? v : 0);

/** Upgrade bonus: each +1 adds 8 % to the part's values (part 2 uses it). */
export const plusFactor = (plus) => 1 + 0.08 * Math.max(0, Math.min(5, num(plus)));

export function partStats(part) {
  const out = Object.fromEntries(STAT_IDS.map((id) => [id, 0]));
  if (!part?.main) return out;
  const f = plusFactor(part.plus);
  out[part.main.stat] = (out[part.main.stat] ?? 0) + num(part.main.value) * f;
  for (const s of part.subs || []) if (s.stat in out) out[s.stat] += num(s.value) * f;
  return out;
}

/** Total stats of the car from equipped parts. */
export function carStats(equipped = getState().car.equipped) {
  const total = Object.fromEntries(STAT_IDS.map((id) => [id, 0]));
  for (const part of Object.values(equipped || {})) {
    const ps = partStats(part);
    for (const id of STAT_IDS) total[id] += ps[id];
  }
  for (const id of STAT_IDS) total[id] = Math.round(total[id]);
  return total;
}

/** Car power: one big number = the sum of all stats (DESIGN-v2 §4.3). */
export function carPower(stats = carStats()) {
  return STAT_IDS.reduce((sum, id) => sum + num(stats[id]), 0);
}

/** 0..5 lit segments of a stat bar. */
export function statBars(statId, value) {
  const bars = STATS[statId]?.bars || [1, 20, 45, 75, 110];
  return bars.filter((t) => num(value) >= t).length;
}

/** Fraction 0..1 inside the current segment (for a smooth fill of the next one). */
export function statBarFill(statId, value) {
  const bars = STATS[statId]?.bars || [1, 20, 45, 75, 110];
  const lit = statBars(statId, value);
  if (lit >= bars.length) return 0;
  const lo = lit === 0 ? 0 : bars[lit - 1];
  return Math.max(0, Math.min(1, (num(value) - lo) / (bars[lit] - lo)));
}

/** Race effects derived from stats. All values finite by construction. */
export function raceEffects(stats = carStats()) {
  const s = Object.fromEntries(STAT_IDS.map((id) => [id, Math.max(0, num(stats[id]))]));
  return {
    topSpeed: RACE.baseSpeed * (1 + s.speed * EFFECTS.speedPerPoint),
    laneStiffness: 1 + s.handling * EFFECTS.handlingPerPoint, // lane-change spring
    gripOnSnow: Math.min(1, s.handling / 110), // 1 = no sliding at all
    shields: Math.min(EFFECTS.maxShields, Math.floor(s.armor / EFFECTS.shieldEvery)),
    slowTime: 1.6 / (1 + s.armor * EFFECTS.armorSlowPerPoint),
    fuelDrain: RACE.fuelDrainPerSecond / (1 + s.fuel * EFFECTS.fuelPerPoint),
    magnetLanes: s.magnet * EFFECTS.magnetLanesPerPoint,
    luck: s.luck * EFFECTS.luckPerPoint,
  };
}

export function getTrack(id) {
  return TRACKS.find((t) => t.id === id) || TRACKS[0];
}

/** Speed factor (×baseSpeed) of the fastest rival on a track level. */
export function rivalTopFactor(trackId, level) {
  const t = getTrack(trackId);
  const best = Math.max(...RACE.rivals.map((r) => r.pace));
  return (t.rivalBase + RACE.rivalLevelStep * (Math.max(1, level) - 1)) * best;
}

/** Recommended car power for a track level (DESIGN-v2 §4.1). */
export function recommendedPower(trackId, level) {
  const starter = 48;
  return Math.round(starter + Math.max(0, rivalTopFactor(trackId, level) - 0.92) * 1200);
}

/** "green" = you'll manage, "yellow" = hard, "red" = not yet. */
export function difficulty(power, recommended) {
  if (power >= recommended) return "green";
  if (power >= recommended * 0.8) return "yellow";
  return "red";
}
