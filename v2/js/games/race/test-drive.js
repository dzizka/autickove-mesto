// 🛣️ Test drive (DESIGN-v2 §14, part 15b): from the showroom the child drives the car with its
// whole look on an empty city road for a short while. No rivals, no obstacles, no rewards;
// tap left or right to change lanes, 📯 honks. Ends by itself or with ✖.

import { h, modal, closeModal } from "../../core/ui.js";
import { createLoop } from "../../core/loop.js";
import { speak, playNotes, sfx } from "../../core/audio.js";
import * as rng from "../../core/rng.js";
import { TRACKS } from "../../data/tracks.js";
import { carStats, raceEffects, setLook } from "../../systems/stats.js";
import { getLook, resolveLook } from "../../systems/tuning.js";
import { activeBuddy, buddyLook } from "../../systems/crew.js";
import { createTrail } from "../../render/effects.js";
import { carPic } from "../../render/car-pics.js";
import { createRace, step, steer } from "./physics.js";
import { M, PLAYER_Z, SEG, buildRoad, makeView, renderRoad, createBackdrop, drawBackdrop, fogDensity, segIndex } from "./road.js";
import { drawScene, drawPlayer, drawSpeedLines, laneOffset } from "./scene.js";

export const TEST_DRIVE_SECONDS = 14;

/** Open the test drive over the current screen (a modal). Returns the modal box. */
export function openTestDrive(look = { ...getLook(), ...setLook() }, { onClose } = {}) {
  const track = TRACKS.find((t) => t.id === "city") || TRACKS[0];
  const looks = resolveLook(look);
  const buddy = buddyLook(activeBuddy());
  const fx = { look, neon: looks.neon, trail: createTrail(looks.trail), sparkle: false, popups: [], buddy };
  carPic(look, "back"); // the 3D car's picture from behind (2D until it is ready)

  const race = createRace({ track, level: 1, effects: raceEffects(carStats()), rng });
  race.objects = [];
  race.rivals = [];
  race.length = 1e6; // no finish line
  race.phase = "racing";
  race.countdown = 0;
  const road = buildRoad(track, 3000); // longer than any car drives in the test time

  const canvas = h("canvas", { class: "drive-canvas", "data-testid": "test-drive-canvas" });
  const g = canvas.getContext("2d");
  const close = h("button", { class: "btn ghost drive-close", "data-testid": "test-drive-close", "aria-label": "Koniec", onclick: () => closeModal() }, "✖");
  const horn = h("button", { class: "btn sun drive-horn", "aria-label": "Trúbiť", onclick: () => playNotes(looks.horn.notes) }, "📯");
  const time = h("div", { class: "drive-time", "aria-hidden": "true" }, h("i"));
  const wrap = h("div", { class: "drive-wrap" }, canvas, time, close, horn);

  let V = makeView(360, 640);
  let backdrop = null;
  let camX = 0;
  let skyX = 0;
  let frame = 0;
  let lastDt = 0;
  let left = TEST_DRIVE_SECONDS;
  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = wrap.clientWidth || 360;
    const hh = wrap.clientHeight || 640;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(hh * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    V = makeView(w, hh);
    backdrop = createBackdrop(track, V, dpr);
    fx.dpr = dpr;
  };

  const loop = createLoop({
    update(dt) {
      lastDt = dt;
      left -= dt;
      step(race, dt);
      race.objects.length = 0;
      race.player.fuel = 1;
      race.events.length = 0;
      time.firstElementChild.style.width = `${Math.max(0, left / TEST_DRIVE_SECONDS) * 100}%`;
      if (left <= 0) closeModal();
    },
    draw(t) {
      const p = race.player;
      frame++;
      road.frame = frame;
      camX += (laneOffset(road, p.x) * 0.8 - camX) * Math.min(1, lastDt * 8);
      const camZ = p.d * M - PLAYER_Z;
      const curve = road.segs[segIndex(road, p.d * M)].curve;
      skyX += (0.0015 * curve * p.speed * race.view * M * lastDt) / SEG;
      drawBackdrop(g, V, backdrop, skyX);
      const r = renderRoad(g, V, road, { z: camZ, x: camX, frame, fog: fogDensity(track) });
      drawScene(g, V, road, race, { base: r.base, camZ, fog: fogDensity(track), time: t });
      drawPlayer(g, V, road, race, fx, camX, t, lastDt);
      drawSpeedLines(g, V, race, t);
    },
  });

  const onPointer = (e) => {
    if (e.target !== canvas) return;
    const b = canvas.getBoundingClientRect();
    steer(race, e.clientX - b.left < b.width / 2 ? -1 : 1);
    sfx.tap();
  };
  const onKey = (e) => {
    if (e.key === "ArrowLeft") steer(race, -1);
    if (e.key === "ArrowRight") steer(race, 1);
  };
  canvas.addEventListener("pointerdown", onPointer);
  window.addEventListener("keydown", onKey);
  window.addEventListener("resize", resize);

  const box = modal(wrap, {
    className: "test-drive",
    testId: "test-drive-modal",
    dismissible: false,
    onClose: () => {
      loop.stop();
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", resize);
      if (window.__game) window.__game.testDrive = null;
      onClose?.();
    },
  });
  resize();
  loop.start();
  speak("Skúšobná jazda! Ťukaj vľavo a vpravo.");
  if (window.__game) window.__game.testDrive = race; // test hook
  return box;
}
