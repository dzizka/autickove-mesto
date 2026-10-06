// Boss race (DESIGN-v2 §4.5): one big rival that throws things on the road ahead of you.
// Every throw shows a target ⭕ first and never blocks all lanes, so it can always be dodged.

import { RACE } from "../../data/tracks.js";
import { BOSS } from "../../data/bosses.js";
import { makeObject } from "./spawner.js";

const range = (rng, [a, b]) => a + rng.random() * (b - a);

/** The boss as a rival: faster than the level's best rival only by its pace factor. */
export function createBossRival(boss, track, level, rng) {
  const best = Math.max(...RACE.rivals.map((r) => r.pace));
  const top = (track.rivalBase + RACE.rivalLevelStep * (level - 1)) * best * (boss.pace || 1) * RACE.baseSpeed;
  return {
    name: boss.name,
    color: boss.color,
    icon: boss.icon,
    isBoss: true,
    lane: 1,
    x: 1,
    d: 16,
    speed: 0,
    top,
    phase: rng.random() * Math.PI * 2,
    slowT: 0,
    finishTime: null,
    ahead: true,
    throwT: range(rng, BOSS.throwEvery),
    laneT: 2,
  };
}

function laneFree(race, lane, d) {
  return !race.objects.some((o) => (o.kind === "obstacle" || o.kind === "traffic" || o.kind === "ramp") && !o.hit && Math.abs(o.x - lane) < 0.6 && Math.abs(o.d - d) < 8);
}

/** Throws and lane changes. Called every step while racing. */
export function updateBoss(race, dt) {
  const b = race.rivals.find((r) => r.isBoss);
  if (!b || race.phase !== "racing") return;
  const p = race.player;
  for (const o of race.objects) if (o.warn > 0) o.warn = Math.max(0, o.warn - dt);

  b.laneT -= dt;
  if (b.laneT <= 0) {
    b.laneT = 1.5 + race.rng.random() * 2;
    b.lane = race.rng.int(0, RACE.lanes - 1);
  }

  b.throwT -= dt;
  if (b.throwT > 0 || b.finishTime !== null) return; // also when behind: it throws over you
  b.throwT = range(race.rng, BOSS.throwEvery);
  const d = p.d + range(race.rng, BOSS.throwAhead);
  if (d > race.length - 20) return;
  // keep at least one lane open at the landing spot
  const free = [...Array(RACE.lanes).keys()].filter((l) => laneFree(race, l, d));
  if (free.length < 2) return;
  const lane = free[race.rng.int(0, free.length - 1)];
  const thing = makeObject("obstacle", { lane, d, icon: race.boss.throws, len: 1.6 });
  thing.warn = BOSS.warnTime;
  race.objects.push(thing);
  race.events.push({ type: "bossThrow" });
}
