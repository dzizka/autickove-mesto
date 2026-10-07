// Mesto (DESIGN-v2 §13): buildings along the street. Data only.
// price = coins to build (level 1); every next level costs CITY.upgradeFactor × more.
// rent = coins per hour on level 1 (× level). go = what a tap on "▶" opens: a game or a screen.

export const BUILDINGS = [
  { id: "kiosk", icon: "📰", name: "Trafika", say: "Trafika. Tu sú nálepky do albumu.", price: 60, rent: 2, go: { screen: "album" }, color: "#ffb4a2", unlockLevel: 1 },
  { id: "gas", icon: "⛽", name: "Benzínka", say: "Benzínka. Odtiaľ sa ide na preteky.", price: 120, rent: 3, go: { screen: "races" }, color: "#ffd166", unlockLevel: 1 },
  { id: "wash", icon: "🧼", name: "Umyváreň", say: "Umyváreň.", price: 200, rent: 5, go: { game: "wash" }, color: "#8ecae6", unlockLevel: 1 },
  { id: "arcade", icon: "🎲", name: "Herňa", say: "Herňa. Tu sa hrá pexeso.", price: 300, rent: 7, go: { game: "pexeso" }, color: "#cdb4db", unlockLevel: 1 },
  { id: "toys", icon: "🧸", name: "Hračkárstvo", say: "Hračkárstvo. Tu sú skladačky.", price: 450, rent: 10, go: { game: "puzzle" }, color: "#ffafcc", unlockLevel: 2 },
  { id: "shop", icon: "🛒", name: "Obchod", say: "Obchod. Tu sa počíta.", price: 650, rent: 14, go: { game: "count" }, color: "#b5e48c", unlockLevel: 2 },
  { id: "service", icon: "🔧", name: "Servis", say: "Servis. Tu sa opravujú autá.", price: 900, rent: 19, go: { game: "repair" }, color: "#a3c4f3", unlockLevel: 3 },
  { id: "parking", icon: "🅿️", name: "Parkovisko", say: "Parkovisko.", price: 1200, rent: 25, go: { game: "park" }, color: "#90dbf4", unlockLevel: 3 },
  { id: "garden", icon: "🌳", name: "Záhrada s bludiskom", say: "Záhrada s bludiskom.", price: 1600, rent: 32, go: { game: "maze" }, color: "#98f5e1", unlockLevel: 4 },
  { id: "school", icon: "🏫", name: "Škola", say: "Škola. Tu sa učia písmenká.", price: 2100, rent: 40, go: { game: "letters" }, color: "#fde4cf", unlockLevel: 5 },
  { id: "musicHall", icon: "🎵", name: "Hudobňa", say: "Hudobňa.", price: 2800, rent: 50, go: { game: "music" }, color: "#f1c0e8", unlockLevel: 6 },
  { id: "police", icon: "🚓", name: "Polícia", say: "Polícia. Stará sa o križovatku.", price: 3600, rent: 62, go: { game: "traffic" }, color: "#a0c4ff", unlockLevel: 7 },
];

export const CITY = {
  maxLevel: 3,
  upgradeFactor: 2, // level 2 costs 2 × price, level 3 costs 4 × price
  rentCapHours: 12, // rent waits at most this long, then stops growing
  minCollect: 1, // a coin bubble shows from this many coins
};

/**
 * The town seen from above (DESIGN-v2 §14, part 16): a grid of streets with blocks between them.
 * Buildings take the blocks nearest the middle (in BUILDINGS order), houses and parks the rest.
 * Models are Kenney City Kits (CC0) in v2/models/city.
 */
export const TOWN = {
  blocks: 4, // blocks per side
  blockTiles: 3, // a block is 3 × 3 road tiles
  start: [2, 2], // the car starts on this crossing
  speed: 3.2, // tiles per second
  lane: 0.2, // drive on the right
  carLength: 0.85, // in tiles
  pickup: 0.5, // a coin is taken this close
  // the look of a building on level 1, 2 and 3: it grows from a small shop to a tower
  looks: [
    ["city/commercial/building-c", "city/commercial/building-f", "city/commercial/building-skyscraper-a"],
    ["city/commercial/building-e", "city/commercial/building-i", "city/commercial/building-skyscraper-b"],
    ["city/commercial/building-a", "city/commercial/building-g", "city/commercial/building-skyscraper-c"],
    ["city/commercial/building-b", "city/commercial/building-l", "city/commercial/building-skyscraper-e"],
    ["city/commercial/building-d", "city/commercial/building-j", "city/commercial/building-m"],
  ],
  houses: ["city/suburban/building-type-a", "city/suburban/building-type-b", "city/suburban/building-type-d", "city/suburban/building-type-n", "city/suburban/building-type-s"],
};
