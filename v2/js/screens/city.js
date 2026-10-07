// 🏙️ Mesto (DESIGN-v2 §13, §14): the town the child builds and upgrades for coins. With WebGL it is
// seen from above and the child drives its own car through the streets to pick up the rent
// (part 16); without WebGL it is a street with a coin bubble to tap. Buildings open games.
// Sky follows the real time of day.

import { h, modal, closeModal, flyCoins, confetti, toast } from "../core/ui.js";
import { speak, sfx, playNotes } from "../core/audio.js";
import { getState } from "../core/state.js";
import { go, startGame, getGames, isUnlocked } from "../core/router.js";
import { BUILDINGS, CITY } from "../data/city.js";
import { buildingLevel, nextPrice, isBuildingOpen, buildOrUpgrade, rentWaiting, collectRent } from "../systems/city.js";
import { getLook, resolveLook, colorLook } from "../systems/tuning.js";
import { carSidePic } from "../render/car-side.js";
import { hasWebGL } from "../render/car-pics.js";
import { setLook } from "../systems/stats.js";
import { activeBuddy, buddyLook } from "../systems/crew.js";

const COLORS = ["#ff5a5f", "#2f80ed", "#ffd23f", "#3ebd4a", "#8f5bd8", "#ff8c42"];

export function dayPhase(date = new Date()) {
  const hr = date.getHours();
  return hr >= 21 || hr < 6 ? "night" : hr < 9 ? "morning" : hr < 18 ? "day" : "evening";
}

const stars = (lvl) => h("span", { class: "bld-stars", "aria-hidden": "true" }, Array.from({ length: CITY.maxLevel }, (_, i) => h("i", { class: i < lvl ? "on" : "" }, "★")));

function openTarget(def) {
  if (def.go.screen) return go(def.go.screen);
  const game = getGames().find((g) => g.id === def.go.game);
  if (game && isUnlocked(game)) return startGame(game.id);
  sfx.oops();
  speak("Táto hra sa otvorí na vyššom leveli.");
}

let timer = null;
let town = null;

/** What a lot shows in the 3D town: locked, a building site, or the building with its coins. */
function lotInfo(def, now = Date.now()) {
  const s = getState();
  if (!isBuildingOpen(def.id, s)) return { state: "locked", level: 0, coins: 0 };
  const level = buildingLevel(def.id, s);
  if (!level) return { state: "empty", level: 0, coins: 0 };
  const rent = rentWaiting(def.id, now);
  const hour = def.rent * level;
  const coins = rent < CITY.minCollect ? 0 : rent < hour * 2 ? 1 : rent < hour * 6 ? 2 : 3;
  return { state: "built", level, coins };
}

/** The arrows for driving in the town (also a swipe or the keys). */
function drivePad() {
  const pad = h("div", { class: "town-pad", "data-testid": "town-pad" });
  for (const [dir, icon, label] of [["u", "⬆️", "Hore"], ["l", "⬅️", "Doľava"], ["r", "➡️", "Doprava"], ["d", "⬇️", "Dole"]]) {
    const b = h("button", { class: `pad-${dir}`, "data-testid": `drive-${dir}`, "aria-label": label }, icon);
    b.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      town?.hold(true);
      town?.press(dir);
    });
    for (const ev of ["pointerup", "pointerleave", "pointercancel"]) b.addEventListener(ev, () => town?.hold(false));
    pad.append(b);
  }
  return pad;
}

