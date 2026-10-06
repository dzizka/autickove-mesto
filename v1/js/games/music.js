/* ---------- HUDOBNÁ GARÁŽ ---------- */
GAMEFN.music = (v) => {
  const MQ = (t) => {
    const e = $("#mq");
    if (e) e.textContent = t;
  };
  const COL = [
    ["#ff4d4d", 262],
    ["#3a86ff", 330],
    ["#ffd23f", 392],
    ["#2ec27e", 523],
  ];
  let seqA = [],
    inp = 0,
    busy = true,
    lives = 2,
    best = 0;
  v.className = "gameview scroll";
  v.innerHTML =
    gHead(
      "Hudobná garáž",
      `<span class="gstat">🎵 <b id="ml">0</b></span><span class="gstat" id="mh">❤️❤️</span>`,
    ) +
    `<div class="music"><p class="lq" id="mq">Autíčka zahrajú melódiu. Zopakuj ju!</p><div class="mcars">${COL.map((c, i) => `<button class="mcar" data-m="${i}" style="--mc:${c[0]}" aria-label="Auto">${carSVG(c[0])}</button>`).join("")}</div><div class="mrow"><button class="btn sun" id="mstart">▶ Začať</button></div></div>`;
  say("Autíčka zahrajú melódiu. Pozeraj a počúvaj, potom ju zopakuj.");
  const btns = [...v.querySelectorAll(".mcar")];
  const flash = (i) => {
    const b = btns[i];
    b.classList.add("on");
    tone(COL[i][1], 0.35, "square", 0.09);
    setTimeout(() => b.classList.remove("on"), 320);
  };
  function play() {
    busy = true;
    inp = 0;
    MQ("Počúvaj…");
    seqA.forEach((n, i) =>
      setTimeout(
        () => {
          if (!(G && G.done)) flash(n);
        },
        500 + i * 650,
      ),
    );
    setTimeout(
      () => {
        busy = false;
        MQ("Teraz ty!");
      },
      500 + seqA.length * 650,
    );
  }
  $("#mstart").onclick = () => {
    $("#mstart").parentNode.remove();
    seqA = [R(0, 3), R(0, 3)];
    play();
  };
  btns.forEach(
    (b, i) =>
      (b.onclick = () => {
        if (busy) return;
        flash(i);
        if (seqA[inp] === i) {
          inp++;
          if (inp === seqA.length) {
            best = seqA.length;
            gst().best.music = Math.max(gst().best.music || 0, best);
            {
              const e = $("#ml");
              if (e) e.textContent = best;
            }
            busy = true;
            MQ("Výborne! Ďalšia, dlhšia…");
            setTimeout(() => sfx.ok(), 350);
            seqA.push(R(0, 3));
            setTimeout(play, 1300);
          }
        } else {
          lives--;
          txt("#mh", "❤️".repeat(lives) + "🖤".repeat(2 - lives));
          sfx.bad();
          busy = true;
          if (lives > 0) {
            MQ("Ups! Ešte raz to isté.");
            say("Ups! Skús to ešte raz.");
            setTimeout(play, 1300);
          } else {
            const s = best >= 6 ? 3 : best >= 4 ? 2 : 1;
            setTimeout(
              () => finish("music", 10 + best * 5, s, 8 + best * 2, `<p>Zapamätal si si ${best} tónov!</p>`),
              600,
            );
          }
        }
      }),
  );
  G = { stop() {} };
};
