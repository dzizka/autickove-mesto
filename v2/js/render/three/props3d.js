// Race scenery and obstacles in 3D (part 24, DESIGN-v2 §14): small models built from shapes
// where no Kenney model fits (snowman, ice block, barrel, satellite, crystals, snow poles, the
// start gate), and changes made to any model before its picture is taken: snow on top, a
// colour tint, lit windows at night. Sizes of the built models are in metres.

import * as THREE from "three";
import { WORLD_PROCS } from "./props3d-world.js";

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, flatShading: true, ...extra });
const mesh = (geo, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
  const o = new THREE.Mesh(geo, m);
  o.position.set(x, y, z);
  o.rotation.set(rx, ry, rz);
  return o;
};

function snowman() {
  const g = new THREE.Group();
  const white = mat("#ffffff", { roughness: 0.95 });
  g.add(mesh(new THREE.SphereGeometry(0.62, 18, 14), white, 0, 0.55, 0));
  g.add(mesh(new THREE.SphereGeometry(0.44, 18, 14), white, 0, 1.38, 0));
  g.add(mesh(new THREE.SphereGeometry(0.31, 16, 12), white, 0, 1.98, 0));
  g.add(mesh(new THREE.ConeGeometry(0.07, 0.34, 10), mat("#ff7a1a"), 0, 2.0, -0.42, -Math.PI / 2));
  const coal = mat("#222222");
  for (const x of [-0.11, 0.11]) g.add(mesh(new THREE.SphereGeometry(0.045, 8, 6), coal, x, 2.08, -0.27));
  for (const y of [1.25, 1.45, 1.65]) g.add(mesh(new THREE.SphereGeometry(0.05, 8, 6), coal, 0, y, -0.43));
  g.add(mesh(new THREE.TorusGeometry(0.33, 0.07, 8, 20), mat("#e8463a"), 0, 1.72, 0, Math.PI / 2));
  const hat = new THREE.Group();
  hat.add(mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.05, 20), coal, 0, 0, 0));
  hat.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.36, 20), coal, 0, 0.2, 0));
  hat.position.set(0, 2.24, 0);
  g.add(hat);
  return g;
}

function iceBlock() {
  const g = new THREE.Group();
  const ice = mat("#bfe9ff", { transparent: true, opacity: 0.92, roughness: 0.2, metalness: 0.05, emissive: "#3a7fb0", emissiveIntensity: 0.25 });
  g.add(mesh(new THREE.BoxGeometry(1.6, 1.3, 1.3), ice, 0, 0.65, 0));
  g.add(mesh(new THREE.BoxGeometry(0.9, 0.7, 0.9), ice, 0.55, 1.6, 0.1, 0, 0.4));
  g.add(mesh(new THREE.BoxGeometry(1.64, 0.12, 1.34), mat("#ffffff"), 0, 1.33, 0));
  return g;
}

function snowball() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.IcosahedronGeometry(0.85, 2), mat("#ffffff", { roughness: 1 }), 0, 0.8, 0));
  g.add(mesh(new THREE.IcosahedronGeometry(0.4, 1), mat("#eaf3ff", { roughness: 1 }), 0.7, 0.3, -0.3));
  return g;
}

function barrel() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.3, 20), mat("#2f80ed", { flatShading: false }), 0, 0.65, 0));
  for (const y of [0.3, 1.0]) g.add(mesh(new THREE.TorusGeometry(0.51, 0.04, 6, 24), mat("#1f5fb8"), 0, y, 0, Math.PI / 2));
  g.add(mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 20), mat("#5aa0ff"), 0, 1.31, 0));
  // a reflective stripe so it shows at night
  g.add(mesh(new THREE.CylinderGeometry(0.505, 0.505, 0.16, 20, 1, true), mat("#ffffff", { emissive: "#ffffff", emissiveIntensity: 0.4 }), 0, 0.65, 0));
  return g;
}

function satellite() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), mat("#c7ccd6", { metalness: 0.4 }), 0, 1.1, 0));
  const panel = mat("#2f5fd0", { emissive: "#1b3a8f", emissiveIntensity: 0.4, metalness: 0.3, roughness: 0.4 });
  for (const s of [-1, 1]) {
    g.add(mesh(new THREE.BoxGeometry(1.3, 0.55, 0.05), panel, s * 1.15, 1.1, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5), mat("#888888"), s * 0.45, 1.1, 0, 0, 0, Math.PI / 2));
  }
  const dish = mesh(new THREE.SphereGeometry(0.35, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat("#ffffff", { side: THREE.DoubleSide }), 0, 1.6, 0);
  g.add(dish);
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.7), mat("#888888"), 0, 0.35, 0));
  g.add(mesh(new THREE.SphereGeometry(0.07, 8, 6), mat("#ff3df2", { emissive: "#ff3df2", emissiveIntensity: 1 }), 0, 1.95, 0));
  return g;
}

