/* ---------- OMAĽOVÁNKA ---------- */
const PICS = [
  {
    n: "Auto pri dome",
    e: "🚗",
    r: [
      "M0 0 H300 V160 H0 Z",
      "M233 40 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0",
      "M40 58 q0 -16 16 -16 q6 -14 24 -10 q16 -6 24 10 q16 2 14 16 Z",
      "M0 150 H300 V220 H0 Z",
      "M84 126 H96 V152 H84 Z",
      "M60 104 a30 30 0 1 0 60 0 a30 30 0 1 0 -60 0",
      "M170 97 H260 V152 H170 Z",
      "M160 99 L215 57 L270 99 Z",
      "M200 117 H222 V152 H200 Z",
      "M235 110 H254 V128 H235 Z",
      "M0 172 H300 V208 H0 Z",
      "M30 198 L32 186 Q34 178 44 177 L60 176 L72 164 Q75 161 80 161 L114 161 Q120 161 123 165 L134 176 L148 178 Q156 180 156 188 L156 198 Z",
      "M77 165 L70 175 L94 175 L94 165 Z",
      "M98 165 L98 175 L128 176 L119 165 Z",
      "M46 199 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0",
      "M118 199 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0",
    ],
  },
  {
    n: "Raketa vo vesmíre",
    e: "🚀",
    r: [
      "M0 0 H300 V220 H0 Z",
      "M210 62 a30 30 0 1 0 60 0 a30 30 0 1 0 -60 0",
      "M196 70 Q240 44 286 56 L285 62 Q240 52 198 76 Z",
      "M36 40 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0",
      starPath(70, 150, 14, 6),
      starPath(150, 32, 11, 5),
      starPath(268, 172, 13, 5),
      starPath(30, 100, 8, 3.5),
      "M136 192 Q150 222 164 192 Z",
      "M130 150 L108 198 L130 192 Z",
      "M170 150 L192 198 L170 192 Z",
      "M130 192 L130 100 Q150 52 170 100 L170 192 Z",
      "M131 100 Q150 52 169 100 Z",
      "M138 124 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0",
    ],
  },
  {
    n: "Traktor na farme",
    e: "🚜",
    r: [
      "M0 0 H300 V150 H0 Z",
      "M20 40 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0",
      "M240 30 q0 -12 12 -12 q6 -10 18 -6 q12 -2 14 10 q10 2 8 10 Z",
      "M0 140 Q80 92 160 134 Q230 98 300 128 V220 H0 Z",
      "M0 172 H300 V220 H0 Z",
      "M190 92 H280 V172 H190 Z",
      "M182 94 L235 56 L288 94 Z",
      "M220 128 H250 V172 H220 Z",
      "M118 142 H124 V164 H118 Z",
      "M40 184 L40 142 L82 142 L86 162 L142 164 L142 184 Z",
      "M46 148 L46 160 L78 160 L76 148 Z",
      "M40 186 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0",
      "M118 194 a13 13 0 1 0 26 0 a13 13 0 1 0 -26 0",
    ],
  },
];
const picSVG = (p, f) =>
  `<svg viewBox="0 0 300 220" aria-hidden="true">${PICS[p].r.map((d, i) => `<path d="${d}" fill="${f[i] || "#ffffff"}" stroke="#15314d" stroke-width="2.5" stroke-linejoin="round"/>`).join("")}</svg>`;
GAMEFN.color = (v) =>
  chooser(
    v,
    "Omaľovánka",
    PICS.map((p, i) => ({ e: p.e, n: p.n, s: p.r.length + " častí", c: 20, k: i })),
    "Vyber si obrázok na vymaľovanie.",
    (o) => {
      const P = PICS[o.k],
        fills = P.r.map(() => "#ffffff"),
        PAL = [
          "#ff4d4d",
          "#ff8c1a",
          "#ffd23f",
          "#2ec27e",
          "#1f8a41",
          "#7fd0ff",
          "#3a86ff",
          "#9b5de5",
          "#ff6fb5",
          "#8b5a2b",
          "#f4f6fa",
          "#9aa3b2",
          "#2a2d36",
        ];
      let cur = PAL[0];
      v.className = "gameview scroll";
      v.innerHTML =
        gHead("Omaľovánka") +
        `<div class="cbook"><div class="csvg" id="cs">${P.r.map((d, i) => "").join("")}${picSVG(o.k, fills)}</div><div class="pal">${PAL.map((c, i) => `<button class="pc ${i ? "" : "on"}" data-c="${c}" style="--pc:${c}" aria-label="Farba"></button>`).join("")}</div><div class="mrow"><button class="btn grass" id="cdone">✔ Hotovo, ulož do albumu</button></div></div>`;
      say("Vyber si farbu a ťukni na obrázok.");
      v.querySelectorAll(".pc").forEach(
        (b) =>
          (b.onclick = () => {
            cur = b.dataset.c;
            v.querySelectorAll(".pc").forEach((q) => q.classList.toggle("on", q === b));
            tone(500 + PAL.indexOf(cur) * 40, 0.06, "triangle", 0.06);
          }),
      );
      v.querySelectorAll("#cs path").forEach(
        (p, i) =>
          (p.onclick = () => {
            fills[i] = cur;
            p.setAttribute("fill", cur);
            p.classList.remove("pfill");
            void p.getBoundingClientRect();
            p.classList.add("pfill");
            tone(400 + R(0, 6) * 60, 0.08, "sine", 0.07);
          }),
      );
      $("#cdone").onclick = () => {
        const n = fills.filter((f) => f !== "#ffffff").length,
          ratio = n / fills.length;
        if (ratio < 0.3) {
          toast("Vymaľuj ešte trochu viac!");
          say("Vymaľuj ešte trochu viac.");
          return;
        }
        S.gallery = [{ p: o.k, f: fills.slice() }, ...(S.gallery || [])].slice(0, 12);
        save();
        const s = ratio >= 1 ? 3 : ratio >= 0.7 ? 2 : 1;
        finish(
          "color",
          o.c * (0.5 + ratio / 2),
          s,
          10,
          `<div class="gthumb">${picSVG(o.k, fills)}</div><p>Obrázok je v Albume.</p>`,
        );
      };
      G = { stop() {} };
    },
  );
