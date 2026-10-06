# Autíčkové mesto 2: zadanie

Verzia 2 nadväzuje na verziu 1 (`v1/`). Pridáva **korisť so štatistikami** (diely na auto padajú z pretekov ako v Diable), **novú Omaľovánku** a **prehľadnú štruktúru kódu** rozdelenú do súborov.

---

## 1. Pre koho a čo zachovať

**Hráč:** dieťa okolo 6 rokov, ktoré ešte nevie čítať (alebo len začína).

Z toho vyplýva:
- **Ovládanie:** všetko ide ťuknutím alebo ťahaním prstom. Veľké tlačidlá (aspoň 56 px).
- **Pokyny:** každý pokyn hra predčíta hlasom (rovnako ako vo v1).
- **Bez čísel a textu:** štatistiky, porovnania a vzácnosť sa ukazujú ikonami, farbami, hviezdičkami a šípkami ⬆⬇. Čísla vidí len rodič v Prehľade pre rodičov.
- **Prehra neexistuje:** dieťa vždy niečo dostane. Najľahšiu trať musí vyhrať aj so začiatočným autom.

**Čo dieťa vo v1 bavilo najviac** (podľa rodiča): **preteky, tuning, kamaráti, omaľovánka**. Tieto štyri veci majú vo v2 prednosť.

**Zachovať všetko z v1:** všetkých 12 miniher, mesto, obchod, tuning (vzhľad), album s vylepšovaním nálepiek, Mýval Výmenník, bingo, nástenka, týždenné sezóny, kamaráti z vajíčok s vývojom, schopnosťami a výpravami, úlohy, denný darček, hviezdna truhla, trofeje, prehľad pre rodičov, skryté testovacie menu a prenos postupu. Mechaniky boli dobré, vo v2 sa len prepoja s korisťou a opravia chyby.

---

## 2. Štruktúra kódu

Bez inštalácie a bez kompilácie: čisté HTML, CSS a JavaScript moduly (`<script type="module">`), ktoré GitHub Pages servíruje priamo. Hra je na adrese `/v2/`. Kým nie je hotová, `/` ďalej vedie na `v1/`.

```
v2/
├── index.html              # len kostra: hlavička, <main>, navigácia, načítanie css a js/main.js
├── css/
│   ├── tokens.css          # farby, písma, rozmery (premenné)
│   ├── base.css            # reset, typografia, tlačidlá
│   ├── layout.css          # horná lišta, navigácia, obrazovky
│   ├── components.css      # karty, modálne okná, toasty, progres, čipy
│   └── screens/            # jeden súbor na obrazovku alebo hru (race.css, garage.css, coloring.css…)
├── js/
│   ├── main.js             # štart: načíta uložený stav, spustí router
│   ├── core/
│   │   ├── state.js        # stav hry, uloženie, verzia schémy, migrácie
│   │   ├── save-transfer.js# export/import kódu (AM2:), import kódu z v1 (AM1:)
│   │   ├── router.js       # prepínanie obrazoviek a hier
│   │   ├── events.js       # jednoduché udalosti (gameFinished, itemDropped…)
│   │   ├── audio.js        # zvuky, klaksóny, hlas (speechSynthesis)
│   │   ├── loop.js         # herná slučka s ochranou proti pádu (pozri bod 3)
│   │   ├── rng.js          # náhoda (dá sa nastaviť semienko kvôli testom)
│   │   └── ui.js           # modal, toast, letiace mince, konfety
│   ├── data/               # LEN DÁTA, žiadna logika
│   │   ├── cars.js  tuning.js  tracks.js  bosses.js
│   │   ├── loot-bases.js  affixes.js  legendaries.js  sets.js
│   │   ├── buildings.js  stickers.js  crew.js  trophies.js
│   │   └── coloring/       # obrázky na voľné maľovanie a podľa čísel
│   ├── systems/            # logika bez kreslenia
│   │   ├── economy.js  levels.js  quests.js  trophies.js
│   │   ├── loot.js         # generovanie dielov, vzácnosť, sila
│   │   ├── garage.js       # nasadenie, porovnanie, rozoberanie, vylepšenie
│   │   ├── stats.js        # súčet štatistík auta (diely + sety + kamarát)
│   │   ├── crew.js  album.js  city.js  expeditions.js
│   ├── render/
│   │   ├── car-side.js     # auto z boku (SVG)
│   │   └── car-top.js      # auto zhora (canvas)
│   ├── screens/            # obrazovky: home.js garage.js shop.js city.js album.js crew.js parents.js
│   └── games/              # jedna hra = jeden súbor
│       ├── race/           # preteky sú veľké, preto majú priečinok
│       │   ├── index.js  track.js  spawner.js  physics.js  draw.js  hud.js
│       ├── pexeso.js  wash.js  count.js  puzzle.js  park.js
│       ├── coloring/       # index.js  free-paint.js  by-number.js  brush.js
│       ├── repair.js  maze.js  letters.js  music.js  traffic.js
└── tests/                  # Playwright testy (pozri bod 9)
```