function crystal(colors = ["#00e5ff", "#ff3df2", "#b98cff"], solid = false) {
  const g = new THREE.Group();
  const spikes = [[0, 0, 1.9, 0], [0.45, 0.15, 1.2, 0.35], [-0.4, -0.1, 1.0, -0.3], [0.1, -0.4, 0.8, 0.2]];
  spikes.forEach(([x, z, h, tilt], i) => {
    const c = colors[i % colors.length];
    const m = mat(c, { emissive: c, emissiveIntensity: solid ? 0.25 : 0.7, roughness: 0.3, metalness: 0.1, transparent: !solid, opacity: solid ? 1 : 0.9 });
    g.add(mesh(new THREE.ConeGeometry(0.28 + h * 0.08, h, 6), m, x, h / 2, z, 0, 0, tilt));
  });
  if (solid) g.add(mesh(new THREE.DodecahedronGeometry(0.6, 0), mat("#5b4a7a"), 0, 0.3, 0));
  return g;
}

function snowPole() {
  const g = new THREE.Group();
  for (let k = 0; k < 6; k++) g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 8), mat(k % 2 ? "#ffffff" : "#e8463a"), 0, 0.15 + k * 0.3, 0));
  return g;
}

function glowPost() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.4, 8), mat("#3a2a70"), 0, 0.7, 0));
  g.add(mesh(new THREE.SphereGeometry(0.2, 12, 8), mat("#7df9ff", { emissive: "#7df9ff", emissiveIntensity: 1.2 }), 0, 1.5, 0));
  return g;
}

const BALLOONS = ["#e8463a", "#ffd23f", "#2f80ed", "#3ebd4a", "#ff7eb6", "#9b51e0"];

/** The start and finish gate over the road, `lanes` lanes wide (3.6 m each). */
function gate(lanes = 3, finish = true) {
  const g = new THREE.Group();
  const half = (lanes * 3.6) / 2 + 1.1;
  const H = 5.6;
  const red = mat("#e8463a");
  const white = mat("#ffffff");
  for (const s of [-1, 1]) {
    for (let k = 0; k < 7; k++) g.add(mesh(new THREE.CylinderGeometry(0.42, 0.42, H / 7, 16), k % 2 ? white : red, s * half, (k + 0.5) * (H / 7), 0));
    g.add(mesh(new THREE.CylinderGeometry(0.62, 0.7, 0.3, 16), mat("#555b66"), s * half, 0.15, 0));
    // a bunch of balloons on top of each pillar
    BALLOONS.forEach((c, i) => {
      const a = (i / BALLOONS.length) * Math.PI * 2;
      g.add(mesh(new THREE.SphereGeometry(0.38, 14, 10), mat(c, { roughness: 0.35 }), s * half + Math.cos(a) * 0.45, H + 0.9 + Math.sin(a * 2) * 0.25, Math.sin(a) * 0.45));
    });
  }
  // the banner: chequered for the finish, green with arrows for the start
  const cv = document.createElement("canvas");
  cv.width = 512;
  cv.height = 64;
  const c = cv.getContext("2d");
  if (finish) {
    for (let x = 0; x < 32; x++) for (let y = 0; y < 4; y++) ((c.fillStyle = (x + y) % 2 ? "#111" : "#fff"), c.fillRect(x * 16, y * 16, 16, 16));
  } else {
    c.fillStyle = "#3ebd4a";
    c.fillRect(0, 0, 512, 64);
    c.fillStyle = "#ffffff";
    for (let x = 24; x < 512; x += 64) (c.beginPath(), c.moveTo(x, 12), c.lineTo(x + 28, 32), c.lineTo(x, 52), c.lineTo(x + 10, 32), c.fill());
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const banner = mesh(new THREE.BoxGeometry(half * 2 + 0.6, 1.1, 0.3), [mat("#cccccc"), mat("#cccccc"), mat("#cccccc"), mat("#cccccc"), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 })], 0, H - 0.35, 0);
  g.add(banner);
  return g;
}

const PROCS = {
  snowman,
  iceBlock,
  snowball,
  barrel,
  satellite,
  crystal: () => crystal(),
  crystalRock: () => crystal(["#8f5bd8", "#b98cff"], true),
  snowPole,
  glowPost,
  gate: (arg) => gate(Number(arg) || 3, true),
  startGate: (arg) => gate(Number(arg) || 3, false),
  ...WORLD_PROCS, // Farm and Beach (part 25)
};

