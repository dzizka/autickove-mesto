// Race surroundings in 3D (part 24, DESIGN-v2 §4.1): the models beside and on the road, and
// what each track has along it. Data only; placing is in games/race/road.js, drawing in
// games/race/scene.js and decor.js, pictures in render/car-pics.js.
//
// MODELS[id] = { path (under v2/models, or "proc:<name>" built in render/three/props3d.js),
//   w = width in sprite units (300 per metre; built models use their real size when w is 0),
//   opts = picture options (tint, snow, windows…), turn = seen a little from the side when it
//   stands beside the road, face = turned this many degrees towards the road, fb = the 2D drawing used until the picture is ready or without WebGL }

export const MODELS = {
  // ---- city ----
  house1: { path: "city/suburban/building-type-a", w: 1700, opts: { windows: true }, fb: "house" },
  house2: { path: "city/suburban/building-type-c", w: 1700, opts: { windows: true }, fb: "house" },
  house3: { path: "city/suburban/building-type-k", w: 1650, opts: { windows: true }, fb: "house" },
  house4: { path: "city/suburban/building-type-n", w: 1700, opts: { windows: true }, fb: "house" },
  tower1: { path: "city/commercial/building-skyscraper-a", w: 1500, opts: { windows: true }, fb: "tower" },
  tower2: { path: "city/commercial/building-c", w: 1600, opts: { windows: true }, fb: "tower" },
  tower3: { path: "city/commercial/building-f", w: 1600, opts: { windows: true }, fb: "tower" },
  cityTree: { path: "city/suburban/tree-large", w: 900, fb: "tree" },
  cityTreeS: { path: "city/suburban/tree-small", w: 700, fb: "bush" },
  planter: { path: "city/suburban/planter", w: 700, fb: "bush" },
  // ---- forest ----
  oak: { path: "nature/tree_oak", w: 1150, fb: "tree" },
  treeRound: { path: "nature/tree_default", w: 1100, fb: "tree" },
  treeFat: { path: "nature/tree_fat", w: 1150, fb: "tree" },
  treeBranchy: { path: "nature/tree_detailed", w: 1200, fb: "tree" },
  pine: { path: "nature/tree_pineDefaultA", w: 850, fb: "pine" },
  pineTall: { path: "nature/tree_pineTallA_detailed", w: 800, fb: "pine" },
  mushrooms: { path: "nature/mushroom_redGroup", w: 600, fb: "mushroom" },
  logStack: { path: "nature/log_stack", w: 650, fb: "log" },
  mossRock: { path: "nature/rock_largeA", w: 900, fb: "rock" },
  bushN: { path: "nature/plant_bushLarge", w: 650, fb: "bush" },
  leaves: { path: "nature/grass_leafsLarge", w: 520, fb: "bush" },
  tent: { path: "nature/tent_detailedClosed", w: 1100, fb: "bush" },
  // ---- desert ----
  cactusTall: { path: "nature/cactus_tall", w: 700, fb: "cactus" },
  cactusShort: { path: "nature/cactus_short", w: 600, fb: "cactusSmall" },
  sandTower: { path: "nature/rock_tallB", w: 1300, opts: { tint: "#e0a463", tintK: 0.55 }, fb: "rock" },
  sandBoulder: { path: "nature/rock_largeC", w: 1100, opts: { tint: "#e8b878", tintK: 0.6 }, fb: "rock" },
  pebbles: { path: "nature/stone_smallA", w: 380, opts: { tint: "#d9a066", tintK: 0.5 }, fb: "rock" },
  palm: { path: "nature/tree_palmTall", w: 1250, fb: "palm" },
  palmSmall: { path: "nature/tree_palm", w: 1050, fb: "palm" },
  // ---- snow ----
  snowPine: { path: "nature/tree_pineDefaultA", w: 850, opts: { snow: 0.25 }, fb: "snowPine" },
  snowPineTall: { path: "nature/tree_pineTallA_detailed", w: 800, opts: { snow: 0.25 }, fb: "snowPine" },
  snowPineRound: { path: "nature/tree_pineRoundA", w: 900, opts: { snow: 0.25 }, fb: "snowPine" },
  cabin1: { path: "city/suburban/building-type-a", w: 2000, opts: { snow: 0.5 }, fb: "house" },
  cabin2: { path: "city/suburban/building-type-k", w: 1900, opts: { snow: 0.5 }, fb: "house" },
  snowRock: { path: "nature/rock_largeA", w: 900, opts: { snow: 0.3 }, fb: "rock" },
  snowLogs: { path: "nature/log_stack", w: 650, opts: { snow: 0.4 }, fb: "log" },
  snowmanBig: { path: "proc:snowman", w: 420, fb: "snowman" },
  // ---- space ----
  crystalBig: { path: "proc:crystal", w: 650, fb: "crystal" },
  alienRock: { path: "nature/rock_tallA", w: 1100, opts: { tint: "#7a5fc0", tintK: 0.65 }, fb: "crystalRock" },
  alienStone: { path: "nature/stone_tallA", w: 700, opts: { tint: "#5a4a9a", tintK: 0.6 }, fb: "crystalRock" },
  glowPost: { path: "proc:glowPost", w: 160, fb: "lamp" },
  snowPole: { path: "proc:snowPole", w: 75, fb: "lamp" },

  // ---- start and finish ----
  stands: { path: "racingkit/grandStandCovered", w: 2600, face: 135, fb: "" },
  standsOpen: { path: "racingkit/grandStand", w: 2600, face: 135, fb: "" },
  flagRed: { path: "racingkit/flagRed", w: 260, fb: "" },
  flagGreen: { path: "racingkit/flagGreen", w: 260, fb: "" },
  flagChecker: { path: "racingkit/flagCheckers", w: 260, fb: "" },
  bannerTower: { path: "racingkit/bannerTowerRed", w: 520, fb: "" },

  // ---- obstacles (drawn RACE_DRAW.obstacle × bigger, the lane is 1080 wide) ----
  cone: { path: "carkit/cone", w: 380, fb: "cone" },
  crate: { path: "carkit/box", w: 470, fb: "crate" },
  barrier: { path: "city/roads/construction-barrier", w: 520, fb: "barrier" },
  log: { path: "nature/log_large", w: 560, fb: "log" },
  rock: { path: "nature/rock_largeB", w: 500, fb: "rock" },
  stump: { path: "nature/stump_round", w: 420, fb: "stump" },
  cactusSmall: { path: "nature/cactus_short", w: 330, fb: "cactusSmall" },
  sandRock: { path: "nature/rock_largeB", w: 500, opts: { tint: "#e8b878", tintK: 0.55 }, fb: "rock" },
  snowman: { path: "proc:snowman", w: 330, fb: "snowman" },
  iceBlock: { path: "proc:iceBlock", w: 420, fb: "iceBlock" },
  snowball: { path: "proc:snowball", w: 470, fb: "snowball" },
  barrel: { path: "proc:barrel", w: 340, fb: "barrel" },
  asteroid: { path: "nature/rock_largeC", w: 520, opts: { tint: "#8a80a8", tintK: 0.6 }, fb: "asteroid" },
  satellite: { path: "proc:satellite", w: 600, fb: "satellite" },
  crystalRock: { path: "proc:crystalRock", w: 420, fb: "crystalRock" },
};

