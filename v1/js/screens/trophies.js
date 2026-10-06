/* ---------- stats, trophies, pet, parents ---------- */
function gst() {
  S.stats.g = S.stats.g || {};
  S.stats.learn = S.stats.learn || { count: { ok: 0, all: 0 }, letters: { ok: 0, all: 0 } };
  S.stats.best = S.stats.best || {};
  S.stats.wins = S.stats.wins || 0;
  return S.stats;
}
function learn(k, ok) {
  const s = gst().learn[k];
  s.all++;
  if (ok) s.ok++;
}
const tuneCount = () => Object.values(S.tOwn).reduce((a, l) => a + l.length, 0) - Object.keys(S.tOwn).length;
const TROPHIES = [
  ["first", "🎮", "Prvá hra", "Zahraj prvú hru", () => gst().games >= 1, 30],
  ["g50", "🕹️", "Hráč", "Zahraj 50 hier", () => gst().games >= 50, 200],
  ["g200", "👾", "Veľký hráč", "Zahraj 200 hier", () => gst().games >= 200, 800],
  ["win1", "🥇", "Víťaz", "Vyhraj preteky", () => gst().wins >= 1, 100],
  ["win10", "🏆", "Šampión", "Vyhraj 10 pretekov", () => gst().wins >= 10, 500],
  ["tracks", "🛣️", "Cestovateľ", "Odomkni všetky trate", () => S.tracks.length >= TRACKS.length, 1000],
  ["cars5", "🚙", "Zberateľ áut", "Maj 5 áut", () => S.cars.length >= 5, 300],
  ["carsAll", "🚀", "Celá garáž", "Maj všetkých 12 áut", () => S.cars.length >= CARS.length, 3000],
  ["tune10", "🎨", "Tuner", "Kúp 10 tuning dielov", () => tuneCount() >= 10, 300],
  ["wash20", "🧽", "Čistotný", "Umy 20 áut", () => (gst().g.wash || 0) >= 20, 200],
  ["city3", "🏗️", "Staviteľ", "Postav 3 budovy", () => Object.keys(S.bld).length >= 3, 150],
  ["cityAll", "🌆", "Starosta", "Postav všetky budovy", () => Object.keys(S.bld).length >= BLDS.length, 2000],
  [
    "bldMax",
    "🏛️",
    "Najlepšia budova",
    "Vylepši budovu na level 10",
    () => Object.values(S.bld).some((l) => l >= 10),
    800,
  ],
  ["page", "📒", "Prvá stránka", "Vyplň celú stránku albumu", () => S.pagesDone.length >= 1, 200],
  [
    "album",
    "🌟",
    "Celý album",
    "Vyplň celé album",
    () => PAGES.every((p, i) => p.season || S.pagesDone.includes(i)),
    1500,
  ],
  ["lvl10", "🔟", "Level 10", "Dosiahni level 10", () => S.lvl >= 10, 500],
  ["lvl20", "🎖️", "Level 20", "Dosiahni level 20", () => S.lvl >= 20, 1500],
  ["rich", "💰", "Boháč", "Zarob spolu 10 000 mincí", () => gst().earned >= 10000, 500],
  ["streak", "📅", "Verný kamarát", "Príď 7 dní za sebou", () => S.streak >= 7, 400],
  ["stars", "✨", "Hviezdár", "Získaj 100 hviezd", () => S.stars >= 100, 400],
  ["paint", "🖍️", "Maliar", "Vymaľuj 5 obrázkov", () => (gst().g.color || 0) >= 5, 200],
  ["mech", "🔧", "Mechanik", "Oprav 10 áut", () => (gst().g.repair || 0) >= 10, 300],
  ["maze", "🗺️", "Navigátor", "Prejdi 10 bludísk", () => (gst().g.maze || 0) >= 10, 300],
  ["read", "🔤", "Čitateľ", "Uhádni 100 písmeniek", () => gst().learn.letters.ok >= 100, 500],
  ["math", "🔢", "Počtár", "Vypočítaj 100 príkladov", () => gst().learn.count.ok >= 100, 500],
  ["music", "🎵", "Hudobník", "Zapamätaj si 8 tónov", () => (gst().best.music || 0) >= 8, 400],
  ["traffic", "🚦", "Policajt", "Preveď 25 áut cez križovatku", () => (gst().best.traffic || 0) >= 25, 400],
  ["crew5", "🐾", "Kamarátska partia", "Maj 5 kamarátov", () => (S.crew || []).length >= 5, 400],
  ["crew15", "🏡", "Plný domček", "Maj 15 kamarátov", () => (S.crew || []).length >= 15, 1500],
  [
    "crewAll",
    "💫",
    "Všetci kamaráti",
    "Maj všetkých 24 kamarátov",
    () => (S.crew || []).length >= LINES.length,
    5000,
  ],
  ["evo", "🌟", "Prvý vývoj", "Vyvinúť kamaráta", () => (S.crew || []).some((c) => c.st > 0), 300],
  [
    "legend",
    "👑",
    "Legenda",
    "Vyliahni legendárneho kamaráta",
    () => (S.crew || []).some((c) => lineOf(c).r === "l"),
    2000,
  ],
  [
    "lv10c",
    "💜",
    "Najlepší kamarát",
    "Kamarát na leveli 10",
    () => (S.crew || []).some((c) => c.lv >= 10),
    500,
  ],
  ["eggs10", "🥚", "Liahnička", "Vyliahni 10 vajíčok", () => (S.hatched || 0) >= 10, 600],
  ["silver", "🥈", "Strieborná", "Vylepši prvú nálepku", () => (gst().upg || 0) >= 1, 150],
  ["rainbowS", "🌈", "Dúhová nálepka", "Vylepši nálepku na dúhovú", () => (gst().rainbow || 0) >= 1, 1000],
  ["trader", "🦝", "Obchodník", "Urob 10 výmen u Mývala", () => (gst().trades || 0) >= 10, 500],
  [
    "pageGold",
    "📖",
    "Zlatá stránka",
    "Vylepši celú stránku na zlato",
    () => Object.values(S.pageTier || {}).some((t) => t >= 2),
    2000,
  ],
  ["explorer", "🧭", "Prieskumník", "Vráť sa z 10 výprav", () => (gst().exps || 0) >= 10, 600],
  [
    "bingo",
    "🎯",
    "Bingo!",
    "Vyplň celú bingo kartu",
    () => (S.bingo && S.bingo.n > 1) || (S.bingo && S.bingo.full),
    800,
  ],
  [
    "board20",
    "🖼️",
    "Umelec",
    "Nalep 20 nálepiek na nástenku",
    () => ((S.board || {}).items || []).length >= 20,
    300,
  ],
];
function checkTrophies() {
  S.troph = S.troph || {};
  const fresh = TROPHIES.filter((t) => !S.troph[t[0]] && t[4]());
  if (!fresh.length) return;
  fresh.forEach((t) => {
    S.troph[t[0]] = Date.now();
    S.coins += t[5];
  });
  hud();
  fresh.forEach((t, i) =>
    setTimeout(() => {
      const e = document.createElement("div");
      e.className = "trophyToast";
      e.innerHTML = `<span>${t[1]}</span><div><b>Nová trofej: ${t[2]}</b><small>+${fmt(t[5])} 🪙</small></div>`;
      document.body.appendChild(e);
      seq([784, 988, 1175], 90, 0.18, "triangle", 0.1);
      setTimeout(() => e.remove(), 3400);
    }, i * 3600),
  );
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) {}
}
