// Headless race drivers for tests: a careful bot (dodges what it sees) and a random one.

import { RACE } from "../js/data/tracks.js";
import { createRace, step, steer } from "../js/games/race/physics.js";

const SOLID = new Set(["obstacle", "traffic"]);

function blocked(race, lane, from, to) {
  return race.objects.some((o) => SOLID.has(o.kind) && !o.hit && Math.abs(o.x - lane) < 0.7 && o.d > from && o.d < to);
}

/** Careful driver: if its lane is blocked ahead, move toward the nearest free lane. */
export function carefulBot(race) {
  const p = race.player;
  if (Math.abs(p.x - p.lane) > 0.2) return; // still changing lanes
  const look = p.speed * 1.1 + 8;
  if (!blocked(race, p.lane, p.d - 2, p.d + look)) return;
  const options = [p.lane - 1, p.lane + 1].filter((l) => l >= 0 && l < RACE.lanes && !blocked(race, l, p.d - 4, p.d + look));
  if (options.length) steer(race, options[0] - p.lane);
}

/** Random driver: taps a random side every 0.4–1.4 s. */
export function randomBot() {
  let next = 0;
  return (race) => {
    if (race.time < next) return;
    next = race.time + 0.4 + race.rng.random() * 1.0;
    steer(race, race.rng.random() < 0.5 ? -1 : 1);
  };
}

/** Run a full race (max `maxTime` s) and return the finished race. */
export function runRace({ track, level, effects, rng, driver, dt = 1 / 30, maxTime = 180, short = false }) {
  const race = createRace({ track, level, effects, rng, short });
  while (race.phase !== "finished" && race.time < maxTime) {
    if (race.phase === "racing") driver?.(race);
    step(race, dt);
    race.events.length = 0;
  }
  return race;
}
