/* ---------- boot ---------- */
function start(d) {
  S = d && d.S ? Object.assign(DEF(), d.S) : load();
  migrateCrew();
  Object.keys(TUNE).forEach((k) => {
    S.tOwn[k] = S.tOwn[k] || [TUNE[k].items[0][0]];
  });
  applySky();
  setInterval(applySky, 60000);
  fillQuests();
  hud();
  show("games");
}
start({});
