/* ---------- BLUDISKO ---------- */
GAMEFN.maze = (v) =>
  chooser(
    v,
    "Bludisko",
    [
      { e: "🙂", n: "Malé", s: "5 × 5", c: 20, k: 5 },
      { e: "😃", n: "Stredné", s: "7 × 7", c: 35, k: 7 },
      { e: "🤩", n: "Veľké", s: "9 × 9", c: 55, k: 9 },
    ],
    "Vyber si veľkosť bludiska.",
    (o) => {
      const N = o.k,
        cells = Array.from({ length: N * N }, () => [1, 1, 1, 1]),
        vis = new Array(N * N).fill(0),
        stack = [0];
      vis[0] = 1;
      const DIRS = [
        [0, -1, 0, 2],
        [1, 0, 1, 3],
        [0, 1, 2, 0],
        [-1, 0, 3, 1],
      ];
      while (stack.length) {
        const c = stack[stack.length - 1],
          cx = c % N,
          cy = Math.floor(c / N);
        const nb = DIRS.filter(([dx, dy]) => {
          const nx = cx + dx,
            ny = cy + dy;
          return nx >= 0 && ny >= 0 && nx < N && ny < N && !vis[ny * N + nx];
        });
        if (!nb.length) {
          stack.pop();
          continue;
        }
        const [dx, dy, a, b] = pick(nb),
          n = (cy + dy) * N + cx + dx;
        cells[c][a] = 0;
        cells[n][b] = 0;
        vis[n] = 1;
        stack.push(n);
      }
      for (let i = 0; i < Math.floor(N / 2); i++) {
        const c = R(0, N * N - 1),
          cx = c % N,
          cy = Math.floor(c / N);
        const [dx, dy, a, b] = pick(DIRS);
        const nx = cx + dx,
          ny = cy + dy;
        if (nx >= 0 && ny >= 0 && nx < N && ny < N) {
          cells[c][a] = 0;
          cells[ny * N + nx][b] = 0;
        }
      }
      const goal = N * N - 1,
        coinSet = new Set();
      /* Coins only go where the car can drive without entering home (entering home ends the game). */
      const ok = new Set([0]),
        bq = [0];
      while (bq.length) {
        const c = bq.shift();
        if (c === goal) continue;
        const cx = c % N,
          cy = Math.floor(c / N);
        DIRS.forEach(([dx, dy, a]) => {
          if (cells[c][a]) return;
          const n = (cy + dy) * N + cx + dx;
          if (!ok.has(n)) {
            ok.add(n);
            bq.push(n);
          }
        });
      }
      const spots = shuf([...ok].filter((c) => c !== 0 && c !== goal));
      spots.slice(0, N).forEach((c) => coinSet.add(c));
      const nC = coinSet.size;
      v.className = "gameview scroll";
      v.innerHTML =
        gHead("Bludisko", `<span class="gstat">🪙 <b id="mc">0</b>/${nC}</span>`) +
        `<div class="mazewrap"><canvas id="mz"></canvas></div><div class="pad"><button class="btn ghost" data-mv="0">⬆️</button><button class="btn ghost" data-mv="3">⬅️</button><button class="btn ghost" data-mv="2">⬇️</button><button class="btn ghost" data-mv="1">➡️</button></div><p class="hint">Ťahaj autíčko prstom po ceste alebo ťukaj na šípky. Dovez ho domov 🏠</p>`;
      say("Dovez autíčko domov. Cestou zbieraj mince.");
      const cv = $("#mz"),
        x = cv.getContext("2d"),
        Z = Math.floor(Math.min(v.clientWidth - 8, 460, innerHeight * 0.55)),
        dpr = Math.min(2, devicePixelRatio || 1),
        cs = Z / N;
      cv.width = Z * dpr;
      cv.height = Z * dpr;
      cv.style.width = Z + "px";
      cv.style.height = Z + "px";
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      const def = CARS[carIdx()],
        tu = tuneOf(S.car);
      let cur = 0,
        px = 0,
        py = 0,
        ang = Math.PI / 2,
        got = 0,
        moves = 0,
        done = false,
        raf,
        t = 0,
        last = performance.now();
      function tryMove(dir) {
        if (done) return false;
        if (cells[cur][dir]) return false;
        const [dx, dy] = DIRS[dir];
        cur += dy * N + dx;
        moves++;
        ang = [0, Math.PI / 2, Math.PI, -Math.PI / 2][dir];
        tone(500 + R(0, 4) * 40, 0.05, "triangle", 0.05);
        if (coinSet.has(cur)) {
          coinSet.delete(cur);
          got++;
          txt("#mc", got);
          sfx.coin();
        }
        if (cur === goal) {
          done = true;
          sfx.win();
          setTimeout(
            () => finish("maze", o.c + got * 2, got === nC ? 3 : got >= nC / 2 ? 2 : 1, 10 + N * 2),
            700,
          );
        }
        return true;
      }
      function draw(now) {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        t += dt;
        const tx = ((cur % N) + 0.5) * cs,
          ty = (Math.floor(cur / N) + 0.5) * cs;
        px += (tx - px) * Math.min(1, dt * 14);
        py += (ty - py) * Math.min(1, dt * 14);
        x.fillStyle = "#7fcf6a";
        x.fillRect(0, 0, Z, Z);
        x.fillStyle = "#73c45e";
        for (let i = 0; i < N; i++)
          for (let j = 0; j < N; j++) if ((i + j) % 2) x.fillRect(i * cs, j * cs, cs, cs);
        const rw = cs * 0.56;
        x.fillStyle = "#4a5363";
        cells.forEach((w, c) => {
          const cx = ((c % N) + 0.5) * cs,
            cy = (Math.floor(c / N) + 0.5) * cs;
          x.fillRect(cx - rw / 2, cy - rw / 2, rw, rw);
          if (!w[1]) x.fillRect(cx, cy - rw / 2, cs, rw);
          if (!w[2]) x.fillRect(cx - rw / 2, cy, rw, cs);
        });
        x.fillStyle = "rgba(255,255,255,.55)";
        cells.forEach((w, c) => {
          const cx = ((c % N) + 0.5) * cs,
            cy = (Math.floor(c / N) + 0.5) * cs;
          if (!w[1]) x.fillRect(cx + cs * 0.3, cy - 1.5, cs * 0.4, 3);
          if (!w[2]) x.fillRect(cx - 1.5, cy + cs * 0.3, 3, cs * 0.4);
        });
        x.textAlign = "center";
        x.textBaseline = "middle";
        x.fillStyle = "#000";
        coinSet.forEach((c) => {
          const cx = ((c % N) + 0.5) * cs,
            cy = (Math.floor(c / N) + 0.5) * cs + Math.sin(t * 4 + c) * 2;
          x.fillStyle = "#d99a00";
          x.beginPath();
          x.arc(cx, cy, cs * 0.18, 0, 7);
          x.fill();
          x.fillStyle = "#ffc533";
          x.beginPath();
          x.arc(cx, cy, cs * 0.14, 0, 7);
          x.fill();
        });
        x.fillStyle = "#000";
        x.font = `${cs * 0.7}px ${EMO}`;
        x.fillText("🏠", ((goal % N) + 0.5) * cs, (Math.floor(goal / N) + 0.5) * cs);
        x.save();
        x.translate(px, py);
        x.rotate(ang);
        drawTop(x, def, tu, cs * 0.3, t);
        x.restore();
      }
      const safeDraw = guardFrame(draw);
      function mloop(now) {
        safeDraw(now);
        if (!(G && G.done)) raf = requestAnimationFrame(mloop);
      }
      raf = requestAnimationFrame(mloop);
      v.querySelectorAll("[data-mv]").forEach(
        (b) =>
          (b.onclick = () => {
            if (!tryMove(+b.dataset.mv)) {
              sfx.bad();
              b.classList.remove("shake");
              void b.offsetWidth;
              b.classList.add("shake");
            }
          }),
      );
      const kd = (e) => {
        const m = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 }[e.key];
        if (m != null) {
          e.preventDefault();
          tryMove(m);
        }
      };
      addEventListener("keydown", kd);
      let drag = false;
      const cellAt = (e) => {
        const r = cv.getBoundingClientRect();
        const cx = Math.floor(((e.clientX - r.left) / r.width) * N),
          cy = Math.floor(((e.clientY - r.top) / r.height) * N);
        return cx < 0 || cy < 0 || cx >= N || cy >= N ? -1 : cy * N + cx;
      };
      const follow = (e) => {
        const c = cellAt(e);
        if (c < 0 || c === cur) return;
        const cx = cur % N,
          cy = Math.floor(cur / N),
          nx = c % N,
          ny = Math.floor(c / N);
        const dir = DIRS.findIndex(([dx, dy]) => dx === nx - cx && dy === ny - cy);
        if (dir >= 0) tryMove(dir);
      };
      cv.addEventListener("pointerdown", (e) => {
        drag = true;
        cv.setPointerCapture(e.pointerId);
        follow(e);
      });
      cv.addEventListener("pointermove", (e) => {
        if (drag) follow(e);
      });
      cv.addEventListener("pointerup", () => (drag = false));
      G = {
        stop() {
          cancelAnimationFrame(raf);
          removeEventListener("keydown", kd);
        },
      };
    },
  );
