// Seedable random numbers (mulberry32). Unseeded by default; tests call
// setSeed() to get reproducible loot, tracks and spawns.

let seed = (Math.random() * 2 ** 32) >>> 0;

export function setSeed(value) {
  seed = (Number(value) >>> 0) || 1;
}

export function random() {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Integer in [min, max] inclusive. */
export function int(min, max) {
  return min + Math.floor(random() * (max - min + 1));
}

/** Random element of a non-empty array (undefined for empty). */
export function pick(list) {
  return list.length ? list[Math.floor(random() * list.length)] : undefined;
}

/** True with the given probability (0..1). */
export function chance(p) {
  return random() < p;
}

/**
 * Weighted pick: entries is [{ weight, ...}] or [[value, weight]].
 * Falls back to the first entry if all weights are zero.
 */
export function weighted(entries) {
  const weightOf = (e) => (Array.isArray(e) ? e[1] : e.weight) || 0;
  const total = entries.reduce((sum, e) => sum + Math.max(0, weightOf(e)), 0);
  if (total <= 0) return entries[0];
  let roll = random() * total;
  for (const e of entries) {
    roll -= Math.max(0, weightOf(e));
    if (roll < 0) return e;
  }
  return entries[entries.length - 1];
}

export function shuffle(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
