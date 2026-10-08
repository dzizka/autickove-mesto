// A car driving on an empty pseudo-3D road (part 14, 15b): used by the 🛣️ test drive and by
// the moving home background. No rivals, no obstacles, no rewards. The caller owns the loop
// and calls update(dt) and draw(time).

import * as rng from "../../core/rng.js";
import { carStats, raceEffects } from "../../systems/stats.js";
import { resolveLook } from "../../systems/tuning.js";
import { createTrail } from "../../render/effects.js";
import { carPic } from "../../render/car-pics.js";
import { createRace, step, steer } from "./physics.js";
import { M, PLAYER_Z, SEG, buildRoad, makeView, renderRoad, createBackdrop, drawBackdrop, fogDensity, segIndex } from "./road.js";
import { drawScene, drawPlayer, drawSpeedLines, laneOffset } from "./scene.js";

const ROAD_METRES = 3000; // longer than the car drives before the scene starts over

/**
 * canvas: the canvas to draw on. opts:
 *  track, look, buddy;
 *  dprMax: sharpness limit (the home background saves work with less);
 *  focus(w, h) → { x, y } where the car's bottom centre should be (default: like the races);
 *  speed: 0..1 share of the car's speed (the home background drives calmly).
 */
export function createDriveScene(canvas, { track, look, buddy = null, dprMax = 2, focus = null, speed = 1, speedLines = true } = {}) {
  const g = canvas.getContext("2d");
  const looks = resolveLook(look);
  const fx = { look, neon: looks.neon, trail: createTrail(looks.trail), sparkle: false, popups: [], buddy };
  carPic(look, "back"); // the 3D car from behind (2D until it is ready)

  let race;
  let road;
  let V = makeView(360, 640);
  let backdrop = null;
  let camX = 0;
  let skyX = 0;
  let frame = 0;
  let lastDt = 0;
  let size = { w: 360, h: 640, dpr: 1, dx: 0 };

  function setTrack(t) {
    track = t;
    race = createRace({ track, level: 1, effects: raceEffects(carStats()), rng });
    race.objects = [];
    race.rivals = [];
    race.length = 1e6; // no finish line
    race.phase = "racing";
    race.countdown = 0;
    road = buildRoad(track, ROAD_METRES);
    camX = 0;
    skyX = 0;
    if (size.w > 0) backdrop = createBackdrop(track, V, size.dpr);
  }

  /** Fit the canvas to its box; the road view may be wider or shorter than the canvas. */
  function resize() {
    const dpr = Math.min(dprMax, window.devicePixelRatio || 1);
    const w = canvas.clientWidth || 360;
    const h = canvas.clientHeight || 640;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    let vw = w;
    let vh = h;
    let dx = 0;
    const f = focus?.(w, h);
    if (f) {
      vh = Math.max(120, f.y / 0.9); // makeView puts the car at 90 % of the height
      vw = 2 * Math.max(f.x, w - f.x);
      dx = f.x - vw / 2;
    }
    V = makeView(vw, vh);
    size = { w, h, dpr, dx };
    backdrop = createBackdrop(track, V, dpr);
    fx.dpr = dpr;
  }

  function update(dt) {
    lastDt = dt;
    step(race, dt * speed);
    race.objects.length = 0;
    race.player.fuel = 1;
    race.events.length = 0;
    if (race.player.d * M > (ROAD_METRES - 200) * M) setTrack(track); // start over before the end
  }

  function draw(time) {
    const p = race.player;
    frame++;
    road.frame = frame;
    camX += (laneOffset(road, p.x) * 0.8 - camX) * Math.min(1, lastDt * 8);
    const camZ = p.d * M - PLAYER_Z;
    const curve = road.segs[segIndex(road, p.d * M)].curve;
    skyX += (0.0015 * curve * p.speed * race.view * M * lastDt * speed) / SEG;
    const { w, h, dpr, dx } = size;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (V.h < h) {
      // below the road view the road goes on under the buttons
      g.fillStyle = track.colors.road;
      g.fillRect(0, V.h - 1, w, h - V.h + 1);
    }
    g.translate(dx, 0);
    drawBackdrop(g, V, backdrop, skyX);
    const r = renderRoad(g, V, road, { z: camZ, x: camX, frame, fog: fogDensity(track) });
    drawScene(g, V, road, race, { base: r.base, camZ, fog: fogDensity(track), time });
    drawPlayer(g, V, road, race, fx, camX, time, lastDt);
    if (speedLines) drawSpeedLines(g, V, race, time);
  }

  setTrack(track);
  return {
    get race() {
      return race;
    },
    get track() {
      return track;
    },
    setTrack,
    resize,
    update,
    draw,
    steer: (dir) => steer(race, dir),
    /** A little jump (the home car when tapped). */
    hop() {
      const p = race.player;
      if (p.airT > 0) return;
      p.airMax = 0.55;
      p.airT = 0.55;
    },
    popup(icon) {
      fx.popups.push({ icon, t: 0 });
    },
  };
}
