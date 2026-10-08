// Models for the Farm and Beach tracks built from simple shapes (part 25, DESIGN-v2 §4.1):
// barn, silo, windmill, hay bale, pumpkin, milk can; sailboat, buoy, sand castle, beach ball,
// surfboard, lifeguard tower and beach hut. Sizes in metres; the front faces the race camera (−z).

import * as THREE from "three";

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, flatShading: true, ...extra });
const mesh = (geo, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
  const o = new THREE.Mesh(geo, m);
  o.position.set(x, y, z);
  o.rotation.set(rx, ry, rz);
  return o;
};
const group = (...parts) => {
  const g = new THREE.Group();
  for (const p of parts) g.add(p);
  return g;
};

/** A gable roof w wide, d deep, h high, its ridge along z. */
function roof(w, d, h, m) {
  const shape = new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(0, h)]);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
  geo.translate(0, 0, -d / 2);
  return new THREE.Mesh(geo, m);
}

function barn() {
  const red = mat("#c0392b");
  const white = mat("#ffffff");
  const g = group(mesh(new THREE.BoxGeometry(6, 4, 5), red, 0, 2, 0));
  const r = roof(6.8, 5.4, 2.6, mat("#7b241c"));
  r.position.y = 4;
  g.add(r);
  g.add(mesh(new THREE.BoxGeometry(2.4, 2.8, 0.1), mat("#8e2b20"), 0, 1.4, -2.52));
  for (const s of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.16, 3.6, 0.12), white, 0, 1.45, -2.6, 0, 0, s * 0.7));
  g.add(mesh(new THREE.BoxGeometry(2.6, 0.18, 0.12), white, 0, 2.86, -2.6));
  g.add(mesh(new THREE.BoxGeometry(1, 0.8, 0.1), white, 0, 4.9, -2.72));
  return g;
}

function silo() {
  const g = group(mesh(new THREE.CylinderGeometry(1.2, 1.2, 6, 18), mat("#b8c4d4"), 0, 3, 0));
  for (const y of [1.5, 3, 4.5]) g.add(mesh(new THREE.TorusGeometry(1.21, 0.05, 6, 24), mat("#7d8899"), 0, y, 0, Math.PI / 2));
  g.add(mesh(new THREE.SphereGeometry(1.25, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat("#e8463a"), 0, 6, 0));
  return g;
}

function windmill() {
  const g = group(mesh(new THREE.CylinderGeometry(1, 1.6, 6, 8), mat("#f4ead8"), 0, 3, 0));
  g.add(mesh(new THREE.ConeGeometry(1.25, 1.6, 8), mat("#a0522d"), 0, 6.8, 0));
  g.add(mesh(new THREE.BoxGeometry(0.8, 1.2, 0.1), mat("#8b5a2b"), 0, 0.6, -1.5));
  const sails = new THREE.Group();
  sails.position.set(0, 5.6, -1.25);
  for (let k = 0; k < 4; k++) {
    const arm = new THREE.Group();
    arm.rotation.z = k * (Math.PI / 2) + 0.4;
    arm.add(mesh(new THREE.BoxGeometry(0.16, 3.6, 0.08), mat("#6b4a2b"), 0, 1.9, 0));
    arm.add(mesh(new THREE.BoxGeometry(0.9, 2.8, 0.04), mat("#ffffff"), 0.5, 2.2, 0.02));
    sails.add(arm);
  }
  sails.add(mesh(new THREE.SphereGeometry(0.22, 10, 8), mat("#6b4a2b")));
  g.add(sails);
  return g;
}

function bale() {
  const straw = mat("#e9c46a");
  return group(
    mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.3, 20), straw, 0, 0.75, 0, 0, 0, Math.PI / 2),
    mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.32, 20), mat("#f4d58d"), 0, 0.75, 0, 0, 0, Math.PI / 2),
    mesh(new THREE.TorusGeometry(0.76, 0.03, 6, 24), mat("#c79a3a"), -0.3, 0.75, 0, 0, Math.PI / 2),
    mesh(new THREE.TorusGeometry(0.76, 0.03, 6, 24), mat("#c79a3a"), 0.3, 0.75, 0, 0, Math.PI / 2),
  );
}

function pumpkin() {
  const g = new THREE.Group();
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    const lobe = mesh(new THREE.SphereGeometry(0.42, 14, 10), mat(k % 2 ? "#ff8c1a" : "#f57c00"), Math.cos(a) * 0.3, 0.42, Math.sin(a) * 0.3);
    lobe.scale.set(0.8, 1, 0.8);
    g.add(lobe);
  }
  g.add(mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.3, 8), mat("#3f7d2c"), 0.03, 0.92, 0, 0, 0, 0.3));
  g.scale.setScalar(1.3);
  return g;
}

function milkCan() {
  const steel = mat("#d5dae2", { metalness: 0.5, roughness: 0.35 });
  return group(
    mesh(new THREE.CylinderGeometry(0.42, 0.42, 1, 18), steel, 0, 0.5, 0),
    mesh(new THREE.CylinderGeometry(0.22, 0.42, 0.35, 18), steel, 0, 1.17, 0),
    mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.2, 18), mat("#2f80ed"), 0, 1.44, 0),
    mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.12, 18), mat("#2f80ed"), 0, 0.75, 0),
  );
}

