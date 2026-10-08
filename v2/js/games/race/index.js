// Race game module (DESIGN-v2 §4.1): pseudo-3D view from behind, the car drives by itself,
// taps left/right change lanes. Ends on the podium and hands the result to the host.

import { h } from "../../core/ui.js";
import { RACE } from "../../data/tracks.js";
import { carStats, raceEffects, getTrack, carAbilities, setLook } from "../../systems/stats.js";
import { isLevelUnlocked, previewUnlocks, isBossReady, rivalEase } from "../../systems/progress.js";
import { LEGENDARIES } from "../../data/legendaries.js";
import { BOSSES } from "../../data/bosses.js";
import { getLook, resolveLook } from "../../systems/tuning.js";
import { crewBonus, activeBuddy, buddyLook } from "../../systems/crew.js";
import { createTrail } from "../../render/effects.js";
import { createRace, step, steer, finalOrder } from "./physics.js";
import { M, PLAYER_Z, SEG, buildRoad, makeView, renderRoad, createBackdrop, drawBackdrop, fogDensity, segIndex } from "./road.js";
import { drawScene, drawPlayer, drawHeadlights, drawSpeedLines, laneOffset, rivalKind, trafficKind, BOSS_KIND } from "./scene.js";
import { carPic, propPic, readyPic } from "../../render/car-pics.js";
import { PROPS } from "../../render/road-sprites.js";
import { createWeather, drawWeather } from "./weather.js";
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
  const bossWin = !!race.boss && place === 1;
  return {
    coins: race.player.coins + Math.round(RACE.placeCoins[place - 1] * bonus) + (bossWin ? 80 : 0),
    xp: RACE.xpBase + RACE.xpPerLevel * race.level + (place === 1 ? 10 : 0) + (bossWin ? 30 : 0),
    extra: { track: race.track.id, level: race.level, place, boss: race.boss?.id || null, bossWin, collected: race.player.coins },
  };
}

const BOSS_SAY = ["Hurá! Porazil si bossa!", "Boss bol tentoraz rýchlejší. Skús to znova!"];

let cleanup = [];
export const PIC_WAIT_MS = 1500;

