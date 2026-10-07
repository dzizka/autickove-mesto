// Parents' overview (DESIGN-v2 §8): play time over the last 7 days, what the child plays most
// and how strong the car is. This is the only screen with numbers and text to read.

import { h } from "../core/ui.js";
import { getState } from "../core/state.js";
import { goHome } from "../core/router.js";
import { dayKey } from "../systems/progress.js";
import { carStats, carPower } from "../systems/stats.js";
import { TRACKS } from "../data/tracks.js";
import { TROPHIES } from "../data/trophies.js";
import { CREW } from "../data/crew.js";
import { isTrackUnlocked, trackProgress } from "../systems/progress.js";

const GAME_NAMES = { race: "Preteky", coloring: "Omaľovánka", demo: "Skúšobná jazda" };
const DAY_NAMES = ["ne", "po", "ut", "st", "št", "pi", "so"];

function lastDays(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d);
  }
  return out;
}

const minutes = (sec) => Math.round((sec || 0) / 60);

export default {
  id: "parents",
  title: "Prehľad pre rodičov",
  render(view) {
    const s = getState();
    const days = lastDays(7).map((d) => ({ d, entry: s.playLog[dayKey(d)] || { seconds: 0, games: {} } }));
    const maxMin = Math.max(10, ...days.map((x) => minutes(x.entry.seconds)));
    const total = days.reduce((sum, x) => sum + minutes(x.entry.seconds), 0);

    const bars = h(
      "div",
      { class: "pa-chart", "data-testid": "parents-chart" },
      days.map(({ d, entry }) => {
        const m = minutes(entry.seconds);
        return h(
          "div",
          { class: "pa-col" },
          h("span", { class: "pa-val" }, m ? `${m}` : ""),
          h("span", { class: "pa-bar", style: { height: `${(m / maxMin) * 100}%` } }),
          h("span", { class: "pa-day" }, DAY_NAMES[d.getDay()]),
        );
      }),
    );

    const counts = {};
    for (const { entry } of days) for (const [g, n] of Object.entries(entry.games || {})) counts[g] = (counts[g] || 0) + n;
    const games = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const stats = carStats();
    const row = (label, value) => h("div", { class: "pa-row" }, h("span", {}, label), h("b", {}, String(value)));
    const openTracks = TRACKS.filter((t) => isTrackUnlocked(t.id, s));

    view.append(
      h(
        "section",
        { class: "screen parents", "data-testid": "screen-parents" },
        h("h1", { class: "screen-title" }, "👪 Prehľad pre rodičov"),
        h("div", { class: "card" }, h("h2", {}, "Čas hrania za 7 dní"), bars, h("p", { class: "small" }, `Spolu ${total} min, v priemere ${Math.round(total / 7)} min denne. Počíta sa len čas, keď je hra na obrazovke.`)),
        h(
          "div",
          { class: "card" },
          h("h2", {}, "Čo hrá najčastejšie (7 dní)"),
          games.length ? games.map(([g, n]) => row(GAME_NAMES[g] || g, `${n}×`)) : h("p", { class: "small" }, "Zatiaľ nič."),
        ),
        h(
          "div",
          { class: "card", "data-testid": "parents-car" },
          h("h2", {}, "Auto a postup"),
          row("Sila auta", carPower(stats)),
          row("Rýchlosť / ovládanie / odolnosť", `${stats.speed} / ${stats.handling} / ${stats.armor}`),
          row("Benzín / magnet / šťastie", `${stats.fuel} / ${stats.magnet} / ${stats.luck}`),
          row("Level hráča", s.level),
          row("Mince", s.coins),
          row("Preteky spolu / víťazstvá", `${s.races.total} / ${s.races.wins}`),
          row("Otvorené trate", `${openTracks.length} z ${TRACKS.length} (najvyššia úroveň: ${Math.max(...openTracks.map((t) => trackProgress(t.id, s).unlocked))})`),
          row("Porazení bossovia", `${Object.values(s.bosses || {}).filter(Boolean).length} z 6`),
          row("Kamaráti", `${Object.keys(s.crew.owned).length} z ${CREW.length}`),
          row("Vymaľované obrázky", s.coloring.finished),
          row("Trofeje", `${Object.keys(s.trophies).length} z ${TROPHIES.length}`),
          row("Splnené úlohy", s.quests.done),
        ),
        h("button", { class: "btn big sun", "data-testid": "back-home", "aria-label": "Domov", onclick: goHome }, h("span", { class: "btn-icon", "aria-hidden": "true" }, "🏠"), h("span", { class: "btn-label" }, "Domov")),
      ),
    );
  },
};
