// Pictures for free painting (DESIGN-v2 §7.1): 24 in 6 themes, viewBox 0 0 200 200.
// Every shape is a closed area the bucket can fill; later shapes lie on top.
// Shape: ["rect", x, y, w, h, rx?] | ["circle", cx, cy, r] | ["ellipse", cx, cy, rx, ry]
//        | ["poly", "x,y x,y …"] | ["path", d]; an optional last { k: "#222" } = fixed colour
// (eyes, tyres; not fillable, taps go through), { line: true } = outline detail only.
// unlock: null = open from the start; otherwise opens after `races` races or for `price` coins.

const BG = ["rect", 0, 0, 200, 200];
const EYE = (x, y, r = 4) => ["circle", x, y, r, { k: "#2b2d33" }];

export const FREE_PICTURES = [
  // ---------- cars ----------
  {
    id: "car", theme: "cars", name: "Autíčko", unlock: null,
    shapes: [BG, ["rect", 0, 150, 200, 50], ["path", "M20 140 C20 115 35 108 55 106 L70 80 C74 74 80 72 88 72 L130 72 C138 72 144 76 148 82 L162 106 C180 108 186 118 186 140 Z"],
      ["poly", "76,104 88,82 108,82 108,104"], ["poly", "116,82 136,82 150,104 116,104"], ["circle", 60, 145, 18, { k: "#2b2d33" }], ["circle", 150, 145, 18, { k: "#2b2d33" }],
      ["circle", 60, 145, 8], ["circle", 150, 145, 8], ["circle", 40, 30, 16]],
  },
  {
    id: "truck", theme: "cars", name: "Kamión", unlock: { races: 2, price: 60 },
    shapes: [BG, ["rect", 0, 155, 200, 45], ["rect", 14, 70, 110, 70, 4], ["path", "M128 140 L128 90 C128 84 132 80 138 80 L162 80 C168 80 172 84 175 90 L188 114 L188 140 Z"],
      ["poly", "138,88 160,88 172,112 138,112"], ["circle", 44, 148, 15, { k: "#2b2d33" }], ["circle", 100, 148, 15, { k: "#2b2d33" }], ["circle", 160, 148, 15, { k: "#2b2d33" }],
      ["rect", 26, 82, 86, 22, 4], ["circle", 170, 34, 18]],
  },
  {
    id: "bus", theme: "cars", name: "Autobus", unlock: { races: 5, price: 100 },
    shapes: [BG, ["rect", 0, 155, 200, 45], ["rect", 12, 60, 176, 85, 14], ["rect", 24, 72, 30, 30, 4], ["rect", 62, 72, 30, 30, 4], ["rect", 100, 72, 30, 30, 4],
      ["rect", 140, 72, 36, 60, 4], ["rect", 12, 112, 128, 10], ["circle", 50, 148, 16, { k: "#2b2d33" }], ["circle", 150, 148, 16, { k: "#2b2d33" }], ["circle", 182, 128, 5]],
  },
  {
    id: "racer", theme: "cars", name: "Formula", unlock: { races: 9, price: 150 },
    shapes: [BG, ["rect", 0, 150, 200, 50], ["path", "M14 130 C14 120 22 116 34 116 L70 114 C82 100 100 96 120 98 L150 104 L188 118 C194 120 196 126 194 132 L194 138 L14 138 Z"],
      ["circle", 112, 104, 12], ["rect", 10, 96, 26, 8, 2], ["rect", 20, 104, 6, 14], ["circle", 50, 140, 17, { k: "#2b2d33" }], ["circle", 160, 140, 17, { k: "#2b2d33" }],
      ["circle", 80, 126, 9], ["poly", "0,0 60,0 0,40"]],
  },
  // ---------- animals ----------
  {
    id: "cat", theme: "animals", name: "Mačka", unlock: null,
    shapes: [BG, ["rect", 0, 160, 200, 40], ["ellipse", 100, 140, 50, 38], ["path", "M150 150 C185 150 185 110 168 100", { line: true }], ["circle", 100, 82, 42],
      ["poly", "66,62 70,20 96,46"], ["poly", "134,62 130,20 104,46"], EYE(84, 78), EYE(116, 78), ["poly", "94,92 106,92 100,100"], ["ellipse", 100, 150, 22, 14]],
  },
  {
    id: "fish", theme: "animals", name: "Rybka", unlock: { races: 2, price: 60 },
    shapes: [BG, ["path", "M0 170 C40 160 60 180 100 170 C140 160 160 180 200 170 L200 200 L0 200 Z"], ["ellipse", 95, 100, 60, 40], ["poly", "150,100 190,70 190,130"],
      ["path", "M80 64 C90 40 120 44 126 66 Z"], ["path", "M60 100 Q75 75 90 100 Q75 125 60 100 Z"], EYE(60, 92, 6), ["circle", 40, 40, 8], ["circle", 30, 64, 5]],
  },
  {
    id: "butterfly", theme: "animals", name: "Motýľ", unlock: { races: 5, price: 100 },
    shapes: [BG, ["ellipse", 62, 76, 44, 40], ["ellipse", 138, 76, 44, 40], ["ellipse", 70, 136, 32, 30], ["ellipse", 130, 136, 32, 30], ["circle", 62, 76, 16], ["circle", 138, 76, 16],
      ["ellipse", 100, 110, 9, 52], ["circle", 100, 54, 12], ["path", "M96 44 C90 24 80 20 74 22 M104 44 C110 24 120 20 126 22", { line: true }]],
  },
  {
    id: "turtle", theme: "animals", name: "Korytnačka", unlock: { races: 9, price: 150 },
    shapes: [BG, ["rect", 0, 160, 200, 40], ["ellipse", 40, 130, 24, 18], ["ellipse", 70, 160, 16, 12], ["ellipse", 140, 160, 16, 12], ["path", "M50 150 C50 80 160 80 160 150 Z"],
      ["poly", "105,96 125,108 125,130 105,142 85,130 85,108"], ["circle", 66, 130, 12], ["circle", 144, 130, 12], EYE(34, 124, 3)],
  },
  // ---------- crew buddies ----------
  {
    id: "chick", theme: "crew", name: "Kuriatko", unlock: null,
    shapes: [BG, ["rect", 0, 165, 200, 35], ["path", "M40 120 C40 60 160 60 160 120 C160 160 40 160 40 120 Z"], ["path", "M40 120 L60 104 L76 122 L92 102 L108 122 L124 102 L140 122 L160 104 C160 168 40 168 40 120 Z"],
      ["circle", 100, 70, 36], ["poly", "92,74 108,74 100,88"], EYE(86, 64), EYE(114, 64), ["ellipse", 74, 80, 7, 5], ["ellipse", 126, 80, 7, 5]],
  },
  {
    id: "bunny", theme: "crew", name: "Zajko", unlock: { races: 3, price: 60 },
    shapes: [BG, ["rect", 0, 165, 200, 35], ["ellipse", 78, 46, 14, 40], ["ellipse", 122, 46, 14, 40], ["ellipse", 78, 48, 6, 30], ["ellipse", 122, 48, 6, 30], ["ellipse", 100, 140, 46, 36],
      ["circle", 100, 96, 38], EYE(86, 90), EYE(114, 90), ["circle", 100, 106, 6], ["ellipse", 100, 150, 20, 16]],
  },
  {
    id: "frog", theme: "crew", name: "Žabka", unlock: { races: 6, price: 100 },
    shapes: [BG, ["ellipse", 100, 170, 90, 22], ["ellipse", 100, 120, 64, 46], ["circle", 70, 76, 20], ["circle", 130, 76, 20], ["circle", 70, 76, 10], ["circle", 130, 76, 10], EYE(70, 76, 5), EYE(130, 76, 5),
      ["path", "M74 128 Q100 146 126 128", { line: true }], ["ellipse", 100, 140, 30, 14]],
  },
  {
    id: "dragon", theme: "crew", name: "Dráčik", unlock: { races: 10, price: 150 },
    shapes: [BG, ["rect", 0, 168, 200, 32], ["path", "M60 160 C40 120 60 80 100 80 C150 80 160 130 140 160 Z"], ["poly", "70,90 40,50 86,80"], ["poly", "130,90 160,50 114,80"],
      ["circle", 100, 72, 32], ["poly", "86,42 92,24 100,42"], ["poly", "100,42 108,24 114,42"], EYE(88, 68), EYE(112, 68), ["ellipse", 100, 132, 22, 24], ["path", "M140 150 C175 150 185 130 180 110 L170 124", { line: true }]],
  },
  // ---------- space ----------
  {
    id: "rocket", theme: "space", name: "Raketa", unlock: null,
    shapes: [BG, ["path", "M100 20 C130 50 136 90 132 140 L68 140 C64 90 70 50 100 20 Z"], ["circle", 100, 80, 16], ["poly", "68,110 40,150 68,140"], ["poly", "132,110 160,150 132,140"],
      ["poly", "80,140 120,140 100,185"], ["poly", "88,140 112,140 100,170"], ["circle", 30, 40, 6], ["circle", 170, 60, 8], ["circle", 160, 170, 5]],
  },
  {
    id: "planet", theme: "space", name: "Planéta", unlock: { races: 2, price: 60 },
    shapes: [BG, ["ellipse", 100, 104, 90, 22], ["circle", 100, 100, 50], ["path", "M52 92 C80 100 120 100 148 92 L150 104 C120 112 80 112 50 104 Z"], ["circle", 80, 80, 8], ["circle", 120, 118, 6],
      ["path", "M10 104 C10 90 55 84 60 86 L56 96 C30 98 22 102 24 106 Z"], ["circle", 30, 30, 10], ["circle", 170, 170, 7]],
  },
  {
    id: "ufo", theme: "space", name: "Ufo", unlock: { races: 5, price: 100 },
    shapes: [BG, ["poly", "70,120 130,120 170,190 30,190"], ["ellipse", 100, 110, 80, 24], ["path", "M60 100 C60 60 140 60 140 100 Z"], ["circle", 100, 80, 12], EYE(96, 78, 2), EYE(104, 78, 2),
      ["circle", 50, 112, 7], ["circle", 100, 120, 7], ["circle", 150, 112, 7], ["circle", 30, 30, 6]],
  },
  {
    id: "moon", theme: "space", name: "Mesiac", unlock: { races: 9, price: 150 },
    shapes: [BG, ["path", "M120 30 C70 40 60 120 110 160 C70 170 30 130 34 90 C38 50 80 24 120 30 Z"], ["circle", 70, 80, 8], ["circle", 58, 120, 6], ["poly", "150,40 156,56 172,58 160,68 164,84 150,76 136,84 140,68 128,58 144,56"],
      ["poly", "160,120 164,130 174,131 166,138 169,148 160,142 151,148 154,138 146,131 156,130"], ["circle", 130, 180, 6]],
  },
  // ---------- fairy tales ----------
  {
    id: "castle", theme: "fairy", name: "Hrad", unlock: null,
    shapes: [BG, ["rect", 0, 170, 200, 30], ["rect", 40, 90, 120, 80], ["rect", 20, 70, 36, 100], ["rect", 144, 70, 36, 100], ["poly", "16,70 38,30 60,70"], ["poly", "140,70 162,30 184,70"],
      ["path", "M84 170 L84 136 C84 124 116 124 116 136 L116 170 Z"], ["rect", 60, 110, 16, 20, 4], ["rect", 124, 110, 16, 20, 4], ["poly", "38,30 38,12 54,20 38,26"]],
  },
  {
    id: "mushroom", theme: "fairy", name: "Hríbový domček", unlock: { races: 3, price: 60 },
    shapes: [BG, ["rect", 0, 170, 200, 30], ["path", "M70 110 L70 170 L130 170 L130 110 Z"], ["path", "M20 116 C20 50 180 50 180 116 Z"], ["circle", 60, 86, 12], ["circle", 104, 72, 14], ["circle", 146, 92, 10],
      ["path", "M90 170 L90 142 C90 132 110 132 110 142 L110 170 Z"], ["circle", 116, 132, 7]],
  },
  {
    id: "crown", theme: "fairy", name: "Koruna", unlock: { races: 6, price: 100 },
    shapes: [BG, ["poly", "30,150 20,60 65,100 100,40 135,100 180,60 170,150"], ["rect", 30, 140, 140, 24, 4], ["circle", 100, 110, 12], ["circle", 60, 124, 8], ["circle", 140, 124, 8],
      ["circle", 20, 60, 8], ["circle", 100, 40, 8], ["circle", 180, 60, 8]],
  },
  {
    id: "rainbow", theme: "fairy", name: "Dúha", unlock: { races: 10, price: 150 },
    shapes: [BG, ["path", "M10 150 A90 90 0 0 1 190 150 L170 150 A70 70 0 0 0 30 150 Z"], ["path", "M30 150 A70 70 0 0 1 170 150 L150 150 A50 50 0 0 0 50 150 Z"], ["path", "M50 150 A50 50 0 0 1 150 150 L130 150 A30 30 0 0 0 70 150 Z"],
      ["ellipse", 30, 156, 30, 18], ["ellipse", 170, 156, 30, 18], ["circle", 160, 36, 18]],
  },
  // ---------- city ----------
  {
    id: "house", theme: "city", name: "Domček", unlock: null,
    shapes: [BG, ["rect", 0, 165, 200, 35], ["rect", 44, 90, 112, 76], ["poly", "30,94 100,36 170,94"], ["rect", 88, 120, 26, 46, 3], ["rect", 56, 104, 24, 24, 3], ["rect", 124, 104, 24, 24, 3],
      ["rect", 128, 46, 16, 30], ["circle", 30, 30, 16]],
  },
  {
    id: "towers", theme: "city", name: "Mrakodrapy", unlock: { races: 2, price: 60 },
    shapes: [BG, ["rect", 0, 175, 200, 25], ["rect", 20, 70, 50, 106], ["rect", 76, 30, 50, 146], ["rect", 132, 90, 50, 86], ["rect", 30, 84, 12, 12], ["rect", 48, 84, 12, 12],
      ["rect", 86, 46, 12, 12], ["rect", 104, 46, 12, 12], ["rect", 86, 70, 12, 12], ["rect", 104, 70, 12, 12], ["rect", 142, 104, 12, 12], ["rect", 160, 104, 12, 12], ["circle", 170, 34, 14]],
  },
  {
    id: "lights", theme: "city", name: "Semafor", unlock: { races: 5, price: 100 },
    shapes: [BG, ["rect", 0, 175, 200, 25], ["rect", 92, 130, 16, 46], ["rect", 66, 20, 68, 116, 14], ["circle", 100, 46, 16], ["circle", 100, 78, 16], ["circle", 100, 110, 16],
      ["rect", 20, 150, 50, 26, 6], ["circle", 32, 178, 7, { k: "#2b2d33" }], ["circle", 58, 178, 7, { k: "#2b2d33" }]],
  },
  {
    id: "wheel", theme: "city", name: "Kolotoč", unlock: { races: 9, price: 150 },
    shapes: [BG, ["rect", 0, 175, 200, 25], ["poly", "100,96 60,176 72,176 100,116 128,176 140,176"], ["circle", 100, 96, 70], ["circle", 100, 96, 56], ["circle", 100, 96, 10],
      ["rect", 90, 14, 20, 16, 4], ["rect", 90, 162, 20, 16, 4], ["rect", 18, 88, 20, 16, 4], ["rect", 162, 88, 20, 16, 4], ["rect", 36, 34, 20, 16, 4], ["rect", 144, 34, 20, 16, 4], ["rect", 36, 142, 20, 16, 4], ["rect", 144, 142, 20, 16, 4]],
  },
];
