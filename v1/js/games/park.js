/* ---------- PARKING ---------- */
const carSVG = (c, l = "") =>
  `<svg viewBox="0 0 120 70" aria-hidden="true"><path d="M30 28 L42 10 H78 L92 28 Z" fill="${c}" stroke="#15314d" stroke-width="3" stroke-linejoin="round"/><rect x="8" y="26" width="104" height="26" rx="10" fill="${c}" stroke="#15314d" stroke-width="3"/><rect x="46" y="14" width="13" height="12" rx="2" fill="#d6efff"/><rect x="63" y="14" width="13" height="12" rx="2" fill="#d6efff"/><circle cx="32" cy="54" r="11" fill="#2b2f3a"/><circle cx="88" cy="54" r="11" fill="#2b2f3a"/><circle cx="32" cy="54" r="4.5" fill="#cfd6e0"/><circle cx="88" cy="54" r="4.5" fill="#cfd6e0"/><rect x="103" y="32" width="8" height="6" rx="2" fill="#fff6b0"/>${l !== "" ? `<circle cx="60" cy="39" r="11" fill="#fff" stroke="#15314d" stroke-width="2"/><text x="60" y="44.5" text-anchor="middle" font-size="16" font-weight="800" fill="#15314d" font-family="Baloo 2, sans-serif">${l}</text>` : ""}</svg>`;
GAMEFN.park = (v) => {
  const COLS = [
    ["#ff4d4d", "červená"],
    ["#3a86ff", "modrá"],
    ["#ffd23f", "žltá"],
    ["#2ec27e", "zelená"],
    ["#ff8c1a", "oranžová"],
    ["#9b5de5", "fialová"],
  ];
  let wave = 0,
    mist = 0;
  const WAV = 3;
  v.innerHTML =
    gHead("Parkovisko", `<span class="gstat">Kolo <b id="pw">1</b>/${WAV}</span>`) +
    `<div class="park" id="park"></div><p class="hint" id="ph"></p>`;
  function nextWave() {
    if (!G || G.done) return;
    if (wave >= WAV) {
      const s = mist === 0 ? 3 : mist <= 3 ? 2 : 1;
      return finish("park", 30, s, 15);
    }
    wave++;
    txt("#pw", wave);
    const k = Math.min(3 + Math.floor(S.lvl / 3) + wave - 1, 6),
      num = S.lvl >= 4 && Math.random() < 0.5,
      set = shuf(COLS).slice(0, k);
    let spots, cars;
    if (num) {
      const nums = shuf([1, 2, 3, 4, 5, 6]).slice(0, k);
      spots = shuf(nums).map((n) => ({
        k: n,
        c: "#ffffff",
        h: `<span class="dots6">${"●".repeat(n)}</span>`,
      }));
      cars = nums.map((n, i) => ({ k: n, c: set[i][0], l: n }));
    } else {
      spots = shuf(set).map((c) => ({ k: c[0], c: c[0], h: "" }));
      cars = shuf(set).map((c) => ({ k: c[0], c: c[0], l: "" }));
    }
    $("#park").innerHTML =
      `<div class="lot">${spots.map((s) => `<button class="spot" data-k="${s.k}" style="--sc:${s.c}" aria-label="Parkovacie miesto">${s.h}</button>`).join("")}</div><div class="queue">${shuf(
        cars,
      )
        .map((c) => `<button class="pcar" data-k="${c.k}" aria-label="Auto">${carSVG(c.c, c.l)}</button>`)
        .join("")}</div>`;
    const msg = num
      ? "Zaparkuj auto tam, kde je toľko bodiek, aké číslo má auto."
      : "Zaparkuj každé auto na miesto s rovnakou farbou.";
    txt("#ph", msg);
    say(msg);
    let sel = null,
      left = k;
    $("#park")
      .querySelectorAll(".pcar")
      .forEach(
        (c) =>
          (c.onclick = () => {
            if (sel) sel.classList.remove("sel");
            sel = c === sel ? null : c;
            if (sel) {
              sel.classList.add("sel");
              sfx.tap();
            }
          }),
      );
    $("#park")
      .querySelectorAll(".spot")
      .forEach(
        (s) =>
          (s.onclick = () => {
            if (s.classList.contains("full")) return;
            if (!sel) {
              say("Najprv ťukni na auto.");
              return;
            }
            if (s.dataset.k === sel.dataset.k) {
              s.querySelector(".dots6")?.remove();
              s.insertAdjacentHTML("beforeend", sel.innerHTML);
              s.classList.add("full");
              sel.remove();
              sel = null;
              left--;
              sfx.ok();
              if (!left) setTimeout(nextWave, 800);
            } else {
              mist++;
              s.classList.remove("shake");
              void s.offsetWidth;
              s.classList.add("shake");
              sfx.bad();
            }
          }),
      );
  }
  G = { stop() {} };
  nextWave();
};
