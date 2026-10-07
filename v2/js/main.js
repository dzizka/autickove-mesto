// Entry point: load the saved state, build the frame, register screens and games, start the router.

import * as state from "./core/state.js";
import * as events from "./core/events.js";
import * as rng from "./core/rng.js";
import * as audio from "./core/audio.js";
import * as ui from "./core/ui.js";
import * as router from "./core/router.js";
import { loopStats, frameTiming } from "./core/loop.js";
import { exportCode, parseCode } from "./core/save-transfer.js";
import { startPlayClock } from "./systems/progress.js";
import { mountTopbar } from "./screens/topbar.js";
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
import crew from "./screens/crew.js";
import coloring from "./screens/coloring.js";
import gallery from "./screens/gallery.js";
import trophies from "./screens/trophies.js";
import parents from "./screens/parents.js";
import { ensureQuests, questEvent } from "./systems/quests.js";
import { checkTrophies } from "./systems/trophies.js";
import { TROPHIES } from "./data/trophies.js";
import coloringGame from "./games/coloring/index.js";
import { recordFinished, addToGallery } from "./systems/coloring.js";
import { tickEggs, addEgg, rollChestEgg, giveCrewXp } from "./systems/crew.js";
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
router.registerScreen(gallery);
router.registerScreen(trophies);
router.registerScreen(parents);
// The four pillars (DESIGN-v2 §1) plus the garage.
for (const screen of [races, garage, tuning, crew, coloring]) router.registerScreen(screen);
router.registerGame(raceGame);
router.registerGame(coloringGame);
router.registerGame(demoGame);
router.registerGame(demoCrashGame);

// Race results: track progress (medals, unlocks, boss bar), then the chest with parts.
router.addRewardHandler((gameId, result) => {
  if (gameId !== "race" || !result.extra) return null;
  const unlocks = recordRace(result.extra);
  // crew (DESIGN-v2 §6): eggs get closer to hatching, the buddy in the car gains XP
  tickEggs();
  const buddyLevels = giveCrewXp(result.extra.place === 1);
  if (result.extra.boss) recordBoss(result.extra);
  // eggs: a beaten boss always leaves one, the chest sometimes (the first one is sure in race 3)
  let egg = null;
  if (result.extra.bossWin) egg = addEgg(result.extra.boss);
  else if (rollChestEgg(rng)) egg = addEgg("chest");
  const boss = BOSSES.find((b) => b.id === result.extra.boss) || null;
  return { unlocks, loot: grantRaceLoot(result.extra), egg, boss, buddyLevels };
});
// Finished pictures: count them, glitter colours and stickers on schedule, save to the gallery.
router.addRewardHandler((gameId, result) => {
  const c = result.extra?.coloring;
  if (gameId !== "coloring" || !c) return null;
  const { glitter, sticker } = recordFinished(c);
  if (c.thumb) addToGallery({ id: c.id, mode: c.mode, src: c.thumb });
  return { coloringReward: { glitter, sticker, thumb: c.thumb } };
});
router.setRewardPresenter(presentReward);

// Quests (DESIGN-v2 §8): game events move the active quests forward.
events.on("gameFinished", ({ gameId, result }) => {
  const x = result.extra || {};
  if (gameId === "race") {
    questEvent("race");
    if (x.place === 1) questEvent("win");
    if (x.bossWin) questEvent("boss");
    questEvent("collect", x.collected || 0);
  }
  if (gameId === "coloring" && x.coloring) questEvent("paint");
});
events.on("partsDismantled", ({ count }) => questEvent("dismantle", count));
events.on("carChanged", ({ before, after }) => after > before && questEvent("equip"));
events.on("partUpgraded", () => questEvent("upgrade"));
events.on("itemBought", () => questEvent("buy"));
events.on("buddyPetted", () => questEvent("pet"));
events.on("buddyHatched", () => questEvent("hatch"));

// Trophies (DESIGN-v2 §8): checked after rewards and screen changes, announced with a toast.
const announce = [];
events.on("trophyEarned", ({ id }) => announce.push(TROPHIES.find((t) => t.id === id)));
const flushTrophies = () => {
  if (!announce.length || document.body.dataset.mode === "game") return;
  const t = announce.shift();
  audio.sfx.levelUp();
  ui.toast(`Nová trofej: ${t.name}`, { icon: `🏆${t.icon}`, ms: 3200 });
  audio.speak(`Nová trofej! ${t.name}!`, { interrupt: false });
  setTimeout(flushTrophies, 3400);
};
events.on("screenShown", () => {
  checkTrophies();
  ensureQuests(rng);
  flushTrophies();
});
events.on("questClaimed", () => (checkTrophies(), flushTrophies()));
events.on("gameFinished", () => checkTrophies());

// The one allowed global: hooks for automated tests (DESIGN-v2 §2). Set before the router
// starts, so a game opened straight from the URL can register its hooks too.
window.__game = { state, events, rng, audio, ui, router, loopStats, frameTiming, exportCode, parseCode };

startPlayClock();
router.startRouter(document.querySelector("main"));


