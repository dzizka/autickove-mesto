// Car paint for the 3D car (part 15a). Kenney models colour every face from one shared palette
// texture (8 × 4 cells). The car's paint is the body's most used coloured cell: those triangles
// get their own material with the chosen colour and pattern, everything else keeps the texture.

import * as THREE from "three";

/** The palette cell a triangle samples. */
const cellOf = (u, v) => Math.min(7, Math.floor(u * 8)) + 8 * Math.min(3, Math.floor(v * 4));
const PAINT_CELLS = new Set([9, 10, 11, 12, 13, 14, 15, 22]); // coloured cells + white (police, ambulance)
const WHITE_CELL = 22;

/** Pattern ids in the order the shader knows them (data/tuning.js "pattern"). */
const PATTERNS = ["none", "stripes", "checker", "dots", "flames", "stars", "zigzag", "hearts", "camo"];
const SPECIALS = { rainbow: 1, galaxy: 2, gold: 3 };

const splitCache = new WeakMap();

/** Split a body geometry into { keep, paint } (cached per source geometry). */
export function splitPaint(geometry) {
  if (splitCache.has(geometry)) return splitCache.get(geometry);
  const geo = geometry.index ? geometry.toNonIndexed() : geometry;
  const uv = geo.attributes.uv;
  const cellAt = (i) => cellOf((uv.getX(i) + uv.getX(i + 1) + uv.getX(i + 2)) / 3, (uv.getY(i) + uv.getY(i + 1) + uv.getY(i + 2)) / 3);
  const count = new Map();
  for (let i = 0; i < uv.count; i += 3) {
    const c = cellAt(i);
    if (PAINT_CELLS.has(c)) count.set(c, (count.get(c) || 0) + 1);
  }
  const coloured = [...count.entries()].filter(([c]) => c !== WHITE_CELL).sort((a, b) => b[1] - a[1])[0];
  const paintCell = coloured && coloured[1] > uv.count / 3 / 12 ? coloured[0] : WHITE_CELL;
  const keep = [];
  const paint = [];
  for (let i = 0; i < uv.count; i += 3) (cellAt(i) === paintCell ? paint : keep).push(i);
  const pick = (list) => {
    const g = new THREE.BufferGeometry();
    for (const [name, attr] of Object.entries(geo.attributes)) {
      const arr = new attr.array.constructor(list.length * 3 * attr.itemSize);
      list.forEach((start, k) => {
        for (let j = 0; j < 3; j++) for (let s = 0; s < attr.itemSize; s++) arr[(k * 3 + j) * attr.itemSize + s] = attr.array[(start + j) * attr.itemSize + s];
      });
      g.setAttribute(name, new THREE.BufferAttribute(arr, attr.itemSize));
    }
    return g;
  };
  const out = { keep: pick(keep), paint: pick(paint) };
  splitCache.set(geometry, out);
  return out;
}

const FRAGMENT_HEAD = `#include <common>
varying vec3 vObj;
uniform vec3 uMin; uniform vec3 uMax; uniform int uKind; uniform int uPat;
vec3 hue(float h){ return clamp(abs(mod(h*6.0+vec3(0,4,2),6.0)-3.0)-1.0,0.0,1.0); }
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
float blobs(vec2 p){ return sin(p.x*7.0+sin(p.y*5.0)*1.7)*sin(p.y*6.0+sin(p.x*4.0)*1.3); }`;

// n = position across the body, 0..1 on every axis (x: width, y: height, z: length)
const FRAGMENT_PAINT = `#include <color_fragment>
vec3 n = (vObj - uMin) / max(uMax - uMin, vec3(1e-4));
float t = n.z;
if (uKind == 1) diffuseColor.rgb = hue(t);
if (uKind == 2) { diffuseColor.rgb = mix(vec3(0.08,0.06,0.2), vec3(0.45,0.36,1.0), 0.5+0.5*sin(t*9.0)); if (hash(floor(n.zy*vec2(60.0,30.0))) > 0.96) diffuseColor.rgb = vec3(1.0); }
if (uKind == 3) diffuseColor.rgb = mix(vec3(1.0,0.82,0.25), vec3(1.0,0.95,0.6), 0.5+0.5*sin(t*14.0+n.y*6.0));
vec3 ink = dot(diffuseColor.rgb, vec3(0.3,0.59,0.11)) > 0.6 ? vec3(0.12) : vec3(1.0);
float cx = abs(n.x - 0.5);
vec2 cell = fract(n.zy*vec2(8.0,5.0)) - 0.5;
float r = length(cell);
float a = atan(cell.y, cell.x);
if (uPat == 1 && cx < 0.16 && cx > 0.06) diffuseColor.rgb = ink;
if (uPat == 2 && mod(floor(n.z*10.0)+floor(n.y*6.0)+floor(n.x*6.0), 2.0) < 1.0) diffuseColor.rgb = mix(diffuseColor.rgb, ink, 0.85);
if (uPat == 3 && r < 0.2) diffuseColor.rgb = ink;
float fl = 0.45 + 0.18*sin(n.z*40.0) * (1.0 - n.z);
if (uPat == 4 && n.y < fl && n.z > 0.35) diffuseColor.rgb = n.y < fl - 0.12 ? vec3(1.0,0.45,0.1) : vec3(1.0,0.85,0.2);
if (uPat == 5 && r < 0.3 * (0.45 + 0.55 * pow(abs(cos(2.5 * (a - 1.5708))), 3.0))) diffuseColor.rgb = vec3(1.0,0.86,0.2);
if (uPat == 6 && abs(n.y - 0.45 - 0.08 * abs(fract(n.z*12.0) - 0.5) * 4.0 + 0.08) < 0.035) diffuseColor.rgb = ink;
vec2 hp = cell * 3.2 + vec2(0.0, 0.25);
float hv = pow(dot(hp, hp) - 1.0, 3.0) - hp.x*hp.x*hp.y*hp.y*hp.y;
if (uPat == 7 && hv < 0.0) diffuseColor.rgb = vec3(1.0,0.3,0.55);
float b = blobs(n.zy*vec2(3.0,2.0) + n.x);
if (uPat == 8) diffuseColor.rgb = b > 0.35 ? vec3(0.29,0.35,0.16) : b < -0.35 ? vec3(0.18,0.23,0.11) : b > 0.0 ? vec3(0.48,0.42,0.23) : vec3(0.42,0.5,0.25);`;

/**
 * Paint material for a body with the given bounding box.
 * color: tuning colour item ({ value, special }) or a hex string; pattern: pattern id.
 */
export function paintMaterial(box, color, pattern = "none") {
  const special = typeof color === "object" ? color?.special : null;
  const kind = SPECIALS[special] || 0;
  const hex = typeof color === "string" ? color : color?.value || "#ff5a5f";
  const pat = Math.max(0, PATTERNS.indexOf(pattern));
  const m = new THREE.MeshStandardMaterial({ color: kind ? "#ffffff" : hex, roughness: kind === 3 ? 0.3 : 0.45, metalness: kind === 3 ? 0.35 : 0.05 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uMin = { value: box.min };
    sh.uniforms.uMax = { value: box.max };
    sh.uniforms.uKind = { value: kind };
    sh.uniforms.uPat = { value: pat };
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vObj;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvObj = position;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", FRAGMENT_HEAD).replace("#include <color_fragment>", FRAGMENT_PAINT);
  };
  m.customProgramCacheKey = () => `car-paint-${kind}-${pat}`;
  return m;
}
