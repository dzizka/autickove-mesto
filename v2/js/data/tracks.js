// Race tracks (DESIGN-v2 §4.1). Data only; logic lives in systems/ and games/race/.

/** Shared race constants. Speeds in metres per second, distances in metres. */
export const RACE = {
  lanes: 3,
  laneWidth: 3.6, // metres
  baseSpeed: 24, // top speed of a car with ×1.0 speed
  length: 1000,
  shortLength: 320, // test-menu "short races"
  rivals: [
    { name: "Modrý", color: "#2f80ed", pace: 1.04 },
    { name: "Zelený", color: "#3ebd4a", pace: 0.98 },
    { name: "Fialový", color: "#9b51e0", pace: 0.92 },
  ],
  rivalLevelStep: 0.06, // rivals get this much faster per track level
  levels: 5,
  // Obstacles / traffic per 100 m at level 1 and the growth per level.
  obstaclesPer100: 1.1,
  trafficPer100: 0.6,
  densityLevelStep: 0.22,
  coinRowsPer100: 1.4,
  powerupsPer100: 0.35,
  rampsPer100: 0.25,
  fuelCansPer100: 0.3,
  fuelDrainPerSecond: 1 / 34, // tank lasts ~34 s with ×1.0 fuel
  // End-of-race coins by place, multiplied by level and track bonus.
  placeCoins: [40, 25, 15, 10],
  coinValue: 1, // each collected coin
  xpBase: 20,
  xpPerLevel: 8,
};

export const TRACKS = [
  {
    id: "city",
    name: "Mesto",
    icon: "🏙️",
    rivalBase: 0.86,
    coinBonus: 1,
    weather: "none",
    colors: { ground: "#7ccf5a", groundAlt: "#6cc04b", road: "#5a606b", line: "#ffffff", edge: "#ffd23f", sky: "#9be3f0" },
    scenery: ["🌳", "🏠", "🏢", "🌷", "🏪", "🌳"],
    obstacles: ["🚧", "🛢️", "📦"],
    traffic: ["#f2c94c", "#56ccf2", "#eb5757", "#ffffff", "#bb6bd9"],
    slippery: 0,
    airTime: 0.9,
  },
  {
    id: "forest",
    name: "Les",
    icon: "🌲",
    rivalBase: 0.9,
    coinBonus: 1.15,
    weather: "leaves",
    colors: { ground: "#3f8f3a", groundAlt: "#367e32", road: "#8a6a4a", line: "#f4e3c1", edge: "#5b4330", sky: "#bfe8b0" },
    scenery: ["🌲", "🌳", "🍄", "🦔", "🌲", "🪵"],
    obstacles: ["🪵", "🪨", "🦔"],
    traffic: ["#8d6e63", "#f2994a", "#6fcf97", "#f2c94c"],
    slippery: 0.1,
    airTime: 0.9,
  },
  {
    id: "desert",
    name: "Púšť",
    icon: "🏜️",
    rivalBase: 0.94,
    coinBonus: 1.3,
    weather: "sand",
    colors: { ground: "#f2d18b", groundAlt: "#e8c27a", road: "#c79a5b", line: "#fff4d6", edge: "#a87b45", sky: "#ffe6a8" },
    scenery: ["🌵", "🪨", "🐫", "🌵", "🦎", "🏜️"],
    obstacles: ["🌵", "🪨", "🦂"],
    traffic: ["#e0e0e0", "#f2994a", "#eb5757", "#2d9cdb"],
    slippery: 0.15,
    airTime: 1.0,
  },
  {
    id: "snow",
    name: "Sneh",
    icon: "❄️",
    rivalBase: 0.98,
    coinBonus: 1.45,
    weather: "snow",
    colors: { ground: "#f4f9ff", groundAlt: "#e6f0fa", road: "#b8c6d6", line: "#ffffff", edge: "#7fa3c4", sky: "#dceeff" },
    scenery: ["🌲", "⛄", "🏔️", "🌲", "🐧", "🏠"],
    obstacles: ["⛄", "🧊", "🪨"],
    traffic: ["#eb5757", "#2d9cdb", "#27ae60", "#f2c94c"],
    slippery: 1, // lane changes overshoot unless handling is high
    airTime: 0.9,
  },
  {
    id: "night",
    name: "Noc",
    icon: "🌙",
    rivalBase: 1.02,
    coinBonus: 1.6,
    weather: "night",
    colors: { ground: "#2c4a3a", groundAlt: "#264233", road: "#3a3f4b", line: "#fff6b0", edge: "#ffd23f", sky: "#1c2340" },
    scenery: ["🌳", "🏠", "🦉", "🌳", "🏮", "🌲"],
    obstacles: ["🚧", "🪨", "🦇"],
    traffic: ["#f2c94c", "#ffffff", "#eb5757", "#56ccf2"],
    slippery: 0.1,
    dark: true,
    airTime: 0.9,
  },
  {
    id: "space",
    name: "Vesmír",
    icon: "🚀",
    rivalBase: 1.06,
    coinBonus: 1.8,
    weather: "stars",
    colors: { ground: "#120f2e", groundAlt: "#17133a", road: "#3b2f7a", line: "#7df9ff", edge: "#ff6ad5", sky: "#0b0820" },
    scenery: ["🪐", "⭐", "🌟", "🛸", "☄️", "🌙"],
    obstacles: ["☄️", "🪨", "🛰️"],
    traffic: ["#7df9ff", "#ff6ad5", "#c3ff6a", "#ffffff"],
    slippery: 0.2,
    airTime: 1.5, // low gravity: longer jumps
  },
];

export const POWERUPS = [
  { id: "turbo", icon: "🚀", weight: 3 },
  { id: "shield", icon: "🛡️", weight: 2 },
  { id: "magnet", icon: "🧲", weight: 2 },
];

/** Place → medal icon (4th place has none; there is no losing). */
export const MEDALS = ["🥇", "🥈", "🥉", "🏁"];
