// Race game module (DESIGN-v2 §4.1): top-down, the car drives by itself,
// taps left/right change lanes. Ends on the podium and hands the result to the host.

import { h } from "../../core/ui.js";
import { RACE } from "../../data/tracks.js";
import { carStats, raceEffects, getTrack } from "../../systems/stats.js";
import { isLevelUnlocked, previewUnlocks } from "../../systems/progress.js";
import { createRace, step, steer, finalOrder } from "./physics.js";
import { makeLayout, drawBackground, createWeather, drawWeather } from "./track.js";
import { drawObjects, drawPlayer, drawSpeedLines, createNight, drawNight } from "./draw.js";
import { createHud, showPodium } from "./hud.js";

const PLACE_SAY = [
  "Prvé miesto! Si víťaz!",
  "Druhé miesto! Super jazda!",
  "Tretie miesto! Výborne!",
  "Si v cieli! Nabudúce to bude ešte lepšie!",
];

/** Reward for a finished race (the host credits it). */
export function raceReward(race) {
  const place = race.place || 4;
  const bonus = (1 + 0.25 * (race.level - 1)) * race.track.coinBonus;
  return {
    coins: race.player.coins + Math.round(RACE.placeCoins[place - 1] * bonus),
    xp: RACE.xpBase + RACE.xpPerLevel * race.level + (place === 1 ? 10 : 0),
    extra: { track: race.track.id, level: race.level, place },
  };
}

let cleanup = [];

export default {
  id: "race",
  title: "Preteky",
  icon: "🏁",
  unlockLevel: 1,

  start(view, ctx) {
    const track = getTrack(ctx.params[0]);
    let level = Math.max(1, Math.min(RACE.levels, parseInt(ctx.params[1], 10) || 1));
    if (!isLevelUnlocked(track.id, level)) level = 1;

    const canvas = h("canvas", { class: "race-canvas", "data-testid": "race-canvas" });
    const wrap = h("section", { class: `screen game race theme-${track.id}`, "data-testid": "screen-game-race", "data-track": track.id, "data-level": String(level) }, canvas);
    view.append(wrap);
    const g = canvas.getContext("2d");

    const race = createRace({ track, level, effects: raceEffects(carStats()), rng: ctx.rng, short: !!ctx.state().cheats.shortRaces });
    const hud = createHud(wrap, race, { onExit: ctx.exit });

    let L = makeLayout(360, 640);
    let weather = null;
    let night = null;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = wrap.clientWidth || 360;
      const hh = wrap.clientHeight || 640;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(hh * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      L = makeLayout(w, hh);
      weather = createWeather(track, L);
      night = track.dark ? createNight(L) : null;
    };
    resize();

    const onPointer = (e) => {
      const r = canvas.getBoundingClientRect();
      steer(race, e.clientX - r.left < r.width / 2 ? -1 : 1);
    };
    const onKey = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a") steer(race, -1);
      if (e.key === "ArrowRight" || e.key === "d") steer(race, 1);
    };
    canvas.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", resize);
    cleanup = [
      () => canvas.removeEventListener("pointerdown", onPointer),
      () => window.removeEventListener("keydown", onKey),
      () => window.removeEventListener("resize", resize),
      () => hud.remove(),
    ];

    const { sfx, tone } = ctx.audio;
    const said = new Set();
    const sayOnce = (key, text) => {
      if (said.has(key)) return;
      said.add(key);
      ctx.speak(text, { interrupt: false });
    };
    let lastCoinSound = 0;
    let finishing = false;

    function handleEvents() {
      for (const ev of race.events) {
        if (ev.type === "count") tone(440, 0.18, { type: "square", volume: 0.12 });
        else if (ev.type === "go") {
          tone(880, 0.35, { type: "square", volume: 0.14 });
          ctx.speak("Štart!");
        } else if (ev.type === "coin" && race.time - lastCoinSound > 0.06) {
          lastCoinSound = race.time;
          sfx.coin();
        } else if (ev.type === "hit") {
          sfx.oops();
          sayOnce("hit", "Bum! Vyhýbaj sa prekážkam.");
        } else if (ev.type === "shield") {
          tone(1200, 0.2, { type: "sine", to: 600, volume: 0.15 });
          sayOnce("shield", "Štít ťa ochránil!");
        } else if (ev.type === "smash") tone(200, 0.2, { type: "sawtooth", volume: 0.1 });
        else if (ev.type === "powerup") {
          sfx.open();
          if (ev.id === "turbo") sayOnce("turbo", "Turbo!");
          if (ev.id === "magnet") sayOnce("magnet", "Magnet priťahuje mince!");
        } else if (ev.type === "jump") tone(300, 0.4, { type: "triangle", to: 700, volume: 0.12 });
        else if (ev.type === "fuel") tone(500, 0.25, { type: "sine", to: 900, volume: 0.12 });
        else if (ev.type === "fuelSpawn") sayOnce("fuel", "Dochádza benzín. Zober kanister!");
        else if (ev.type === "overtake") {
          tone(600, 0.15, { type: "triangle", to: 1200, volume: 0.1 });
          sayOnce("overtake", "Predbehol si ho!");
        } else if (ev.type === "finish") onFinish();
      }
      race.events.length = 0;
    }

    async function onFinish() {
      if (finishing) return;
      finishing = true;
      const result = raceReward(race);
      const unlocks = previewUnlocks(result.extra);
      sfx.win();
      ctx.speak(PLACE_SAY[race.place - 1]);
      await new Promise((r) => setTimeout(r, 900));
      if (!wrap.isConnected) return;
      await showPodium(wrap, finalOrder(race), { place: race.place, unlocks });
      if (unlocks.level) ctx.speak("Odomkol si ďalšiu úroveň!", { interrupt: false });
      else if (unlocks.track) ctx.speak("Odomkol si novú trať!", { interrupt: false });
      ctx.finish(result);
    }

    const loop = ctx.createLoop({
      update(dt) {
        // Tests may speed time up; the simulation always uses small steps.
        const scale = Math.max(1, Math.min(20, Number(window.__game?.testTimeScale) || 1));
        let left = dt * scale;
        while (left > 1e-6) {
          const d = Math.min(0.05, left);
          step(race, d);
          left -= d;
          handleEvents();
        }
        hud.update();
      },
      draw(time) {
        drawBackground(g, L, track, race.player.d, time);
        drawObjects(g, L, race, time);
        drawPlayer(g, L, race, time);
        drawSpeedLines(g, L, race, time);
        if (night) drawNight(g, L, night, race);
        drawWeather(g, L, weather, 1 / 60, race.player.speed);
      },
      partial: () => ({ coins: race.player.coins, xp: 5 }),
    });
    loop.start();
    ctx.speak(`${track.name}. Ťukaj vľavo a vpravo a vyhýbaj sa prekážkam!`);
    window.__game && (window.__game.race = race); // test hook
  },

  stop() {
    cleanup.forEach((fn) => fn());
    cleanup = [];
    if (window.__game) window.__game.race = null;
  },
};
