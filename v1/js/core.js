/* ---------- sound & voice ---------- */
let AC;
function tone(f, d = 0.12, type = "sine", v = 0.15) {
  if (!S.snd) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === "suspended") AC.resume();
    const o = AC.createOscillator(),
      g = AC.createGain();
    o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(v, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + d);
    o.connect(g).connect(AC.destination);
    o.start();
    o.stop(AC.currentTime + d);
  } catch (e) {}
}
const seq = (fs, gap, d, type, v) => fs.forEach((f, i) => setTimeout(() => tone(f, d, type, v), i * gap));
const sfx = {
  tap: () => tone(660, 0.05, "triangle", 0.08),
  coin: () => seq([988, 1319], 60, 0.1, "square", 0.05),
  ok: () => seq([523, 659, 784], 80, 0.15, "triangle", 0.12),
  bad: () => tone(170, 0.22, "sawtooth", 0.07),
  win: () => seq([523, 659, 784, 1047], 110, 0.22, "triangle", 0.13),
};
function sweep(f1, f2, d, type = "sawtooth", v = 0.08) {
  if (!S.snd) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === "suspended") AC.resume();
    const o = AC.createOscillator(),
      g = AC.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f1, AC.currentTime);
    o.frequency.linearRampToValueAtTime(f2, AC.currentTime + d);
    g.gain.setValueAtTime(v, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + d);
    o.connect(g).connect(AC.destination);
    o.start();
    o.stop(AC.currentTime + d);
  } catch (e) {}
}
function horn(id) {
  if (id === "duck") {
    [0, 190].forEach((dl) => setTimeout(() => sweep(900, 520, 0.14, "sawtooth", 0.07), dl));
  } else if (id === "siren") {
    sweep(600, 950, 0.35, "square", 0.05);
    setTimeout(() => sweep(950, 600, 0.35, "square", 0.05), 360);
  } else if (id === "trumpet") seq([523, 659, 784, 1047], 110, 0.2, "square", 0.07);
  else if (id === "song") seq([659, 659, 698, 784, 784, 698, 659, 587], 140, 0.16, "triangle", 0.11);
  else {
    tone(415, 0.4, "square", 0.06);
    tone(523, 0.4, "square", 0.05);
  }
}
function say(t) {
  if (!S.voice) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "sk-SK";
    u.rate = 0.95;
    u.pitch = 1.1;
    const vs = speechSynthesis.getVoices();
    const v = vs.find((v) => /^sk/i.test(v.lang)) || vs.find((v) => /^cs/i.test(v.lang));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  } catch (e) {}
}

/* ---------- ui bits ---------- */
function hud() {
  txt("#coinN", fmt(S.coins));
  txt("#starN", fmt(S.stars));
  txt("#lvlN", S.lvl);
  $("#xpF").style.width = Math.min(100, (S.xp / need(S.lvl)) * 100) + "%";
}
function bump(id) {
  const e = $(id);
  e.classList.remove("bump");
  void e.offsetWidth;
  e.classList.add("bump");
}
function toast(t) {
  document.querySelectorAll(".toast").forEach((x) => x.remove());
  const e = document.createElement("div");
  e.className = "toast";
  e.textContent = t;
  document.body.appendChild(e);
  setTimeout(() => e.remove(), 2200);
}
function floatText(el, t) {
  const p = ptOf(el);
  if (!p) return;
  const e = document.createElement("div");
  e.className = "float";
  e.textContent = t;
  e.style.left = p.x + "px";
  e.style.top = p.y + "px";
  document.body.appendChild(e);
  setTimeout(() => e.remove(), 1000);
}
function modal(html) {
  const m = $("#modal");
  m.innerHTML = `<div class="mbox">${html}</div>`;
  m.hidden = false;
}
function closeModal() {
  const m = $("#modal");
  m.hidden = true;
  m.innerHTML = "";
}
function poor(btn) {
  if (btn) {
    btn.classList.remove("shake");
    void btn.offsetWidth;
    btn.classList.add("shake");
  }
  sfx.bad();
  toast("Potrebuješ viac mincí. Zahraj si hru!");
  say("Potrebuješ viac mincí. Zahraj si hru!");
}
function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = $("#fx"),
    x = c.getContext("2d");
  c.width = innerWidth;
  c.height = innerHeight;
  const P = Array.from({ length: 90 }, () => ({
    x: innerWidth / 2,
    y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 16,
    vy: -Math.random() * 14 - 4,
    r: Math.random() * 7 + 5,
    c: pick(["#ff5a4a", "#ffc533", "#2fb257", "#3a86ff", "#7b5cff"]),
    a: Math.random() * 6,
  }));
  let f = 0;
  (function step() {
    x.clearRect(0, 0, c.width, c.height);
    P.forEach((p) => {
      p.vy += 0.45;
      p.x += p.vx;
      p.y += p.vy;
      p.a += 0.2;
      x.save();
      x.translate(p.x, p.y);
      x.rotate(p.a);
      x.fillStyle = p.c;
      x.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
      x.restore();
    });
    if (++f < 110) requestAnimationFrame(step);
    else x.clearRect(0, 0, c.width, c.height);
  })();
}

