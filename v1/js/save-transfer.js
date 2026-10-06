/* ---------- save transfer (export / import) ---------- */
function exportCode() {
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) {}
  const b = new TextEncoder().encode(JSON.stringify(S));
  let bin = "";
  b.forEach((c) => (bin += String.fromCharCode(c)));
  return "AM1:" + btoa(bin);
}
function parseCode(t) {
  t = (t || "").trim().replace(/\s+/g, "");
  if (!t.startsWith("AM1:")) throw 0;
  const bin = atob(t.slice(4)),
    b = Uint8Array.from(bin, (c) => c.charCodeAt(0)),
    d = JSON.parse(new TextDecoder().decode(b));
  if (typeof d !== "object" || typeof d.coins !== "number") throw 0;
  return d;
}
let pendingImport = null;
ACT.xfer = () =>
  modal(`<h2>Preniesť postup</h2><p class="small">Postup sa ukladá len v tomto prehliadači. Ak chceš hrať na inej adrese alebo zariadení, skopíruj tu kód a vlož ho tam.</p>
 <h3 class="ph3">1. Skopírovať tento postup</h3><textarea id="xout" class="xcode" readonly aria-label="Kód postupu">${exportCode()}</textarea><div class="mrow" style="margin-top:6px"><button class="btn sun sm" data-act="xcopy">📋 Kopírovať kód</button></div>
 <h3 class="ph3">2. Vložiť postup z inej hry</h3><textarea id="xin" class="xcode" placeholder="Sem vlož kód, ktorý začína AM1:" aria-label="Vložiť kód"></textarea><div class="mrow" style="margin-top:6px"><button class="btn plum sm" data-act="xcheck">📥 Načítať kód</button></div><div id="xmsg"></div>
 <div class="mrow"><button class="btn ghost" data-act="settings">Späť</button></div>`);
ACT.xcopy = () => {
  const t = $("#xout");
  const done = () => toast("Kód je skopírovaný.");
  const fb = () => {
    t.focus();
    t.select();
    toast("Kód je označený. Skopíruj ho (Ctrl+C alebo podrž prst).");
  };
  try {
    navigator.clipboard.writeText(t.value).then(done, fb);
  } catch (e) {
    fb();
  }
};
ACT.xcheck = () => {
  const m = $("#xmsg");
  try {
    pendingImport = parseCode($("#xin").value);
    const d = pendingImport;
    m.innerHTML = `<div class="xok"><p>Našiel som postup: <b>level ${d.lvl || 1}</b>, <b>${fmt(d.coins)} 🪙</b>, áut: <b>${(d.cars || []).length}</b>, kamarátov: <b>${(d.crew || []).length || (d.pet ? 1 : 0)}</b>.</p><p><b>Terajší postup v tomto prehliadači sa nahradí.</b></p><div class="mrow"><button class="btn tomato sm" data-act="ximport">Áno, nahradiť</button></div></div>`;
  } catch (e) {
    pendingImport = null;
    m.innerHTML =
      '<p class="xerr">Kód sa nedá načítať. Skontroluj, či si skopíroval celý kód od AM1: až po koniec.</p>';
  }
};
ACT.ximport = () => {
  if (!pendingImport) return;
  S = Object.assign(DEF(), pendingImport);
  pendingImport = null;
  migrateCrew();
  Object.keys(TUNE).forEach((k) => {
    S.tOwn[k] = S.tOwn[k] || [TUNE[k].items[0][0]];
  });
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) {}
  closeModal();
  hud();
  applySky();
  show("games");
  sfx.win();
  toast("Postup je prenesený ✔");
};
