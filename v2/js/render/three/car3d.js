// The player's car in 3D (DESIGN-v2 §5, §14; part 15a): a Kenney Car Kit model with the whole
// look: paint (also rainbow, gold, galaxy) and pattern, wheels, spoiler, sticker, roof item, neon,
// trail and the crew buddy. The car faces +z and stands on y = 0, centred.
// Part 18: spoiler, roof item and stickers are put on the real surface of each model (rays
// against the body), so they sit on the trunk, the roof and the doors of every car kind.

import * as THREE from "three";
import { loadModel, loadAny, getKitScale, emojiTexture, emojiSprite } from "./kit.js";
import { splitPaint, paintMaterial } from "./paint.js";

// vehicles whose own wheels must stay (different sizes front and back, or part of the model)
const OWN_WHEELS = new Set(["tractor", "kart-oobi", "kart-oozi"]);

const own = (m) => ((m.userData.own = true), m);
// shared shapes: one upload to the GPU for all cars (no per-car geometry to forget to free)
const GLOW_GEO = new THREE.CircleGeometry(1, 40);
const STICKER_GEO = new THREE.PlaneGeometry(0.45, 0.45);

function shadowsOn(root) {
  root.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
}

function tintWheel(root, wheels) {
  if (!wheels.tint) return;
  root.traverse((m) => {
    if (!m.isMesh) return;
    m.material = own(m.material.clone());
    m.material.color = new THREE.Color(wheels.tint).lerp(new THREE.Color("#ffffff"), 0.35);
    if (wheels.glow) Object.assign(m.material, { emissive: new THREE.Color(wheels.tint), emissiveIntensity: 0.5 });
  });
}

/** Replace a wheel by the chosen one with exactly the size and place of the old one. */
function swapWheel(o, wheelSrc, wheels) {
  const parent = o.parent;
  const inv = new THREE.Matrix4().copy(parent.matrixWorld).invert();
  const old = new THREE.Box3().setFromObject(o).applyMatrix4(inv);
  const oc = old.getCenter(new THREE.Vector3());
  const os = old.getSize(new THREE.Vector3());
  const w = wheelSrc.clone(true);
  const wb = new THREE.Box3().setFromObject(w);
  const ws = wb.getSize(new THREE.Vector3());
  const big = wheels.big ? 1.3 : 1;
  const holder = new THREE.Group();
  w.position.sub(wb.getCenter(new THREE.Vector3())); // centre the wheel in its holder
  holder.add(w);
  const sd = (Math.max(os.y, os.z) / Math.max(ws.y, ws.z)) * big;
  holder.scale.set((os.x / ws.x) * big, sd, sd);
  if (oc.x < 0) holder.rotation.y = Math.PI; // hub faces outwards on both sides
  holder.position.copy(oc);
  tintWheel(w, wheels);
  parent.add(holder);
  o.visible = false;
  return holder;
}

const DOWN = new THREE.Vector3(0, -1, 0);
const ray = new THREE.Raycaster();

/** Where a ray hits the body first: { point, normal } or null. */
function hit(surface, from, dir) {
  ray.set(from, dir);
  const h = ray.intersectObjects(surface, false)[0];
  return h ? { point: h.point, normal: h.face?.normal || null } : null;
}

/** Height of the body at (x, z), or null where the ray misses the car. */
function topAt(surface, size, x, z) {
  return hit(surface, new THREE.Vector3(x, size.y + 2, z), DOWN)?.point.y ?? null;
}

/** The highest spot of the roof in the middle of the car: { y, z }. */
function roofSpot(surface, size) {
  let best = null;
  for (let k = -0.3; k <= 0.3001; k += 0.05) {
    const z = k * size.z;
    const y = topAt(surface, size, 0, z);
    if (y !== null && (!best || y > best.y + 0.01)) best = { y, z };
  }
  return best || { y: size.y, z: 0 };
}

/** The trunk: the first spot from the back that is at least half as high as the car. */
function trunkSpot(surface, size) {
  for (let k = 0.04; k <= 0.35; k += 0.02) {
    const z = -size.z / 2 + k * size.z;
    const y = topAt(surface, size, 0, z);
    if (y !== null && y > size.y * 0.45) return { y, z: z + size.z * 0.05 }; // a little onto the lid
  }
  return null;
}

