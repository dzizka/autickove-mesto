/* ---------- game framework ---------- */
const GAMEFN = {};
function startGame(id) {
  if (!gUnlocked(id)) {
    const g = GAMES.find((x) => x.id === id);
    sfx.bad();
    toast(`🔒 Odomkne sa na leveli ${g.u}`);
    say(`Táto hra sa odomkne na leveli ${g.u}.`);
    return;
  }
  sfx.tap();
  stopGame();
  closeModal();
  $("#nav").hidden = true;
  const v = $("#view");
  v.className = "gameview";
  v.scrollTop = 0;
  GAMEFN[id](v);
}
const gHead = (title, extra = "") =>
  `<div class="ghead"><button class="btn ghost back" data-act="home" aria-label="Späť">✕</button><b class="gtitle">${title}</b>${extra}</div>`;
function afterResult(fn) {
  closeModal();
  if (pendingLevel) {
    pendingLevel = 0;
    levelModal(fn);
  } else fn();
}
function levelModal(fn) {
  const r = 50 * S.lvl;
  addCoins(r);
  const egg = S.lvl % 2 === 0;
  if (egg) giveEgg("n");
  const nw = [
    ...GAMES,
    ...BLDS,
    ...PAGES.filter((p) => p.u).map((p) => ({ u: p.u, e: p.e, n: "Album: " + p.n })),
  ].filter((x) => x.u === S.lvl);
  sfx.win();
  confetti();
  say(`Nový level ${S.lvl}!`);
  afterLevel = fn;
  modal(
    `<div class="lvlBig">${S.lvl}</div><h2>Nový level!</h2><div class="rcoins">+${fmt(r)} 🪙${egg ? " +🥚" : ""}</div>${nw.length ? `<p>Odomklo sa:</p><div class="unl">${nw.map((x) => `<span>${x.e} ${x.n}</span>`).join("")}</div>` : ""}<div class="mrow"><button class="btn grass" data-act="lvok">Pokračovať</button></div>`,
  );
}
function finish(id, base, stars, xp, extra = "", title = "") {
  if (!G) return;
  G.done = true;
  const coins = Math.max(1, Math.round(base * mult() * (1 + abil("allCoins"))));
  S.stats.games++;
  gst().g[id] = (gst().g[id] || 0) + 1;
  petGain(6, 10);
  (S.eggs || []).forEach((e) => e.p++);
  const bonusStar = Math.random() < abil("stars") ? 1 : 0;
  const stkBonus = Math.random() < abil("sticker") ? drawStk(false) : null;
  if (stkBonus) {
    giveStk(stkBonus);
    checkPages();
  }
  track(id);
  if (stars >= 3) track("stars3");
  addCoins(coins);
  addStars(stars + bonusStar);
  pendingLevel += addXP(xp * (1 + abil("xp")));
  sfx.win();
  confetti();
  const w = title || (stars >= 3 ? "Super!" : stars === 2 ? "Výborne!" : "Dobrá práca!");
  say(w);
  modal(
    `<div class="rstars">${[1, 2, 3].map((i) => `<span class="${i <= stars ? "on" : ""}">⭐</span>`).join("")}</div><h2>${w}</h2>${extra}<div class="rcoins">+${fmt(coins)} 🪙</div>${mult() > 1 ? `<p class="small">aj s bonusom zlatej kasičky</p>` : ""}${act() ? `<p class="small crewline">${cE(act())} ${cN(act())} dostal body${bonusStar ? " a našiel ⭐ navyše" : ""}${stkBonus ? ` a nálepku ${stkBonus.s}` : ""}!${(S.eggs || []).some((e) => e.p >= eggNeed(e)) ? " 🥚 Vajíčko je pripravené!" : ""}</p>` : ""}<div class="mrow"><button class="btn ghost" data-act="home">🏠 Domov</button><button class="btn grass" data-again="${id}">🔄 Znova</button></div>`,
  );
  setTimeout(() => flyCoins($("#modal .rcoins"), 8), 450);
}
function chooser(v, title, opts, speak, cb) {
  v.className = "gameview scroll";
  v.innerHTML =
    gHead(title) +
    `<div class="choose"><p>${speak}</p>${opts.map((o, i) => `<button class="btn ghost big choice" data-ch="${i}"><span class="ce">${o.e}</span><span>${o.n}<small>${o.s} · 🪙 ${o.c}</small></span></button>`).join("")}</div>`;
  say(speak);
  v.querySelectorAll("[data-ch]").forEach(
    (b) =>
      (b.onclick = () => {
        sfx.tap();
        v.className = "gameview";
        cb(opts[+b.dataset.ch]);
      }),
  );
  G = { stop() {} };
}
