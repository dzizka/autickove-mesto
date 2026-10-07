// Game state: defaults, load/save to localStorage, schema version + migrations.
// Rule: every schema change bumps CURRENT_VERSION and adds a step to MIGRATIONS.

import { emit } from "./events.js";
import { starterParts, emptyLootHistory } from "../systems/loot.js";
import { defaultLook, defaultOwned } from "../systems/tuning.js";
import { defaultCrew } from "../systems/crew.js";
import { defaultColoring } from "../systems/coloring.js";
import { defaultQuests } from "../systems/quests.js";

export const STORAGE_KEY = "autickove-mesto-v2";
export const CURRENT_VERSION = 8;

export function defaultState() {
  return {
    version: CURRENT_VERSION,
    createdAt: Date.now(),
    coins: 0,
    xp: 0,
    level: 1,
    settings: { sound: true, voice: true },
    // Per-day play log for the parents' overview: { "2026-10-06": { seconds, games: { race: 3 } } }
    playLog: {},
    // Hidden test-menu switches.
    cheats: { shortRaces: false },
    // v2: the car's parts (slot → part) and the parts bag (part 2).
    car: { equipped: starterParts() },
    inventory: [],
    // v2: race progress per track: { city: { unlocked: 1, best: { 1: 2 }, challenge: 0, races: 0 } }
    races: { tracks: {}, total: 0, wins: 0 },
    // v3: garage — scrap 🔩, bag size, loot guarantees and the bad-luck counter.
    scrap: 0,
    bagSize: 30,
    loot: emptyLootHistory(),
    // v4: appearance — chosen look (category → item id) and owned items per category.
    look: defaultLook(),
    owned: defaultOwned(),
    // v5: set book (set id → slots found), beaten bosses (track → wins), eggs from bosses (part 5),
    // legendary abilities seen at least once (for trophies in part 7).
    setsFound: {},
    bosses: {},
    eggs: [],
    legendariesFound: [],
    // v6: crew buddies (owned, active buddy in the car, candy 🍬, bought clothes).
    crew: defaultCrew(),
    // v7: colouring book (finished count, bought pictures, glitter colours, unfinished work).
    // The gallery images live under their own key (systems/coloring.js).
    coloring: defaultColoring(),
    // v8: quests (3 active + count of claimed ones) and trophies (id → time earned).
    quests: defaultQuests(),
    trophies: {},
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
  for (const key of ["coins", "xp"]) {
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
