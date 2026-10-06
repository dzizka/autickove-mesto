// Sets (DESIGN-v2 §4.7): 4 sets of 3 parts. 2 parts → small bonus, 3 parts → big bonus
// and a special look. Bonus: stat × (1 + pct) + flat. look: tuning ids that override the car's look.

export const SETS = [
  {
    id: "police",
    name: "Policajný",
    icon: "🚓",
    color: "#2f80ed",
    pieces: { engine: "🚨", tires: "🚔", bumper: "👮" },
    bonus2: [{ stat: "speed", pct: 0.1, flat: 5 }],
    bonus3: [{ stat: "speed", pct: 0.25, flat: 10 }, { stat: "handling", pct: 0.1, flat: 5 }],
    look: { roof: "siren", horn: "siren" },
  },
  {
    id: "fire",
    name: "Hasičský",
    icon: "🚒",
    color: "#ff5a5f",
    pieces: { bumper: "🧯", tank: "🪣", mascot: "🐕" },
    bonus2: [{ stat: "armor", pct: 0.15, flat: 8 }],
    bonus3: [{ stat: "armor", pct: 0.4, flat: 15 }, { stat: "fuel", pct: 0.2, flat: 10 }],
    look: { trail: "fire" },
  },
  {
    id: "space",
    name: "Vesmírny",
    icon: "🛸",
    color: "#8f5bd8",
    pieces: { engine: "🛰️", magnet: "🪐", mascot: "👽" },
    bonus2: [{ stat: "magnet", pct: 0.2, flat: 8 }],
    bonus3: [{ stat: "magnet", pct: 0.5, flat: 15 }, { stat: "luck", pct: 0.2, flat: 10 }],
    look: { neon: "purple", trail: "stars" },
  },
  {
    id: "jungle",
    name: "Džungľa",
    icon: "🌴",
    color: "#3ebd4a",
    pieces: { tires: "🌿", tank: "🥥", magnet: "🐍" },
    bonus2: [{ stat: "handling", pct: 0.15, flat: 8 }],
    bonus3: [{ stat: "handling", pct: 0.4, flat: 15 }, { stat: "luck", pct: 0.2, flat: 10 }],
    look: { roof: "dino", trail: "smoke" },
  },
];
