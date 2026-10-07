// The town map in 3D (part 16, DESIGN-v2 §14): streets from Kenney City Kit Roads, a building
// on each of the twelve lots nearest the middle and houses and parks around them. A lot shows
// what the child has: 🔒 locked, a building site with cones, or the building (it grows with its
// level) with its sign, stars and rent coins waiting on the street in front.

import * as THREE from "three";
import { loadAny } from "./kit.js";
import { BUILDINGS, TOWN } from "../../data/city.js";

const N = TOWN.blocks;
const B = TOWN.blockTiles;
const STEP = B + 1; // a road tile between blocks
const TILES = N * STEP + 1;
const HALF = (TILES - 1) / 2;
/** Crossing i → world coordinate (1 unit = 1 road tile). */
export const node = (i) => i * STEP - HALF;
export const GRID = { N, STEP, TILES, HALF };

// open sides of each road piece before turning: 0 = north (-z), 1 = east, 2 = south, 3 = west
const BASE = { "city/roads/road-straight": [1, 3], "city/roads/road-intersection": [1, 2, 3], "city/roads/road-bend": [2, 3], "city/roads/road-crossroad": [0, 1, 2, 3] };

function fit(piece, need) {
  for (let k = 0; k < 4; k++) {
    const sides = BASE[piece].map((s) => (s - k + 4) % 4).sort();
    if (sides.join() === [...need].sort().join()) return (k * Math.PI) / 2;
  }
  return 0;
}

async function place(parent, path, x, z, { rot = 0, scale = 1, tint = null } = {}) {
  const m = (await loadAny(path)).clone(true);
  m.position.set(x, 0, z);
  m.rotation.y = rot;
  m.scale.setScalar(scale);
  m.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    // the commercial kit is grey: a pastel tint makes each building its own colour
    if (tint) {
      o.material = o.material.clone();
      o.material.userData.own = true;
      Object.assign(o.material, { color: new THREE.Color(tint).lerp(new THREE.Color("#ffffff"), 0.25), emissive: new THREE.Color(tint), emissiveIntensity: 0.15 });
    }
  });
  parent.add(m);
  return m;
}

const spriteCache = new Map();
/** An emoji on a rounded white card (or bare), as a sprite. */
export function badge(char, size = 0.9, card = true) {
  const key = `${char}|${card}`;
  if (!spriteCache.has(key)) {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const g = cv.getContext("2d");
    if (card) {
      g.fillStyle = "#ffffff";
      g.beginPath();
      g.roundRect(6, 6, 116, 116, 28);
      g.fill();
    }
    g.font = '86px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(char, 64, 72);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    spriteCache.set(key, t);
  }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: spriteCache.get(key) }));
  s.scale.set(size, size, 1);
  return s;
}

const coinGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 24);
const coinMat = new THREE.MeshStandardMaterial({ color: "#ffc93c", metalness: 0.6, roughness: 0.3, emissive: "#6b4a00", emissiveIntensity: 0.45 });

