/* views */
let petTab = "room";
function crewCard(c, i) {
  const L = lineOf(c),
    on = i === (S.active || 0);
  return `<button class="cc ${on ? "on" : ""}" data-crew="${i}" style="--rc:${RAR[L.r].c}"><span class="ce2">${cE(c)}</span><b>${cN(c)}</b><small>lvl ${c.lv}</small>${on ? "<i>So mnou</i>" : onExp(i) ? '<i class="away">Na výprave</i>' : ""}</button>`;
}
function vPet() {
  const v = $("#view");
  migrateCrew();
  const ready = (S.eggs || []).filter((e) => e.p >= eggNeed(e)).length;
  const head = `<div class="seg"><button class="${petTab === "room" ? "on" : ""}" data-ptab="room">🐾 Kamarát</button><button class="${petTab === "home" ? "on" : ""}" data-ptab="home">🏡 Domček<small>${S.crew.length}/${LINES.length}</small></button><button class="${petTab === "eggs" ? "on" : ""}" data-ptab="eggs">🥚 Vajíčka${ready ? ' <i class="dotn">' + ready + "</i>" : ""}</button><button class="${petTab === "exp" ? "on" : ""}" data-ptab="exp">🗺️ Výpravy${(S.exp || []).some((x) => !expLeft(x)) ? ' <i class="dotn">!</i>' : ""}</button></div>`;
  if (petTab === "exp") {
    v.innerHTML = head + expHTML();
    return;
  }
  if (petTab === "home") {
    v.innerHTML =
      head +
      `<p class="hint" style="text-align:left;margin:10px 0">Ťukni na kamaráta a vezmi ho so sebou. Každý kamarát má inú schopnosť, ktorá pomáha v hrách. Šedé tiene sú kamaráti, ktorých ešte nemáš. Vyliahnu sa z vajíčok.</p>
  <div class="crewgrid">${LINES.map((L) => {
    const i = S.crew.findIndex((c) => c.sp === L.id);
    return i >= 0
      ? crewCard(S.crew[i], i)
      : `<div class="cc shadow" style="--rc:${RAR[L.r].c}"><span class="ce2">${L.s[0][0]}</span><b>?</b><small>${RAR[L.r].n}</small></div>`;
  }).join("")}</div>` +
      trophyHTML();
    return;
  }
  if (petTab === "eggs") {
    v.innerHTML =
      head +
      `<div class="incub"><h2>Inkubátor <small>${(S.eggs || []).length}/6</small></h2><p class="hint" style="text-align:left;margin:0 0 10px">Vajíčko sa vyliahne, keď odohráš pár hier. Môže z neho byť nový kamarát!</p>
  <div class="eggs">${
    (S.eggs || [])
      .map((e, i) => {
        const n = eggNeed(e),
          ok = e.p >= n;
        return `<div class="eggslot ${ok ? "ready" : ""}"><span class="egg ${e.k === "g" ? "gold" : ""}">🥚</span><small>${EGGS[e.k].n}</small>${ok ? `<button class="btn sun sm" data-hatch="${i}">Vyliahnuť!</button>` : `<div class="prog"><i style="width:${(e.p / n) * 100}%"></i></div><small>${e.p}/${n} hier</small>`}</div>`;
      })
      .join("") ||
    '<p class="hint">Inkubátor je prázdny. Kúp si vajíčko alebo ho získaj za level a truhlu.</p>'
  }</div></div>
  <h2>Obchod s vajíčkami</h2><div class="packs">${Object.entries(EGGS)
    .map(
      ([k, E]) =>
        `<button class="pack ${k === "g" ? "gold" : ""}" data-buyegg="${k}"><span class="egg ${k === "g" ? "gold" : ""}" style="font-size:3rem">🥚</span><b>${E.n}</b><small>Vyliahne sa po ${E.g} hrách.<br>${E.odds
          .filter((o) => o[1] >= 0.01)
          .map((o) => `${RAR[o[0]].n} ${Math.round(o[1] * 100)} %`)
          .join(
            ", ",
          )}</small><span class="btn sun sm ${S.coins < E.p ? "poor" : ""}">🪙 ${fmt(E.p)}</span></button>`,
    )
    .join("")}</div>
  <p class="hint" style="text-align:left">Vajíčko dostaneš aj za každý druhý level a niekedy v hviezdnej truhle. Ak sa vyliahne kamarát, ktorého už máš, dostaneš 🍬 cukríky na vývoj.</p>`;
    return;
  }
  const p = act();
  if (!p) {
    v.innerHTML = `<h2>Vyber si prvého kamaráta</h2><p class="hint" style="text-align:left;margin:0 0 12px">Kamarát ťa sprevádza, rastie a pomáha ti v hrách. Ďalších kamarátov vyliahneš z vajíčok.</p><div class="petpick">${[
      "pes",
      "mac",
      "zaj",
    ]
      .map((sp) => {
        const L = LINES.find((l) => l.id === sp);
        return `<button class="pp" data-starter="${sp}"><span>${L.s[0][0]}</span><b>${L.s[0][1]}</b><small>${ABIL[L.a].t(abilVal(newCrew(sp)))}</small></button>`;
      })
      .join("")}</div>`;
    say("Vyber si prvého kamaráta!");
    return;
  }
  petDecay();
  save();
  const L = lineOf(p),
    [mf, mt] = petMood(),
    need = crewNeed(p.lv),
    evo = p.st < L.s.length - 1 ? (p.st === 0 ? [5, 10] : [10, 25]) : null,
    canEvo = evo && p.lv >= evo[0] && S.candy >= evo[1];
  v.innerHTML =
    head +
    `<section class="room" style="--rc:${RAR[L.r].c}"><span class="rtag">${RAR[L.r].n}</span><div class="mood"><span>${mf}</span>${mt}</div><button class="petbtn" data-act="petpat" aria-label="Pohladkať">${petHTML(p, true)}</button><div class="pname"><b>${cN(p)}</b><small>Level ${p.lv}${p.lv >= 20 ? " (max)" : ""} · 🍬 ${S.candy} cukríkov</small></div>
  <div class="chain">${L.s.map((s, i) => `<span class="${i <= p.st ? "on" : ""}">${i <= (S.dex[p.sp] ?? 0) || i <= p.st ? s[0] : "❔"}</span>`).join("<i>➜</i>")}</div>
  <div class="bars"><div><span>⭐ Level</span><div class="prog"><i style="width:${p.lv >= 20 ? 100 : (p.xp / need) * 100}%;background:var(--plum)"></i></div></div><div><span>🍽️ Sýtosť</span><div class="prog"><i style="width:${p.food}%;background:${p.food < 25 ? "var(--tomato)" : "var(--grass)"}"></i></div></div><div><span>😊 Radosť</span><div class="prog"><i style="width:${p.joy}%;background:${p.joy < 25 ? "var(--tomato)" : "var(--sun)"}"></i></div></div></div>
  <p class="abil">✨ ${ABIL[L.a].t(abilVal(p))}</p>
  <div class="mrow" style="margin-top:4px"><button class="btn plum sm ${S.candy < 1 || p.lv >= 20 ? "poor" : ""}" data-act="candy">🍬 Dať cukrík (+40 bodov)</button>${evo ? `<button class="btn ${canEvo ? "sun" : "ghost"} sm" data-act="evolve">🌟 Vyvinúť: level ${evo[0]} + ${evo[1]} 🍬</button>` : '<span class="tag">Najvyšší vývoj ✔</span>'}</div>
  <p class="hint">Kamarát rastie, keď s ním hráš hry, kŕmiš ho a hladkáš.</p></section>
 <h2>Jedlo</h2><div class="opts">${PFOOD.map(([e, n, c]) => `<button class="opt ${S.coins < c ? "poor" : ""}" data-feed="${e}"><span class="oe">${e}</span><span>${n}</span><small>🪙 ${c}</small></button>`).join("")}</div>
 <h2>Šatník</h2>${Object.entries(PWEAR)
   .map(
     ([slot, items]) =>
       `<div class="opts" style="margin-bottom:8px">${items
         .map(([e, n, c]) => {
           const own = (S.wearOwn || []).includes(e),
             on = p[slot] === e;
           return `<button class="opt ${on ? "on" : ""} ${!own && S.coins < c ? "poor" : ""}" data-wear="${slot}|${e}"><span class="oe">${e}</span><span>${n}</span><small>${on ? "Dať dole" : own ? "Obliecť" : "🪙 " + fmt(c)}</small></button>`;
         })
         .join("")}</div>`,
   )
   .join("")}`;
}
function trophyHTML() {
  S.troph = S.troph || {};
  const n = TROPHIES.filter((t) => S.troph[t[0]]).length;
  return `<h2>Trofeje <small>${n}/${TROPHIES.length}</small></h2><div class="trophies">${TROPHIES.map((t) => {
    const on = S.troph[t[0]];
    return `<div class="tro ${on ? "on" : ""}"><span>${on ? t[1] : "🔒"}</span><b>${t[2]}</b><small>${t[3]}</small>${on ? "" : `<em>🪙 ${fmt(t[5])}</em>`}</div>`;
  }).join("")}</div>`;
}
let patT = 0;
ACT.petpat = () => {
  const p = act();
  if (!p) return;
  const el = $(".petbtn .pet");
  el.classList.remove("jump");
  void el.offsetWidth;
  el.classList.add("jump");
  const hrt = document.createElement("span");
  hrt.className = "heart";
  hrt.textContent = pick(["💖", "💕", "💗", "✨"]);
  hrt.style.left = 40 + Math.random() * 20 + "%";
  $(".petbtn").appendChild(hrt);
  setTimeout(() => hrt.remove(), 1000);
  tone(pick([660, 784, 880]), 0.12, "sine", 0.08);
  if (Date.now() - patT > 1500) {
    patT = Date.now();
    petGain(3, 2);
    save();
    const m = $(".mood");
    if (m) {
      const [mf, mt] = petMood();
      m.innerHTML = `<span>${mf}</span>${mt}`;
    }
  }
};
function feed(e, btn) {
  const f = PFOOD.find((x) => x[0] === e),
    p = act();
  if (!p) return;
  if (S.coins < f[2]) return poor(btn);
  petDecay();
  S.coins -= f[2];
  track("feed");
  p.food = Math.min(100, p.food + f[3]);
  p.joy = Math.min(100, p.joy + f[4]);
  crewXP(p, 5);
  hud();
  save();
  sfx.ok();
  say(pick(["Mňam!", "Ďakujem!", "To je dobré!"]));
  rerender();
  const pb = $(".petbtn");
  if (pb) {
    const s = document.createElement("span");
    s.className = "heart";
    s.textContent = e;
    s.style.left = "50%";
    pb.appendChild(s);
    setTimeout(() => s.remove(), 1000);
  }
}
function wear(v, btn) {
  const [slot, e] = v.split("|"),
    it = PWEAR[slot].find((x) => x[0] === e),
    p = act();
  if (!p) return;
  S.wearOwn = S.wearOwn || [];
  if (p[slot] === e) {
    p[slot] = null;
  } else {
    if (!S.wearOwn.includes(e)) {
      if (S.coins < it[2]) return poor(btn);
      S.coins -= it[2];
      S.wearOwn.push(e);
      hud();
      confetti();
    }
    p[slot] = e;
    petGain(5, 3);
  }
  save();
  sfx.ok();
  rerender();
}
ACT.candy = () => {
  const p = act();
  if (!p || p.lv >= 20) return;
  if (S.candy < 1) {
    toast("Nemáš cukríky. Získaš ich z vajíčok.");
    sfx.bad();
    return;
  }
  S.candy--;
  crewXP(p, 40);
  petGain(4, 0);
  sfx.ok();
  save();
  rerender();
};
ACT.evolve = () => evolve();
function pickCrew(i) {
  if (onExp(i)) {
    toast("Tento kamarát je na výprave.");
    return;
  }
  S.active = i;
  const p = act();
  p.t = Date.now();
  save();
  sfx.ok();
  say(`${cN(p)} ide s tebou!`);
  toast(`${cE(p)} ${cN(p)} ide s tebou`);
  rerender();
}
function pickStarter(sp) {
  S.crew = [newCrew(sp)];
  S.active = 0;
  S.dex[sp] = 0;
  S.eggs.push({ k: "n", p: 0 });
  save();
  sfx.win();
  confetti();
  say(`Ahoj! Ja som ${LINES.find((l) => l.id === sp).s[0][1]}. Budeme kamaráti! A tu máš aj vajíčko.`);
  petTab = "room";
  rerender();
}
function buyEgg(k, btn) {
  const E = EGGS[k];
  if ((S.eggs || []).length >= 6) {
    toast("Inkubátor je plný. Najprv vyliahni vajíčka.");
    return;
  }
  if (S.coins < E.p) return poor(btn);
  S.coins -= E.p;
  giveEgg(k);
  hud();
  sfx.win();
  rerender();
}
