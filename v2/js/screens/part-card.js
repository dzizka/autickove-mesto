// A part as the child sees it: big icon, rarity colour frame, ⭐ per upgrade,
// green ⬆ / red ⬇ versus the mounted part, ✨ for new, 🔒 when locked.
// Also the part detail dialog with side-by-side stat bars and the actions.

import { h, modal, closeModal, confirm, toast } from "../core/ui.js";
import { speak, sfx } from "../core/audio.js";
import { getState } from "../core/state.js";
import { STATS, STAT_IDS, SLOTS } from "../data/stats.js";
import { partStats } from "../systems/stats.js";
import { rarityDef, rarityIndex } from "../systems/loot.js";
import { partPower, partIcon, compareToEquipped, findPart, equip, dismantle, upgrade, upgradeCost, canUpgrade, toggleLock, markSeen, scrapValue } from "../systems/garage.js";

const ARROW = { 1: "⬆", "-1": "⬇", 0: "" };
const RARITY_SAY = ["Obyčajný diel.", "Dobrý diel.", "Vzácny diel!", "Epický diel!", "Legendárny diel!"];

export function partCard(part, { onClick, compare = true, testId } = {}) {
  const r = rarityDef(part.rarity);
  const cmp = compare ? compareToEquipped(part) : 0;
  return h(
    "button",
    {
      class: `part-card rarity-${r.id}${part.isNew ? " is-new" : ""}`,
      style: { "--rarity": r.color },
      "data-testid": testId || `part-${part.uid}`,
      "data-compare": String(cmp),
      "data-rarity": r.id,
      "aria-label": `${SLOTS.find((s) => s.id === part.slot)?.name || ""}, ${r.name}`,
      onclick: onClick,
    },
    h("span", { class: "pc-icon", "aria-hidden": "true" }, partIcon(part)),
    part.plus > 0 && h("span", { class: "pc-stars", "aria-hidden": "true" }, "⭐".repeat(part.plus)),
    cmp !== 0 && h("span", { class: `pc-arrow ${cmp > 0 ? "up" : "down"}`, "aria-hidden": "true" }, ARROW[cmp]),
    part.isNew && h("span", { class: "pc-new" }, "NOVÉ"),
    part.locked && h("span", { class: "pc-lock", "aria-hidden": "true" }, "🔒"),
    part.legendary && h("span", { class: "pc-spark", "aria-hidden": "true" }, "✨"),
  );
}

/** Rows of side-by-side bars: mounted part (grey) vs this part (rarity colour). */
function compareRows(part, mounted) {
  const a = partStats(mounted);
  const b = partStats(part);
  const max = Math.max(1, ...STAT_IDS.map((id) => Math.max(a[id], b[id])));
  return STAT_IDS.filter((id) => a[id] > 0 || b[id] > 0).map((id) => {
    const diff = Math.round(b[id]) - Math.round(a[id]);
    return h(
      "div",
      { class: "cmp-row", "data-stat": id },
      h("span", { class: "stat-icon", "aria-hidden": "true" }, STATS[id].icon),
      h(
        "span",
        { class: "cmp-bars" },
        mounted !== part && h("i", { class: "cmp-old", style: { width: `${(a[id] / max) * 100}%` } }),
        h("i", { class: "cmp-new", style: { width: `${(b[id] / max) * 100}%`, background: STATS[id].color } }),
      ),
      h("span", { class: `cmp-arrow ${diff > 0 ? "up" : diff < 0 ? "down" : ""}`, "aria-hidden": "true" }, mounted === part ? "" : diff > 0 ? "⬆" : diff < 0 ? "⬇" : "＝"),
    );
  });
}

