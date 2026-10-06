/* ---------- SERVIS ---------- */
const TIRE = "TIRE";
const PROBS = [
  { t: "Koleso je prázdne", tool: TIRE, m: "💨", at: "wh" },
  { t: "Nesvieti svetlo", tool: "💡", m: "🌑", at: "hl" },
  { t: "Došiel benzín", tool: "⛽", m: "❗", at: "dc" },
  { t: "Motor potrebuje olej", tool: "🛢️", m: "💧", at: "eng" },
  { t: "Auto je poškriabané", tool: "🖌️", m: "〰️", at: "dc2" },
  { t: "Auto nenaštartuje, chce novú batériu", tool: "🔋", m: "💤", at: "eng" },
  { t: "Uvoľnená skrutka", tool: "🔧", m: "🔩", at: "wh2" },
];
const toolHTML = (t) =>
  t === TIRE ? `<svg viewBox="0 0 40 40" class="tiresvg">${wheelSide(20, 20, 17, "sport")}</svg>` : t;
GAMEFN.repair = (v) => {
  const def = CARS[carIdx()],
    P = SIDE[def.k],
    tu = tuneOf(S.car),
    probs = shuf(PROBS).slice(0, 4);
  let step = 0,
    mist = 0;
  const pos = (at) => {
    if (at === "wh" || at === "wh2") {
      if (!P.wh.length) return P.dc;
      const w = P.wh[at === "wh" ? P.wh.length - 1 : 0];
      return [w[0], w[1]];
    }
    if (at === "hl") return P.hl;
    if (at === "eng") return [P.hl[0] - 24, P.hl[1] - 8];
    if (at === "dc2") return [P.dc[0] - 30, P.dc[1] + 4];
    return P.dc;
  };
  v.className = "gameview scroll";
  v.innerHTML =
    gHead("Servis", `<span class="gstat">🔧 <b id="sv">1</b>/4</span>`) +
    `<div class="repair"><div class="rcar" id="rcar">${carSide(def, tu)}<div id="mk"></div></div><p class="rq" id="rq"></p><div class="tools" id="tools"></div></div>`;
  function next() {
    if (!G || G.done) return;
    if (step >= probs.length) {
      txt("#rq", "Auto je opravené! Ide na skúšobnú jazdu.");
      say("Auto je opravené! Ide na skúšobnú jazdu.");
      $("#tools").innerHTML = "";
      $("#mk").innerHTML = "";
      $("#rcar").classList.add("driveoff");
      seq([392, 523, 659, 784], 120, 0.18, "square", 0.07);
      return setTimeout(() => finish("repair", 28, mist === 0 ? 3 : mist <= 2 ? 2 : 1, 14), 1600);
    }
    const p = probs[step],
      [px, py] = pos(p.at);
    txt("#sv", step + 1);
    $("#mk").innerHTML =
      `<span class="mark" style="left:${(px / 160) * 100}%;top:${(py / 90) * 100}%">${p.m}<i>!</i></span>`;
    txt("#rq", p.t + ". Čo potrebuješ?");
    say(p.t + ". Čo potrebuješ?");
    const opts = shuf([p.tool, ...shuf(PROBS.map((q) => q.tool).filter((t) => t !== p.tool)).slice(0, 3)]);
    $("#tools").innerHTML = opts
      .map((o) => `<button class="tool" data-tool="${o}" aria-label="Nástroj">${toolHTML(o)}</button>`)
      .join("");
    $("#tools")
      .querySelectorAll(".tool")
      .forEach(
        (b) =>
          (b.onclick = () => {
            if (b.classList.contains("use")) return;
            if (b.dataset.tool === p.tool) {
              sfx.ok();
              b.classList.add("use");
              const m = $("#mk .mark");
              m.innerHTML = "✨";
              m.classList.add("fixed");
              step++;
              setTimeout(next, 900);
            } else {
              mist++;
              sfx.bad();
              b.classList.remove("shake");
              void b.offsetWidth;
              b.classList.add("shake");
              say("To nie je ono. Skús iný nástroj.");
            }
          }),
      );
  }
  G = { stop() {} };
  next();
};
