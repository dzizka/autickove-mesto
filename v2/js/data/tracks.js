// Race tracks (DESIGN-v2 §4.1). Data only; logic lives in systems/ and games/race/.

/** Shared race constants. Speeds in metres per second, distances in metres. */
export const RACE = {
  lanes: 3, // default; every track has its own count (TRACKS[].lanes)
  laneWidth: 3.6, // metres
  baseSpeed: 24, // top speed of a car with ×1.0 speed
  // Speed on screen is capped (play-test: a strong car was too fast to dodge anything).
  // Above the cap the whole race runs in slow motion, so rivals still fall behind,
  // but obstacles come at a speed a child can react to (§4.1).
  visibleCap: 1.12, // × baseSpeed
  length: 1000,
  shortLength: 320, // test-menu "short races"
  rivals: [
    { name: "Modrý", color: "#2f80ed", pace: 1.04 },
    { name: "Zelený", color: "#3ebd4a", pace: 0.98 },
    { name: "Fialový", color: "#9b51e0", pace: 0.92 },
  ],
  rivalLevelStep: 0.06, // rivals get this much faster per track level
  // No frustration (§4.8): after this many races without a win on the newest level,
  // its rivals get easeStep slower per extra race, at most easeMax.
  easeAfter: 6,
  easeStep: 0.015,
  easeMax: 0.12,
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

/**
 * Per track (DESIGN-v2 §4.1): lanes, sprite ids for scenery and obstacles (render/road-sprites.js),
 * scene = colours of the pseudo-3D view (far: skyline | hills | dunes | mountains | space),
 * road = repeating plan of [metres, curve, hill]; curves and hills are only for the eye.
 */
export const TRACKS = [
  {
    id: "city",
    name: "Mesto",
    icon: "🏙️",
    rivalBase: 0.86,
    coinBonus: 1,
    weather: "none",
    colors: { ground: "#7ccf5a", groundAlt: "#6cc04b", road: "#5a606b", line: "#ffffff", edge: "#ffd23f", sky: "#9be3f0" },
    scenery: ["house", "tree", "lamp", "house", "bush", "tower"],
    obstacles: ["cone", "barrier", "crate"],
    traffic: ["#f2c94c", "#56ccf2", "#eb5757", "#ffffff", "#bb6bd9"],
    slippery: 0,
    airTime: 0.9,
    lanes: 3,
    scene: { sky: ["#58b7ff", "#d4f0ff"], fog: "#d4f0ff", far: "skyline", hills: ["#a9c0d3", "#86a0b6"], grass: ["#62c162", "#59b559"], road: ["#6c7079", "#686b74"], rumble: ["#ffffff", "#e8463a"], line: "#ffffff", sun: "sun" },
    road: [[60, 0, 0], [70, 2, 0], [40, 0, 0], [80, -3, 1], [50, 0, -1], [70, 3, 0], [60, -2, 0]],
  },
  {
    id: "forest",
    name: "Les",
    icon: "🌲",
    rivalBase: 0.9,
    coinBonus: 1.15,
    weather: "leaves",
    colors: { ground: "#3f8f3a", groundAlt: "#367e32", road: "#8a6a4a", line: "#f4e3c1", edge: "#5b4330", sky: "#bfe8b0" },
    scenery: ["tree", "pine", "tree", "mushroom", "pine", "rock", "🦌"],
    obstacles: ["log", "rock", "stump"],
    traffic: ["#8d6e63", "#f2994a", "#6fcf97", "#f2c94c"],
    slippery: 0.1,
    airTime: 0.9,
    lanes: 2,
    scene: { sky: ["#7fd0ff", "#e3f6ff"], fog: "#cfe9d8", far: "hills", hills: ["#6fae68", "#4a8a4e"], grass: ["#3f8f3f", "#3a863a"], road: ["#a07a52", "#9a744d"], rumble: ["#7a5636", "#8b6644"], line: "#e9d6b0", sun: "sun" },
    road: [[40, 0, 2], [60, -4, 3], [40, 0, -3], [60, 4, 2], [40, -3, -2], [50, 5, 1], [40, 0, -3]],
  },
  {
    id: "desert",
    name: "Púšť",
    icon: "🏜️",
    rivalBase: 0.94,
    coinBonus: 1.3,
    weather: "sand",
    colors: { ground: "#f2d18b", groundAlt: "#e8c27a", road: "#c79a5b", line: "#fff4d6", edge: "#a87b45", sky: "#ffe6a8" },
    scenery: ["cactus", "rock", "cactus", "palm", "🐫"],
    obstacles: ["cactusSmall", "rock", "tumbleweed"],
    traffic: ["#e0e0e0", "#f2994a", "#eb5757", "#2d9cdb"],
    slippery: 0.15,
    airTime: 1.0,
    lanes: 4,
    scene: { sky: ["#ffb35c", "#ffe7b3"], fog: "#ffe3b0", far: "dunes", hills: ["#eeb46a", "#dc9548"], grass: ["#f0c773", "#e8bd68"], road: ["#8a7f76", "#857a71"], rumble: ["#ffffff", "#d9534f"], line: "#fff3c4", sun: "bigSun" },
    road: [[100, 0, 5], [80, 1, -5], [60, 0, 4], [90, -2, -4], [70, 0, 3]],
  },
  {
    id: "snow",
    name: "Sneh",
    icon: "❄️",
    rivalBase: 0.98,
    coinBonus: 1.45,
    weather: "snow",
    colors: { ground: "#f4f9ff", groundAlt: "#e6f0fa", road: "#b8c6d6", line: "#ffffff", edge: "#7fa3c4", sky: "#dceeff" },
    scenery: ["snowPine", "snowman", "snowPine", "snowPine", "house", "🐧"],
    obstacles: ["snowman", "iceBlock", "snowball"],
    traffic: ["#eb5757", "#2d9cdb", "#27ae60", "#f2c94c"],
    slippery: 1, // lane changes overshoot unless handling is high
    airTime: 0.9,
    lanes: 3,
    scene: { sky: ["#a9cff0", "#eef6ff"], fog: "#eef6ff", far: "mountains", hills: ["#c9dcef", "#a9c1da"], grass: ["#ffffff", "#eef3fa"], road: ["#7d8899", "#788394"], rumble: ["#dd3333", "#ffffff"], line: "#ffffff" },
    road: [[50, 3, 3], [60, -4, -2], [40, 0, 3], [60, 5, -3], [50, -3, 2], [40, 0, -3]],
  },
  {
    id: "night",
    name: "Noc",
    icon: "🌙",
    rivalBase: 1.02,
    coinBonus: 1.6,
    weather: "night",
    colors: { ground: "#2c4a3a", groundAlt: "#264233", road: "#3a3f4b", line: "#fff6b0", edge: "#ffd23f", sky: "#1c2340" },
    scenery: ["lamp", "house", "lamp", "tree", "tower"],
    obstacles: ["cone", "barrier", "barrel"],
    traffic: ["#f2c94c", "#ffffff", "#eb5757", "#56ccf2"],
    slippery: 0.1,
    airTime: 0.9,
    lanes: 3,
    scene: { sky: ["#0b1033", "#2a2f6b"], fog: "#141838", far: "skyline", hills: ["#1f2350", "#161a3c"], grass: ["#1d3b2c", "#193426"], road: ["#3b3e48", "#373a44"], rumble: ["#ffd23f", "#22242b"], line: "#ffd23f", sun: "moon", stars: true, night: true },
    road: [[70, -2, 0], [60, 0, 1], [80, 3, -1], [50, 0, 0], [70, -3, 1], [60, 2, -1]],
  },
  {
    id: "space",
    name: "Vesmír",
    icon: "🚀",
    rivalBase: 1.06,
    coinBonus: 1.8,
    weather: "stars",
    colors: { ground: "#120f2e", groundAlt: "#17133a", road: "#3b2f7a", line: "#7df9ff", edge: "#ff6ad5", sky: "#0b0820" },
    scenery: ["crystal", "planet", "crystal", "crystal", "ufo"],
    obstacles: ["asteroid", "satellite", "crystalRock"],
    traffic: ["#7df9ff", "#ff6ad5", "#c3ff6a", "#ffffff"],
    slippery: 0.2,
    airTime: 1.5, // low gravity: longer jumps,
    lanes: 5,
    scene: { sky: ["#05020f", "#1b0f40"], fog: "#140a33", far: "space", hills: ["#2a1760", "#21124d"], grass: ["#120a2e", "#160d38"], road: ["#3a2a70", "#35266a"], rumble: ["#00e5ff", "#ff3df2"], line: "#9ff6ff", sun: "planet", stars: true, glow: true },
    road: [[80, 4, 6], [80, -4, -6], [60, 0, 4], [80, 5, -4], [60, -3, 0]],
  },
];

export const POWERUPS = [
  { id: "turbo", icon: "🚀", weight: 3 },
  { id: "shield", icon: "🛡️", weight: 2 },
  { id: "magnet", icon: "🧲", weight: 2 },
];

/** Place → medal icon (4th place has none; there is no losing). */
export const MEDALS = ["🥇", "🥈", "🥉", "🏁"];
