/* ---------- PEXESO ---------- */
GAMEFN.pexeso = (v) =>
  chooser(
    v,
    "Pexeso",
    [
      { p: 3, e: "🙂", n: "Ľahké", s: "6 kariet", c: 20 },
      { p: 6, e: "😃", n: "Stredné", s: "12 kariet", c: 45 },
      { p: 8, e: "🤩", n: "Ťažké", s: "16 kariet", c: 80 },
    ],
    "Vyber si, koľko kariet chceš.",
    (o) => {
      const p = o.p,
        pool = shuf([
          "🚗",
          "🚕",
          "🚌",
          "🚑",
          "🚒",
          "🚓",
          "🚜",
          "🚲",
          "🚂",
          "🚁",
          "🐶",
          "🐱",
          "🦁",
          "🐸",
          "🐵",
          "🐧",
          "🍎",
          "🍓",
          "⭐",
          "🌈",
        ]).slice(0, p),
        cards = shuf([...pool, ...pool]);
      v.innerHTML =
        gHead("Pexeso", `<span class="gstat">Ťahy: <b id="pm">0</b></span>`) +
        `<div class="pgrid" style="--cols:${p === 3 ? 3 : 4}">${cards.map((c, i) => `<button class="card" data-i="${i}" aria-label="Karta"><span class="back">?</span><span class="face">${c}</span></button>`).join("")}</div>`;
      say("Nájdi dvojice rovnakých obrázkov.");
      let open = [],
        lock = false,
        moves = 0,
        found = 0;
      const els = [...v.querySelectorAll(".card")];
      const peek = upL("lupa");
      for (let k = 0; k < Math.min(abil("pexeso"), p - 1); k++) {
        const sym = pool[k];
        els.filter((e) => cards[e.dataset.i] === sym).forEach((e) => e.classList.add("flip", "ok"));
        found++;
      }
      if (peek) {
        lock = true;
        els.forEach((e) => e.classList.add("flip"));
        setTimeout(
          () => {
            els.forEach((e) => e.classList.remove("flip"));
            lock = false;
          },
          800 + peek * 800,
        );
      }
      els.forEach(
        (e) =>
          (e.onclick = () => {
            if (lock || e.classList.contains("flip")) return;
            e.classList.add("flip");
            sfx.tap();
            open.push(e);
            if (open.length === 2) {
              moves++;
              txt("#pm", moves);
              const [a, b] = open;
              open = [];
              if (cards[a.dataset.i] === cards[b.dataset.i]) {
                found++;
                setTimeout(() => {
                  a.classList.add("ok");
                  b.classList.add("ok");
                  sfx.ok();
                }, 300);
                if (found === p) {
                  const s = moves <= p * 1.5 ? 3 : moves <= p * 2.2 ? 2 : 1;
                  setTimeout(() => finish("pexeso", o.c * (0.5 + s / 6), s, 10 + p * 4), 1000);
                }
              } else {
                lock = true;
                setTimeout(() => {
                  a.classList.remove("flip");
                  b.classList.remove("flip");
                  lock = false;
                }, 950);
              }
            }
          }),
      );
      G = { stop() {} };
    },
  );
