// Car stats (DESIGN-v2 §4.3): every stat is an icon, its number and a bar, and the car power
// is one big number on a badge. Reused by Races and Garage.

import { h } from "../core/ui.js";
import { STATS, STAT_IDS, STAT_BAR_FULL } from "../data/stats.js";

export function statBar(statId, value) {
  const def = STATS[statId];
  const v = Math.max(0, Math.round(Number(value) || 0));
  const fill = Math.min(1, v / STAT_BAR_FULL);
  return h(
    "div",
    { class: "stat-row", style: { "--stat": def.color, "--fill": `${Math.round(fill * 100)}%` }, "data-stat": statId, "data-value": String(v), "aria-label": `${def.name}: ${v}` },
    h("span", { class: "stat-icon", "aria-hidden": "true" }, def.icon),
    h("span", { class: "stat-num" }, String(v)),
    h("span", { class: "stat-bar" }, h("i")),
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
