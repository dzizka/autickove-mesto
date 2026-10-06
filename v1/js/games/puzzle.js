/* ---------- PUZZLE ---------- */
function sceneImg() {
  const c = document.createElement("canvas");
  c.width = c.height = 600;
  const x = c.getContext("2d");
  const skies = [
      ["#7cc8ff", "#d8f0ff", 0],
      ["#ff9a76", "#ffe0a8", 0],
      ["#2c3e7a", "#7b6fd6", 1],
      ["#9be7c4", "#e9fff4", 0],
    ],
    sk = pick(skies);
  const g = x.createLinearGradient(0, 0, 0, 600);
  g.addColorStop(0, sk[0]);
  g.addColorStop(1, sk[1]);
  x.fillStyle = g;
  x.fillRect(0, 0, 600, 600);
  x.fillStyle = pick(["#4cc26a", "#66b84a", "#e8d27a", "#f4f7fb"]);
  x.fillRect(0, 400, 600, 200);
  x.fillStyle = "#3b4453";
  x.fillRect(0, 445, 600, 95);
  x.fillStyle = "#fff";
  for (let i = 0; i < 600; i += 80) x.fillRect(i + 10, 488, 44, 8);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.font = `110px ${EMO}`;
  x.fillText(sk[2] ? "🌙" : "☀️", 490, 100);
  x.font = `80px ${EMO}`;
  x.fillText("☁️", 150, 95);
  x.fillText("☁️", 330, 150);
  x.font = `150px ${EMO}`;
  x.fillText(pick(["🏠", "🏰", "🏫", "🏥", "🏪", "⛪", "🏡"]), 165, 320);
  x.fillText(pick(["🌳", "🌲", "🌴", "🎄"]), 430, 325);
  x.font = `70px ${EMO}`;
  x.fillText(pick(["🐶", "🐱", "🐰", "🦆", "🐔"]), 545, 390);
  x.font = `165px ${EMO}`;
  x.fillText(pick(CARS.slice(0, 11)).e, 300, 472);
  return c.toDataURL();
}
GAMEFN.puzzle = (v) =>
  chooser(
    v,
    "Skladačka",
    [
      { n: 2, e: "🙂", s: "4 dieliky", c: 15, t: "Ľahká" },
      { n: 3, e: "😃", s: "9 dielikov", c: 35, t: "Stredná" },
      { n: 4, e: "🤩", s: "16 dielikov", c: 70, t: "Ťažká" },
    ].map((o) => ({ ...o, k: o.n, n: o.t })),
    "Vyber si, koľko dielikov chceš.",
    (o) => {
      const n = o.k,
        img = sceneImg(),
        tiles = [...Array(n * n).keys()],
        bw = Math.floor(Math.min(v.clientWidth - 8, 440, innerHeight * 0.42)),
        ts = Math.floor(bw / n);
      v.className = "gameview scroll";
      v.innerHTML =
        gHead("Skladačka", `<span class="gstat">🧩 <b id="pl">${n * n}</b></span>`) +
        `<div class="pz" style="--n:${n};--ts:${ts}px;--img:url(${img})"><div class="board"><div class="pzghost"></div>${tiles.map((i) => `<button class="cell" data-c="${i}" aria-label="Miesto"></button>`).join("")}</div><div class="tray">${shuf(
          tiles,
        )
          .map(
            (i) =>
              `<button class="tile" data-t="${i}" aria-label="Dielik" style="background-position:${pos(i)}"></button>`,
          )
          .join("")}</div></div><p class="hint">Ťukni na dielik a potom na miesto, kam patrí.</p>`;
      function pos(i) {
        const r = Math.floor(i / n),
          c = i % n;
        return `${(c / (n - 1)) * 100}% ${(r / (n - 1)) * 100}%`;
      }
      say("Ťukni na dielik a potom na miesto, kam patrí.");
      let sel = null,
        mist = 0,
        left = n * n;
      v.querySelectorAll(".tile").forEach(
        (t) =>
          (t.onclick = () => {
            if (sel) sel.classList.remove("sel");
            sel = t === sel ? null : t;
            if (sel) {
              sel.classList.add("sel");
              sfx.tap();
            }
          }),
      );
      v.querySelectorAll(".cell").forEach(
        (c) =>
          (c.onclick = () => {
            if (c.classList.contains("placed")) return;
            if (!sel) {
              say("Najprv ťukni na dielik dole.");
              return;
            }
            if (sel.dataset.t === c.dataset.c) {
              c.classList.add("placed");
              c.style.backgroundPosition = pos(+c.dataset.c);
              sel.remove();
              sel = null;
              left--;
              txt("#pl", left);
              sfx.ok();
              if (!left) {
                const s = mist === 0 ? 3 : mist <= n ? 2 : 1;
                setTimeout(() => finish("puzzle", o.c, s, 8 + n * n), 700);
              }
            } else {
              mist++;
              c.classList.remove("shake");
              void c.offsetWidth;
              c.classList.add("shake");
              sfx.bad();
            }
          }),
      );
      G = { stop() {} };
    },
  );
