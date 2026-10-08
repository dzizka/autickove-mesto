// Pictures of 3D models (parts 15a, 15b): one hidden renderer draws the car (or a prop like a
// cone) into an image seen from the side, from behind or from the top. Requests run one after
// another; the cache lives in render/car-pics.js. Every picture comes with `meta`, the places
// the 2D code needs (where the car touches the road, its width, lights, wheels).

import * as THREE from "three";
import { addLights, loadAny, getKitScale } from "./kit.js";
import { buildCar, disposeCar } from "./car3d.js";
import { RACE } from "../../data/tracks.js";

const EL = ((RACE.carViewDeg ?? 34) * Math.PI) / 180;

/** The side picture has exactly the 2D car's viewBox (240 × 124), twice as sharp. */
export const SIDE_VB = [240, 124];
const SIDE_PX = [480, 248];
const MAX_PX = 1024;

// where the camera looks from (towards the model's centre); the car faces +z
const VIEWS = {
  side: { dir: [-0.84, 0.36, 0.41], up: [0, 1, 0] }, // left side, a little from the front: front points right
  back: { dir: [0, Math.sin(EL), -Math.cos(EL)], up: [0, 1, 0], ppu: 240 }, // from behind, RACE.carViewDeg above; ppu sharp enough for a 2× tablet
  top: { dir: [0, 1, 0], up: [0, 0, 1], ppu: 150 }, // from above, the front points up
};

let renderer = null;
let scene = null;
let ground = null;
let queue = Promise.resolve();

function setup() {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  // if the browser takes the GPU away, start a fresh renderer for the next picture
  renderer.domElement.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    renderer = null;
  });
  scene = new THREE.Scene();
  addLights(scene);
  const fill = new THREE.DirectionalLight("#ffffff", 1.2); // lights the sides the sun misses
  fill.position.set(-6, 4, -3);
  scene.add(fill);
  ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.22 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
}

// cars off to the side of the road are seen a little from the side (yaw −1, 0, 1)
const YAW = 0.26; // 15°

/** Orthographic camera fitted around the object for this view. Returns { cam, w, h, ppu }. */
function fitCamera(object, view, yaw = 0) {
  const v = VIEWS[view];
  const dir = new THREE.Vector3(...v.dir);
  if (yaw) dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), -yaw * YAW);
  const box = new THREE.Box3().setFromObject(object);
  const centre = box.getCenter(new THREE.Vector3());
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  cam.up.set(...v.up);
  cam.position.copy(centre).addScaledVector(dir.normalize(), 30);
  cam.lookAt(centre);
  cam.updateMatrixWorld(true);
  // the box corners in camera space give the picture's extent
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (let i = 0; i < 8; i++) {
    const p = new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).applyMatrix4(cam.matrixWorldInverse);
    [x0, x1, y0, y1] = [Math.min(x0, p.x), Math.max(x1, p.x), Math.min(y0, p.y), Math.max(y1, p.y)];
  }
  const pad = 0.05 * Math.max(x1 - x0, y1 - y0);
  [x0, x1, y0, y1] = [x0 - pad, x1 + pad, y0 - pad, y1 + pad];
  let w;
  let h;
  if (view === "side") {
    // contain the car in the fixed 2D viewBox, standing on its bottom like the 2D car
    [w, h] = SIDE_PX;
    const scale = Math.max((x1 - x0) / w, (y1 - y0 - pad) / (h * 0.9));
    const cx = (x0 + x1) / 2;
    const bottom = y0 + pad - h * 0.1 * scale; // like the 2D car: a little room below the wheels
    [x0, x1, y0, y1] = [cx - (w / 2) * scale, cx + (w / 2) * scale, bottom, bottom + h * scale];
  } else {
    const k = Math.min(v.ppu, MAX_PX / Math.max(x1 - x0, y1 - y0));
    w = Math.max(8, Math.round((x1 - x0) * k));
    h = Math.max(8, Math.round((y1 - y0) * k));
  }
  Object.assign(cam, { left: x0, right: x1, bottom: y0, top: y1 });
  cam.updateProjectionMatrix();
  return { cam, w, h, ppu: w / (x1 - x0) };
}

function projector(cam, w, h) {
  return (x, y, z) => {
    const p = new THREE.Vector3(x, y, z).project(cam);
    return [((p.x + 1) / 2) * w, ((1 - p.y) / 2) * h];
  };
}

