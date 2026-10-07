// Hidden test menu for the parent: hold ⚙️ for 3 s, then answer a multiplication.
// Later parts add their own cheats to CHEATS (loot, bosses, crew…).

import { h, modal, closeModal, toast } from "../core/ui.js";
import { sfx, tone } from "../core/audio.js";
import { getState, update, CURRENT_VERSION } from "../core/state.js";
import { addCoins } from "../systems/economy.js";
import { addXp, xpToNext, MAX_LEVEL, unlockAllTracks, readyAllBosses } from "../systems/progress.js";
import { starterParts, testParts, generatePart, rollRarity } from "../systems/loot.js";
import { LEGENDARIES } from "../data/legendaries.js";
import { SETS } from "../data/sets.js";
import { addParts } from "../systems/garage.js";
import { ownAll } from "../systems/tuning.js";
import { addEgg, hatchEggsNow, ownAllCrew, crewLevelUp } from "../systems/crew.js";
import { unlockAllColoring } from "../systems/coloring.js";
import { finishAllQuests } from "../systems/quests.js";
import { giveStickers } from "../systems/album.js";
import * as rng from "../core/rng.js";
import { go } from "../core/router.js";

function setLevel(level) {
  update((s) => {
    s.level = Math.min(MAX_LEVEL, level);
    s.xp = 0;
  });
}

function setCar(parts) {
  update((s) => {
    s.car.equipped = parts;
  });
}

function giveParts(n, rarity) {
  const parts = [];
  for (let i = 0; i < n; i++) parts.push(generatePart({ rarity: rarity || rollRarity({ level: 3, trackIndex: 2, luck: 0, rng }), budget: 20 + rng.int(0, 60), rng }));
  addParts(parts);
}

const CHEATS = [
  { id: "c1k", label: "+1 000 🪙", color: "sun", run: () => addCoins(1000) },
  { id: "daily", label: "🎁 Denný darček znova", color: "grass", run: () => update((s) => (s.daily.last = null)) },
  { id: "stickers", label: "🎴 +30 nálepiek", color: "plum", run: () => giveStickers(30, rng) },
  { id: "rent", label: "🏙️ Nájom za 12 h", color: "grass", run: () => update((s) => Object.keys(s.city.rentAt).forEach((k) => (s.city.rentAt[k] -= 12 * 3600000))) },
  { id: "c10k", label: "+10 000 🪙", color: "sun", run: () => addCoins(10000) },
  { id: "c100k", label: "+100 000 🪙", color: "sun", run: () => addCoins(100000) },
  { id: "lvl", label: "+1 level", color: "plum", run: () => addXp(xpToNext(getState().level) - getState().xp) },
  { id: "lvl20", label: "Level 20", color: "plum", run: () => setLevel(20) },
  {
    id: "short",
    label: () => `Krátke preteky: ${getState().cheats.shortRaces ? "zapnuté" : "vypnuté"}`,
    color: "grass",
    run: () => update((s) => (s.cheats.shortRaces = !s.cheats.shortRaces)),
    reopen: true,
  },
  { id: "carStarter", label: "🚗 Začiatočné auto", color: "ghost", run: () => setCar(starterParts()) },
  { id: "carStrong", label: "🚙 Silné auto", color: "plum", run: () => setCar(testParts(50, "rare")) },
  { id: "carSuper", label: "🏎️ Super auto", color: "plum", run: () => setCar(testParts(100, "epic")) },
  { id: "parts10", label: "🧰 +10 dielov", color: "sky", run: () => giveParts(10) },
  { id: "epic", label: "🟣 Epický diel", color: "sky", run: () => giveParts(1, "epic") },
  { id: "legend", label: "🟠 Legendárny diel", color: "sky", run: () => addParts([generatePart({ rarity: "legendary", budget: 60, rng, legendary: rng.pick(LEGENDARIES).id })]) },
  { id: "allLegends", label: "🟠 Všetky legendárne", color: "sky", run: () => addParts(LEGENDARIES.map((l) => generatePart({ rarity: "legendary", budget: 60, rng, legendary: l.id }))) },
  { id: "sets", label: "📖 Všetky sety", color: "sky", run: () => addParts(SETS.flatMap((st) => Object.keys(st.pieces).map((slot) => generatePart({ rarity: "epic", budget: 60, rng, slot, set: st.id })))) },
  { id: "bosses", label: "👑 Bossovia pripravení", color: "tomato", run: readyAllBosses },
  { id: "scrap", label: "+500 🔩", color: "sun", run: () => update((s) => (s.scrap += 500)) },
  { id: "looks", label: "🎨 Celý vzhľad", color: "plum", run: ownAll },
  { id: "eggs3", label: "🥚 +3 vajíčka", color: "grass", run: () => [1, 2, 3].forEach(() => addEgg("chest")) },
  { id: "hatchNow", label: "🐣 Vajíčka hneď", color: "grass", run: hatchEggsNow },
  { id: "crewAll", label: "🐾 Všetci kamaráti", color: "grass", run: ownAllCrew },
  { id: "crewLvl", label: "⬆ Kamarát +5 levelov", color: "grass", run: () => crewLevelUp(5) },
  { id: "candy", label: "+50 🍬", color: "sun", run: () => update((s) => (s.crew.candy += 50)) },
  { id: "coloringAll", label: "🖍️ Všetky obrázky a farby", color: "plum", run: unlockAllColoring },
  { id: "quests", label: "📜 Splniť úlohy", color: "grass", run: finishAllQuests },
  { id: "tracks", label: "🛣️ Všetky trate a úrovne", color: "grass", run: unlockAllTracks },
  { id: "demo", label: "🚗 Skúšobná jazda", color: "sky", run: () => go("game/demo"), close: true },
  { id: "demoCrash", label: "💥 Test zaseknutia slučky", color: "tomato", run: () => go("game/demo-crash"), close: true },
];

