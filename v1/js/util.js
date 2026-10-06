/* ---------- helpers ---------- */
const $ = (s) => document.querySelector(s);
const txt = (s, v) => {
  const e = document.querySelector(s);
  if (e) e.textContent = v;
};
const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuf = (a) => {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const fmt = (n) => Math.floor(n).toLocaleString("sk-SK");
const dayKey = (d) => d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
const today = () => dayKey(new Date());
/* Runs one animation frame; a thrown error skips the frame instead of freezing the game. After 30 errors in a row it gives up gracefully. */
function guardFrame(fn, onFatal) {
  let fails = 0;
  return (now) => {
    try {
      fn(now);
      fails = 0;
    } catch (e) {
      fails++;
      console.error(e);
      if (fails === 30 && onFatal) onFatal(e);
    }
  };
}
function stuckModal() {
  modal(
    `<div class="bigE">🙈</div><h2>Ups, auto sa zaseklo</h2><p>Nič sa nestalo, mince ti ostali.</p><div class="mrow"><button class="btn grass" data-act="home">🏠 Domov</button></div>`,
  );
  say("Ups, auto sa zaseklo. Poďme domov.");
}
const EMO = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
