// Loot data (DESIGN-v2 §4.4–4.6): rarities, drop rules and the look of parts per slot.

/** Rarities from worst to best. `power` multiplies a part's total stat budget. */
export const RARITIES = [
  { id: "common", name: "Obyčajný", color: "#9aa0a6", subs: 0, power: 0.85, weight: 60, levelBoost: 0, scrap: 1 },
  { id: "good", name: "Dobrý", color: "#3ebd4a", subs: 1, power: 0.95, weight: 28, levelBoost: 0.25, scrap: 2 },
  { id: "rare", name: "Vzácny", color: "#2f80ed", subs: 2, power: 1.05, weight: 10, levelBoost: 0.5, scrap: 4 },
  { id: "epic", name: "Epický", color: "#9b51e0", subs: 3, power: 1.2, weight: 2, levelBoost: 0.9, scrap: 8 },
  { id: "legendary", name: "Legendárny", color: "#ff8c1a", subs: 2, power: 1.35, weight: 0, levelBoost: 0, scrap: 16 },
];

export const RARITY_IDS = RARITIES.map((r) => r.id);

export const LOOT = {
  dropsByPlace: [3, 2, 1, 1], // 1st place → 3 parts … 4th place → 1 part (§4.5)
  partBudgetShare: 0.21, // a part's stat budget = recommended power of the race × this (a bit over 1/6, so drops feel like upgrades)
  jitter: 0.12, // ± random spread of the budget
  trackBoost: 0.15, // extra rarity boost per track index (later tracks drop better)
  luckBoost: 1, // luck (0..~1.5 from stats) multiplies non-common weights by (1 + luck × this)
  // Guarantees (§4.8): first green in race 1, first blue by race 2.
  guaranteeGoodRace: 1,
  guaranteeRareRace: 2,
  // Bad-luck counter for legendaries (§4.8): chance grows after every race without one.
  legendaryBaseChance: 0.002,
  legendaryPerRace: 0.0025, // ≈ 90 % to see one within 50 races …
  legendaryHardPity: 60, // … and surely by race 60 (2–3 hours of play)
  setChance: 0.35, // an epic drop is a set piece this often (§4.7)
  bagStart: 30,
  bagMax: 60,
  bagStep: 5,
  bagPriceBase: 150, // coins for the first +5 slots …
  bagPricePerSlot: 40, // … plus this per slot already bought
  // Upgrades +1..+5 (§4.6): cost grows with the plus level and rarity.
  maxPlus: 5,
  upgradeScrapStep: 2, // 🔩 = (plus + 1) × (rarity index + 1) × this
  upgradeCoinsStep: 20, // 🪙 = (plus + 1) × this × (1 + budget / upgradeBudgetDiv)
  upgradeBudgetDiv: 60,
};

/** Look of parts per slot: an icon for each base; mascots are the fun ones. */
export const PART_BASES = {
  engine: [
    { icon: "🔥", name: "Motor" },
    { icon: "⚙️", name: "Prevodovka" },
    { icon: "🔋", name: "Batéria" },
  ],
  tires: [
    { icon: "🛞", name: "Pneumatiky" },
    { icon: "⭕", name: "Pretekárske kolesá" },
  ],
  bumper: [
    { icon: "🛡️", name: "Nárazník" },
    { icon: "🧱", name: "Pancier" },
  ],
  tank: [
    { icon: "⛽", name: "Nádrž" },
    { icon: "🛢️", name: "Sud" },
  ],
  magnet: [
    { icon: "🧲", name: "Magnet" },
    { icon: "📡", name: "Anténa" },
  ],
  mascot: [
    { icon: "🧸", name: "Macko" },
    { icon: "🦆", name: "Kačička" },
    { icon: "🐶", name: "Psík" },
    { icon: "🦄", name: "Jednorožec" },
    { icon: "🐸", name: "Žabka" },
  ],
};
