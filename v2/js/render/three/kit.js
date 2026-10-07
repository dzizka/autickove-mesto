// Kenney Car Kit (CC0) loading for the 3D car (DESIGN-v2 §14, part 15a).
// Models are loaded once and cloned. Only imported on demand (dynamic import), so the game
// still starts when three.js or WebGL is missing.

import * as THREE from "three";
import { GLTFLoader } from "../../../vendor/addons/loaders/GLTFLoader.js";

const MODELS = new URL("../../../models/", import.meta.url);
const loader = new GLTFLoader();
const cache = new Map();

/** Any model by its path under v2/models without .glb, e.g. "city/roads/construction-barrier". */
export function loadAny(path) {
  if (!cache.has(path)) {
    const p = loader.loadAsync(new URL(`${path}.glb`, MODELS).href).then((g) => g.scene);
    p.catch(() => cache.delete(path)); // a failed load may be tried again later
    cache.set(path, p);
  }
  return cache.get(path);
}

/** A Car Kit model (shared; clone before changing it). */
export const loadModel = (name) => loadAny(`carkit/${name}`);

/** Kit models keep their real sizes (a kart is small, a fire truck big): one scale for all. */
let kitScale = null;
export async function getKitScale() {
  if (kitScale === null) {
    const size = new THREE.Box3().setFromObject(await loadModel("sedan")).getSize(new THREE.Vector3());
    kitScale = 2.4 / Math.max(size.x, size.z); // a sedan is 2.4 units long
  }
  return kitScale;
}

const emojiCache = new Map();
/** An emoji as a texture (stickers, roof items, the buddy, the trail). */
export function emojiTexture(char) {
  if (!emojiCache.has(char)) {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const g = cv.getContext("2d");
    g.font = '100px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(char, 64, 72);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    emojiCache.set(char, t);
  }
  return emojiCache.get(char);
}

export function emojiSprite(char, size) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTexture(char), depthWrite: false }));
  s.scale.set(size, size, 1);
  return s;
}

/** Soft daylight used by every 3D car view. */
export function addLights(scene) {
  scene.add(new THREE.HemisphereLight("#e6eeff", "#4a4560", 1.8));
  const sun = new THREE.DirectionalLight("#ffffff", 2.3);
  sun.position.set(4, 8, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 30 });
  scene.add(sun);
  return sun;
}