**Pravidlá:**
- **Veľkosť súborov:** žiadny súbor nemá viac ako ~400 riadkov. Väčší sa rozdelí.
- **Dáta oddelene od logiky:** nové auto, diel alebo obrázok sa pridá len úpravou súboru v `data/`.
- **Rovnaké rozhranie hier:** každá hra exportuje `{ id, title, icon, unlockLevel, start(view, ctx), stop() }` a končí volaním `ctx.finish({ coins, stars, xp, loot?, extra? })`. Hra sama nerozdáva odmeny.
- **Bez globálnych premenných:** okrem jedného `window.__game` na testy.
- **Uloženie:** `localStorage` kľúč `autickove-mesto-v2`. Stav má `version`. Každá zmena schémy má migráciu v `state.js`.
- **Prenos z v1:** v2 vie načítať kód `AM1:` z v1 a previesť mince, level, autá, tuning, kamarátov, nálepky, mesto aj nástenku. Za pôvodné autá dieťa dostane začiatočné diely.
- **Jazyk:** texty sú po slovensky, priamo pri obrazovke alebo v dátach. Kód a komentáre sú po anglicky.

---

## 3. Chyby z v1, ktoré treba opraviť (a vyskúšať testom)

| Chyba | Príčina | Oprava vo v2 |
|---|---|---|
| **Nočná trať zamrzne** | Nočná tma kreslí žiaru okolo mincí podľa ich polohy na obrazovke. Mince, ktoré ešte neboli vykreslené (napr. z „mincového dažďa“), polohu nemajú, výpočet dostane `NaN` a kreslenie hodí chybu. Herná slučka sa zastaví, obraz zamrzne. | Každý objekt dostane polohu hneď pri vzniku. Plus ochrana slučky (nižšie). |
| **Dúhový neón zhodí preteky** (na každej trati) | Farba žiary sa pre dúhový neón niekedy nevypočíta (`undefined`). | Farby neónu sa počítajú jednou funkciou s náhradnou farbou. Test pretekov pre každý neón. |
| **V bludisku sa nedajú zobrať niektoré mince** (~35 % bludísk) | Domček je v rohu a bludisko cezeň často vedie ďalej. Mince za domčekom sa dajú zobrať len cez domček, ale vstupom do domčeka hra skončí. | Mince sa kladú len na políčka dosiahnuteľné bez prechodu domčekom. Alebo je domček vždy slepá ulička. Test vygeneruje 1 000 bludísk a overí to. |

**Ochrana hernej slučky (`core/loop.js`):** jedna chyba v jednom snímku nesmie zamraziť hru. Slučka chybu zachytí, zapíše do konzoly, vynechá snímok a pokračuje. Ak sa chyba opakuje viac ako 30× za sebou, ukáže sa priateľské okno „Ups, auto sa zaseklo“ s tlačidlom Domov a mince za doterajšiu jazdu sa pripíšu.

---

## 4. Hlavná novinka: korisť do áut

### 4.1 Dva druhy úprav auta

- **Vzhľad (tuning z v1):** farba, vzor, kolesá, krídlo, nálepka, strecha, neón, stopa, klaksón. Kupuje sa za mince ako doteraz a **nemá štatistiky**. Dieťa si vždy môže nechať auto, ktoré sa mu páči.
- **Diely (nové):** padajú z pretekov a majú štatistiky. Nemenia vzhľad auta, ukážu sa len malým znakom (napr. iskra pri legendárnom motore).

### 4.2 Sloty a štatistiky

Auto má 6 slotov. Každý slot má hlavnú štatistiku a 0 až 3 vedľajšie.

| Slot | Ikona | Hlavná štatistika | Čo robí v pretekoch |
|---|---|---|---|
| Motor | 🔥 | ⚡ Rýchlosť | vyššia maximálna rýchlosť, skôr v cieli |
| Pneumatiky | 🛞 | 🌀 Ovládanie | rýchlejší prechod medzi pruhmi, menej šmýka na snehu |
| Nárazník | 🛡️ | 🛡️ Odolnosť | štíty na štarte, kratšie spomalenie po náraze |
| Nádrž | ⛽ | ⛽ Benzín | benzín vydrží dlhšie |
| Magnet | 🧲 | 🧲 Magnet | priťahuje mince zo vzdialenejších pruhov |
| Maskot na palubovke | 🧸 | 🍀 Šťastie | častejšie a vzácnejšie diely |

