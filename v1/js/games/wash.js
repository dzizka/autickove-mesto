/* ---------- WASH ---------- */
GAMEFN.wash = (v) => {
  v.innerHTML =
    gHead("Umyváreň", `<span class="gstat">Čisté: <b id="wp">0</b> %</span>`) +
    `<div class="stage wash" id="stage"><canvas id="wc"></canvas><canvas id="wm"></canvas></div><p class="hint">Drhni prstom po aute, kým nebude čisté.</p>`;
  say("Auto je celé od blata. Drhni prstom, kým nebude čisté.");
  const st = $("#stage"),
    c1 = $("#wc"),
    c2 = $("#wm"),
    x1 = c1.getContext("2d"),
    x2 = c2.getContext("2d", { willReadFrequently: true });
  const Z = Math.max(200, Math.min(st.clientWidth, st.clientHeight) - 10),
    dpr = Math.min(2, devicePixelRatio || 1);
  [c1, c2].forEach((c) => {
    c.width = Z * dpr;
    c.height = Z * dpr;
    c.style.width = Z + "px";
    c.style.height = Z + "px";
  });
  x1.scale(dpr, dpr);
  x2.scale(dpr, dpr);
  x1.textAlign = "center";
  x1.textBaseline = "middle";
  const cim = new Image();
  cim.onload = () => x1.drawImage(cim, Z * 0.05, Z * 0.22, Z * 0.9, (Z * 0.9 * 90) / 160);
  cim.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(carSide(CARS[carIdx()], tuneOf(S.car)));
  const browns = ["#7a4a1f", "#8b5a2b", "#6b3e17", "#9c6b3a", "#5e3613"];
  for (let i = 0; i < 90; i++) {
    x2.fillStyle = pick(browns);
    x2.beginPath();
    x2.arc(
      Z / 2 + (Math.random() - 0.5) * Z * 0.68,
      Z / 2 + (Math.random() - 0.5) * Z * 0.42,
      Z * (0.04 + Math.random() * 0.07),
      0,
      7,
    );
    x2.fill();
  }
  for (let i = 0; i < 8; i++) {
    x2.fillStyle = pick(browns);
    const px = Z * 0.2 + Math.random() * Z * 0.6,
      py = Z * 0.5 + Math.random() * Z * 0.1;
    x2.fillRect(px, py, Z * 0.025, Z * (0.08 + Math.random() * 0.1));
  }
  const count = () => {
    const d = x2.getImageData(0, 0, c2.width, c2.height).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 32) if (d[i] > 40) n++;
    return n;
  };
  const total = count();
  let last = null,
    moves = 0,
    t0 = performance.now(),
    done = false;
  const r0 = Z * 0.07 * (1 + upL("sponge") * 0.4) * (1 + abil("wash"));
  x2.globalCompositeOperation = "destination-out";
  x2.lineCap = "round";
  x2.lineWidth = r0 * 2;
  function scrub(e) {
    if (done) return;
    const r = c2.getBoundingClientRect(),
      p = { x: ((e.clientX - r.left) * Z) / r.width, y: ((e.clientY - r.top) * Z) / r.height };
    x2.beginPath();
    if (last) {
      x2.moveTo(last.x, last.y);
      x2.lineTo(p.x, p.y);
      x2.stroke();
    }
    x2.beginPath();
    x2.arc(p.x, p.y, r0, 0, 7);
    x2.fill();
    last = p;
    if (++moves % 3 === 0) {
      const b = document.createElement("span");
      b.className = "bubble";
      b.style.setProperty("--s", R(14, 30) + "px");
      const sr = st.getBoundingClientRect();
      b.style.left = e.clientX - sr.left - 10 + "px";
      b.style.top = e.clientY - sr.top - 10 + "px";
      st.appendChild(b);
      setTimeout(() => b.remove(), 900);
    }
    if (moves % 8 === 0) {
      const pct = Math.round((1 - count() / total) * 100);
      txt("#wp", Math.min(100, pct));
      if (moves % 24 === 0) tone(R(700, 900), 0.04, "sine", 0.04);
      if (pct >= 92) {
        done = true;
        txt("#wp", 100);
        c2.style.transition = "opacity .5s";
        c2.style.opacity = 0;
        sfx.ok();
        x1.font = `${Z * 0.12}px ${EMO}`;
        [
          [0.2, 0.25],
          [0.8, 0.3],
          [0.5, 0.15],
          [0.25, 0.75],
          [0.78, 0.72],
        ].forEach(([a, b]) => x1.fillText("✨", Z * a, Z * b));
        const sec = (performance.now() - t0) / 1000,
          s = sec < 20 ? 3 : sec < 40 ? 2 : 1;
        setTimeout(() => finish("wash", 25, s, 12), 900);
      }
    }
  }
  c2.addEventListener("pointerdown", (e) => {
    last = null;
    c2.setPointerCapture(e.pointerId);
    scrub(e);
  });
  c2.addEventListener("pointermove", (e) => {
    if (e.buttons || e.pointerType === "touch") scrub(e);
  });
  c2.addEventListener("pointerup", () => (last = null));
  G = {
    stop() {
      done = true;
    },
  };
};
