// Race simulation: player, rivals, traffic, collisions, pickups, fuel, placing.
// Pure logic without DOM, so tests can run whole races in Node.
// Events for sounds/effects are pushed to race.events and drained by the game.

import { RACE } from "../../data/tracks.js";
import { generateCourse, spawnFuelIfLow } from "./spawner.js";
import { initAbilities, onGo, updateAbilities, absorbHit, coinValue, rampJump, pickStar } from "./abilities.js";
import { createBossRival, updateBoss } from "./boss.js";

const COUNTDOWN = 3; // seconds
const PLAYER_LEN = 4.2;
const HIT_WIDTH = 0.62; // lane units: closer than this = same lane for collisions
const TURBO_TIME = 2.6;
const MAGNET_TIME = 7;
const SOLID = new Set(["obstacle", "traffic", "animal"]);

const finite = (v, fallback = 0) => (Number.isFinite(v) ? v : fallback);

/**
 * @param {object} o
 * @param {object} o.track    entry of TRACKS
 * @param {number} o.level    1..5
 * @param {object} o.effects  from systems/stats.raceEffects()
 * @param {object} o.rng      core/rng.js (random, int, pick)
 * @param {boolean} [o.short] test-menu short race
 * @param {Set}     [o.abilities] ability ids of the car parts (levels 6 and 14)
 * @param {object}  [o.boss] entry of BOSSES for a boss race (one big rival instead of three)
 * @param {number}  [o.ease] 0…0.12: rivals this much slower after many tries (systems/progress.rivalEase)
 */