/** The places 2D code needs, in picture pixels (side: in viewBox units). */
function metaFor(view, at, s, car, w, ppu) {
  const rel = (a, b) => [b[0] - a[0], b[1] - a[1]];
  if (view === "back") {
    const anchor = at(0, 0, -s.z / 2);
    // the car's footprint on the road: shadow and neon go there, not behind the bumper
    const c = at(0, 0, 0);
    const front = at(0, 0, s.z / 2);
    const side = Math.abs(at(s.x / 2, 0, 0)[0] - at(-s.x / 2, 0, 0)[0]) / 2;
    const foot = { cx: c[0] - anchor[0], cy: c[1] - anchor[1], rx: Math.max(side, (s.x / 2) * ppu * 0.9), ry: Math.abs(front[1] - anchor[1]) / 2 };
    return { ax: anchor[0], ay: anchor[1], bodyW: s.x * ppu, foot, lights: [-1, 1].map((k) => rel(anchor, at(k * s.x * 0.36, s.y * 0.42, -s.z / 2))), win: rel(anchor, at(0, s.y * 0.8, -s.z * 0.1)), top: rel(anchor, at(0, s.y, 0)) };
  }
  if (view === "top") {
    const c = at(0, 0, 0);
    return { ax: c[0], ay: c[1], bodyW: Math.abs(at(s.x / 2, 0, 0)[0] - at(-s.x / 2, 0, 0)[0]) };
  }
  const k = SIDE_VB[0] / w;
  const vb = (x, y, z) => at(x, y, z).map((v) => Math.round(v * k * 10) / 10);
  const near = (car?.wheelSpots() || []).filter((sp) => sp.center.x < 0);
  const wheels = near.map((sp) => ({ p: vb(sp.center.x, sp.center.y, sp.center.z), r: sp.r }));
  wheels.sort((a, b) => a.p[0] - b.p[0]);
  const unit = vb(0, 1, 0)[1] - vb(0, 0, 0)[1];
  return {
    wheels: wheels.map((wh) => wh.p[0]),
    wheelY: wheels.length ? wheels.reduce((t, wh) => t + wh.p[1], 0) / wheels.length : vb(0, 0, 0)[1],
    wheelR: wheels.length ? Math.abs(wheels[0].r * unit) : 18,
    front: vb(-s.x / 2, s.y * 0.4, s.z / 2),
    back: vb(-s.x / 2, s.y * 0.45, -s.z / 2),
    roof: vb(0, s.y, 0),
    sticker: vb(-s.x / 2, s.y * 0.4, -0.1),
  };
}

async function build(kind, payload) {
  if (kind === "car") return buildCar(payload.r, { ...payload.opts, neon: payload.view === "side" });
  const src = (await loadAny(payload.path)).clone(true);
  const size = new THREE.Box3().setFromObject(src).getSize(new THREE.Vector3());
  src.scale.setScalar((payload.path.startsWith("carkit/") ? await getKitScale() : 1.6 / Math.max(size.x, size.z)) * (payload.scale || 1));
  const wrap = new THREE.Group();
  wrap.add(src);
  const box = new THREE.Box3().setFromObject(wrap);
  src.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
  src.traverse((o) => o.isMesh && (o.castShadow = true));
  return { object: wrap, size: box.getSize(new THREE.Vector3()) };
}

async function draw(kind, payload) {
  if (!renderer) setup();
  const item = await build(kind, payload);
  scene.add(item.object);
  ground.visible = payload.view === "side"; // races, maze and crossing draw their own shadow
  try {
    const { cam, w, h, ppu } = fitCamera(item.object, payload.view, payload.yaw || 0);
    renderer.setSize(w, h, false);
    renderer.render(scene, cam);
    const url = renderer.domElement.toDataURL("image/png");
    return { url, w, h, meta: metaFor(payload.view, projector(cam, w, h), item.size, item.wheelSpots ? item : null, w, ppu) };
  } finally {
    scene.remove(item.object);
    if (kind === "car") disposeCar(item.object);
  }
}

/**
 * Render a picture. kind "car": payload { r (resolved look), opts, view };
 * kind "prop": payload { path (under v2/models), scale, view }.
 */
export function renderPicture(kind, payload) {
  const job = queue.then(() => draw(kind, payload));
  queue = job.catch(() => null);
  return job;
}
