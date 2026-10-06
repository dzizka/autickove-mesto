// Race simulation: player, rivals, traffic, collisions, pickups, fuel, placing.
// Pure logic without DOM, so tests can run whole races in Node.
// Events for sounds/effects are pushed to race.events and drained by the game.

import { RACE } from "../../data/tracks.js";
import { generateCourse, spawnFuelIfLow } from "./spawner.js";

const COUNTDOWN = 3; // seconds
const PLAYER_LEN = 4.2;
const HIT_WIDTH = 0.62; // lane units: closer than this = same lane for collisions
const TURBO_TIME = 2.6;
const MAGNET_TIME = 7;
const SOLID = new Set(["obstacle", "traffic"]);

const finite = (v, fallback = 0) => (Number.isFinite(v) ? v : fallback);

/**
 * @param {object} o
 * @param {object} o.track    entry of TRACKS
 * @param {number} o.level    1..5
 * @param {object} o.effects  from systems/stats.raceEffects()
 * @param {object} o.rng      core/rng.js (random, int, pick)
 * @param {boolean} [o.short] test-menu short race
 */
export function createRace({ track, level, effects, rng, short = false }) {
  const length = short ? RACE.shortLength : RACE.length;
  const rivalSpeed = (track.rivalBase + RACE.rivalLevelStep * (level - 1)) * RACE.baseSpeed;
  const grid = [
    { lane: 0, d: 8 },
    { lane: 2, d: 8 },
    { lane: 1, d: 14 },
  ];
  return {
    track,
    level,
    length,
    effects,
    rng,
    phase: "countdown", // countdown | racing | finished
    countdown: COUNTDOWN,
    time: 0,
    objects: generateCourse({ track, level, length, rng }),
    player: {
      lane: 1,
      x: 1,
      vx: 0,
      d: 0,
      speed: 0,
      shields: effects.shields,
      slowT: 0,
      turboT: 0,
      magnetT: 0,
      airT: 0,
      fuel: 1,
      coins: 0,
      hits: 0,
      finishTime: null,
    },
    rivals: RACE.rivals.map((r, i) => ({
      name: r.name,
      color: r.color,
      lane: grid[i].lane,
      x: grid[i].lane,
      d: grid[i].d,
      speed: 0,
      top: rivalSpeed * r.pace,
      phase: rng.random() * Math.PI * 2,
      slowT: 0,
      finishTime: null,
      ahead: true, // is this rival ahead of the player (for overtake events)
    })),
    place: null,
    events: [],
  };
}

/** Change lane by -1 (left) or +1 (right). */
export function steer(race, dir) {
  if (race.phase === "finished") return;
  const p = race.player;
  const lane = Math.max(0, Math.min(RACE.lanes - 1, p.lane + Math.sign(dir)));
  if (lane !== p.lane) {
    p.lane = lane;
    race.events.push({ type: "steer" });
  }
}

export function currentPlace(race) {
  if (race.place) return race.place;
  return 1 + race.rivals.filter((r) => r.finishTime !== null || r.d > race.player.d).length;
}

/** Advance the race by dt seconds (call with small dt, e.g. ≤ 0.05). */
export function step(race, dt) {
  dt = Math.max(0, Math.min(0.05, finite(dt)));
  if (race.phase === "countdown") {
    const before = Math.ceil(race.countdown);
    race.countdown -= dt;
    if (Math.ceil(race.countdown) !== before && race.countdown > 0) race.events.push({ type: "count", n: Math.ceil(race.countdown) });
    if (race.countdown <= 0) {
      race.phase = "racing";
      race.events.push({ type: "go" });
    }
    return;
  }
  race.time += dt;
  if (race.phase === "racing") updatePlayer(race, dt);
  updateRivals(race, dt);
  updateTraffic(race, dt);
  if (race.phase === "racing") {
    collide(race);
    if (spawnFuelIfLow(race)) race.events.push({ type: "fuelSpawn" });
  }
  for (const o of race.objects) if (o.hit) o.fly += dt;
  // forget objects far behind the player
  const behind = race.player.d - 60;
  if (race.objects.length && race.objects[0].d < behind) race.objects = race.objects.filter((o) => o.d >= behind);
  checkFinish(race);
}

function updatePlayer(race, dt) {
  const p = race.player;
  const e = race.effects;
  p.slowT = Math.max(0, p.slowT - dt);
  p.turboT = Math.max(0, p.turboT - dt);
  p.magnetT = Math.max(0, p.magnetT - dt);
  p.airT = Math.max(0, p.airT - dt);
  p.fuel = Math.max(0, p.fuel - e.fuelDrain * dt);

  let target = e.topSpeed;
  if (p.slowT > 0) target *= 0.45;
  if (p.fuel <= 0) target *= 0.6;
  if (p.turboT > 0) target *= 1.45;
  const accel = p.speed < target ? 1.6 : 4;
  p.speed += (target - p.speed) * Math.min(1, dt * accel);
  p.d += p.speed * dt;

  // Lane change as a spring: handling makes it stiffer; snow makes it slide.
  const k = 90 * e.laneStiffness;
  const slide = race.track.slippery * (1 - e.gripOnSnow);
  const damping = 2 * Math.sqrt(k) * (1 - 0.8 * Math.min(1, slide));
  p.vx += (k * (p.lane - p.x) - damping * p.vx) * dt;
  p.x = Math.max(-0.35, Math.min(RACE.lanes - 0.65, p.x + p.vx * dt));
}

function laneBlocked(race, lane, d, ahead) {
  return race.objects.some((o) => SOLID.has(o.kind) && !o.hit && Math.abs(o.x - lane) < 0.6 && o.d > d - 3 && o.d < d + ahead);
}

