// Trophies (DESIGN-v2 §8): checked against the saved state after rewards and on screen changes.

import { getState, update } from "../core/state.js";
import { emit } from "../core/events.js";
import { TROPHIES } from "../data/trophies.js";
import { TRACKS } from "../data/tracks.js";
import { PIXEL_PICTURES } from "../data/coloring/pixel.js";
import { isTrackUnlocked, trackProgress } from "./progress.js";
import { MINIGAMES } from "../data/minigames.js";
import { GARAGE } from "../data/garage.js";
import { levelsOf, carAbilities } from "./stats.js";

// part levels of every upgraded car (garage B, §4.6)
const allCars = (s) => Object.keys(s.cars || {}).map((id) => levelsOf(id, s));
const abilitiesFound = (s) => new Set(allCars(s).flatMap((lv) => [...carAbilities(lv)]));

export function isEarned(t, s = getState()) {
  const c = t.check;
  switch (c.kind) {
    case "wins":
      return s.races.wins >= c.n;
    case "races":
      return s.races.total >= c.n;
    case "allTracks":
      return TRACKS.every((tr) => isTrackUnlocked(tr.id, s));
    case "trackLevel":
      return isTrackUnlocked(c.track, s) && trackProgress(c.track, s).unlocked >= c.n;
    case "bosses":
      return Object.values(s.bosses || {}).filter((n) => n > 0).length >= c.n;
    case "partLevel":
      return allCars(s).some((lv) => Object.values(lv).some((l) => l >= c.n));
    case "abilities":
      return abilitiesFound(s).size >= c.n;
    case "upgradedCars":
      return allCars(s).filter((lv) => Object.values(lv).reduce((a, b) => a + b, 0) >= c.level).length >= c.n;
    case "maxCar":
      return allCars(s).some((lv) => Object.values(lv).every((l) => l >= GARAGE.maxLevel));
    case "buddies":
      return Object.keys(s.crew?.owned || {}).length >= c.n;
    case "evolved":
      return Object.values(s.crew?.owned || {}).some((b) => (b.stage || 0) >= c.stage);
    case "pictures":
      return (s.coloring?.finished || 0) >= c.n;
    case "bigPicture":
      return PIXEL_PICTURES.some((p) => p.size >= 24 && (s.coloring?.done?.[p.id] || 0) > 0);
    case "glitter":
      return (s.coloring?.glitter || []).length >= c.n;
    case "quests":
      return (s.quests?.done || 0) >= c.n;
    case "miniPlayed":
      return MINIGAMES.every((g) => (s.minigames?.[g.id]?.plays || 0) > 0);
    case "miniLevel":
      return Object.values(s.minigames || {}).some((m) => (m.level || 1) >= c.n);
    case "buildings":
      return Object.values(s.city?.buildings || {}).filter((l) => l > 0).length >= c.n;
    case "topBuildings":
      return Object.values(s.city?.buildings || {}).filter((l) => l >= 3).length >= c.n;
    case "albumPages":
      return (s.album?.pagesDone || []).length >= c.n;
    case "goldSticker":
      return Object.values(s.album?.tiers || {}).some((t) => t >= 2);
    case "dailyStreak":
      return (s.daily?.streak || 0) >= c.n;
    case "level":
      return s.level >= c.n;
    default:
      return false;
  }
}

/** Award every trophy whose condition is met. Returns the newly earned ones. */
export function checkTrophies() {
  const s = getState();
  const fresh = TROPHIES.filter((t) => !s.trophies[t.id] && isEarned(t, s));
  if (!fresh.length) return [];
  update((st) => fresh.forEach((t) => (st.trophies[t.id] = Date.now())));
  for (const t of fresh) emit("trophyEarned", { id: t.id });
  return fresh;
}
