let albTab = "album";
function vAlbum() {
  const head = `<div class="seg"><button class="${albTab === "album" ? "on" : ""}" data-atab="album">📒 Album</button><button class="${albTab === "bingo" ? "on" : ""}" data-atab="bingo">🎯 Bingo</button><button class="${albTab === "board" ? "on" : ""}" data-atab="board">🖼️ Nástenka</button></div>`;
  if (albTab === "bingo") {
    $("#view").innerHTML = head + bingoHTML();
    return;
  }
  if (albTab === "board") {
    $("#view").innerHTML = head + boardHTML();
    boardBind();
    return;
  }
  const have = ALLS.filter((x) => S.stk[x.s] && pageOpen(x.p)).length,
    tot = ALLS.filter((x) => pageOpen(x.p)).length,
    ts = totalSpare();
  $("#view").innerHTML =
    head +
    `<div class="packs" style="margin-top:12px"><button class="pack" data-pack="1"><span class="ie">🎴</span><b>Balíček</b><small>3 nálepky</small><span class="btn sun sm ${S.coins < 80 ? "poor" : ""}">🪙 80</span></button><button class="pack gold" data-pack="2"><span class="ie">🌟</span><b>Zlatý balíček</b><small>6 nálepiek, 1 určite zlatá</small><span class="btn sun sm ${S.coins < 300 ? "poor" : ""}">🪙 300</span></button></div>
 ${tradeHTML()}
 <h2>Album <small>${have}/${tot} · dvojité: ${ts}</small></h2>${(() => {
   const c = curSeason(),
     n = nextSeason(),
     d = daysToNext();
   return `<p class="seasonnote">${c.e} Tento týždeň je sezóna <b>${c.n}</b>: jej nálepky padajú z balíčkov častejšie! Ostatné sezónne nálepky padajú zriedka, ale vždy. <span class="nextseas">Ďalšia sezóna: ${n.e} ${n.n} ${d === 1 ? "zajtra" : `o ${d} ${d < 5 ? "dni" : "dní"}`}</span></p>`;
 })()}
 <p class="hint" style="text-align:left;margin:0 0 10px">Ťukni na nálepku. Z rovnakých nálepiek ju vylepšíš na 🥈 striebornú, 🥇 zlatú a 🌈 dúhovú. Celá vylepšená stránka dá veľkú odmenu.</p>
 ${PAGES.map((p, i) => pageHTML(p, i)).join("")}
 <h2>Moje obrázky <small>z Omaľovánky</small></h2>${(S.gallery || []).length ? `<div class="gal">${S.gallery.map((g) => `<div class="gi">${picSVG(g.p, g.f)}</div>`).join("")}</div>` : '<p class="hint" style="text-align:left;margin:0">Zatiaľ tu nič nie je. Vymaľuj obrázok v hre Omaľovánka a uloží sa sem.</p>'}`;
}
function pageHTML(p, i) {
  if (!pageOpen(i))
    return `<div class="page locked"><div class="ph"><b>🔒 ${p.e || ""} ${p.n}</b><span>${p.season ? seasonText(p) : "od levelu " + p.u}</span></div></div>`;
  const n = p.s.filter((s) => S.stk[s]).length,
    pt = (S.pageTier || {})[i] || 0;
  return `<div class="page pt${pt}"><div class="ph"><b>${p.e || ""} ${p.n}${p.season ? ` <small class="seas ${inSeason(p) ? "" : "off"}">${inSeason(p) ? "🔥 tento týždeň" : "zriedkavé"}</small>` : ""}</b><span>${n}/${p.s.length}${n === p.s.length ? " ✅" : ""}${pt ? " " + ["", "🥈", "🥇", "🌈"][pt] : ""}</span></div><div class="slots">${p.s
    .map((s, j) => {
      const g = j >= p.s.length - 2;
      if (!S.stk[s]) return `<div class="slot ${g ? "gold" : ""}">?</div>`;
      const t = tierOf(s),
        sp = spare(s),
        nx = TIER[t + 1];
      return `<button class="slot got ${g ? "gold" : ""} t${t}" data-stk="${s}" aria-label="Nálepka">${s}${sp ? `<small>+${sp}</small>` : ""}${nx && sp >= nx.cost ? "<em>⬆</em>" : ""}</button>`;
    })
    .join("")}</div></div>`;
}
/* sticker tiers */
const TIER = [
  { n: "Obyčajná" },
  { n: "Strieborná", cost: 3 },
  { n: "Zlatá", cost: 6 },
  { n: "Dúhová", cost: 10 },
];
const tierOf = (s) => (S.stkT || {})[s] || 0;
const spare = (s) => Math.max(0, (S.stk[s] || 0) - 1);
const totalSpare = () => Object.keys(S.stk).reduce((a, s) => a + spare(s), 0);
function stkModal(s) {
  const t = tierOf(s),
    nx = TIER[t + 1],
    sp = spare(s);
  modal(
    `<div class="bigstk t${t}"><span>${s}</span></div><h2>${TIER[t].n} nálepka</h2><p>Máš ${S.stk[s]}× túto nálepku${sp ? `, z toho ${sp} navyše` : ""}.</p>${
      nx
        ? `<div class="tierrow">${TIER.slice(1)
            .map((T, k) => `<span class="${k + 1 <= t ? "on" : ""}">${["🥈", "🥇", "🌈"][k]}</span>`)
            .join(
              "",
            )}</div><div class="mrow"><button class="btn ${sp >= nx.cost ? "sun" : "ghost"}" data-upstk="${s}">⬆ ${nx.n}: ${nx.cost} rovnaké nálepky</button></div>${sp < nx.cost ? `<p class="small">Chýba ti ešte ${nx.cost - sp}. Získaš ich z balíčkov.</p>` : ""}`
        : "<p><b>Najvyššia úroveň! ✨</b></p>"
    }<div class="mrow"><button class="btn ghost" data-act="close">Zavrieť</button></div>`,
  );
}
function upStk(s) {
  const t = tierOf(s),
    nx = TIER[t + 1];
  if (!nx) return;
  if (spare(s) < nx.cost) {
    toast(`Potrebuješ ešte ${nx.cost - spare(s)} rovnaké nálepky.`);
    sfx.bad();
    return;
  }
  S.stk[s] -= nx.cost;
  S.stkT = S.stkT || {};
  S.stkT[s] = t + 1;
  gst().upg = (gst().upg || 0) + 1;
  track("upgrade");
  if (t + 1 === 3) gst().rainbow = (gst().rainbow || 0) + 1;
  checkPageTiers();
  save();
  seq([523, 659, 784, 1047, 1319], 90, 0.2, "triangle", 0.1);
  confetti();
  say(`${nx.n} nálepka!`);
  stkModal(s);
}
function checkPageTiers() {
  S.pageTier = S.pageTier || {};
  PAGES.forEach((p, i) => {
    const mt = Math.min(...p.s.map((x) => (S.stk[x] ? tierOf(x) : -1)));
    for (let t = 1; t <= 3; t++)
      if (mt >= t && (S.pageTier[i] || 0) < t) {
        S.pageTier[i] = t;
        const r = [0, 500, 1500, 5000][t];
        S.coins += r;
        setTimeout(() => toast(`${p.n}: celá stránka je ${TIER[t].n.toLowerCase()}! +${fmt(r)} 🪙`), 400);
      }
  });
  hud();
}
/* exchange */
const dayN = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5);
function offers() {
  const c = 100 + S.lvl * 20;
  return [
    { id: "miss", give: 3, t: "Nálepku, ktorá ti chýba", e: "🎁" },
    { id: "season", give: 4, t: "Sezónnu nálepku, ktorá ti chýba", e: "🍂" },
    { id: "candy", give: 5, t: "10 cukríkov", e: "🍬" },
    [
      { id: "coins", give: 2, t: `${fmt(c)} mincí`, e: "🪙" },
      { id: "egg", give: 8, t: "Vajíčko", e: "🥚" },
      { id: "gold", give: 6, t: "Zlatú nálepku", e: "🌟" },
    ][dayN() % 3],
  ];
}
function tradeState() {
  S.trade = S.trade || {};
  if (S.trade.d !== today()) S.trade = { d: today(), used: [] };
  return S.trade;
}
function tradeHTML() {
  const ts = totalSpare(),
    st = tradeState();
  return `<section class="trader"><div class="tface">🦝</div><div class="tbody"><b>Mýval Výmenník</b><p>Máš <b>${ts}</b> dvojitých nálepiek. Vymeň ich za niečo pekné! Ponuky sú nové každý deň.</p>
 <div class="toffers">${offers()
   .map((o) => {
     const used = st.used.includes(o.id);
     return `<button class="toff ${used ? "used" : ts < o.give ? "poor" : ""}" data-trade="${o.id}"><span class="tgive">${o.give}× 🎴</span><i>➜</i><span class="tget"><em>${o.e}</em>${o.t}</span>${used ? "<small>Hotovo, príď zajtra</small>" : ""}</button>`;
   })
   .join("")}</div></div></section>`;
}
function takeSpare(n) {
  for (let i = 0; i < n; i++) {
    const s = Object.keys(S.stk)
      .filter((x) => spare(x) > 0)
      .sort((a, b) => spare(b) - spare(a))[0];
    if (s) S.stk[s]--;
  }
}
function trade(id, btn) {
  const st = tradeState(),
    o = offers().find((x) => x.id === id);
  if (!o) return;
  if (st.used.includes(id)) {
    toast("Túto výmenu si dnes už urobil. Príď zajtra!");
    return;
  }
  if (totalSpare() < o.give) {
    toast(`Potrebuješ ${o.give} dvojité nálepky.`);
    sfx.bad();
    btn && btn.classList.add("shake");
    setTimeout(() => btn && btn.classList.remove("shake"), 400);
    return;
  }
  takeSpare(o.give);
  st.used.push(id);
  gst().trades = (gst().trades || 0) + 1;
  track("trade");
  let got = "";
  if (id === "miss") {
    const miss = ALLS.filter((x) => !S.stk[x.s] && pageOpen(x.p)),
      x = miss.length ? pick(miss) : drawStk(true);
    giveStk(x);
    got = `<div class="reveal"><div class="rv ${x.gold ? "gold" : ""} new" style="--d:.2s"><span>${x.s}</span><small>${miss.length ? "NOVÁ!" : "nálepka"}</small></div></div>`;
    checkPages();
  }
  if (id === "season") {
    const miss = ALLS.filter((x) => PAGES[x.p].season && !inSeason(PAGES[x.p]) && !S.stk[x.s]),
      all = ALLS.filter((x) => PAGES[x.p].season && !inSeason(PAGES[x.p])),
      x = miss.length ? pick(miss) : pick(all);
    const n = giveStk(x);
    got = `<div class="reveal"><div class="rv ${x.gold ? "gold" : ""} ${n ? "new" : ""}" style="--d:.2s"><span>${x.s}</span><small>${PAGES[x.p].n}</small></div></div>`;
    checkPages();
  }
  if (id === "candy") {
    S.candy = (S.candy || 0) + 10;
    got = '<div class="bigE">🍬</div><p><b>+10 cukríkov</b> pre kamarátov</p>';
  }
  if (id === "coins") {
    const c = 100 + S.lvl * 20;
    S.coins += c;
    got = `<div class="rcoins">+${fmt(c)} 🪙</div>`;
  }
  if (id === "egg") {
    giveEgg("n");
    got = '<div class="bigE">🥚</div><p><b>Nové vajíčko</b> je v inkubátore</p>';
  }
  if (id === "gold") {
    const x = drawStk(true);
    const n = giveStk(x);
    got = `<div class="reveal"><div class="rv gold ${n ? "new" : ""}" style="--d:.2s"><span>${x.s}</span><small>${n ? "NOVÁ!" : "zlatá"}</small></div></div>`;
    checkPages();
  }
  hud();
  save();
  sfx.win();
  confetti();
  say("Výmena hotová! Ďakujem!");
  modal(
    `<div class="bigE">🦝</div><h2>Výmena hotová!</h2>${got}<div class="mrow"><button class="btn grass" data-act="close">Super!</button></div>`,
  );
}
