// ⭐ Playing with a buddy (DESIGN-v2 §6.1, part 21): stars fall from the sky and the buddy
// catches them. The buddy runs to where the child taps or drags. No words, nothing to lose:
// a missed star just fades. 3 games a day per buddy give XP and a few coins.

import { h } from "../../core/ui.js";
import { go } from "../../core/router.js";
import { drawEmoji } from "../../render/emoji.js";
import { CREW_RULES as R } from "../../data/crew.js";
import { buddyIcon, activeBuddy } from "../../systems/crew.js";
import { playsLeft } from "../../systems/crew-care.js";

const BIG_EVERY = 7; // every ~7th star is a big one 🌟 (counts 3)
let cleanup = [];

export default {
  id: "buddy",
  title: "Hra s kamarátom",
  icon: "⭐",
  unlockLevel: 1,
  hidden: true, // started from the buddy card, not from a menu
  backTo: { screen: "crew", icon: "🐣", label: "Kamaráti" },

  start(view, ctx) {
    const s = ctx.state();
    const id = s.crew.owned[ctx.params[0]] ? ctx.params[0] : activeBuddy(s)?.id;
    if (!id) return go("crew");
    const icon = buddyIcon(s.crew.owned[id]);
    const short = !!s.cheats.shortRaces;
    const duration = short ? 6 : R.playSeconds;

    const canvas = h("canvas", { class: "bplay-canvas", "data-testid": "bplay-canvas" });
    const fill = h("i");
    const pile = h("div", { class: "bplay-pile", "data-testid": "bplay-pile", "aria-hidden": "true" });
    const wrap = h(
      "section",
      { class: "screen game bplay", "data-testid": "screen-game-buddy", "data-buddy": id, "data-counts": String(playsLeft(id) > 0) },
      canvas,
      h("div", { class: "bplay-top" }, h("button", { class: "icon-btn", "data-testid": "game-exit", "aria-label": "Kamaráti", onclick: () => go("crew") }, "🐣"), h("div", { class: "mini-progress bplay-time" }, fill), pile),
    );
    view.append(wrap);

    const g = canvas.getContext("2d");
    let w = 0;
    let hh = 0;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = wrap.clientWidth || 360;
      hh = wrap.clientHeight || 640;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(hh * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // every object gets all its coordinates at creation (DESIGN-v2 §3)
    const pal = { x: 0.5, to: 0.5, hop: 0 };
    const stars = [];
    const sparks = [];
    let spawnIn = 0.6;
    let made = 0;
    let caught = 0;
    let time = 0;

    const aim = (e) => {
      const r = canvas.getBoundingClientRect();
      pal.to = Math.max(0.06, Math.min(0.94, (e.clientX - r.left) / r.width));
    };
    const down = (e) => {
      aim(e);
      canvas.setPointerCapture?.(e.pointerId);
    };
    const move = (e) => e.buttons && aim(e);
    const key = (e) => {
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") pal.to = Math.max(0.06, pal.to - 0.15);
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") pal.to = Math.min(0.94, pal.to + 0.15);
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    window.addEventListener("keydown", key);
    window.addEventListener("resize", resize);
    cleanup = [
      () => window.removeEventListener("keydown", key),
      () => window.removeEventListener("resize", resize),
      () => canvas.removeEventListener("pointerdown", down),
      () => canvas.removeEventListener("pointermove", move),
    ];

    const size = () => Math.max(56, Math.min(110, w * 0.17));
    const palY = () => hh * 0.82;
    const finish = () => ctx.finish({ coins: 0, xp: 0, extra: { buddyPlay: { id, caught } } });

    const loop = ctx.createLoop({
      partial: () => ({ coins: 0, xp: 0, extra: { buddyPlay: { id, caught } } }),
      update(dt) {
        time += dt;
        fill.style.width = `${Math.max(0, 1 - time / duration) * 100}%`;
        if (time >= duration) return finish();
        // the buddy runs to the finger
        pal.x += (pal.to - pal.x) * Math.min(1, dt * 9);
        pal.hop = Math.max(0, pal.hop - dt * 3);
        spawnIn -= dt;
        if (spawnIn <= 0 && time < duration - 1.2) {
          made++;
          const big = made % BIG_EVERY === 0;
          stars.push({ x: 0.08 + ctx.rng.random() * 0.84, y: -0.05, v: 0.22 + ctx.rng.random() * 0.1 + time * 0.004, big, spin: ctx.rng.random() * 6 });
          spawnIn = 0.75 - Math.min(0.25, time * 0.008);
        }
        const reach = (size() * 0.6) / w;
        for (let i = stars.length - 1; i >= 0; i--) {
          const st = stars[i];
          st.y += st.v * dt;
          st.spin += dt * 2;
          const sy = st.y * hh;
          if (Math.abs(sy - (palY() - size() * 0.3)) < size() * 0.45 && Math.abs(st.x - pal.x) < reach) {
            stars.splice(i, 1);
            caught += st.big ? 3 : 1;
            pal.hop = 1;
            sparks.push({ x: st.x, y: st.y, t: 0, big: st.big });
            ctx.audio.tone(st.big ? 1047 : 784 + Math.min(12, caught) * 20, 0.09, { type: "triangle", volume: 0.12 });
            pile.append(h("span", {}, st.big ? "🌟" : "⭐"));
          } else if (st.y > 1.05) stars.splice(i, 1);
        }
        for (let i = sparks.length - 1; i >= 0; i--) if ((sparks[i].t += dt) > 0.6) sparks.splice(i, 1);
      },
      draw() {
        const sky = g.createLinearGradient(0, 0, 0, hh);
        sky.addColorStop(0, "#2b2d6e");
        sky.addColorStop(1, "#7a6fd0");
        g.fillStyle = sky;
        g.fillRect(0, 0, w, hh);
        g.fillStyle = "#6cc04b";
        g.fillRect(0, palY() + size() * 0.35, w, hh);
        for (const st of stars) drawEmoji(g, st.big ? "🌟" : "⭐", st.x * w, st.y * hh, st.big ? 54 : 40);
        for (const sp of sparks) drawEmoji(g, "✨", sp.x * w, sp.y * hh - sp.t * 60, 34 + sp.t * 40, 1 - sp.t / 0.6);
        drawEmoji(g, icon, pal.x * w, palY() - Math.sin(pal.hop * Math.PI) * 26, size());
      },
    });
    loop.start();
    ctx.speak("Chytaj hviezdy! Ťukni, kam má kamarát bežať.");
    if (window.__game) window.__game.buddyPlay = { get caught() { return caught; }, get stars() { return stars; }, pal };
  },

  stop() {
    cleanup.forEach((f) => f());
    cleanup = [];
    if (window.__game) window.__game.buddyPlay = null;
  },
};
