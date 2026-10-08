// Crew screen (DESIGN-v2 §6): eggs and hatching, the buddy in the car with its ability,
// level and evolution, pats and clothes, and the collection of 20 with grey shadows.

import { h, modal, closeModal, confetti, toast } from "../core/ui.js";
import { speak, sfx, playNotes } from "../core/audio.js";
import * as rng from "../core/rng.js";
import { getState } from "../core/state.js";
import { CREW, CREW_RULES, CLOTHES } from "../data/crew.js";
import { STATS } from "../data/stats.js";
import { canAfford } from "../systems/economy.js";
import { crewDef, crewRarity, activeBuddy, buddyLook, abilityValue, xpToNext, isEggReady, hatch, setActive, pet, nextEvolution, canEvolve, evolve, ownsClothes, wear } from "../systems/crew.js";
import { t } from "../core/i18n.js";
import { careButtons, petGrowth } from "./buddy-care.js";

const ABILITY_SAY = { speed: "rýchlosť", handling: "ovládanie", armor: "odolnosť", fuel: "benzín", magnet: "magnet", luck: "šťastie" };

export function abilityIcon(def) {
  if (def.ability.kind === "stat") return STATS[def.ability.stat]?.icon || "⭐";
  return def.ability.kind === "coins" ? "🪙" : "🛡️";
}

function abilitySay(def) {
  if (def.ability.kind === "stat") return t("pridáva {stat}", { stat: t(ABILITY_SAY[def.ability.stat]) });
  return t(def.ability.kind === "coins" ? "prináša viac mincí" : "dáva štít navyše");
}

/** Big buddy face with hat and glasses on top. */
export function buddyFace(entry, cls = "") {
  const l = buddyLook(entry);
  return h(
    "span",
    { class: `buddy-face ${cls}`, "aria-hidden": "true" },
    h("span", { class: "bf-icon" }, l.icon),
    l.glasses && h("span", { class: "bf-glasses" }, l.glasses),
    l.hat && h("span", { class: "bf-hat" }, l.hat),
  );
}

function segs(n, total, cls = "") {
  return h("span", { class: `segs ${cls}` }, Array.from({ length: total }, (_, i) => h("i", { class: i < n ? "on" : "" })));
}

/** Egg cracks, the buddy jumps out. */
function showHatch(res, onDone) {
  const r = crewRarity(res.def.rarity);
  const egg = h("div", { class: "hatch-egg", "aria-hidden": "true" }, "🥚");
  const buddy = h("div", { class: "hatch-buddy", style: { "--rarity": r.color }, "aria-hidden": "true" }, res.def.stages[0]);
  const after = h(
    "div",
    { class: "hatch-after" },
    h("div", { class: "hatch-stars", "aria-hidden": "true" }, "⭐".repeat(r.stars)),
    res.isNew ? h("div", { class: "hatch-new", "data-testid": "hatch-new" }, "NOVÝ!") : h("div", { class: "reward-row", "data-testid": "hatch-candy" }, "🍬 +", String(res.candy)),
    h("div", { class: "modal-row" }, h("button", { class: "btn grass", "data-testid": "hatch-ok", "aria-label": "Super", onclick: () => (closeModal(), onDone()) }, "✔")),
  );
  modal([h("div", { class: "hatch-stage" }, egg, buddy), h("h2", {}, res.def.name), after], { dismissible: false, className: "hatch-modal", testId: "hatch-modal" });
  sfx.open();
  setTimeout(() => {
    egg.classList.add("crack");
    buddy.classList.add("out");
    playNotes([[523, 0.1, "triangle"], [659, 0.1, "triangle"], [784, 0.1, "triangle"], [1047, 0.25, "triangle"]]);
    confetti(res.isNew ? 80 : 30);
    speak(t(res.isNew ? "Vyliahol sa {name}! Nový kamarát!" : "{name} už máš. Dostal si cukríky!", { name: t(res.def.name) }));
  }, 900);
}

