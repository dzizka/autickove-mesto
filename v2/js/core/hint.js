// The demo hand 👆 (DESIGN-v2 §15.2, part 20): it shows the next step without words, for
// children who cannot hear the voice and cannot read. It flies to the target and taps it, or
// drags a thing to its place. It comes when a screen opens for the first time in a visit and
// whenever the child waits; it never takes a tap (pointer-events: none).

import { on } from "./events.js";
import { HINTS, HINT_TIMING as T } from "../data/hints.js";

let screenId = null;
let timer = null;
let idleWait = T.idleMs;
let hand = null;
const seen = new Set();
const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Visible on the screen and not covered by a closed part of the page. */
function visible(el) {
  if (!el || el.disabled) return false;
  const r = el.getBoundingClientRect();
  if (r.width < 4 || r.height < 4) return false;
  if (r.bottom < 0 || r.right < 0 || r.top > innerHeight || r.left > innerWidth) return false;
  return getComputedStyle(el).visibility !== "hidden" && el.closest("[hidden]") === null;
}

/** Fill {x} places from the found element's data, then from the game's stage data. */
function fill(sel, el, stage) {
  return sel.replace(/\{(\w+)\}/g, (m, k) => {
    const v = el?.dataset?.[k] ?? stage?.dataset?.[k];
    return v === undefined ? "__none__" : CSS.escape(v);
  });
}

/** The current target: { el, to, kind, idle } or null. */
export function findTarget(id = screenId) {
  const modals = document.querySelectorAll(".modal-backdrop");
  const modal = modals[modals.length - 1] || null;
  const root = modal || document.getElementById("view") || document.body;
  const marked = [...root.querySelectorAll("[data-hint='1']")].find(visible);
  if (marked) return { el: marked, kind: marked.dataset.hintKind || "tap", idle: true };
  const stage = root.querySelector(".mini-stage");
  for (const rule of HINTS[modal ? "modal" : id] || []) {
    if (rule.when && Object.entries(rule.when).some(([k, v]) => stage?.dataset?.[k] !== v)) continue;
    const el = [...root.querySelectorAll(fill(rule.sel, null, stage))].find(visible);
    if (!el) continue;
    const to = rule.to ? [...root.querySelectorAll(fill(rule.to, el, stage))].find(visible) : null;
    if (rule.to && !to) continue;
    return { el, to, kind: rule.kind || "tap", idle: rule.idle !== false };
  }
  return null;
}

const center = (el) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
};

/** Show the hand on the current target now. Returns the target or null. */
export function showHand(target = findTarget()) {
  hideHand();
  if (!target) return null;
  const a = center(target.el);
  const b = target.to ? center(target.to) : a;
  hand = document.createElement("div");
  hand.className = `hint-hand kind-${target.kind}${reduced() ? " still" : ""}`;
  hand.setAttribute("aria-hidden", "true");
  hand.dataset.testid = "hint-hand";
  hand.innerHTML = '<span class="hh-ring"></span><span class="hh-finger">👆</span>';
  const set = (k, v) => hand.style.setProperty(k, `${Math.round(v)}px`);
  if (target.kind === "lanes") {
    set("--x0", a.x - a.w * 0.25);
    set("--x1", a.x + a.w * 0.25);
    set("--y0", a.y + a.h * 0.2);
    set("--y1", a.y + a.h * 0.2);
  } else {
    set("--x0", a.x);
    set("--y0", a.y);
    set("--x1", b.x);
    set("--y1", b.y);
  }
  set("--rw", Math.min(a.w, 260));
  document.body.append(hand);
  hand.addEventListener("animationend", (e) => e.target === hand && hideHand());
  hint.last = { id: screenId, kind: target.kind, el: target.el, to: target.to || null };
  return target;
}

export function hideHand() {
  hand?.remove();
  hand = null;
}

function schedule(ms) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    const target = findTarget();
    if (target && target.idle) showHand(target);
    idleWait = Math.min(T.idleMaxMs, idleWait + T.idleGrowMs);
    schedule(idleWait);
  }, ms);
}

/** The child did something: the hand goes away and the waiting starts again. */
function activity() {
  hideHand();
  idleWait = T.idleMs;
  if (screenId) schedule(idleWait);
}

/** Start the hand for the whole game (main.js). */
export function startHints() {
  for (const ev of ["pointerdown", "keydown", "wheel"]) window.addEventListener(ev, activity, { capture: true, passive: true });
  on("screenShown", ({ id }) => {
    screenId = id;
    hideHand();
    idleWait = T.idleMs;
    clearTimeout(timer);
    const first = !seen.has(id);
    seen.add(id);
    // a game may first show its pictures (memory cards face up): keep looking a little while
    let tries = 5;
    const firstLook = () => {
      if (screenId !== id) return;
      if (showHand() || --tries <= 0) schedule(idleWait);
      else timer = setTimeout(firstLook, 1000);
    };
    timer = setTimeout(() => (first ? firstLook() : schedule(0)), first ? T.firstMs : idleWait);
  });
}

/** Test hook and the ❔ help's "show me" button. */
export const hint = { show: () => showHand(), find: () => findTarget(), last: null };