export function createRace({ track, level, effects, rng, short = false, abilities = new Set(), boss = null, ease = 0 }) {
  const length = short ? RACE.shortLength : RACE.length;
  const slow = 1 - Math.max(0, Math.min(RACE.easeMax, Number(ease) || 0)); // no-frustration help
  const rivalSpeed = (track.rivalBase + RACE.rivalLevelStep * (level - 1)) * RACE.baseSpeed * slow;
  const lanes = track.lanes || RACE.lanes;
  const mid = Math.floor((lanes - 1) / 2); // the player starts in the middle (left of it on even roads)
  const grid = [
    { lane: 0, d: 8 },
    { lane: lanes - 1, d: 8 },
    { lane: Math.min(lanes - 1, mid + 1), d: 14 },
  ];
  const race = {
    track,
    level,
    lanes,
    length,
    effects,
    rng,
    abilities: abilities instanceof Set ? abilities : new Set(abilities),
    boss,
    // movement scale: 1 up to the visible speed cap, below 1 for faster cars (RACE.visibleCap)
    view: visibleScale(effects.topSpeed),
    phase: "countdown", // countdown | racing | finished
    countdown: COUNTDOWN,
    time: 0,
    objects: generateCourse({ track, level, length, rng }),
    player: {
      lane: mid,
      x: mid,
      vx: 0,
      d: 0,
      speed: 0,
      shields: effects.shields,
      slowT: 0,
      turboT: 0,
      magnetT: 0,
      airT: 0,
      airMax: track.airTime, // length of the current jump (for drawing)
      fuel: 1,
      coins: 0,
      hits: 0,
      finishTime: null,
    },
    rivals: boss ? [createBossRival(boss, track, level, rng, slow)] : RACE.rivals.map((r, i) => ({
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
  initAbilities(race);
  return race;
}

/** How much a car's movement is slowed so its speed on screen stays at RACE.visibleCap. */
export function visibleScale(topSpeed) {
  const cap = RACE.baseSpeed * RACE.visibleCap;
  return Number.isFinite(topSpeed) && topSpeed > cap ? cap / topSpeed : 1;
}

/** Change lane by -1 (left) or +1 (right). */
export function steer(race, dir) {
  if (race.phase === "finished") return;
  const p = race.player;
  const lane = Math.max(0, Math.min(race.lanes - 1, p.lane + Math.sign(dir)));
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
      onGo(race);
    }
    return;
  }
  race.time += dt;
  if (race.phase === "racing") {
    updatePlayer(race, dt);
    updateAbilities(race, dt);
  }
  updateRivals(race, dt);
  updateBoss(race, dt);
  updateTraffic(race, dt);
  updateAnimals(race, dt);
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
  p.fuel = Math.max(0, p.fuel - e.fuelDrain * dt * race.view);

  let target = e.topSpeed;
  if (p.slowT > 0) target *= 0.45;
  if (p.fuel <= 0) target *= 0.6;
  if (p.turboT > 0) target *= 1.45;
  const accel = p.speed < target ? 1.6 : 4;
  p.speed += (target - p.speed) * Math.min(1, dt * accel);
  p.d += p.speed * dt * race.view;

  // Lane change as a spring: handling makes it stiffer; snow makes it slide.
  const k = 90 * e.laneStiffness;
  const slide = race.track.slippery * (1 - e.gripOnSnow);
  const damping = 2 * Math.sqrt(k) * (1 - 0.8 * Math.min(1, slide));
  p.vx += (k * (p.lane - p.x) - damping * p.vx) * dt;
  p.x = Math.max(-0.35, Math.min(race.lanes - 0.65, p.x + p.vx * dt));
}

function laneBlocked(race, lane, d, ahead) {
  return race.objects.some((o) => SOLID.has(o.kind) && !o.hit && o.warn <= 0 && Math.abs(o.x - lane) < 0.6 && o.d > d - 3 && o.d < d + ahead);
}

function updateRivals(race, dt) {
  const p = race.player;
  for (const r of race.rivals) {
    r.slowT = Math.max(0, r.slowT - dt);
    const wave = 1 + 0.03 * Math.sin(race.time * 0.7 + r.phase);
    const target = r.top * wave * (r.slowT > 0 ? 0.5 : 1) * (race.phase === "countdown" ? 0 : 1);
    r.speed += (target - r.speed) * Math.min(1, dt * 1.6);
    r.d += r.speed * dt * race.view;
    // dodge obstacles and traffic ahead, and make room for the player coming from behind
    // (rivals are never solid for the player: bumping into them would only frustrate)
    const playerBehind = !r.isBoss && race.phase === "racing" && Math.abs(p.x - r.lane) < 0.6 && p.d < r.d && r.d - p.d < 12 && p.speed > r.speed;
    if (!r.isBoss && (laneBlocked(race, r.lane, r.d, 18) || playerBehind)) {
      const options = [r.lane - 1, r.lane + 1].filter((l) => l >= 0 && l < race.lanes && !laneBlocked(race, l, r.d, 18));
      if (options.length) r.lane = options[Math.floor(race.rng.random() * options.length)];
    }
    r.x += (r.lane - r.x) * Math.min(1, dt * 6);
    for (const o of race.objects) {
      if (r.isBoss) break; // the boss rolls over everything
      if (SOLID.has(o.kind) && !o.hit && o.warn <= 0 && Math.abs(o.x - r.x) < 0.5 && Math.abs(o.d - r.d) < 2.5 && r.slowT <= 0) r.slowT = 1;
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
    o.d += o.speed * dt * race.view;
    const blocked = race.objects.some((b) => (b.kind === "obstacle" || b.kind === "animal") && !b.hit && b.lane === o.lane && b.d > o.d && b.d < o.d + 14);
    if (blocked) {
      const options = [o.lane - 1, o.lane + 1].filter((l) => l >= 0 && l < race.lanes && !laneBlocked(race, l, o.d, 14));
      if (options.length) o.lane = options[0];
      else o.speed = 0; // parks behind the obstacle; still avoidable in the free lane
    }
    o.x += (o.lane - o.x) * Math.min(1, dt * 3);
  }
}

/**
 * Animals (part 25): wait beside the road, walk in when the player is RACE.animalTrigger metres
 * away, stop in their lane and walk on once the player is past. A bumped animal hops away.
 */
function updateAnimals(race, dt) {
  const p = race.player;
  for (const o of race.objects) {
    if (o.kind !== "animal") continue;
    if (!o.walking && race.phase === "racing" && o.d - p.d < RACE.animalTrigger) {
      o.walking = true;
      race.events.push({ type: "animal", icon: o.icon });
    }
    if (!o.walking) continue;
    const away = o.hit || p.d > o.d + 4;
    const target = away ? (o.dir > 0 ? race.lanes + 2 : -3) : o.goal;
    const stepX = o.speed * dt * race.view * (o.hit ? 2.5 : 1);
    o.x += Math.max(-stepX, Math.min(stepX, target - o.x));
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
        p.coins += coinValue(race, o.value);
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
    } else if (o.kind === "star") {
      if (!touching) continue;
      o.taken = true;
      pickStar(race);
    } else if (o.kind === "puddle") {
      // only a splash: nothing slows down (part 25)
      if (touching && p.airT <= 0 && !o.splashed) {
        o.splashed = true;
        race.events.push({ type: "splash", color: o.color });
      }
    } else if (o.kind === "sign") {
      continue;
    } else if (o.kind === "ramp") {
      if (touching && p.airT <= 0) {
        o.taken = true;
        p.airT = p.airMax = rampJump(race);
        race.events.push({ type: "jump" });
      }
    } else if (touching && p.airT <= 0 && o.warn <= 0 && race.ab.ghostT <= 0) {
      if (o.kind === "animal") race.events.push({ type: "hop", icon: o.icon }); // it hops away, unhurt
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
  if (absorbHit(race)) return;
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
  const rows = race.rivals.map((r) => ({ name: r.name, color: r.color, icon: r.icon || null, isBoss: !!r.isBoss, isPlayer: false, t: r.finishTime ?? Infinity, d: r.d }));
  rows.push({ name: "Ty", color: null, isPlayer: true, t: race.player.finishTime ?? Infinity, d: race.player.d });
  return rows.sort((a, b) => a.t - b.t || b.d - a.d);
}