/** A built model for "proc:<name>[:<arg>]", or null. */
export function buildProc(path) {
  const [, name, arg] = path.split(":");
  const make = PROCS[name];
  if (!make) return null;
  const g = make(arg);
  g.traverse((o) => o.isMesh && (o.castShadow = true));
  return g;
}

/** Clone the materials once, so a change does not reach the shared cached model. */
function ownMaterials(root) {
  root.traverse((o) => {
    if (o.isMesh && !o.userData.ownMat) {
      o.material = Array.isArray(o.material) ? o.material.map((m) => m.clone()) : o.material.clone();
      o.userData.ownMat = true;
    }
  });
}
const eachMat = (root, fn) => root.traverse((o) => o.isMesh && (Array.isArray(o.material) ? o.material : [o.material]).forEach(fn));

/** Mix every colour `k` of the way towards `hex` (desert sand, space purple). */
export function tint(root, hex, k = 0.5) {
  ownMaterials(root);
  const c = new THREE.Color(hex);
  eachMat(root, (m) => m.color?.lerp(c, k));
}

// Nature Kit colours are bluish teal; a child's forest is green
const FRESH = { leafsGreen: "#58b947", leafsDark: "#2f8a43", grass: "#6cc04b", leafsFall: "#f2994a", woodBark: "#a0673e", woodBarkDark: "#7a4e2d" };
export function freshen(root) {
  ownMaterials(root);
  eachMat(root, (m) => FRESH[m.name] && m.color.set(FRESH[m.name]));
}

/** Snow on everything that faces up: a white skin over the upward faces (roofs, trees, rocks). */
export function addSnow(root, minUp = 0.5) {
  root.updateMatrixWorld(true);
  const pts = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const n = new THREE.Vector3();
  const box = new THREE.Box3().setFromObject(root);
  const lift = 0.012 * box.getSize(new THREE.Vector3()).length();
  root.traverse((o) => {
    if (!o.isMesh || o.userData.snow) return;
    const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry;
    const pos = geo.attributes.position;
    for (let i = 0; i + 2 < pos.count; i += 3) {
      a.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      b.fromBufferAttribute(pos, i + 1).applyMatrix4(o.matrixWorld);
      c.fromBufferAttribute(pos, i + 2).applyMatrix4(o.matrixWorld);
      n.subVectors(b, a).cross(c.clone().sub(a)).normalize();
      if (n.y < minUp) continue;
      for (const p of [a, b, c]) pts.push(p.x, p.y + lift, p.z);
    }
  });
  if (!pts.length) return;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  geo.computeVertexNormals();
  const cap = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.95, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  cap.userData.snow = true;
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  cap.applyMatrix4(inv);
  root.add(cap);
}

const glowMaps = new Map();
/** Night: the light-blue window glass of the Kenney city textures glows warm yellow. */
export function litWindows(root) {
  ownMaterials(root);
  eachMat(root, (m) => {
    const img = m.map?.image;
    if (!img?.width) return;
    let tex = glowMaps.get(img);
    if (!tex) {
      const cv = document.createElement("canvas");
      cv.width = img.width;
      cv.height = img.height;
      const g = cv.getContext("2d", { willReadFrequently: true });
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, cv.width, cv.height);
      const p = d.data;
      for (let i = 0; i < p.length; i += 4) {
        const [r, gg, b] = [p[i], p[i + 1], p[i + 2]];
        const glass = (b > 230 && gg > 210 && r > 180 && r < 225) || (Math.abs(r - 103) < 6 && Math.abs(gg - 148) < 6 && Math.abs(b - 217) < 6);
        [p[i], p[i + 1], p[i + 2]] = glass ? [255, 214, 110] : [0, 0, 0];
      }
      g.putImageData(d, 0, 0);
      tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.flipY = m.map.flipY;
      glowMaps.set(img, tex);
    }
    m.emissive = new THREE.Color("#ffffff");
    m.emissiveMap = tex;
    m.emissiveIntensity = 1.4;
  });
}

/** Light for a mood: "day" (default), "night" (dim and blue), "space" (purple). */
export const MOODS = {
  day: { hemi: 1, sun: 1, color: "#ffffff" },
  night: { hemi: 0.32, sun: 0.28, color: "#9fb0ff" },
  space: { hemi: 0.6, sun: 0.7, color: "#c9b0ff" },
};
