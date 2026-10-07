// Shared UI pieces: element helper, modal, toast, flying coins, confetti,
// reward and crash dialogs. Every player-facing text is also spoken.

import { sfx, speak } from "./audio.js";

/** h("button", { class: "btn", onclick }, "text", child) */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k === "class") el.className = v;
    else if (k === "style" && typeof v === "object") {
      // custom properties (--x) need setProperty; Object.assign ignores them
      for (const [prop, val] of Object.entries(v)) {
        if (prop.startsWith("--")) el.style.setProperty(prop, val);
        else el.style[prop] = val;
      }
    }
    else if (k === "dataset") Object.assign(el.dataset, v);
    else if (v === true) el.setAttribute(k, "");
    else el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

/** Big icon button with a small caption and a spoken name. */
export function bigButton({ icon, label, say, color = "sun", onClick, locked = false, testId }) {
  return h(
    "button",
    {
      class: `btn big ${color}${locked ? " locked" : ""}`,
      "aria-label": label,
      "data-testid": testId,
      onclick: () => {
        if (locked) {
          sfx.oops();
          speak("Toto sa ešte stavia. Príď neskôr!");
          return;
        }
        sfx.tap();
        if (say) speak(say);
        onClick?.();
      },
    },
    h("span", { class: "btn-icon", "aria-hidden": "true" }, locked ? "🔒" : icon),
    h("span", { class: "btn-label" }, label),
  );
}

let modalEl = null;
let modalOnClose = null;

export function closeModal() {
  if (!modalEl) return;
  const cb = modalOnClose;
  modalEl.remove();
  modalEl = null;
  modalOnClose = null;
  cb?.();
}

/**
 * Show a modal. `content` is a Node (or array of nodes).
 * dismissible: tap on the backdrop closes it.
 */
export function modal(content, { dismissible = true, onClose, className = "", testId = "modal" } = {}) {
  closeModal();
  const box = h("div", { class: `modal ${className}`, role: "dialog", "aria-modal": "true" }, content);
  modalEl = h(
    "div",
    {
      class: "modal-backdrop",
      "data-testid": testId,
      onclick: (e) => {
        if (dismissible && e.target === modalEl) closeModal();
      },
    },
    box,
  );
  modalOnClose = onClose || null;
  document.body.append(modalEl);
  // Focus text fields only; focusing a button would show a focus ring to a child who tapped.
  box.querySelector("input, textarea:not([readonly])")?.focus({ preventScroll: true });
  return box;
}

export function isModalOpen() {
  return !!modalEl;
}

/** Yes/no question with icons. Resolves true/false. */
export function confirm({ icon = "❓", title, text, say, yes = "Áno", no = "Nie", danger = false }) {
  return new Promise((resolve) => {
    let answered = false;
    const answer = (v) => {
      answered = true;
      closeModal();
      resolve(v);
    };
    modal(
      [
        h("div", { class: "modal-icon", "aria-hidden": "true" }, icon),
        title && h("h2", {}, title),
        text && h("p", {}, text),
        h(
          "div",
          { class: "modal-row" },
          h("button", { class: "btn ghost", "data-testid": "confirm-no", onclick: () => answer(false) }, "✖ ", no),
          h(
            "button",
            { class: `btn ${danger ? "tomato" : "grass"}`, "data-testid": "confirm-yes", onclick: () => answer(true) },
            "✔ ",
            yes,
          ),
        ),
      ],
      { onClose: () => !answered && resolve(false) },
    );
    if (say) speak(say);
  });
}

let toastTimer = null;
export function toast(text, { icon = "", say = false, ms = 2600 } = {}) {
  document.querySelector(".toast")?.remove();
  clearTimeout(toastTimer);
  const el = h("div", { class: "toast", role: "status" }, icon && h("span", { "aria-hidden": "true" }, icon), text);
  document.body.append(el);
  if (say) speak(text);
  toastTimer = setTimeout(() => el.remove(), ms);
}

