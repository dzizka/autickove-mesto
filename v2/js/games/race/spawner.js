// Builds the course: obstacles, traffic, coins, power-ups, ramps and fuel cans.
// Pure logic (no DOM). Every object gets ALL its fields at creation (DESIGN-v2 §3),
// and every row keeps at least one lane free, so everything is reachable.

import { RACE, POWERUPS } from "../../data/tracks.js";

let nextId = 1;

/** The single place where race objects are created. */
export function makeObject(kind, { lane, d, icon = "", color = "#ffffff", len = 2, speed = 0, value = 0 }) {
  const l = Math.max(0, Math.min(RACE.lanes - 1, Math.round(Number(lane) || 0)));
  return {
    id: nextId++,
    kind, // obstacle | traffic | coin | powerup | ramp | fuel | star
    lane: l,
    x: l, // lane position (float, changes for traffic and pulled coins)
    d: Number.isFinite(d) ? d : 0, // distance along the track (metres, centre)
    len,
    speed,
    icon,
    color,
    value,
    taken: false, // picked up (coins, power-ups, fuel)
    hit: false, // smashed (obstacles, traffic)
    fly: 0, // seconds since smashed, for the fly-away animation
    spin: 0,
    pulled: false, // pulled by the magnet
    warn: 0, // boss throws: seconds until it lands (not solid before)
    springSeen: false, // counted by the Springs legendary
  };
}

const weighted = (rng, entries) => {
  const total = entries.reduce((s, e) => s + e.weight, 0);
  let roll = rng.random() * total;
  for (const e of entries) if ((roll -= e.weight) < 0) return e;
  return entries[entries.length - 1];
};

/**
 * Generate the whole course for a track level.
 * @returns {object[]} objects sorted by distance
 */
export function generateCourse({ track, level, length, rng }) {
  const density = 1 + RACE.densityLevelStep * (level - 1);
  const rates = [
    { kind: "obstacle", weight: RACE.obstaclesPer100 * density },
    { kind: "traffic", weight: RACE.trafficPer100 * density },
    { kind: "coins", weight: RACE.coinRowsPer100 },
    { kind: "powerup", weight: RACE.powerupsPer100 },
    { kind: "ramp", weight: RACE.rampsPer100 },
    { kind: "fuel", weight: RACE.fuelCansPer100 },
  ];
  const eventsPer100 = rates.reduce((s, r) => s + r.weight, 0);
  const avgGap = 100 / eventsPer100;
  const out = [];
  const lanes = [...Array(RACE.lanes).keys()];

  // Rows start after the starting grid and stop before the finish line.
  for (let d = 90; d < length - 50; d += Math.max(18, avgGap * (0.6 + rng.random() * 0.8))) {
    const ev = weighted(rng, rates);
    if (ev.kind === "obstacle") {
      // one obstacle, sometimes two (never all lanes)
      const blocked = rng.random() < 0.25 + 0.05 * level ? 2 : 1;
      const free = lanes.slice();
      for (let i = 0; i < blocked; i++) {
        const lane = free.splice(rng.int(0, free.length - 1), 1)[0];
        out.push(makeObject("obstacle", { lane, d, icon: rng.pick(track.obstacles), len: 1.6 }));
      }
    } else if (ev.kind === "traffic") {
      out.push(makeObject("traffic", { lane: rng.int(0, RACE.lanes - 1), d, color: rng.pick(track.traffic), len: 4.2, speed: RACE.baseSpeed * (0.35 + rng.random() * 0.15) }));
    } else if (ev.kind === "coins") {
      const lane = rng.int(0, RACE.lanes - 1);
      const n = rng.int(4, 6);
      for (let i = 0; i < n; i++) out.push(makeObject("coin", { lane, d: d + i * 5, icon: "🪙", len: 1, value: RACE.coinValue }));
    } else if (ev.kind === "powerup") {
      const p = weighted(rng, POWERUPS);
      out.push(makeObject("powerup", { lane: rng.int(0, RACE.lanes - 1), d, icon: p.icon, value: p.id, len: 1.4 }));
    } else if (ev.kind === "ramp") {
      // a ramp, then an obstacle to jump over and coins in the air
      const lane = rng.int(0, RACE.lanes - 1);
      out.push(makeObject("ramp", { lane, d, len: 3 }));
      out.push(makeObject("obstacle", { lane, d: d + 13, icon: rng.pick(track.obstacles), len: 1.6 }));
      for (let i = 0; i < 3; i++) out.push(makeObject("coin", { lane, d: d + 8 + i * 5, icon: "🪙", len: 1, value: RACE.coinValue }));
    } else {
      out.push(makeObject("fuel", { lane: rng.int(0, RACE.lanes - 1), d, icon: "⛽", len: 1.4 }));
    }
  }
  return removeBlockedPickups(out).sort((a, b) => a.d - b.d);
}

/** Never put a coin, power-up or can on top of an obstacle (unless it floats over a ramp jump). */
function removeBlockedPickups(objects) {
  const solid = objects.filter((o) => o.kind === "obstacle");
  return objects.filter((o) => {
    if (o.kind !== "powerup" && o.kind !== "fuel" && o.kind !== "coin") return true;
    const clash = solid.some((s) => s.lane === o.lane && Math.abs(s.d - o.d) < 3);
    if (!clash) return true;
    // coins exactly over a ramp-jump obstacle are reachable in the air
    return o.kind === "coin" && objects.some((r) => r.kind === "ramp" && r.lane === o.lane && o.d - r.d > 0 && o.d - r.d < 20);
  });
}

/** Extra fuel can ahead of the player when the tank is low and none is coming. */
export function spawnFuelIfLow(race) {
  const p = race.player;
  if (p.fuel > 0.35) return null;
  const ahead = race.objects.some((o) => o.kind === "fuel" && !o.taken && o.d > p.d + 20 && o.d < p.d + 200);
  if (ahead) return null;
  const d = p.d + 90;
  const lanes = [...Array(RACE.lanes).keys()].filter((l) => !race.objects.some((o) => (o.kind === "obstacle" || o.kind === "traffic") && o.lane === l && Math.abs(o.d - d) < 8));
  if (!lanes.length || d > race.length - 30) return null;
  const lane = lanes.includes(p.lane) ? p.lane : lanes[0];
  const can = makeObject("fuel", { lane, d, icon: "⛽", len: 1.4 });
  race.objects.push(can);
  return can;
}