/* ---------- economy ---------- */
function addCoins(n, el) {
  n = Math.round(n);
  S.coins += n;
  if (n > 0) {
    S.stats.earned += n;
    track("earn", n);
  }
  hud();
  bump("#coinP");
  if (el && n > 0) {
    floatText(el, "+" + fmt(n) + " 🪙");
    flyCoins(el, Math.min(9, 2 + Math.floor(Math.log2(n + 1))));
  }
  save();
}
function addStars(n) {
  S.stars += n;
  S.chest += n;
  hud();
  bump("#starP");
  save();
}
function addXP(n) {
  S.xp += Math.round(n);
  let up = 0;
  while (S.xp >= need(S.lvl)) {
    S.xp -= need(S.lvl);
    S.lvl++;
    up++;
  }
  hud();
  save();
  return up;
}
function newQuest() {
  const ok = QT.filter(
    (q) =>
      (!q.game || gUnlocked(q.game)) &&
      (!q.city || Object.keys(S.bld).length) &&
      !S.quests.some((x) => x.k === q.k),
  );
  const q = pick(ok);
  let goal = pick(q.g);
  if (q.scale) goal = Math.round((goal * (1 + S.lvl * 0.4)) / 10) * 10;
  return { k: q.k, goal, have: 0, rew: 40 + S.lvl * 20 };
}
function fillQuests() {
  while (S.quests.length < 3) S.quests.push(newQuest());
  save();
}
function track(k, n = 1) {
  S.quests.forEach((q) => {
    if (q.k === k && q.have < q.goal) q.have = Math.min(q.goal, q.have + n);
  });
  if (typeof bingoTrack === "function") bingoTrack(k, n);
  save();
}
function drawStk(gold) {
  const g = gold || Math.random() < 0.15;
  const w = (x) => {
    const P = PAGES[x.p];
    if (!pageOpen(x.p)) return 0;
    if (!P.season) return 1;
    return inSeason(P) ? 2 : 0.2;
  };
  const cand = ALLS.filter((x) => x.gold === g && w(x) > 0);
  const tot = cand.reduce((a, x) => a + w(x), 0);
  let r = Math.random() * tot;
  for (const x of cand) {
    r -= w(x);
    if (r <= 0) return x;
  }
  return cand[cand.length - 1];
}
function giveStk(x) {
  const isNew = !S.stk[x.s];
  S.stk[x.s] = (S.stk[x.s] || 0) + 1;
  if (!isNew) S.coins += 10;
  track("stk" + x.p);
  if (x.gold) track("gold");
  return isNew;
}
function checkPages() {
  const done = [];
  PAGES.forEach((p, i) => {
    if (!S.pagesDone.includes(i) && p.s.every((s) => S.stk[s])) {
      S.pagesDone.push(i);
      S.coins += 300;
      S.stars += 3;
      S.chest += 3;
      done.push(p.n);
    }
  });
  if (PAGES.every((p, i) => p.season || S.pagesDone.includes(i)) && !S.albumDone) {
    S.albumDone = true;
    S.coins += 2000;
    done.push("CELÉ ALBUM");
  }
  hud();
  save();
  return done;
}
