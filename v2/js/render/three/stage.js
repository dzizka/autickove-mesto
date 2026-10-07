// A small 3D stage for one car (part 15a): the showroom turntable (Vzhľad) or the garage lift.
// The child turns the car with a finger; when left alone it turns slowly by itself.
// Transparent canvas: the screen's own background and spotlight stay visible behind it.

import * as THREE from "three";
import { createLoop } from "../../core/loop.js";
import { addLights } from "./kit.js";
import { buildCar, disposeCar } from "./car3d.js";

function platform(mode) {
  const g = new THREE.Group();
  if (mode === "lift") {
    const mat = new THREE.MeshStandardMaterial({ color: "#8a93ab", roughness: 0.7 });
    const plate = new THREE.Mesh(new THREE.BoxGeometry(1, 0.16, 1), mat); // sized to the car in show()
    plate.position.y = -0.08;
    plate.receiveShadow = true;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.06, 1.03), new THREE.MeshStandardMaterial({ color: "#ffc531", roughness: 0.6 }));
    stripe.position.y = -0.19;
    g.add(plate, stripe);
  } else {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.4, 0.2, 64), new THREE.MeshStandardMaterial({ color: "#c9cfe0", roughness: 0.6 }));
    disc.position.y = -0.1;
    disc.receiveShadow = true;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.32, 0.05, 8, 64), new THREE.MeshBasicMaterial({ color: "#fff6be" }));
    ring.rotation.x = Math.PI / 2;
    g.add(disc, ring);
  }
  return g;
}

/**
 * host: element that receives the canvas. Returns { show(look, opts) → Promise<boolean>, destroy() }.
 * onReady() is called after the first car is on the stage; onLost() when WebGL stops working.
 */
export function createStage(host, { mode = "turntable", onReady, onLost } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.className = "car-3d";
  host.append(canvas);

  const scene = new THREE.Scene();
  addLights(scene);
  const camera = new THREE.PerspectiveCamera(30, 1.6, 0.1, 100);
  const turn = new THREE.Group(); // turns with the finger
  scene.add(turn);
  const stand = platform(mode);
  (mode === "lift" ? scene : turn).add(stand);
  const holder = new THREE.Group();
  turn.add(holder);

  let car = null;
  let zoom = 1;
  let angle = mode === "lift" ? -0.7 : 2.3;
  let vel = 0;
  let idle = 0;
  let drag = null;
  let ticket = 0;
  let lost = false;
  let target = null; // angle the car turns to, to show what changes

  function frame() {
    const w = host.clientWidth || 1;
    const hgt = host.clientHeight || 1;
    const size = renderer.getSize(new THREE.Vector2());
    if (size.x !== w || size.y !== hgt) renderer.setSize(w, hgt, false);
    camera.aspect = w / hgt;
    const tall = w / hgt < 1.2 ? 1.25 : 1;
    camera.position.set(0, 2.4 * zoom, 6.4 * zoom * tall);
    camera.lookAt(0, 0.5 * zoom, 0);
    camera.updateProjectionMatrix();
  }

  const onDown = (e) => {
    target = null;
    drag = { x: e.clientX, a: angle, id: e.pointerId };
    vel = 0;
  };
  const onMove = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const na = drag.a + (e.clientX - drag.x) * 0.012;
    vel = na - angle;
    angle = na;
    idle = 0;
  };
  const onUp = () => (drag = null);
  canvas.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    if (lost) return;
    lost = true;
    loop.stop();
    onLost?.();
  });

  const loop = createLoop({
    update(dt, t) {
      idle += dt;
      if (target !== null && !drag) {
        // the shortest way round to the target angle
        const d = Math.atan2(Math.sin(target - angle), Math.cos(target - angle));
        angle += d * Math.min(1, dt * 4);
        vel = 0;
        if (idle > 4) target = null;
      } else if (!drag) {
        vel *= 0.92;
        const auto = mode === "lift" ? Math.sin(t * 0.5) * 0.004 : idle > 1.5 ? dt * 0.45 : 0;
        angle += vel + auto;
      }
      turn.rotation.y = angle;
      car?.tick(t);
    },
    draw() {
      frame();
      renderer.render(scene, camera);
    },
  });
  loop.start();

  return {
    canvas,
    /** Turn the car so this angle faces the camera (0 = the front). */
    face(a) {
      target = a;
      idle = 0;
    },
    /** Put a car with this look on the stage (newest call wins). */
    async show(r, opts) {
      const me = ++ticket;
      const next = await buildCar(r, opts);
      if (me !== ticket || lost) {
        disposeCar(next.object);
        return false;
      }
      if (car) {
        holder.remove(car.object);
        disposeCar(car.object);
      }
      car = next;
      holder.add(car.object);
      const s = car.size;
      zoom = Math.max(0.75, Math.max(s.z, s.x * 1.5, s.y * 1.6) / 2.4); // big trucks need the camera further back
      if (mode === "lift") stand.scale.set(s.x + 0.9, 1, s.z + 1.1);
      else stand.scale.set(zoom, 1, zoom);
      onReady?.();
      return true;
    },
    destroy() {
      ticket++;
      lost = true;
      loop.stop();
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (car) disposeCar(car.object);
      stand.traverse((o) => o.geometry?.dispose());
      renderer.dispose();
      renderer.forceContextLoss?.();
      canvas.remove();
    },
  };
}
