// Crew buddies (DESIGN-v2 §6). Data only. 20 buddies in 4 rarities, 3 stages each.
// ability: { kind, base, perLevel } — kind "stat" adds to a car stat, "coins" multiplies race
// coins, "shield" adds start shields. Value = base + perLevel × (level − 1), × stage bonus.
// Stage icons never use 🥚 or 🔩, so a buddy is not mistaken for an egg or for scrap.

export const CREW_RARITIES = [
  { id: "common", name: "Obyčajný", color: "#9aa0a6", weight: 55, stars: 1 },
  { id: "rare", name: "Vzácny", color: "#2f80ed", weight: 28, stars: 2 },
  { id: "epic", name: "Epický", color: "#9b51e0", weight: 13, stars: 3 },
  { id: "legendary", name: "Legendárny", color: "#ff8c1a", weight: 4, stars: 4 },
];

export const CREW = [
  { id: "chick", rarity: "common", name: "Kuriatko", stages: ["🐣", "🐥", "🐓"], ability: { kind: "stat", stat: "luck", base: 4, perLevel: 1 } },
  { id: "bunny", rarity: "common", name: "Zajko", stages: ["🐇", "🐰", "🐰"], ability: { kind: "stat", stat: "speed", base: 4, perLevel: 1 } },
  { id: "mouse", rarity: "common", name: "Myška", stages: ["🐭", "🐁", "🐀"], ability: { kind: "stat", stat: "handling", base: 4, perLevel: 1 } },
  { id: "turtle", rarity: "common", name: "Korytnačka", stages: ["🐢", "🐢", "🐢"], ability: { kind: "stat", stat: "armor", base: 5, perLevel: 1.2 } },
  { id: "frog", rarity: "common", name: "Žabka", stages: ["🐸", "🐸", "🐸"], ability: { kind: "stat", stat: "fuel", base: 5, perLevel: 1.2 } },
  { id: "pig", rarity: "common", name: "Prasiatko", stages: ["🐷", "🐖", "🐗"], ability: { kind: "coins", base: 0.1, perLevel: 0.01 } },
  { id: "hamster", rarity: "common", name: "Škrečok", stages: ["🐹", "🐹", "🐿️"], ability: { kind: "stat", stat: "magnet", base: 4, perLevel: 1 } },
  { id: "pup", rarity: "rare", name: "Psík", stages: ["🐶", "🐕", "🐕‍🦺"], ability: { kind: "shield", base: 1, perLevel: 0.05 } },
  { id: "kitten", rarity: "rare", name: "Mačička", stages: ["🐱", "🐈", "🐆"], ability: { kind: "stat", stat: "speed", base: 7, perLevel: 1.5 } },
  { id: "fox", rarity: "rare", name: "Líška", stages: ["🦊", "🦊", "🦊"], ability: { kind: "stat", stat: "luck", base: 7, perLevel: 1.5 } },
  { id: "penguin", rarity: "rare", name: "Tučniak", stages: ["🐧", "🐧", "🦭"], ability: { kind: "stat", stat: "handling", base: 7, perLevel: 1.5 } },
  { id: "owl", rarity: "rare", name: "Sovička", stages: ["🦉", "🦉", "🦅"], ability: { kind: "coins", base: 0.15, perLevel: 0.015 } },
  { id: "bee", rarity: "rare", name: "Včielka", stages: ["🐛", "🐝", "🦋"], ability: { kind: "stat", stat: "magnet", base: 7, perLevel: 1.5 } },
  { id: "lizard", rarity: "epic", name: "Jašterička", stages: ["🦎", "🦕", "🦖"], ability: { kind: "stat", stat: "speed", base: 10, perLevel: 2 } },
  { id: "panda", rarity: "epic", name: "Panda", stages: ["🐼", "🐼", "🐻"], ability: { kind: "shield", base: 1, perLevel: 0.08 } },
  { id: "octopus", rarity: "epic", name: "Chobotnička", stages: ["🦑", "🐙", "🐙"], ability: { kind: "stat", stat: "handling", base: 10, perLevel: 2 } },
  { id: "koala", rarity: "epic", name: "Koala", stages: ["🐨", "🐨", "🐨"], ability: { kind: "coins", base: 0.2, perLevel: 0.02 } },
  { id: "dragon", rarity: "legendary", name: "Dráčik", stages: ["🐲", "🐉", "🐉"], ability: { kind: "stat", stat: "speed", base: 14, perLevel: 2.5 } },
  { id: "unicorn", rarity: "legendary", name: "Jednorožec", stages: ["🐴", "🦄", "🦄"], ability: { kind: "stat", stat: "luck", base: 14, perLevel: 2.5 } },
  { id: "robot", rarity: "legendary", name: "Robotík", stages: ["🤖", "🤖", "🦾"], ability: { kind: "shield", base: 2, perLevel: 0.08 } },
];

/** Clothes (§6): only for looks, bought with coins. The first item of each kind is "none". */
export const CLOTHES = {
  hat: [
    { id: "none", icon: "", price: 0 },
    { id: "cap", icon: "🧢", price: 80 },
    { id: "tophat", icon: "🎩", price: 150 },
    { id: "crown", icon: "👑", price: 400 },
    { id: "party", icon: "🥳", price: 120 },
    { id: "helmet", icon: "⛑️", price: 120 },
    { id: "bow", icon: "🎀", price: 80 },
  ],
  glasses: [
    { id: "none", icon: "", price: 0 },
    { id: "sun", icon: "🕶️", price: 100 },
    { id: "nerd", icon: "👓", price: 80 },
    { id: "goggles", icon: "🥽", price: 150 },
    { id: "monocle", icon: "🧐", price: 200 },
  ],
};

export const CREW_RULES = {
  hatchRaces: 3, // an egg hatches after 3 races (§6)
  maxLevel: 20,
  xpPerRace: 10,
  xpPerWin: 5,
  xpBase: 20, // xp to the next level = xpBase + level × xpPerLevel
  xpPerLevel: 6,
  // evolution (§6): stage 2 at level 7, stage 3 at level 14, paid with candy 🍬
  evolve: [
    { level: 7, candy: 5 },
    { level: 14, candy: 15 },
  ],
  stageBonus: [1, 1.5, 2.2], // ability strength per stage
  duplicateCandy: { common: 3, rare: 5, epic: 8, legendary: 12 }, // a duplicate hatch → candy
  chestEggChance: 0.06, // eggs sometimes drop from the race chest (§6)
  firstEggRace: 3, // the first egg is sure in the 3rd race, so a buddy comes early
  petHearts: 3, // a pat shows hearts and a happy sound (no hunger, no sadness)
  // part 21: buddies grow also without races (DESIGN-v2 §6.1)
  feedShare: 0.34, // a candy 🍬 gives this share of the XP to the next level (about a third)
  petXp: 10, // the first pat of the day per buddy
  playsPerDay: 3, // ⭐ play with a buddy: this many times a day per buddy give XP and coins
  playSeconds: 30,
  playXpPerStar: 3, // XP per caught star (a big star 🌟 counts 3)
  playCoinsPerStar: 2,
  miniXp: 8, // games room: XP for the buddy in the car …
  miniXp3: 4, // … plus this for 3 stars
};