export default {
  id: "race",
  title: "Preteky",
  icon: "🏁",
  unlockLevel: 1,

  start(view, ctx) {
    const track = getTrack(ctx.params[0]);
    let level = Math.max(1, Math.min(RACE.levels, parseInt(ctx.params[1], 10) || 1));
    if (!isLevelUnlocked(track.id, level)) level = 1;

    const boss = ctx.params[2] === "boss" && isBossReady(track.id) ? BOSSES.find((b) => b.track === track.id) : null;

    const canvas = h("canvas", { class: "race-canvas", "data-testid": "race-canvas" });
    const wrap = h("section", { class: `screen game race theme-${track.id}${boss ? " boss" : ""}`, "data-testid": "screen-game-race", "data-track": track.id, "data-level": String(level), "data-boss": boss?.id || "" }, canvas);
    view.append(wrap);
    const g = canvas.getContext("2d");

    const abilities = carAbilities();
    const race = createRace({ track, level, effects: raceEffects(carStats(), abilities, crewBonus()), rng: ctx.rng, short: !!ctx.state().cheats.shortRaces, abilities, boss, ease: rivalEase(track.id, level) });
    const hud = createHud(wrap, race, { onExit: ctx.exit });
    // The car looks exactly like in the showroom (plus the look of a complete set):
    // kind, paint, wheels, roof… and neon and trail.
    const look = { ...getLook(), ...setLook() };
    const looks = resolveLook(look);
    const buddy = buddyLook(activeBuddy());
    const fx = { look, neon: looks.neon, trail: createTrail(looks.trail), sparkle: abilities.size > 0, popups: [], buddy };
    // pictures of the 3D cars and props are made during the countdown (2D until they are ready)
    const others = [...race.rivals.map((r) => ({ colorHex: r.color, car: r.isBoss ? BOSS_KIND : rivalKind(r.color) })), ...(track.traffic || []).map((c) => ({ colorHex: c, car: trafficKind(track, c) }))];
    for (const l of [look, ...others]) carPic(l, "back");
    // the countdown waits (at most PIC_WAIT_MS) for the picture of the child's own 3D car,
    // so the car does not change from the 2D drawing to 3D in front of the child
    const ownPic = carPic(look, "back");
    const waitUntil = performance.now() + PIC_WAIT_MS;
    for (const id of track.obstacles || []) if (PROPS[id]) propPic(PROPS[id].path);
    race.look = look;
    race.buddy = buddy; // test hook: the buddy rides along

    // boss music: a short bass loop while the boss race runs
    let musicTimer = null;
    const startMusic = () => {
      if (!boss || musicTimer) return;
      const bar = boss.music.reduce((t, [, d]) => t + d + 0.02, 0);
      const play = () => ctx.audio.playNotes(boss.music.map(([f, d]) => [f, d, "triangle"]));
      play();
      musicTimer = setInterval(play, bar * 1000);
    };
    const stopMusic = () => {
      clearInterval(musicTimer);
      musicTimer = null;
    };
    const flash = (cls, ...children) => {
      const el = h("div", { class: cls, "aria-hidden": "true" }, ...children);
      wrap.append(el);
      setTimeout(() => el.remove(), 3200);
    };
    if (boss) flash("race-boss-banner", h("span", { class: "boss-face" }, boss.icon), "👑");

    const road = buildRoad(track, race.length);
    let V = makeView(360, 640);
    let backdrop = null;
    let weather = null;
    let frame = 0;
    let skyX = 0;
    let camX = 0;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = wrap.clientWidth || 360;
      const hh = wrap.clientHeight || 640;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(hh * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      V = makeView(w, hh);
      backdrop = createBackdrop(track, V, dpr);
      weather = createWeather(track, V);
      fx.dpr = dpr;
    };
    resize();

    const onPointer = (e) => {
      const r = canvas.getBoundingClientRect();
      steer(race, e.clientX - r.left < r.width / 2 ? -1 : 1);
    };
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (e.key === "ArrowLeft" || k === "a") steer(race, -1);
      if (e.key === "ArrowRight" || k === "d") steer(race, 1);
    };
    canvas.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", resize);
    cleanup = [
      () => canvas.removeEventListener("pointerdown", onPointer),
      () => window.removeEventListener("keydown", onKey),
      () => window.removeEventListener("resize", resize),
      () => hud.remove(),
      stopMusic,
    ];

    const { sfx, tone } = ctx.audio;
    const said = new Set();
    const sayOnce = (key, text) => {
      if (said.has(key)) return;
      said.add(key);
      ctx.speak(text, { interrupt: false });
    };
    let lastCoinSound = 0;
    let lastDt = 1 / 60;
    let finishing = false;

    function handleEvents() {
      for (const ev of race.events) {
        if (ev.type === "count") tone(440, 0.18, { type: "square", volume: 0.12 });
        else if (ev.type === "go") {
          tone(880, 0.35, { type: "square", volume: 0.14 });
          ctx.speak("Štart!");
          startMusic();
        } else if (ev.type === "ability") {
          const def = LEGENDARIES.find((l) => l.id === ev.id);
          if (def) {
            ctx.audio.playNotes(def.notes);
            fx.popups.push({ icon: def.icon, t: 0 });
            flash("race-ability", def.icon);
            sayOnce(`ab-${def.id}`, def.say);
          }
        } else if (ev.type === "bossThrow") {
          tone(500, 0.3, { type: "sine", to: 200, volume: 0.1 });
          sayOnce("bossThrow", "Pozor! Boss hádže. Uhni sa z červeného terča.");
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
      stopMusic();
      ctx.audio.playNotes(looks.horn.notes);
      setTimeout(() => wrap.isConnected && sfx.win(), 500); // not on another screen
      ctx.speak(boss ? BOSS_SAY[race.place === 1 ? 0 : 1] : PLACE_SAY[race.place - 1]);
      await new Promise((r) => setTimeout(r, 900));
      if (!wrap.isConnected) return;
      await showPodium(wrap, finalOrder(race), { place: race.place, unlocks, look, buddy });
      if (unlocks.level) ctx.speak("Odomkol si ďalšiu úroveň!", { interrupt: false });
      else if (unlocks.track) ctx.speak("Odomkol si novú trať!", { interrupt: false });
      ctx.finish(result);
    }

    const loop = ctx.createLoop({
      update(dt) {
        lastDt = dt;
        // Tests may speed time up; the simulation always uses small steps.
        const scale = Math.max(1, Math.min(20, Number(window.__game?.testTimeScale) || 1));
        if (ownPic && !ownPic.failed && !readyPic(ownPic) && race.phase === "countdown" && scale === 1 && performance.now() < waitUntil) {
          hud.update(); // the first red light stays on a moment longer
          return;
        }
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
        const p = race.player;
        frame++;
        road.frame = frame;
        // the camera follows the car most of the way across the lanes
        camX += (laneOffset(road, p.x) * 0.8 - camX) * Math.min(1, lastDt * 8);
        const camZ = p.d * M - PLAYER_Z;
        // the sky drifts against the curve under the car
        const curve = road.segs[segIndex(road, p.d * M)].curve;
        skyX += (0.0015 * curve * p.speed * race.view * M * lastDt) / SEG;
        const fog = fogDensity(track, race.effects.lightRange);
        drawBackdrop(g, V, backdrop, skyX);
        const r = renderRoad(g, V, road, { z: camZ, x: camX, frame, fog });
        drawScene(g, V, road, race, { base: r.base, camZ, fog, time });
        if (track.scene.night) drawHeadlights(g, V, V.w / 2, race.effects.lightRange);
        drawPlayer(g, V, road, race, fx, camX, time, lastDt);
        drawSpeedLines(g, V, race, time);
        drawWeather(g, V, weather, lastDt, p.speed);
      },
      partial: () => ({ coins: race.player.coins, xp: 5 }),
    });
    loop.start();
    ctx.speak(boss ? `${boss.name}! Predbehni ho a vyhýbaj sa tomu, čo hádže!` : `${track.name}. Ťukaj vľavo a vpravo a vyhýbaj sa prekážkam!`);
    window.__game && (window.__game.race = race); // test hook
  },

  stop() {
    cleanup.forEach((fn) => fn());
    cleanup = [];
    if (window.__game) window.__game.race = null;
  },
};
