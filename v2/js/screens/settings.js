// Settings: sound, voice, progress transfer (AM2: code), start over.
// The hidden test menu opens by holding ⚙️ in the top bar for 3 s (see topbar.js).

import { h, modal, closeModal, confirm, toast } from "../core/ui.js";
import { speak, sfx, hasSlovakVoice } from "../core/audio.js";
import { getState, update, replace, reset } from "../core/state.js";
import { exportCode, parseCode } from "../core/save-transfer.js";
import { goHome } from "../core/router.js";

function toggleRow({ key, icon, label, say }) {
  const on = () => getState().settings[key] !== false;
  const btn = h("button", {
    class: "switch",
    role: "switch",
    "aria-label": label,
    "data-testid": `toggle-${key}`,
    onclick: () => {
      update((s) => {
        s.settings[key] = !on();
      });
      paint();
      sfx.tap();
      if (on()) speak(say);
    },
  });
  const paint = () => {
    btn.setAttribute("aria-checked", String(on()));
    btn.textContent = on() ? "✔" : "✖";
  };
  paint();
  return h("div", { class: "setting-row" }, h("span", { class: "setting-icon", "aria-hidden": "true" }, icon), h("span", { class: "setting-label" }, label), btn);
}

const ERRORS = {
  prefix: "Kód musí začínať AM2:. Skontroluj, či si skopíroval celý kód.",
  broken: "Kód je poškodený alebo neúplný. Skopíruj ho znova celý.",
  newer: "Kód je z novšej verzie hry. Najprv obnov stránku.",
};

export function openTransfer() {
  const out = h("textarea", { class: "code-box", readonly: true, "data-testid": "export-code", "aria-label": "Kód postupu" });
  out.value = exportCode();
  const input = h("textarea", { class: "code-box", "data-testid": "import-code", placeholder: "Sem vlož kód, ktorý začína AM2:", "aria-label": "Vložiť kód" });
  const msg = h("div", { class: "transfer-msg", "data-testid": "import-msg" });

  const copy = () => {
    const fallback = () => {
      out.focus();
      out.select();
      toast("Kód je označený. Skopíruj ho (Ctrl+C alebo podrž prst).");
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(out.value).then(() => toast("Kód je skopírovaný ✔"), fallback);
    else fallback();
  };

  const check = () => {
    msg.replaceChildren();
    let data;
    try {
      data = parseCode(input.value);
    } catch (err) {
      sfx.oops();
      msg.append(h("p", { class: "error" }, ERRORS[err.code] || ERRORS.broken));
      return;
    }
    msg.append(
      h("p", {}, `Našiel som postup: level ${data.level}, ${data.coins} 🪙. Terajší postup v tomto prehliadači sa nahradí.`),
      h("button", {
        class: "btn tomato",
        "data-testid": "import-confirm",
        onclick: () => {
          replace(data);
          closeModal();
          sfx.win();
          toast("Postup je prenesený ✔", { say: true });
          goHome();
        },
      }, "✔ Áno, nahradiť"),
    );
  };

  modal(
    [
      h("h2", {}, "📤 Preniesť postup"),
      h("p", { class: "small" }, "Postup sa ukladá len v tomto prehliadači. Na inom zariadení vlož tento kód."),
      h("h3", {}, "1. Skopírovať tento postup"),
      out,
      h("button", { class: "btn sun", onclick: copy }, "📋 Kopírovať"),
      h("h3", {}, "2. Vložiť postup z iného zariadenia"),
      input,
      h("button", { class: "btn plum", "data-testid": "import-check", onclick: check }, "📥 Načítať kód"),
      msg,
      h("div", { class: "modal-row" }, h("button", { class: "btn ghost", onclick: closeModal }, "Zavrieť")),
    ],
    { className: "wide", testId: "transfer-modal" },
  );
}

async function startOver() {
  const first = await confirm({ icon: "🗑️", title: "Začať odznova?", text: "Zmaže sa všetok postup v tomto prehliadači.", say: "Naozaj začať odznova?", danger: true });
  if (!first) return;
  const second = await confirm({ icon: "⚠️", title: "Naozaj?", text: "Toto sa nedá vrátiť. Ak chceš postup zachovať, najprv si skopíruj kód.", yes: "Zmazať", danger: true });
  if (!second) return;
  reset();
  toast("Hra začína odznova.", { say: true });
  goHome();
}

export default {
  id: "settings",
  title: "Nastavenia",
  render(view) {
    view.append(
      h(
        "section",
        { class: "screen settings", "data-testid": "screen-settings" },
        h("h1", { class: "screen-title" }, "⚙️ Nastavenia"),
        h(
          "div",
          { class: "card" },
          toggleRow({ key: "sound", icon: "🔔", label: "Zvuky", say: "Zvuky sú zapnuté." }),
          toggleRow({ key: "voice", icon: "🗣️", label: "Hlas", say: "Hlas je zapnutý." }),
          !hasSlovakVoice() && h("p", { class: "small" }, "Tento prehliadač nemá slovenský hlas. Hra číta náhradným hlasom."),
        ),
        h(
          "div",
          { class: "card stack" },
          h("button", { class: "btn sky", "data-testid": "open-transfer", onclick: openTransfer }, "📤 Preniesť postup"),
          h("button", { class: "btn ghost", "data-testid": "start-over", onclick: startOver }, "🗑️ Začať odznova"),
        ),
        h("button", { class: "btn big sun", "data-testid": "back-home", "aria-label": "Domov", onclick: () => { sfx.back(); goHome(); } },
          h("span", { class: "btn-icon", "aria-hidden": "true" }, "🏠"), h("span", { class: "btn-label" }, "Domov")),
      ),
    );
    speak("Nastavenia");
  },
};
