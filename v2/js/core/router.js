// Screen switching via the URL hash (#/home, #/settings, #/game/race).
// Screens: { id, title, render(view, params), leave?() }
// Games:   { id, title, icon, unlockLevel, start(view, ctx), stop() } ending with ctx.finish(result)

import { emit } from "./events.js";
import { MINIGAMES } from "../data/minigames.js";
import { createLoop } from "./loop.js";
import { getState } from "./state.js";
import * as rng from "./rng.js";
import * as audio from "./audio.js";
import * as ui from "./ui.js";
import { addCoins } from "../systems/economy.js";
import { addXp, countGamePlayed } from "../systems/progress.js";

const screens = new Map();
const rewardHandlers = [];
let rewardPresenter = (granted, opts) => ui.rewardModal(granted, opts);

/** Extra rewards for finished games (e.g. race loot). fn(gameId, result) → fields merged into the reward. */
export function addRewardHandler(fn) {
  rewardHandlers.push(fn);
}

/** Replace the end-of-game reward dialog (the chest shows parts, then coins). */
export function setRewardPresenter(fn) {
  rewardPresenter = fn;
}
const games = new Map();
let view = null;
let current = null; // { kind: "screen" | "game", id, mod, loops? }

export function registerScreen(screen) {
  screens.set(screen.id, screen);
}

export function registerGame(game) {
  games.set(game.id, game);
}

export function getGames() {
  return [...games.values()];
}

export function isUnlocked(game, s = getState()) {
  return s.level >= (game.unlockLevel || 1);
}

export function currentRoute() {
  return current ? { kind: current.kind, id: current.id } : null;
}

export function go(id) {
  const hash = `#/${id}`;
  if (location.hash === hash) show();
  else location.hash = hash;
}

export function goHome() {
  go("home");
}

export function startGame(id, ...params) {
  go(["game", id, ...params].join("/"));
}

function parseHash() {
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  return parts.length ? parts : ["home"];
}

function leaveCurrent() {
  if (!current) return;
  const { kind, mod } = current;
  try {
    if (kind === "game") {
      current.halt();
    } else {
      mod.leave?.();
    }
  } catch (err) {
    console.error(`[router] leaving ${current.id} failed`, err);
  }
  current = null;
}

const MINI_IDS = new Set(MINIGAMES.map((g) => g.id));

function show() {
  const [first, ...params] = parseHash();
  leaveCurrent();
  audio.stopSpeaking();
  ui.closeModal();
  view.replaceChildren();
  view.scrollTop = 0;
  window.scrollTo(0, 0);

  if (first === "game") {
    const game = games.get(params[0]);
    if (game && isUnlocked(game)) return runGame(game, params.slice(1));
    return goHome();
  }
  const screen = screens.get(first);
  if (!screen) return goHome();
  document.body.dataset.mode = "screen";
  document.body.dataset.screen = screen.id;
  current = { kind: "screen", id: screen.id, mod: screen };
  try {
    screen.render(view, params);
  } catch (err) {
    console.error(`[router] screen ${screen.id} failed`, err);
    if (screen.id !== "home") goHome();
  }
  emit("screenShown", { id: screen.id });
}

function runGame(game, params = []) {
  document.body.dataset.mode = "game";
  document.body.dataset.screen = `game-${game.id}`;
  const entry = { kind: "game", id: game.id, mod: game, loops: [] };
  let halted = false;
  // Stop loops and let the game clean up exactly once (finish, crash or navigation).
  entry.halt = () => {
    if (halted) return;
    halted = true;
    entry.loops.forEach((l) => l.stop());
    try {
      game.stop?.();
    } catch (err) {
      console.error(`[router] game ${game.id} stop failed`, err);
    }
  };
  current = entry;
  let finished = false;
  const isActive = () => current === entry && !finished;

  const ctx = {
    rng,
    audio,
    ui,
    state: getState,
    params, // extra hash parts, e.g. #/game/race/snow/3 → ["snow", "3"]
    speak: audio.speak,
    /** Guarded loop; `partial()` returns the reward earned so far (used after a crash). */
    createLoop({ update, draw, partial } = {}) {
      const loop = createLoop({ update, draw, onCrash: () => ctx.crash(partial?.()) });
      entry.loops.push(loop);
      return loop;
    },
    /** Hand the result to the game host. The game itself never grants rewards. */
    finish(result = {}, { showReward = true } = {}) {
      if (!isActive()) return null;
      finished = true;
      entry.halt();
      const granted = grant(game, result);
      emit("gameFinished", { gameId: game.id, result: granted });
      if (showReward) {
        rewardPresenter(granted, {
          onHome: goHome,
          onAgain: () => show(), // same hash: re-run the game from scratch
          onGames: MINI_IDS.has(game.id) ? () => go("games") : null, // back to the 🎪 games room
        });
      }
      return granted;
    },
    /** Friendly "the car got stuck" dialog; earned coins are still credited. */
    crash(partial = {}) {
      if (!isActive()) return;
      finished = true;
      entry.halt();
      const granted = grant(game, partial || {});
      emit("gameCrashed", { gameId: game.id, result: granted });
      ui.crashModal(granted, { onHome: goHome });
    },
    exit: goHome,
  };

  try {
    game.start(view, ctx);
  } catch (err) {
    console.error(`[router] game ${game.id} failed to start`, err);
    ctx.crash({});
  }
  emit("screenShown", { id: `game-${game.id}` });
}

function grant(game, result) {
  const coins = addCoins(result.coins);
  addXp(result.xp);
  countGamePlayed(game.id);
  const granted = { ...result, coins, xp: Math.max(0, Math.round(result.xp || 0)) };
  for (const fn of rewardHandlers) {
    try {
      Object.assign(granted, fn(game.id, granted) || {});
    } catch (err) {
      console.error("[router] reward handler failed", err);
    }
  }
  return granted;
}

export function startRouter(viewEl) {
  view = viewEl;
  window.addEventListener("hashchange", show);
  show();
}
