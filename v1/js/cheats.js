/* ---------- hidden test menu (long-press ⚙️ for 3 s, then a parent math question) ---------- */
let gearT = null,
  gearLong = false;
(() => {
  const g = document.querySelector(".gear");
  const start = () => {
    gearLong = false;
    clearTimeout(gearT);
    gearT = setTimeout(() => {
      gearLong = true;
      cheatGate();
    }, 3000);
  };
  const stop = () => clearTimeout(gearT);
  g.addEventListener("pointerdown", start);
  ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => g.addEventListener(ev, stop));
  g.addEventListener("contextmenu", (e) => e.preventDefault());
})();
let gateAns = 0;
function cheatGate() {
  const a = R(6, 9),
    b = R(6, 9);
  gateAns = a * b;
  tone(300, 0.1, "square", 0.05);
  modal(
    `<h2>Pre rodičov</h2><p>Koľko je ${a} × ${b}?</p><input id="gateIn" class="gatein" type="number" inputmode="numeric" autocomplete="off" aria-label="Výsledok"><div class="mrow"><button class="btn ghost" data-act="close">Zrušiť</button><button class="btn grass" data-act="gateok">OK</button></div>`,
  );
  setTimeout(() => $("#gateIn")?.focus(), 50);
}
ACT.gateok = () => {
  if (+$("#gateIn")?.value === gateAns) ACT.cheats();
  else {
    closeModal();
    toast("Nesprávne.");
  }
};
ACT.cheats = () =>
  modal(`<h2>Testovacie menu</h2><p class="small">Skryté pred dieťaťom. Zmeny sa hneď uložia.</p><div class="cheats">
 <button class="btn sun sm" data-cheat="c1k">+1 000 🪙</button><button class="btn sun sm" data-cheat="c10k">+10 000 🪙</button><button class="btn sun sm" data-cheat="c100k">+100 000 🪙</button>
 <button class="btn sun sm" data-cheat="stars">+10 ⭐</button><button class="btn plum sm" data-cheat="lvl">+1 level</button><button class="btn plum sm" data-cheat="lvl20">Level 20</button>
 <button class="btn grass sm" data-cheat="cars">Všetky autá</button><button class="btn grass sm" data-cheat="tracks">Všetky trate</button><button class="btn grass sm" data-cheat="tune">Celý tuning</button>
 <button class="btn grass sm" data-cheat="ups">Vylepšenia na max</button><button class="btn grass sm" data-cheat="city">Mesto na max</button><button class="btn grass sm" data-cheat="fill">Naplniť mince v meste</button>
 <button class="btn grass sm" data-cheat="album">Celé album</button><button class="btn grass sm" data-cheat="quests">Splniť úlohy</button><button class="btn grass sm" data-cheat="gift">Denný darček znova</button>
 <button class="btn grass sm" data-cheat="pet">Nakŕmiť kamaráta</button><button class="btn plum sm" data-cheat="candy">+50 🍬</button><button class="btn plum sm" data-cheat="eggs">+3 vajíčka</button><button class="btn plum sm" data-cheat="hatchnow">Vajíčka hneď pripravené</button><button class="btn plum sm" data-cheat="crewlv">Kamarát +1 level</button><button class="btn plum sm" data-cheat="crewall">Všetci kamaráti</button><button class="btn plum sm" data-cheat="expnow">Výpravy hneď hotové</button><button class="btn plum sm" data-cheat="bingo">Splniť bingo</button><button class="btn grass sm" data-cheat="hungry">Hladný kamarát</button><button class="btn ${S.cheatShort ? "tomato" : "ghost"} sm" data-cheat="short">Krátke preteky: ${S.cheatShort ? "zapnuté" : "vypnuté"}</button>
 </div><div class="mrow"><button class="btn ghost" data-act="close">Zavrieť</button></div>`);
function cheat(k) {
  const all = (a) => a.map((x) => x[0]);
  ({
    c1k: () => (S.coins += 1000),
    c10k: () => (S.coins += 10000),
    c100k: () => (S.coins += 100000),
    stars: () => {
      S.stars += 10;
      S.chest += 10;
    },
    lvl: () => {
      S.lvl++;
      S.xp = 0;
    },
    lvl20: () => {
      S.lvl = Math.max(S.lvl, 20);
      S.xp = 0;
    },
    cars: () => {
      S.cars = CARS.map((c) => c.e);
    },
    tracks: () => {
      S.tracks = TRACKS.map((t) => t.id);
    },
    tune: () => {
      Object.keys(TUNE).forEach((c) => (S.tOwn[c] = all(TUNE[c].items)));
    },
    ups: () => UPS.forEach((u) => (S.up[u.id] = u.max)),
    city: () => {
      S.lvl = Math.max(S.lvl, 14);
      BLDS.forEach((b) => {
        S.bld[b.id] = 10;
        S.bt[b.id] = S.bt[b.id] || Date.now();
      });
    },
    fill: () =>
      BLDS.forEach((b) => {
        if (bL(b.id)) S.bt[b.id] = Date.now() - 3 * 36e5;
      }),
    album: () => {
      PAGES.forEach((p) => p.s.forEach((x) => (S.stk[x] = Math.max(1, S.stk[x] || 0))));
      checkPages();
    },
    quests: () => S.quests.forEach((q) => (q.have = q.goal)),
    gift: () => {
      S.gift = "";
    },
    pet: () => {
      const p = act();
      if (p) {
        p.food = 100;
        p.joy = 100;
        p.t = Date.now();
      }
    },
    hungry: () => {
      const p = act();
      if (p) {
        p.food = 10;
        p.joy = 10;
        p.t = Date.now();
      }
    },
    candy: () => {
      S.candy += 50;
    },
    eggs: () => {
      giveEgg("n");
      giveEgg("g");
      giveEgg("n");
    },
    hatchnow: () => (S.eggs || []).forEach((e) => (e.p = 99)),
    expnow: () => (S.exp || []).forEach((x) => (x.start = Date.now() - x.dur)),
    bingo: () => {
      if (S.bingo)
        S.bingo.cells.forEach((c) => {
          if (c.have < c.goal) bingoTrack(c.k, c.goal);
        });
    },
    crewall: () => {
      LINES.forEach((L) => {
        if (!S.crew.find((c) => c.sp === L.id)) {
          S.crew.push(newCrew(L.id));
          S.dex[L.id] = 0;
        }
      });
    },
    crewlv: () => {
      const p = act();
      if (p) crewXP(p, crewNeed(p.lv));
    },
    short: () => {
      S.cheatShort = !S.cheatShort;
    },
  })[k]();
  hud();
  save();
  sfx.ok();
  toast("Hotovo ✔");
  ACT.cheats();
}
