// Car kinds (DESIGN-v2 §5, §14): looks only, stats come from parts. Data only.
// Every car is a Kenney Car Kit model (CC0, v2/models/carkit). `model` is its file; `shape` picks
// the 2D drawing used where the game still draws cars by hand (part 15b replaces those with
// pictures of the 3D model).
// SHAPES.side: geometry for the side view (SVG viewBox 0 0 240 124, front = right).
// SHAPES.top:  proportions for the top view (canvas), length/width relative to the width.

export const SHAPES = {
  sedan: {
    side: {
      body: "M14 86 C10 66 22 58 44 56 L70 54 L92 26 C96 21 102 18 110 18 L160 18 C170 18 176 22 182 30 L200 54 C222 56 232 64 230 86 Z",
      windows: ["M80 54 L98 30 C100 27 103 26 107 26 L132 26 L132 54 Z", "M140 26 L160 26 C166 26 170 29 173 33 L188 54 L140 54 Z"],
      wheels: [62, 184],
      wheelR: 19,
      wheelY: 92,
      roof: [128, 16],
      sticker: [104, 72],
      wing: [18, 56],
      front: [222, 66],
      back: [14, 70],
    },
    top: { len: 1.85, radius: 0.42, cabin: [0.2, 0.37], rear: [0.66, 0.77] },
  },
  jeep: {
    side: {
      body: "M12 88 L12 60 C12 54 16 50 24 50 L64 50 L78 18 C80 14 84 12 90 12 L176 12 C182 12 186 16 188 22 L196 50 L222 52 C228 53 232 58 232 64 L232 88 Z",
      windows: ["M84 46 L94 20 L132 20 L132 46 Z", "M140 20 L176 20 C179 20 181 22 182 25 L188 46 L140 46 Z"],
      wheels: [60, 186],
      wheelR: 23,
      wheelY: 92,
      roof: [132, 10],
      sticker: [100, 70],
      wing: [16, 50],
      front: [226, 62],
      back: [12, 64],
    },
    top: { len: 1.8, radius: 0.18, cabin: [0.18, 0.36], rear: [0.6, 0.8] },
  },
  taxi: {
    extra: "sign",
    side: {
      body: "M14 86 C10 66 22 58 44 56 L70 54 L92 26 C96 21 102 18 110 18 L160 18 C170 18 176 22 182 30 L200 54 C222 56 232 64 230 86 Z",
      windows: ["M80 54 L98 30 C100 27 103 26 107 26 L132 26 L132 54 Z", "M140 26 L160 26 C166 26 170 29 173 33 L188 54 L140 54 Z"],
      wheels: [62, 184],
      wheelR: 19,
      wheelY: 92,
      roof: [128, 6],
      sticker: [104, 72],
      wing: [18, 56],
      front: [222, 66],
      back: [14, 70],
    },
    top: { len: 1.85, radius: 0.42, cabin: [0.2, 0.37], rear: [0.66, 0.77], extra: "sign" },
  },
  police: {
    extra: "lightbar",
    side: {
      body: "M14 86 C10 66 22 58 44 56 L70 54 L92 26 C96 21 102 18 110 18 L160 18 C170 18 176 22 182 30 L200 54 C222 56 232 64 230 86 Z",
      windows: ["M80 54 L98 30 C100 27 103 26 107 26 L132 26 L132 54 Z", "M140 26 L160 26 C166 26 170 29 173 33 L188 54 L140 54 Z"],
      wheels: [62, 184],
      wheelR: 19,
      wheelY: 92,
      roof: [128, 6],
      sticker: [104, 72],
      wing: [18, 56],
      front: [222, 66],
      back: [14, 70],
    },
    top: { len: 1.85, radius: 0.42, cabin: [0.2, 0.37], rear: [0.66, 0.77], extra: "lightbar" },
  },
  fire: {
    extra: "ladder",
    side: {
      body: "M10 90 L10 40 C10 36 13 33 17 33 L160 33 L160 26 C160 20 164 16 170 16 L196 16 C204 16 208 20 211 26 L224 54 C230 56 234 62 234 70 L234 90 Z",
      windows: ["M168 22 L196 22 C200 22 203 25 205 28 L214 50 L168 50 Z"],
      wheels: [48, 104, 198],
      wheelR: 18,
      wheelY: 94,
      roof: [186, 12],
      sticker: [84, 64],
      wing: [14, 34],
      front: [228, 70],
      back: [10, 76],
    },
    top: { len: 2.35, radius: 0.16, cabin: [0.04, 0.2], rear: null, extra: "ladder" },
  },
  formula: {
    extra: "cockpit",
    side: {
      body: "M8 82 C8 74 14 70 24 70 L80 68 C92 60 104 58 116 58 L150 58 C160 58 168 62 176 66 L226 72 C232 73 236 77 236 82 L236 90 L8 90 Z",
      windows: [],
      wheels: [48, 196],
      wheelR: 21,
      wheelY: 90,
      roof: [132, 34],
      sticker: [176, 80],
      wing: [16, 62],
      front: [230, 80],
      back: [8, 80],
    },
    top: { len: 2.0, radius: 0.5, width: 0.62, cabin: [0.42, 0.52], rear: null, extra: "cockpit" },
  },
  truck: {
    side: {
      body: "M8 92 L8 24 C8 20 11 18 15 18 L150 18 C154 18 156 20 156 24 L156 92 Z M160 92 L160 40 C160 34 164 30 170 30 L198 30 C206 30 210 34 213 40 L226 62 C232 64 236 70 236 78 L236 92 Z",
      windows: ["M172 36 L198 36 C202 36 205 39 207 42 L216 60 L172 60 Z"],
      wheels: [40, 122, 200],
      wheelR: 18,
      wheelY: 96,
      roof: [190, 26],
      sticker: [82, 56],
      wing: [10, 20],
      front: [230, 80],
      back: [8, 80],
    },
    top: { len: 2.6, radius: 0.12, cabin: [0.04, 0.14], rear: null, extra: "trailer" },
  },
  rocket: {
    extra: "fins",
    side: {
      body: "M22 88 C6 88 4 60 22 56 L42 52 L160 40 C200 36 236 56 236 72 C236 84 224 88 210 88 Z",
      windows: ["M150 58 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0 Z", "M118 60 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 Z"],
      wheels: [64, 182],
      wheelR: 15,
      wheelY: 96,
      roof: [150, 34],
      sticker: [86, 70],
      wing: [24, 50],
      front: [232, 72],
      back: [8, 72],
    },
    top: { len: 2.0, radius: 0.5, nose: true, cabin: [0.22, 0.34], rear: null, extra: "fins" },
  },
};