function openWardrobe(entry, onChange) {
  const rows = Object.entries(CLOTHES).map(([kind, items]) =>
    h(
      "div",
      { class: "wardrobe-row" },
      items.map((it) => {
        const owned = ownsClothes(kind, it.id);
        const on = entry[kind] === it.id;
        return h(
          "button",
          {
            class: `tile${on ? " on" : ""}${owned ? "" : " locked"}`,
            "data-testid": `wear-${kind}-${it.id}`,
            "aria-label": it.id,
            disabled: !owned && !canAfford(it.price),
            onclick: () => {
              if (!wear(entry.id, kind, it.id)) return;
              sfx.tap();
              if (!owned) speak("Kúpené!");
              onChange();
              openWardrobe(getState().crew.owned[entry.id], onChange);
            },
          },
          h("span", { class: "tile-icon" }, it.icon || "🚫"),
          on && h("span", { class: "tile-check", "aria-hidden": "true" }, "✔"),
          !owned && h("span", { class: "tile-price" }, "🪙", String(it.price)),
        );
      }),
    ),
  );
  modal([h("div", { class: "wardrobe-preview" }, buddyFace(entry, "big")), ...rows, h("div", { class: "modal-row" }, h("button", { class: "btn ghost", onclick: closeModal }, "✖"))], { className: "wide", testId: "wardrobe" });
}