async function addSpoiler(wrap, size, surface, wing) {
  if (!wing.model) return;
  const spot = trunkSpot(surface, size);
  if (!spot) return;
  const src = await loadModel(wing.model);
  const sb = new THREE.Box3().setFromObject(src);
  const ss = sb.getSize(new THREE.Vector3());
  const layers = wing.double ? [0, 1] : [0];
  for (const i of layers) {
    const sp = src.clone(true);
    const k = (size.x * 0.82) / Math.max(ss.x, ss.z);
    sp.scale.setScalar(k * (i ? 0.85 : 1));
    // standing on the trunk: the bottom of the spoiler on the body, a second one a bit higher
    sp.position.set(-(sb.min.x + sb.max.x) / 2 * k, spot.y - sb.min.y * k + i * ss.y * k * 0.55, spot.z - (sb.min.z + sb.max.z) / 2 * k - i * 0.05);
    if (wing.color) {
      sp.traverse((m) => {
        if (!m.isMesh) return;
        m.material = own(m.material.clone());
        Object.assign(m.material, { color: new THREE.Color(wing.color), metalness: 0.4, roughness: 0.3 });
      });
    }
    shadowsOn(sp);
    wrap.add(sp);
  }
}

/** A roof item sits on the highest spot of the roof: a 3D model or an emoji. */
async function addRoof(wrap, size, surface, roof) {
  if (!roof.icon) return null;
  const spot = roofSpot(surface, size);
  if (roof.model) {
    const src = (await loadAny(roof.model)).clone(true);
    const b = new THREE.Box3().setFromObject(src);
    const s = b.getSize(new THREE.Vector3());
    const k = (roof.height || 0.4) / Math.max(s.y, 0.001);
    src.scale.setScalar(k);
    const holder = new THREE.Group();
    src.position.set(-(b.min.x + b.max.x) / 2 * k, -b.min.y * k, -(b.min.z + b.max.z) / 2 * k);
    holder.add(src);
    holder.position.set(0, spot.y, spot.z);
    shadowsOn(holder);
    wrap.add(holder);
    return roof.spin ? (t) => (holder.rotation.y = t * 1.5) : null;
  }
  const sp = emojiSprite(roof.icon, 0.7);
  sp.position.set(0, spot.y + 0.3, spot.z); // the emoji's bottom edge on the roof
  wrap.add(sp);
  return null;
}

/** Stickers on both doors, flat on the body. */
function addStickers(wrap, size, surface, sticker) {
  if (!sticker.icon) return;
  const map = emojiTexture(sticker.icon);
  for (const side of [1, -1]) {
    const h = hit(surface, new THREE.Vector3(side * (size.x + 1), size.y * 0.4, -0.05 * size.z), new THREE.Vector3(-side, 0, 0));
    if (!h) continue;
    const m = new THREE.Mesh(STICKER_GEO, own(new THREE.MeshBasicMaterial({ map, transparent: true, polygonOffset: true, polygonOffsetFactor: -2 })));
    m.position.set(h.point.x + side * 0.012, h.point.y, h.point.z);
    m.rotation.y = (side * Math.PI) / 2;
    const s = Math.min(1, (size.y * 0.42) / 0.45);
    m.scale.setScalar(s);
    wrap.add(m);
  }
}

function addNeon(wrap, size, neon) {
  if (!neon.value) return null;
  const glow = new THREE.Mesh(GLOW_GEO, own(new THREE.MeshBasicMaterial({ color: neon.value, transparent: true, opacity: 0.6, depthWrite: false })));
  glow.rotation.x = -Math.PI / 2;
  glow.scale.set(size.x * 0.8, size.z * 0.62, 1);
  glow.position.y = 0.02;
  wrap.add(glow);
  const light = new THREE.PointLight(neon.value, 5, 3);
  light.position.y = 0.25;
  wrap.add(light);
  return (t) => {
    if (neon.special === "rainbow") glow.material.color.setHSL((t * 0.25) % 1, 1, 0.55);
    else if (neon.special === "fire") glow.material.color.set(t * 8 % 2 < 1 ? "#ff7a1a" : "#ffb02e");
    else glow.material.opacity = 0.5 + Math.sin(t * 3) * 0.12;
    light.color.copy(glow.material.color);
  };
}

