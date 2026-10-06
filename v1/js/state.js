/* ---------- state ---------- */
const KEY = "autickove-mesto-v1";
const DEF = () => ({
  coins: 40,
  stars: 0,
  chest: 0,
  xp: 0,
  lvl: 1,
  car: "🚗",
  cars: ["🚗"],
  up: {},
  bld: {},
  bt: {},
  stk: {},
  pagesDone: [],
  quests: [],
  gift: "",
  streak: 0,
  snd: true,
  voice: true,
  stats: { games: 0, earned: 0 },
  tune: {},
  tOwn: Object.fromEntries(Object.keys(TUNE).map((k) => [k, [TUNE[k].items[0][0]]])),
  tracks: ["city"],
  tBest: {},
  gallery: [],
});
let S = DEF();
function load() {
  try {
    const t = localStorage.getItem(KEY);
    if (t) return Object.assign(DEF(), JSON.parse(t));
  } catch (e) {}
  return DEF();
}
let saveT;
function save() {
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(S));
    } catch (e) {}
    if (typeof checkTrophies === "function") checkTrophies();
  }, 150);
}

const upL = (id) => S.up[id] || 0;
const upCost = (u) => Math.round(u.p * Math.pow(u.g, upL(u.id)));
const mult = () => 1 + 0.15 * upL("bonus");
const carIdx = () =>
  Math.max(
    0,
    CARS.findIndex((c) => c.e === S.car),
  );
const need = (l) => 40 + l * 35;
const gUnlocked = (id) => S.lvl >= GAMES.find((g) => g.id === id).u;
const bL = (id) => S.bld[id] || 0;
const bRate = (b) => b.r * bL(b.id) * (1 + (typeof abil === "function" ? abil("city") : 0));
const bCap = (b) => bRate(b) * 180;
const bStore = (b) => {
  if (!bL(b.id)) return 0;
  const t = S.bt[b.id] || Date.now();
  return Math.max(0, Math.min(bCap(b), ((Date.now() - t) / 60000) * bRate(b)));
};
const bCost = (b) => Math.round(b.p * Math.pow(1.75, bL(b.id)));
