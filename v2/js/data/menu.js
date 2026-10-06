// Main menu: the four pillars of the game (DESIGN-v2 §1, §8).
// `part` = the build step (DESIGN-v2 §9) that brings the real screen; until then it shows "being built".

export const PILLARS = [
  { id: "races", icon: "🏁", label: "Preteky", say: "Preteky", color: "tomato", part: 1 },
  { id: "garage", icon: "🔧", label: "Garáž", say: "Garáž", color: "sky", part: 2 },
  { id: "tuning", icon: "🎨", label: "Vzhľad", say: "Vzhľad auta", color: "plum", part: 3 },
  { id: "crew", icon: "🐣", label: "Kamaráti", say: "Kamaráti", color: "grass", part: 5 },
  { id: "coloring", icon: "🖍️", label: "Omaľovánka", say: "Omaľovánka", color: "sun", part: 6 },
];