/** Coins fly from `from` (element or {x,y}) to the coin counter in the top bar. */
export function flyCoins(from, count = 6) {
  const target = document.querySelector("[data-testid=coins]");
  if (!target || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const r = from instanceof Element ? from.getBoundingClientRect() : null;
  const sx = r ? r.left + r.width / 2 : from?.x ?? innerWidth / 2;
  const sy = r ? r.top + r.height / 2 : from?.y ?? innerHeight / 2;
  const t = target.getBoundingClientRect();
  const n = Math.max(1, Math.min(12, count));
  for (let i = 0; i < n; i++) {
    const coin = h("div", { class: "fly-coin", "aria-hidden": "true" }, "🪙");
    coin.style.left = `${sx}px`;
    coin.style.top = `${sy}px`;
    document.body.append(coin);
    const dx = t.left + t.width / 2 - sx;
    const dy = t.top + t.height / 2 - sy;
    const spread = (Math.random() - 0.5) * 120;
    coin
      .animate(
        [
          { transform: "translate(-50%,-50%) scale(.6)", opacity: 0 },
          { transform: `translate(calc(-50% + ${spread}px), calc(-50% - 60px)) scale(1.2)`, opacity: 1, offset: 0.3 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.7)`, opacity: 0.9 },
        ],
        { duration: 750 + i * 60, easing: "cubic-bezier(.5,0,.6,1)" },
      )
      .finished.then(() => {
        coin.remove();
        if (i % 2 === 0) sfx.coin();
      })
      .catch(() => coin.remove());
  }
}

export function confetti(pieces = 60) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["#ff5a5f", "#ffc93c", "#3ec300", "#2ab7ca", "#8f5bd8", "#ff8c42"];
  const layer = h("div", { class: "confetti", "aria-hidden": "true" });
  document.body.append(layer);
  for (let i = 0; i < pieces; i++) {
    const p = h("i");
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = colors[i % colors.length];
    layer.append(p);
    p.animate(
      [
        { transform: `translateY(-5vh) rotate(0deg)` },
        { transform: `translate(${(Math.random() - 0.5) * 30}vw, 105vh) rotate(${Math.random() * 720}deg)` },
      ],
      { duration: 1400 + Math.random() * 1200, delay: Math.random() * 300, easing: "ease-in" },
    );
  }
  setTimeout(() => layer.remove(), 3000);
}

/** End-of-game reward dialog: coins fly to the counter, then Home / Again. */
export function rewardModal(result, { onHome, onAgain } = {}) {
  const box = modal(
    [
      h("div", { class: "modal-icon bounce", "aria-hidden": "true" }, "🏆"),
      result.stars > 0 && h("div", { class: "reward-stars", "data-testid": "reward-stars", "data-stars": String(result.stars), "aria-label": "Hviezdy" }, [1, 2, 3].map((i) => h("i", { class: i <= result.stars ? "on" : "" }, "★"))),
      result.miniLevelUp && h("div", { class: "reward-row level-up", "data-testid": "reward-harder", "aria-label": "Ťažšie" }, "⬆️ ★"),
      h("div", { class: "reward-row", "data-testid": "reward-coins" }, "🪙 +", String(result.coins || 0)),
      h(
        "div",
        { class: "modal-row" },
        h("button", { class: "btn sun", "data-testid": "reward-home", "aria-label": "Domov", onclick: () => onHome?.() }, "🏠"),
        onAgain &&
          h("button", { class: "btn grass", "data-testid": "reward-again", "aria-label": "Znova", onclick: () => onAgain() }, "🔁"),
      ),
    ],
    { dismissible: false, testId: "reward-modal" },
  );
  sfx.win();
  confetti();
  speak(result.miniLevelUp ? "Výborne! Nabudúce to bude o niečo ťažšie." : result.stars === 3 ? "Tri hviezdy! Si šikovný!" : "Výborne! Tu sú tvoje mince.");
  if (result.coins > 0) setTimeout(() => flyCoins(box.querySelector(".reward-row"), result.coins / 5), 300);
}

/** The game loop gave up (DESIGN-v2 §3): friendly message, coins already credited. */
export function crashModal(result, { onHome } = {}) {
  modal(
    [
      h("div", { class: "modal-icon", "aria-hidden": "true" }, "🚗💨"),
      h("h2", {}, "Ups, auto sa zaseklo"),
      result.coins > 0 && h("div", { class: "reward-row" }, "🪙 +", String(result.coins)),
      h(
        "div",
        { class: "modal-row" },
        h("button", { class: "btn sun", "data-testid": "crash-home", onclick: () => onHome?.() }, "🏠 Domov"),
      ),
    ],
    { dismissible: false, testId: "crash-modal" },
  );
  sfx.oops();
  speak("Ups, auto sa zaseklo. Mince si si nechal. Poďme domov.");
}
