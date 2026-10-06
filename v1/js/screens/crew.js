/* pet → crew of companions */
const PFOOD = [
  ["🍎", "Jablko", 10, 12, 0],
  ["🥕", "Mrkva", 15, 16, 0],
  ["🍌", "Banán", 20, 20, 2],
  ["🍕", "Pizza", 40, 35, 6],
  ["🍰", "Torta", 60, 40, 15],
  ["🍦", "Zmrzlina", 50, 20, 20],
];
const PWEAR = {
  hat: [
    ["🎀", "Mašľa", 120],
    ["🧢", "Šiltovka", 150],
    ["🎩", "Klobúk", 200],
    ["🎓", "Čiapka", 400],
    ["👑", "Koruna", 1500],
  ],
  face: [
    ["👓", "Okuliare", 200],
    ["🕶️", "Slnečné okuliare", 300],
  ],
  item: [
    ["🎈", "Balón", 100],
    ["⚽", "Lopta", 150],
    ["🪀", "Jojo", 250],
    ["🪁", "Šarkan", 350],
    ["🏆", "Pohár", 1000],
  ],
};
const RAR = {
  c: { n: "Bežný", c: "#8d99a8", m: 1, can: 10 },
  r: { n: "Vzácny", c: "#3a86ff", m: 1.2, can: 15 },
  e: { n: "Epický", c: "#9b5de5", m: 1.5, can: 25 },
  l: { n: "Legendárny", c: "#f0a500", m: 2, can: 50 },
};
const LINES = [
  {
    id: "pes",
    r: "c",
    s: [
      ["🐶", "Šteniatko"],
      ["🐕", "Psík"],
      ["🐺", "Vlk"],
    ],
    a: "raceCoins",
  },
  {
    id: "mac",
    r: "c",
    s: [
      ["🐱", "Mačiatko"],
      ["🐈", "Mačka"],
      ["🐯", "Tiger"],
    ],
    a: "pexeso",
  },
  {
    id: "zaj",
    r: "c",
    s: [
      ["🐰", "Zajačik"],
      ["🐇", "Zajac"],
      ["🦘", "Klokan"],
    ],
    a: "speed",
  },
  {
    id: "vta",
    r: "c",
    s: [
      ["🐣", "Kuriatko"],
      ["🐥", "Vtáčik"],
      ["🦅", "Orol"],
    ],
    a: "xp",
  },
  {
    id: "mys",
    r: "c",
    s: [
      ["🐭", "Myška"],
      ["🐹", "Škrečok"],
      ["🐿️", "Veverička"],
    ],
    a: "allCoins",
  },
  {
    id: "kac",
    r: "c",
    s: [
      ["🐤", "Kačiatko"],
      ["🦆", "Kačka"],
      ["🦢", "Labuť"],
    ],
    a: "wash",
  },
  {
    id: "opi",
    r: "c",
    s: [
      ["🐵", "Opička"],
      ["🐒", "Opica"],
      ["🦍", "Gorila"],
    ],
    a: "hintCount",
  },
  {
    id: "hus",
    r: "c",
    s: [
      ["🐛", "Húsenica"],
      ["🦋", "Motýľ"],
    ],
    a: "sticker",
  },
  { id: "lis", r: "c", s: [["🦊", "Líška"]], a: "city" },
  { id: "zab", r: "c", s: [["🐸", "Žabka"]], a: "eggs" },
  { id: "vce", r: "c", s: [["🐝", "Včielka"]], a: "allCoins" },
  {
    id: "ryb",
    r: "r",
    s: [
      ["🐟", "Rybka"],
      ["🐬", "Delfín"],
      ["🐳", "Veľryba"],
    ],
    a: "magnet",
  },
  {
    id: "med",
    r: "r",
    s: [
      ["🧸", "Macko"],
      ["🐻", "Medveď"],
      ["🐼", "Panda"],
    ],
    a: "city",
  },
  {
    id: "tuc",
    r: "r",
    s: [
      ["🐧", "Tučniak"],
      ["🦭", "Tuleň"],
    ],
    a: "shield",
  },
  { id: "sov", r: "r", s: [["🦉", "Sova"]], a: "hintLetters" },
  {
    id: "kon",
    r: "r",
    s: [
      ["🐴", "Poník"],
      ["🐎", "Kôň"],
    ],
    a: "speed",
  },
  {
    id: "kra",
    r: "r",
    s: [
      ["🦐", "Krevetka"],
      ["🦀", "Krab"],
      ["🐙", "Chobotnica"],
    ],
    a: "fuel",
  },
  { id: "kor", r: "r", s: [["🐢", "Korytnačka"]], a: "shield" },
  {
    id: "dino",
    r: "e",
    s: [
      ["🦎", "Jašterica"],
      ["🦕", "Dinosaurus"],
      ["🦖", "T-rex"],
    ],
    a: "raceCoins",
  },
  { id: "lev", r: "e", s: [["🦁", "Lev"]], a: "stars" },
  { id: "zir", r: "e", s: [["🦒", "Žirafa"]], a: "xp" },
  { id: "uni", r: "l", s: [["🦄", "Jednorožec"]], a: "stars" },
  {
    id: "drak",
    r: "l",
    s: [
      ["🐲", "Dráčik"],
      ["🐉", "Drak"],
    ],
    a: "allCoins",
  },
  { id: "ufo", r: "l", s: [["👽", "Mimozemšťan"]], a: "sticker" },
];
const pc = (v) => Math.round(v * 100) + " %";
const ABIL = {
  raceCoins: { b: 0.12, t: (v) => `+${pc(v)} mincí v pretekoch` },
  allCoins: { b: 0.06, t: (v) => `+${pc(v)} mincí vo všetkých hrách` },
  speed: { b: 0.04, t: (v) => `Auto je v pretekoch o ${pc(v)} rýchlejšie` },
  shield: { n: 1, t: (v) => `${v}× štít navyše na štarte pretekov` },
  hintLetters: { n: 1, t: () => "V Písmenkách schová jednu zlú odpoveď" },
  hintCount: { n: 1, t: () => "V Počítaní schová jednu zlú odpoveď" },
  pexeso: { n: 1, t: (v) => `V pexese nájde ${v} ${v > 1 ? "dvojice" : "dvojicu"} hneď na začiatku` },
  wash: { b: 0.25, t: (v) => `Umývanie je o ${pc(v)} rýchlejšie` },
  xp: { b: 0.15, t: (v) => `+${pc(v)} bodov na tvoj level` },
  stars: { b: 0.12, t: (v) => `Šanca ${pc(v)} na hviezdu navyše` },
  magnet: { n: 1, t: () => "V pretekoch priťahuje mince" },
  fuel: { b: 0.2, t: (v) => `Benzín vydrží o ${pc(v)} dlhšie` },
  city: { b: 0.15, t: (v) => `Budovy v meste zarábajú o ${pc(v)} viac` },
  eggs: { n: 1, t: (v) => `Vajíčka sa liahnu o ${v} ${v > 1 ? "hry" : "hru"} skôr` },
  sticker: { b: 0.12, t: (v) => `Šanca ${pc(v)} na nálepku po hre` },
};
const EGGS = {
  n: {
    n: "Vajíčko",
    p: 300,
    g: 3,
    odds: [
      ["c", 0.7],
      ["r", 0.25],
      ["e", 0.045],
      ["l", 0.005],
    ],
  },
  g: {
    n: "Zlaté vajíčko",
    p: 2500,
    g: 5,
    odds: [
      ["c", 0.1],
      ["r", 0.55],
      ["e", 0.28],
      ["l", 0.07],
    ],
  },
};
const lineOf = (c) => LINES.find((l) => l.id === c.sp);
const cE = (c) => lineOf(c).s[c.st][0],
  cN = (c) => lineOf(c).s[c.st][1];
