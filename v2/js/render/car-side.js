// Car seen from the side, as inline SVG, with every appearance layer (DESIGN-v2 §5):
// kind, colour (also gold, rainbow, galaxy), pattern, wheels, wing, sticker, roof item,
// neon and an optional trail. Every lookup falls back to a safe default.

import { resolveLook } from "../systems/tuning.js";
import { sideCarEl } from "./car-pics.js";

const SVG_NS = "http://www.w3.org/2000/svg";
let uid = 0;

/** Darken/lighten a #rrggbb colour; returns a fallback on bad data. */
export function shade(hex, amount) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return "#ff5a5f";
  const n = parseInt(m[1], 16);
  const ch = (shift) => Math.max(0, Math.min(255, ((n >> shift) & 255) + Math.round(255 * amount)));
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
}

export function luminance(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return 0.5;
  const n = parseInt(m[1], 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

const isHex = (v) => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);

/** Body paint: a fill value plus <defs> for gradients. */
function paint(color, id) {
  if (color.special === "rainbow") {
    const stops = ["#ff5a5f", "#ff8c42", "#ffd23f", "#3ebd4a", "#2ab7ca", "#8f5bd8"].map((c, i) => `<stop offset="${i * 20}%" stop-color="${c}"/>`).join("");
    return { fill: `url(#${id}-paint)`, outline: "#7a2d6e", base: "#ff8c42", defs: `<linearGradient id="${id}-paint" x1="0" x2="1">${stops}</linearGradient>` };
  }
  if (color.special === "galaxy") {
    return { fill: `url(#${id}-paint)`, outline: "#120e2e", base: "#3b2f7a", defs: `<radialGradient id="${id}-paint" cx=".4" cy=".4" r=".8"><stop offset="0" stop-color="#7b5cff"/><stop offset=".5" stop-color="#3b2f7a"/><stop offset="1" stop-color="#140f33"/></radialGradient>` };
  }
  if (color.special === "gold") {
    return { fill: `url(#${id}-paint)`, outline: "#8a6a00", base: "#e8b923", defs: `<linearGradient id="${id}-paint" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2a8"/><stop offset=".45" stop-color="#e8b923"/><stop offset="1" stop-color="#a87b00"/></linearGradient>` };
  }
  const base = isHex(color.value) ? color.value : "#ff5a5f";
  return { fill: base, outline: shade(base, -0.2), base, defs: "" };
}

function patternShapes(pattern, base, special) {
  const ink = luminance(base) > 0.62 ? "rgba(0,0,0,.22)" : "rgba(255,255,255,.55)";
  const out = [];
  if (special === "galaxy") for (let i = 0; i < 18; i++) out.push(`<circle cx="${(i * 53) % 230 + 6}" cy="${(i * 37) % 70 + 16}" r="${1 + (i % 3) * 0.6}" fill="#fff" opacity=".9"/>`);
  switch (pattern.id) {
    case "stripes":
      out.push(`<rect x="0" y="62" width="240" height="5" fill="${ink}"/><rect x="0" y="71" width="240" height="5" fill="${ink}"/>`);
      break;
    case "dots":
      for (let x = 10; x < 240; x += 20) for (let y = 30 + ((x / 20) % 2) * 9; y < 92; y += 18) out.push(`<circle cx="${x}" cy="${y}" r="4" fill="${ink}"/>`);
      break;
    case "flames":
      out.push(`<path d="M236 60 C200 60 186 52 170 58 C182 62 172 66 150 64 C166 70 156 74 128 72 C150 78 190 82 236 84 Z" fill="#ff8c1a" opacity=".9"/><path d="M236 66 C210 66 196 62 184 66 C196 70 180 74 168 74 C190 78 214 80 236 80 Z" fill="#ffe14d"/>`);
      break;
    case "checker":
      for (let x = 0; x < 240; x += 10) out.push(`<rect x="${x}" y="${(x / 10) % 2 ? 62 : 72}" width="10" height="10" fill="${ink}"/>`);
      break;
    case "stars":
      for (let i = 0; i < 9; i++) out.push(`<text x="${18 + i * 25}" y="${i % 2 ? 66 : 80}" font-size="14" fill="${ink}">★</text>`);
      break;
    case "zigzag":
      out.push(`<polyline points="${Array.from({ length: 25 }, (_, i) => `${i * 10},${i % 2 ? 62 : 74}`).join(" ")}" fill="none" stroke="${ink}" stroke-width="5"/>`);
      break;
    case "hearts":
      for (let i = 0; i < 9; i++) out.push(`<text x="${14 + i * 25}" y="${i % 2 ? 68 : 82}" font-size="14" fill="${luminance(base) > 0.62 ? "#ff4f8b" : "#ffd1e3"}">♥</text>`);
      break;
    case "camo":
      ["#4b5a2a", "#7a6a3a", "#2f3a1c"].forEach((c, k) => {
        for (let i = 0; i < 6; i++) out.push(`<ellipse cx="${(i * 47 + k * 17) % 236}" cy="${40 + ((i * 23 + k * 19) % 45)}" rx="${12 + k * 3}" ry="${7 + k * 2}" fill="${c}" opacity=".75"/>`);
      });
      break;
    default:
      break;
  }
  return out.join("");
}

function wheel(cx, cy, r, w) {
  const rr = r * 0.55;
  let rim = `<circle r="${rr}" fill="${w.rim}"/>`;
  if (w.style === "spokes") rim += Array.from({ length: 5 }, (_, i) => `<path d="M0 0 L${Math.cos((i * 72 * Math.PI) / 180) * rr} ${Math.sin((i * 72 * Math.PI) / 180) * rr}" stroke="#555b66" stroke-width="2.5"/>`).join("");
  else if (w.style === "star") rim += `<text y="${rr * 0.55}" font-size="${rr * 1.6}" text-anchor="middle" fill="#ff8c1a">★</text>`;
  else if (w.style === "ring") rim = `<circle r="${rr}" fill="#1b1d22" stroke="${w.rim}" stroke-width="3.5" class="neon-rim"/>`;
  else rim += `<path d="M0 -${rr}V${rr}M-${rr} 0H${rr}" stroke="#8a8f98" stroke-width="2"/>`;
  const tread = w.big ? Array.from({ length: 12 }, (_, i) => `<rect x="-2" y="${-r - 2}" width="4" height="5" fill="#2b2d33" transform="rotate(${i * 30})"/>`).join("") : "";
  return `<g class="wheel" transform="translate(${cx} ${cy})"><circle r="${r}" fill="#2b2d33"/>${tread}${rim}<circle r="3" fill="#6d727c"/></g>`;
}

function wingSvg(w, [x, y], outline) {
  if (!w.size) return "";
  const s = w.size;
  const c = w.color || "#2b2d33";
  if (w.feather) return `<path d="M${x + 10} ${y} C${x - 18} ${y - 26 * s} ${x - 30} ${y - 8} ${x - 14} ${y - 4} C${x - 26} ${y - 2} ${x - 20} ${y + 6} ${x + 4} ${y + 2} Z" fill="#fff" stroke="#c9d1dc" stroke-width="2"/>`;
  const blade = (dy) => `<rect x="${x - 14 * s}" y="${y - 12 * s - dy}" width="${30 * s}" height="${5 * s}" rx="2" fill="${c}" stroke="${outline}" stroke-width="1.5"/>`;
  return `<rect x="${x - 2}" y="${y - 12 * s}" width="4" height="${12 * s}" fill="${c}"/>${blade(0)}${w.double ? blade(9 * s) : ""}`;
}

function extraSvg(kind, side) {
  const [rx, ry] = side.roof;
  switch (kind.extra) {
    case "sign":
      return `<rect x="${rx - 16}" y="${ry + 2}" width="32" height="10" rx="3" fill="#ffd23f" stroke="#a87b00" stroke-width="2"/><path d="M${rx - 12} ${ry + 5}h4v4h-4zM${rx - 4} ${ry + 5}h4v4h-4zM${rx + 4} ${ry + 5}h4v4h-4z" fill="#2b2d33"/>`;
    case "lightbar":
      return `<rect x="${rx - 18}" y="${ry + 3}" width="18" height="8" rx="3" fill="#ff3b3b" class="blink-a"/><rect x="${rx}" y="${ry + 3}" width="18" height="8" rx="3" fill="#3b7bff" class="blink-b"/>`;
    case "ladder":
      return `<g stroke="#c9d1dc" stroke-width="3"><path d="M20 26 H150 M20 31 H150"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${26 + i * 15} 26 V31"/>`).join("")}</g>`;
    case "cockpit":
      return `<circle cx="130" cy="52" r="11" fill="#ffffff" stroke="#2b2d33" stroke-width="2"/><path d="M122 50 h16 v5 h-16z" fill="#2b2d33"/><path d="M200 70 l30 2 l0 6 l-32 -2z" fill="#2b2d33"/>`;
    case "fins":
      return `<path d="M30 54 L10 26 L48 50 Z" fill="#ff5a5f" stroke="#7a2020" stroke-width="2"/><path d="M28 86 L6 104 L46 88 Z" fill="#ff5a5f" stroke="#7a2020" stroke-width="2"/><path d="M8 66 C-8 70 -8 76 8 80 Z" fill="#ffb02e" class="flicker"/>`;
    default:
      return "";
  }
}

function neonSvg(neon, side, id) {
  if (!neon.value) return "";
  const cls = neon.special === "rainbow" ? "neon-rainbow" : neon.special === "fire" ? "neon-fire" : "";
  const y = side.wheelY + side.wheelR * 0.4;
  return `<defs><filter id="${id}-blur" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="5"/></filter></defs><ellipse class="neon ${cls}" cx="122" cy="${y}" rx="104" ry="9" fill="${neon.value}" filter="url(#${id}-blur)" opacity=".95"/>`;
}

function trailSvg(trail) {
  if (!trail.style) return "";
  if (trail.style === "rainbow") {
    return `<g class="trail-rainbow">${["#ff5a5f", "#ffd23f", "#3ebd4a", "#2ab7ca", "#8f5bd8"].map((c, i) => `<rect x="-70" y="${62 + i * 5}" width="72" height="5" fill="${c}"/>`).join("")}</g>`;
  }
  const icon = trail.style === "puff" ? "●" : trail.style === "bubble" ? "○" : trail.icon;
  const color = trail.color || "#fff";
  return Array.from({ length: 3 }, (_, i) => `<text class="trail-puff" style="animation-delay:${i * 0.35}s" x="${-6 - i * 18}" y="${86 - i * 4}" font-size="${18 - i * 2}" fill="${color}">${icon}</text>`).join("");
}

/**
 * Returns an <svg> element.
 * look: { car, color, pattern, … } item ids (missing → defaults), or { colorHex } for rival cars.
 * opts: { passenger, trail = false (show the trail behind the car) }
 */
export function carSide(look = {}, { passenger = null, trail = false } = {}) {
  const r = resolveLook(look);
  const id = `cs${++uid}`;
  const kind = r.car;
  const side = kind.side;
  const colorHex = isHex(look.colorHex) ? look.colorHex : isHex(look.color) ? look.color : null;
  const p = paint(colorHex ? { value: colorHex } : r.color, id);
  const wheels = r.wheels;
  const wr = side.wheelR * (wheels.big ? 1.25 : 1);
  const [sx, sy] = side.sticker;
  const [rx, ry] = side.roof;
  const roofY = kind.extra === "sign" || kind.extra === "lightbar" ? ry : ry + 2;

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", trail ? "-80 0 320 124" : "0 0 240 124");
  svg.setAttribute("class", "car-side");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Tvoje auto");
  for (const c of ["car", "color", "pattern", "wheels", "wing", "sticker", "roof", "neon", "trail"]) svg.dataset[c] = r[c].id;
  if (passenger) svg.dataset.passenger = passenger;
  svg.innerHTML = `
    <defs>${p.defs}<clipPath id="${id}-clip"><path d="${side.body}"/></clipPath></defs>
    <ellipse cx="122" cy="114" rx="106" ry="7" fill="rgba(0,0,0,.18)"/>
    ${neonSvg(r.neon, side, id)}
    ${trail ? trailSvg(r.trail) : ""}
    ${kind.extra === "fins" ? extraSvg(kind, side) : ""}
    <path d="${side.body}" fill="${p.fill}" stroke="${p.outline}" stroke-width="3" stroke-linejoin="round"/>
    <g clip-path="url(#${id}-clip)">
      <path d="M0 64 H240" stroke="rgba(255,255,255,.35)" stroke-width="5"/>
      ${patternShapes(r.pattern, p.base, r.color.special)}
    </g>
    ${side.windows.map((w) => `<path d="${w}" fill="#bfe9ff" stroke="${p.outline}" stroke-width="2.5"/>`).join("")}
    ${kind.extra !== "fins" ? extraSvg(kind, side) : ""}
    ${passenger ? `<text class="passenger" x="${side.windows.length ? side.wheels[side.wheels.length - 1] - 22 : 130}" y="${side.windows.length ? side.wheelY - 43 : 60}" font-size="${side.windows.length ? 20 : 22}" text-anchor="middle">${passenger}</text>` : ""}
    ${wingSvg(r.wing, side.wing, p.outline)}
    <circle cx="${side.front[0]}" cy="${side.front[1]}" r="4" fill="#fff6b0" stroke="${p.outline}" stroke-width="1.5"/>
    <rect x="${side.back[0]}" y="${side.back[1] - 4}" width="7" height="8" rx="2" fill="#ff6060"/>
    ${r.sticker.icon ? `<text x="${sx}" y="${sy}" font-size="18" text-anchor="middle" class="sticker">${r.sticker.icon}</text>` : ""}
    ${r.roof.icon ? `<text x="${rx}" y="${roofY}" font-size="24" text-anchor="middle" class="roof-item">${r.roof.icon}</text>` : ""}
    ${side.wheels.map((x) => wheel(x, side.wheelY, wr, wheels)).join("")}
  `;
  return svg;
}

/**
 * The car from the side for the page: the 2D drawing at once, the picture of the 3D car
 * (part 15b) as soon as it is ready. Same options as carSide; el.picReady, el.geometry.
 */
export function carSidePic(look = {}, opts = {}) {
  return sideCarEl(carSide(look, opts), look, opts);
}
