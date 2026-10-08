// Game state: defaults, load/save to localStorage, schema version + migrations.
// Rule: every schema change bumps CURRENT_VERSION and adds a step to MIGRATIONS.

import { emit } from "./events.js";
import { CHEST } from "../data/garage.js";
import { defaultLook, defaultOwned } from "../systems/tuning.js";
import { defaultCrew } from "../systems/crew.js";
import { defaultColoring } from "../systems/coloring.js";
import { defaultQuests } from "../systems/quests.js";
import { RENAMED_CARS } from "../data/cars.js";

export const STORAGE_KEY = "autickove-mesto-v2";
export const CURRENT_VERSION = 14;

/** Local date as YYYY-MM-DD (the same format as the play log). */
export function todayKey(date = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

export function defaultState() {
  return {
    version: CURRENT_VERSION,
    createdAt: Date.now(),
    coins: 0,
    xp: 0,
    level: 1,
    settings: { sound: true, voice: true, motion: true }, // motion: the moving home background (v12)
    // Per-day play log for the parents' overview: { "2026-10-06": { seconds, games: { race: 3 } } }
    playLog: {},
    // Hidden test-menu switches.
    cheats: { shortRaces: false },
    // v13: part levels of every car (car id → { engine: 1, … }); a car not listed is all 1.
    cars: {},
    // v2: race progress per track: { city: { unlocked: 1, best: { 1: 2 }, challenge: 0, races: 0 } }
    races: { tracks: {}, total: 0, wins: 0 },
    // v3: scrap 🔩 for the garage.
    scrap: 0,
    // v4: appearance — chosen look (category → item id) and owned items per category.
    look: defaultLook(),
    owned: defaultOwned(),
    // v5: beaten bosses (track → wins), eggs from bosses (part 5).
    bosses: {},
    eggs: [],
    // v6: crew buddies (owned, active buddy in the car, candy 🍬, bought clothes).
    crew: defaultCrew(),
    // v7: colouring book (finished count, bought pictures, glitter colours, unfinished work).
    // The gallery images live under their own key (systems/coloring.js).
    coloring: defaultColoring(),
    // v8: quests (3 active + count of claimed ones) and trophies (id → time earned).
    quests: defaultQuests(),
    trophies: {},
    minigames: {}, // games room: { pexeso: { level, plays, good, best } }
    // v10: town (building id → level, last rent time), sticker album, daily gift.
    // The gift starts tomorrow, so a brand-new game opens without a dialog.
    city: { buildings: {}, rentAt: {} },
    album: { stickers: {}, tiers: {}, pagesDone: [] },
    daily: { last: todayKey(), streak: 0 },
  };
}

/**
 * Migration steps: MIGRATIONS[n] turns a version-n object into version n+1.
 * Version 0 = an object without `version` (pre-release saves / hand-made test data).
 */
const MIGRATIONS = {
  0: (s) => {
    const out = { ...s, version: 1 };
    // v0 kept sound/voice at the top level.
    if (!out.settings && ("sound" in s || "voice" in s)) {
      out.settings = { sound: s.sound !== false, voice: s.voice !== false };
      delete out.sound;
      delete out.voice;
    }
    return out;
  },
  // v1 → v2: car parts and race progress (filled from defaults: starter car, no races yet).
  1: (s) => ({ ...s, version: 2 }),
  // v2 → v3: garage fields; parts get icon/budget/isNew where missing.
  2: (s) => {
    const fix = (p) => (p && typeof p === "object" ? { icon: null, budget: p.main?.value || 1, legendary: null, isNew: false, locked: false, ...p } : p);
    const equipped = Object.fromEntries(Object.entries(s.car?.equipped || {}).map(([k, p]) => [k, fix(p)]));
    return { ...s, version: 3, car: { ...(s.car || {}), equipped }, inventory: (s.inventory || []).map(fix) };
  },
  // v3 → v4: appearance (filled from defaults: the red starter car, free items owned).
  3: (s) => ({ ...s, version: 4 }),
  // v4 → v5: sets, bosses, eggs (filled from defaults).
  4: (s) => ({ ...s, version: 5 }),
  // v5 → v6: crew; eggs from bosses (v5) are kept and count as eggs already received.
  5: (s) => ({ ...s, version: 6, crew: { ...defaultCrew(), eggsEver: Array.isArray(s.eggs) ? s.eggs.length : 0 } }),
  // v6 → v7: colouring book (filled from defaults).
  6: (s) => ({ ...s, version: 7 }),
  // v7 → v8: quests and trophies (filled from defaults; trophies for old progress are
  // awarded on the next check).
  7: (s) => ({ ...s, version: 8 }),
  // v8 → v9: games room progress (filled from defaults: every game on level 1).
  8: (s) => ({ ...s, version: 9 }),
  // v9 → v10: town, album and daily gift (filled from defaults; the first gift comes tomorrow).
  9: (s) => ({ ...s, version: 10 }),
  // v10 → v11: Car Kit cars (part 15a). The rocket became the rocket car; a bought rocket stays bought.
  10: (s) => {
    const rename = (id) => RENAMED_CARS[id] || id;
    const look = isPlainObject(s.look) ? { ...s.look, car: rename(s.look.car) } : s.look;
    const owned = isPlainObject(s.owned) && Array.isArray(s.owned.car) ? { ...s.owned, car: [...new Set(s.owned.car.map(rename))] } : s.owned;
    return { ...s, version: 11, look, owned };
  },
  // v11 → v12: the moving home background is on (settings.motion, filled from defaults).
  11: (s) => ({ ...s, version: 12 }),
  // v12 → v13: garage B (§4.8). The chosen car gets part levels from its mounted parts, bag
  // parts become scrap, the bag, sets and loot history are gone.
  12: (s) => {
    const out = { ...s, version: 13 };
    const levels = {};
    for (const [slot, p] of Object.entries(s.car?.equipped || {})) {
      const value = (Number(p?.main?.value) || 0) * (1 + 0.08 * Math.max(0, Math.min(5, Number(p?.plus) || 0)));
      levels[slot] = Math.max(1, Math.min(20, 1 + Math.round((value - 8) / 6)));
    }
    const car = isPlainObject(s.look) && typeof s.look.car === "string" ? s.look.car : null;
    out.cars = car && Object.keys(levels).length ? { [car]: levels } : {};
    const bagScrap = (Array.isArray(s.inventory) ? s.inventory : []).reduce((sum, p) => sum + (CHEST.oldPartScrap[p?.rarity] || 1), 0);
    out.scrap = Math.max(0, Number(s.scrap) || 0) + bagScrap;
    for (const k of ["car", "inventory", "bagSize", "loot", "setsFound", "legendariesFound"]) delete out[k];
    if (isPlainObject(s.trophies)) {
      out.trophies = { ...s.trophies };
      for (const k of ["firstEpic", "firstLegend", "legends6", "fullSet", "allSets", "plus5"]) delete out.trophies[k];
    }
    if (isPlainObject(s.quests) && Array.isArray(s.quests.active)) out.quests = { ...s.quests, active: s.quests.active.filter((q) => !["dismantle3", "equip1"].includes(q?.id)) };
    return out;
  },
  // v13 → v14: tuning clean-up (part 18). The angel wings and the surfer on the roof are gone;
  // a child who bought them gets the coins back.
  13: (s) => {
    const out = { ...s, version: 14 };
    const owned = isPlainObject(s.owned) ? s.owned : {};
    const has = (cat, id) => Array.isArray(owned[cat]) && owned[cat].includes(id);
    const refund = (has("wing", "angel") ? 700 : 0) + (has("roof", "surf") ? 300 : 0);
    if (refund) {
      out.coins = Math.max(0, Number(s.coins) || 0) + refund;
      const drop = (cat, id) => (Array.isArray(owned[cat]) ? owned[cat].filter((x) => x !== id) : owned[cat]);
      out.owned = { ...owned, wing: drop("wing", "angel"), roof: drop("roof", "surf") };
    }
    return out;
  },
};

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

/** Fill keys missing in `data` from `defaults` (recursively for plain objects). */
function fillDefaults(data, defaults) {
  const out = { ...data };
  for (const [key, def] of Object.entries(defaults)) {
    if (!(key in out) || out[key] === undefined || out[key] === null) {
      out[key] = structuredClone(def);
    } else if (isPlainObject(def) && isPlainObject(out[key])) {
      out[key] = fillDefaults(out[key], def);
    }
  }
  return out;
}

/** Bring any saved object up to CURRENT_VERSION. Throws on non-object input. */
export function migrate(raw) {
  if (!isPlainObject(raw)) throw new Error("Save data is not an object");
  let s = { ...raw };
  let v = Number.isInteger(s.version) ? s.version : 0;
  if (v > CURRENT_VERSION) throw new Error(`Save is from a newer game (version ${v})`);
  while (v < CURRENT_VERSION) {
    const step = MIGRATIONS[v];
    if (!step) throw new Error(`Missing migration from version ${v}`);
    s = step(s);
    v = s.version;
  }
  s = fillDefaults(s, defaultState());
  // Sanitize numbers that the UI relies on.
  for (const key of ["coins", "xp", "scrap"]) {
    if (!Number.isFinite(s[key]) || s[key] < 0) s[key] = 0;
  }
  if (!Number.isInteger(s.level) || s.level < 1) s.level = 1;
  return s;
}

let state = defaultState();
let saveTimer = null;
let storageOk = true;

export function getState() {
  return state;
}

/** Load from localStorage (or start fresh). A broken save is kept aside, never lost. */
export function load() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    storageOk = false;
  }
  if (!raw) {
    state = defaultState();
    return state;
  }
  try {
    state = migrate(JSON.parse(raw));
  } catch (err) {
    console.error("[state] save could not be loaded, starting fresh", err);
    try {
      localStorage.setItem(`${STORAGE_KEY}-broken-${Date.now()}`, raw);
    } catch {
      /* ignore */
    }
    state = defaultState();
  }
  return state;
}

export function saveNow() {
  clearTimeout(saveTimer);
  saveTimer = null;
  if (!storageOk) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.warn("[state] save failed", err);
    return false;
  }
}

export function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(saveNow, 400);
}

/** Mutate state through a function, then save and notify the UI. */
export function update(fn) {
  fn(state);
  scheduleSave();
  emit("stateChanged", state);
  return state;
}

/** Replace the whole state (import / reset). Data is migrated first. */
export function replace(data) {
  state = migrate(data);
  saveNow();
  emit("stateChanged", state);
  return state;
}

export function reset() {
  return replace(defaultState());
}
