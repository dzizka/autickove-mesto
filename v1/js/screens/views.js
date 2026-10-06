/* ---------- navigation ---------- */
let tab = "games",
  shopTab = "cars",
  G = null,
  pendingLevel = 0,
  afterLevel = null;
function stopGame() {
  if (G && G.stop) G.stop();
  G = null;
}
function show(t) {
  tab = t;
  stopGame();
  stopCity();
  const v = $("#view");
  v.className = "";
  $("#nav").hidden = false;
  document.querySelectorAll(".nav button").forEach((b) => b.classList.toggle("on", b.dataset.tab === t));
  ({ games: vGames, city: vCity, shop: vShop, album: vAlbum, pet: vPet })[t]();
  v.scrollTop = 0;
  navBadge();
}
function rerender() {
  if ($("#nav").hidden) return;
  const st = $("#view").scrollTop,
    sl = $("#street")?.scrollLeft || 0;
  stopCity();
  ({ games: vGames, city: vCity, shop: vShop, album: vAlbum, pet: vPet })[tab]();
  $("#view").scrollTop = st;
  if ($("#street")) $("#street").scrollLeft = sl;
  navBadge();
}
function navBadge() {
  const flags = {
    city: S.gift !== today() || S.chest >= 10 || BLDS.some((b) => bL(b.id) && bStore(b) >= bCap(b) * 0.5),
    games: S.quests.some((q) => q.have >= q.goal),
    pet:
      !act() ||
      (petDecay(), act().food < 25 || act().joy < 25) ||
      (S.eggs || []).some((e) => e.p >= eggNeed(e)) ||
      (S.exp || []).some((x) => !expLeft(x)),
  };
  document.querySelectorAll(".nav button").forEach((b) => {
    let d = b.querySelector(".dot");
    const on = !!flags[b.dataset.tab];
    if (on && !d) {
      d = document.createElement("i");
      d.className = "dot";
      b.appendChild(d);
    }
    if (!on && d) d.remove();
  });
}

