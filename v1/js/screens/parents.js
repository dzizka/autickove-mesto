/* parents */
let lastAct = Date.now();
document.addEventListener("pointerdown", () => (lastAct = Date.now()), true);
document.addEventListener("keydown", () => (lastAct = Date.now()), true);
setInterval(() => {
  if (document.visibilityState !== "visible" || Date.now() - lastAct > 120000) return;
  S.play = S.play || {};
  const k = today();
  S.play[k] = (S.play[k] || 0) + 15;
  const keys = Object.keys(S.play);
  if (keys.length > 21)
    keys
      .sort((a, b) => new Date(a) - new Date(b))
      .slice(0, keys.length - 21)
      .forEach((k) => delete S.play[k]);
  save();
}, 15000);
ACT.parents = () => {
  const s = gst(),
    days = [...Array(7)].map((_, i) => {
      const d = new Date(Date.now() - (6 - i) * 864e5);
      return [
        ["Ne", "Po", "Ut", "St", "Št", "Pi", "So"][d.getDay()],
        Math.round(((S.play || {})[dayKey(d)] || 0) / 60),
      ];
    }),
    mx = Math.max(10, ...days.map((d) => d[1]));
  const gl = GAMES.map((g) => [g, s.g[g.id] || 0])
      .filter((x) => x[1])
      .sort((a, b) => b[1] - a[1]),
    gm = Math.max(1, ...gl.map((x) => x[1]));
  const pct = (o) => (o.all ? Math.round((o.ok / o.all) * 100) + " %" : "–");
  modal(`<h2>Prehľad pre rodičov</h2><p class="small">Čas hrania sa len zaznamenáva, hra nič neobmedzuje.</p>
 <div class="pstat"><div><b>${days[6][1]} min</b><small>dnes</small></div><div><b>${days.reduce((a, d) => a + d[1], 0)} min</b><small>za 7 dní</small></div><div><b>${s.games}</b><small>hier spolu</small></div></div>
 <div class="pchart">${days.map(([n, m]) => `<div><i style="height:${(m / mx) * 100}%"></i><b>${m}</b><small>${n}</small></div>`).join("")}</div>
 <h3 class="ph3">Čo hrá najčastejšie</h3><div class="plist">${gl.length ? gl.map(([g, n]) => `<div><span>${g.e} ${g.n}</span><i style="width:${(n / gm) * 100}%"></i><b>${n}</b></div>`).join("") : '<p class="small">Zatiaľ žiadne hry.</p>'}</div>
 <h3 class="ph3">Učenie</h3><div class="pstat"><div><b>${pct(s.learn.count)}</b><small>správne v Počítaní (${s.learn.count.all})</small></div><div><b>${pct(s.learn.letters)}</b><small>správne v Písmenkách (${s.learn.letters.all})</small></div><div><b>${s.best.music || 0}</b><small>najdlhšia melódia</small></div></div>
 <div class="mrow"><button class="btn sun" data-act="settings">Späť</button></div>`);
};
