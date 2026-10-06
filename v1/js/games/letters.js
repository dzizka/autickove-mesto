/* ---------- PÍSMENKÁ ---------- */
const WORDS = [
  ["A", "🚗", "AUTO"],
  ["A", "🍍", "ANANÁS"],
  ["B", "🍌", "BANÁN"],
  ["B", "🎈", "BALÓN"],
  ["C", "🍋", "CITRÓN"],
  ["D", "🏠", "DOM"],
  ["D", "🌈", "DÚHA"],
  ["H", "🍐", "HRUŠKA"],
  ["H", "🍄", "HUBA"],
  ["J", "🍎", "JABLKO"],
  ["J", "🦔", "JEŽKO"],
  ["K", "🐄", "KRAVA"],
  ["K", "🐴", "KÔŇ"],
  ["K", "🔑", "KĽÚČ"],
  ["L", "🦁", "LEV"],
  ["L", "⛵", "LOĎKA"],
  ["M", "🐱", "MAČKA"],
  ["M", "🐭", "MYŠ"],
  ["M", "🍉", "MELÓN"],
  ["N", "👃", "NOS"],
  ["O", "🐑", "OVCA"],
  ["O", "🔥", "OHEŇ"],
  ["P", "🐶", "PES"],
  ["P", "🍕", "PIZZA"],
  ["R", "🐟", "RYBA"],
  ["R", "🚀", "RAKETA"],
  ["R", "🤖", "ROBOT"],
  ["S", "🐘", "SLON"],
  ["S", "☀️", "SLNKO"],
  ["S", "🧀", "SYR"],
  ["T", "🐯", "TIGER"],
  ["T", "🚜", "TRAKTOR"],
  ["U", "👂", "UCHO"],
  ["V", "🚂", "VLAK"],
  ["V", "🐺", "VLK"],
  ["Z", "🦓", "ZEBRA"],
  ["Z", "🐰", "ZAJAC"],
  ["Ž", "🐸", "ŽABA"],
  ["Ž", "🦒", "ŽIRAFA"],
];
const cap = (w) => w[0] + w.slice(1).toLowerCase();
GAMEFN.letters = (v) => {
  const N = 10;
  let round = 0,
    score = 0,
    first = true,
    busy = false;
  v.className = "gameview scroll";
  v.innerHTML =
    gHead(
      "Písmenká",
      `<span class="gstat"><b id="lr">1</b>/${N}</span><span class="gstat">✅ <b id="ls">0</b></span>`,
    ) + `<div class="letters" id="lt"></div>`;
  function next() {
    if (!G || G.done) return;
    if (round >= N) {
      const s = score >= 10 ? 3 : score >= 7 ? 2 : 1;
      return finish("letters", score * 4, s, 8 + score * 2);
    }
    round++;
    first = true;
    busy = false;
    txt("#lr", round);
    const w = pick(WORDS),
      mode = Math.random() < (S.lvl >= 8 ? 0.5 : 0.3) ? "B" : "A";
    if (mode === "A") {
      const others = shuf(WORDS.filter((q) => q[0] !== w[0]))
          .filter((q, i, a) => a.findIndex((z) => z[0] === q[0]) === i)
          .slice(0, 2),
        opts = shuf([w, ...others]);
      $("#lt").innerHTML =
        `<div class="train"><span class="loco">🚂</span><span class="wagon">${w[0]}</span></div><p class="lq">Čo sa začína na <b>${w[0]}</b>?</p><div class="lopts">${opts.map((o) => `<button class="lopt" data-w="${o[2]}"><span>${o[1]}</span><small></small></button>`).join("")}</div>`;
      say(`Ktorý obrázok sa začína na písmeno ${w[0]}?`);
      if (abil("hintLetters")) {
        const wb = [...$("#lt").querySelectorAll(".lopt")].filter((b) => b.dataset.w !== w[2]);
        if (wb.length) wb[0].classList.add("gone");
      }
      $("#lt")
        .querySelectorAll(".lopt")
        .forEach(
          (b) =>
            (b.onclick = () => {
              if (busy) return;
              const o = opts.find((q) => q[2] === b.dataset.w);
              b.querySelector("small").innerHTML = `<em>${o[2][0]}</em>${o[2].slice(1)}`;
              if (o === w) {
                busy = true;
                learn("letters", first);
                b.classList.add("right");
                if (first) {
                  score++;
                  txt("#ls", score);
                }
                sfx.ok();
                say(`Áno! ${cap(w[2])}.`);
                $("#lt .train").classList.add("go");
                setTimeout(next, 1600);
              } else {
                first = false;
                b.classList.add("wrong", "shake");
                sfx.bad();
                say(`To je ${cap(o[2])}. Skús ešte raz.`);
              }
            }),
        );
    } else {
      const lets = shuf([...new Set(WORDS.map((q) => q[0]))].filter((l) => l !== w[0])).slice(0, 2),
        opts = shuf([w[0], ...lets]);
      $("#lt").innerHTML =
        `<div class="bigpic">${w[1]}</div><p class="lq"><b class="blank">?</b>${w[2].slice(1)}</p><div class="lopts">${opts.map((l) => `<button class="lopt let" data-l="${l}"><span>${l}</span></button>`).join("")}</div>`;
      say(`${cap(w[2])}. Na aké písmeno sa začína?`);
      if (abil("hintLetters")) {
        const wb = [...$("#lt").querySelectorAll(".lopt")].filter((b) => b.dataset.l !== w[0]);
        if (wb.length) wb[0].classList.add("gone");
      }
      $("#lt")
        .querySelectorAll(".lopt")
        .forEach(
          (b) =>
            (b.onclick = () => {
              if (busy) return;
              if (b.dataset.l === w[0]) {
                busy = true;
                learn("letters", first);
                b.classList.add("right");
                txt("#lt .blank", w[0]);
                $("#lt .blank").classList.add("ok");
                if (first) {
                  score++;
                  txt("#ls", score);
                }
                sfx.ok();
                say(`Áno! ${w[0]}, ${cap(w[2])}.`);
                setTimeout(next, 1500);
              } else {
                first = false;
                b.classList.add("wrong", "shake");
                sfx.bad();
                say("Skús ešte raz.");
              }
            }),
        );
    }
  }
  G = { stop() {} };
  next();
};
