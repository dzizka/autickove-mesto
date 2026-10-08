// Garage B (DESIGN-v2 §4.3–4.7): every car has 6 parts with a level 1..20, upgraded with
// scrap 🔩 from the chest. Abilities come at levels 6 and 14. Data only.

export const GARAGE = {
  maxLevel: 20,
  // stat of a part: base at level 1, + perLevel for every level above (level 20 = 84)
  statBase: 8,
  statPerLevel: 4,
  // upgrade from level L costs round(costBase × costGrowth^(L − 1)) 🔩, at most costMax
  costBase: 3,
  costGrowth: 1.4,
  costMax: 75,
  abilityLevels: [6, 14],
};

/** The ability a part gets at level 6 and at level 14 (ids from data/legendaries.js). */
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
  // old saves (v12 → v13): bag parts become scrap by rarity
  oldPartScrap: { common: 1, good: 2, rare: 4, epic: 8, legendary: 16 },
};
