// Top bar (home, level, coins, 🔊 repeat, ⚙️) and bottom navigation.
// ⚙️ tap = Settings, ⚙️ held for 3 s = parent gate → hidden test menu.

import { h, confetti, toast } from "../core/ui.js";
import { on } from "../core/events.js";
import { getState } from "../core/state.js";
import { sfx, speak, repeat } from "../core/audio.js";
import { go, goHome } from "../core/router.js";
import { levelProgress } from "../systems/progress.js";
import { PILLARS } from "../data/menu.js";
import { openParentGate } from "./test-menu.js";

const HOLD_MS = 3000;

function gearButton() {
  let timer = null;
  let held = false;
  const btn = h("button", { class: "icon-btn gear", "data-testid": "gear", "aria-label": "Nastavenia" }, "⚙️");
  const cancel = () => {
    clearTimeout(timer);
    timer = null;
    btn.classList.remove("holding");
  };
  btn.addEventListener("pointerdown", () => {
    held = false;
    btn.classList.add("holding");
    timer = setTimeout(() => {
      held = true;
      cancel();
      openParentGate();
    }, HOLD_MS);
  });
  btn.addEventListener("pointerup", () => {
    const wasShort = timer && !held;
    cancel();
    if (wasShort) {
      sfx.tap();
      go("settings");
    }
  });
  btn.addEventListener("pointerleave", cancel);
  btn.addEventListener("pointercancel", cancel);
  btn.addEventListener("contextmenu", (e) => e.preventDefault());
  // Keyboard users: Enter/Space opens settings.
  btn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      go("settings");
    }
  });
  return btn;
}

export function mountTopbar(header, nav) {
  const levelNum = h("span", { class: "level-num", "data-testid": "level" });
  const levelRing = h("span", { class: "level-badge", "aria-label": "Level" }, h("span", { "aria-hidden": "true", class: "level-star" }, "⭐"), levelNum);
  const coinNum = h("span", { class: "coin-num" });
  const coins = h("div", { class: "coins", "data-testid": "coins", "aria-label": "Mince" }, h("span", { "aria-hidden": "true" }, "🪙"), coinNum);

  header.append(
    h("button", { class: "icon-btn home-btn", "data-testid": "topbar-home", "aria-label": "Domov", onclick: () => { sfx.back(); goHome(); } }, "🏠"),
    levelRing,
    coins,
    h("div", { class: "spacer" }),
    h("button", { class: "icon-btn", "data-testid": "repeat-voice", "aria-label": "Zopakovať", onclick: repeat }, "🔊"),
    gearButton(),
  );

  for (const p of PILLARS) {
    nav.append(
      h(
        "button",
        {
          class: `nav-btn ${p.color}`,
          "data-testid": `nav-${p.id}`,
          "data-route": p.id,
          "aria-label": p.label,
          onclick: () => {
            sfx.tap();
            speak(p.say);
            go(p.id);
          },
        },
        h("span", { "aria-hidden": "true" }, p.icon),
      ),
    );
  }

  const paint = () => {
    const s = getState();
    levelNum.textContent = String(s.level);
    levelRing.style.setProperty("--progress", `${Math.round(levelProgress(s) * 100)}%`);
    coinNum.textContent = s.coins.toLocaleString("sk-SK");
  };
  paint();
  on("stateChanged", paint);
  on("coinsChanged", ({ delta }) => {
    if (delta > 0) {
      coins.classList.remove("pop");
      void coins.offsetWidth;
      coins.classList.add("pop");
    }
  });
  on("levelUp", ({ level }) => {
    sfx.levelUp();
    confetti(80);
    toast(`Nový level ${level}!`, { icon: "⭐" });
    speak("Hurá! Máš nový level!", { interrupt: false });
  });
  on("screenShown", ({ id }) => {
    for (const b of nav.children) b.classList.toggle("active", b.dataset.route === id);
  });
}
