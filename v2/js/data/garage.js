// Garage B (DESIGN-v2 §4.3–4.7): every car has 6 parts with a level 1..40, upgraded with
// scrap 🔩 from the chest. Abilities come at levels 11 and 27. Data only.
// Part 22: 40 small steps instead of 20 big ones, so an upgrade comes about every 2–3 races.

export const GARAGE = {
  maxLevel: 40,
  // stat of a part: base at level 1, + perLevel for every level above (level 40 = 86)
  statBase: 8,
  statPerLevel: 2,
  // upgrade from level L costs round(costBase × costGrowth^(L − 1)) 🔩, at most costMax
  costBase: 2,
  costGrowth: 1.2,
  costMax: 28,
  abilityLevels: [11, 27],
  goldenLevels: 2, // a golden part from the chest: this many levels for free
};

/** The ability a part gets at level 11 and at level 27 (ids from data/legendaries.js). */
export const SLOT_ABILITIES = {
  engine: ["rocketStart", "starTurbo"],
  tires: ["springs", "iceShield"],
  bumper: ["headlight", "bubble"],
  tank: ["jumper", "endlessTank"],
  magnet: ["superMagnet", "coinRain"],
  mascot: ["goldCat", "ghost"],
};

/** What the chest gives after a race (§4.5). */
export const CHEST = {
  // scrap = (base + perTrack × track index + perLevel × (level − 1)) × place share × luck
  scrapBase: 3,
  scrapMin: 3, // never less: the first race always pays for the first upgrade
  scrapPerTrack: 1,
  scrapPerLevel: 1,
  placeShare: [1, 0.75, 0.5, 0.4],
  luckScrap: 0.15, // luck effect (0.08 … 0.84) × this = extra share of scrap
  bossScrap: 1.5, // a beaten boss gives ×1.5 scrap …
  // … and always gives a golden part; otherwise a golden part comes this often (luck adds a bit)
  goldenChance: 0.06,
  goldenLuck: 0.08,
  goldenMax: 0.25,
  candyChance: 0.3, // a candy 🍬 for the buddies (a boss gives one surely)
  // part 22: a finished car (every part on the top level) turns scrap into coins
  finishedCoinsPerScrap: 5,
  goldenScrap: 28, // … and a golden part counts as this much scrap
  miniScrap: [2, 4, 6], // games room, 3 stars: 🔩 by difficulty
  dailyScrap: [0, 10, 0, 10, 0, 10, 0], // the daily present, day 1 … 7
  // old saves (v12 → v13): bag parts become scrap by rarity
  oldPartScrap: { common: 1, good: 2, rare: 4, epic: 8, legendary: 16 },
};