const crewNeed = (lv) => 40 + lv * 25;
const act = () => (S.crew && S.crew.length ? S.crew[Math.min(S.active || 0, S.crew.length - 1)] : null);
function abilVal(c) {
  const L = lineOf(c),
    A = ABIL[L.a];
  if (A.n) return A.n + (c.st >= 2 ? 1 : 0);
  return Math.min(0.6, A.b * [1, 1.6, 2.4][c.st] * (1 + 0.05 * (c.lv - 1)) * RAR[L.r].m);
}
function abil(type) {
  const c = act();
  if (!c || lineOf(c).a !== type) return 0;
  return abilVal(c);
}
function petDecay() {
  const p = act();
  if (!p) return;
  const h = (Date.now() - p.t) / 36e5;
  p.food = Math.max(0, p.food - h * 4);
  p.joy = Math.max(0, p.joy - h * 3);
  p.t = Date.now();
}
function petMood() {
  const p = act();
  if (p.food < 25) return ["😢", "Mám hlad!"];
  if (p.joy < 25) return ["🥺", "Poď sa so mnou hrať!"];
  if (p.food > 70 && p.joy > 70) return ["😍", "Mám ťa rád!"];
  return ["🙂", "Je mi dobre."];
}
function petHTML(p, big) {
  const w = (k) => (p[k] ? `<span class="pw ${k}">${p[k]}</span>` : "");
  return `<span class="pet ${big ? "big" : ""}"><span class="pb">${cE(p)}</span>${w("hat")}${w("face")}${w("item")}</span>`;
}
function crewXP(c, xp) {
  if (!c) return;
  c.xp += xp;
  let up = 0;
  while (c.lv < 20 && c.xp >= crewNeed(c.lv)) {
    c.xp -= crewNeed(c.lv);
    c.lv++;
    up++;
  }
  if (c.lv >= 20) c.xp = Math.min(c.xp, crewNeed(20));
  if (up)
    setTimeout(() => {
      const r = c.lv * 20;
      S.coins += r;
      hud();
      save();
      toast(`${cE(c)} ${cN(c)} má level ${c.lv}! +${r} 🪙`);
      seq([659, 784, 988], 90, 0.15, "triangle", 0.09);
    }, 500);
}
function petGain(joy, xp) {
  const c = act();
  if (!c) return;
  petDecay();
  c.joy = Math.min(100, c.joy + joy);
  crewXP(c, xp);
}
const petLv = () => (act() ? act().lv : 0);
function newCrew(sp, st = 0) {
  return { sp, st, lv: 1, xp: 0, food: 80, joy: 80, t: Date.now(), hat: null, face: null, item: null };
}
function migrateCrew() {
  if (S.crew) return;
  S.crew = [];
  S.active = 0;
  S.eggs = S.eggs || [];
  S.candy = S.candy || 0;
  S.dex = S.dex || {};
  S.wearOwn = [];
  S.hatched = 0;
  if (S.pet) {
    const map = {
      "🐶": ["pes", 0],
      "🐱": ["mac", 0],
      "🐰": ["zaj", 0],
      "🦊": ["lis", 0],
      "🐼": ["med", 2],
      "🐸": ["zab", 0],
    }[S.pet.e] || ["pes", 0];
    const c = newCrew(map[0], map[1]);
    c.lv = Math.min(20, 1 + Math.floor((S.pet.xp || 0) / 100));
    c.food = S.pet.food;
    c.joy = S.pet.joy;
    c.hat = S.pet.hat;
    c.face = S.pet.face;
    c.item = S.pet.item;
    S.wearOwn = S.pet.own || [];
    S.crew.push(c);
    S.dex[c.sp] = c.st;
    S.eggs.push({ k: "n", p: 0 });
    delete S.pet;
  }
}
/* eggs & hatching */
function giveEgg(k = "n", why = "") {
  S.eggs = S.eggs || [];
  if (S.eggs.length >= 6) {
    S.candy += 5;
    toast("Inkubátor je plný, dostal si 5 🍬");
    return;
  }
  S.eggs.push({ k, p: 0 });
  save();
  if (why) toast(`🥚 ${why}: nové vajíčko!`);
}
const eggNeed = (e) => Math.max(1, EGGS[e.k].g - abil("eggs"));
function rollLine(k) {
  let r = Math.random(),
    rar = "c";
  for (const [x, o] of EGGS[k].odds) {
    if (r < o) {
      rar = x;
      break;
    }
    r -= o;
  }
  return pick(LINES.filter((l) => l.r === rar));
}
function hatch(i) {
  const e = S.eggs[i];
  if (!e || e.p < eggNeed(e)) return;
  S.eggs.splice(i, 1);
  track("hatch");
  const L = rollLine(e.k),
    own = S.crew.find((c) => c.sp === L.id);
  S.hatched = (S.hatched || 0) + 1;
  let msg = "";
  if (own) {
    const can = RAR[L.r].can;
    S.candy += can;
    msg = `<p>${L.s[0][1]} už v Domčeku býva. Dostal si <b>${can} 🍬</b> cukríkov.</p>`;
  } else {
    S.crew.push(newCrew(L.id));
    S.dex[L.id] = Math.max(S.dex[L.id] ?? 0, 0);
    S.candy += 3;
    msg = `<p>Nový kamarát v Domčeku! +3 🍬</p>`;
  }
  save();
  hud();
  tone(300, 0.1, "square", 0.06);
  modal(
    `<div class="hatch" style="--rc:${RAR[L.r].c}"><div class="egg ${e.k === "g" ? "gold" : ""}">🥚</div><div class="born">${L.s[0][0]}</div></div><div class="reveal2"><span class="rtag" style="--rc:${RAR[L.r].c}">${RAR[L.r].n}</span><h2>${L.s[0][1]}</h2>${msg}<p class="small">${ABIL[L.a].t(abilVal(own || newCrew(L.id)))}</p><div class="mrow"><button class="btn grass" data-act="close">Super!</button></div></div>`,
  );
  setTimeout(() => {
    sfx.win();
    confetti();
    say(own ? `${L.s[0][1]}! Ten už u teba býva, dostal si cukríky.` : `Nový kamarát! ${L.s[0][1]}!`);
  }, 1300);
}
function evolve() {
  const c = act(),
    L = lineOf(c);
  if (c.st >= L.s.length - 1) return;
  const req = c.st === 0 ? [5, 10] : [10, 25];
  if (c.lv < req[0]) {
    toast(`Potrebuje level ${req[0]}.`);
    return;
  }
  if (S.candy < req[1]) {
    toast(`Potrebuješ ${req[1]} 🍬 cukríkov.`);
    sfx.bad();
    return;
  }
  S.candy -= req[1];
  const from = cE(c);
  c.st++;
  S.dex[c.sp] = Math.max(S.dex[c.sp] ?? 0, c.st);
  save();
  hud();
  modal(
    `<div class="evo"><span class="from">${from}</span><span class="to">${cE(c)}</span></div><h2>${cN(c)}!</h2><p>Tvoj kamarát sa vyvinul a jeho schopnosť je silnejšia:</p><p><b>${ABIL[L.a].t(abilVal(c))}</b></p><div class="mrow"><button class="btn grass" data-act="close">Hurá!</button></div>`,
  );
  seq([392, 494, 587, 784, 988], 120, 0.2, "triangle", 0.1);
  setTimeout(() => {
    confetti();
    say(`Wau! ${cN(c)}!`);
  }, 1500);
}
