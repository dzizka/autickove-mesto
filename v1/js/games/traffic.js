/* ---------- KRIŽOVATKA ---------- */
GAMEFN.traffic = (v) => {
  v.className = "gameview";
  v.innerHTML =
    gHead(
      "Križovatka",
      `<span class="gstat" id="tl">❤️❤️❤️</span><span class="gstat">🚗 <b id="tp">0</b></span><span class="gstat">⏱ <b id="tt">60</b></span>`,
    ) +
    `<div class="stage" id="stage"><canvas id="tc"></canvas></div><p class="hint">Ťukni kamkoľvek a prepni semafor. Autá nesmú do seba naraziť!</p>`;
  say("Ťukni a prepni semafor. Pusti autá tak, aby do seba nenarazili.");
  const st = $("#stage"),
    cv = $("#tc"),
    x = cv.getContext("2d");
  let W, H;
  function size() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    W = st.clientWidth;
    H = st.clientHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cv.style.width = W + "px";
    cv.style.height = H + "px";
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  addEventListener("resize", size);
  let light = "h",
    cars = [],
    hearts = 3,
    passed = 0,
    time = 60,
    spH = 0.5,
    spV = 1.6,
    raf,
    last = performance.now(),
    t = 0,
    done = false,
    shake = 0,
    parts = [];
  const RW = () => Math.min(W, H) * 0.28,
    cw = () => RW() * 0.3,
    defs = CARS.filter((c) => ["car", "suv", "van", "pickup"].includes(c.k)),
    cols = ["#ff4d4d", "#3a86ff", "#ffd23f", "#2ec27e", "#ff8c1a", "#9b5de5", "#ff6fb5"];
  let nextL = null,
    yT = 0;
  const toggle = () => {
    if (done || nextL) return;
    nextL = light === "h" ? "v" : "h";
    light = "y";
    yT = 1.7;
    tone(440, 0.12, "square", 0.08);
  };
  st.addEventListener("pointerdown", toggle);
  const kd = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggle();
    }
  };
  addEventListener("keydown", kd);
  function spawn(dir) {
    const def = pick(defs),
      L = carLen(def, cw());
    const q = cars.filter((c) => c.dir === dir);
    const edge = dir === "h" ? -L : H + L;
    if (
      q.some((c) =>
        dir === "h"
          ? c.p - carLen(c.def, cw()) / 2 < edge + L + 14
          : c.p + carLen(c.def, cw()) / 2 > edge - L - 14,
      )
    )
      return;
    cars.push({ dir, p: edge, def, col: pick(cols), sp: H * (0.2 + Math.random() * 0.08), wait: 0, honk: 0 });
  }
  function rect(c) {
    const L = carLen(c.def, cw()),
      w = cw();
    return c.dir === "h"
      ? [c.p - L / 2, H / 2 + RW() / 4 - w / 2, L, w]
      : [W / 2 + RW() / 4 - w / 2, c.p - L / 2, w, L];
  }
  function update(dt) {
    t += dt;
    time -= dt;
    if (nextL) {
      yT -= dt;
      if (yT <= 0) {
        light = nextL;
        nextL = null;
        tone(light === "h" ? 660 : 520, 0.12, "square", 0.08);
      }
    }
    txt("#tt", Math.max(0, Math.ceil(time)));
    shake = Math.max(0, shake - dt);
    spH -= dt;
    spV -= dt;
    if (spH <= 0) {
      spawn("h");
      spH = 1.3 + Math.random() * 1.5;
    }
    if (spV <= 0) {
      spawn("v");
      spV = 1.3 + Math.random() * 1.5;
    }
    const bx0 = W / 2 - RW() / 2,
      bx1 = W / 2 + RW() / 2,
      by0 = H / 2 - RW() / 2,
      by1 = H / 2 + RW() / 2;
    ["h", "v"].forEach((dir) => {
      const q = cars.filter((c) => c.dir === dir).sort((a, b) => (dir === "h" ? b.p - a.p : a.p - b.p));
      q.forEach((c, i) => {
        const L = carLen(c.def, cw());
        let np = c.p + (dir === "h" ? 1 : -1) * c.sp * dt;
        if (dir === "h") {
          const front = c.p + L / 2,
            stop = bx0 - 8;
          if (light !== "h" && front <= stop + 1 && np + L / 2 > stop) np = stop - L / 2;
          if (i > 0) {
            const a = q[i - 1],
              lim = a.p - carLen(a.def, cw()) / 2 - 10 - L / 2;
            if (np > lim) np = Math.max(c.p, lim);
          }
        } else {
          const front = c.p - L / 2,
            stop = by1 + 8;
          if (light !== "v" && front >= stop - 1 && np - L / 2 < stop) np = stop + L / 2;
          if (i > 0) {
            const a = q[i - 1],
              lim = a.p + carLen(a.def, cw()) / 2 + 10 + L / 2;
            if (np < lim) np = Math.min(c.p, lim);
          }
        }
        c.wait = Math.abs(np - c.p) < 0.5 ? c.wait + dt : 0;
        if (c.wait > 4 && (c.honk -= dt) <= 0) {
          c.honk = 2;
          tone(310, 0.15, "square", 0.05);
        }
        c.p = np;
      });
    });
    const hs = cars.filter((c) => c.dir === "h"),
      vs = cars.filter((c) => c.dir === "v");
    for (const a of hs)
      for (const b of vs) {
        const [ax, ay, aw, ah] = rect(a),
          [bx, by, bw, bh] = rect(b);
        if (ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by && !a.dead && !b.dead) {
          a.dead = b.dead = 1;
          hearts--;
          shake = 0.4;
          sfx.bad();
          say("Bum! Pozor na semafor.");
          for (let i = 0; i < 16; i++)
            parts.push({
              x: bx + bw / 2,
              y: ay + ah / 2,
              vx: (Math.random() - 0.5) * 300,
              vy: (Math.random() - 0.5) * 300,
              l: 0.8,
              c: pick(["#ff5a4a", "#ffc533", "#9aa3b2"]),
            });
          txt("#tl", "❤️".repeat(Math.max(0, hearts)) + "🖤".repeat(3 - Math.max(0, hearts)));
        }
      }
    cars = cars.filter((c) => {
      if (c.dead) return false;
      if ((c.dir === "h" && c.p > W + 60) || (c.dir === "v" && c.p < -60)) {
        passed++;
        txt("#tp", passed);
        tone(880, 0.05, "triangle", 0.05);
        return false;
      }
      return true;
    });
    parts.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.l -= dt;
    });
    parts = parts.filter((p) => p.l > 0);
    if (!done && (time <= 0 || hearts <= 0)) {
      done = true;
      gst().best.traffic = Math.max(gst().best.traffic || 0, passed);
      const s = passed >= 20 && hearts > 0 ? 3 : passed >= 12 ? 2 : 1;
      setTimeout(() => finish("traffic", 5 + passed * 2, s, 10 + passed), 600);
    }
  }
  function lightBox(lx, ly, on) {
    const y = light === "y";
    x.fillStyle = "#22283a";
    rr(x, lx - 10, ly - 34, 20, 68, 8);
    x.fill();
    x.fillStyle = on || y ? "#4a2a2a" : "#ff4d4d";
    x.beginPath();
    x.arc(lx, ly - 20, 7, 0, 7);
    x.fill();
    x.fillStyle = y ? "#ffc533" : "#4a3a1a";
    x.beginPath();
    x.arc(lx, ly, 7, 0, 7);
    x.fill();
    x.fillStyle = on ? "#2fb257" : "#1f3a2a";
    x.beginPath();
    x.arc(lx, ly + 20, 7, 0, 7);
    x.fill();
  }
  function draw() {
    x.save();
    if (shake > 0) x.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
    x.fillStyle = "#7fcf6a";
    x.fillRect(-10, -10, W + 20, H + 20);
    x.fillStyle = "#000";
    x.font = `${Math.min(W, H) * 0.1}px ${EMO}`;
    x.textAlign = "center";
    x.textBaseline = "middle";
    [
      ["🌳", 0.12, 0.14],
      ["🏠", 0.85, 0.15],
      ["🌷", 0.1, 0.85],
      ["🏢", 0.88, 0.86],
      ["🌳", 0.3, 0.1],
    ].forEach(([e, a, b]) => x.fillText(e, W * a, H * b));
    const rw = RW();
    x.fillStyle = "#3b4453";
    x.fillRect(0, H / 2 - rw / 2, W, rw);
    x.fillRect(W / 2 - rw / 2, 0, rw, H);
    x.fillStyle = "rgba(255,255,255,.7)";
    for (let i = 0; i < W; i += 40)
      if (Math.abs(i + 12 - W / 2) > rw / 2 + 10) x.fillRect(i, H / 2 - 2, 24, 4);
    for (let j = 0; j < H; j += 40)
      if (Math.abs(j + 12 - H / 2) > rw / 2 + 10) x.fillRect(W / 2 - 2, j, 4, 24);
    x.fillStyle = "#fff";
    for (let k = 0; k < 6; k++) {
      x.fillRect(W / 2 - rw / 2 - 14, H / 2 - rw / 2 + (k * rw) / 6 + 3, 10, rw / 6 - 6);
      x.fillRect(W / 2 - rw / 2 + (k * rw) / 6 + 3, H / 2 + rw / 2 + 4, rw / 6 - 6, 10);
    }
    x.fillStyle = light === "h" ? "#2fb257" : light === "y" ? "#ffc533" : "#ff4d4d";
    x.fillRect(W / 2 - rw / 2 - 20, H / 2, 5, rw / 2);
    x.fillStyle = light === "v" ? "#2fb257" : light === "y" ? "#ffc533" : "#ff4d4d";
    x.fillRect(W / 2, H / 2 + rw / 2 + 16, rw / 2, 5);
    lightBox(W / 2 - rw / 2 - 34, H / 2 + rw / 2 + 40, light === "h");
    lightBox(W / 2 + rw / 2 + 30, H / 2 + rw / 2 + 40, light === "v");
    x.fillStyle = "#000";
    x.font = `20px ${EMO}`;
    x.fillText("➡️", W / 2 - rw / 2 - 34, H / 2 + rw / 2 + 88);
    x.fillText("⬆️", W / 2 + rw / 2 + 30, H / 2 + rw / 2 + 88);
    cars.forEach((c) => {
      x.save();
      if (c.dir === "h") {
        x.translate(c.p, H / 2 + rw / 4);
        x.rotate(Math.PI / 2);
      } else x.translate(W / 2 + rw / 4, c.p);
      drawTop(x, c.def, {}, cw(), t, c.col);
      x.restore();
      if (c.wait > 4) {
        const [ax, ay] = c.dir === "h" ? [c.p, H / 2 + rw / 4 - cw()] : [W / 2 + rw / 4 + cw(), c.p];
        x.fillStyle = "#000";
        x.font = `18px ${EMO}`;
        x.fillText("😠", ax, ay);
      }
    });
    parts.forEach((p) => {
      x.globalAlpha = p.l;
      x.fillStyle = p.c;
      x.fillRect(p.x - 4, p.y - 4, 8, 8);
    });
    x.globalAlpha = 1;
    x.restore();
    x.fillStyle = "rgba(21,49,77,.8)";
    rr(x, W / 2 - 92, 10, 184, 34, 14);
    x.fill();
    x.fillStyle = "#fff";
    x.font = '800 15px "Baloo 2",sans-serif';
    x.fillText(
      light === "y" ? "Pozor, oranžová…" : light === "h" ? "Zelená: ➡️ doprava" : "Zelená: ⬆️ hore",
      W / 2,
      28,
    );
  }
  const frame = guardFrame(
    (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!done) update(dt);
      draw();
    },
    () => {
      done = true;
      addCoins(5 + passed * 2);
      stuckModal();
    },
  );
  function loop(now) {
    frame(now);
    if (!(G && G.done)) raf = requestAnimationFrame(loop);
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
};
