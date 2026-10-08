// Entry point: load the saved state, build the frame, register screens and games, start the router.

import * as state from "./core/state.js";
import * as events from "./core/events.js";
import * as rng from "./core/rng.js";
import * as audio from "./core/audio.js";
import * as i18n from "./core/i18n.js";
import * as ui from "./core/ui.js";
import * as router from "./core/router.js";
import { loopStats, frameTiming } from "./core/loop.js";
import { exportCode, parseCode } from "./core/save-transfer.js";
import { startPlayClock } from "./systems/progress.js";
import { mountTopbar } from "./screens/topbar.js";
import { startBackdrop } from "./screens/backdrop.js";
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
import gamesRoom from "./screens/games.js";
import city from "./screens/city.js";
import album from "./screens/album.js";
import { giveStickers } from "./systems/album.js";
import { ALBUM } from "./data/album.js";
import pexeso from "./games/pexeso/index.js";
import wash from "./games/wash/index.js";
import repair from "./games/repair/index.js";
import park from "./games/park/index.js";
import puzzle from "./games/puzzle/index.js";
import count from "./games/count/index.js";
import maze from "./games/maze/index.js";
import letters from "./games/letters/index.js";
import music from "./games/music/index.js";
import traffic from "./games/traffic/index.js";
import { isMini, recordMini } from "./systems/minigames.js";

state.load();
// the language: chosen in the settings, else the device's (part 19)
i18n.setLang(state.getState().settings.lang || i18n.detectLang());
document.title = i18n.t("Autíčkové mesto 2");
document.querySelector("[data-nav]")?.setAttribute("aria-label", i18n.t("Navigácia"));
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
router.registerScreen(gamesRoom);
router.registerScreen(city);
router.registerScreen(album);
// The four pillars (DESIGN-v2 §1) plus the garage.
for (const screen of [races, garage, tuning, crew, coloring]) router.registerScreen(screen);
router.registerGame(raceGame);
router.registerGame(coloringGame);
router.registerGame(demoGame);
router.registerGame(demoCrashGame);
// 🎪 games room (DESIGN-v2 §12)
for (const game of [pexeso, wash, repair, park, puzzle, count, maze, letters, music, traffic]) router.registerGame(game);

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
// Games room: count the result; good results raise the game's difficulty by itself.
router.addRewardHandler((gameId, result) => {
  const m = result.extra?.mini;
  if (!isMini(gameId) || !m) return null;
  const { levelUp } = recordMini(m);
  // a good result sometimes brings a sticker for the album (§13)
  const chance = ALBUM.miniSticker[m.stars] || 0;
  const sticker = chance && rng.random() < chance ? giveStickers(1, rng).stickers[0] : null;
  return { miniLevelUp: levelUp, sticker };
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
  if (x.mini) questEvent("mini");
});
events.on("partUpgraded", () => questEvent("upgrade"));
events.on("itemBought", () => questEvent("buy"));
events.on("buddyPetted", () => questEvent("pet"));
events.on("buddyHatched", () => questEvent("hatch"));
events.on("buildingBuilt", () => questEvent("build"));
events.on("packOpened", () => questEvent("pack"));

// Trophies (DESIGN-v2 §8): checked after rewards and screen changes, announced with a toast.
const announce = [];
events.on("trophyEarned", ({ id }) => announce.push(TROPHIES.find((t) => t.id === id)));
const flushTrophies = () => {
  if (!announce.length || document.body.dataset.mode === "game") return;
  const t = announce.shift();
  audio.sfx.levelUp();
  ui.toast(i18n.t("Nová trofej: {name}", { name: i18n.t(t.name) }), { icon: `🏆${t.icon}`, ms: 3200 });
  audio.speak(i18n.t("Nová trofej! {name}!", { name: i18n.t(t.name) }), { interrupt: false });
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
startBackdrop(); // the calm moving sky behind the menu screens
router.startRouter(document.querySelector("main"));


