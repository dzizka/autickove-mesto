// Race HUD (DOM over the canvas): progress bar with all cars, place medal,
// fuel gauge, shields, coins, countdown lights and the podium. No numbers to read
// except the coin count.

import { h } from "../../core/ui.js";
import { MEDALS } from "../../data/tracks.js";
import { carSidePic } from "../../render/car-side.js";
import { currentPlace } from "./physics.js";

const PLAYER_COLOR = "#ff5a5f";

export function createHud(root, race, { onExit, buddy = null }) {
  const markers = [
    ...race.rivals.map((r) => (r.isBoss ? h("span", { class: "rh-dot boss", style: { background: r.color } }, r.icon) : h("span", { class: "rh-dot", style: { background: r.color } }))),
    h("span", { class: "rh-dot me", style: { background: PLAYER_COLOR } }, "🚗"),
  ];
  const track = h("div", { class: "rh-track" }, h("span", { class: "rh-flag", "aria-hidden": "true" }, "🏁"), markers);
  const medal = h("div", { class: "rh-medal", "data-testid": "race-place", "aria-label": "Miesto" });
  const fuelFill = h("div", { class: "rh-fuel-fill" });
  const fuel = h("div", { class: "rh-fuel", "aria-label": "Benzín" }, h("div", { class: "rh-fuel-bar" }, fuelFill), h("span", { "aria-hidden": "true" }, "⛽"));
  const shields = h("div", { class: "rh-shields", "aria-label": "Štíty" });
  const coinNum = h("span", {}, "0");
  const coins = h("div", { class: "rh-coins", "data-testid": "race-coins" }, "🪙 ", coinNum);
  const lights = h("div", { class: "rh-lights", "aria-hidden": "true" }, h("i"), h("i"), h("i"));
  const arrows = h("div", { class: "rh-arrows", "aria-hidden": "true" }, h("span", {}, "⬅️"), h("span", {}, "➡️"));
  const exit = h("button", { class: "icon-btn rh-exit", "data-testid": "game-exit", "aria-label": "Domov", onclick: onExit }, "🏠");

  const el = h(
    "div",
    { class: "race-hud" },
    h("div", { class: "rh-top" }, exit, track, medal),
    h("div", { class: "rh-side" }, fuel, shields, coins, buddy), // buddy: the co-driver badge
    lights,
    arrows,
  );
  root.append(el);

  const last = {};
  const set = (key, value, fn) => {
    if (last[key] === value) return;
    last[key] = value;
    fn(value);
  };

  return {
    update() {
      const p = race.player;
      const len = race.length;
      const pos = (d) => `${Math.max(0, Math.min(100, (d / len) * 100)).toFixed(1)}%`;
      race.rivals.forEach((r, i) => set(`r${i}`, pos(r.d), (v) => (markers[i].style.bottom = v)));
      set("me", pos(p.d), (v) => (markers[markers.length - 1].style.bottom = v));
      const place = currentPlace(race);
      set("place", place, (v) => {
        medal.textContent = v <= 3 ? MEDALS[v - 1] : "";
        medal.classList.toggle("empty", v > 3);
      });
      set("fuel", Math.round(p.fuel * 40), () => {
        fuelFill.style.height = `${p.fuel * 100}%`;
        fuel.classList.toggle("low", p.fuel < 0.25);
      });
      set("shields", p.shields, (v) => (shields.textContent = "🛡️".repeat(Math.min(6, v))));
      set("coins", p.coins, (v) => (coinNum.textContent = String(v)));
      const phase = race.phase === "countdown" ? Math.ceil(race.countdown) : 0;
      set("lights", phase, (v) => {
        lights.classList.toggle("on", v > 0);
        lights.dataset.n = String(v);
      });
      set("arrows", race.time > 6 || race.phase !== "racing" ? 0 : 1, (v) => arrows.classList.toggle("show", !!v));
    },
    remove() {
      el.remove();
    },
  };
}

/**
 * Podium with the four cars; the player's car wears a crown when first.
 * Resolves after the celebration so the host can show the reward.
 */
export function showPodium(root, order, { place, unlocks, look, buddy }) {
  const steps = [1, 0, 2].map((i) => {
    const row = order[i];
    if (!row) return h("div");
    const car = row.isPlayer ? carSidePic(look || {}) : carSidePic({ colorHex: row.color });
    return h(
      "div",
      { class: `pd-step pd-${i + 1}${row.isPlayer ? " me" : ""}` },
      row.isPlayer && h("div", { class: "pd-crown", "aria-hidden": "true" }, i === 0 ? "👑" : "⭐"),
      row.isBoss && h("div", { class: "pd-crown boss", "aria-hidden": "true" }, row.icon),
      h("div", { class: "pd-car" }, car),
      h("div", { class: "pd-block" }, MEDALS[i]),
    );
  });
  const fourth = order[3];
  const extras = [];
  if (unlocks?.level) extras.push(h("div", { class: "pd-unlock" }, "🔓 ", "⭐".repeat(unlocks.level)));
  if (unlocks?.track) extras.push(h("div", { class: "pd-unlock" }, "🔓 🛣️"));
  const el = h(
    "div",
    { class: "podium", "data-testid": "podium", "data-place": String(place) },
    h("div", { class: "pd-stage" }, steps),
    fourth && h("div", { class: `pd-fourth${fourth.isPlayer ? " me" : ""}` }, h("div", { class: "pd-car small" }, fourth.isPlayer ? carSidePic(look || {}) : carSidePic({ colorHex: fourth.color })), "🏁"),
    extras,
  );
  root.append(el);
  return new Promise((resolve) => setTimeout(resolve, 2600));
}