**Zobrazenie:** každá štatistika je ikona s 1 až 5 farebnými dielikmi na pruhu, nie číslo. **Sila auta** je jedno veľké číslo s farebným odznakom (súčet všetkého). Dieťa vďaka tomu vidí, či je väčšia alebo menšia, a trate majú odporúčanú silu: 🟢 zvládneš, 🟡 bude ťažké, 🔴 ešte nie.

**Štatistiky musia byť cítiť.** Preteky sa upravia tak, aby každá štatistika mala viditeľný účinok:
- Rýchlosť rozhoduje, či dieťa súperov predbehne.
- Ovládanie mení, ako rýchlo auto prejde do vedľajšieho pruhu.
- Odolnosť ukazuje štíty okolo auta.

### 4.3 Vzácnosť

| Vzácnosť | Farba | Vedľajšie štatistiky | Poznámka |
|---|---|---|---|
| Obyčajný | sivá | 0 | |
| Dobrý | zelená | 1 | |
| Vzácny | modrá | 2 | |
| Epický | fialová | 3 | |
| Legendárny | oranžová, svieti | 2 + **zvláštna schopnosť** | |

**Legendárne schopnosti** sú jednoduché a viditeľné, okolo 12 kusov. Príklady:
- **Duch:** prvý náraz v pretekoch auto prejde cez prekážku.
- **Hviezdne turbo:** každá zobratá ⭐ dá krátke turbo.
- **Mincový dážď:** každých 20 sekúnd prší mince.
- **Pružiny:** auto samo preskočí každú piatu prekážku.
- **Ľadový štít:** na snehu auto nešmýka vôbec.
- **Svetlomet:** v noci svieti dvakrát ďalej.

Každá schopnosť má vlastný zvuk a efekt, aby ju dieťa spoznalo.

### 4.4 Odkiaľ diely padajú

- **Koniec pretekov:** truhlica, ktorá sa otvorí s animáciou. 1. miesto dá 3 diely, 2. miesto 2, 3. a 4. miesto 1. Vzácnosť závisí od úrovne trate a od šťastia.
- **Úrovne trate:** každá trať má úrovne 1 až 5 (ako úrovne sveta v Diable). Úroveň sa odomkne víťazstvom na nižšej. Vyššia úroveň znamená rýchlejších súperov a lepšie diely. Odporúčaná sila je pri každej úrovni.
- **Bossovia:** každá trať má svojho bossa, napríklad Kráľ ciest (Mesto), Medveď Drevorubač (Les), Škorpión (Púšť), Snežný Yeti (Sneh), Netopier (Noc) a Ufo (Vesmír). Boss príde po naplnení „pruhu výziev“ (3 preteky na trati). Je väčší, má vlastnú hudbu a niečo hádže na cestu. Výhra nad bossom dá istý epický diel a malú šancu na legendárny.
- **Ostatné hry:** 3 hviezdy v ľubovoľnej minihre dajú malú šancu na diel. Výpravy kamarátov môžu doniesť diel.

### 4.5 Garáž (nová obrazovka)

- **Auto a sloty:** veľké auto a okolo neho 6 slotov.
- **Inventár:** 30 dielov, rozšíriteľný za mince do 60.
- **Porovnanie:** pri každom diele je zelená ⬆ alebo červená ⬇ oproti tomu, čo je namontované, a pri ťuknutí sa ukážu pruhy štatistík vedľa seba.
- **Nové diely:** majú značku „NOVÉ“, kým ich dieťa neotvorí.
- **Tlačidlo ✨ Najlepšie:** namontuje najsilnejšie diely jedným ťuknutím.
- **Rozobrať:** diel sa zmení na súčiastky 🔩. Je aj tlačidlo „Rozobrať všetko sivé a zelené“, ktoré sa pred použitím opýta.
- **Vylepšiť:** za súčiastky a mince sa diel vylepší z +1 až na +5. Každé vylepšenie mierne zvýši štatistiky a pribudne hviezdička.
- **Zamknúť 🔒:** zamknutý diel sa omylom nerozoberie.

### 4.6 Sety

Sú 4 sety po 3 dieloch: **Policajný, Hasičský, Vesmírny, Džungľa**. Pri 2 dieloch zo setu sa zapne malý bonus, pri 3 veľký bonus a zvláštny vzhľad (napr. siréna na streche, plamene za autom). V Garáži je kniha setov, kde sa nájdené diely odfarbia.

