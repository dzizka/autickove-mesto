// Quests (DESIGN-v2 §8): 3 simple tasks at a time, read aloud, rewarded when done.
// event: what counts (see systems/quests.js); need: only offered when it makes sense.
// reward: coins, and sometimes scrap 🔩 or candy 🍬.

export const QUESTS = [
  { id: "race3", icon: "🏁", event: "race", target: 3, say: "Odjazdi tri preteky.", reward: { coins: 50 } },
  { id: "race5", icon: "🏎️", event: "race", target: 5, say: "Odjazdi päť pretekov.", reward: { coins: 80, scrap: 10 } },
  { id: "win1", icon: "🥇", event: "win", target: 1, say: "Vyhraj preteky.", reward: { coins: 60 } },
  { id: "win3", icon: "🏆", event: "win", target: 3, say: "Vyhraj troje preteky.", reward: { coins: 120 } },
  { id: "coins60", icon: "🪙", event: "collect", target: 60, say: "Pozbieraj v pretekoch veľa mincí.", reward: { coins: 60 } },
  { id: "dismantle3", icon: "🔩", event: "dismantle", target: 3, say: "V garáži rozober tri diely.", reward: { coins: 40, scrap: 15 } },
  { id: "equip1", icon: "🔧", event: "equip", target: 1, say: "V garáži namontuj lepší diel.", reward: { coins: 50 } },
  { id: "upgrade1", icon: "⭐", event: "upgrade", target: 1, say: "V garáži vylepši diel.", reward: { coins: 50, scrap: 10 } },
  { id: "paint1", icon: "🖍️", event: "paint", target: 1, say: "Vymaľuj obrázok.", reward: { coins: 50 } },
  { id: "paint2", icon: "🎨", event: "paint", target: 2, say: "Vymaľuj dva obrázky.", reward: { coins: 90 } },
  { id: "tune1", icon: "🚗", event: "buy", target: 1, say: "Kúp niečo nové na auto.", reward: { coins: 60 } },
  { id: "pet3", icon: "💖", event: "pet", target: 3, say: "Trikrát pohladkaj kamaráta.", reward: { coins: 30, candy: 3 }, need: "buddy" },
  { id: "hatch1", icon: "🐣", event: "hatch", target: 1, say: "Vyliahni vajíčko.", reward: { coins: 50, candy: 3 }, need: "egg" },
  { id: "mini2", icon: "🎪", event: "mini", target: 2, say: "Zahraj si dve hry v herni.", reward: { coins: 50 } },
  { id: "mini4", icon: "🃏", event: "mini", target: 4, say: "Zahraj si štyri hry v herni.", reward: { coins: 90, scrap: 10 } },
  { id: "boss1", icon: "👑", event: "boss", target: 1, say: "Poraz bossa.", reward: { coins: 150 }, need: "bossReady" },
];

export const QUEST_SLOTS = 3;
