/* ---------- RACE ---------- */
GAMEFN.race = (v) => trackPicker(v);
function trackPicker(v) {
  v.className = "gameview scroll";
  v.innerHTML =
    gHead("Preteky") +
    `<p class="hint" style="margin:0 0 10px">Vyber si trať. Na ťažších tratiach dostaneš viac mincí.</p><div class="tracks">${TRACKS.map(
      (T) => {
        const own = S.tracks.includes(T.id),
          b = S.tBest[T.id];
        return `<button class="track ${own ? "" : "tlock"}" data-tr="${T.id}" style="--tg:${T.side};--tr:${T.road};--te:${T.edge}"><span class="te">${T.e}</span><span class="tn"><b>${T.n}</b><small>mince ×${T.m}</small></span><span class="tb">${own ? (b ? `<span class="medal">${["", "🥇", "🥈", "🥉", "🏁"][b]}</span>` : "") + '<span class="go">Jazdiť ▶</span>' : `🔒 🪙 ${fmt(T.p)}`}</span></button>`;
      },
    ).join("")}</div>`;
  say("Vyber si trať.");
  v.querySelectorAll("[data-tr]").forEach(
    (b) =>
      (b.onclick = () => {
        const T = TRACKS.find((x) => x.id === b.dataset.tr);
        if (!S.tracks.includes(T.id)) {
          if (S.coins < T.p) return poor(b);
          S.coins -= T.p;
          S.tracks.push(T.id);
          hud();
          save();
          sfx.win();
          confetti();
          toast(`${T.e} Trať ${T.n} je odomknutá!`);
          say(`Trať ${T.n} je odomknutá!`);
          return trackPicker(v);
        }
        sfx.tap();
        raceRun(v, T);
      }),
  );
  G = { stop() {} };
}
function raceRun(v, T) {
  if (S.cheatShort) T = { ...T, len: T.len * 0.2 };
  v.className = "gameview";
  v.innerHTML =
    gHead(`${T.e} ${T.n}`, `<span class="gstat">🪙 <b id="rC">0</b></span>`) +
    `<div class="stage" id="stage"><canvas id="rc"></canvas></div><p class="hint">Ťukni vľavo alebo vpravo od auta. Dobehni súperov a príď do cieľa prvý!</p>`;
  say("Ťukaj vľavo a vpravo. Predbehni súperov a zbieraj mince!");
  const st = $("#stage"),
    cv = $("#rc"),
    x = cv.getContext("2d");
  let W,
    H,
    dpr,
    dark = null,
    dx = null;
  function size() {
    dpr = Math.min(2, devicePixelRatio || 1);
    W = st.clientWidth;
    H = st.clientHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cv.style.width = W + "px";
    cv.style.height = H + "px";
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (T.dark) {
      dark = dark || document.createElement("canvas");
      dark.width = cv.width;
      dark.height = cv.height;
      dx = dark.getContext("2d");
      dx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }
  size();
  const def = CARS[carIdx()],
    tu = tuneOf(S.car),
    pcol = carColor(def, tu),
    vmax = 0.95 * T.sp * (1 + abil("speed"));
  let trail = [],
    trailT = 0,
    weather = [];
  let d = 0,
    vel = 0,
    lane = 1,
    cx = null,
    coins = 0,
    fuel = 1,
    shield = upL("shield") + abil("shield"),
    hitT = 0,
    spin = 0,
    boostT = 0,
    magT = 0,
    jumpT = 0,
    shake = 0,
    state = "count",
    cdT = 3.99,
    t = 0,
    raf,
    last = performance.now(),
    done = false,
    place = 4,
    banner = null,
    parts = [];
  const fuelRate = (1 / ((T.len / vmax) * 0.72 * (1 + upL("tank") * 0.3))) * (1 - abil("fuel"));
  const rcols = shuf(
    ["#ff8c1a", "#9b5de5", "#2ec27e", "#3a86ff", "#ff6fb5", "#2a2d36", "#ffd23f"].filter((c) => c !== pcol),
  );
  const rdefs = CARS.filter((c) => ["car", "suv", "pickup", "formula"].includes(c.k));
  const rivals = [1, 2, 3].map((i) => ({
    d: 0.35 * i,
    lane: i % 3,
    v: vmax * (0.76 + 0.05 * i + T.riv),
    def: pick(rdefs),
    col: rcols[i],
    cx: null,
    lt: R(2, 4),
    slow: 0,
  }));
  let objs = [],
    nextW = 1.6,
    patN = 0;
  const rx = () => W * 0.14,
    rw = () => W * 0.72,
    lw = () => rw() / 3,
    laneX = (i) => rx() + lw() * (i + 0.5),
    carY = () => H * 0.78,
    cw = () => Math.min(lw() * 0.52, H * 0.075),
    sy = (wy) => carY() - (wy - d) * H;
  const pLen = () => carLen(def, cw());
  function coinLine(l, w, n) {
    for (let i = 0; i < n; i++) objs.push({ k: "coin", wy: w + i * 0.075, lane: l });
  }
  function pattern(w) {
    patN++;
    const r = Math.random(),
      ln = R(0, 2),
      o2 = (ln + R(1, 2)) % 3;
    if (patN % 7 === 0 || (fuel < 0.45 && r < 0.25)) {
      objs.push({ k: "fuel", wy: w, lane: ln });
      coinLine(o2, w, 3);
      return;
    }
    if (r < 0.06 && patN > 4) {
      objs.push({ k: "ramp", wy: w });
      const cl = R(0, 2);
      for (let i = 0; i < 6; i++) objs.push({ k: "coin", wy: w + 0.12 + i * 0.065, lane: cl, air: true });
      nextW += 0.6;
      return;
    }
    if (r < 0.14) {
      objs.push({ k: "pw", wy: w, lane: ln, e: pick(["turbo", "turbo", "shield", "magnet", "rain"]) });
      coinLine(o2, w, 3);
      return;
    }
    if (r < 0.23) {
      objs.push({
        k: "traffic",
        wy: w + 0.3,
        lane: ln,
        v: vmax * 0.42,
        def: pick(CARS.filter((c) => ["car", "suv", "van", "pickup", "bus"].includes(c.k))),
        col: pick(["#b8c2cf", "#8d99a8", "#d9c7a3", "#a3c4d9", "#c9b3d9"]),
      });
      coinLine(o2, w, 4);
      return;
    }
    if (r < 0.28 && patN > 6) {
      objs.push({ k: "traffic", police: true, wy: w + 0.3, lane: ln, v: vmax * 0.5, def: CARS[3], lt: 1.2 });
      return;
    }
    if (r < 0.34) {
      objs.push({ k: "cross", wy: w, fx: Math.random() < 0.5 ? -0.15 : 1.15, e: T.cross });
      return;
    }
    if (r < 0.62) {
      objs.push({ k: "obs", wy: w, lane: ln, e: pick(T.obs) });
      coinLine(o2, w - 0.1, R(3, 5));
      return;
    }
    if (r < 0.74 && t > 12) {
      objs.push({ k: "obs", wy: w, lane: ln, e: pick(T.obs) }, { k: "obs", wy: w, lane: o2, e: pick(T.obs) });
      return;
    }
    coinLine(ln, w, R(4, 6 + Math.floor(upL("turbo") / 2)));
  }
  function spawn() {
    while (nextW < d + 1.8 && nextW < T.len - 0.7) {
      pattern(nextW);
      nextW += 0.42 + Math.random() * 0.3 - Math.min(0.1, t * 0.002);
    }
  }
  function pop(px, py, cols, n = 10) {
    for (let i = 0; i < n; i++)
      parts.push({
        x: px,
        y: py,
        vx: (Math.random() - 0.5) * 260,
        vy: (Math.random() - 0.8) * 260,
        l: 0.7,
        c: pick(cols),
      });
  }
  function say2(txt) {
    banner = { t: txt, l: 1.3 };
  }
  function power(e) {
    sfx.win();
    if (e === "turbo") {
      boostT = 3;
      say2("TURBO!");
    }
    if (e === "shield") {
      shield++;
      say2("ŠTÍT!");
    }
    if (e === "magnet") {
      magT = 7;
      say2("MAGNET!");
    }
    if (e === "rain") {
      for (let l = 0; l < 3; l++) coinLine(l, d + 0.7, 6);
      say2("MINCOVÝ DÁŽĎ!");
    }
  }
  const move = (dir) => {
    if (state === "fin") return;
    lane = Math.max(0, Math.min(2, lane + dir));
    sfx.tap();
  };
  st.addEventListener("pointerdown", (e) => {
    const r = cv.getBoundingClientRect();
    move(e.clientX - r.left < (cx ?? W / 2) ? -1 : 1);
  });
  const kd = (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      move(-1);
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      move(1);
    }
  };
  addEventListener("keydown", kd);
  addEventListener("resize", size);
  const isHaz = (o) => o.k === "obs" || o.k === "traffic" || o.k === "cross";
  function update(dt) {
    t += dt;
    rivals.forEach((r) => {
      if (r.cx == null) r.cx = laneX(r.lane);
    });
    if (cx == null) cx = laneX(lane);
    if (state === "count") {
      const p = Math.ceil(cdT);
      cdT -= dt;
      if (cdT <= 0) {
        state = "go";
        tone(880, 0.35, "square", 0.09);
        setTimeout(() => horn(tu.hn), 250);
        say2("ŠTART!");
      } else if (Math.ceil(cdT) !== p && p <= 4) tone(440, 0.15, "square", 0.08);
      return;
    }
    let target = vmax * (boostT > 0 ? 1.6 : 1) * (hitT > 0 ? 0.3 : 1) * (fuel <= 0 ? 0.45 : 1);
    if (state === "fin") target = 0.15;
    vel += (target - vel) * Math.min(1, dt * (hitT > 0 ? 6 : 1.3));
    d += vel * dt;
    if (state === "go") fuel = Math.max(0, fuel - fuelRate * dt * (boostT > 0 ? 0.4 : 1));
    if (state === "go" && fuel <= 0 && !banner) say2("Došiel benzín! Hľadaj ⛽");
    hitT -= dt;
    boostT -= dt;
    magT -= dt;
    jumpT -= dt;
    spin = Math.max(0, spin - dt);
    shake = Math.max(0, shake - dt);
    cx += (laneX(lane) - cx) * Math.min(1, dt * (T.slip ? 4.5 : 14));
    rivals.forEach((r) => {
      r.d += r.v * dt * (r.slow > 0 ? 0.4 : 1);
      r.slow -= dt;
      r.lt -= dt;
      const bad = (l) => objs.some((o) => isHaz(o) && o.lane === l && o.wy > r.d - 0.1 && o.wy - r.d < 0.55);
      if (bad(r.lane) || r.lt <= 0) {
        const opts = [0, 1, 2].filter((l) => Math.abs(l - r.lane) === 1 && !bad(l));
        if (opts.length) r.lane = pick(opts);
        r.lt = R(2, 5);
      }
      r.cx += (laneX(r.lane) - r.cx) * Math.min(1, dt * 5);
    });
    for (const o of objs) {
      if (o.k === "traffic") {
        o.wy += o.v * dt;
        if (o.police) {
          o.lt -= dt;
          if (o.lt <= 0) {
            o.lane = Math.max(0, Math.min(2, o.lane + pick([-1, 1])));
            o.lt = 1.6;
          }
        }
      }
      if (o.k === "cross" && o.wy - d < 1.15) {
        if (!o.dir) o.dir = o.fx < 0 ? 1 : -1;
        o.fx += o.dir * 0.3 * dt;
      }
      if (o.lane != null) {
        if (o.cx == null) o.cx = laneX(o.lane);
        o.cx += (laneX(o.lane) - o.cx) * Math.min(1, dt * 5);
      }
    }
    const L = pLen(),
      sz = lw() * 0.3,
      near = (o, ext) => Math.abs(o.wy - d) * H < L / 2 + ext,
      inX = (o) =>
        o.k === "cross"
          ? Math.abs(rx() + rw() * o.fx - cx) < lw() * 0.45
          : o.lane === lane && Math.abs(cx - laneX(lane)) < lw() * 0.5;
    for (const o of objs) {
      if (o.gone) continue;
      if (o.k === "coin") {
        if (magT > 0 && o.wy - d < 0.6 && o.wy - d > -0.05) o.lane = lane;
        else if (
          (upL("magnet") || abil("magnet")) &&
          Math.abs(o.lane - lane) === 1 &&
          o.wy - d < 0.22 &&
          o.wy - d > 0
        )
          o.lane = lane;
        if (o.air && jumpT <= 0) continue;
        if (inX(o) && near(o, sz * 0.5)) {
          o.gone = 1;
          coins++;
          sfx.coin();
          pop(cx, carY() - L / 2, ["#ffc533", "#fff3b8"], 4);
          txt("#rC", coins);
        }
        continue;
      }
      if (o.k === "ramp") {
        if (d >= o.wy && !o.used) {
          o.used = 1;
          jumpT = 1.15;
          seq([300, 450, 600], 80, 0.15, "sine", 0.1);
          say2("HOP!");
        }
        continue;
      }
      const ext = o.k === "traffic" ? carLen(o.def, cw()) / 2 : sz * 0.6;
      if (!inX(o) || !near(o, ext)) continue;
      if (o.k === "fuel") {
        o.gone = 1;
        fuel = Math.min(1, fuel + 0.5);
        sfx.ok();
        say2("BENZÍN!");
        continue;
      }
      if (o.k === "pw") {
        o.gone = 1;
        power(o.e);
        continue;
      }
      if (jumpT > 0 || o.hit) continue;
      if (boostT > 0) {
        o.gone = 1;
        sfx.coin();
        pop(o.cx ?? cx, sy(o.wy), ["#ff5a4a", "#ffc533", "#fff"], 14);
        continue;
      }
      o.hit = 1;
      if (shield > 0) {
        shield--;
        o.gone = 1;
        sfx.ok();
        pop(cx, carY(), ["#7fd0ff", "#fff"], 14);
        say2("Štít ťa ochránil!");
        continue;
      }
      hitT = 0.9;
      spin = 0.9;
      shake = 0.35;
      sfx.bad();
      pop(cx, carY() - L / 2, ["#9aa3b2", "#ffc533"], 10);
    }
    rivals.forEach((r) => {
      if (Math.abs(r.cx - cx) < lw() * 0.6 && r.d > d && (r.d - d) * H < L * 1.05) {
        if (boostT > 0) {
          r.slow = 1.2;
          r.lane = Math.max(0, Math.min(2, r.lane + (r.lane === 0 ? 1 : r.lane === 2 ? -1 : pick([-1, 1]))));
        } else vel = Math.min(vel, r.v * 0.92);
      }
    });
    objs = objs.filter((o) => !o.gone && o.wy > d - 0.5);
    parts.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 500 * dt;
      p.l -= dt;
    });
    parts = parts.filter((p) => p.l > 0);
    if (tu.tr && tu.tr !== "none" && state !== "count" && jumpT <= 0) {
      trailT -= dt;
      if (trailT <= 0) {
        trailT = tu.tr === "rainbow" ? 0.02 : tu.tr === "smoke" ? 0.05 : 0.07;
        const tl = L / 2;
        trail.push({
          k: tu.tr,
          x: cx + (tu.tr === "rainbow" ? 0 : (Math.random() - 0.5) * cw() * 0.5),
          y: carY() + tl,
          vx: tu.tr === "sparks" ? (Math.random() - 0.5) * 160 : (Math.random() - 0.5) * 20,
          vy: tu.tr === "sparks" ? 60 + Math.random() * 80 : 0,
          l: tu.tr === "rainbow" ? 0.6 : 0.9,
          r: Math.random(),
        });
      }
    }
    trail.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt + vel * H * dt;
      p.l -= dt;
    });
    trail = trail.filter((p) => p.l > 0 && p.y < H + 40);
    if (T.id === "snow" || T.id === "forest" || T.id === "night") {
      if (weather.length < (T.id === "snow" ? 70 : T.id === "night" ? 18 : 10) && Math.random() < 0.5)
        weather.push({
          x: Math.random() * W,
          y: T.id === "night" ? Math.random() * H * 0.6 : -10,
          v: T.id === "snow" ? 40 + Math.random() * 60 : 30 + Math.random() * 30,
          s: Math.random(),
          ph: Math.random() * 6,
        });
      weather.forEach((f) => {
        f.y += (T.id === "night" ? vel * H * 0.5 + Math.cos(t * 2 + f.ph) * 12 : f.v + vel * H * 0.15) * dt;
        f.x += Math.sin(t * 2 + f.ph) * (T.id === "night" ? 30 : 20) * dt;
      });
      weather = weather.filter((f) => f.y < H + 20 && f.y > -30);
    }
    if (banner) {
      banner.l -= dt;
      if (banner.l <= 0) banner = null;
    }
    if (state === "go" && d >= T.len) {
      state = "fin";
      place = 1 + rivals.filter((r) => r.d >= d).length;
      say2(place === 1 ? "VÍŤAZSTVO!" : "CIEĽ!");
      sfx.win();
      if (place === 1) confetti();
      setTimeout(endRace, 1600);
    }
  }
  function checker(wy) {
    const y = sy(wy);
    if (y < -30 || y > H + 30) return;
    const n = 12,
      s = rw() / n;
    for (let r = 0; r < 2; r++)
      for (let i = 0; i < n; i++) {
        x.fillStyle = (i + r) % 2 ? "#fff" : "#15314d";
        x.fillRect(rx() + i * s, y - s + (r * s) / 1.5, s, s / 1.5);
      }
  }
  function coin(px, py, r, sp = 1) {
    const sx = Math.max(0.15, Math.abs(sp));
    x.fillStyle = "#d99a00";
    x.beginPath();
    x.ellipse(px, py, r * sx, r, 0, 0, 7);
    x.fill();
    x.fillStyle = "#ffc533";
    x.beginPath();
    x.ellipse(px, py, r * 0.78 * sx, r * 0.78, 0, 0, 7);
    x.fill();
    if (sx > 0.5) {
      x.fillStyle = "#fff3b8";
      x.beginPath();
      x.arc(px - r * 0.25 * sx, py - r * 0.25, r * 0.2, 0, 7);
      x.fill();
    }
  }
  function emoji(e, px, py, s) {
    x.fillStyle = "#000";
    x.font = `${s}px ${EMO}`;
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(e, px, py);
  }
  function draw() {
    objs.forEach((o) => {
      if (o.lane != null && o.cx == null) o.cx = laneX(o.lane);
    });
    const L = pLen(),
      w = cw(),
      sz = lw() * 0.3,
      lamps = [];
    x.save();
    if (shake > 0) x.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
    x.fillStyle = T.side;
    x.fillRect(-10, -10, W + 20, H + 20);
    if (T.space) {
      x.fillStyle = "#fff";
      for (let i = 0; i < 70; i++) {
        const px = (((i * 97) % 101) / 101) * W,
          py = ((((i * 53) % 103) / 103) * H + d * H * 0.25 * (1 + (i % 3))) % H;
        x.globalAlpha = 0.4 + (i % 3) * 0.25;
        x.fillRect(px, py, 2, 2);
      }
      x.globalAlpha = 1;
    } else {
      x.fillStyle = T.side2;
      const bs = 0.3;
      for (let k = Math.floor((d - 0.4) / bs); k < (d + 1.4) / bs; k++)
        if (k % 2) {
          const y = sy(k * bs);
          x.fillRect(0, y - bs * H, rx(), bs * H);
          x.fillRect(rx() + rw(), y - bs * H, W, bs * H);
        }
    }
    const step = 0.26;
    for (let k = Math.floor((d - 0.4) / step); k < (d + 1.4) / step; k++) {
      if (k < 0) continue;
      const y = sy(k * step),
        h = ((k * 2654435761) >>> 0) % 1000;
      const e = T.deco[h % T.deco.length],
        left = h % 2 === 0;
      const s = Math.min(rx() * 0.75, 46);
      emoji(e, left ? rx() / 2 : W - rx() / 2, y, s * (0.8 + (h % 5) * 0.08));
      if (T.dark && k % 2 === 0) {
        const lx = left ? W - rx() + 6 : rx() - 6;
        x.fillStyle = "#55606f";
        x.fillRect(lx - 2, y - 30, 4, 30);
        x.fillStyle = "#fff3b0";
        x.beginPath();
        x.arc(lx, y - 32, 5, 0, 7);
        x.fill();
        lamps.push([lx, y - 28]);
      }
    }
    x.fillStyle = T.road;
    x.fillRect(rx(), -10, rw(), H + 20);
    if (T.space) {
      x.shadowColor = T.edge;
      x.shadowBlur = 12;
      x.fillStyle = T.edge;
      x.globalAlpha = 0.7 + 0.3 * Math.sin(t * 4);
      x.fillRect(rx(), -10, 5, H + 20);
      x.fillRect(rx() + rw() - 5, -10, 5, H + 20);
      x.globalAlpha = 1;
      x.shadowBlur = 0;
    } else {
      const ro = (d * H) % 36;
      for (let y = -36 + ro; y < H; y += 36) {
        x.fillStyle = T.id === "snow" ? "#3a86ff" : "#ff4d4d";
        x.fillRect(rx(), y, 8, 18);
        x.fillRect(rx() + rw() - 8, y, 8, 18);
        x.fillStyle = "#fff";
        x.fillRect(rx(), y + 18, 8, 18);
        x.fillRect(rx() + rw() - 8, y + 18, 8, 18);
      }
      x.fillStyle = "rgba(255,255,255,.04)";
      for (let i = 0; i < 3; i++) x.fillRect(rx() + lw() * (i + 0.5) - lw() * 0.18, -10, lw() * 0.36, H + 20);
    }
    x.fillStyle = T.lane;
    const off = (d * H) % 64;
    for (let i = 1; i < 3; i++) {
      const lx = rx() + lw() * i - 3;
      for (let y = -64 + off; y < H; y += 64) x.fillRect(lx, y, 6, 32);
    }
    checker(0.05);
    checker(T.len);
    for (const o of objs)
      if (o.k === "ramp") {
        const y = sy(o.wy);
        x.fillStyle = "#1d6fd1";
        x.fillRect(rx(), y - 0.5 * H, rw(), 0.38 * H);
        x.strokeStyle = "rgba(255,255,255,.6)";
        x.lineWidth = 3;
        for (let k = 0; k < 5; k++) {
          const yy = y - 0.5 * H + k * 0.08 * H + ((t * 40) % 20);
          x.beginPath();
          for (let xx = 0; xx <= rw(); xx += 10) x.lineTo(rx() + xx, yy + Math.sin(xx / 14 + t * 4) * 4);
          x.stroke();
        }
        const rh = 0.07 * H;
        for (let i = 0; i < 8; i++) {
          x.fillStyle = i % 2 ? "#15314d" : "#ffc533";
          x.fillRect(rx() + (i * rw()) / 8, y - rh, rw() / 8, rh);
        }
        x.fillStyle = "rgba(0,0,0,.2)";
        x.fillRect(rx(), y - rh, rw(), rh * 0.3);
      }
    const list = [...objs.filter((o) => o.k !== "ramp")].sort((a, b) => b.wy - a.wy);
    for (const o of list) {
      const y = sy(o.wy);
      if (y < -80 || y > H + 80) continue;
      const px = o.k === "cross" ? rx() + rw() * o.fx : o.cx;
      if (o.k === "coin") {
        if (o.air) {
          x.fillStyle = "rgba(0,0,0,.2)";
          x.beginPath();
          x.ellipse(px, y + 18, sz * 0.3, sz * 0.12, 0, 0, 7);
          x.fill();
          coin(px, y - 10, sz * 0.38);
        } else coin(px, y, sz * 0.34, Math.cos(t * 5 + o.wy * 7));
      } else if (o.k === "traffic") {
        x.save();
        x.translate(px, y);
        drawTop(x, o.def, {}, w, t, o.col || undefined);
        x.restore();
      } else if (o.k === "fuel") {
        x.fillStyle = "rgba(255,255,255,.35)";
        x.beginPath();
        x.arc(px, y, sz * 0.75, 0, 7);
        x.fill();
        emoji("⛽", px, y, sz * 1.1);
      } else if (o.k === "pw") {
        const g = x.createRadialGradient(px, y, 2, px, y, sz);
        g.addColorStop(0, "rgba(255,255,255,.9)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        x.fillStyle = g;
        x.beginPath();
        x.arc(px, y, sz * 1.05, 0, 7);
        x.fill();
        emoji(
          { turbo: "🚀", shield: "🛡️", magnet: "🧲", rain: "💰" }[o.e],
          px,
          y + Math.sin(t * 5) * 3,
          sz * 1.05,
        );
      } else emoji(o.e, px, y, sz * (o.k === "cross" ? 1.2 : 1.15));
    }
    rivals.forEach((r) => {
      const y = sy(r.d);
      if (y < -80 || y > H + 80) return;
      x.save();
      x.translate(r.cx, y);
      if (r.slow > 0) x.rotate(Math.sin(t * 20) * 0.2);
      drawTop(x, r.def, {}, w, t, r.col);
      x.restore();
    });
    trail.forEach((p) => {
      const a = Math.max(0, p.l / 0.9);
      x.globalAlpha = a;
      if (p.k === "smoke") {
        x.fillStyle = "#cfd6e0";
        x.beginPath();
        x.arc(p.x, p.y, 4 + (1 - a) * 14, 0, 7);
        x.fill();
      } else if (p.k === "sparks") {
        x.fillStyle = p.r < 0.5 ? "#ffd23f" : "#ff8c1a";
        x.fillRect(p.x - 2, p.y - 2, 4, 4);
      } else if (p.k === "rainbow") {
        const bw = w * 0.8;
        RAINBOW.forEach((c, i) => {
          x.fillStyle = c;
          x.fillRect(p.x - bw / 2 + (i * bw) / 6, p.y, bw / 6 + 0.5, 9);
        });
      } else {
        x.fillStyle = "#000";
        x.font = `${10 + (1 - a) * 8}px ${EMO}`;
        x.textAlign = "center";
        x.textBaseline = "middle";
        x.fillText(p.k === "stars" ? "⭐" : "💖", p.x, p.y);
      }
    });
    x.globalAlpha = 1;
    if (boostT > 0) {
      x.strokeStyle = "rgba(255,255,255,.55)";
      x.lineWidth = 2;
      for (let i = 0; i < 10; i++) {
        const lx = rx() + (((i * 73 + Math.floor(t * 30) * 17) % 100) / 100) * rw(),
          ly = ((i * 131 + t * 1400) % (H + 120)) - 60;
        x.beginPath();
        x.moveTo(lx, ly);
        x.lineTo(lx, ly + 50);
        x.stroke();
      }
    }
    const jp = jumpT > 0 ? Math.sin(Math.PI * (1 - jumpT / 1.15)) : 0;
    x.save();
    x.translate(cx, carY());
    if (jp) {
      x.fillStyle = "rgba(0,0,0,.25)";
      x.beginPath();
      x.ellipse(10, 10, w * 0.6, L * 0.45, 0, 0, 7);
      x.fill();
    }
    x.scale(1 + jp * 0.35, 1 + jp * 0.35);
    if (spin > 0) x.rotate(spin * Math.PI * 2.2);
    if (boostT > 0) {
      x.fillStyle = "rgba(255,197,51,.5)";
      x.beginPath();
      x.moveTo(-w * 0.4, L / 2);
      x.lineTo(0, L / 2 + L * (0.8 + Math.random() * 0.3));
      x.lineTo(w * 0.4, L / 2);
      x.fill();
    }
    drawTop(x, def, tu, w, t);
    if (shield > 0) {
      x.strokeStyle = "rgba(127,208,255,.85)";
      x.lineWidth = 3;
      x.beginPath();
      x.ellipse(0, 0, w * 0.85, L * 0.65, 0, 0, 7);
      x.stroke();
    }
    x.restore();
    parts.forEach((p) => {
      x.globalAlpha = Math.max(0, p.l / 0.7);
      x.fillStyle = p.c;
      x.fillRect(p.x - 3, p.y - 3, 6, 6);
    });
    x.globalAlpha = 1;
    weather.forEach((f) => {
      if (T.id === "snow") {
        x.fillStyle = "rgba(255,255,255,.9)";
        x.beginPath();
        x.arc(f.x, f.y, 1.5 + f.s * 2.5, 0, 7);
        x.fill();
      } else if (T.id === "forest") {
        x.fillStyle = "#000";
        x.font = `${12 + f.s * 8}px ${EMO}`;
        x.save();
        x.translate(f.x, f.y);
        x.rotate(t * 2 + f.ph);
        x.fillText(f.s < 0.5 ? "🍂" : "🍃", 0, 0);
        x.restore();
      }
    });
    x.restore();
    const vg = x.createRadialGradient(
      W / 2,
      H * 0.55,
      Math.min(W, H) * 0.35,
      W / 2,
      H * 0.55,
      Math.max(W, H) * 0.75,
    );
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,20,.28)");
    x.fillStyle = vg;
    x.fillRect(0, 0, W, H);
    if (T.dark && dx) {
      dx.globalCompositeOperation = "source-over";
      dx.clearRect(0, 0, W, H);
      dx.fillStyle = "rgba(6,10,30,.84)";
      dx.fillRect(0, 0, W, H);
      dx.globalCompositeOperation = "destination-out";
      const cone = (px, py, len, spread) => {
        const g = dx.createRadialGradient(px, py, 4, px, py - len * 0.4, len);
        g.addColorStop(0, "rgba(0,0,0,1)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        dx.fillStyle = g;
        dx.beginPath();
        dx.moveTo(px - w * 0.3, py);
        dx.lineTo(px - spread, py - len);
        dx.lineTo(px + spread, py - len);
        dx.lineTo(px + w * 0.3, py);
        dx.fill();
      };
      cone(cx, carY() - L / 2, H * 0.55, lw() * 1.1);
      const gc = dx.createRadialGradient(cx, carY(), 2, cx, carY(), L);
      gc.addColorStop(0, "rgba(0,0,0,1)");
      gc.addColorStop(1, "rgba(0,0,0,0)");
      dx.fillStyle = gc;
      dx.beginPath();
      dx.arc(cx, carY(), L, 0, 7);
      dx.fill();
      rivals.forEach((r) => {
        const y = sy(r.d);
        if (y > -50 && y < H + 50) cone(r.cx, y - L / 2, H * 0.3, lw() * 0.7);
      });
      lamps.forEach(([lx, ly]) => {
        const g = dx.createRadialGradient(lx, ly, 2, lx, ly, lw() * 1.1);
        g.addColorStop(0, "rgba(0,0,0,.95)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        dx.fillStyle = g;
        dx.beginPath();
        dx.arc(lx, ly, lw() * 1.1, 0, 7);
        dx.fill();
      });
      objs.forEach((o) => {
        if (o.k === "coin" || o.k === "pw" || o.k === "fuel") {
          const y = sy(o.wy),
            px = o.cx;
          if (y > -20 && y < H + 20) {
            const g = dx.createRadialGradient(px, y, 1, px, y, sz * 0.9);
            g.addColorStop(0, "rgba(0,0,0,.8)");
            g.addColorStop(1, "rgba(0,0,0,0)");
            dx.fillStyle = g;
            dx.beginPath();
            dx.arc(px, y, sz * 0.9, 0, 7);
            dx.fill();
          }
        }
      });
      x.drawImage(dark, 0, 0, W, H);
      weather.forEach((f) => {
        x.fillStyle = `rgba(255,240,120,${0.5 + 0.5 * Math.sin(t * 5 + f.ph)})`;
        x.beginPath();
        x.arc(f.x, f.y, 2.5, 0, 7);
        x.fill();
      });
    }
    hudDraw();
  }
  function hudDraw() {
    const bx = 14,
      bw = W - 28,
      by = 12;
    x.fillStyle = "rgba(21,49,77,.55)";
    rr(x, bx, by, bw, 14, 7);
    x.fill();
    const pr = (v) => bx + 7 + (bw - 14) * Math.min(1, v / T.len);
    x.fillStyle = "#ffc533";
    rr(x, bx, by, Math.max(14, pr(d) - bx + 7), 14, 7);
    x.fill();
    rivals.forEach((r) => {
      x.fillStyle = r.col;
      x.strokeStyle = "#fff";
      x.lineWidth = 2;
      x.beginPath();
      x.arc(pr(r.d), by + 7, 6, 0, 7);
      x.fill();
      x.stroke();
    });
    x.fillStyle = pcol;
    x.strokeStyle = "#15314d";
    x.lineWidth = 3;
    x.beginPath();
    x.arc(pr(d), by + 7, 9, 0, 7);
    x.fill();
    x.stroke();
    emoji("🏁", bx + bw - 4, by + 7, 18);
    const pos = state === "fin" ? place : 1 + rivals.filter((r) => r.d > d).length;
    x.fillStyle = "#fff";
    x.strokeStyle = "#15314d";
    x.lineWidth = 3;
    rr(x, 12, 36, 74, 50, 14);
    x.fill();
    x.stroke();
    x.fillStyle = "#15314d";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.font = '800 30px "Baloo 2",sans-serif';
    x.fillText(pos + ".", 40, 62);
    x.font = '700 11px "Baloo 2",sans-serif';
    x.fillText("miesto", 40, 79);
    emoji(["", "🥇", "🥈", "🥉", "🙂"][pos], 70, 52, 20);
    x.fillStyle = "#fff";
    x.strokeStyle = "#15314d";
    x.lineWidth = 3;
    rr(x, W - 112, 36, 100, 30, 12);
    x.fill();
    x.stroke();
    emoji("⛽", W - 96, 51, 16);
    x.fillStyle = "#e6eef7";
    rr(x, W - 82, 45, 62, 12, 6);
    x.fill();
    x.fillStyle = fuel > 0.3 ? "#2fb257" : Math.floor(t * 4) % 2 ? "#ff5a4a" : "#ffc533";
    rr(x, W - 82, 45, Math.max(6, 62 * fuel), 12, 6);
    x.fill();
    let ix = W - 24;
    const icon = (e, v) => {
      if (v) {
        emoji(e, ix, 84, 22);
        ix -= 28;
      }
    };
    icon("🛡️", shield > 0);
    icon("🚀", boostT > 0);
    icon("🧲", magT > 0);
    if (shield > 1) {
      x.font = "800 12px sans-serif";
      x.fillStyle = "#15314d";
      x.fillText("×" + shield, W - 10, 96);
    }
    if (state === "count") {
      const n = Math.ceil(cdT);
      x.fillStyle = "rgba(21,49,77,.85)";
      rr(x, W / 2 - 40, H * 0.3 - 75, 80, 150, 20);
      x.fill();
      [0, 1, 2].forEach((i) => {
        x.fillStyle = i < 4 - n ? "#ff4d4d" : "#4a2a2a";
        x.beginPath();
        x.arc(W / 2, H * 0.3 - 45 + i * 45, 18, 0, 7);
        x.fill();
      });
      x.font = '800 40px "Baloo 2",sans-serif';
      x.lineWidth = 6;
      x.strokeStyle = "#15314d";
      x.strokeText(n, W / 2, H * 0.3 + 110);
      x.fillStyle = "#fff";
      x.fillText(n, W / 2, H * 0.3 + 110);
    }
    if (banner) {
      x.globalAlpha = Math.min(1, banner.l * 2);
      x.font = `800 ${Math.min(44, W / 9)}px "Baloo 2",sans-serif`;
      x.lineWidth = 6;
      x.strokeStyle = "#15314d";
      x.strokeText(banner.t, W / 2, H * 0.42);
      x.fillStyle = "#ffc533";
      x.fillText(banner.t, W / 2, H * 0.42);
      x.globalAlpha = 1;
    }
  }
  function endRace() {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    S.tBest[T.id] = Math.min(S.tBest[T.id] || 9, place);
    track("raceCoins", coins);
    if (place === 1) {
      track("win");
      gst().wins++;
    }
    const bonus = [0, 30, 20, 10, 0][place],
      stars = place === 1 ? 3 : place === 2 ? 2 : 1;
    finish(
      "race",
      Math.max(5, (coins + bonus) * T.m * (1 + carIdx() * 0.1) * (1 + abil("raceCoins"))),
      stars,
      12 + coins / 2 + (4 - place) * 6,
      `<div class="place">${carSide(def, tu)}<div><b>${place}. miesto</b><span>${["", "🥇", "🥈", "🥉", "🏁"][place]}</span></div></div><p>Mince na ceste: ${coins}${bonus ? ` · bonus za miesto: ${bonus}` : ""}</p>`,
      place === 1 ? "Víťaz!" : place === 4 ? "Dobrá jazda!" : "Výborne!",
    );
  }
  const frame = guardFrame(
    (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      update(dt);
      if (state !== "count") spawn();
      draw();
    },
    () => {
      if (done) return;
      done = true;
      track("raceCoins", coins);
      addCoins(coins * T.m);
      stuckModal();
    },
  );
  function loop(now) {
    frame(now);
    if (!done) raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);
  G = {
    stop() {
      done = true;
      cancelAnimationFrame(raf);
      removeEventListener("keydown", kd);
      removeEventListener("resize", size);
    },
  };
}
