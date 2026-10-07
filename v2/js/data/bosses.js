// Bosses (DESIGN-v2 §4.5): one per track, after the challenge bar fills (3 races).
// Bigger, own music, throws things on the road. pace: boss speed × fastest rival of the level
// (a bit below 1: the throws make it hard enough, and a 🟢 car must be able to win).
// music: a short loop of [Hz, seconds] bass notes.

export const BOSSES = [
  { id: "roadKing", track: "city", name: "Kráľ ciest", icon: "🤴", color: "#ffd23f", throws: "🛢️", pace: 0.93, music: [[110, 0.2], [110, 0.2], [147, 0.2], [131, 0.4]] },
  { id: "bear", track: "forest", name: "Medveď Drevorubač", icon: "🐻", color: "#8d6e63", throws: "🪵", pace: 0.93, music: [[98, 0.3], [123, 0.3], [98, 0.3], [82, 0.3]] },
  { id: "scorpion", track: "desert", name: "Škorpión", icon: "🦂", color: "#e0a050", throws: "🪨", pace: 0.93, music: [[117, 0.15], [117, 0.15], [139, 0.15], [117, 0.15], [104, 0.4]] },
  { id: "yeti", track: "snow", name: "Snežný Yeti", icon: "🦍", color: "#dceeff", throws: "❄️", pace: 0.93, music: [[131, 0.3], [156, 0.3], [175, 0.3], [156, 0.3]] },
  { id: "bat", track: "night", name: "Netopier", icon: "🦇", color: "#5b4b8a", throws: "🎃", pace: 0.93, music: [[92, 0.25], [87, 0.25], [92, 0.25], [69, 0.5]] },
  { id: "ufo", track: "space", name: "Ufo", icon: "🛸", color: "#7df9ff", throws: "☄️", pace: 0.93, music: [[220, 0.12], [330, 0.12], [262, 0.12], [196, 0.3]] },
];

export const BOSS = {
  throwEvery: [3.2, 5], // seconds between throws (random in range)
  throwAhead: [45, 65], // metres ahead of the player where things land
  warnTime: 1.2, // a target ⭕ shows this long before the thing lands (never a surprise hit)
  legendaryChance: 0.15, // boss win: sure epic part, small chance of a legendary instead
  setChance: 0.5, // the sure epic is a set piece this often
  coinBonus: 80,
};
