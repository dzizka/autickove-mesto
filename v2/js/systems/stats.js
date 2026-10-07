// Car stats: sum of equipped parts, set bonuses and the crew buddy,
// stat bars, car power, and how stats turn into race effects.

import { STATS, STAT_IDS, EFFECTS } from "../data/stats.js";
import { RACE, TRACKS } from "../data/tracks.js";
import { getState } from "../core/state.js";
import { SETS } from "../data/sets.js";
import { crewBonus } from "./crew.js";

const num = (v) => (Number.isFinite(v) ? v : 0);

/** Upgrade bonus: each +1 adds EFFECTS.upgradePerPlus to the part's values. */
export const plusFactor = (plus) => 1 + EFFECTS.upgradePerPlus * Math.max(0, Math.min(5, num(plus)));

export function partStats(part) {
  const out = Object.fromEntries(STAT_IDS.map((id) => [id, 0]));
  if (!part?.main) return out;
  const f = plusFactor(part.plus);
  out[part.main.stat] = (out[part.main.stat] ?? 0) + num(part.main.value) * f;
  for (const s of part.subs || []) if (s.stat in out) out[s.stat] += num(s.value) * f;
  return out;
}

/** How many parts of each set are mounted: { police: 2, … }. */
export function setCounts(equipped = getState().car.equipped) {
  const out = {};
  for (const part of Object.values(equipped || {})) if (part?.set) out[part.set] = (out[part.set] || 0) + 1;
  return out;
}

/** Active set bonuses: [{ set, pieces, bonus }] (3 pieces → big bonus instead of the small one). */
export function activeSetBonuses(equipped = getState().car.equipped) {
  const counts = setCounts(equipped);
  return SETS.filter((st) => (counts[st.id] || 0) >= 2).map((st) => ({ set: st, pieces: counts[st.id], bonus: counts[st.id] >= 3 ? st.bonus3 : st.bonus2 }));
}

/** Legendary abilities on mounted parts (DESIGN-v2 §4.4). */
export function carAbilities(equipped = getState().car.equipped) {
  return new Set(Object.values(equipped || {}).map((p) => p?.legendary).filter(Boolean));
}

/** Look overrides from complete sets (siren, flames behind the car, …). */
export function setLook(equipped = getState().car.equipped) {
  return Object.assign({}, ...activeSetBonuses(equipped).filter((b) => b.pieces >= 3).map((b) => b.set.look));
}

/**
 * Total stats of the car: equipped parts, set bonuses and the crew buddy's stat ability.
 * The buddy counts only for the player's own car (default argument), not for test cars.
 */
export function carStats(equipped = getState().car.equipped, withCrew = equipped === getState().car.equipped) {
  const total = Object.fromEntries(STAT_IDS.map((id) => [id, 0]));
  for (const part of Object.values(equipped || {})) {
    const ps = partStats(part);
    for (const id of STAT_IDS) total[id] += ps[id];
  }
  for (const { bonus } of activeSetBonuses(equipped)) {
    for (const b of bonus) if (b.stat in total) total[b.stat] = total[b.stat] * (1 + (b.pct || 0)) + (b.flat || 0);
  }
  if (withCrew) for (const [stat, v] of Object.entries(crewBonus().stats)) if (stat in total) total[stat] += v;
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

/**
 * Race effects derived from stats and legendary abilities. All values finite by construction.
 * Abilities that change numbers live here; abilities with events live in games/race/abilities.js.
 */
export function raceEffects(stats = carStats(), abilities = new Set(), crew = { shields: 0, coinMult: 1 }) {
  const s = Object.fromEntries(STAT_IDS.map((id) => [id, Math.max(0, num(stats[id]))]));
  const a = abilities instanceof Set ? abilities : new Set(abilities || []);
  const fx = {
    topSpeed: RACE.baseSpeed * (1 + s.speed * EFFECTS.speedPerPoint),
    laneStiffness: 1 + s.handling * EFFECTS.handlingPerPoint, // lane-change spring
    gripOnSnow: Math.min(1, s.handling / 110), // 1 = no sliding at all
    shields: Math.min(EFFECTS.maxShields, Math.floor(s.armor / EFFECTS.shieldEvery)),
    slowTime: 1.6 / (1 + s.armor * EFFECTS.armorSlowPerPoint),
    fuelDrain: RACE.fuelDrainPerSecond / (1 + s.fuel * EFFECTS.fuelPerPoint),
    magnetLanes: s.magnet * EFFECTS.magnetLanesPerPoint,
    luck: s.luck * EFFECTS.luckPerPoint,
    lightRange: 1,
    coinMult: Math.max(1, num(crew.coinMult) || 1), // crew buddy: more coins
  };
  fx.shields += Math.max(0, Math.floor(num(crew.shields))); // crew buddy: extra start shield
  if (a.has("iceShield")) fx.gripOnSnow = 1;
  if (a.has("headlight")) fx.lightRange = 2;
  if (a.has("superMagnet")) fx.magnetLanes += 2.5;
  if (a.has("endlessTank")) fx.fuelDrain = 0;
  if (a.has("bubble")) fx.shields += 2;
  return fx;
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
/**
 * Recommended car power for a track level (DESIGN-v2 §4.1): the power of an evenly built car
 * whose top speed beats the fastest rival by a small margin (for a child's mistakes).
 * Power ≈ 6 × speed stat; top speed = base × (1 + speed × speedPerPoint).
 */
export function recommendedPower(trackId, level) {
  const needSpeed = (rivalTopFactor(trackId, level) * (1 + EFFECTS.recommendMargin) - 1) / EFFECTS.speedPerPoint;
  return Math.max(EFFECTS.recommendMin, Math.round(STAT_IDS.length * needSpeed));
}

/** "green" = you'll manage, "yellow" = hard, "red" = not yet. */
export function difficulty(power, recommended) {
  if (power >= recommended) return "green";
  if (power >= recommended * 0.8) return "yellow";
  return "red";
}
