/* ---------- drawn cars ---------- */
const tuneOf = (e) => S.tune[e] || {};
const SPECIAL = { rainbow: "#ff6fb5", galaxy: "#3b1f73" };
const RAINBOW = ["#ff4d4d", "#ff8c1a", "#ffd23f", "#2ec27e", "#3a86ff", "#9b5de5"];
const carColor = (def, tu) => {
  const c = tu && tu.col && tu.col !== "def" ? tu.col : def.c;
  return SPECIAL[c] || c;
};
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16,
    g = (n >> 8) & 255,
    b = n & 255;
  const t = f < 0 ? 0 : 255,
    p = Math.abs(f);
  r = Math.round((t - r) * p + r);
  g = Math.round((t - g) * p + g);
  b = Math.round((t - b) * p + b);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
const SIDE = {
  car: {
    b: "M14 62 Q10 62 10 54 L12 46 Q14 39 24 38 L46 36 L60 21 Q63 18 68 18 L104 18 Q110 18 114 23 L126 37 L142 40 Q150 42 150 50 L150 58 Q150 62 145 62 Z",
    w: ["M65 23 L57 36 L84 36 L84 23 Z", "M89 23 L89 36 L120 37 L110 23 Z"],
    wh: [
      [40, 64, 12],
      [122, 64, 12],
    ],
    sp: [18, 38],
    dc: [86, 50],
    hl: [146, 46],
    roof: [64, 110, 18],
  },
  suv: {
    b: "M10 62 L10 41 Q10 34 18 34 L40 33 L50 14 Q52 11 57 11 L118 11 Q124 11 126 17 L132 33 L144 34 Q150 35 150 42 L150 62 Z",
    w: ["M57 16 L49 31 L86 31 L86 16 Z", "M91 16 L91 31 L127 31 L121 16 Z"],
    wh: [
      [38, 64, 14],
      [122, 64, 14],
    ],
    sp: [14, 34],
    dc: [86, 46],
    hl: [146, 40],
    roof: [56, 118, 11],
  },
  pickup: {
    b: "M10 62 L10 38 L72 38 L72 15 Q72 11 77 11 L112 11 Q117 11 120 16 L128 34 L144 36 Q150 37 150 44 L150 62 Z",
    w: ["M78 16 L78 33 L124 34 L116 16 Z"],
    wh: [
      [36, 64, 14],
      [122, 64, 14],
    ],
    sp: [14, 38],
    dc: [100, 48],
    hl: [146, 42],
    roof: [76, 112, 11],
  },
  van: {
    b: "M10 62 L10 16 Q10 10 16 10 L110 10 Q117 10 121 16 L134 36 L146 38 Q150 39 150 46 L150 62 Z",
    w: ["M108 16 L108 34 L130 36 L120 16 Z", "M20 17 L52 17 L52 32 L20 32 Z"],
    wh: [
      [34, 64, 12],
      [124, 64, 12],
    ],
    sp: [14, 10],
    dc: [76, 42],
    hl: [146, 44],
    roof: [16, 110, 10],
  },
  bus: {
    b: "M8 62 L8 14 Q8 8 14 8 L144 8 Q152 8 152 16 L152 62 Z",
    w: [
      "M14 14 h22 v18 h-22 Z",
      "M40 14 h22 v18 h-22 Z",
      "M66 14 h22 v18 h-22 Z",
      "M92 14 h22 v18 h-22 Z",
      "M120 14 h26 v24 h-26 Z",
    ],
    wh: [
      [32, 64, 12],
      [126, 64, 12],
    ],
    sp: [12, 8],
    dc: [64, 46],
    hl: [148, 50],
    roof: [14, 144, 8],
  },
  truck: {
    b: "M6 58 L6 12 L98 12 L98 58 Z M102 62 L102 20 Q102 16 106 16 L132 16 Q138 16 140 22 L148 38 Q152 40 152 46 L152 62 Z",
    w: ["M110 21 L110 36 L144 38 L136 21 Z"],
    wh: [
      [22, 64, 11],
      [50, 64, 11],
      [126, 64, 11],
    ],
    sp: [8, 12],
    dc: [52, 36],
    hl: [148, 48],
    roof: [106, 132, 16],
  },
  tractor: {
    b: "M28 60 L28 12 L76 12 L80 40 L146 42 Q150 42 150 48 L150 60 Z",
    w: ["M34 18 L34 38 L74 38 L71 18 Z"],
    wh: [
      [46, 60, 22],
      [128, 68, 12],
    ],
    sp: [30, 12],
    dc: [112, 52],
    hl: [146, 47],
    roof: [28, 76, 12],
    extra: '<rect x="116" y="24" width="6" height="18" rx="2" fill="#4a4f5c"/>',
  },
  formula: {
    b: "M8 60 L12 50 L40 48 L62 40 L90 38 L102 46 L148 52 Q153 54 151 60 Z",
    w: [],
    wh: [
      [34, 62, 14],
      [124, 62, 14],
    ],
    sp: [10, 48],
    dc: [118, 54],
    hl: [148, 56],
    roof: [70, 90, 38],
    extra:
      '<circle cx="80" cy="34" r="8" fill="#ffd23f" stroke="#15314d" stroke-width="2"/><rect x="79" y="31" width="9" height="4" rx="1" fill="#15314d"/>',
  },
  rocket: {
    b: "M30 50 Q30 32 66 30 L118 30 Q146 32 156 46 Q146 60 118 62 L66 62 Q30 60 30 50 Z",
    w: ["M104 46 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0"],
    wh: [],
    sp: [30, 34],
    dc: [78, 46],
    hl: [154, 46],
    roof: [66, 118, 30],
    back: '<path d="M46 33 L30 14 L62 31 Z M46 59 L30 78 L62 61 Z" fill="#ff5a4a" stroke="#15314d" stroke-width="2.5" stroke-linejoin="round"/><path d="M32 42 L8 46 L32 54 Z" fill="#ffc533"><animate attributeName="d" values="M32 42 L8 46 L32 54 Z;M32 42 L14 46 L32 54 Z;M32 42 L8 46 L32 54 Z" dur=".3s" repeatCount="indefinite"/></path>',
  },
};
let svgN = 0;
const starPath = (cx, cy, R, r) => {
  let p = "";
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5,
      q = i % 2 ? r : R;
    p += (i ? "L" : "M") + (cx + Math.cos(a) * q).toFixed(1) + " " + (cy + Math.sin(a) * q).toFixed(1);
  }
  return p + "Z";
};
function wheelSide(cx, cy, r, wh) {
  const R = wh === "big" ? r * 1.22 : r;
  let s = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#2b2f3a"/><circle cx="${cx}" cy="${cy}" r="${R - 1.5}" fill="none" stroke="#454b59" stroke-width="1.5"/>`;
  if (wh === "big")
    s += `<circle cx="${cx}" cy="${cy}" r="${R - 2.5}" fill="none" stroke="#5a6070" stroke-width="3" stroke-dasharray="3 3"/>`;
  const spin = (inner, dur = "1s") =>
    `<g>${inner}<animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="${dur}" repeatCount="indefinite"/></g>`;
  if (wh === "star") s += `<path d="${starPath(cx, cy, R * 0.62, R * 0.28)}" fill="#ffd23f"/>`;
  else if (wh === "gold")
    s += `<circle cx="${cx}" cy="${cy}" r="${R * 0.62}" fill="#ffc533" stroke="#d99a00" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="${R * 0.2}" fill="#d99a00"/>`;
  else if (wh === "sport") {
    s += `<circle cx="${cx}" cy="${cy}" r="${R * 0.6}" fill="#e3e8ef"/>`;
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      s += `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(a) * R * 0.58).toFixed(1)}" y2="${(cy + Math.sin(a) * R * 0.58).toFixed(1)}" stroke="#5a6070" stroke-width="2.5"/>`;
    }
  } else if (wh === "flower") {
    s += `<circle cx="${cx}" cy="${cy}" r="${R * 0.62}" fill="#fff"/>`;
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      s += `<circle cx="${(cx + Math.cos(a) * R * 0.32).toFixed(1)}" cy="${(cy + Math.sin(a) * R * 0.32).toFixed(1)}" r="${(R * 0.22).toFixed(1)}" fill="#ff6fb5"/>`;
    }
    s += `<circle cx="${cx}" cy="${cy}" r="${R * 0.16}" fill="#ffd23f"/>`;
  } else if (wh === "fire") {
    s +=
      `<circle cx="${cx}" cy="${cy}" r="${R * 0.6}" fill="#ff8c1a"/>` +
      spin(
        Array.from({ length: 4 }, (_, i) => {
          const a = (i * Math.PI) / 2;
          return `<path d="M${cx} ${cy} Q${(cx + Math.cos(a + 0.6) * R * 0.5).toFixed(1)} ${(cy + Math.sin(a + 0.6) * R * 0.5).toFixed(1)} ${(cx + Math.cos(a) * R * 0.6).toFixed(1)} ${(cy + Math.sin(a) * R * 0.6).toFixed(1)} Z" fill="#ffd23f" stroke="#ffd23f" stroke-width="2"/>`;
        }).join(""),
        ".6s",
      ) +
      `<circle cx="${cx}" cy="${cy}" r="${R * 0.16}" fill="#ff4d4d"/>`;
  } else if (wh === "neon") {
    s += `<circle cx="${cx}" cy="${cy}" r="${R - 2}" fill="none" stroke="#39ff88" stroke-width="2.5"><animate attributeName="opacity" values="1;.4;1" dur="1s" repeatCount="indefinite"/></circle><circle cx="${cx}" cy="${cy}" r="${R * 0.45}" fill="#1d1f27" stroke="#39ff88" stroke-width="2"/>`;
  } else
    s += `<circle cx="${cx}" cy="${cy}" r="${R * 0.42}" fill="#cfd6e0"/><circle cx="${cx - R * 0.12}" cy="${cy - R * 0.12}" r="${R * 0.12}" fill="#fff" opacity=".7"/>`;
  return s;
}
const CAMO = [
  [20, 20, 16, 8, "#3d5a2a"],
  [60, 40, 20, 9, "#6b4f2a"],
  [100, 26, 18, 8, "#2f4a22"],
  [140, 46, 16, 8, "#6b4f2a"],
  [40, 56, 18, 7, "#2f4a22"],
  [120, 60, 22, 8, "#3d5a2a"],
  [80, 12, 14, 6, "#6b4f2a"],
];
function patternSVG(pt, dy) {
  if (pt === "dots") {
    let s = "";
    for (let y = 4; y < 80; y += 11)
      for (let x = y % 22 ? 6 : 0; x < 160; x += 12)
        s += `<circle cx="${x}" cy="${y}" r="2.6" fill="#fff" opacity=".55"/>`;
    return s;
  }
  if (pt === "checker") {
    let s = "";
    for (let y = 0; y < 80; y += 8)
      for (let x = 0; x < 160; x += 8)
        if (((x + y) / 8) % 2)
          s += `<rect x="${x}" y="${y}" width="8" height="8" fill="#15314d" opacity=".22"/>`;
    return s;
  }
  if (pt === "zebra")
    return Array.from(
      { length: 10 },
      (_, i) =>
        `<path d="M${8 + i * 16} 0 q7 18 -2 36 q-6 16 4 34" stroke="#15314d" stroke-width="4.5" fill="none" opacity=".55" stroke-linecap="round"/>`,
    ).join("");
  if (pt === "camo")
    return CAMO.map(
      ([x, y, rx, ry, c]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" opacity=".75"/>`,
    ).join("");
  if (pt === "flames")
    return `<path d="M160 ${dy + 18} L56 ${dy + 18} Q78 ${dy + 6} 70 ${dy - 6} Q90 ${dy + 4} 94 ${dy - 12} Q106 ${dy + 2} 116 ${dy - 14} Q122 ${dy + 2} 134 ${dy - 10} Q138 ${dy + 6} 160 ${dy} Z" fill="#ff8c1a"/><path d="M160 ${dy + 18} L82 ${dy + 18} Q96 ${dy + 8} 92 ${dy} Q106 ${dy + 8} 112 ${dy - 4} Q120 ${dy + 8} 130 ${dy - 2} Q134 ${dy + 10} 160 ${dy + 8} Z" fill="#ffd23f"/>`;
  if (pt === "stars")
    return [
      [20, 30],
      [52, 50],
      [84, 24],
      [110, 52],
      [138, 34],
      [34, 62],
      [96, 40],
    ]
      .map(([x, y], i) => `<path d="${starPath(x, y, i % 2 ? 5 : 4, 2)}" fill="#fff" opacity=".8"/>`)
      .join("");
  return "";
}
function roofSVG(rf, rm, ry) {
  if (rf === "box")
    return `<rect x="${rm - 20}" y="${ry - 3}" width="40" height="3" fill="#4a4f5c"/><rect x="${rm - 17}" y="${ry - 12}" width="34" height="9" rx="4" fill="#2a2d36" stroke="#15314d" stroke-width="1.5"/><rect x="${rm - 14}" y="${ry - 10}" width="12" height="2" rx="1" fill="#fff" opacity=".3"/>`;
  if (rf === "siren")
    return `<rect x="${rm - 4}" y="${ry - 3}" width="8" height="3" fill="#4a4f5c"/><path d="M${rm - 6} ${ry - 2} a6 6 0 0 1 12 0 Z" fill="#ff4d4d" stroke="#15314d" stroke-width="1.2"><animate attributeName="fill" values="#ff4d4d;#3a86ff;#ff4d4d" dur=".6s" repeatCount="indefinite"/></path>`;
  if (rf === "surf")
    return `<rect x="${rm - 14}" y="${ry - 3}" width="28" height="3" fill="#4a4f5c"/><ellipse cx="${rm}" cy="${ry - 6}" rx="36" ry="4" fill="#20c9b8" stroke="#15314d" stroke-width="1.5"/><rect x="${rm - 30}" y="${ry - 7}" width="60" height="1.6" fill="#fff" opacity=".8"/>`;
  if (rf === "prop")
    return `<line x1="${rm}" y1="${ry}" x2="${rm}" y2="${ry - 10}" stroke="#4a4f5c" stroke-width="2"/><circle cx="${rm}" cy="${ry - 11}" r="2" fill="#15314d"/><g transform="translate(${rm} ${ry - 11})"><g><ellipse cx="-8" cy="0" rx="8" ry="2.4" fill="#ffd23f" stroke="#15314d" stroke-width="1"/><ellipse cx="8" cy="0" rx="8" ry="2.4" fill="#ff4d4d" stroke="#15314d" stroke-width="1"/><animateTransform attributeName="transform" type="scale" values="1 1;.15 1;-1 1;.15 1;1 1" dur=".4s" repeatCount="indefinite"/></g></g>`;
  if (rf === "duck")
    return `<text x="${rm}" y="${ry - 2}" font-size="15" text-anchor="middle" font-family='${EMO}'>🦆</text>`;
  return "";
}
function carSide(def, tu = {}) {
  const P = SIDE[def.k],
    col = carColor(def, tu),
    id = "cs" + ++svgN,
    [sx, sy] = P.sp,
    [dx, dy] = P.dc,
    [r0, r1, ry] = P.roof,
    rm = (r0 + r1) / 2;
  const body =
    tu.col === "rainbow"
      ? `<linearGradient id="${id}b" x1="0" x2="1">${RAINBOW.map((c, i) => `<stop offset="${i / 5}" stop-color="${c}"/>`).join("")}</linearGradient>`
      : tu.col === "galaxy"
        ? `<radialGradient id="${id}b" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#8a6bff"/><stop offset=".55" stop-color="#2a1660"/><stop offset="1" stop-color="#120a33"/></radialGradient>`
        : `<linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(col, 0.32)}"/><stop offset=".5" stop-color="${col}"/><stop offset="1" stop-color="${shade(col, -0.2)}"/></linearGradient>`;
  const gl = tu.gl && tu.gl !== "none" ? tu.gl : null;
  const glow = gl
    ? gl === "rainbow"
      ? `<linearGradient id="${id}g" x1="0" x2="1">${RAINBOW.map((c, i) => `<stop offset="${i / 5}" stop-color="${c}"/>`).join("")}</linearGradient>`
      : `<radialGradient id="${id}g"><stop offset="0" stop-color="${gl}" stop-opacity=".95"/><stop offset="1" stop-color="${gl}" stop-opacity="0"/></radialGradient>`
    : "";
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90" class="carsvg" aria-hidden="true"><defs><clipPath id="${id}"><path d="${P.b}"/></clipPath>${body}${glow}<linearGradient id="${id}w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4fbff"/><stop offset=".45" stop-color="#bfe5fb"/><stop offset="1" stop-color="#86c3ec"/></linearGradient></defs>`;
  s += gl
    ? `<ellipse cx="82" cy="80" rx="74" ry="${gl === "rainbow" ? 5 : 9}" fill="url(#${id}g)" opacity="${gl === "rainbow" ? 0.8 : 1}"><animate attributeName="opacity" values="1;.5;1" dur="1.6s" repeatCount="indefinite"/></ellipse>`
    : `<ellipse cx="82" cy="80" rx="70" ry="5" fill="rgba(21,49,77,.18)"/>`;
  if (tu.sp === "small")
    s += `<rect x="${sx + 4}" y="${sy - 9}" width="4" height="10" fill="#4a4f5c"/><rect x="${sx - 4}" y="${sy - 13}" width="20" height="5" rx="2" fill="${shade(col, -0.3)}" stroke="#15314d" stroke-width="2"/>`;
  if (tu.sp === "big")
    s += `<rect x="${sx + 3}" y="${sy - 16}" width="4" height="17" fill="#4a4f5c"/><rect x="${sx + 13}" y="${sy - 16}" width="4" height="17" fill="#4a4f5c"/><rect x="${sx - 8}" y="${sy - 21}" width="30" height="7" rx="3" fill="${shade(col, -0.3)}" stroke="#15314d" stroke-width="2"/>`;
  if (tu.sp === "jet")
    s += `<path d="M${sx - 2} ${sy + 4} L${sx - 24} ${sy + 9} L${sx - 2} ${sy + 14} Z" fill="#ffc533"><animate attributeName="opacity" values="1;.5;1" dur=".25s" repeatCount="indefinite"/></path><rect x="${sx - 6}" y="${sy + 2}" width="12" height="14" rx="3" fill="#7d8594" stroke="#15314d" stroke-width="2"/>`;
  if (tu.sp === "wings")
    s += `<path d="M${sx + 8} ${sy + 2} q-22 -26 -34 -10 q8 2 5 8 q-8 1 -6 7 q16 2 35 -5 Z" fill="#fff" stroke="#15314d" stroke-width="1.6" stroke-linejoin="round"><animateTransform attributeName="transform" type="rotate" values="0 ${sx + 8} ${sy + 2};-14 ${sx + 8} ${sy + 2};0 ${sx + 8} ${sy + 2}" dur="1.2s" repeatCount="indefinite"/></path>`;
  s += P.back || "";
  s += `<path d="${P.b}" fill="url(#${id}b)" stroke="#15314d" stroke-width="3" stroke-linejoin="round"/><g clip-path="url(#${id})">`;
  if (tu.col === "galaxy")
    s += [
      [20, 20],
      [44, 44],
      [70, 18],
      [96, 50],
      [120, 28],
      [140, 54],
      [30, 58],
      [84, 36],
    ]
      .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 1 : 1.6}" fill="#fff"/>`)
      .join("");
  s += patternSVG(tu.pt, dy);
  if (tu.st === "stripes")
    s += `<rect x="0" y="${dy - 4}" width="160" height="5" fill="#fff" opacity=".9"/><rect x="0" y="${dy + 4}" width="160" height="3" fill="#fff" opacity=".9"/>`;
  if (def.x === "police") s += `<rect x="0" y="${dy - 3}" width="160" height="7" fill="#1f62d1"/>`;
  if (def.x === "amb") s += `<rect x="0" y="${dy + 6}" width="160" height="5" fill="#ff4d4d"/>`;
  if (def.x === "fire") s += `<rect x="0" y="${dy + 8}" width="160" height="4" fill="#fff"/>`;
  if (def.x === "taxi")
    s += `<g fill="#1d1f27">${Array.from({ length: 16 }, (_, i) => `<rect x="${i * 10 + (i % 2 ? 5 : 0)}" y="${dy + 4}" width="5" height="5"/>`).join("")}</g>`;
  s += `<rect x="0" y="${dy - 11}" width="160" height="2.5" fill="#fff" opacity=".35"/><rect x="0" y="${dy + 16}" width="160" height="30" fill="#000" opacity=".08"/></g>`;
  s += P.w
    .map(
      (w) => `<path d="${w}" fill="url(#${id}w)" stroke="#15314d" stroke-width="2" stroke-linejoin="round"/>`,
    )
    .join("");
  if (def.x === "taxi")
    s += `<rect x="${rm - 12}" y="${ry - 9}" width="24" height="9" rx="2" fill="#ffd23f" stroke="#15314d" stroke-width="2"/><text x="${rm}" y="${ry - 2.5}" font-size="6" font-weight="800" text-anchor="middle" fill="#15314d" font-family="sans-serif">TAXI</text>`;
  if (def.x === "police" || def.x === "amb")
    s += `<rect x="${rm - 12}" y="${ry - 7}" width="12" height="7" rx="2" fill="#ff4d4d" stroke="#15314d" stroke-width="1.5"/><rect x="${rm}" y="${ry - 7}" width="12" height="7" rx="2" fill="#3a86ff" stroke="#15314d" stroke-width="1.5"/>`;
  if (def.x === "amb")
    s += `<path d="M${dx - 4} ${dy - 12} h8 v8 h8 v8 h-8 v8 h-8 v-8 h-8 v-8 h8 Z" fill="#ff4d4d"/>`;
  if (def.x === "fire")
    s += `<g stroke="#cfd6e0" stroke-width="2.5"><line x1="16" y1="5" x2="104" y2="5"/><line x1="16" y1="1" x2="104" y2="1"/>${Array.from({ length: 9 }, (_, i) => `<line x1="${20 + i * 10}" y1="1" x2="${20 + i * 10}" y2="5"/>`).join("")}</g>`;
  if (!def.x || def.x === "fire") s += roofSVG(tu.rf, rm, ry);
  else s += roofSVG(tu.rf, rm - (tu.rf === "surf" || tu.rf === "box" ? 0 : 22), ry);
  if (STK_E[tu.st])
    s += `<text x="${dx}" y="${dy + 7}" font-size="17" text-anchor="middle" font-family='${EMO}'>${STK_E[tu.st]}</text>`;
  if (tu.st === "num")
    s += `<circle cx="${dx}" cy="${dy + 1}" r="9" fill="#fff" stroke="#15314d" stroke-width="2"/><text x="${dx}" y="${dy + 6.5}" font-size="14" font-weight="800" text-anchor="middle" fill="#15314d" font-family="sans-serif">7</text>`;
  s += `<ellipse cx="${P.hl[0]}" cy="${P.hl[1]}" rx="4" ry="3.5" fill="#fff6b0" stroke="#15314d" stroke-width="1.5"/>`;
  s += P.wh.map(([x, y, r]) => wheelSide(x, y, r, tu.wh)).join("");
  s += (P.extra || "") + "</svg>";
  return s;
}
function rr(x, a, b, w, h, r) {
  x.beginPath();
  x.moveTo(a + r, b);
  x.arcTo(a + w, b, a + w, b + h, r);
  x.arcTo(a + w, b + h, a, b + h, r);
  x.arcTo(a, b + h, a, b, r);
  x.arcTo(a, b, a + w, b, r);
  x.closePath();
}
const LENF = {
  car: 1.9,
  suv: 1.95,
  pickup: 2,
  van: 2.1,
  bus: 2.9,
  truck: 3,
  tractor: 1.6,
  formula: 2.1,
  rocket: 2.3,
};
const carLen = (def, w) => w * LENF[def.k];