function updateRivals(race, dt) {
  const p = race.player;
  for (const r of race.rivals) {
    r.slowT = Math.max(0, r.slowT - dt);
    const wave = 1 + 0.03 * Math.sin(race.time * 0.7 + r.phase);
    const target = r.top * wave * (r.slowT > 0 ? 0.5 : 1) * (race.phase === "countdown" ? 0 : 1);
    r.speed += (target - r.speed) * Math.min(1, dt * 1.6);
    r.d += r.speed * dt;
    // dodge obstacles and traffic ahead, and make room for the player coming from behind
    // (rivals are never solid for the player: bumping into them would only frustrate)
    const playerBehind = race.phase === "racing" && Math.abs(p.x - r.lane) < 0.6 && p.d < r.d && r.d - p.d < 12 && p.speed > r.speed;
    if (laneBlocked(race, r.lane, r.d, 18) || playerBehind) {
      const options = [r.lane - 1, r.lane + 1].filter((l) => l >= 0 && l < RACE.lanes && !laneBlocked(race, l, r.d, 18));
      if (options.length) r.lane = options[Math.floor(race.rng.random() * options.length)];
    }
    r.x += (r.lane - r.x) * Math.min(1, dt * 6);
    for (const o of race.objects) {
      if (SOLID.has(o.kind) && !o.hit && Math.abs(o.x - r.x) < 0.5 && Math.abs(o.d - r.d) < 2.5 && r.slowT <= 0) r.slowT = 1;
    }
    if (r.finishTime === null && r.d >= race.length) r.finishTime = race.time;
    // overtakes (only while the player races)
    const ahead = r.d > p.d;
    if (race.phase === "racing" && r.ahead && !ahead) race.events.push({ type: "overtake", rival: r.name });
    if (race.phase === "racing" && !r.ahead && ahead) race.events.push({ type: "overtaken", rival: r.name });
    r.ahead = ahead;
  }
}

function updateTraffic(race, dt) {
  for (const o of race.objects) {
    if (o.kind !== "traffic" || o.hit) continue;
    o.d += o.speed * dt;
    const blocked = race.objects.some((b) => b.kind === "obstacle" && !b.hit && b.lane === o.lane && b.d > o.d && b.d < o.d + 14);
    if (blocked) {
      const options = [o.lane - 1, o.lane + 1].filter((l) => l >= 0 && l < RACE.lanes && !laneBlocked(race, l, o.d, 14));
      if (options.length) o.lane = options[0];
      else o.speed = 0; // parks behind the obstacle; still avoidable in the free lane
    }
    o.x += (o.lane - o.x) * Math.min(1, dt * 3);
  }
}

function collide(race) {
  const p = race.player;
  const e = race.effects;
  const magnetLanes = e.magnetLanes + (p.magnetT > 0 ? 2.5 : 0);
  for (const o of race.objects) {
    if (o.taken || o.hit) continue;
    const dx = Math.abs(o.x - p.x);
    const dd = Math.abs(o.d - p.d);
    const touching = dx < HIT_WIDTH && dd < (PLAYER_LEN + o.len) / 2;

    if (o.kind === "coin") {
      if (!o.pulled && dx < 0.5 + magnetLanes && o.d > p.d - 2 && o.d < p.d + 6 + magnetLanes * 4 && magnetLanes > 0.3) o.pulled = true;
      if (o.pulled) {
        o.x += (p.x - o.x) * 0.35;
        o.d += (p.d - o.d) * 0.35;
      }
      if (touching || (o.pulled && dx < 0.25 && dd < 1.5)) {
        o.taken = true;
        p.coins += o.value;
        race.events.push({ type: "coin", pulled: o.pulled });
      }
    } else if (o.kind === "powerup" || o.kind === "fuel") {
      if (!touching) continue;
      o.taken = true;
      if (o.kind === "fuel") {
        p.fuel = Math.min(1, p.fuel + 0.5);
        race.events.push({ type: "fuel" });
      } else {
        if (o.value === "turbo") p.turboT = TURBO_TIME;
        if (o.value === "shield") p.shields = Math.min(6, p.shields + 1);
        if (o.value === "magnet") p.magnetT = MAGNET_TIME;
        race.events.push({ type: "powerup", id: o.value });
      }
    } else if (o.kind === "ramp") {
      if (touching && p.airT <= 0) {
        o.taken = true;
        p.airT = race.track.airTime;
        race.events.push({ type: "jump" });
      }
    } else if (touching && p.airT <= 0) {
      hitSolid(race, o);
    }
  }
}

function hitSolid(race, o) {
  const p = race.player;
  if (o) {
    o.hit = true;
    o.spin = race.rng.random() < 0.5 ? -1 : 1;
  }
  if (p.turboT > 0) {
    race.events.push({ type: "smash" });
    return;
  }
  if (p.shields > 0) {
    p.shields--;
    race.events.push({ type: "shield" });
    return;
  }
  p.hits++;
  p.slowT = race.effects.slowTime;
  p.speed *= 0.5;
  race.events.push({ type: "hit" });
}

function checkFinish(race) {
  const p = race.player;
  if (race.phase !== "racing" || p.d < race.length) return;
  p.finishTime = race.time;
  race.place = 1 + race.rivals.filter((r) => r.finishTime !== null).length;
  race.phase = "finished";
  race.events.push({ type: "finish", place: race.place });
}

/** Final order for the podium: [{ name, color, isPlayer }] best first. */
export function finalOrder(race) {
  const rows = race.rivals.map((r) => ({ name: r.name, color: r.color, isPlayer: false, t: r.finishTime ?? Infinity, d: r.d }));
  rows.push({ name: "Ty", color: null, isPlayer: true, t: race.player.finishTime ?? Infinity, d: race.player.d });
  return rows.sort((a, b) => a.t - b.t || b.d - a.d);
}