function sailboat() {
  const g = group(mesh(new THREE.BoxGeometry(1.4, 0.6, 4), mat("#ffffff"), 0, 0.3, 0));
  g.add(mesh(new THREE.BoxGeometry(1.42, 0.16, 4.02), mat("#2f80ed"), 0, 0.5, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.2), mat("#8b5a2b"), 0, 2.6, 0));
  const shape = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0, 3.6), new THREE.Vector2(2, 0)]);
  const sail = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat("#e8463a", { side: THREE.DoubleSide }));
  sail.position.set(0.08, 0.9, 0);
  sail.rotation.y = Math.PI / 2 - 0.5;
  g.add(sail);
  return g;
}

function buoy() {
  return group(
    mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.7, 14), mat("#e8463a"), 0, 0.35, 0),
    mesh(new THREE.CylinderGeometry(0.3, 0.45, 0.5, 14), mat("#ffffff"), 0, 0.95, 0),
    mesh(new THREE.ConeGeometry(0.3, 0.6, 14), mat("#e8463a"), 0, 1.5, 0),
    mesh(new THREE.SphereGeometry(0.12, 8, 6), mat("#ffd23f", { emissive: "#ffd23f", emissiveIntensity: 0.8 }), 0, 1.85, 0),
  );
}

function sandcastle() {
  const sand = mat("#e8c27a");
  const dark = mat("#d4a85a");
  const g = group(mesh(new THREE.BoxGeometry(1.8, 0.7, 1.4), sand, 0, 0.35, 0), mesh(new THREE.BoxGeometry(1.1, 0.6, 0.9), dark, 0, 1, 0));
  for (const x of [-0.9, 0.9]) {
    g.add(mesh(new THREE.CylinderGeometry(0.32, 0.36, 1.3, 10), sand, x, 0.65, -0.3));
    g.add(mesh(new THREE.ConeGeometry(0.36, 0.5, 10), dark, x, 1.55, -0.3));
  }
  g.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8), mat("#555555"), 0, 1.7, 0));
  g.add(mesh(new THREE.BoxGeometry(0.4, 0.25, 0.02), mat("#e8463a"), 0.2, 1.95, 0));
  return g;
}

function beachBall() {
  const g = new THREE.Group();
  const cols = ["#e8463a", "#ffffff", "#ffd23f", "#ffffff", "#2f80ed", "#ffffff"];
  cols.forEach((c, k) => g.add(mesh(new THREE.SphereGeometry(0.7, 8, 14, (k * Math.PI) / 3, Math.PI / 3), mat(c, { flatShading: false, roughness: 0.4 }), 0, 0.7, 0, 0.5, 0, 0.3)));
  return g;
}

function surfboard() {
  const board = mesh(new THREE.CapsuleGeometry(0.32, 1.7, 4, 12), mat("#2ab7ca", { roughness: 0.4 }), 0, 1.15, 0);
  board.scale.set(1, 1, 0.22);
  const stripe = mesh(new THREE.BoxGeometry(0.1, 2.2, 0.16), mat("#ffd23f"), 0, 1.15, 0);
  return group(board, stripe, mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.15, 12), mat("#e8c27a"), 0, 0.07, 0));
}

function lifeguard() {
  const wood = mat("#ffffff");
  const g = new THREE.Group();
  for (const x of [-0.8, 0.8]) for (const z of [-0.8, 0.8]) g.add(mesh(new THREE.BoxGeometry(0.15, 2.4, 0.15), wood, x, 1.2, z));
  g.add(mesh(new THREE.BoxGeometry(2, 1.3, 2), mat("#e8463a"), 0, 3, 0));
  g.add(mesh(new THREE.BoxGeometry(1.2, 0.6, 0.05), mat("#9fd7ff"), 0, 3.2, -1.02));
  const r = roof(2.4, 2.4, 0.8, mat("#ffffff"));
  r.position.y = 3.65;
  g.add(r);
  g.add(mesh(new THREE.BoxGeometry(0.6, 0.06, 2.2), wood, 0, 1.2, -1.6, -0.9));
  return g;
}

function beachHut(color = "#7ad7ff") {
  const g = group(mesh(new THREE.BoxGeometry(2.2, 2.2, 2), mat(color), 0, 1.1, 0));
  for (let k = 0; k < 4; k++) g.add(mesh(new THREE.BoxGeometry(0.22, 2.2, 0.04), mat("#ffffff"), -0.75 + k * 0.5, 1.1, -1.02));
  const r = roof(2.6, 2.4, 1, mat("#e8463a"));
  r.position.y = 2.2;
  g.add(r);
  g.add(mesh(new THREE.BoxGeometry(0.7, 1.4, 0.06), mat("#8b5a2b"), 0, 0.7, -1.05));
  return g;
}

export const WORLD_PROCS = {
  barn,
  silo,
  windmill,
  bale,
  pumpkin,
  milkCan,
  sailboat,
  buoy,
  sandcastle,
  beachBall,
  surfboard,
  lifeguard,
  beachHut: () => beachHut("#7ad7ff"),
  beachHutPink: () => beachHut("#ff9ec7"),
};