/** Sizes of things drawn on the road (× their width) and how fog hides them. */
export const RACE_DRAW = {
  obstacle: 1.9, // bigger than life, so a child spots them early (§4.1)
  obstacleFog: 0.45, // obstacles stay visible through fog: only this much of the fog applies
  sceneryPpu: 150, // picture sharpness of scenery (pixels per model unit); obstacles use the default
};

/**
 * What each track has along the road (DESIGN-v2 §4.1, part 24):
 * far = big things a bit away from the road, near = small things right beside it,
 * edge = a rail along the road in stretches [on, off] in segments (guardrail | fence | wall | glow),
 * posts = a model at the road edge every `every` segments, both sides in turn,
 * stands = beside the start and the finish, landmarks = [{ kind: bridge | tunnel | rings, at (0..1 of the race), len (m) }],
 * tunnel/water = colours.
 */
export const DECOR = {
  city: {
    far: ["house1", "house2", "house3", "house4", "tower1", "tower2", "tower3", "cityTree", "cityTree"],
    farEvery: [6, 11],
    near: ["cityTreeS", "planter", "cityTreeS"],
    nearEvery: [7, 12],
    edge: { kind: "guardrail", stretch: [60, 45] },
    lamps: 26,
    stands: ["stands", "flagRed", "bannerTower", "flagGreen"],
    landmarks: [{ kind: "bridge", at: 0.32, len: 45 }, { kind: "tunnel", at: 0.66, len: 70 }],
    tunnel: { face: "#9aa3ad", top: "#62c162", wall: "#c9ccd2", ceil: "#8a8f99", light: "#fff3b0" },
    water: ["#3fa7e0", "#5bbdf0"],
  },
  forest: {
    far: ["oak", "treeRound", "treeFat", "treeBranchy", "pine", "pineTall", "pine", "oak", "mossRock", "tent"],
    farEvery: [5, 8],
    near: ["mushrooms", "bushN", "leaves", "logStack", "bushN", "leaves"],
    nearEvery: [5, 9],
    edge: { kind: "fence", stretch: [50, 70] },
    stands: ["standsOpen", "flagGreen", "flagRed"],
    landmarks: [{ kind: "bridge", at: 0.3, len: 35 }, { kind: "tunnel", at: 0.62, len: 60 }],
    tunnel: { face: "#4a8a4e", top: "#3f8f3f", wall: "#8a6a4a", ceil: "#6b5238", light: "#ffe28a" },
    water: ["#3f9fd0", "#57b4e0"],
  },
  desert: {
    far: ["cactusTall", "sandTower", "palm", "cactusTall", "sandBoulder", "palmSmall", "cactusShort"],
    farEvery: [4, 9],
    near: ["pebbles", "cactusShort", "pebbles"],
    nearEvery: [5, 10],
    edge: { kind: "wall", stretch: [40, 80] },
    stands: ["standsOpen", "flagRed", "bannerTower"],
    landmarks: [{ kind: "tunnel", at: 0.5, len: 55 }],
    tunnel: { face: "#d39a5c", top: "#e8bd68", wall: "#c98d52", ceil: "#a8743f", light: "#fff3c4" },
  },
  snow: {
    far: ["snowPine", "snowPineTall", "snowPineRound", "snowPine", "cabin1", "snowRock", "cabin2", "snowPineTall"],
    farEvery: [3, 7],
    near: ["snowLogs", "snowmanBig", "snowRock"],
    nearEvery: [8, 14],
    posts: { id: "snowPole", every: 12 },
    stands: ["stands", "flagRed", "flagGreen"],
    landmarks: [{ kind: "tunnel", at: 0.45, len: 80 }],
    tunnel: { face: "#8d9bb0", top: "#ffffff", wall: "#b8c4d4", ceil: "#7d8899", light: "#ffffff" },
  },
  night: {
    far: ["tower1", "house1", "tower2", "house3", "tower3", "cityTree", "house4"],
    farEvery: [6, 11],
    near: ["cityTreeS", "planter"],
    nearEvery: [8, 14],
    edge: { kind: "guardrail", stretch: [70, 40] },
    lamps: 18,
    stands: ["stands", "flagRed", "bannerTower"],
    landmarks: [{ kind: "tunnel", at: 0.35, len: 80 }, { kind: "bridge", at: 0.7, len: 45 }],
    tunnel: { face: "#262a4d", top: "#1d3b2c", wall: "#4a4f66", ceil: "#2c3047", light: "#ffd86b" },
    water: ["#1f3f78", "#28508f"],
  },
  space: {
    far: ["alienRock", "crystalBig", "alienStone", "crystalBig", "alienRock", "planet", "ufo"],
    farEvery: [4, 8],
    near: ["crystalBig", "alienStone"],
    nearEvery: [7, 12],
    edge: { kind: "glow", stretch: [90, 30] },
    posts: { id: "glowPost", every: 16 },
    stands: ["stands", "bannerTower"],
    landmarks: [{ kind: "rings", at: 0.3, len: 70 }, { kind: "rings", at: 0.72, len: 70 }],
  },
};

/** Moods of the pictures per track (render/three/props3d.js MOODS). */
export const TRACK_MOOD = { night: "night", space: "space" };
