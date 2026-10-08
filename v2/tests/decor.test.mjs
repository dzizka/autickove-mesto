// Part 24: the race surroundings in 3D (DESIGN-v2 §4.1) – models beside and on the road,
// rails, bridges, tunnels, space rings, gates and grandstands at the start and the finish.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import "../js/core/state.js"; // first: state and tuning import each other
import { MODELS, DECOR, RACE_DRAW } from "../js/data/race-props.js";
import { TRACKS } from "../js/data/tracks.js";
import { SPRITE_WIDTH } from "../js/render/road-sprites.js";
import { buildRoad, M } from "../js/games/race/road.js";
import { setup, openGame, screenshot, WIDTHS } from "./helpers.mjs";

const PROCS = ["props3d.js", "props3d-world.js"].map((f) => readFileSync(new URL(`../js/render/three/${f}`, import.meta.url), "utf8")).join("\n");
const DRAWN_2D = readFileSync(new URL("../js/render/road-sprites.js", import.meta.url), "utf8");
const has2D = (id) => DRAWN_2D.includes(`case "${id}":`);

test("every model is in the game (or built from shapes) and has a 2D stand-in", () => {
  for (const [id, m] of Object.entries(MODELS)) {
    if (m.path.startsWith("proc:")) assert.ok(PROCS.includes(`${m.path.split(":")[1]}`), `built model ${id}`);
    else assert.ok(existsSync(new URL(`../models/${m.path}.glb`, import.meta.url)), `model file of ${id}`);
    assert.ok(m.fb === "" || has2D(m.fb), `2D drawing of ${id}`);
  }
  for (const kit of ["nature", "racingkit", "city", "carkit"]) assert.ok(existsSync(new URL(`../models/${kit}/License.txt`, import.meta.url)), `licence of ${kit}`);
  assert.ok(RACE_DRAW.obstacle >= 1.7, "obstacles are drawn big");
});

test("every track has its surroundings, and every id can be drawn", () => {
  const drawable = (id) => MODELS[id] || SPRITE_WIDTH[id] || has2D(id);
  for (const t of TRACKS) {
    const d = DECOR[t.id];
    assert.ok(d, `decor of ${t.id}`);
    assert.ok(d.far.length >= 4 && d.near.length >= 2, `${t.id}: big and small things`);
    for (const id of [...d.far, ...d.near, ...(d.stands || []), d.posts?.id].filter(Boolean)) assert.ok(drawable(id), `${t.id}: ${id}`);
    for (const id of t.obstacles) assert.ok(MODELS[id] || has2D(id), `${t.id} obstacle ${id}`);
    assert.ok(d.landmarks.length >= 1, `${t.id}: a bridge, a tunnel or rings`);
    if (d.landmarks.some((l) => l.kind === "tunnel")) assert.ok(d.tunnel, `${t.id}: tunnel colours`);
    if (d.landmarks.some((l) => l.kind === "bridge")) assert.ok(d.water, `${t.id}: river colours`);
  }
});

test("the road gets landmarks, rails, gates and scenery that is not mirrored", () => {
  for (const t of TRACKS) {
    const R = buildRoad(t, 1000);
    const segs = R.segs;
    const start = segs.find((s) => s.gate === "startGate");
    const finish = segs.find((s) => s.gate === "gate");
    assert.ok(start && finish && finish.z1 > start.z1, `${t.id}: start and finish gates`);
    assert.ok(Math.abs(finish.z1 - 1000 * M) < 3 * M, `${t.id}: the finish gate is on the finish line`);
    for (const l of DECOR[t.id].landmarks) {
      const seg = segs.find((s) => s.landStart === l.kind && Math.abs(s.z1 - l.at * 1000 * M) < 2 * M);
      assert.ok(seg, `${t.id}: ${l.kind} at ${l.at}`);
    }
    const tunnel = segs.filter((s) => s.land === "tunnel");
    assert.ok(tunnel.every((s) => s.scenery.length === 0 && !s.edge), `${t.id}: nothing stands inside a tunnel`);
    assert.ok(segs.filter((s) => s.land === "bridge").every((s) => s.edge === "bridge"), `${t.id}: a bridge has a railing`);
    if (DECOR[t.id].edge) assert.ok(segs.some((s) => s.edge === DECOR[t.id].edge.kind), `${t.id}: rails`);
    const left = segs.filter((s) => s.scenery.some((sp) => sp.side < 0 && !sp.keep)).map((s) => s.i);
    const right = segs.filter((s) => s.scenery.some((sp) => sp.side > 0 && !sp.keep)).map((s) => s.i);
    assert.ok(left.length > 40 && right.length > 40, `${t.id}: plenty on both sides`);
    assert.notDeepEqual(left, right, `${t.id}: the two sides differ`);
    const stands = DECOR[t.id].stands[0];
    assert.ok(segs.some((s) => s.scenery.some((sp) => sp.id === stands)), `${t.id}: grandstands`);
    // the same track always looks the same
    assert.deepEqual(buildRoad(t, 1000).segs.map((s) => s.scenery.length), segs.map((s) => s.scenery.length));
  }
});

// ---------- browser ----------

let env;
before(async () => {
  env = await setup({ webgl: true });
});
after(async () => {
  await env.teardown();
});

const quiet = { settings: { sound: false, voice: false, motion: false }, cheats: { shortRaces: true } };

for (const width of WIDTHS) {
  test(`${width}px: a race makes the 3D pictures of its track and drives through the tunnel`, async () => {
    const page = await openGame(env.browser, env.server.url, { width, storage: quiet, hash: "#/game/race/city/1" });
    // software WebGL also draws the 2D canvas slowly here: the countdown takes a while
    await page.waitForFunction(() => window.__game.race?.phase === "racing", null, { timeout: 90000 });
    await page.waitForFunction(() => !window.__game.racePicsPending(), null, { timeout: 60000 });
    // into the tunnel (short race: the tunnel starts at 2/3 of 320 m)
    await page.evaluate(() => {
      const r = window.__game.race;
      r.player.d = r.length * 0.7;
      window.__game.road.detail = 1;
    });
    await page.waitForTimeout(400);
    await screenshot(page, `${width}-race-tunnel`);
    await page.evaluate(() => (window.__game.race.player.d = window.__game.race.length * 0.2));
    await page.waitForTimeout(400);
    await screenshot(page, `${width}-race-decor`);
    assert.deepEqual(page.errors, []);
    await page.context().close();
  });
}
