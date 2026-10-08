// The player's car in 3D (DESIGN-v2 §5, §14; part 15a): a Kenney Car Kit model with the whole
// look: paint (also rainbow, gold, galaxy) and pattern, wheels, wing, sticker, roof item, neon,
// trail and the crew buddy. The car faces +z and stands on y = 0, centred.

import * as THREE from "three";
import { loadModel, getKitScale, emojiTexture, emojiSprite } from "./kit.js";
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

async function addWing(wrap, size, wing) {
  if (wing.icon) {
    // angel wings: two feathers at the back
    for (const side of [1, -1]) {
      const s = emojiSprite(wing.icon, 0.9);
      s.position.set(side * size.x * 0.45, size.y * 0.75, -size.z * 0.3);
      s.material.rotation = side > 0 ? -0.4 : 0.4;
      wrap.add(s);
    }
    return;
  }
  if (!wing.model) return;
  const src = await loadModel(wing.model);
  const sb = new THREE.Box3().setFromObject(src).getSize(new THREE.Vector3());
  const layers = wing.double ? [0, 0.22] : [0];
  for (const dy of layers) {
    const sp = src.clone(true);
    sp.scale.setScalar((size.x * 0.9) / Math.max(sb.x, sb.z));
    sp.position.set(0, size.y * 0.78 + dy * size.y, -size.z * (0.42 - dy * 0.3));
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
  for (const o of bodies) {
    const parts = splitPaint(o.geometry);
    o.geometry.computeBoundingBox();
    const paint = new THREE.Mesh(parts.paint, own(paintMaterial(o.geometry.boundingBox.clone(), colorHex || r.color, r.pattern.id)));
    o.add(new THREE.Mesh(parts.keep, o.material), paint);
    o.material = own(new THREE.MeshBasicMaterial({ visible: false }));
  }
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

  await addWing(wrap, size, r.wing);
  if (r.roof.icon) {
    const s = emojiSprite(r.roof.icon, 0.8);
    s.position.set(0, size.y + 0.32, 0);
    wrap.add(s);
  }
  if (r.sticker.icon) {
    for (const side of [1, -1]) {
      const m = new THREE.Mesh(STICKER_GEO, own(new THREE.MeshBasicMaterial({ map: emojiTexture(r.sticker.icon), transparent: true })));
      m.position.set(side * (size.x / 2 + 0.01), size.y * 0.4, -0.1);
      m.rotation.y = (side * Math.PI) / 2;
      wrap.add(m);
    }
  }
  if (passenger) {
    // the buddy rides along: always visible, as if seen through the window
    const s = emojiSprite(passenger, 0.6);
    s.material.depthTest = false;
    s.renderOrder = 5;
    s.position.set(0, size.y * 0.72, size.z * 0.05);
    wrap.add(s);
  }
  const ticks = [neon ? addNeon(wrap, size, r.neon) : null, trail ? addTrail(wrap, size, r.trail) : null].filter(Boolean);
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
