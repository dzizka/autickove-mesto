// Games in the 🎪 Hry room (DESIGN-v2 §12): the activities from v1, written anew. Data only.
// Every game has 3 difficulty levels the child picks; good results move the recommendation up.

export const MINIGAMES = [
  { id: "pexeso", icon: "🃏", name: "Pexeso", say: "Pexeso. Nájdi dvojice.", color: "plum", unlockLevel: 1, part: 10 },
  { id: "wash", icon: "🧽", name: "Umyváreň", say: "Umyváreň. Umy blatové auto.", color: "sky", unlockLevel: 1, part: 10 },
  { id: "repair", icon: "🔧", name: "Servis", say: "Servis. Oprav auto správnym nástrojom.", color: "grass", unlockLevel: 2, part: 10 },
  { id: "park", icon: "🅿️", name: "Parkovisko", say: "Parkovisko. Zaparkuj autá.", color: "tomato", unlockLevel: 2, part: 10 },
  { id: "puzzle", icon: "🧩", name: "Skladačka", say: "Skladačka. Poskladaj obrázok.", color: "sun", unlockLevel: 1, part: 11 },
  { id: "count", icon: "🔢", name: "Počítanie", say: "Počítanie. Spočítaj, koľko ich je.", color: "sky", unlockLevel: 2, part: 11 },
  { id: "maze", icon: "🗺️", name: "Bludisko", say: "Bludisko. Dovez auto do garáže.", color: "grass", unlockLevel: 3, part: 11 },
  { id: "letters", icon: "🔤", name: "Písmenká", say: "Písmenká. Hľadaj písmenká.", color: "plum", unlockLevel: 3, part: 11 },
  { id: "music", icon: "🎵", name: "Hudobná garáž", say: "Hudobná garáž. Zopakuj melódiu.", color: "sun", unlockLevel: 4, part: 11 },
  { id: "traffic", icon: "🚦", name: "Križovatka", say: "Križovatka. Prepínaj semafor.", color: "tomato", unlockLevel: 4, part: 11 },
];