/** Detail dialog for one part. `onChange` is called after any action. */
export function openPartDetail(uid, { onChange } = {}) {
  const found = findPart(uid);
  if (!found) return;
  const { part, where } = found;
  markSeen(uid);
  const s = getState();
  const mounted = s.car.equipped[part.slot];
  const inBag = where === "bag";
  const r = rarityDef(part.rarity);
  const cmp = inBag ? compareToEquipped(part) : 0;
  const cost = upgradeCost(part);
  const refresh = () => {
    onChange?.();
    if (findPart(uid)) openPartDetail(uid, { onChange });
  };

  const actions = [];
  if (inBag) {
    actions.push(
      h("button", {
        class: `btn ${cmp > 0 ? "grass" : "sky"}`,
        "data-testid": "part-equip",
        onclick: () => {
          equip(uid);
          sfx.win();
          speak(cmp > 0 ? "Namontované! Auto je silnejšie." : "Namontované.");
          closeModal();
          onChange?.();
        },
      }, "🔧 Namontovať"),
    );
  }
  if (cost) {
    actions.push(
      h("button", {
        class: "btn sun",
        "data-testid": "part-upgrade",
        disabled: !canUpgrade(part),
        onclick: () => {
          if (!upgrade(uid)) return;
          sfx.levelUp();
          speak("Vylepšené! Pribudla hviezdička.");
          refresh();
        },
      }, "⭐ Vylepšiť ", h("small", { class: "cost" }, `🔩${cost.scrap} 🪙${cost.coins}`)),
    );
  }
  actions.push(
    h("button", {
      class: "btn ghost",
      "data-testid": "part-lock",
      onclick: () => {
        const locked = toggleLock(uid);
        sfx.tap();
        speak(locked ? "Zamknuté. Tento diel sa nerozoberie." : "Odomknuté.");
        refresh();
      },
    }, part.locked ? "🔓 Odomknúť" : "🔒 Zamknúť"),
  );
  if (inBag && !part.locked) {
    actions.push(
      h("button", {
        class: "btn tomato",
        "data-testid": "part-dismantle",
        onclick: async () => {
          if (rarityIndex(part.rarity) >= 2) {
            const ok = await confirm({ icon: "🔩", title: "Rozobrať?", text: `${r.name} diel sa zmení na súčiastky.`, say: "Naozaj rozobrať tento vzácny diel?", danger: true });
            if (!ok) return openPartDetail(uid, { onChange });
          }
          const gained = dismantle(uid);
          closeModal();
          sfx.coin();
          toast(`+${gained}`, { icon: "🔩" });
          speak("Rozobrané na súčiastky.");
          onChange?.();
        },
      }, "🔩 Rozobrať ", h("small", { class: "cost" }, `+${scrapValue(part)}`)),
    );
  }

  modal(
    [
      h(
        "div",
        { class: `pd-head rarity-${r.id}`, style: { "--rarity": r.color } },
        h("span", { class: "pd-icon", "aria-hidden": "true" }, partIcon(part)),
        h("div", {}, h("div", { class: "pd-rarity" }, r.name), h("div", { class: "pd-stars", "aria-hidden": "true" }, "⭐".repeat(part.plus || 0) || "·"), h("div", { class: "pd-power" }, "💪 ", String(partPower(part)), inBag && mounted ? h("span", { class: "pd-vs" }, ` / ${partPower(mounted)}`) : "")),
        cmp !== 0 && h("span", { class: `pd-arrow ${cmp > 0 ? "up" : "down"}`, "aria-hidden": "true" }, ARROW[cmp]),
      ),
      inBag && mounted && h("div", { class: "cmp-legend", "aria-hidden": "true" }, h("span", { class: "leg-old" }, partIcon(mounted)), " → ", h("span", { class: "leg-new" }, partIcon(part))),
      h("div", { class: "cmp" }, compareRows(part, inBag ? mounted : part)),
      h("div", { class: "pd-actions" }, actions),
      h("div", { class: "modal-row" }, h("button", { class: "btn ghost", "data-testid": "part-close", onclick: closeModal }, "✖")),
    ],
    { className: "part-modal", testId: "part-detail" },
  );
  if (!inBag) speak("Toto máš namontované.");
  else speak(cmp > 0 ? `${RARITY_SAY[rarityIndex(part.rarity)]} Je lepší ako ten v aute!` : cmp < 0 ? "Tento diel je slabší ako ten v aute." : RARITY_SAY[rarityIndex(part.rarity)]);
}
