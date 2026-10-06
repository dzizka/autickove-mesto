// Car seen from the side, as inline SVG. Part 0: body colour and an optional
// passenger emoji in the window. Car kinds and tuning layers arrive in part 3.

const SVG_NS = "http://www.w3.org/2000/svg";

const DEFAULTS = {
  color: "#ff5a5f",
  windowColor: "#bfe9ff",
  rim: "#d9dde3",
  passenger: null, // emoji shown in the rear window (crew buddy, part 5)
};

/** Darken/lighten a #rrggbb colour; returns the input on bad data. */
export function shade(hex, amount) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return hex || DEFAULTS.color;
  const n = parseInt(m[1], 16);
  const ch = (shift) => Math.max(0, Math.min(255, ((n >> shift) & 255) + Math.round(255 * amount)));
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
}

function wheel(cx, rim) {
  return `
    <g class="wheel" transform="translate(${cx} 92)">
      <circle r="19" fill="#2b2d33"/>
      <circle r="10" fill="${rim}"/>
      <circle r="3.5" fill="#8a8f98"/>
      <path d="M0-10V10M-10 0H10" stroke="#8a8f98" stroke-width="2"/>
    </g>`;
}

/** Returns an <svg> element. Options: see DEFAULTS. */
export function carSide(options = {}) {
  const o = { ...DEFAULTS, ...options };
  const dark = shade(o.color, -0.18);
  const light = shade(o.color, 0.18);
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 240 124");
  svg.setAttribute("class", "car-side");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Tvoje auto");
  svg.innerHTML = `
    <ellipse cx="120" cy="114" rx="104" ry="7" fill="rgba(0,0,0,.18)"/>
    <path d="M14 86 C10 66 22 58 44 56 L70 54 L92 26 C96 21 102 18 110 18 L160 18 C170 18 176 22 182 30 L200 54
             C222 56 232 64 230 86 Z" fill="${o.color}" stroke="${dark}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M24 64 C60 58 180 58 222 64" stroke="${light}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>
    <path d="M80 54 L98 30 C100 27 103 26 107 26 L132 26 L132 54 Z" fill="${o.windowColor}" stroke="${dark}" stroke-width="2.5"/>
    <path d="M140 26 L160 26 C166 26 170 29 173 33 L188 54 L140 54 Z" fill="${o.windowColor}" stroke="${dark}" stroke-width="2.5"/>
    <path d="M86 50 L100 32" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>
    ${o.passenger ? `<text x="162" y="49" font-size="22" text-anchor="middle">${o.passenger}</text>` : ""}
    <rect x="128" y="62" width="14" height="4" rx="2" fill="${dark}"/>
    <path d="M222 66 L230 68 L230 76 L220 74 Z" fill="#fff6b0" stroke="${dark}" stroke-width="2"/>
    <path d="M14 70 L22 70 L22 78 L13 78 Z" fill="#ff8080" stroke="${dark}" stroke-width="2"/>
    <rect x="10" y="84" width="222" height="8" rx="4" fill="${dark}"/>
    ${wheel(62, o.rim)}
    ${wheel(184, o.rim)}
  `;
  return svg;
}
