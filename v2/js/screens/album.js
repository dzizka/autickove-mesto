// 📒 Album (DESIGN-v2 §13): sticker pages, packs from the kiosk, silver and gold stickers
// made from spare copies, and a reward for every full page.

import { h, modal, closeModal, confetti, flyCoins } from "../core/ui.js";
import { speak, sfx, playNotes } from "../core/audio.js";
import * as rng from "../core/rng.js";
import { getState } from "../core/state.js";
import { PAGES, ALBUM } from "../data/album.js";
import { openPages, stickerCount, stickerTier, spare, isGold, pageFound, buyPack, upgradeSticker } from "../systems/album.js";
import { t } from "../core/i18n.js";

const TIER_ICON = ["", "🥈", "🥇"];

/** Pack opening: the stickers flip over one by one; new ones are marked. */
export function showStickers(result, { title = "🎴", onClose } = {}) {
  const cards = result.stickers.map(({ sticker, isNew }, i) =>
    h("div", { class: `pack-card${isGold(sticker) ? " gold" : ""}`, style: { animationDelay: `${0.2 + i * 0.35}s` }, "data-testid": "pack-card" }, h("span", { class: "pack-st" }, sticker), isNew && h("span", { class: "pc-new" }, "NOVÁ")),
  );
  modal(
    [
      h("div", { class: "modal-icon", "aria-hidden": "true" }, title),
      h("div", { class: "pack-row" }, cards),
      ...result.pages.map(({ page, coins }) => h("div", { class: "reward-row", "data-testid": "page-reward" }, page.icon, " ✅ 🪙 +", String(coins))),
      h("div", { class: "modal-row" }, h("button", { class: "btn grass", "data-testid": "pack-ok", "aria-label": "Super", onclick: () => (closeModal(), onClose?.()) }, "👍")),
    ],
    { dismissible: false, testId: "pack-modal" },
  );
  sfx.open();
  const fresh = result.stickers.filter((x) => x.isNew).length;
  if (result.pages.length) {
    confetti(90);
    speak("Celá stránka je plná! Tu je odmena.");
  } else speak(fresh ? (fresh > 1 ? "Nové nálepky!" : "Nová nálepka!") : "Tieto už máš. Z rovnakých môžeš vyrobiť striebornú alebo zlatú.");
}

export default {
  id: "album",
  title: "Album",
  render(view) {
    const root = h("section", { class: "screen album", "data-testid": "screen-album" });

    function stickerModal(st) {
      const tier = stickerTier(st);
      const next = ALBUM.tiers[tier + 1];
      const sp = spare(st);
      sfx.tap();
      modal(
        [
          h("div", { class: `big-sticker tier-${tier}` }, st),
          h("div", { class: "tier-row", "aria-hidden": "true" }, ALBUM.tiers.slice(1).map((t, k) => h("span", { class: k + 1 <= tier ? "on" : "" }, TIER_ICON[k + 1]))),
          next &&
            h(
              "div",
              { class: "spare-row", "aria-label": "Rovnaké nálepky" },
              Array.from({ length: next.cost }, (_, i) => h("span", { class: i < sp ? "on" : "" }, st)),
            ),
          h(
            "div",
            { class: "modal-row" },
            next &&
              h(
                "button",
                {
                  class: `btn ${sp >= next.cost ? "sun pulse" : "ghost"}`,
                  "data-testid": "sticker-upgrade",
                  disabled: sp < next.cost,
                  "aria-label": next.name,
                  onclick: () => {
                    if (!upgradeSticker(st)) return;
                    playNotes([[523, 0.1, "triangle"], [659, 0.1, "triangle"], [784, 0.1, "triangle"], [1047, 0.25, "triangle"]]);
                    confetti(40);
                    speak(t("{name} nálepka!", { name: t(next.name) }));
                    closeModal();
                    paint();
                  },
                },
                "⬆ ",
                TIER_ICON[tier + 1],
              ),
            h("button", { class: "btn ghost", "data-testid": "sticker-close", onclick: closeModal }, "✖"),
          ),
        ],
        { testId: "sticker-detail" },
      );
      speak(next ? (sp >= next.cost ? t("Máš dosť rovnakých nálepiek. Vyrob {name}!", { name: t(next.name).toLowerCase() }) : "Zbieraj rovnaké nálepky a vyrobíš striebornú alebo zlatú.") : "Zlatá nálepka! Krajšia už nebude.");
    }

    function pageEl(page) {
      const s = getState();
      if (s.level < page.unlockLevel) return h("div", { class: "alb-page locked", "data-testid": `page-${page.id}` }, h("div", { class: "alb-head" }, "🔒 ", page.icon, h("span", { class: "lot-chip" }, "⭐", String(page.unlockLevel))));
      const found = pageFound(page, s);
      const done = s.album.pagesDone.includes(page.id);
      return h(
        "div",
        { class: `alb-page${done ? " done" : ""}`, "data-testid": `page-${page.id}`, "data-found": String(found) },
        h("div", { class: "alb-head" }, h("span", { class: "alb-icon", "aria-hidden": "true" }, page.icon), h("span", { class: "alb-name" }, page.name), h("span", { class: "segs alb-segs", "aria-hidden": "true" }, page.stickers.map((st) => h("i", { class: stickerCount(st, s) ? "on" : "" }))), done && h("span", { "aria-hidden": "true" }, "✅")),
        h(
          "div",
          { class: "alb-grid" },
          page.stickers.map((st) => {
            const n = stickerCount(st, s);
            if (!n) return h("div", { class: `alb-slot empty${isGold(st) ? " gold" : ""}`, "aria-hidden": "true" }, "?");
            const tier = stickerTier(st, s);
            const canUp = ALBUM.tiers[tier + 1] && spare(st, s) >= ALBUM.tiers[tier + 1].cost;
            return h(
              "button",
              { class: `alb-slot got tier-${tier}${isGold(st) ? " gold" : ""}`, "data-testid": `st-${st}`, "aria-label": "Nálepka", onclick: () => stickerModal(st) },
              st,
              spare(st, s) > 0 && h("small", { class: "alb-spare" }, "+", String(spare(st, s))),
              canUp && h("em", { class: "alb-up", "aria-hidden": "true" }, "⬆"),
            );
          }),
        ),
      );
    }

    const pack = h(
      "button",
      {
        class: "btn big sun alb-pack",
        "data-testid": "buy-pack",
        "aria-label": "Balíček nálepiek",
        onclick: (e) => {
          const res = buyPack(rng);
          if (!res) {
            sfx.oops();
            speak("Na balíček treba viac mincí. Jazdi preteky alebo sa hraj!");
            return;
          }
          flyCoins(e.currentTarget, 3);
          showStickers(res, { onClose: paint });
          paint();
        },
      },
      h("span", { class: "btn-icon", "aria-hidden": "true" }, "🎴"),
      h("span", { class: "btn-label" }, "🪙 ", String(ALBUM.packPrice)),
    );
    const pages = h("div", { class: "alb-pages" });
    function paint() {
      pages.replaceChildren(...PAGES.map(pageEl));
      pack.disabled = false;
    }
    paint();
    root.append(h("div", { class: "alb-top" }, pack), pages);
    view.append(root);
    const open = openPages();
    const have = open.reduce((n, p) => n + pageFound(p), 0);
    speak(have ? "Tvoj album. Ťukni na nálepku." : "Prázdny album. Kúp si balíček nálepiek!", { interrupt: false });
  },
};
