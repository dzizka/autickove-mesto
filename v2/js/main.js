// Entry point: load the saved state, build the frame, register screens and games, start the router.

import * as state from "./core/state.js";
import * as events from "./core/events.js";
import * as rng from "./core/rng.js";
import * as audio from "./core/audio.js";
import * as ui from "./core/ui.js";
import * as router from "./core/router.js";
import { loopStats } from "./core/loop.js";
import { exportCode, parseCode } from "./core/save-transfer.js";
import { startPlayClock } from "./systems/progress.js";
import { PILLARS } from "./data/menu.js";
import { mountTopbar } from "./screens/topbar.js";
import { makeSoonScreen } from "./screens/soon.js";
import home from "./screens/home.js";
import settings from "./screens/settings.js";
import races from "./screens/races.js";
import garage from "./screens/garage.js";
import tuning from "./screens/tuning.js";
import { presentReward } from "./screens/chest.js";
import { grantRaceLoot } from "./systems/garage.js";
import raceGame from "./games/race/index.js";
import { recordRace, recordBoss } from "./systems/progress.js";
import { BOSSES } from "./data/bosses.js";
import { demoGame, demoCrashGame } from "./games/demo/index.js";

state.load();
audio.initVoice();

// Audio may only start after a user gesture.
window.addEventListener("pointerdown", audio.unlock, { once: true, capture: true });
window.addEventListener("keydown", audio.unlock, { once: true, capture: true });

// Never lose progress when the tab is closed or hidden.
window.addEventListener("pagehide", state.saveNow);
document.addEventListener("visibilitychange", () => document.hidden && state.saveNow());

mountTopbar(document.querySelector("[data-topbar]"), document.querySelector("[data-nav]"));

router.registerScreen(home);
router.registerScreen(settings);
// Pillars that are built get their real screen; the rest say "being built".
const built = { races, garage, tuning };
for (const p of PILLARS) router.registerScreen(built[p.id] || makeSoonScreen(p));
router.registerGame(raceGame);
router.registerGame(demoGame);
router.registerGame(demoCrashGame);

// Race results: track progress (medals, unlocks, boss bar), then the chest with parts.
router.addRewardHandler((gameId, result) => {
  if (gameId !== "race" || !result.extra) return null;
  const unlocks = recordRace(result.extra);
  let egg = null;
  if (result.extra.boss) {
    recordBoss(result.extra);
    // a beaten boss also leaves an egg with a crew buddy (hatches in part 5)
    if (result.extra.bossWin) {
      egg = { id: `egg${Date.now().toString(36)}`, from: result.extra.boss, races: 0, at: Date.now() };
      state.update((s) => s.eggs.push(egg));
    }
  }
  const boss = BOSSES.find((b) => b.id === result.extra.boss) || null;
  return { unlocks, loot: grantRaceLoot(result.extra), egg, boss };
});
router.setRewardPresenter(presentReward);

startPlayClock();
router.startRouter(document.querySelector("main"));

// The one allowed global: hooks for automated tests (DESIGN-v2 §2).
window.__game = { state, events, rng, audio, ui, router, loopStats, exportCode, parseCode };