/* ---------- views ---------- */
function questHTML(q, i) {
  const t = QT.find((x) => x.k === q.k);
  const done = q.have >= q.goal;
  return `<div class="quest ${done ? "done" : ""}"><span class="qe">${t.e}</span><div class="qb"><div class="qt">${t.t} <b>${fmt(q.have)}/${fmt(q.goal)}</b></div><div class="prog"><i style="width:${(q.have / q.goal) * 100}%"></i></div></div>${done ? `<button class="btn sun sm" data-claim="${i}">🎁 ${q.rew}</button>` : `<span class="qr">🪙 ${q.rew}</span>`}</div>`;
}
function vGames() {
  fillQuests();
  $("#view").innerHTML = `
 <div class="logo" aria-label="Autíčkové mesto"><span>Autíčkové</span><b>mesto</b><i>🏁</i></div>
 <section class="hello"><div class="mycar">${carSide(CARS[carIdx()], tuneOf(S.car))}${act() ? `<button class="hpet" data-tab="pet" aria-label="Kamarát">${petHTML(act())}<i>${(petDecay(), petMood()[0])}</i></button>` : ""}</div><div><h1>Ahoj, šofér!</h1><p>Hraj hry, zbieraj mince a postav si mesto.</p></div><button class="say" data-say="Ahoj! Vyber si hru. Za hry dostaneš mince. Za mince si kúpiš nové autá a postavíš mesto. Splň aj úlohy, dostaneš darček.">🔊</button></section>
 <h2>Úlohy</h2><div class="quests">${S.quests.map(questHTML).join("")}</div>
 <h2>Hry</h2><div class="games">${GAMES.map((g) => {
   const ok = gUnlocked(g.id);
   return `<button class="game ${ok ? "" : "locked"}" style="--c:${g.c};--cd:${g.cd};--tc:${g.tc || "#fff"}" data-game="${g.id}">${ok ? "" : `<span class="lock">🔒 level ${g.u}</span>`}<span class="ge">${g.e}</span><span class="gn">${g.n}</span></button>`;
 }).join("")}</div>`;
}
function bHTML(b) {
  const l = bL(b.id),
    lock = S.lvl < b.u;
  if (!l)
    return `<div class="bld empty ${lock ? "locked" : ""}"><span class="be">${lock ? "🔒" : b.e}</span><span class="bn">${b.n}</span>${lock ? `<span class="bsub">od levelu ${b.u}</span>` : `<span class="bsub">${fmt(b.r * 60)} 🪙 za hodinu</span><button class="btn grass sm ${S.coins < b.p ? "poor" : ""}" data-build="${b.id}">Postaviť 🪙 ${fmt(b.p)}</button>`}</div>`;
  return `<div class="bld"><button class="bcol" data-collect="${b.id}" aria-label="Vybrať mince"><span class="be">${b.e}</span><span class="bstore">🪙 <b data-store="${b.id}">0</b></span><span class="fill"><i data-fill="${b.id}"></i></span></button><span class="bn">${b.n} <small>lvl ${l}</small></span><span class="bsub">${fmt(bRate(b) * 60)} 🪙 za hodinu</span>${l >= 10 ? '<span class="tag">MAX</span>' : `<button class="btn plum sm ${S.coins < bCost(b) ? "poor" : ""}" data-build="${b.id}">⬆ 🪙 ${fmt(bCost(b))}</button>`}</div>`;
}
function vCity() {
  const giftOk = S.gift !== today();
  $("#view").innerHTML = `
 ${giftOk ? `<button class="banner gift" data-act="gift"><span class="be">🎁</span><span><b>Denný darček</b><br>Ťukni a otvor ho!</span></button>` : ""}
 ${S.chest >= 10 ? `<button class="banner chest" data-act="chest"><span class="be">🧰</span><span><b>Hviezdna truhla</b><br>Máš 10 hviezd, otvor ju!</span></button>` : `<div class="chestprog"><span style="font-family:var(--emo);font-size:1.6rem">🧰</span> Hviezdna truhla <div class="prog"><i style="width:${S.chest * 10}%"></i></div><b>${S.chest}/10 ⭐</b></div>`}
 <h2>Moje mesto <small>ťukni na budovu a vyber mince</small></h2>
 <div class="street" id="street"><canvas id="cityC"></canvas></div>
 <h2>Budovy <small>stavaj a vylepšuj</small></h2>
 <div class="city">${BLDS.map(bHTML).join("")}</div>`;
  cityTick();
  startCity();
}
function cityTick() {
  BLDS.forEach((b) => {
    const e = document.querySelector(`[data-store="${b.id}"]`);
    if (e) {
      const s = bStore(b);
      e.textContent = fmt(s);
      document.querySelector(`[data-fill="${b.id}"]`).style.width = (s / bCap(b)) * 100 + "%";
    }
  });
}
setInterval(() => {
  cityTick();
  if (typeof expTick === "function") expTick();
  if (!$("#nav").hidden) navBadge();
}, 1000);
function vShop() {
  const tabs = [
    ["cars", "🚗 Autá"],
    ["tune", "🎨 Tuning"],
    ["up", "⚡ Vylepšenia"],
  ];
  let body = "";
  if (shopTab === "cars")
    body = `<div class="grid">${CARS.map((c, i) => {
      const own = S.cars.includes(c.e),
        sel = S.car === c.e;
      return `<div class="item ${sel ? "sel" : ""}"><span class="isvg">${carSide(c, own ? tuneOf(c.e) : {})}</span><b>${c.n}</b><small>${i ? `+${i * 10} % mincí v pretekoch` : "Tvoje prvé auto"}</small>${sel ? '<span class="tag">Jazdíš ním ✔</span>' : own ? `<button class="btn grass sm" data-pickcar="${c.e}">Vybrať</button>` : `<button class="btn sun sm ${S.coins < c.p ? "poor" : ""}" data-buycar="${c.e}">🪙 ${fmt(c.p)}</button>`}</div>`;
    }).join("")}</div>`;
  else if (shopTab === "tune") {
    const def = CARS[carIdx()],
      tu = tuneOf(S.car),
      T = TUNE[tuneCat];
    const EM = {
      sp: { none: "➖", small: "🪽", big: "🛫", jet: "🔥", wings: "👼" },
      st: { none: "➖", stripes: "〰️", num: "7️⃣", ...STK_E },
      rf: { none: "➖", box: "🧳", duck: "🦆", siren: "🚨", surf: "🏄", prop: "🚁" },
      tr: { none: "➖", smoke: "💨", sparks: "✨", stars: "⭐", hearts: "💖", rainbow: "🌈" },
      hn: { classic: "📯", duck: "🦆", siren: "🚨", trumpet: "🎺", song: "🎵" },
    };
    const swBg = (id) =>
      id === "def"
        ? def.c
        : id === "rainbow"
          ? `linear-gradient(90deg,${RAINBOW.join(",")})`
          : id === "galaxy"
            ? "radial-gradient(circle at 35% 30%,#8a6bff,#2a1660 60%,#120a33)"
            : id;
    const prev = (cat, id) =>
      cat === "col"
        ? `<i class="sw" style="background:${swBg(id)}"></i>`
        : cat === "wh"
          ? `<svg viewBox="0 0 40 40" class="wsv">${wheelSide(20, 20, 15, id)}</svg>`
          : cat === "pt"
            ? `<svg viewBox="0 0 160 80" class="ptsv"><rect width="160" height="80" fill="${carColor(def, tu)}"/>${patternSVG(id, 40)}</svg>`
            : cat === "gl"
              ? `<i class="sw glow" style="--g:${id === "none" ? "transparent" : id === "rainbow" ? "#ff6fb5" : id};background:${id === "none" ? "#dbe6f1" : id === "rainbow" ? `linear-gradient(90deg,${RAINBOW.join(",")})` : id}"></i>`
              : `<span class="oe">${EM[cat][id]}</span>`;
    body = `<div class="showroom"><div class="turn" id="turn">${carSide(def, tu)}</div><div class="srfoot"><b>${def.n}</b><span><button class="btn sun sm" data-act="honk">📯 Trúbiť</button><button class="btn plum sm" data-act="randtune">🎲 Náhodne</button></span></div></div>
  <div class="chips">${Object.entries(TUNE)
    .map(
      ([k, q]) =>
        `<button class="chip ${tuneCat === k ? "on" : ""}" data-tcat="${k}"><span>${q.e}</span>${q.n}</button>`,
    )
    .join("")}</div>
  ${TUNE_HINT[tuneCat] ? `<p class="hint" style="text-align:left;margin:0 0 8px">${TUNE_HINT[tuneCat]}</p>` : ""}
  <div class="opts">${T.items
    .map(([id, n, p]) => {
      const own = S.tOwn[tuneCat].includes(id),
        on = (tu[tuneCat] || T.items[0][0]) === id;
      return `<button class="opt ${on ? "on" : ""} ${!own && S.coins < p ? "poor" : ""}" data-tune="${tuneCat}|${id}">${prev(tuneCat, id)}<span>${n}</span><small>${on ? "✔" : own ? "Použiť" : "🪙 " + fmt(p)}</small></button>`;
    })
    .join("")}</div>`;
  } else
    body = `<div class="grid">${UPS.map((u) => {
      const l = upL(u.id);
      return `<div class="item"><span class="ie">${u.e}</span><b>${u.n}</b><small>${u.d}</small><span class="dots">${Array.from({ length: u.max }, (_, i) => `<i class="${i < l ? "on" : ""}"></i>`).join("")}</span>${l >= u.max ? '<span class="tag">Hotovo ✔</span>' : `<button class="btn sun sm ${S.coins < upCost(u) ? "poor" : ""}" data-buyup="${u.id}">🪙 ${fmt(upCost(u))}</button>`}</div>`;
    }).join("")}</div>`;
  $("#view").innerHTML =
    `<div class="seg">${tabs.map(([k, n]) => `<button class="${shopTab === k ? "on" : ""}" data-shop="${k}">${n}</button>`).join("")}</div>` +
    body;
}
let tuneCat = "col";
function setTune(v, btn) {
  const [cat, id] = v.split("|"),
    it = TUNE[cat].items.find((x) => x[0] === id);
  if (!S.tOwn[cat].includes(id)) {
    if (S.coins < it[2]) return poor(btn);
    S.coins -= it[2];
    S.tOwn[cat].push(id);
    hud();
    sfx.win();
    confetti();
    say("Kúpené!");
  } else sfx.ok();
  S.tune[S.car] = { ...tuneOf(S.car), [cat]: id };
  save();
  rerender();
  if (cat === "hn") horn(id);
  const tn = $("#turn");
  if (tn) {
    tn.classList.remove("hop");
    void tn.offsetWidth;
    tn.classList.add("hop");
  }
}