export default {
  id: "crew",
  title: "Kamaráti",
  render(view) {
    const root = h("section", { class: "screen crew", "data-testid": "screen-crew" });
    view.append(root);

    const paint = () => {
      const s = getState();
      const b = activeBuddy(s);
      const def = crewDef(b?.id);

      // eggs
      const eggs = s.eggs.map((e) => {
        const ready = isEggReady(e);
        return h(
          "button",
          {
            class: `egg${ready ? " ready" : ""}${e.from !== "chest" ? " boss" : ""}`,
            "data-testid": `egg-${e.id}`,
            "data-ready": String(ready),
            "aria-label": "Vajíčko",
            onclick: () => {
              if (!ready) {
                sfx.oops();
                speak("Vajíčko sa ešte hreje. Jazdi preteky a vyliahne sa!");
                return;
              }
              const res = hatch(e.id, rng);
              if (res) showHatch(res, paint);
            },
          },
          h("span", { class: "egg-icon", "aria-hidden": "true" }, "🥚"),
          segs(e.races, CREW_RULES.hatchRaces, "egg-segs"),
        );
      });

      // the buddy in the car
      let main;
      if (b && def) {
        const r = crewRarity(def.rarity);
        const maxV = abilityValue({ id: def.id, level: CREW_RULES.maxLevel, stage: 2 });
        const strength = Math.max(1, Math.round((abilityValue(b) / maxV) * 5));
        const step = nextEvolution(b);
        const evolveOk = canEvolve(b, s);
        main = h(
          "div",
          { class: "card buddy-card", style: { "--rarity": r.color }, "data-testid": "buddy-card", "data-buddy": b.id, "data-stage": String(b.stage) },
          h(
            "button",
            {
              class: "buddy-pet",
              "data-testid": "pet",
              "aria-label": "Pohladkať",
              onclick: (ev) => {
                pet(b.id);
                playNotes([[880, 0.08, "sine"], [1175, 0.12, "sine"]]);
                for (let i = 0; i < CREW_RULES.petHearts; i++) {
                  const heart = h("span", { class: "heart", "aria-hidden": "true" }, "💖");
                  heart.style.left = `${30 + Math.random() * 40}%`;
                  heart.style.animationDelay = `${i * 0.12}s`;
                  ev.currentTarget.append(heart);
                  setTimeout(() => heart.remove(), 1400);
                }
                speak(t("{name} sa teší!", { name: t(def.name) }));
                petGrowth(root.querySelector("[data-testid=buddy-card]"), b.id); // the first pat of the day: XP
              },
            },
            buddyFace(b, "big"),
          ),
          h("div", { class: "buddy-stars", "aria-hidden": "true" }, "⭐".repeat(r.stars)),
          h(
            "div",
            { class: "buddy-level", "aria-label": "Level kamaráta" },
            h("span", { class: "level-badge small", style: { "--progress": `${b.level >= CREW_RULES.maxLevel ? 100 : Math.round((b.xp / xpToNext(b.level)) * 100)}%` } }, h("span", { class: "level-num", "data-testid": "buddy-level" }, String(b.level))),
            h("span", { class: "buddy-stages", "aria-hidden": "true" }, def.stages.map((ic, i) => h("span", { class: i <= b.stage ? "on" : "" }, ic))),
          ),
          h("div", { class: "buddy-ability", "data-testid": "buddy-ability", "aria-label": "Schopnosť" }, h("span", { class: "ab-icon" }, abilityIcon(def), "⬆"), segs(strength, 5, "ab-segs")),
          h("div", { class: "buddy-actions care" }, careButtons(b, def, { card: () => root.querySelector("[data-testid=buddy-card]"), paint })),
          h(
            "div",
            { class: "buddy-actions" },
            step &&
              h(
                "button",
                {
                  class: `btn ${evolveOk ? "plum pulse" : "ghost"}`,
                  "data-testid": "evolve",
                  disabled: !evolveOk,
                  onclick: () => {
                    if (!evolve(b.id)) return;
                    sfx.levelUp();
                    confetti(90);
                    speak(t("{name} sa vyvinul!", { name: t(def.name) }));
                    paint();
                  },
                },
                "✨ ",
                def.stages[b.stage + 1],
                h("small", { class: "cost" }, ` 🍬${step.candy}`, b.level < step.level ? " 🔒" : ""),
              ),
            h("button", { class: "btn sky", "data-testid": "wardrobe-open", "aria-label": "Oblečenie", onclick: () => openWardrobe(getState().crew.owned[b.id], paint) }, "🧢🕶️"),
            h("button", { class: "btn ghost", "data-testid": "buddy-home", "aria-label": "Nechať doma", onclick: () => (setActive(null), sfx.back(), speak(t("{name} zostane doma.", { name: t(def.name) })), paint()) }, "🏠"),
          ),
        );
      } else if (Object.keys(s.crew.owned).length) {
        // buddies at home: an empty seat, pick one below
        main = h("div", { class: "card buddy-empty", "data-testid": "buddy-seat", "aria-label": "Prázdne miesto" }, h("div", { class: "be-row" }, h("span", {}, "💺"), h("span", { class: "be-point" }, "👇")));
      } else {
        main = h("div", { class: "card buddy-empty", "aria-hidden": "true" }, h("div", { class: "be-row" }, h("span", {}, "🥚"), h("span", {}, "➡️"), h("span", {}, "🏁🏁🏁"), h("span", {}, "➡️"), h("span", {}, "🐣")));
      }

      // collection
      const grid = h(
        "div",
        { class: "crew-grid", "data-testid": "crew-grid" },
        CREW.map((c) => {
          const owned = s.crew.owned[c.id];
          const r = crewRarity(c.rarity);
          return h(
            "button",
            {
              class: `crew-tile${owned ? "" : " shadow"}${s.crew.active === c.id ? " active" : ""}`,
              style: { "--rarity": r.color },
              "data-testid": `buddy-${c.id}`,
              "data-owned": String(!!owned),
              "aria-label": owned ? c.name : "Neznámy kamarát",
              onclick: () => {
                if (!owned) {
                  sfx.oops();
                  speak("Tohto kamaráta ešte nemáš. Vajíčka padajú od bossov a z truhlíc.");
                  return;
                }
                if (s.crew.active === c.id) {
                  // tapped the buddy that rides along: it stays at home now
                  setActive(null);
                  sfx.back();
                  speak(t("{name} zostane doma.", { name: t(c.name) }));
                } else {
                  setActive(c.id);
                  sfx.tap();
                  speak(t("{name} ide s tebou! {name} {ability}.", { name: t(c.name), ability: abilitySay(c) }));
                }
                paint();
              },
            },
            owned ? buddyFace(owned) : h("span", { class: "buddy-face" }, h("span", { class: "bf-icon" }, c.stages[0])),
            owned && s.crew.active === c.id && h("span", { class: "tile-check", "aria-hidden": "true" }, "🚗"),
          );
        }),
      );

      const found = Object.keys(s.crew.owned).length;
      root.replaceChildren(
        h(
          "div",
          { class: "crew-top" },
          main,
          h(
            "div",
            { class: "card crew-side" },
            h("div", { class: "crew-candy", "data-testid": "candy", "aria-label": "Cukríky" }, "🍬 ", String(s.crew.candy)),
            eggs.length ? h("div", { class: "eggs", "data-testid": "eggs" }, eggs) : h("p", { class: "eggs-empty", "aria-hidden": "true" }, "🥚 ⬅️ 👑 / 🧰"),
          ),
        ),
        h("div", { class: "card crew-book" }, h("div", { class: "crew-count", "aria-label": "Zbierka" }, segs(found, CREW.length, "crew-segs")), grid),
      );
    };
    paint();

    const s = getState();
    const ready = s.eggs.some(isEggReady);
    const b = activeBuddy(s);
    speak(ready ? "Vajíčko je pripravené! Ťukni naň." : b ? t("Kamaráti. {name} sedí v tvojom aute.", { name: t(crewDef(b.id).name) }) : "Kamaráti. Vajíčka dostaneš od bossov a z truhlíc.");
    if (ready) toast("🥚 ➡️ 🐣", { ms: 2000 });
  },
};
