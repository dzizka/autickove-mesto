// Where the demo hand 👆 points on every screen and in every game (DESIGN-v2 §15.2, part 20).
// Rules are tried in order; the first one with a visible element wins. Data only.
//   sel:  the element to tap (CSS selector); {x} places are filled from the game's stage
//         (.mini-stage data-x) or from the found element (data-x)
//   to:   for dragging: where the element goes
//   kind: "tap" (default) | "drag" | "rub" (wipe over it) | "lanes" (tap left, then right)
//   when: { key: value } that must match the stage data (e.g. it is the child's turn)
//   idle: false = only when the screen opens, not again when the child waits
// Any element with data-hint="1" (set by a screen, e.g. the glowing garage part) comes first.

export const HINT_TIMING = {
  firstMs: 1300, // after a screen opens for the first time in this visit
  idleMs: 7000, // the child did nothing for this long
  idleGrowMs: 4000, // every next idle hint waits this much longer …
  idleMaxMs: 20000, // … up to this
};

export const HINTS = {
  modal: [
    { sel: "[data-testid=chest]:not(.open)" },
    { sel: "[data-testid=daily-gift]" },
    { sel: "[data-testid=hatch-ok], [data-testid=pack-ok]" },
    { sel: ".chest-after.show [data-testid=reward-garage].pulse" },
    { sel: "[data-testid=reward-again]" },
    { sel: "[data-testid=level-1].recommended, .diff-btn.recommended" },
  ],
  home: [{ sel: ".quest.done" }, { sel: "[data-testid=home-races]" }],
  races: [{ sel: "[data-testid=boss-start].ready, [data-testid=boss-start].pulse" }, { sel: "[data-testid=race-start]" }],
  garage: [{ sel: ".part-btn.hint" }],
  tuning: [{ sel: "[data-testid=tune-grid] .tile:not(.on):not(.locked)" }, { sel: "[data-testid=tune-grid] .tile.locked" }],
  crew: [{ sel: "[data-testid^=egg-].ready, [data-testid^=egg-][data-ready=true]" }, { sel: ".crew-tile:not(.shadow):not(.active)" }, { sel: "[data-testid=pet]" }],
  coloring: [{ sel: ".pic-tile:not(.locked)" }],
  games: [{ sel: ".game-tile:not(.locked)" }],
  album: [{ sel: "[data-testid=buy-pack]:not([disabled])" }],
  trophies: [{ sel: "[data-testid=trophy-grid] button" }],
  city: [{ sel: "[data-testid=town-pad] button" }, { sel: "[data-testid=city-lots] button" }],
  "game-buddy": [{ sel: "[data-testid=bplay-canvas]", kind: "lanes", idle: false }],
  "game-race": [{ sel: "[data-testid=race-canvas]", kind: "lanes", idle: false }],
  "game-pexeso": [{ sel: ".pex-card:not(.up):not(.done)" }],
  "game-wash": [{ sel: ".wash-car", kind: "rub" }],
  "game-repair": [{ sel: '.rep-tool[data-tool="{need}"]:not([disabled])' }],
  "game-park": [{ sel: ".park-queue .park-car", to: '.park-spot[data-key="{key}"]', kind: "drag" }],
  "game-puzzle": [{ sel: ".pz-tray .pz-piece", to: '.pz-cell[data-i="{i}"]', kind: "drag" }],
  "game-count": [{ sel: ".count-item:not(.counted)" }],
  "game-maze": [{ sel: ".maze-pad button" }],
  "game-letters": [{ sel: '.let-opt[data-word="{answer}"], .let-opt[data-letter="{answer}"]' }],
  "game-music": [{ sel: '.mus-car[data-i="{next}"]', when: { turn: "child" } }],
  "game-traffic": [{ sel: "[data-testid=traffic-canvas]" }],
  "game-coloring": [{ sel: ".bn-swatch:not(.done)" }, { sel: "[data-testid=free-stage]" }],
};
