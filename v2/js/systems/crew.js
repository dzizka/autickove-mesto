// Crew buddies (DESIGN-v2 §6): eggs that hatch after races, the collection, the active buddy
// in the car, its ability, levels, evolution with candy 🍬, pats and clothes.
// No hunger and no sadness: nothing here ever gets worse when the child is away.

import { getState, update } from "../core/state.js";
import { emit } from "../core/events.js";
import { CREW, CREW_RARITIES, CREW_RULES as R, CLOTHES } from "../data/crew.js";
import { spendCoins } from "./economy.js";

export const crewDef = (id) => CREW.find((c) => c.id === id) || null;
export const crewRarity = (id) => CREW_RARITIES.find((r) => r.id === id) || CREW_RARITIES[0];
export const xpToNext = (level) => R.xpBase + level * R.xpPerLevel;

export function defaultCrew() {
  return { owned: {}, active: null, candy: 0, clothes: { hat: ["none"], glasses: ["none"] }, eggsEver: 0, pets: 0 };
}

/** The buddy as stored: { id, level, xp, stage (0..2), hat, glasses, pets }. */
function newBuddy(id) {
  return { id, level: 1, xp: 0, stage: 0, hat: "none", glasses: "none", pets: 0 };
}

export function buddyIcon(entry) {
  const def = crewDef(entry?.id);
  if (!def) return "";
  return def.stages[Math.max(0, Math.min(def.stages.length - 1, entry.stage || 0))];
}

/** Icon with clothes, for the car window and the crew screen. */
export function buddyLook(entry) {
  if (!entry) return null;
  const hat = CLOTHES.hat.find((c) => c.id === entry.hat)?.icon || "";
  const glasses = CLOTHES.glasses.find((c) => c.id === entry.glasses)?.icon || "";
  return { icon: buddyIcon(entry), hat, glasses };
}

export function activeBuddy(s = getState()) {
  const id = s.crew?.active;
  return id && s.crew.owned[id] ? s.crew.owned[id] : null;
}

/** Strength of a buddy's ability (grows with level and stage). */
export function abilityValue(entry) {
  const def = crewDef(entry?.id);
  if (!def) return 0;
  const a = def.ability;
  const lvl = Math.max(1, Math.min(R.maxLevel, entry.level || 1));
  return (a.base + a.perLevel * (lvl - 1)) * (R.stageBonus[entry.stage || 0] || 1);
}

/** What the active buddy adds to the car: { stats: { speed: 7 }, coinMult: 1.1, shields: 1 }. */
export function crewBonus(s = getState()) {
  const out = { stats: {}, coinMult: 1, shields: 0 };
  const b = activeBuddy(s);
  const def = crewDef(b?.id);
  if (!def) return out;
  const v = abilityValue(b);
  if (def.ability.kind === "stat") out.stats[def.ability.stat] = Math.round(v);
  else if (def.ability.kind === "coins") out.coinMult = 1 + v;
  else if (def.ability.kind === "shield") out.shields = Math.floor(v);
  return out;
}

// ---------- eggs ----------

export function addEgg(from = "chest") {
  const egg = { id: `egg${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`, from, races: 0, at: Date.now() };
  update((s) => {
    s.eggs.push(egg);
    s.crew.eggsEver += 1;
  });
  emit("eggAdded", { egg });
  return egg;
}

/** Called after every race: eggs get one step closer to hatching. */
export function tickEggs() {
  update((s) => {
    for (const e of s.eggs) e.races = Math.min(R.hatchRaces, (e.races || 0) + 1);
  });
}

export const isEggReady = (egg) => (egg?.races || 0) >= R.hatchRaces;

/** Chest egg after a normal race: the first one is sure in race 3, later ones are rare. */
export function rollChestEgg(rng, s = getState()) {
  if (s.crew.eggsEver === 0 && s.races.total >= R.firstEggRace) return true;
  return rng.random() < R.chestEggChance;
}

function pickRarity(rng, from) {
  // boss eggs are better: commons are half as likely
  const entries = CREW_RARITIES.map((r) => [r.id, r.weight * (from !== "chest" && r.id === "common" ? 0.5 : 1)]);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng.random() * total;
  for (const [id, w] of entries) if ((roll -= w) < 0) return id;
  return entries[0][0];
}

/**
 * Hatch a ready egg. New buddies are preferred (the collection fills up), duplicates become candy.
 * Returns { buddy, def, isNew, candy } or null.
 */
