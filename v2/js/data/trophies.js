// Trophies (DESIGN-v2 §8). check.kind is evaluated in systems/trophies.js against the saved
// state, so trophies also appear for progress made before they existed.

export const TROPHIES = [
  { id: "firstWin", icon: "🥇", name: "Prvé víťazstvo", check: { kind: "wins", n: 1 } },
  { id: "wins10", icon: "🏆", name: "Desať víťazstiev", check: { kind: "wins", n: 10 } },
  { id: "races50", icon: "🏁", name: "Päťdesiat pretekov", check: { kind: "races", n: 50 } },
  { id: "allTracks", icon: "🗺️", name: "Všetky trate", check: { kind: "allTracks" } },
  { id: "space5", icon: "🌌", name: "Vesmír na piatej úrovni", check: { kind: "trackLevel", track: "space", n: 5 } },
  { id: "firstBoss", icon: "👑", name: "Prvý boss", check: { kind: "bosses", n: 1 } },
  { id: "allBosses", icon: "🏰", name: "Všetci bossovia", check: { kind: "bosses", n: 6 } },
  { id: "firstEpic", icon: "🟣", name: "Prvý epický diel", check: { kind: "rarity", rarity: "epic" } },
  { id: "firstLegend", icon: "🟠", name: "Prvý legendárny diel", check: { kind: "legendaries", n: 1 } },
  { id: "legends6", icon: "✨", name: "Šesť legendárnych schopností", check: { kind: "legendaries", n: 6 } },
  { id: "fullSet", icon: "📖", name: "Celý set", check: { kind: "fullSets", n: 1 } },
  { id: "allSets", icon: "📚", name: "Všetky sety", check: { kind: "fullSets", n: 4 } },
  { id: "plus5", icon: "⭐", name: "Diel vylepšený na +5", check: { kind: "plus5" } },
  { id: "firstBuddy", icon: "🐣", name: "Prvý kamarát", check: { kind: "buddies", n: 1 } },
  { id: "buddies10", icon: "🐾", name: "Desať kamarátov", check: { kind: "buddies", n: 10 } },
  { id: "allBuddies", icon: "🦄", name: "Všetci kamaráti", check: { kind: "buddies", n: 20 } },
  { id: "evolved", icon: "🦖", name: "Vyvinutý kamarát", check: { kind: "evolved", stage: 2 } },
  { id: "firstPicture", icon: "🖍️", name: "Prvý obrázok", check: { kind: "pictures", n: 1 } },
  { id: "pictures10", icon: "🖼️", name: "Desať obrázkov", check: { kind: "pictures", n: 10 } },
  { id: "bigPicture", icon: "🧩", name: "Veľký obrázok podľa čísel", check: { kind: "bigPicture" } },
  { id: "allGlitter", icon: "🌈", name: "Všetky trblietavé farby", check: { kind: "glitter", n: 4 } },
  { id: "quests10", icon: "📜", name: "Desať splnených úloh", check: { kind: "quests", n: 10 } },
  { id: "level10", icon: "🎖️", name: "Level desať", check: { kind: "level", n: 10 } },
];
