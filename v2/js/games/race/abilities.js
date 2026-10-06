// Legendary abilities in the race simulation (DESIGN-v2 §4.4). Pure logic, no DOM.
// Abilities that only change numbers (ice shield, headlight, super magnet, endless tank,
// bubble start shields) are in systems/stats.raceEffects(). Every use pushes an
// { type: "ability", id } event so the game can play its own sound and effect.

import { RACE } from "../../data/tracks.js";
import { makeObject } from "./spawner.js";

const COIN_RAIN_EVERY = 20; // seconds
const BUBBLE_EVERY = 15; // seconds, regrow one shield
const ROCKET_TIME = 4; // seconds of turbo after the start
const STAR_TURBO = 1.3;
const SPRING_EVERY = 5; // every 5th obstacle in your lane is jumped automatically
const STARS_PER_100 = 0.7;

const fire = (race, id) => race.events.push({ type: "ability", id });

export function initAbilities(race) {
  race.ab = { ghostUsed: false, ghostT: 0, springSeen: 0, rainT: COIN_RAIN_EVERY, bubbleT: BUBBLE_EVERY, catSaid: false };
  if (race.abilities.has("starTurbo")) {
    // stars along the course, never on top of an obstacle
    for (let d = 120; d < race.length - 60; d += 100 / STARS_PER_100) {
      const lane = race.rng.int(0, RACE.lanes - 1);
      const blocked = race.objects.some((o) => (o.kind === "obstacle" || o.kind === "ramp") && o.lane === lane && Math.abs(o.d - d) < 6);
      if (!blocked) race.objects.push(makeObject("star", { lane, d, icon: "🌟", len: 1.4 }));
    }
    race.objects.sort((a, b) => a.d - b.d);
  }
}

export function onGo(race) {
  if (race.abilities.has("rocketStart")) {
    race.player.turboT = ROCKET_TIME;
    fire(race, "rocketStart");
  }
}

export function updateAbilities(race, dt) {
  const p = race.player;
  const ab = race.ab;
  const has = (id) => race.abilities.has(id);
  ab.ghostT = Math.max(0, ab.ghostT - dt);

  if (has("coinRain")) {
    ab.rainT -= dt;
    if (ab.rainT <= 0) {
      ab.rainT = COIN_RAIN_EVERY;
      for (let lane = 0; lane < RACE.lanes; lane++) {
        for (let i = 0; i < 3; i++) race.objects.push(makeObject("coin", { lane, d: p.d + 30 + i * 6 + lane * 2, icon: "🪙", len: 1, value: RACE.coinValue }));
      }
      fire(race, "coinRain");
    }
  }

  if (has("bubble") && p.shields < race.effects.shields) {
    ab.bubbleT -= dt;
    if (ab.bubbleT <= 0) {
      ab.bubbleT = BUBBLE_EVERY;
      p.shields++;
      fire(race, "bubble");
    }
  }

  if (has("springs") && p.airT <= 0) {
    for (const o of race.objects) {
      if (o.kind !== "obstacle" || o.hit || o.warn > 0 || o.springSeen) continue;
      const ahead = o.d - p.d;
      if (ahead > 0 && ahead < 7 && Math.abs(o.x - p.x) < 0.62) {
        o.springSeen = true;
        ab.springSeen++;
        if (ab.springSeen % SPRING_EVERY === 0) {
          p.airT = p.airMax = race.track.airTime;
          fire(race, "springs");
        }
      }
    }
  }
}

/** Ghost: the first hit of the race passes through. Returns true when the hit is absorbed. */
export function absorbHit(race) {
  if (!race.abilities.has("ghost") || race.ab.ghostUsed) return false;
  race.ab.ghostUsed = true;
  race.ab.ghostT = 1.2;
  fire(race, "ghost");
  return true;
}

export function coinValue(race, value) {
  if (race.abilities.has("goldCat")) {
    if (!race.ab.catSaid) {
      race.ab.catSaid = true;
      fire(race, "goldCat");
    }
    return value * 2;
  }
  return value;
}

/** Ramp jump; Skokan makes it longer and adds coins. Returns the air time. */
export function rampJump(race) {
  if (!race.abilities.has("jumper")) return race.track.airTime;
  race.player.coins += 5;
  fire(race, "jumper");
  return race.track.airTime * 1.6;
}

export function pickStar(race) {
  race.player.turboT = Math.max(race.player.turboT, STAR_TURBO);
  fire(race, "starTurbo");
}
