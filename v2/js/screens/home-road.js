// Moving home background (DESIGN-v2 §14, part 14): behind the buttons the child's car drives
// on a pseudo-3D road, seen from behind with its whole look and the buddy. The track changes
// every little while; day tracks (also Farm and Beach) by day, night and space in the evening. It runs at a lower
// frame rate than the races, pauses under an open window and when the tab is hidden, and the
// parents can stop it ("Pohyblivé pozadie" in the settings): then it is one still picture.

import { createLoop } from "../core/loop.js";
import { getState } from "../core/state.js";
import { isModalOpen } from "../core/ui.js";
import { TRACKS } from "../data/tracks.js";
import { getLook } from "../systems/tuning.js";
import { createDriveScene } from "../games/race/drive-scene.js";

export const HOME_FPS = 30;
export const TRACK_SECONDS = 25;
const DAY = ["city", "forest", "desert", "snow", "farm", "beach"];
const NIGHT = ["night", "space"];
const STILL_FPS = 1; // without motion the picture is redrawn rarely (the 3D car may still arrive)

export const isNight = (date = new Date()) => date.getHours() >= 19 || date.getHours() < 7;
export const motionOn = () => getState().settings.motion !== false && !matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Tracks for this time of day, in a changing order. */
function trackList(date) {
  const ids = isNight(date) ? NIGHT : DAY;
  const start = date.getMinutes() % ids.length; // a different first track now and then
  return ids.map((_, i) => TRACKS.find((t) => t.id === ids[(start + i) % ids.length])).filter(Boolean);
}

/**
 * Start the background. stage: the element where the car should drive (its bottom centre).
 * Returns { hop(), stop() }.
 */
export function startHomeRoad(stage) {
  const canvas = document.createElement("canvas");
  canvas.className = "home-road";
  canvas.dataset.testid = "home-road";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);

  const tracks = trackList(new Date());
  let index = 0;
  const motion = motionOn();
  canvas.dataset.motion = String(motion);
  const scene = createDriveScene(canvas, {
    track: tracks[0],
    look: getLook(),
    dprMax: 1.5,
    speed: 0.75,
    speedLines: false,
    focus: () => {
      const r = stage.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.bottom - 6 };
    },
  });
  canvas.dataset.track = scene.track.id;

  let wait = 0;
  let last = 0;
  let onTrack = 0;
  let steerIn = 3;
  let fading = false;
  const step = 1 / (motion ? HOME_FPS : STILL_FPS);

  const nextTrack = () => {
    fading = true;
    canvas.classList.add("fade");
    setTimeout(() => {
      index = (index + 1) % tracks.length;
      scene.setTrack(tracks[index]);
      scene.resize();
      canvas.dataset.track = scene.track.id;
      canvas.classList.remove("fade");
      fading = false;
      onTrack = 0;
    }, 600);
  };

  const loop = createLoop({
    update() {},
    draw() {
      // runs every animation frame; the scene moves only HOME_FPS times a second
      const now = performance.now() / 1000;
      wait += Math.min(0.1, now - (last || now));
      last = now;
      if (wait < step || isModalOpen()) return;
      const d = Math.min(0.1, wait);
      wait = 0;
      if (motion) {
        onTrack += d;
        steerIn -= d;
        if (steerIn <= 0) {
          // autopilot: change lanes now and then
          steerIn = 2.5 + Math.random() * 3.5;
          const lanes = scene.race.lanes;
          const lane = scene.race.player.lane;
          scene.steer(lane === 0 ? 1 : lane === lanes - 1 ? -1 : Math.random() < 0.5 ? -1 : 1);
        }
        if (onTrack > TRACK_SECONDS && !fading && tracks.length > 1) nextTrack();
        scene.update(d);
      }
      scene.draw(now);
    },
  });

  const onResize = () => scene.resize();
  window.addEventListener("resize", onResize);
  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(onResize) : null;
  ro?.observe(stage);
  scene.resize();
  loop.start();
  if (window.__game) window.__game.homeRoad = { scene, motion, next: nextTrack };

  return {
    hop() {
      scene.hop();
      scene.popup("🎵");
    },
    stop() {
      loop.stop();
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
      canvas.remove();
      if (window.__game) window.__game.homeRoad = null;
    },
  };
}
