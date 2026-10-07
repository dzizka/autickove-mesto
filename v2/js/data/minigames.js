// Games in the 🎪 Hry room (DESIGN-v2 §12): the activities from v1, written anew. Data only.
// Every game has 3 difficulty levels; good results move the child up by itself.

export const MINIGAMES = [
  { id: "pexeso", icon: "🃏", name: "Pexeso", say: "Pexeso. Nájdi dvojice.", color: "plum", unlockLevel: 1, part: 10 },
  { id: "wash", icon: "🧽", name: "Umyváreň", say: "Umyváreň. Umy blatové auto.", color: "sky", unlockLevel: 1, part: 10 },
  { id: "repair", icon: "🔧", name: "Servis", say: "Servis. Oprav auto správnym nástrojom.", color: "grass", unlockLevel: 2, part: 10 },
  { id: "park", icon: "🅿️", name: "Parkovisko", say: "Parkovisko. Zaparkuj autá.", color: "tomato", unlockLevel: 2, part: 10 },
];

/** Difficulty and rewards shared by all games. */
export const MINI = {
  levels: 3,
  levelUpAfter: 2, // results with ≥ 2 stars on the current level → next level
  baseCoins: [20, 30, 45], // by level, × stars factor below
  starFactor: [0.6, 0.8, 1], // 1, 2, 3 stars
  baseXp: [12, 16, 22],
};

// ---------- Pexeso ----------
export const PEXESO = {
  pairs: [3, 6, 8], // by level
  columns: [3, 4, 4],
  pictures: ["🚗", "🚕", "🚌", "🚑", "🚒", "🚓", "🚜", "🏎️", "🚂", "🚁", "🛸", "🚀", "🐶", "🐱", "🦁", "🐸", "🐧", "🦄", "🍎", "🍓", "⭐", "🌈"],
  showMs: 950, // a wrong pair stays open this long
  peekMs: [1500, 1000, 0], // all cards shown at the start on the easy levels
  stars: [0.5, 1.3], // mistakes ≤ pairs × 0.5 → 3 stars, ≤ pairs × 1.3 → 2 stars
};

// ---------- Umyváreň ----------
export const WASH = {
  blobs: [45, 70, 95], // mud blobs by level
  brush: [0.09, 0.075, 0.065], // brush radius as a share of the car width
  cleanAt: 0.9, // share of mud/foam removed to finish a phase
  stars: [25, 45], // seconds: under 25 s → 3 stars, under 45 s → 2 stars
  mud: ["#7a4a1f", "#8b5a2b", "#6b3e17", "#9c6b3a", "#5e3613"],
};

// ---------- Servis ----------
// at: where the trouble is shown on the side view of the car (render/car-side.js points).
export const REPAIR = {
  problems: [3, 4, 5], // by level
  choices: [3, 4, 5], // tools offered
  list: [
    { id: "tire", tool: "🛞", mark: "💨", at: "rearWheel", say: "Koleso je prázdne." },
    { id: "light", tool: "💡", mark: "🌑", at: "front", say: "Nesvieti svetlo." },
    { id: "fuel", tool: "⛽", mark: "❗", at: "back", say: "Došiel benzín." },
    { id: "oil", tool: "🛢️", mark: "💧", at: "engine", say: "Motor potrebuje olej." },
    { id: "paint", tool: "🖌️", mark: "〰️", at: "sticker", say: "Auto je poškriabané." },
    { id: "battery", tool: "🔋", mark: "💤", at: "engine", say: "Auto nenaštartuje. Chce novú batériu." },
    { id: "screw", tool: "🔧", mark: "🔩", at: "frontWheel", say: "Uvoľnila sa skrutka na kolese." },
    { id: "wash", tool: "🧽", mark: "🟤", at: "roof", say: "Strecha je od blata." },
  ],
  stars: [0, 2], // mistakes: 0 → 3 stars, ≤ 2 → 2 stars
};

// ---------- Parkovisko ----------
export const PARK = {
  waves: 3,
  cars: [3, 4, 5], // cars per wave by level
  dotsFromLevel: 3, // from this level some waves match dots instead of colours
  colors: [
    { hex: "#ff4d4d", say: "červené" },
    { hex: "#3a86ff", say: "modré" },
    { hex: "#ffd23f", say: "žlté" },
    { hex: "#2ec27e", say: "zelené" },
    { hex: "#ff8c1a", say: "oranžové" },
    { hex: "#9b5de5", say: "fialové" },
  ],
  stars: [0, 3], // mistakes: 0 → 3 stars, ≤ 3 → 2 stars
};