export function hatch(eggId, rng) {
  const s = getState();
  const egg = s.eggs.find((e) => e.id === eggId);
  if (!egg || !isEggReady(egg)) return null;
  const rarity = pickRarity(rng, egg.from);
  const pool = CREW.filter((c) => c.rarity === rarity);
  const fresh = pool.filter((c) => !s.crew.owned[c.id]);
  const list = fresh.length && rng.random() < 0.75 ? fresh : pool;
  const def = list[Math.floor(rng.random() * list.length)];
  const isNew = !s.crew.owned[def.id];
  const candy = isNew ? 0 : R.duplicateCandy[rarity] || 3;
  update((st) => {
    st.eggs = st.eggs.filter((e) => e.id !== eggId);
    if (isNew) st.crew.owned[def.id] = newBuddy(def.id);
    st.crew.candy += candy;
    if (!st.crew.active) st.crew.active = def.id;
  });
  emit("buddyHatched", { id: def.id, isNew, candy });
  return { buddy: getState().crew.owned[def.id], def, isNew, candy };
}

// ---------- levels, evolution ----------

/** XP for the active buddy after a race. Returns the new levels reached. */
export function giveCrewXp(win = false) {
  const b = activeBuddy();
  if (!b) return [];
  const gained = [];
  update(() => {
    b.xp += R.xpPerRace + (win ? R.xpPerWin : 0);
    while (b.level < R.maxLevel && b.xp >= xpToNext(b.level)) {
      b.xp -= xpToNext(b.level);
      b.level++;
      gained.push(b.level);
    }
    if (b.level >= R.maxLevel) b.xp = 0;
  });
  for (const level of gained) emit("buddyLevelUp", { id: b.id, level });
  return gained;
}

/** Next evolution step { level, candy } or null when fully evolved. */
export function nextEvolution(entry) {
  return R.evolve[entry?.stage || 0] || null;
}

export function canEvolve(entry, s = getState()) {
  const step = nextEvolution(entry);
  return !!step && entry.level >= step.level && s.crew.candy >= step.candy;
}

export function evolve(id) {
  const s = getState();
  const b = s.crew.owned[id];
  if (!b || !canEvolve(b, s)) return false;
  const step = nextEvolution(b);
  update((st) => {
    st.crew.candy -= step.candy;
    st.crew.owned[id].stage += 1;
  });
  emit("buddyEvolved", { id, stage: b.stage });
  return true;
}

export function setActive(id) {
  if (!getState().crew.owned[id]) return false;
  update((s) => {
    s.crew.active = id;
  });
  return true;
}

export function pet(id) {
  if (!getState().crew.owned[id]) return 0;
  update((s) => {
    s.crew.owned[id].pets = (s.crew.owned[id].pets || 0) + 1;
    s.crew.pets += 1;
  });
  return getState().crew.owned[id].pets;
}

/** Candy from dismantling (§6): a chance per part, blue or better gives a sure one. */
export function candyFromDismantle(parts, rng) {
  let candy = 0;
  for (const p of parts) {
    if (["rare", "epic", "legendary"].includes(p.rarity)) candy += R.dismantleCandyRareBonus;
    else if (rng.random() < R.dismantleCandyChance) candy += 1;
  }
  if (candy) update((s) => (s.crew.candy += candy));
  return candy;
}

// ---------- clothes ----------

export function ownsClothes(kind, item, s = getState()) {
  return item === "none" || (s.crew.clothes[kind] || []).includes(item);
}

/** Wear an owned item, or buy it first. Returns false when not affordable. */
export function wear(id, kind, item) {
  const def = CLOTHES[kind]?.find((c) => c.id === item);
  if (!def || !getState().crew.owned[id]) return false;
  if (!ownsClothes(kind, item)) {
    if (!spendCoins(def.price)) return false;
    update((s) => (s.crew.clothes[kind] = [...new Set([...(s.crew.clothes[kind] || []), item])]));
  }
  update((s) => (s.crew.owned[id][kind] = item));
  return true;
}

// ---------- test menu ----------

export function ownAllCrew() {
  update((s) => {
    for (const c of CREW) s.crew.owned[c.id] ??= newBuddy(c.id);
    s.crew.active ??= CREW[0].id;
  });
}

export function hatchEggsNow() {
  update((s) => s.eggs.forEach((e) => (e.races = R.hatchRaces)));
}

export function crewLevelUp(n = 1) {
  const b = activeBuddy();
  if (!b) return;
  update(() => {
    b.level = Math.min(R.maxLevel, b.level + n);
    b.xp = 0;
  });
}
