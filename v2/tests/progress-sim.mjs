// Long-play simulation (DESIGN-v2 §4.8): a child plays race after race with the real game
// systems. It picks the newest level that shows 🟢 (🟡 if none), fights a boss when it is
// ready, mounts ✨ Best, dismantles grey and green parts and upgrades what it can afford.
// Run alone for a report: node v2/tests/progress-sim.mjs

import * as rng from "../js/core/rng.js";
import * as state from "../js/core/state.js";
import { TRACKS, RACE } from "../js/data/tracks.js";
import { BOSSES } from "../js/data/bosses.js";
import { SETS } from "../js/data/sets.js";
import { carStats, carPower, raceEffects, carAbilities, recommendedPower, difficulty } from "../js/systems/stats.js";
import { recordRace, recordBoss, isBossReady, isLevelUnlocked, isTrackUnlocked, trackProgress, rivalEase } from "../js/systems/progress.js";
import { grantRaceLoot, equipBest, dismantleLow, upgrade, canUpgrade } from "../js/systems/garage.js";
import { addCoins } from "../js/systems/economy.js";
import { crewBonus } from "../js/systems/crew.js";
import { createRace, step, steer } from "../js/games/race/physics.js";
import { raceReward } from "../js/games/race/index.js";

const SOLID = new Set(["obstacle", "traffic"]);

/** A child: reacts to what is ahead, but misses about one in four dangers. */
function kidDriver() {
  const seen = new Set();
  return (race) => {
    const p = race.player;
    if (Math.abs(p.x - p.lane) > 0.2) return;
    const look = p.speed * 1.1 + 8;
    const danger = race.objects.find((o) => SOLID.has(o.kind) && !o.hit && Math.abs(o.x - p.lane) < 0.7 && o.d > p.d - 2 && o.d < p.d + look);
    if (!danger || seen.has(danger.id)) return;
    seen.add(danger.id);
    if (race.rng.random() < 0.25) return; // missed it
    const free = [p.lane - 1, p.lane + 1].filter((l) => l >= 0 && l < RACE.lanes && !race.objects.some((o) => SOLID.has(o.kind) && !o.hit && Math.abs(o.x - l) < 0.7 && o.d > p.d - 4 && o.d < p.d + look));
    if (free.length) steer(race, free[0] - p.lane);
  };
}

function pickRace(s) {
  const power = carPower(carStats());
  const options = [];
  TRACKS.forEach((t, ti) => {
    if (!isTrackUnlocked(t.id, s)) return;
    for (let level = 1; level <= trackProgress(t.id, s).unlocked; level++) {
      options.push({ track: t, level, rank: ti * 10 + level, light: difficulty(power, recommendedPower(t.id, level)) });
    }
  });
  // the newest level; when it is 🔴 the child still tries it every other time
  // (the game says "you can try"), otherwise it plays the best 🟢 level
  const newest = [...options].sort((a, b) => b.rank - a.rank)[0];
  if (newest.light !== "red" || rng.random() < 0.5) return newest;
  return options.filter((o) => o.light === "green").sort((a, b) => b.rank - a.rank)[0] || newest;
}

export function simulate({ seed = 1, races = 400 } = {}) {
  rng.setSeed(seed);
  state.replace(state.defaultState());
  const marks = { maxGap: 0 };
  const mark = (key, i) => (marks[key] ??= i);
  let lastUnlock = 0;
  let unlockedLevels = 0;
  for (let i = 1; i <= races; i++) {
    const s = state.getState();
    // a glowing boss button is hard to resist: fight a ready boss on its newest 🟢/🟡 level
    const bossTrack = TRACKS.find((t) => isBossReady(t.id, s));
    let pick = pickRace(s);
    if (bossTrack) {
      const power = carPower(carStats());
      const levels = [5, 4, 3, 2, 1].filter((l) => isLevelUnlocked(bossTrack.id, l, s));
      const level = levels.find((l) => difficulty(power, recommendedPower(bossTrack.id, l)) !== "red") || 1;
      pick = { track: bossTrack, level };
    }
    const boss = isBossReady(pick.track.id, s) ? BOSSES.find((b) => b.track === pick.track.id) : null;
    const abilities = carAbilities();
    const race = createRace({ track: pick.track, level: pick.level, effects: raceEffects(carStats(), abilities, crewBonus()), rng, abilities, boss, ease: rivalEase(pick.track.id, pick.level) });
    const drive = kidDriver();
    while (race.phase !== "finished" && race.time < 240) {
      if (race.phase === "racing") drive(race);
      step(race, 1 / 30);
      race.events.length = 0;
    }
    const result = raceReward(race);
    addCoins(result.coins);
    recordRace(result.extra);
    if (boss) recordBoss(result.extra);
    if (result.extra.bossWin) mark(`boss-${pick.track.id}`, i);
    grantRaceLoot(result.extra);
    equipBest();
    if (state.getState().inventory.length > 24) dismantleLow();
    for (const part of Object.values(state.getState().car.equipped)) while (canUpgrade(part)) upgrade(part.uid);

    const st = state.getState();
    const parts = [...Object.values(st.car.equipped), ...st.inventory];
    if (parts.some((p) => p.rarity === "epic" || p.rarity === "legendary")) mark("firstEpic", i);
    if (st.legendariesFound.length) mark("firstLegendary", i);
    if (SETS.some((set) => (st.setsFound[set.id] || []).length >= 3)) mark("fullSetFound", i);
    TRACKS.forEach((t) => isTrackUnlocked(t.id, st) && mark(`track-${t.id}`, i));
    if (isLevelUnlocked("space", 5, st)) mark("space5", i);
    if (BOSSES.every((b) => (st.bosses[b.track] || 0) > 0)) mark("allBosses", i);
    marks.bosses = Object.values(st.bosses).filter(Boolean).length;
    // longest stretch of races without a new level or track, until Space 5 (frustration check)
    const levels = TRACKS.reduce((sum, t) => sum + (isTrackUnlocked(t.id, st) ? trackProgress(t.id, st).unlocked : 0), 0);
    if (levels > unlockedLevels) {
      unlockedLevels = levels;
      lastUnlock = i;
    } else if (!marks.space5) marks.maxGap = Math.max(marks.maxGap, i - lastUnlock);
    if (i % 100 === 0) marks[`power@${i}`] = carPower(carStats());
  }
  marks.finalPower = carPower(carStats());
  marks.coins = state.getState().coins;
  return marks;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const seed of [1, 2, 3]) console.log(seed, JSON.stringify(simulate({ seed, races: Number(process.argv[2]) || 400 })));
  process.exit(0);
}
