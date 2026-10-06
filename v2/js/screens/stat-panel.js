// Car stats for the child: icon + 5 coloured segments per stat, and the car power
// as one big number on a badge (DESIGN-v2 §4.3). Reused by Races and Garage.

import { h } from "../core/ui.js";
import { STATS, STAT_IDS } from "../data/stats.js";
import { statBars, statBarFill } from "../systems/stats.js";

export function statBar(statId, value) {
  const def = STATS[statId];
  const lit = statBars(statId, value);
  const fill = statBarFill(statId, value);
  const segs = [];
  for (let i = 0; i < 5; i++) {
    const seg = h("i", { class: i < lit ? "on" : "" });
    if (i === lit && fill > 0) seg.style.setProperty("--fill", `${Math.round(fill * 100)}%`);
    segs.push(seg);
  }
  return h(
    "div",
    { class: "stat-row", style: { "--stat": def.color }, "data-stat": statId, "data-bars": String(lit), "aria-label": `${def.name}: ${lit} z 5` },
    h("span", { class: "stat-icon", "aria-hidden": "true" }, def.icon),
    h("span", { class: "stat-segs" }, segs),
  );
}

export function statPanel(stats) {
  return h("div", { class: "stat-panel", "data-testid": "stat-panel" }, STAT_IDS.map((id) => statBar(id, stats[id])));
}

/** Big power number with a coloured badge; the colour steps up as the car grows. */
export function powerBadge(power) {
  const tier = power >= 450 ? 5 : power >= 300 ? 4 : power >= 180 ? 3 : power >= 90 ? 2 : 1;
  return h("div", { class: `power-badge tier-${tier}`, "data-testid": "car-power", "aria-label": "Sila auta" }, h("span", { class: "power-icon", "aria-hidden": "true" }, "💪"), h("span", { class: "power-num" }, String(power)));
}
