# Autíčkové mesto 🚗🏙️

Detská hra v prehliadači pre deti okolo 6 rokov. Autíčka, preteky, mesto, nálepky a kamaráti.
Hrá sa ťukaním na telefóne, tablete aj počítači a pokyny hra predčítava, takže dieťa nemusí vedieť čítať.

**Hrať:** https://dzizka.github.io/autickove-mesto/

## Verzia 1 (priečinok `v1/`)

Bez inštalácie a bez kompilácie. Kód je rozdelený do súborov:

```
v1/
├── index.html        # kostra stránky, načíta CSS a skripty v správnom poradí
├── css/              # vzhľad: základ, obrazovky, hry, responzívne úpravy
└── js/
    ├── util.js  data.js  state.js  core.js  actions.js  cheats.js  save-transfer.js  main.js
    ├── render/       # kreslenie áut (z boku a zhora)
    ├── screens/      # obrazovky: mesto, obchod, album, kamaráti, trofeje, prehľad pre rodičov
    └── games/        # každá hra vo vlastnom súbore
```

- **Minihry (12):** Preteky (6 tratí so súpermi, power-upmi a benzínom), Pexeso, Umyváreň, Počítanie, Skladačka, Parkovisko, Omaľovánka, Servis, Bludisko, Písmenká, Hudobná garáž, Križovatka.
- **Mince a levely:** za hry dieťa dostane mince, hviezdy a body. Novými levelmi sa odomykajú hry, budovy, trate a stránky albumu.
- **Obchod:** 12 áut, tuning v 9 kategóriách (farba, vzor, kolesá, krídlo, nálepka, strecha, neón, stopa, klaksón) a vylepšenia.
- **Mesto:** 8 budov, ktoré zarábajú aj keď je hra zatvorená. Živá ulica s autami a obloha podľa dennej doby.
- **Album:** 15 stránok a 135 nálepiek, vylepšovanie dvojitých nálepiek (strieborná, zlatá, dúhová), Mýval Výmenník, bingo, nástenka a sezónne stránky, ktoré sa striedajú každý týždeň.
- **Kamaráti:** 24 kamarátov z vajíčok, levely, vývoj, schopnosti do hier a výpravy.
- **Ďalej:** úlohy, denný darček, trofeje a prehľad pre rodičov.

### Pre rodičov

- **Uloženie postupu:** postup sa ukladá v prehliadači (`localStorage`) pre danú adresu a zariadenie.
- **Prenos postupu:** ⚙️ Nastavenia → 📤 Preniesť postup → skopírovať kód a vložiť ho na inom mieste.
- **Testovacie menu:** podržať ⚙️ 3 sekundy a odpovedať na príklad z násobilky.

## Ako spustiť lokálne

Stačí otvoriť `v1/index.html` v prehliadači alebo spustiť `python3 -m http.server` v koreni repozitára a otvoriť http://localhost:8000/. Písmo sa načítava z Google Fonts. Bez internetu hra použije náhradné písmo.

## Verzia 2 (priečinok `v2/`, rozpracovaná)

Hrá sa na https://dzizka.github.io/autickove-mesto/v2/. Hotové sú **časť 0 (kostra)**, **časť 1 (preteky a štatistiky)** a **časť 2 (korisť a Garáž)**: domovská obrazovka, uloženie postupu, prenos kódom `AM2:`, nastavenia, skryté testovacie menu (podržať ⚙️ 3 sekundy), preteky na 6 tratiach (Mesto, Les, Púšť, Sneh, Noc, Vesmír) s 5 úrovňami, štatistiky auta s viditeľným účinkom, odporúčaná sila 🟢🟡🔴, pódium, truhlica s dielmi po pretekoch a Garáž (porovnanie ⬆⬇, ✨ Najlepšie, rozoberanie na 🔩, vylepšenie do +5, zámok, väčšia taška). Vzhľad, Kamaráti a Omaľovánka zatiaľ ukazujú „ešte sa stavia“.

**Testy:** `cd v2/tests && npm install && npm test` (Node 20+, Playwright stiahne prehliadač cez `npx playwright install chromium`). Obrázky obrazoviek v šírke 390 px a 1280 px sa uložia do `v2/tests/screenshots/`.

## Plán

Verzia 2 bude v priečinku `v2/` ako **nová hra**: preteky s korisťou do áut (ako Diablo), Garáž, tuning vzhľadu, bossovia, kamaráti a nová Omaľovánka s maľovaním podľa čísel. Zadanie je v [DESIGN-v2.md](DESIGN-v2.md).
