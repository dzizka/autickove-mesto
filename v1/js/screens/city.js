/* ---------- living city ---------- */
const DECO = { gas: "⛽", wash: "🫧", shop: "🛒", fact: "📦", hosp: "🚑", stad: "🏆", air: "✈️", ufo: "⭐" };
function phase() {
  const d = new Date(),
    h = d.getHours() + d.getMinutes() / 60;
  return h >= 21 || h < 6 ? "night" : h < 9 ? "morning" : h < 17 ? "day" : h < 19 ? "evening" : "dusk";
}
const SKY = {
  night: ["#1b2550", "#3d4f8f", "#2c3a73", "#4f6199"],
  morning: ["#ffb38a", "#ffe3c2", "#ffd9c2", "#fff1e3"],
  day: ["#7cc8ff", "#d8f0ff", "#bfe4ff", "#eaf6ff"],
  evening: ["#ff9a76", "#ffd6a0", "#ffc9a8", "#ffe9d6"],
  dusk: ["#5b4a9e", "#f08a8a", "#c9b6ee", "#f6dbe6"],
};
function applySky() {
  const p = phase(),
    r = document.documentElement.style,
    k = SKY[p];
  r.setProperty("--sky", k[2]);
  r.setProperty("--sky2", k[3]);
  r.setProperty("--onsky", p === "night" ? "#ffffff" : "#15314d");
  r.setProperty("--onsky2", p === "night" ? "#d6def5" : "#48678a");
}
let cityAnim = null;
function stopCity() {
  if (cityAnim) {
    cancelAnimationFrame(cityAnim.raf);
    cityAnim = null;
  }
}
function startCity() {
  stopCity();
  const wrap = $("#street"),
    c = $("#cityC");
  if (!c) return;
  const SW = Math.max(wrap.clientWidth, BLDS.length * 118 + 40),
    SH = 260,
    dpr = Math.min(2, devicePixelRatio || 1),
    G0 = 182;
  c.width = SW * dpr;
  c.height = SH * dpr;
  c.style.width = SW + "px";
  c.style.height = SH + "px";
  const x = c.getContext("2d");
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  const slotX = (i) => 40 + 59 + i * 118;
  const cars = S.cars.slice(-6).map((e, i) => {
    const def = CARS.find((q) => q.e === e),
      img = new Image();
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(carSide(def, tuneOf(e)));
    return { e, img, dir: i % 2 ? -1 : 1, x: Math.random() * SW, v: 45 + Math.random() * 55, hop: 0 };
  });
  const clouds = Array.from({ length: 6 }, () => ({
    x: Math.random() * SW,
    y: 18 + Math.random() * 50,
    s: 26 + Math.random() * 22,
    v: 5 + Math.random() * 9,
  }));
  const stars = Array.from({ length: 50 }, () => [Math.random() * SW, Math.random() * 120, Math.random()]);
  let last = performance.now(),
    t = 0;
  const st = { raf: 0 };
  const em = (e, px, py, s) => {
    x.fillStyle = "#000";
    x.font = `${s}px ${EMO}`;
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(e, px, py);
  };
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    const p = phase(),
      k = SKY[p],
      night = p === "night";
    const g = x.createLinearGradient(0, 0, 0, G0);
    g.addColorStop(0, k[0]);
    g.addColorStop(1, k[1]);
    x.fillStyle = g;
    x.fillRect(0, 0, SW, SH);
    if (night) {
      stars.forEach(([sx, sy, a]) => {
        x.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + a * 9));
        x.fillStyle = "#fff";
        x.fillRect(sx, sy, 2, 2);
      });
      x.globalAlpha = 1;
    }
    const d = new Date(),
      h = d.getHours() + d.getMinutes() / 60;
    if (!night) {
      const f = Math.max(0, Math.min(1, (h - 6) / 15));
      const sx = Math.min(SW, wrap.clientWidth) * (0.08 + 0.84 * f) + wrap.scrollLeft,
        sy = 110 - Math.sin(Math.PI * f) * 85;
      const sg = x.createRadialGradient(sx, sy, 6, sx, sy, 60);
      sg.addColorStop(0, "rgba(255,240,170,.9)");
      sg.addColorStop(1, "rgba(255,240,170,0)");
      x.fillStyle = sg;
      x.beginPath();
      x.arc(sx, sy, 60, 0, 7);
      x.fill();
      x.fillStyle = "#ffd23f";
      x.beginPath();
      x.arc(sx, sy, 22, 0, 7);
      x.fill();
    } else {
      const mx = wrap.scrollLeft + Math.min(SW, wrap.clientWidth) * 0.8;
      x.fillStyle = "#fff6d0";
      x.beginPath();
      x.arc(mx, 48, 20, 0, 7);
      x.fill();
      x.fillStyle = k[0];
      x.beginPath();
      x.arc(mx + 9, 42, 18, 0, 7);
      x.fill();
    }
    clouds.forEach((cl) => {
      cl.x += cl.v * dt;
      if (cl.x > SW + 60) cl.x = -60;
      x.globalAlpha = night ? 0.35 : 0.95;
      em("☁️", cl.x, cl.y, cl.s);
    });
    x.globalAlpha = 1;
    x.fillStyle = night ? "#2d5a3c" : "#8fd17a";
    for (let i = 0; i < SW; i += 140) {
      x.beginPath();
      x.ellipse(i + 70, G0 + 4, 110, 46, 0, Math.PI, 0);
      x.fill();
    }
    x.fillStyle = night ? "#2f6b3e" : "#5fbf5a";
    x.fillRect(0, G0 - 4, SW, 8);
    x.fillStyle = night ? "#8890a0" : "#d7dde6";
    x.fillRect(0, G0 + 4, SW, 20);
    x.fillStyle = night ? "#6d7586" : "#bcc5d2";
    for (let i = 0; i < SW; i += 26) x.fillRect(i, G0 + 4, 2, 20);
    x.fillStyle = night ? "#262b36" : "#3b4453";
    x.fillRect(0, G0 + 24, SW, SH - G0 - 24);
    x.fillStyle = "rgba(255,255,255,.7)";
    for (let i = 0; i < SW; i += 48) x.fillRect(i, G0 + 24 + (SH - G0 - 24) / 2 - 2, 26, 4);
    BLDS.forEach((b, i) => {
      const cx = slotX(i),
        l = bL(b.id),
        lock = S.lvl < b.u;
      if (l) {
        const s = 50 + l * 4.6,
          by = G0 - s * 0.46;
        if (night) {
          const gg = x.createRadialGradient(cx, by, 4, cx, by, s * 0.9);
          gg.addColorStop(0, "rgba(255,220,120,.55)");
          gg.addColorStop(1, "rgba(255,220,120,0)");
          x.fillStyle = gg;
          x.beginPath();
          x.arc(cx, by, s * 0.9, 0, 7);
          x.fill();
        }
        x.fillStyle = "rgba(0,0,0,.15)";
        x.beginPath();
        x.ellipse(cx, G0, s * 0.45, 6, 0, 0, 7);
        x.fill();
        em(b.e, cx, by, s);
        const nd = Math.floor(l / 3);
        for (let k = 0; k < nd; k++) {
          const dxp = k % 2 ? 1 : -1,
            off = s * 0.55 + Math.floor(k / 2) * 16;
          if (b.id === "air") {
            em("✈️", cx + Math.sin(t * 0.8 + k) * 50, by - s * 0.6 - k * 12 + Math.cos(t * 0.8 + k) * 6, 20);
          } else if (b.id === "ufo" || b.id === "wash") {
            em(DECO[b.id], cx + dxp * off, by - s * 0.3 + Math.sin(t * 2 + k) * 6, 18);
          } else em(DECO[b.id], cx + dxp * off, G0 - 11, 20);
        }
        if (l >= 10) {
          x.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4);
          em("✨", cx + s * 0.4, by - s * 0.4, 18);
          x.globalAlpha = 1;
        }
        x.fillStyle = "#7b5cff";
        x.strokeStyle = "#fff";
        x.lineWidth = 2;
        x.beginPath();
        x.arc(cx + s * 0.4, by + s * 0.32, 11, 0, 7);
        x.fill();
        x.stroke();
        x.fillStyle = "#fff";
        x.font = '800 12px "Baloo 2",sans-serif';
        x.fillText(l, cx + s * 0.4, by + s * 0.33);
        const sv = Math.floor(bStore(b));
        if (sv >= 1) {
          const full = sv >= Math.floor(bCap(b)),
            bob = Math.sin(t * 3 + i) * 4,
            py = by - s * 0.62 + bob,
            txt = fmt(sv);
          x.font = '800 13px "Baloo 2",sans-serif';
          const tw = x.measureText(txt).width + 30;
          x.fillStyle = "#fff";
          x.strokeStyle = full ? "#ff5a4a" : "#d99a00";
          x.lineWidth = full ? 3 : 2;
          rr(x, cx - tw / 2, py - 12, tw, 24, 12);
          x.fill();
          x.stroke();
          em("🪙", cx - tw / 2 + 12, py, 13);
          x.font = '800 13px "Baloo 2",sans-serif';
          x.fillStyle = "#15314d";
          x.textAlign = "left";
          x.fillText(txt, cx - tw / 2 + 21, py + 1);
          x.textAlign = "center";
        }
      } else if (lock) {
        x.globalAlpha = 0.55;
        em("🔒", cx, G0 - 28, 30);
        x.globalAlpha = 1;
        x.fillStyle = night ? "#d6def5" : "#48678a";
        x.font = '700 11px "Baloo 2",sans-serif';
        x.fillText("level " + b.u, cx, G0 - 6);
      } else {
        x.setLineDash([5, 4]);
        x.strokeStyle = night ? "#d6def5" : "#48678a";
        x.lineWidth = 2;
        rr(x, cx - 44, G0 - 76, 88, 70, 12);
        x.stroke();
        x.setLineDash([]);
        em("🏗️", cx, G0 - 48, 34 + Math.sin(t * 3) * 2);
        x.fillStyle = night ? "#fff" : "#15314d";
        x.font = '800 11px "Baloo 2",sans-serif';
        x.fillText("🪙 " + fmt(b.p), cx, G0 - 16);
      }
      x.fillStyle = "#15314d";
      x.font = '800 11px "Baloo 2",sans-serif';
      x.fillText(b.n, cx, G0 + 14);
    });
    cars.forEach((cr, i) => {
      cr.x += cr.dir * cr.v * dt;
      if (cr.dir > 0 && cr.x > SW + 20) cr.x = -100;
      if (cr.dir < 0 && cr.x < -100) cr.x = SW + 20;
      cr.hop = Math.max(0, cr.hop - dt);
      const cw = 80,
        ch = 45,
        cy = (cr.dir > 0 ? G0 + 16 : G0 + 34) - Math.sin((cr.hop * Math.PI) / 0.4) * (cr.hop > 0 ? 14 : 0);
      if (!cr.img.complete) return;
      x.save();
      if (cr.dir < 0) {
        x.translate(cr.x + cw, cy);
        x.scale(-1, 1);
        x.drawImage(cr.img, 0, 0, cw, ch);
      } else x.drawImage(cr.img, cr.x, cy, cw, ch);
      x.restore();
      if (night) {
        x.fillStyle = "rgba(255,246,176,.35)";
        x.beginPath();
        const fx = cr.dir > 0 ? cr.x + cw - 4 : cr.x + 4;
        x.moveTo(fx, cy + ch * 0.5);
        x.lineTo(fx + cr.dir * 60, cy + ch * 0.3);
        x.lineTo(fx + cr.dir * 60, cy + ch * 0.8);
        x.fill();
      }
    });
  }
  const safe = guardFrame(frame);
  function cloop(now) {
    safe(now);
    if (cityAnim === st) st.raf = requestAnimationFrame(cloop);
  }
  cityAnim = st;
  st.raf = requestAnimationFrame(cloop);
  c.onclick = (e) => {
    const r = c.getBoundingClientRect(),
      px = ((e.clientX - r.left) * SW) / r.width,
      py = ((e.clientY - r.top) * SH) / r.height;
    const car = cars.find(
      (cr) =>
        py > G0 + 10 &&
        px > cr.x &&
        px < cr.x + 80 &&
        Math.abs(py - ((cr.dir > 0 ? G0 + 16 : G0 + 34) + 22)) < 24,
    );
    if (car) {
      car.hop = 0.4;
      horn(tuneOf(car.e).hn);
      return;
    }
    const i = Math.round((px - 99) / 118),
      b = BLDS[i];
    if (!b || Math.abs(px - slotX(i)) > 56 || py > G0 + 24) return;
    if (bL(b.id)) collect(b.id, { x: e.clientX, y: e.clientY });
    else if (S.lvl >= b.u) build(b.id, null);
    else {
      toast(`🔒 ${b.n} sa odomkne na leveli ${b.u}`);
      sfx.bad();
    }
  };
}
function ptOf(el) {
  if (!el) return null;
  if (el.getBoundingClientRect) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  return el;
}
function flyCoins(from, n = 6) {
  const p = ptOf(from);
  if (!p || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const tr = $("#coinP").getBoundingClientRect(),
    tx = tr.left + 20,
    ty = tr.top + tr.height / 2;
  for (let i = 0; i < n; i++) {
    const e = document.createElement("span");
    e.className = "fcoin";
    e.textContent = "🪙";
    e.style.left = p.x + "px";
    e.style.top = p.y + "px";
    document.body.appendChild(e);
    const mx = (Math.random() - 0.5) * 130,
      my = -40 - Math.random() * 70;
    const a = e.animate(
      [
        { transform: "translate(-50%,-50%) scale(.6)" },
        { transform: `translate(${mx}px,${my}px) translate(-50%,-50%) scale(1.15)`, offset: 0.35 },
        { transform: `translate(${tx - p.x}px,${ty - p.y}px) translate(-50%,-50%) scale(.6)` },
      ],
      { duration: 650 + i * 80, easing: "ease-in", fill: "forwards" },
    );
    a.onfinish = () => {
      e.remove();
      bump("#coinP");
      if (i % 2 === 0) tone(1200 + i * 50, 0.04, "square", 0.03);
    };
  }
}
