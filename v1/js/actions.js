/* ---------- actions ---------- */
const ACT = {};
ACT.home = () => afterResult(() => show("games"));
ACT.close = () => {
  closeModal();
  rerender();
};
ACT.honk = () => {
  horn(tuneOf(S.car).hn);
  const tn = $("#turn");
  if (tn) {
    tn.classList.remove("hop");
    void tn.offsetWidth;
    tn.classList.add("hop");
  }
};
ACT.randtune = () => {
  const tu = {};
  Object.keys(TUNE).forEach((k) => {
    if (k === "hn") return;
    tu[k] = pick(S.tOwn[k]);
  });
  tu.hn = tuneOf(S.car).hn;
  S.tune[S.car] = tu;
  save();
  sfx.ok();
  rerender();
  const tn = $("#turn");
  if (tn) tn.classList.add("hop");
};
ACT.lvl = () => {
  const nx = [...GAMES, ...BLDS].filter((x) => x.u > S.lvl).sort((a, b) => a.u - b.u)[0];
  modal(
    `<div class="lvlBig">${S.lvl}</div><h2>Tvoj level</h2><p>Do ďalšieho levelu ti chýba ${need(S.lvl) - S.xp} bodov. Body dostaneš za každú hru.</p>${nx ? `<p>Na leveli ${nx.u} sa odomkne: <b>${nx.e} ${nx.n}</b></p>` : ""}<div class="mrow"><button class="btn grass" data-act="close">OK</button></div>`,
  );
};
ACT.settings = () =>
  modal(
    `<h2>Nastavenia</h2><div class="set"><button class="btn ${S.snd ? "grass" : "ghost"}" data-act="tsnd">🔔 Zvuky: ${S.snd ? "zapnuté" : "vypnuté"}</button><button class="btn ${S.voice ? "grass" : "ghost"}" data-act="tvoice">🗣️ Hlas: ${S.voice ? "zapnutý" : "vypnutý"}</button><button class="btn plum" data-act="parents">📊 Prehľad pre rodičov</button><button class="btn ghost" data-act="xfer">📤 Preniesť postup</button><button class="btn ghost" data-act="reset1">🗑️ Začať odznova</button></div><p class="small">Pre rodičov: postup sa ukladá v tomto prehliadači na tomto zariadení. Budovy v meste zarábajú aj keď je hra zatvorená, najviac za 3 hodiny. Denný darček je raz za deň.</p><div class="mrow"><button class="btn sun" data-act="close">Hotovo</button></div>`,
  );
