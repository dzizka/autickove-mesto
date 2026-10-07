// Colouring book palette and rules (DESIGN-v2 §7). Data only.

/** 16 basic colours. */
export const COLORS = [
  "#ff3b3b", "#ff8c1a", "#ffd23f", "#9be15d",
  "#2fbf4a", "#1e8a5a", "#2ab7ca", "#2f80ed",
  "#2b3a8c", "#8f5bd8", "#ff7eb6", "#a0522d",
  "#f4c89a", "#ffffff", "#9aa0a6", "#2b2d33",
];

/** 4 glitter colours, unlocked by finished pictures (§7.3, §7.4). */
export const GLITTER = [
  { id: "gold", icon: "✨", stops: ["#fff2a8", "#e8b923", "#a87b00"], unlockAt: 2 },
  { id: "silver", icon: "✨", stops: ["#ffffff", "#c9d1dc", "#7d8896"], unlockAt: 5 },
  { id: "rainbow", icon: "🌈", stops: ["#ff3b3b", "#ff8c1a", "#ffd23f", "#2fbf4a", "#2ab7ca", "#8f5bd8"], unlockAt: 9 },
  { id: "galaxy", icon: "🌌", stops: ["#7b5cff", "#3b2f7a", "#140f33"], unlockAt: 14 },
];

export const BRUSH_SIZES = [0.012, 0.025, 0.05]; // stroke width as a share of the picture width

export const COLORING = {
  undoSteps: 20,
  galleryMax: 40,
  thumbSize: 120, // px, gallery pictures are stored small (§7.4)
  thumbQuality: 0.75,
  coins: { free: 20, 10: 15, 16: 30, 24: 60 },
  xp: { free: 10, 10: 8, 16: 15, 24: 30 },
  // a car sticker as a reward after this many finished pictures (§7.4)
  stickerAt: [3, 7, 12, 18, 25],
  minZoom: 1,
  maxZoom: 3,
};

export const THEMES = [
  { id: "cars", name: "Autá", icon: "🚗" },
  { id: "animals", name: "Zvieratá", icon: "🐾" },
  { id: "crew", name: "Kamaráti", icon: "🐣" },
  { id: "space", name: "Vesmír", icon: "🚀" },
  { id: "fairy", name: "Rozprávky", icon: "🏰" },
  { id: "city", name: "Mesto", icon: "🏙️" },
];