/** Difficulty and rewards shared by all games. */
export const MINI = {
  levels: 3,
  levelUpAfter: 2, // results with ≥ 2 stars on (or above) the recommended level → recommend the next one
  levelNames: ["Ľahké", "Stredné", "Ťažké"], // read aloud on the difficulty buttons
  // by level, × stars factor below (harder pays more); part 21: raised from 15/30/50 so the games
  // room pays about like a race (a game takes about as long)
  baseCoins: [40, 75, 120],
  candy3: 0.25, // 3 stars: this chance of a candy 🍬 for the buddies (part 21)
  starFactor: [0.6, 0.8, 1], // 1, 2, 3 stars
  baseXp: [10, 16, 24],
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

// ---------- Skladačka ----------
export const PUZZLE = {
  size: [2, 3, 4], // pieces per side by level
  ghost: [0.45, 0.25, 0], // how much of the picture shows on the empty board
  stars: [0, 1], // mistakes per side: 0 → 3 stars, ≤ size → 2 stars
  skies: [
    { sky: ["#7cc8ff", "#d8f0ff"], ground: "#5cc26a", sun: "#fff3b0" },
    { sky: ["#ff9a76", "#ffe0a8"], ground: "#e8c27a", sun: "#fff3b0" },
    { sky: ["#2c3e7a", "#7b6fd6"], ground: "#2f6b4a", sun: "#fff7d6" },
    { sky: ["#a9cff0", "#eef6ff"], ground: "#f4f8ff", sun: "#ffffff" },
  ],
};

// ---------- Počítanie ----------
export const COUNT = {
  rounds: 8,
  max: [5, 10, 10], // highest count by level
  options: [3, 3, 4],
  sumChance: [0, 0, 0.45], // level 3: sometimes "how many together" (a + b)
  items: ["🚗", "🚕", "🚌", "🚜", "🍎", "⭐", "🐶", "🎈", "🐤", "🍓", "🐟", "⚽"],
  stars: [1, 3], // rounds missed on the first try: ≤ 1 → 3 stars, ≤ 3 → 2 stars
};
// counting words per language (part 19: the English game counts in English)
export const NUMBER_WORDS_EN = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
export const NUMBER_WORDS = ["nula", "jeden", "dva", "tri", "štyri", "päť", "šesť", "sedem", "osem", "deväť", "desať", "jedenásť", "dvanásť", "trinásť", "štrnásť", "pätnásť", "šestnásť", "sedemnásť", "osemnásť", "devätnásť", "dvadsať"];

// ---------- Bludisko ----------
export const MAZE = {
  size: [5, 7, 9],
  extraDoors: [1, 3, 4], // walls knocked out after the maze is built (more than one way)
  coins: [4, 6, 9],
  stars: [1, 0.5], // share of coins: all → 3 stars, ≥ half → 2 stars
};

// ---------- Písmenká ----------
// Each word: the first letter, a picture and the word (the voice reads it).
export const LETTERS = {
  rounds: 8,
  options: [3, 3, 4],
  modes: [["pick"], ["pick", "first"], ["pick", "first"]], // pick = picture for a letter, first = letter for a picture
  easy: ["A", "M", "O", "P", "S", "L", "T", "K"], // letters on level 1
  stars: [1, 3],
  words: [
    ["A", "🚗", "auto"], ["A", "🍍", "ananás"], ["B", "🍌", "banán"], ["B", "🎈", "balón"], ["C", "🍋", "citrón"],
    ["D", "🏠", "dom"], ["D", "🌈", "dúha"], ["H", "🍄", "huba"], ["H", "🍐", "hruška"],
    ["J", "🍎", "jablko"], ["J", "🦔", "jež"], ["K", "🐄", "krava"], ["K", "🔑", "kľúč"], ["K", "🐴", "kôň"],
    ["L", "🦁", "lev"], ["L", "⛵", "loďka"], ["M", "🐱", "mačka"], ["M", "🐭", "myš"], ["M", "🍉", "melón"],
    ["N", "👃", "nos"], ["N", "🔪", "nôž"], ["O", "🐑", "ovca"], ["O", "🔥", "oheň"], ["O", "👁️", "oko"],
    ["P", "🐶", "pes"], ["P", "🍕", "pizza"], ["R", "🐟", "ryba"], ["R", "🚀", "raketa"],
    ["R", "🤖", "robot"], ["S", "🐘", "slon"], ["S", "☀️", "slnko"], ["S", "🧀", "syr"], ["T", "🐯", "tiger"],
    ["T", "🚜", "traktor"], ["T", "🍰", "torta"], ["U", "👂", "ucho"], ["V", "🚂", "vlak"], ["V", "🐺", "vlk"],
    ["Z", "🦓", "zebra"], ["Z", "🐰", "zajac"], ["Ž", "🐸", "žaba"], ["Ž", "🦒", "žirafa"],
  ],
  // English words (part 19): first letters work differently in each language, so it has its own list
  easyEn: ["A", "B", "C", "D", "M", "P", "S", "T"],
  wordsEn: [
    ["A", "🍎", "apple"], ["A", "🐜", "ant"], ["B", "🍌", "banana"], ["B", "🎈", "balloon"], ["B", "🐻", "bear"],
    ["C", "🐱", "cat"], ["C", "🚗", "car"], ["D", "🐶", "dog"], ["D", "🦆", "duck"], ["E", "🥚", "egg"], ["E", "🐘", "elephant"],
    ["F", "🐟", "fish"], ["F", "🐸", "frog"], ["G", "🍇", "grapes"], ["G", "🦒", "giraffe"], ["H", "🏠", "house"], ["H", "🐴", "horse"],
    ["J", "🧃", "juice"], ["K", "🔑", "key"], ["K", "🪁", "kite"], ["L", "🦁", "lion"], ["L", "🍋", "lemon"],
    ["M", "🐭", "mouse"], ["M", "🌙", "moon"], ["N", "👃", "nose"], ["O", "🐙", "octopus"], ["O", "🍊", "orange"],
    ["P", "🐷", "pig"], ["P", "🍕", "pizza"], ["R", "🐰", "rabbit"], ["R", "🚀", "rocket"], ["R", "🤖", "robot"],
    ["S", "☀️", "sun"], ["S", "🐍", "snake"], ["S", "⭐", "star"], ["T", "🐯", "tiger"], ["T", "🚜", "tractor"], ["T", "🚂", "train"],
    ["U", "☂️", "umbrella"], ["V", "🚐", "van"], ["W", "🐋", "whale"], ["Z", "🦓", "zebra"],
  ],
};

// ---------- Hudobná garáž ----------
export const MUSIC = {
  cars: [
    { hex: "#ff4d4d", note: 262 },
    { hex: "#3a86ff", note: 330 },
    { hex: "#ffd23f", note: 392 },
    { hex: "#2ec27e", note: 523 },
  ],
  start: [2, 3, 3], // first melody length
  goal: [5, 7, 9], // melody length that ends the game
  gap: [800, 650, 520], // ms between notes when the cars play
  stars: [0, 2], // mistakes: 0 → 3 stars, ≤ 2 → 2 stars
};

// ---------- Križovatka ----------
export const TRAFFIC = {
  cars: [8, 12, 16], // cars to let through
  every: [2.6, 2.0, 1.6], // seconds between new cars (± a bit)
  speed: [90, 120, 150], // px/s at a 600 px tall crossing (scales with the screen)
  yellow: 1.1, // seconds of yellow before the other way gets green
  colors: ["#ff4d4d", "#3a86ff", "#ffd23f", "#2ec27e", "#ff8c1a", "#9b5de5", "#ff6fb5"],
  stars: [0, 2], // bumps: 0 → 3 stars, ≤ 2 → 2 stars
};
