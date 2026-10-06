/* ---------- expeditions ---------- */
const DESTS = [
  { id: "les", n: "Les", e: "🌲", u: 1, min: 30, c: 80, can: 2, st: 1, egg: 0 },
  { id: "more", n: "More", e: "🏖️", u: 3, min: 60, c: 180, can: 4, st: 1, egg: 0.05 },
  { id: "hory", n: "Hory", e: "⛰️", u: 6, min: 120, c: 400, can: 8, st: 2, egg: 0.15 },
  { id: "vesmir", n: "Vesmír", e: "🚀", u: 10, min: 240, c: 1000, can: 15, st: 3, egg: 0.35 },
];
const onExp = (i) => (S.exp || []).some((x) => x.ci === i);
const expLeft = (x) => Math.max(0, x.start + x.dur - Date.now());
const fmtLeft = (ms) => {
  const m = Math.ceil(ms / 6e4);
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`;
};
let expPick = null;
function expHTML() {
  S.exp = S.exp || [];
  const free = S.crew.map((c, i) => i).filter((i) => i !== (S.active || 0) && !onExp(i));
  return `<p class="hint" style="text-align:left;margin:10px 0">Pošli kamaráta na výpravu. Kým je preč, ty hráš ďalej a on ti donesie poklad. Kamarát, ktorý je práve s tebou, ísť nemôže.</p>
 ${
   S.exp.length
     ? `<h2>Na výprave <small>${S.exp.length}/3</small></h2><div class="exps">${S.exp
         .map((x, k) => {
           const c = S.crew[x.ci],
             D = DESTS.find((d) => d.id === x.dest),
             left = expLeft(x);
           return `<div class="expcard ${left ? "" : "done"}"><span class="xe">${D.e}</span><div><b>${cE(c)} ${cN(c)}</b><small>${D.n}</small><div class="prog"><i data-expbar="${k}" style="width:${100 - (left / x.dur) * 100}%"></i></div><small data-exp="${k}">${left ? "Vráti sa o " + fmtLeft(left) : "Je späť s pokladom!"}</small></div>${left ? "" : `<button class="btn sun sm" data-expget="${k}">🎁 Otvoriť</button>`}</div>`;
         })
         .join("")}</div>`
     : ""
 }
 <h2>Kam pôjdeme?</h2><div class="dests">${DESTS.map((D) => {
   const lock = S.lvl < D.u;
   return `<div class="dest ${lock ? "locked" : ""}"><span class="xe">${lock ? "🔒" : D.e}</span><div><b>${D.n}</b><small>${lock ? "od levelu " + D.u : `${fmtLeft(D.min * 6e4)} · 🪙 ${D.c}+ · 🍬 ${D.can} · ${D.st}× nálepka${D.egg ? ` · 🥚 ${Math.round(D.egg * 100)} %` : ""}`}</small></div>${lock ? "" : `<button class="btn grass sm" data-expgo="${D.id}">Poslať</button>`}</div>`;
 }).join("")}</div>
 ${
   expPick
     ? `<h2>Koho pošleš do: ${DESTS.find((d) => d.id === expPick).n}?</h2>${
         free.length
           ? `<div class="crewgrid">${free
               .map((i) => {
                 const c = S.crew[i],
                   L = lineOf(c);
                 return `<button class="cc" data-expcrew="${i}" style="--rc:${RAR[L.r].c}"><span class="ce2">${cE(c)}</span><b>${cN(c)}</b><small>lvl ${c.lv}</small></button>`;
               })
               .join("")}</div>`
           : '<p class="hint" style="text-align:left">Nemáš voľného kamaráta. Vyliahni ďalšieho z vajíčka!</p>'
       }`
     : ""
 }`;
}
function expGo(dest) {
  S.exp = S.exp || [];
  if (S.exp.length >= 3) {
    toast("Na výprave môžu byť naraz 3 kamaráti.");
    return;
  }
  expPick = dest;
  sfx.tap();
  rerender();
  setTimeout(() => {
    const g = document.querySelector(".crewgrid");
    g && g.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 50);
}
function expSend(i) {
  const D = DESTS.find((d) => d.id === expPick);
  if (!D || onExp(i) || i === (S.active || 0)) return;
  S.exp.push({ ci: i, dest: D.id, start: Date.now(), dur: D.min * 6e4 });
  expPick = null;
  save();
  sfx.ok();
  say(`${cN(S.crew[i])} ide na výpravu. Vráti sa o chvíľu!`);
  rerender();
}
function expGet(k) {
  const x = S.exp[k];
  if (!x || expLeft(x)) return;
  const c = S.crew[x.ci],
    D = DESTS.find((d) => d.id === x.dest);
  S.exp.splice(k, 1);
  const coins = Math.round(D.c * (1 + c.lv * 0.05) * (0.8 + Math.random() * 0.4));
  S.coins += coins;
  S.candy = (S.candy || 0) + D.can;
  crewXP(c, D.min / 2);
  const st = [];
  for (let i = 0; i < D.st; i++) {
    const s = drawStk(D.id === "vesmir" && i === 0);
    giveStk(s);
    st.push(s);
  }
  checkPages();
  let egg = "";
  if (Math.random() < D.egg) {
    const g = D.id === "vesmir" && Math.random() < 0.3 ? "g" : "n";
    giveEgg(g);
    egg = g === "g" ? "🥚✨" : "🥚";
  }
  gst().exps = (gst().exps || 0) + 1;
  track("exp");
  hud();
  save();
  sfx.win();
  confetti();
  say(`${cN(c)} je späť a niečo ti doniesol!`);
  modal(
    `<div class="bigE">${cE(c)}</div><h2>Poklad z výpravy!</h2><p>${D.e} ${D.n}</p><div class="rcoins">+${fmt(coins)} 🪙 · +${D.can} 🍬${egg ? " · " + egg : ""}</div><div class="reveal">${st.map((x, i) => `<div class="rv ${x.gold ? "gold" : ""}" style="--d:${0.2 + i * 0.2}s"><span>${x.s}</span><small>nálepka</small></div>`).join("")}</div><div class="mrow"><button class="btn grass" data-act="close">Super!</button></div>`,
  );
}
function expTick() {
  (S.exp || []).forEach((x, k) => {
    const e = document.querySelector(`[data-exp="${k}"]`);
    if (!e) return;
    const left = expLeft(x);
    e.textContent = left ? "Vráti sa o " + fmtLeft(left) : "Je späť s pokladom!";
    const b = document.querySelector(`[data-expbar="${k}"]`);
    if (b) b.style.width = 100 - (left / x.dur) * 100 + "%";
    if (!left && !document.querySelector(`[data-expget="${k}"]`)) rerender();
  });
}
/* ---------- bingo ---------- */
function bingoPool() {
  const P = [
    { k: "pack", e: "🎴", t: (n) => `Otvor ${n} ${n > 1 ? "balíčky" : "balíček"}`, g: [1, 2] },
    { k: "gold", e: "🌟", t: () => "Získaj zlatú nálepku", g: [1] },
    { k: "upgrade", e: "⬆️", t: () => "Vylepši nálepku", g: [1] },
    { k: "trade", e: "🦝", t: () => "Urob výmenu u Mývala", g: [1] },
    { k: "hatch", e: "🥚", t: () => "Vyliahni vajíčko", g: [1] },
    { k: "feed", e: "🍎", t: (n) => `Nakŕm kamaráta ${n}×`, g: [2, 3] },
    { k: "collect", e: "🏙️", t: (n) => `Vyber mince z mesta ${n}×`, g: [2, 3] },
    { k: "stars3", e: "⭐", t: (n) => `Získaj 3 hviezdy v hre ${n}×`, g: [1, 2] },
    { k: "win", e: "🥇", t: () => "Vyhraj preteky", g: [1] },
    { k: "exp", e: "🗺️", t: () => "Vráť sa z výpravy", g: [1] },
  ];
  GAMES.filter((g) => gUnlocked(g.id)).forEach((g) =>
    P.push({ k: g.id, e: g.e, t: (n) => `Zahraj ${g.n} ${n}×`, g: [1, 2] }),
  );
  PAGES.forEach((p, i) => {
    if (pageOpen(i) && (!p.season || inSeason(p)))
      P.push({ k: "stk" + i, e: p.e, t: (n) => `Získaj ${n} nálepky: ${p.n}`, g: [2, 3] });
  });
  return P;
}
function newBingo() {
  const P = shuf(bingoPool()).slice(0, 8),
    cells = P.map((q) => {
      const g = pick(q.g);
      return { k: q.k, e: q.e, t: q.t(g), goal: g, have: 0 };
    });
  cells.splice(4, 0, { k: "free", e: "⭐", t: "Zadarmo!", goal: 1, have: 1 });
  S.bingo = { cells, lines: [], n: ((S.bingo && S.bingo.n) || 0) + 1 };
  save();
}
const BLINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
function bingoTrack(k, n) {
  const B = S.bingo;
  if (!B) return;
  let ch = false;
  B.cells.forEach((c) => {
    if (c.k === k && c.have < c.goal) {
      c.have = Math.min(c.goal, c.have + n);
      ch = true;
    }
  });
  if (!ch) return;
  BLINES.forEach((l, li) => {
    if (!B.lines.includes(li) && l.every((i) => B.cells[i].have >= B.cells[i].goal)) {
      B.lines.push(li);
      const c = 150 + S.lvl * 20;
      S.coins += c;
      S.candy = (S.candy || 0) + 2;
      const x = drawStk(false);
      giveStk(x);
      setTimeout(() => {
        toast(`🎯 BINGO! +${fmt(c)} 🪙, +2 🍬 a nálepka ${x.s}`);
        seq([523, 659, 784, 1047], 90, 0.18, "square", 0.08);
        hud();
      }, 300);
    }
  });
  if (B.cells.every((c) => c.have >= c.goal) && !B.full) {
    B.full = true;
    S.coins += 1000;
    giveEgg("g");
    setTimeout(() => {
      toast("🎯 CELÁ KARTA! +1 000 🪙 a zlaté vajíčko!");
      confetti();
    }, 3600);
  }
}
function bingoHTML() {
  if (!S.bingo) newBingo();
  const B = S.bingo;
  return `<p class="hint" style="text-align:left;margin:10px 0">Plň úlohy a vyškrtávaj políčka. Celý riadok, stĺpec alebo uhlopriečka je BINGO a dostaneš odmenu. Celá karta dá zlaté vajíčko!</p>
 <div class="bingo">${B.cells
   .map((c, i) => {
     const ok = c.have >= c.goal,
       inLine = B.lines.some((li) => BLINES[li].includes(i));
     return `<div class="bc ${ok ? "ok" : ""} ${inLine ? "line" : ""}"><span>${c.e}</span><small>${c.t}</small>${ok ? "<i>✔</i>" : `<em>${c.have}/${c.goal}</em>`}</div>`;
   })
   .join("")}</div>
 <p class="hint" style="text-align:left">Karta č. ${B.n} · bingo: ${B.lines.length}/8</p>${B.full ? '<div class="mrow"><button class="btn sun" data-act="newbingo">🎯 Nová karta</button></div>' : ""}`;
}
ACT.newbingo = () => {
  newBingo();
  sfx.win();
  rerender();
};
/* ---------- sticker board ---------- */
const BOARDS = [
  ["wall", "🧱 Izba", "linear-gradient(180deg,#ffe9d6 0 72%,#d9a77a 72%)"],
  ["meadow", "🌼 Lúka", "linear-gradient(180deg,#9fdcff 0 55%,#7fcf6a 55%)"],
  ["sea", "🌊 More", "linear-gradient(180deg,#9fdcff 0 40%,#3a86ff 40% 85%,#f0cd82 85%)"],
  ["space", "🚀 Vesmír", "radial-gradient(circle at 30% 20%,#3d2a8a,#0b0b24 70%)"],
  ["night", "🌙 Noc", "linear-gradient(180deg,#1b2550,#3d4f8f 70%,#2f6b3e 70%)"],
];
let boardSel = null,
  boardStk = null;
function boardHTML() {
  S.board = S.board || { bg: "meadow", items: [] };
  const B = S.board,
    bg = BOARDS.find((b) => b[0] === B.bg) || BOARDS[1],
    owned = ALLS.filter((x) => S.stk[x.s]);
  return (
    `<p class="hint" style="text-align:left;margin:10px 0">Vyber nálepku dole a ťukni na nástenku, kam ju chceš nalepiť. Nalepené nálepky môžeš ťahať prstom.</p>
 <div class="bgs">${BOARDS.map((b) => `<button class="chip ${B.bg === b[0] ? "on" : ""}" data-bbg="${b[0]}">${b[1]}</button>`).join("")}</div>
 <div class="board2" id="board2" style="background:${bg[2]}">${B.items.map((it, i) => `<span class="bi ${boardSel === i ? "sel" : ""}" data-bi="${i}" style="left:${it.x}%;top:${it.y}%;font-size:${it.z}rem;transform:translate(-50%,-50%) rotate(${it.r}deg)">${it.s}</span>`).join("")}${B.items.length ? "" : '<p class="bempty">Tvoja nástenka je prázdna. Nalep sem prvú nálepku!</p>'}</div>
 <div class="btools" id="btools" ${boardSel != null && B.items[boardSel] ? "" : "hidden"}>` +
    `<button class="btn ghost sm" data-btool="minus">➖ Menšia</button><button class="btn ghost sm" data-btool="plus">➕ Väčšia</button><button class="btn ghost sm" data-btool="rot">🔄 Otočiť</button><button class="btn ghost sm" data-btool="front">⬆ Dopredu</button><button class="btn tomato sm" data-btool="del">🗑️ Zmazať</button></div>
 <h2>Moje nálepky <small>${owned.length}</small></h2><div class="btray">${owned.map((x) => `<button class="bts ${boardStk === x.s ? "on" : ""}" data-bstk="${x.s}">${x.s}</button>`).join("") || '<p class="hint">Najprv získaj nálepky z balíčkov.</p>'}</div>`
  );
}
function boardBind() {
  const el = $("#board2");
  if (!el) return;
  let drag = null;
  el.addEventListener("pointerdown", (e) => {
    const bi = e.target.closest("[data-bi]");
    const r = el.getBoundingClientRect();
    if (bi) {
      const i = +bi.dataset.bi;
      boardSel = i;
      drag = { i, el: bi };
      bi.setPointerCapture(e.pointerId);
      el.querySelectorAll(".bi").forEach((q) => q.classList.toggle("sel", q === bi));
      const t = $("#btools");
      if (t) t.hidden = false;
      return;
    }
    if (boardStk) {
      if (S.board.items.length >= 60) {
        toast("Nástenka je plná.");
        return;
      }
      S.board.items.push({
        s: boardStk,
        x: ((e.clientX - r.left) / r.width) * 100,
        y: ((e.clientY - r.top) / r.height) * 100,
        z: 2.4,
        r: R(-12, 12),
      });
      boardSel = S.board.items.length - 1;
      save();
      tone(600 + R(0, 5) * 60, 0.08, "triangle", 0.07);
      rerender();
    } else {
      boardSel = null;
      toast("Najprv vyber nálepku dole.");
      rerender();
    }
  });
  el.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const r = el.getBoundingClientRect(),
      it = S.board.items[drag.i];
    it.x = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
    it.y = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100));
    drag.el.style.left = it.x + "%";
    drag.el.style.top = it.y + "%";
  });
  el.addEventListener("pointerup", () => {
    if (drag) {
      drag = null;
      save();
    }
  });
}
function rerenderBoardTools() {
  rerender();
}
function btool(k) {
  const it = S.board.items[boardSel];
  if (!it) return;
  if (k === "plus") it.z = Math.min(7, it.z + 0.6);
  if (k === "minus") it.z = Math.max(1.2, it.z - 0.6);
  if (k === "rot") it.r = (it.r + 20) % 360;
  if (k === "front") {
    S.board.items.splice(boardSel, 1);
    S.board.items.push(it);
    boardSel = S.board.items.length - 1;
  }
  if (k === "del") {
    S.board.items.splice(boardSel, 1);
    boardSel = null;
  }
  save();
  sfx.tap();
  rerender();
}
