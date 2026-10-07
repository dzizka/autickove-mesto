// Car stats and part slots (DESIGN-v2 §4.3). Data only.

/**
 * Values come from parts; the starter car has 8 in each main stat.
 */
export const STATS = {
  speed: { icon: "⚡", name: "Rýchlosť", color: "#ffc93c" },
  handling: { icon: "🌀", name: "Ovládanie", color: "#2ab7ca" },
  armor: { icon: "🛡️", name: "Odolnosť", color: "#8f5bd8" },
  fuel: { icon: "⛽", name: "Benzín", color: "#ff8c42" },
  magnet: { icon: "🧲", name: "Magnet", color: "#ff5a5f" },
  luck: { icon: "🍀", name: "Šťastie", color: "#3ebd4a" },
};

export const STAT_IDS = Object.keys(STATS);

/** A stat bar is full at this value (a strong late-game car has ~100–150 in its main stats). */
export const STAT_BAR_FULL = 150;

export const SLOTS = [
  { id: "engine", icon: "🔥", name: "Motor", main: "speed" },
  { id: "tires", icon: "🛞", name: "Pneumatiky", main: "handling" },
  { id: "bumper", icon: "🛡️", name: "Nárazník", main: "armor" },
  { id: "tank", icon: "⛽", name: "Nádrž", main: "fuel" },
  { id: "magnet", icon: "🧲", name: "Magnet", main: "magnet" },
  { id: "mascot", icon: "🧸", name: "Maskot", main: "luck" },
];

/** The starter car: a grey (common) part in every slot (DESIGN-v2 §4.8). */
export const STARTER_MAIN_VALUE = 8;

/**
 * How stats turn into race effects (used by systems/stats.js).
 * Each value is "per stat point"; the comments show starter (8) vs strong (100).
 */
export const EFFECTS = {
  speedPerPoint: 1 / 200, // top speed ×1.04 → ×1.5
  handlingPerPoint: 1 / 40, // lane-change spring stiffness ×1.2 → ×3.5
  shieldEvery: 25, // one start shield per 25 armor (0 → 4)
  maxShields: 4,
  armorSlowPerPoint: 1 / 50, // slowdown after a hit 1.6 s / (1 + armor/50)
  fuelPerPoint: 1 / 40, // fuel lasts ×1.2 → ×3.5
  magnetLanesPerPoint: 1 / 40, // pulls coins from 0.2 → 2.5 lanes away
  luckPerPoint: 1 / 100, // loot quality (part 2)
  upgradePerPlus: 0.08, // each +1 upgrade adds this share to a part's values (§4.6)
  recommendMargin: 0.06, // recommended power: top speed 6 % above the fastest rival (🟢 = "you will manage")
  recommendMin: 30, // … but never below this (the starter car has 48)
};