// fit (play-test: not every tuning part fits every car): spoiler = a rear spoiler can sit on the
// trunk; roof = there is a free roof for a roof item (not on cars with their own lights, sign or
// ladder, and not on open cars). A part that does not fit is simply not shown on that car.
const ALL = { spoiler: true, roof: true };
const ROOF = { spoiler: false, roof: true };
const NONE = { spoiler: false, roof: false };
const car = (id, name, icon, price, model, shape, fit) => ({ id, name, icon, price, model, shape, fit, ...SHAPES[shape] });

// sorted by price; the first one is free
export const CARS = [
  car("sedan", "Autíčko", "🚗", 0, "sedan", "sedan", ALL),
  car("jeep", "Džíp", "🚙", 400, "suv", "jeep", ROOF),
  car("taxi", "Taxík", "🚕", 600, "taxi", "taxi", NONE),
  car("van", "Dodávka", "🚐", 700, "van", "jeep", ROOF),
  car("police", "Polícia", "🚓", 900, "police", "police", NONE),
  car("hatch", "Športiak", "⚡", 1000, "hatchback-sports", "sedan", ALL),
  car("ambulance", "Sanitka", "🚑", 1100, "ambulance", "jeep", NONE),
  car("fire", "Hasiči", "🚒", 1300, "firetruck", "fire", NONE),
  car("pickup", "Pikap", "🛻", 1400, "truck", "jeep", ROOF),
  car("garbage", "Smetiari", "♻️", 1500, "garbage-truck", "truck", NONE),
  car("tractor", "Traktor", "🚜", 1600, "tractor", "jeep", ROOF),
  car("sports", "Pretekár", "🏁", 1700, "sedan-sports", "sedan", ALL),
  car("formula", "Formula", "🏎️", 1800, "race", "formula", NONE),
  car("luxury", "Luxusné auto", "💎", 2000, "suv-luxury", "jeep", ROOF),
  car("truck", "Kamión", "🚚", 2200, "delivery", "truck", NONE),
  car("alien", "Mimozemšťan", "👽", 2500, "kart-oobi", "formula", NONE),
  car("alien2", "Mimozemšťan 2", "👾", 2600, "kart-oozi", "formula", NONE),
  car("future", "Raketové auto", "🚀", 3000, "race-future", "rocket", NONE),
];

/** Old car ids that were replaced (save migration v10 → v11). */
export const RENAMED_CARS = { rocket: "future" };

/** Not for sale: the van used as traffic in races. */
export const TRAFFIC_TOP = { len: 2.1, radius: 0.14, cabin: [0.08, 0.22], rear: null, extra: "box" };