export function openTestMenu() {
  const s = getState();
  let bytes = 0;
  try {
    bytes = (localStorage.getItem("autickove-mesto-v2") || "").length;
  } catch {
    /* ignore */
  }
  const buttons = CHEATS.map((c) =>
    h(
      "button",
      {
        class: `btn small ${c.color}`,
        "data-testid": `cheat-${c.id}`,
        onclick: () => {
          c.run();
          sfx.coin();
          if (c.close) return closeModal();
          if (c.reopen) return openTestMenu();
          toast("Hotovo ✔");
        },
      },
      typeof c.label === "function" ? c.label() : c.label,
    ),
  );
  modal(
    [
      h("h2", {}, "🧪 Testovacie menu"),
      h("p", { class: "small" }, `Skryté pred dieťaťom. Zmeny sa hneď uložia. Schéma v${CURRENT_VERSION}, uložené ${Math.round(bytes / 1024 * 10) / 10} kB, level ${s.level}, ${s.coins} 🪙.`),
      h("div", { class: "cheat-grid" }, buttons),
      h("div", { class: "modal-row" }, h("button", { class: "btn ghost", onclick: closeModal }, "Zavrieť")),
    ],
    { className: "wide", testId: "test-menu" },
  );
}

/** Parent gate: a × b with a, b in 6..9. */
export function openParentGate() {
  const a = 6 + Math.floor(Math.random() * 4);
  const b = 6 + Math.floor(Math.random() * 4);
  const input = h("input", { class: "gate-input", type: "number", inputmode: "numeric", autocomplete: "off", "aria-label": "Výsledok", "data-testid": "gate-input" });
  const submit = () => {
    if (Number(input.value) === a * b) openTestMenu();
    else {
      closeModal();
      toast("Nesprávne.");
    }
  };
  input.addEventListener("keydown", (e) => e.key === "Enter" && submit());
  tone(300, 0.1, { type: "square", volume: 0.05 });
  modal(
    [
      h("h2", {}, "Pre rodičov"),
      h("p", { "data-testid": "gate-question" }, `Koľko je ${a} × ${b}?`),
      input,
      h(
        "div",
        { class: "modal-row" },
        h("button", { class: "btn ghost", onclick: closeModal }, "Zrušiť"),
        h("button", { class: "btn grass", "data-testid": "gate-ok", onclick: submit }, "OK"),
      ),
    ],
    { testId: "parent-gate" },
  );
}