/** Emoji puffs that leave the back of the car (showroom only). */
function addTrail(wrap, size, trail) {
  if (!trail.icon) return null;
  const puffs = Array.from({ length: 6 }, (_, i) => {
    const s = emojiSprite(trail.icon, 0.5);
    s.userData.phase = i / 6;
    wrap.add(s);
    return s;
  });
  return (t) => {
    for (const s of puffs) {
      const k = (t * 0.6 + s.userData.phase) % 1;
      s.position.set(Math.sin((s.userData.phase + k) * 9) * 0.2, 0.35 + k * 0.6, -size.z / 2 - 0.2 - k * 1.6);
      s.material.opacity = 1 - k;
      s.scale.setScalar(0.35 + k * 0.4);
    }
  };
}

/**
 * Build the car. r: resolved look (systems/tuning.js resolveLook); colorHex overrides the paint.
 * Returns { object, size, tick(t) } — tick animates neon and trail.
 */
export async function buildCar(r, { colorHex = null, passenger = null, trail = false, neon = true } = {}) {
  const kind = r.car;
  const [base, scale, wheelSrc] = await Promise.all([loadModel(kind.model), getKitScale(), loadModel(r.wheels.model || "wheel-default")]);
  const src = base.clone(true);
  src.scale.setScalar(scale);
  src.updateMatrixWorld(true);
  const bodies = [];
  const wheels = [];
  src.traverse((o) => {
    if (o.name === "body" && o.isMesh) bodies.push(o);
    else if (/^wheel/.test(o.name) && o.parent && !/^wheel/.test(o.parent.name)) wheels.push(o);
  });
  const surface = []; // the visible body: where spoiler, roof item and stickers go
  for (const o of bodies) {
    const parts = splitPaint(o.geometry);
    o.geometry.computeBoundingBox();
    const paint = new THREE.Mesh(parts.paint, own(paintMaterial(o.geometry.boundingBox.clone(), colorHex || r.color, r.pattern.id)));
    const keep = new THREE.Mesh(parts.keep, o.material);
    o.add(keep, paint);
    surface.push(keep, paint);
    o.material = own(new THREE.MeshBasicMaterial({ visible: false }));
  }
  if (!surface.length) src.traverse((o) => o.isMesh && !/^wheel/.test(o.name) && surface.push(o));
  const wheelObjs = wheels.map((o) => {
    if (!OWN_WHEELS.has(kind.model)) return swapWheel(o, wheelSrc, r.wheels);
    tintWheel(o, r.wheels);
    return o;
  });
  shadowsOn(src);

  const car = new THREE.Group();
  car.add(src);
  const box = new THREE.Box3().setFromObject(car);
  const size = box.getSize(new THREE.Vector3());
  car.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
  const wrap = new THREE.Group();
  wrap.add(car);

  wrap.updateMatrixWorld(true);
  await addSpoiler(wrap, size, surface, r.wing);
  const roofTick = await addRoof(wrap, size, surface, r.roof);
  addStickers(wrap, size, surface, r.sticker);
  if (passenger) {
    // the buddy rides along: always visible, as if seen through the window
    const s = emojiSprite(passenger, 0.6);
    s.material.depthTest = false;
    s.renderOrder = 5;
    s.position.set(0, size.y * 0.72, size.z * 0.05);
    wrap.add(s);
  }
  const ticks = [neon ? addNeon(wrap, size, r.neon) : null, trail ? addTrail(wrap, size, r.trail) : null, roofTick].filter(Boolean);
  /** Wheel centres and radii in the car's own space (for pictures that mark the wheels). */
  const wheelSpots = () => {
    wrap.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(wrap.matrixWorld).invert();
    return wheelObjs.map((o) => {
      const b = new THREE.Box3().setFromObject(o).applyMatrix4(inv);
      return { center: b.getCenter(new THREE.Vector3()), r: b.getSize(new THREE.Vector3()).y / 2 };
    });
  };
  return { object: wrap, size, wheelSpots, tick: (t) => ticks.forEach((f) => f(t)) };
}

/** Free what buildCar made for this car (shared models and textures stay cached). */
export function disposeCar(object) {
  object?.traverse((o) => {
    if (o.material?.userData?.own) o.material.dispose();
    if (o.isSprite) o.material.dispose();
  });
}