/** Build the map into `scene`. Returns { lots, ready, setLot(def, info), coins() }. */
export function createTownMap(scene) {
  const statics = new THREE.Group();
  scene.add(statics);
  const jobs = [];
  const isRoad = (tx, tz) => tx >= 0 && tz >= 0 && tx < TILES && tz < TILES && (tx % STEP === 0 || tz % STEP === 0);
  for (let tx = 0; tx < TILES; tx++) {
    for (let tz = 0; tz < TILES; tz++) {
      if (!isRoad(tx, tz)) continue;
      const need = [[0, tx, tz - 1], [1, tx + 1, tz], [2, tx, tz + 1], [3, tx - 1, tz]].filter(([, x, z]) => isRoad(x, z)).map(([s]) => s);
      const piece = need.length === 4 ? "city/roads/road-crossroad" : need.length === 3 ? "city/roads/road-intersection" : need.length === 2 && (need[0] + 2) % 4 !== need[1] ? "city/roads/road-bend" : "city/roads/road-straight";
      jobs.push(place(statics, piece, tx - HALF, tz - HALF, { rot: fit(piece, need) }));
      if (need.length >= 3 && (tx + tz) % (STEP * 2) === 0) jobs.push(place(statics, "city/roads/light-square", tx - HALF + 0.45, tz - HALF + 0.45, { rot: Math.PI / 4 }));
    }
  }

  // a row of trees round the town, so the edge looks like a park
  for (let k = -HALF - 1; k <= HALF + 1; k += 2) {
    for (const [x, z] of [[k, -HALF - 1.6], [k, HALF + 1.6], [-HALF - 1.6, k], [HALF + 1.6, k]]) jobs.push(place(statics, (k / 2) % 2 ? "city/suburban/tree-large" : "city/suburban/tree-small", x, z, { scale: 1.6 }));
  }

  // blocks nearest the middle get the buildings, in BUILDINGS order
  const mid = (N - 1) / 2;
  const blocks = Array.from({ length: N * N }, (_, k) => [k % N, Math.floor(k / N)]).sort((a, b) => Math.hypot(a[0] - mid, a[1] - mid) - Math.hypot(b[0] - mid, b[1] - mid) || a[1] - b[1] || a[0] - b[0]);
  const lots = new Map();
  blocks.forEach(([bx, bz], i) => {
    const cx = node(bx) + STEP / 2;
    const cz = node(bz) + STEP / 2;
    const def = BUILDINGS[i];
    const pave = new THREE.Mesh(new THREE.BoxGeometry(B, 0.02, B), new THREE.MeshStandardMaterial({ color: "#d9dde3" }));
    pave.position.set(cx, 0, cz);
    pave.receiveShadow = true;
    statics.add(pave);
    if (!def) {
      const lawn = new THREE.Mesh(new THREE.BoxGeometry(B - 0.3, 0.02, B - 0.3), new THREE.MeshStandardMaterial({ color: "#86d46a" }));
      lawn.position.set(cx, 0.01, cz);
      lawn.receiveShadow = true;
      statics.add(lawn);
      if (i % 2) jobs.push(place(statics, TOWN.houses[i % TOWN.houses.length], cx, cz, { scale: 1.6, rot: Math.PI }));
      else for (const [dx, dz] of [[-0.8, -0.8], [0.8, -0.7], [-0.7, 0.8], [0.8, 0.8], [0, 0]]) jobs.push(place(statics, Math.abs(dx) > 0.5 ? "city/suburban/tree-large" : "city/suburban/planter", cx + dx, cz + dz, { scale: 1.5 }));
      return;
    }
    // an invisible box over the lot: a tap on it opens the building
    const hit = new THREE.Mesh(new THREE.BoxGeometry(B, 2.5, B), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }));
    hit.position.set(cx, 1.25, cz);
    hit.userData.lot = def.id;
    statics.add(hit);
    lots.set(def.id, { def, index: i, bx, bz, cx, cz, hit, group: null, key: "", coins: [] });
  });

  const coinList = [];

  /** Show a lot. info = { state: "locked" | "empty" | "built", level, coins (0–3) }. */
  async function setLot(def, info) {
    const lot = lots.get(def.id);
    if (!lot) return;
    const key = `${info.state}|${info.level}|${info.coins}`;
    if (key === lot.key) return;
    lot.key = key;
    const group = new THREE.Group();
    const { cx, cz } = lot;
    const ground = new THREE.Mesh(new THREE.BoxGeometry(B - 0.3, 0.02, B - 0.3), new THREE.MeshStandardMaterial({ color: info.state === "built" ? "#86d46a" : info.state === "empty" ? "#c79a62" : "#a9b4a1" }));
    ground.position.set(cx, 0.01, cz);
    ground.receiveShadow = true;
    group.add(ground);
    const work = [];
    if (info.state === "locked") {
      const s = badge("🔒", 0.8, false);
      s.position.set(cx, 0.6, cz);
      group.add(s);
    } else if (info.state === "empty") {
      // a building site: cones round it, the future building's icon floating above
      for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1.1], [0, 1.1], [-1.1, 0], [1.1, 0]]) work.push(place(group, "city/roads/construction-cone", cx + dx, cz + dz, { scale: 3 }));
      const s = badge(def.icon, 0.95);
      s.material.opacity = 0.8;
      s.position.set(cx, 0.85, cz);
      group.add(s);
      const crane = badge("🏗️", 0.6, false);
      crane.position.set(cx + 0.75, 0.5, cz - 0.6);
      group.add(crane);
    } else {
      const look = TOWN.looks[lot.index % TOWN.looks.length][Math.max(0, Math.min(2, info.level - 1))];
      work.push(place(group, look, cx, cz, { scale: 1.3, rot: Math.PI, tint: def.color }));
      work.push(place(group, "city/suburban/tree-small", cx - 1.15, cz + 1.15, { scale: 1.4 }));
      const sign = badge(def.icon, 0.85);
      sign.position.set(cx + 1.05, 0.95, cz + 1.05);
      group.add(sign);
      const stars = badge("⭐".repeat(info.level), 0.6, false);
      stars.scale.set(0.3 * info.level, 0.3, 1);
      stars.position.set(cx + 1.05, 1.5, cz + 1.05);
      group.add(stars);
    }
    await Promise.all(work);
    if (lot.key !== key) {
      disposeGroup(group);
      return; // a newer state came while the models loaded
    }
    if (lot.group) {
      scene.remove(lot.group);
      disposeGroup(lot.group);
    }
    lot.group = group;
    scene.add(group);
    // the rent waits as coins on the street in front of the building
    for (const c of lot.coins) {
      scene.remove(c);
      coinList.splice(coinList.indexOf(c), 1);
    }
    lot.coins = [];
    for (let k = 0; k < info.coins; k++) {
      const c = new THREE.Mesh(coinGeo, coinMat);
      c.rotation.order = "YXZ";
      c.rotation.x = 1.1; // tilted, so it reads as a coin from above while it spins
      c.position.set(cx - 0.6 + k * 0.6, 0.3, node(lot.bz + 1) + TOWN.lane);
      c.castShadow = true;
      c.userData.lot = def.id;
      scene.add(c);
      lot.coins.push(c);
      coinList.push(c);
    }
  }

  /** Remove a lot's coins (after they were collected). */
  function clearCoins(id) {
    const lot = lots.get(id);
    if (!lot) return;
    for (const c of lot.coins) {
      scene.remove(c);
      coinList.splice(coinList.indexOf(c), 1);
    }
    lot.coins = [];
    lot.key = `${lot.key.split("|").slice(0, 2).join("|")}|0`;
  }

  return { lots, ready: Promise.all(jobs), setLot, clearCoins, coins: () => coinList, hits: () => [...lots.values()].map((l) => l.hit) };
}

function disposeGroup(group) {
  group.traverse((o) => {
    if (o.material?.userData?.own) o.material.dispose();
    if (o.isSprite) o.material.dispose();
  });
}
