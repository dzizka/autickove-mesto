// Pictures of the 3D car (part 15a): one hidden renderer draws a car into an image, e.g. for
// the showroom tiles. Requests run one after another and the results are cached.

import * as THREE from "three";
import { addLights } from "./kit.js";
import { buildCar, disposeCar } from "./car3d.js";

const W = 240;
const H = 150;
let renderer = null;
let scene = null;
const cache = new Map();
let queue = Promise.resolve();

function setup() {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  scene = new THREE.Scene();
  addLights(scene);
  const fill = new THREE.DirectionalLight("#ffffff", 1.4); // lights the side that faces the camera
  fill.position.set(-6, 3, 4);
  scene.add(fill);
}

/** A three-quarter view from the left front (the front points right, like the 2D cars). */
async function draw(r, opts) {
  if (!renderer) setup();
  const car = await buildCar(r, opts);
  scene.add(car.object);
  const s = car.size;
  const fit = Math.max(s.z * 0.85, s.y * 1.5, s.x * 1.0);
  const cam = new THREE.PerspectiveCamera(22, W / H, 0.1, 100);
  cam.position.set(-fit * 2.4, fit * 0.95, fit * 1.25);
  cam.lookAt(0, s.y * 0.42, s.z * 0.04);
  renderer.render(scene, cam);
  const url = renderer.domElement.toDataURL("image/png");
  scene.remove(car.object);
  disposeCar(car.object);
  return url;
}

/** Image URL of the car with this look; `key` identifies the look for the cache. */
export function carPicture(key, r, opts = {}) {
  if (!cache.has(key)) {
    const job = queue.then(() => draw(r, opts));
    queue = job.catch(() => null);
    job.catch(() => cache.delete(key));
    cache.set(key, job);
  }
  return cache.get(key);
}