export default {
  id: "city",
  title: "Mesto",
  render(view) {
    const street = h("div", { class: "city-lots", "data-testid": "city-lots" });
    const root = h("section", { class: `screen city phase-${dayPhase()}`, "data-testid": "screen-city" });

    function buildingEl(def) {
      const s = getState();
      const lvl = buildingLevel(def.id, s);
      if (!isBuildingOpen(def.id, s)) {
        return h("div", { class: "lot locked", "data-testid": `bld-${def.id}`, "data-state": "locked" }, h("span", { class: "lot-icon", "aria-hidden": "true" }, "🔒"), h("span", { class: "lot-chip" }, "⭐", String(def.unlockLevel)));
      }
      if (!lvl) {
        return h(
          "button",
          { class: "lot empty", "data-testid": `bld-${def.id}`, "data-state": "empty", "aria-label": def.name, onclick: () => details(def) },
          h("span", { class: "lot-icon", "aria-hidden": "true" }, "🏗️"),
          h("span", { class: "lot-ghost", "aria-hidden": "true" }, def.icon),
          h("span", { class: "lot-chip" }, "🪙", String(nextPrice(def.id, s))),
        );
      }
      const rent = rentWaiting(def.id);
      const windows = Array.from({ length: 2 + lvl * 2 }, () => h("i"));
      return h(
        "button",
        { class: `bld level-${lvl}`, "data-testid": `bld-${def.id}`, "data-state": "built", "data-level": String(lvl), "aria-label": def.name, style: { "--c": def.color }, onclick: () => details(def) },
        rent >= CITY.minCollect &&
          h(
            "span",
            {
              class: "rent",
              "data-testid": `rent-${def.id}`,
              role: "button",
              "aria-label": "Vybrať mince",
              onclick: (e) => {
                e.stopPropagation();
                const got = collectRent(def.id);
                if (!got) return;
                sfx.coin();
                flyCoins(e.currentTarget, Math.min(12, got / 5));
                paint();
              },
            },
            "🪙",
          ),
        h("span", { class: "bld-roof", "aria-hidden": "true" }),
        h("span", { class: "bld-face" }, h("span", { class: "bld-sign", "aria-hidden": "true" }, def.icon), h("span", { class: "bld-windows", "aria-hidden": "true" }, windows), h("span", { class: "bld-door", "aria-hidden": "true" })),
        stars(lvl),
      );
    }

    function details(def) {
      sfx.tap();
      speak(def.say);
      const lvl = buildingLevel(def.id);
      const price = nextPrice(def.id);
      const rent = rentWaiting(def.id);
      modal(
        [
          h("div", { class: "modal-icon", "aria-hidden": "true" }, def.icon),
          h("h2", {}, def.name),
          lvl > 0 && stars(lvl),
          lvl > 0 && h("p", { class: "bld-rent" }, "🪙 ", String(def.rent * lvl), " / 🕐"),
          h(
            "div",
            { class: "modal-row" },
            lvl > 0 && h("button", { class: "btn grass", "data-testid": "bld-open", "aria-label": "Otvoriť", onclick: () => (closeModal(), openTarget(def)) }, "▶"),
            rent >= CITY.minCollect &&
              h("button", { class: "btn sun", "data-testid": "bld-collect", "aria-label": "Vybrať mince", onclick: (e) => {
                const got = collectRent(def.id);
                sfx.coin();
                flyCoins(e.currentTarget, Math.min(12, got / 5));
                closeModal();
                paint();
              } }, "🪙 +", String(rent)),
            price !== null &&
              h(
                "button",
                {
                  class: `btn ${lvl ? "plum" : "sky"}`,
                  "data-testid": "bld-build",
                  disabled: getState().coins < price,
                  "aria-label": lvl ? "Vylepšiť" : "Postaviť",
                  onclick: () => {
                    if (!buildOrUpgrade(def.id)) return;
                    closeModal();
                    playNotes([[523, 0.12, "triangle"], [659, 0.12, "triangle"], [784, 0.2, "triangle"]]);
                    confetti(lvl ? 40 : 70);
                    speak(lvl ? `${def.name} je väčšia a krajšia!` : `Postavené! ${def.name}.`);
                    toast(def.name, { icon: def.icon });
                    paint();
                  },
                },
                lvl ? "⬆ " : "🏗️ ",
                h("small", { class: "cost" }, "🪙", String(price)),
              ),
          ),
          h("div", { class: "modal-row" }, h("button", { class: "btn ghost", "data-testid": "bld-close", onclick: closeModal }, "✖")),
        ],
        { testId: "bld-detail", className: "bld-modal" },
      );
      if (price !== null && getState().coins < price) speak(`${def.say} Na ${lvl ? "vylepšenie" : "stavbu"} treba viac mincí.`, { interrupt: false });
    }

    const use3d = hasWebGL();
    function paint() {
      if (town) BUILDINGS.forEach((def) => town.setLot(def, lotInfo(def)));
      else street.replaceChildren(...BUILDINGS.map(buildingEl));
    }

    const albumBar = h(
      "div",
      { class: "city-bar" },
      h("button", { class: "btn big plum city-album", "data-testid": "open-album", "aria-label": "Album", onclick: () => (sfx.tap(), speak("Album s nálepkami."), go("album")) }, h("span", { class: "btn-icon", "aria-hidden": "true" }, "📒"), h("span", { class: "btn-label" }, "Album")),
    );

    if (use3d) {
      // part 16: the town from above, the child drives its own car through the streets
      const host = h("div", { class: "town-wrap", "data-testid": "town" });
      root.classList.add("town3d");
      root.append(albumBar, host);
      view.append(root);
      import("../render/three/town.js")
        .then(({ createTown }) => {
          if (!root.isConnected) return;
          town = createTown(host, {
            look: resolveLook({ ...getLook(), ...setLook() }),
            passenger: buddyLook(activeBuddy())?.icon || null,
            phase: dayPhase(),
            onLot: (id) => details(BUILDINGS.find((b) => b.id === id)),
            onCoins: (id, at) => {
              const got = collectRent(id);
              if (!got) return;
              sfx.coin();
              flyCoins(at, Math.min(12, got / 5));
              paint();
            },
          });
          host.append(drivePad());
          paint();
          if (window.__game) window.__game.town = town; // test hook
        })
        .catch((err) => {
          console.warn("[city] 3D town failed", err);
        });
    } else {
      // without WebGL: the street with the child's cars driving by
      const s = getState();
      const kinds = [...new Set([getLook().car, ...(s.owned?.car || [])])].slice(0, 4);
      const cars = kinds.map((kind, i) => {
        const look = i === 0 ? getLook() : { ...colorLook(COLORS[i % COLORS.length]), car: resolveLook({ car: kind }).car.id };
        return h(
          "button",
          { class: `city-car${i % 2 ? " back" : ""}`, "aria-label": "Auto", style: { animationDuration: `${14 + i * 5}s`, animationDelay: `${-i * 4}s` }, onclick: () => playNotes(resolveLook(look).horn.notes) },
          carSidePic(look),
        );
      });
      root.append(
        albumBar,
        h(
          "div",
          { class: "city-street" },
          h("div", { class: "city-inner" }, h("div", { class: "city-sky", "aria-hidden": "true" }, h("span", { class: "sun" }), h("span", { class: "cloud c1" }), h("span", { class: "cloud c2" })), street, h("div", { class: "city-road" }, cars)),
        ),
      );
      paint();
      view.append(root);
    }
    // rent bubbles appear while the child looks at the town
    timer = setInterval(paint, 30000);
    const built = BUILDINGS.filter((b) => buildingLevel(b.id) > 0).length;
    if (use3d) speak(built ? "Tvoje mesto! Jazdi šípkami a zbieraj mince pred domami." : "Tu postavíš svoje mesto. Ťukni na stavenisko.", { interrupt: false });
    else speak(built ? "Tvoje mesto! Ťukni na mince nad domami." : "Tu postavíš svoje mesto. Ťukni na stavenisko.", { interrupt: false });
  },
  leave() {
    clearInterval(timer);
    timer = null;
    town?.destroy();
    town = null;
    if (window.__game) window.__game.town = null;
  },
};