### 4.7 Prepojenie s ostatnými časťami hry

- **Kamaráti:** schopnosti kamarátov sa rozšíria o štatistiky (napr. Líška +🍀, Zajac +🌀).
- **Úlohy a bingo:** pribudnú úlohy ako „rozober 3 diely“, „vyhraj nad bossom“ a „nájdi modrý diel“.
- **Trofeje:** pribudnú za prvý legendárny diel, celý set, všetkých bossov a vylepšenie +5.
- **Mýval Výmenník:** pribudne ponuka súčiastky ⇄ dvojité nálepky.

### 4.8 Vyváženie

- **Začiatok:** začiatočné auto má sivé diely v každom slote. Prvý zelený a modrý diel padne isto počas prvých 3 pretekov.
- **Postup:** približne 10 hodín hrania od prvého epického dielu po kompletný set a 5. úroveň tratí. Legendárne diely sú vzácne, ale do 2 až 3 hodín hrania dieťa nejaký isto uvidí. Zaručí to „počítadlo smoly“, ktoré po každých pretekoch bez legendárneho dielu zvýši šancu naň.
- **Bez frustrácie:** preteky sa nedajú prehrať. Aj 4. miesto dá diel a mince.

---

## 5. Preteky vo v2

Zachovať všetko z v1: 6 tratí, súperov, premávku, zvieratká, power-upy, rampy, benzín, počasie a stopy. K tomu:
- **Štatistiky:** zapojiť do fyziky podľa bodu 4.2.
- **Úrovne a bossovia:** úrovne 1 až 5 a boss na každej trati.
- **Výber trate:** odporúčaná sila 🟢🟡🔴, medaily za každú úroveň a pruh výziev k bossovi.
- **Rozdelenie kódu:** `track.js` (vzhľad trate), `spawner.js` (čo sa objaví na ceste), `physics.js` (pohyb, zrážky), `draw.js`, `hud.js`. Každý objekt na ceste má pri vzniku všetky súradnice (oprava chyby z bodu 3).
- **Výkon:** preteky musia ísť plynulo na staršom tablete. Svetlá v noci sa kreslia na zmenšenom plátne.

---

## 6. Omaľovánka vo v2

Dieťa ju má rado, ale vo v1 mala len 3 obrázky. Vo v2 bude mať dva režimy a tri nástroje.

### 6.1 Režim „Voľné maľovanie“
- **Obrázky:** aspoň **24** v 6 témach (Autá, Zvieratá, Kamaráti z hry, Vesmír, Rozprávky, Mesto). 6 je hneď, ďalšie sa odomykajú levelom a za mince.
- **Kreslenie:** obrázky sú SVG s uzavretými plochami a vedierko vyfarbí plochu.

### 6.2 Režim „Maľovanie podľa čísel“ (pixelové obrázky)
- **Mriežka:** obrázok je mriežka štvorčekov (pixel art). V každom štvorčeku je číslo a dole je paleta s číslami, kde každé číslo má svoju farbu.
- **Veľkosti:** 10×10 (ľahké, 3 až 4 farby), 16×16 (stredné, 5 až 6 farieb) a 24×24 (ťažké, 7 až 9 farieb). Aspoň **30 obrázkov**: autá, kamaráti, zvieratká, jedlo, vesmír.
- **Maľovanie:** dieťa vyberie číslo v palete a ťuká alebo ťahá prstom po štvorčekoch.
  - Správny štvorček sa vyfarbí.
  - Nesprávny sa nevyfarbí, jemne zabliká a pri vybranom čísle sa rozsvietia všetky jeho štvorčeky ako nápoveda.
  - Pri vybranom čísle sa jeho štvorčeky zvýraznia, aby ich dieťa našlo.
- **Priebeh:** pri čísle je hotovo ✔, keď sú všetky jeho štvorčeky vyfarbené. Pruh ukazuje, koľko obrázka je hotové.
- **Koniec:** po dokončení čísla zmiznú a ukáže sa celý obrázok s animáciou.
- **Pomôcky:** približovanie dvoma prstami alebo tlačidlami + a −, aby sa dalo trafiť aj na 24×24.

