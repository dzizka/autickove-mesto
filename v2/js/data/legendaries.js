// Legendary abilities (DESIGN-v2 §4.4): simple, visible, each with its own sound and effect.
// slot: the part a legendary ability comes on. notes: [Hz, seconds, wave] for its sound.
// The logic for each id lives in games/race/abilities.js and systems/stats.js.

export const LEGENDARIES = [
  { id: "ghost", name: "Duch", icon: "👻", slot: "bumper", say: "Duch! Prešiel si cez prekážku.", notes: [[880, 0.15, "sine"], [660, 0.3, "sine"]] },
  { id: "starTurbo", name: "Hviezdne turbo", icon: "🌟", slot: "engine", say: "Hviezdne turbo!", notes: [[784, 0.08, "square"], [1047, 0.08, "square"], [1319, 0.15, "square"]] },
  { id: "coinRain", name: "Mincový dážď", icon: "🌧️", slot: "magnet", say: "Mincový dážď!", notes: [[1319, 0.06, "triangle"], [1175, 0.06, "triangle"], [1319, 0.06, "triangle"], [1568, 0.12, "triangle"]] },
  { id: "springs", name: "Pružiny", icon: "🦘", slot: "tires", say: "Hop! Pružiny ťa preniesli.", notes: [[300, 0.12, "triangle"], [600, 0.12, "triangle"], [900, 0.15, "triangle"]] },
  { id: "iceShield", name: "Ľadový štít", icon: "🧊", slot: "tires", say: "Ľadový štít, nešmýka sa!", notes: [[1568, 0.1, "sine"], [1760, 0.2, "sine"]] },
  { id: "headlight", name: "Svetlomet", icon: "🔦", slot: "bumper", say: "Svetlomet svieti ďaleko!", notes: [[660, 0.25, "sine"]] },
  { id: "superMagnet", name: "Supermagnet", icon: "🧲", slot: "magnet", say: "Supermagnet!", notes: [[220, 0.15, "sawtooth"], [440, 0.2, "sawtooth"]] },
  { id: "endlessTank", name: "Nekonečná nádrž", icon: "♾️", slot: "tank", say: "Nádrž sa nikdy neminie!", notes: [[523, 0.2, "sine"], [784, 0.3, "sine"]] },
  { id: "bubble", name: "Bublina", icon: "🫧", slot: "bumper", say: "Nová bublina!", notes: [[1047, 0.1, "sine"], [1397, 0.12, "sine"]] },
  { id: "rocketStart", name: "Raketový štart", icon: "🚀", slot: "engine", say: "Raketový štart!", notes: [[200, 0.5, "sawtooth"]] },
  { id: "goldCat", name: "Zlatý kocúr", icon: "🐱", slot: "mascot", say: "Zlatý kocúr zdvojnásobí mince!", notes: [[988, 0.08, "square"], [1319, 0.12, "square"]] },
  { id: "jumper", name: "Skokan", icon: "🪂", slot: "tank", say: "Veľký skok!", notes: [[400, 0.15, "triangle"], [800, 0.3, "triangle"]] },
];
