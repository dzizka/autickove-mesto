// Album (DESIGN-v2 §13): sticker pages, packs and sticker tiers. Data only.
// The last two stickers of every page are the rare gold ones.

export const PAGES = [
  { id: "vehicles", icon: "🚗", name: "Vozidlá", unlockLevel: 1, stickers: ["🚗", "🚕", "🚌", "🚑", "🚒", "🚓", "🚜", "🚂", "🚁"] },
  { id: "animals", icon: "🐾", name: "Zvieratá", unlockLevel: 1, stickers: ["🐶", "🐱", "🐰", "🐘", "🦒", "🐵", "🐧", "🦁", "🦄"] },
  { id: "food", icon: "🍎", name: "Jedlo", unlockLevel: 1, stickers: ["🍎", "🍌", "🍓", "🍉", "🥕", "🍕", "🍦", "🧁", "🎂"] },
  { id: "space", icon: "🚀", name: "Vesmír", unlockLevel: 2, stickers: ["🌍", "🌙", "⭐", "☁️", "🌈", "🪐", "☄️", "👽", "🛸"] },
  { id: "sea", icon: "🌊", name: "More", unlockLevel: 3, stickers: ["🐠", "🐡", "🐚", "🦀", "🦞", "🐢", "🐋", "🦈", "🐙"] },
  { id: "dinos", icon: "🦕", name: "Dinosaury", unlockLevel: 4, stickers: ["🥚", "🌋", "🦴", "🌴", "⛰️", "🌿", "🐊", "🦕", "🦖"] },
  { id: "music", icon: "🎵", name: "Hudba", unlockLevel: 5, stickers: ["🥁", "🎺", "🎻", "🎷", "🎸", "🎹", "🎤", "🎧", "🎼"] },
  { id: "sport", icon: "⚽", name: "Šport", unlockLevel: 6, stickers: ["⚽", "🏀", "🏈", "⚾", "🎾", "🏓", "🏊", "⛸️", "🏆"] },
  { id: "fairy", icon: "🏰", name: "Rozprávky", unlockLevel: 8, stickers: ["🏰", "🍄", "🔮", "🧚", "🧙", "🐸", "🧞", "👑", "🐉"] },
  { id: "weather", icon: "⛅", name: "Počasie", unlockLevel: 10, stickers: ["☀️", "⛅", "🌧️", "⛈️", "❄️", "🌫️", "☂️", "🌪️", "🌬️"] },
  { id: "bugs", icon: "🐞", name: "Hmyz", unlockLevel: 12, stickers: ["🐞", "🐝", "🐜", "🦗", "🐌", "🐛", "🕷️", "🦋", "🦂"] },
];

export const ALBUM = {
  packPrice: 80,
  packSize: 3,
  goldWeight: 0.35, // the two gold stickers of a page drop this often compared with the others
  missingBoost: 2, // stickers the child does not have yet drop this many times more often
  pageReward: 150, // coins for a full page (once)
  tiers: [
    { id: "normal", name: "Obyčajná", cost: 0 },
    { id: "silver", name: "Strieborná", cost: 3 }, // spare stickers needed
    { id: "gold", name: "Zlatá", cost: 6 },
  ],
  miniSticker: { 3: 1, 2: 0.5 }, // games room: chance of a sticker for 3 / 2 stars
};

// Daily gift (§13): once a day, a bigger gift every day in a row (back to day 1 after a pause).
export const DAILY = {
  coins: [30, 40, 50, 60, 80, 100, 150], // day 1 … 7 (then 7 again)
  packs: [0, 0, 1, 0, 0, 0, 2],
};
