// Car stats (DESIGN-v2 §4.3): the levels of the 6 parts of the chosen car plus the crew buddy,
// car power, the abilities of the parts (§4.4) and how stats turn into race effects.

import { STAT_IDS, SLOTS, EFFECTS } from "../data/stats.js";
import { RACE, TRACKS } from "../data/tracks.js";
import { GARAGE, SLOT_ABILITIES } from "../data/garage.js";
import { getState } from "../core/state.js";
import { crewBonus } from "./crew.js";

const num = (v) => (Number.isFinite(v) ? v : 0);
export const SLOT_IDS = SLOTS.map((s) => s.id);

/** A part level, always a whole number 1..maxLevel. */
export const clampLevel = (l) => Math.max(1, Math.min(GARAGE.maxLevel, Math.floor(num(l)) || 1));

/** Stat of a part on a level: 8 at level 1, +6 per level (§4.3). */
export const slotStat = (level) => GARAGE.statBase + (clampLevel(level) - 1) * GARAGE.statPerLevel;

/** Levels of every part of one car: { engine: 1, … } (a car never upgraded is all 1). */
export function levelsOf(carId, s = getState()) {
  const saved = s.cars?.[carId] || {};
  return Object.fromEntries(SLOT_IDS.map((id) => [id, clampLevel(saved[id])]));
}

/** The car the child drives now (chosen in the showroom). */
export const activeCarId = (s = getState()) => s.look?.car;

export const activeLevels = (s = getState()) => levelsOf(activeCarId(s), s);

/** Every part on `level` (test cars, simulations). */
export const evenLevels = (level) => Object.fromEntries(SLOT_IDS.map((id) => [id, clampLevel(level)]));

/** Abilities of the parts (§4.4): each part gets one at level 10 and one at level 20. */
export function carAbilities(levels = activeLevels()) {
  const out = new Set();
  for (const id of SLOT_IDS) GARAGE.abilityLevels.forEach((at, i) => clampLevel(levels?.[id]) >= at && out.add(SLOT_ABILITIES[id][i]));
  return out;
}

/**
 * Total stats of the car: one stat per part plus the crew buddy's stat ability.
 * The buddy counts only for the player's own car (no argument), not for test cars.
 */
export function carStats(levels = null, withCrew = levels === null) {
  const lv = levels || activeLevels();
  const total = Object.fromEntries(STAT_IDS.map((id) => [id, 0]));
  for (const slot of SLOTS) total[slot.main] += slotStat(lv[slot.id]);
  if (withCrew) for (const [stat, v] of Object.entries(crewBonus().stats)) if (stat in total) total[stat] += v;
  for (const id of STAT_IDS) total[id] = Math.round(total[id]);
  return total;
}

/** Car power: one big number = the sum of all stats (DESIGN-v2 §4.3). */
export function carPower(stats = carStats()) {
  return STAT_IDS.reduce((sum, id) => sum + num(stats[id]), 0);
}

/**
 * Race effects derived from stats and part abilities. All values finite by construction.
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