### 6.3 Nástroje (v oboch režimoch)
- **🪣 Vedierko:** vyfarbí celú plochu (vo voľnom režime) alebo štvorček (v režime podľa čísel).
- **🖌️ Štetec:** voľné kreslenie prstom v 3 hrúbkach. **Kreslí cez vyfarbené plochy**, takže dieťa môže dokresliť detaily ako oči, vzory či tiene. Štetec je na samostatnej vrstve nad vedierkom.
- **🧽 Guma:** maže len ťahy štetcom.
- **↩️ Späť:** vráti posledných 20 krokov.
- **Paleta:** 16 farieb plus 4 špeciálne „trblietavé“ farby (zlatá, strieborná, dúhová, galaxia), ktoré sa odomknú.

### 6.4 Galéria a odmeny
- **Galéria:** hotové obrázky (vrstva vedierka aj štetca spolu) sa uložia do Galérie v Albume, najviac 40. Ukladajú sa ako malý obrázok, aby nezaplnili pamäť prehliadača.
- **Nástenka:** obrázok z galérie sa dá dať na Nástenku.
- **Odmena:** závisí od veľkosti obrázka. Režim podľa čísel má aj trofeje (prvý 24×24, 10 obrázkov a pod.).

---

## 7. Grafika

- **Štýl:** ostáva rovnaký ako vo v1 (jasné farby, okrúhle tvary, písmo Baloo 2).
- **Garáž:** nová obrazovka v štýle „dielne“, auto na zdviháku a sloty okolo.
- **Truhlica s korisťou:** truhlica sa trasie, otvorí sa a diely vyletia jeden po druhom so svetlom vo farbe vzácnosti. Legendárny diel má lúč svetla a vlastný zvuk.
- **Ikony dielov:** kreslené SVG (motor, pneumatika, nárazník, nádrž, magnet, maskot) zafarbené podľa vzácnosti, nie emoji.

---

## 8. Postup po častiach

Každá časť sa po dokončení nahrá na GitHub a dá sa hneď hrať na `/v2/`.

| Časť | Obsah | Hotovo, keď |
|---|---|---|
| **0. Kostra a prenos v1** | Štruktúra podľa bodu 2, stav, uloženie, router, UI. Prenos všetkých hier a obrazoviek z v1 bez nových funkcií. Oprava 3 chýb z bodu 3, ochrana slučky, import kódu `AM1:`. | v2 sa hrá rovnako ako v1, testy prejdú, postup z v1 sa dá preniesť |
| **1. Štatistiky a nové preteky** | Štatistiky auta, ich účinok v pretekoch, úrovne tratí, odporúčaná sila | rozdiel medzi slabým a silným autom je v pretekoch jasne viditeľný |
| **2. Korisť a Garáž** | Padanie dielov, truhlica, Garáž, porovnanie, Najlepšie, rozoberanie, vylepšovanie | dieťa vie bez čítania nájsť lepší diel a namontovať ho |
| **3. Legendárne diely, sety, bossovia** | 12 legendárnych schopností, 4 sety, 6 bossov, nové trofeje a úlohy | každý boss sa dá poraziť a dá istý epický diel |
| **4. Omaľovánka 2** | Oba režimy, nástroje, 24 + 30 obrázkov, galéria | obrázok podľa čísel 24×24 sa dá dokončiť na telefóne |
| **5. Doladenie** | Vyváženie, výkon na tablete, prehľad pre rodičov s novými údajmi; potom `/` vedie na `v2/` | rodič s dieťaťom odsúhlasí, že v2 nahradí v1 |

---

## 9. Testovanie

- **Playwright testy** v `v2/tests/` (spúšťajú sa cez malý lokálny server):
  - **Každá hra:** spustiť, vrátiť sa do menu, dohrať a overiť, že sa ukáže výsledok.
  - **Preteky:** každá trať × úroveň × niekoľko kombinácií tuningu (všetky neóny, stopy, legendárne schopnosti) a 60 sekúnd jazdy s náhodným ovládaním. **Žiadna chyba v konzole.**
  - **Bludisko:** 1 000 vygenerovaných bludísk, všetky mince musia byť dosiahnuteľné.
  - **Korisť:** 10 000 vygenerovaných dielov, rozloženie vzácnosti podľa tabuľky a žiadny diel bez hlavnej štatistiky.
  - **Uloženie:** export, import, migrácia z v1 a migrácia medzi verziami schémy.
  - **Omaľovánka:** dokončiť obrázok podľa čísel automaticky a overiť odmenu a galériu.
- **Zobrazenie:** každá obrazovka sa skontroluje v šírke telefónu (390 px) aj počítača (1280 px).

---

## 10. Ako začať v novom chate

Napíš do nového chatu:

> Pracujeme na hre Autíčkové mesto v repozitári dzizka/autickove-mesto. Prečítaj si DESIGN-v2.md a CLAUDE.md a začni časťou 0.
