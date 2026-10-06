# Autíčkové mesto: pokyny pre prácu na projekte

Detská hra v prehliadači pre 6-ročné dieťa, ktoré ešte nevie čítať. Hosting: GitHub Pages (https://dzizka.github.io/autickove-mesto/).

- `v1/`: hotová verzia 1. Upravuje sa **len oprava chyby**, o ktorú rodič požiada. Kód je rozdelený do `v1/css/` a `v1/js/`: sú to klasické skripty (nie moduly) so spoločnými globálnymi premennými a **musia sa načítať v poradí z `v1/index.html`**.
- `v2/`: verzia 2 je **nová hra od začiatku**. Z v1 sa nekopíruje obsah ani kód. Zadanie je v `DESIGN-v2.md` a je záväzné. Pri odchýlke najprv upraviť zadanie.

## Pravidlá pre v2
- **Bez kompilácie:** čisté HTML, CSS a ES moduly, ktoré bežia priamo na GitHub Pages. Žiadny framework.
- **Štruktúra podľa `DESIGN-v2.md`, bod 2.** Súbor najviac ~400 riadkov, dáta len v `js/data/`, jedna hra = jeden modul s rozhraním `{ id, title, icon, unlockLevel, start(view, ctx), stop() }`.
- **Texty pre hráča:** po slovensky a predčítané hlasom. Kód a komentáre po anglicky.
- **Pre dieťa:** žiadne čísla ani text, ktoré musí čítať. Štatistiky ukazovať ikonami a pruhmi. Veľké tlačidlá. Prehra neexistuje.
- **Hry s `requestAnimationFrame`:** používajú `core/loop.js` (ochrana proti zamrznutiu).
- **Uloženie:** `localStorage` kľúč `autickove-mesto-v2`. Zmena schémy znamená zvýšiť `version` a pridať migráciu.

## Postup práce
- **Po častiach** podľa `DESIGN-v2.md`, bod 9. Po každej časti nahrať zmeny na `main` a krátko po slovensky zhrnúť, čo pribudlo.
- **Pred nahraním** spustiť testy v `v2/tests/` a pozrieť sa na obrazovky v šírke 390 px a 1280 px.
- **Lokálne spustenie:** `python3 -m http.server` v koreni repozitára a otvoriť `/v2/`. Cez `file://` ES moduly nefungujú.
