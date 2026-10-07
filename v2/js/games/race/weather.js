// Weather particles over the race view (DESIGN-v2 §4.1): leaves, sand, snow and space dust.
// Screen-space, so they work the same for every road shape.

/** Weather particles live here; each gets all coordinates at creation. */
export function createWeather(track, L) {
  const kind = track.weather;
  const count = { leaves: 14, sand: 26, snow: 40, stars: 60, night: 0, none: 0 }[kind] ?? 0;
  const parts = [];
  for (let i = 0; i < count; i++) {
    parts.push({ x: Math.random() * L.w, y: Math.random() * L.h, v: 0.5 + Math.random(), r: 1 + Math.random() * 2.5, phase: Math.random() * 6.28 });
  }
  return { kind, parts };
}

/** Weather on top of everything except the HUD. */
export function drawWeather(g, L, weather, dt, speed) {
  const { kind, parts } = weather;
  if (!parts.length) return;
  const v = Math.max(0, Number.isFinite(speed) ? speed : 0);
  for (const p of parts) {
    if (kind === "snow") {
      p.y += (40 + v * 6) * p.v * dt;
      p.x += Math.sin(p.y / 40 + p.phase) * 0.6;
      g.fillStyle = "rgba(255,255,255,.9)";
      g.beginPath();
      g.arc(p.x, p.y, p.r + 1, 0, 6.29);
      g.fill();
    } else if (kind === "leaves") {
      p.y += (30 + v * 5) * p.v * dt;
      p.x += Math.sin(p.y / 30 + p.phase) * 1.2;
      g.fillStyle = p.phase > 3 ? "#e8a33d" : "#c4572e";
      g.fillRect(p.x, p.y, p.r * 3, p.r * 2);
    } else if (kind === "sand") {
      p.x += 140 * p.v * dt;
      p.y += (v * 4) * dt;
      g.fillStyle = "rgba(255,236,190,.55)";
      g.fillRect(p.x, p.y, p.r * 6, p.r);
    } else if (kind === "stars") {
      p.y += v * 8 * p.v * dt;
      g.fillStyle = "rgba(180,240,255,.8)";
      g.fillRect(p.x, p.y, 1.5, p.r * 4 + v * 0.3);
    }
    if (p.y > L.h + 10) {
      p.y = -10;
      p.x = Math.random() * L.w;
    }
    if (p.x > L.w + 20) p.x = -20;
  }
}