ACT.tsnd = () => {
  S.snd = !S.snd;
  save();
  ACT.settings();
};
ACT.tvoice = () => {
  S.voice = !S.voice;
  if (!S.voice)
    try {
      speechSynthesis.cancel();
    } catch (e) {}
  save();
  ACT.settings();
};
ACT.reset1 = (t) => {
  t.outerHTML = '<button class="btn tomato" data-act="reset2">Naozaj? Všetko sa vymaže</button>';
};
ACT.reset2 = () => {
  S = DEF();
  migrateCrew();
  save();
  closeModal();
  hud();
  show("games");
};
ACT.lvok = () => {
  closeModal();
  const f = afterLevel;
  afterLevel = null;
  f ? f() : rerender();
};
ACT.gift = () => {
  if (S.gift === today()) return;
  const yk = dayKey(new Date(Date.now() - 864e5));
  S.streak = S.gift === yk ? Math.min(S.streak + 1, 7) : 1;
  S.gift = today();
  const c = 40 + S.streak * 30 + S.lvl * 10;
  addCoins(c);
  addStars(1);
  sfx.win();
  confetti();
  say("Denný darček! Príď aj zajtra, bude ešte väčší.");
  modal(
    `<div class="bigE opening">🎁</div><h2>Denný darček</h2><div class="rcoins">+${c} 🪙 +1 ⭐</div><p>${S.streak}. deň za sebou. ${S.streak < 7 ? "Príď zajtra, darček bude väčší!" : "Najväčší darček!"}</p><div class="mrow"><button class="btn grass" data-act="close">Super!</button></div>`,
  );
  setTimeout(() => flyCoins($("#modal .rcoins"), 8), 900);
};
ACT.chest = () => {
  if (S.chest < 10) return;
  S.chest -= 10;
  if (Math.random() < 0.3) setTimeout(() => giveEgg("n", "Hviezdna truhla"), 1200);
  const c = 100 + S.lvl * 60;
  addCoins(c);
  const x = drawStk(Math.random() < 0.4);
  const isNew = giveStk(x);
  const pg = checkPages();
  sfx.win();
  confetti();
  say("Hviezdna truhla! Super!");
  setTimeout(() => flyCoins($("#modal .rcoins"), 8), 900);
  modal(
    `<div class="bigE opening">🧰</div><h2>Hviezdna truhla</h2><div class="rcoins">+${fmt(c)} 🪙</div><div class="reveal"><div class="rv ${x.gold ? "gold" : ""} ${isNew ? "new" : ""}" style="--d:.2s"><span>${x.s}</span><small>${isNew ? "NOVÁ!" : "+10 🪙"}</small></div></div>${pg.length ? `<p>Hotová stránka: ${pg.join(", ")}! +300 🪙</p>` : ""}<div class="mrow"><button class="btn grass" data-act="close">Super!</button></div>`,
  );
};
function claimQuest(i, btn) {
  const q = S.quests[i];
  if (!q || q.have < q.goal) return;
  addCoins(q.rew, btn);
  addStars(1);
  sfx.win();
  S.quests.splice(i, 1);
  S.quests.push(newQuest());
  save();
  say("Úloha splnená!");
  setTimeout(rerender, 350);
}
function build(id, btn) {
  const b = BLDS.find((x) => x.id === id);
  if (S.lvl < b.u) return;
  if (bL(id) >= 10) return;
  const cost = bCost(b);
  if (S.coins < cost) return poor(btn);
  const st = Math.floor(bStore(b));
  S.coins -= cost;
  if (st > 0) S.coins += st;
  const first = !bL(id);
  S.bld[id] = bL(id) + 1;
  S.bt[id] = Date.now();
  hud();
  save();
  sfx.win();
  confetti();
  say(first ? `Postavil si ${b.n}!` : `${b.n} je vylepšená!`);
  toast(first ? `${b.e} ${b.n} postavená!` : `${b.e} ${b.n} má level ${S.bld[id]}`);
  rerender();
}
function collect(id, btn) {
  const b = BLDS.find((x) => x.id === id);
  const amt = Math.floor(bStore(b));
  if (amt < 1) {
    toast("Ešte sa nič nenazbieralo. Počkaj chvíľku.");
    sfx.tap();
    return;
  }
  S.bt[id] = Date.now();
  addCoins(amt, btn);
  sfx.coin();
  track("collect");
  cityTick();
}
function buyCar(e, btn) {
  const c = CARS.find((x) => x.e === e);
  if (S.coins < c.p) return poor(btn);
  S.coins -= c.p;
  S.cars.push(e);
  S.car = e;
  hud();
  save();
  sfx.win();
  confetti();
  say("Nové auto! Super!");
  modal(
    `<div class="bigsvg">${carSide(c, {})}</div><h2>${c.n} je tvoje!</h2><p>V pretekoch dostaneš o ${carIdx() * 10} % viac mincí. V Obchode v časti Tuning mu môžeš zmeniť farbu, kolesá aj nálepky.</p><div class="mrow"><button class="btn grass" data-act="close">Hurá!</button></div>`,
  );
}
function buyUp(id, btn) {
  const u = UPS.find((x) => x.id === id);
  if (upL(id) >= u.max) return;
  const c = upCost(u);
  if (S.coins < c) return poor(btn);
  S.coins -= c;
  S.up[id] = upL(id) + 1;
  hud();
  save();
  sfx.win();
  toast(`${u.e} ${u.n} vylepšené!`);
  rerender();
}
function openPack(type, btn) {
  const cost = type === 2 ? 300 : 80;
  if (S.coins < cost) return poor(btn);
  S.coins -= cost;
  hud();
  const list = [];
  const n = type === 2 ? 6 : 3;
  for (let i = 0; i < n; i++) list.push(drawStk(type === 2 && i === 0));
  const res = list.map((x) => ({ x, isNew: giveStk(x) }));
  track("pack");
  const pg = checkPages();
  save();
  sfx.win();
  confetti();
  say(res.some((r) => r.isNew) ? "Nové nálepky!" : "Nálepky!");
  modal(
    `<h2>Nálepky!</h2><div class="reveal">${shuf(res)
      .map(
        (r, i) =>
          `<div class="rv ${r.x.gold ? "gold" : ""} ${r.isNew ? "new" : ""}" style="--d:${0.15 + i * 0.25}s"><span>${r.x.s}</span><small>${r.isNew ? "NOVÁ!" : "+10 🪙"}</small></div>`,
      )
      .join(
        "",
      )}</div>${pg.length ? `<p>Hotové: ${pg.join(", ")}! Dostal si odmenu.</p>` : ""}<div class="mrow"><button class="btn grass" data-act="close">Do albumu</button></div>`,
  );
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("button");
  if (!t) return;
  const d = t.dataset;
  if (d.tab) {
    sfx.tap();
    return show(d.tab);
  }
  if (d.game) return startGame(d.game);
  if (d.again) return afterResult(() => startGame(d.again));
  if (d.claim != null) return claimQuest(+d.claim, t);
  if (d.build) return build(d.build, t);
  if (d.collect) return collect(d.collect, t);
  if (d.buycar) return buyCar(d.buycar, t);
  if (d.tune) return setTune(d.tune, t);
  if (d.tcat) {
    tuneCat = d.tcat;
    sfx.tap();
    return rerender();
  }
  if (d.starter) return pickStarter(d.starter);
  if (d.stk) return stkModal(d.stk);
  if (d.atab) {
    albTab = d.atab;
    sfx.tap();
    return rerender();
  }
  if (d.bbg) {
    S.board.bg = d.bbg;
    save();
    sfx.tap();
    return rerender();
  }
  if (d.bstk) {
    boardStk = boardStk === d.bstk ? null : d.bstk;
    sfx.tap();
    return rerender();
  }
  if (d.btool) return btool(d.btool);
  if (d.expgo) return expGo(d.expgo);
  if (d.expcrew != null) return expSend(+d.expcrew);
  if (d.expget != null) return expGet(+d.expget);
  if (d.upstk) return upStk(d.upstk);
  if (d.trade) return trade(d.trade, t);
  if (d.crew != null) return pickCrew(+d.crew);
  if (d.ptab) {
    petTab = d.ptab;
    sfx.tap();
    return rerender();
  }
  if (d.hatch != null) return hatch(+d.hatch);
  if (d.buyegg) return buyEgg(d.buyegg, t);
  if (d.feed) return feed(d.feed, t);
  if (d.wear) return wear(d.wear, t);
  if (d.pickcar) {
    S.car = d.pickcar;
    save();
    sfx.ok();
    return rerender();
  }
  if (d.buyup) return buyUp(d.buyup, t);
  if (d.shop) {
    shopTab = d.shop;
    sfx.tap();
    return vShop();
  }
  if (d.pack) return openPack(+d.pack, t);
  if (d.say) return say(d.say);
  if (d.cheat) return cheat(d.cheat);
  if (d.act === "settings" && gearLong) {
    gearLong = false;
    return;
  }
  if (d.act && ACT[d.act]) return ACT[d.act](t);
});
