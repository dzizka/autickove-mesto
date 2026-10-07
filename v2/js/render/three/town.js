// 🏙️ The town from above (part 16, DESIGN-v2 §14): the child's own car (the 3D car with its
// look) drives along the streets: up, down, left and right with the arrows, a swipe or the
// keys. Driving over the coins in front of a building collects its rent; a tap on a lot opens
// it. The camera keeps its direction and glides after the car.

import * as THREE from "three";
import { createLoop } from "../../core/loop.js";
import { TOWN } from "../../data/city.js";
import { addLights } from "./kit.js";
import { buildCar, disposeCar } from "./car3d.js";
import { createTownMap, node, GRID } from "./town-map.js";

const DIRS = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };
const SKY = { day: "#9be3f0", morning: "#ffd9b8", evening: "#ffb38a", night: "#141838" };
const GRASS = { day: "#7ccf5a", morning: "#86c868", evening: "#6fae55", night: "#2f5a3a" };

/**
 * host: element for the canvas. opts: { look (resolved), passenger, phase, onLot(id), onCoins(id, {x, y}) }.
 * Returns { setLot(def, info), press(dir), hold(on), clearCoins(id), screenOf(id), state(), destroy() }.
 */
export function createTown(host, { look, passenger = null, phase = "day", onLot, onCoins } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.className = "town-3d";
  canvas.dataset.testid = "town-canvas";
  host.append(canvas);

  const night = phase === "night";
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY[phase] || SKY.day);
  const sun = addLights(scene);
  sun.position.set(6, 14, 4);
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, far: 40 });
  sun.intensity = night ? 0.35 : phase === "day" ? 2.3 : 1.6;
  scene.children.find((o) => o.isHemisphereLight).intensity = night ? 0.55 : 1.7;
  scene.add(sun.target);
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(GRID.TILES + 40, GRID.TILES + 40), new THREE.MeshStandardMaterial({ color: GRASS[phase] || GRASS.day }));
  grass.rotation.x = -Math.PI / 2;
  grass.position.y = -0.01;
  grass.receiveShadow = true;
  scene.add(grass);

  const map = createTownMap(scene);
  const camera = new THREE.PerspectiveCamera(22, 1, 0.1, 300); // narrow lens: tall buildings lean less

  // ---------- the car ----------
  const [sx, sz] = TOWN.start;
  const car = { gx: sx, gz: sz, x: node(sx), z: node(sz), dir: null, next: null, heading: Math.PI, mesh: new THREE.Group() };
  scene.add(car.mesh);
  let carObj = null;
  buildCar(look, { passenger })
    .then((c) => {
      if (dead) return disposeCar(c.object);
      carObj = c;
      c.object.scale.setScalar(TOWN.carLength / Math.max(1e-3, c.size.z));
      car.mesh.add(c.object);
    })
    .catch((err) => console.warn("[town] car failed", err));
  if (night) {
    const lamp = new THREE.PointLight("#fff1c4", 1.5, 2.5);
    lamp.position.set(0, 0.6, 0.6);
    car.mesh.add(lamp); // headlights light the street a little
  }

  let hold = false;
  let dead = false;
  const canGo = (dir) => {
    const [dx, dz] = DIRS[dir];
    return car.gx + dx >= 0 && car.gx + dx <= GRID.N && car.gz + dz >= 0 && car.gz + dz <= GRID.N;
  };
  /** Drive (or queue the next turn while driving). */
  function press(dir) {
    if (!DIRS[dir]) return;
    if (car.dir) car.next = dir;
    else if (canGo(dir)) car.dir = dir;
  }

  const project = (v) => {
    const p = v.clone().project(camera);
    const r = canvas.getBoundingClientRect();
    return { x: r.left + ((p.x + 1) / 2) * r.width, y: r.top + ((1 - p.y) / 2) * r.height };
  };

  let lastDt = 1 / 60;
  let prev = 0;
  function update(_, t) {
    // real time (up to ¼ s), so the car keeps its speed on a slow tablet too
    const now = performance.now();
    const dt = prev ? Math.min(0.25, (now - prev) / 1000) : 0;
    prev = now;
    lastDt = dt;
    if (car.dir) {
      const [dx, dz] = DIRS[car.dir];
      const tx = node(car.gx + dx);
      const tz = node(car.gz + dz);
      car.x += dx * TOWN.speed * dt;
      car.z += dz * TOWN.speed * dt;
      car.heading = Math.atan2(dx, dz);
      if ((dx && (tx - car.x) * dx <= 0) || (dz && (tz - car.z) * dz <= 0)) {
        car.gx += dx;
        car.gz += dz;
        car.x = node(car.gx);
        car.z = node(car.gz);
        const want = car.next && canGo(car.next) ? car.next : null;
        car.next = null;
        car.dir = want || (hold && canGo(car.dir) ? car.dir : null);
      }
    }
    const [hx, hz] = [Math.sin(car.heading), Math.cos(car.heading)];
    car.mesh.position.set(car.x - hz * TOWN.lane, 0.02, car.z + hx * TOWN.lane); // right-hand lane
    let d = car.heading - car.mesh.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    car.mesh.rotation.y += d * Math.min(1, dt * 10);
    carObj?.tick(t);
    // driving over a building's coins collects its rent
    for (const c of map.coins()) {
      c.rotation.y += dt * 3;
      if (Math.hypot(c.position.x - car.mesh.position.x, c.position.z - car.mesh.position.z) < TOWN.pickup) {
        const id = c.userData.lot;
        const at = project(c.position);
        map.clearCoins(id);
        onCoins?.(id, at);
        break;
      }
    }
  }

  // ---------- camera ----------
  const focus = new THREE.Vector3(car.x, 0, car.z);
  function frame(dt) {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    const size = renderer.getSize(new THREE.Vector2());
    if (size.x !== w || size.y !== h) renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const far = w < h ? 1.5 : 1;
    focus.lerp(car.mesh.position, Math.min(1, dt * 3));
    camera.position.set(focus.x, 24 * far, focus.z + 8 * far);
    camera.lookAt(focus.x, 0, focus.z);
    sun.position.set(focus.x + 6, 14, focus.z + 4); // the shadows follow the car
    sun.target.position.set(focus.x, 0, focus.z);
  }
  frame(1);

  // ---------- touch: a swipe drives, a tap opens a lot ----------
  const ray = new THREE.Raycaster();
  let start = null;
  const onDown = (e) => (start = { x: e.clientX, y: e.clientY });
  const onUp = (e) => {
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    start = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) >= 30) return press(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "r" : "l") : dy > 0 ? "d" : "u");
    const r = canvas.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
    const hit = ray.intersectObjects(map.hits(), false)[0];
    if (hit) onLot?.(hit.object.userData.lot);
  };
  const onKey = (e) => {
    const dir = { ArrowUp: "u", ArrowDown: "d", ArrowLeft: "l", ArrowRight: "r" }[e.key];
    if (!dir) return;
    e.preventDefault();
    hold = true;
    press(dir);
  };
  const onKeyUp = () => (hold = false);
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointerup", onUp);
  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", onKeyUp);

  const loop = createLoop({
    update,
    draw() {
      frame(lastDt);
      renderer.render(scene, camera);
    },
  });
  loop.start();

  return {
    ready: map.ready,
    setLot: (def, info) => map.setLot(def, info).catch((err) => console.warn("[town] lot failed", err)),
    clearCoins: (id) => map.clearCoins(id),
    press,
    hold(on) {
      hold = on;
    },
    /** Screen position of a lot's centre (for tests and the coin animation). */
    screenOf(id) {
      const lot = map.lots.get(id);
      return lot ? project(new THREE.Vector3(lot.cx, 0.3, lot.cz)) : null;
    },
    /** Test hook: put the car right before a building's coins, driving towards them. */
    driveToCoins(id) {
      const lot = map.lots.get(id);
      if (!lot) return false;
      Object.assign(car, { gx: lot.bx, gz: lot.bz + 1, x: node(lot.bx), z: node(lot.bz + 1), dir: "r", next: null, heading: Math.PI / 2 });
      return true;
    },
    state: () => ({ gx: car.gx, gz: car.gz, moving: !!car.dir, coins: map.coins().length, car: !!carObj }),
    destroy() {
      dead = true;
      loop.stop();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
      if (carObj) disposeCar(carObj.object);
      renderer.dispose();
      renderer.forceContextLoss?.();
      canvas.remove();
    },
  };
}
