/* ---------- COUNT ---------- */
GAMEFN.count = (v) => {
  const N = 10,
    items = ["🚗", "🚕", "🚙", "🚌", "🚜", "🍎", "⭐", "🐶", "🎈", "🚲", "🐤", "🍓"];
  let round = 0,
    score = 0,
    first = true,
    busy = false;
  v.innerHTML =
    gHead(
      "Počítanie",
      `<span class="gstat"><b id="cr">1</b>/${N}</span><span class="gstat">✅ <b id="cs">0</b></span>`,
    ) + `<div class="count" id="cnt"></div>`;
  const grp = (e, n, cls = "") =>
    `<div class="grp ${cls}">${Array.from({ length: n }, (_, i) => `<span style="animation-delay:${i * 0.04}s">${e}</span>`).join("")}</div>`;
  function next() {
    if (!G || G.done) return;
    if (round >= N) {
      const s = score >= 10 ? 3 : score >= 7 ? 2 : 1;
      return finish("count", score * 4, s, 8 + score * 2);
    }
    round++;
    first = true;
    busy = false;
    txt("#cr", round);
    const e = pick(items);
    let ans, scene, q;
    if (S.lvl >= 4 && Math.random() < 0.45) {
      const mx = Math.min(5 + Math.floor(S.lvl / 3), 9),
        a = R(1, mx),
        b = R(1, mx);
      ans = a + b;
      scene = grp(e, a, "small") + '<span class="plus">+</span>' + grp(e, b, "small");
      q = "Koľko je to spolu?";
    } else {
      ans = R(1, Math.min(6 + S.lvl, 15));
      scene = grp(e, ans);
      q = "Koľko ich je?";
    }
    const o = new Set([ans]);
    while (o.size < 3) {
      const c = ans + R(-3, 3);
      if (c >= 1) o.add(c);
    }
    $("#cnt").innerHTML = `<div class="scene">${scene}</div><div class="ans">${shuf([...o])
      .map((n) => `<button class="btn ghost num" data-n="${n}">${n}</button>`)
      .join("")}</div>`;
    say(q);
    if (abil("hintCount")) {
      const wb = [...$("#cnt").querySelectorAll(".num")].filter((b) => +b.dataset.n !== ans);
      if (wb.length) wb[0].classList.add("gone");
    }
    $("#cnt")
      .querySelectorAll(".num")
      .forEach(
        (b) =>
          (b.onclick = () => {
            if (busy) return;
            if (+b.dataset.n === ans) {
              busy = true;
              learn("count", first);
              b.classList.add("right");
              if (first) {
                score++;
                txt("#cs", score);
              }
              sfx.ok();
              setTimeout(next, 750);
            } else {
              first = false;
              b.classList.add("wrong", "shake");
              sfx.bad();
              say("Skús ešte raz.");
              setTimeout(() => b.classList.remove("shake"), 400);
            }
          }),
      );
  }
  G = { stop() {} };
  next();
};
