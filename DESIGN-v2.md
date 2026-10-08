# Autíčkové mesto 2: zadanie

Verzia 2 je **nová hra**, ktorá sa stavia od začiatku. Z verzie 1 (`v1/`) nič nepreberá, okrem skúseností. Verzia 1 ostáva hrateľná samostatne na `/v1/`.

V jadre je **akčná hra s autami a korisťou** (ako Diablo): dieťa jazdí preteky, z pretekov padajú diely na auto so štatistikami a auto je čoraz silnejšie. Okolo toho sú **tuning vzhľadu**, **kamaráti** a **Omaľovánka**.

---

## 1. Pre koho a z čoho vychádzame

**Hráč:** dieťa okolo 6 rokov, ktoré ešte nevie čítať (alebo len začína).

Z toho vyplýva:
- **Ovládanie:** všetko ide ťuknutím alebo ťahaním prstom. Veľké tlačidlá (aspoň 56 px).
- **Pokyny:** každý pokyn hra predčíta hlasom.
- **Bez textu:** vzácnosť a porovnania sa ukazujú ikonami, farbami, hviezdičkami a šípkami ⬆⬇. **Čísla len pri štatistikách** (rozhodnutie rodiča po skúšaní, bod 4.3): sila dielu a hodnoty štatistík sú malé čísla, vždy so šípkou alebo farbou, takže sa dajú porovnať aj bez čítania.
- **Prehra neexistuje:** dieťa vždy niečo dostane. Najľahšiu trať musí vyhrať aj so začiatočným autom.

**Čo dieťa vo v1 bavilo najviac** (podľa rodiča): **preteky, tuning, kamaráti, omaľovánka**. Verzia 2 je postavená na týchto štyroch pilieroch.

**Čo sa z v1 osvedčilo a čo dodržať:**
- jasné farby a hlasové pokyny,
- odmena po každej hre (mince, truhla),
- veľa vecí na zbieranie a vylepšovanie,
- skryté testovacie menu pre rodiča,
- prenos postupu kódom medzi zariadeniami.

Iné hry a systémy z v1 (mesto, album, minihry…) pôvodne do v2 nepatrili. **Po skúšaní v2 rodič rozhodol:** dieťa vo v1 hralo všetko a v2 vznikla hlavne preto, aby sa hra dala ľahšie opravovať a vylepšovať. Preto do v2 postupne prídu **všetky aktivity z v1** (body 12 a 13, časti 10 až 12). Kód ani obsah sa z v1 nekopíruje, každá aktivita sa napíše nanovo podľa pravidiel v2.

---

## 2. Štruktúra kódu

Bez inštalácie a bez kompilácie: čisté HTML, CSS a JavaScript moduly (`<script type="module">`), ktoré GitHub Pages servíruje priamo. Knižnice sú povolené (rodič ich pôvodne nechcel, lebo plánoval hru v jednom súbore; na GitHube to už neplatí). Ukladajú sa priamo do `v2/vendor/` aj s licenciou, nič sa nesťahuje z cudzích serverov. Modely áut sú z balíka Kenney Car Kit (CC0) v `v2/models/`. Hra je na adrese `/v2/`. Kým nie je hotová, `/` ďalej vedie na `v1/`.

```
v2/
├── index.html              # len kostra: hlavička, <main>, navigácia, načítanie css a js/main.js
├── css/
│   ├── tokens.css          # farby, písma, rozmery (premenné)
│   ├── base.css            # reset, typografia, tlačidlá
│   ├── layout.css          # horná lišta, navigácia, obrazovky
│   ├── components.css      # karty, modálne okná, toasty, progres, čipy
│   └── screens/            # jeden súbor na obrazovku (race.css, garage.css, coloring.css…)
├── js/
│   ├── main.js             # štart: načíta uložený stav, spustí router
│   ├── core/
│   │   ├── state.js        # stav hry, uloženie, verzia schémy, migrácie
│   │   ├── save-transfer.js# export/import kódu (AM2:)
│   │   ├── router.js       # prepínanie obrazoviek
│   │   ├── events.js       # jednoduché udalosti (raceFinished, itemDropped…)
│   │   ├── audio.js        # zvuky, klaksóny, hlas (speechSynthesis)
│   │   ├── loop.js         # herná slučka s ochranou proti pádu (bod 3)
│   │   ├── rng.js          # náhoda (dá sa nastaviť semienko kvôli testom)
│   │   └── ui.js           # modal, toast, letiace mince, konfety
│   ├── data/               # LEN DÁTA, žiadna logika
│   │   ├── menu.js         # štyri piliere hry (tlačidlá Domov a navigácie)
│   │   ├── stats.js        # štatistiky, sloty, začiatočné auto, účinky štatistík v pretekoch
│   │   ├── cars.js  tuning.js  tracks.js  bosses.js
│   │   ├── loot-bases.js  affixes.js  legendaries.js  sets.js
│   │   ├── crew.js  trophies.js  quests.js
│   │   ├── city.js  album.js  # mesto (budovy), album (stránky nálepiek), denný darček
│   │   ├── minigames.js    # hry v herni: zoznam, obtiažnosti, obrázky pexesa, poruchy v servise, farby parkoviska
│   │   └── coloring/       # palette.js, free.js (24 obrázkov SVG), pixel.js (30 obrázkov podľa čísel)
│   ├── systems/            # logika bez kreslenia
│   │   ├── economy.js  progress.js  quests.js  trophies.js   # progress.js: level, čas hrania, postup na tratiach, bossovia
│   │   ├── loot.js         # generovanie dielov, vzácnosť, sila
│   │   ├── garage.js       # nasadenie, porovnanie, rozoberanie, vylepšenie
│   │   ├── stats.js        # súčet štatistík auta (diely + sety + kamarát)
│   │   ├── tuning.js       # vzhľad: vlastnené veci, kúpa, náhodný vzhľad
│   │   ├── coloring.js     # omaľovánka: pixelové obrázky z tvarov, odomykanie, galéria, odmeny
│   │   ├── crew.js         # kamaráti: vajíčka, levely, vývoj
│   │   ├── minigames.js    # herňa: hviezdy, odmeny, obtiažnosť, ktorá sama rastie
│   │   └── city.js  album.js  daily.js   # nájom a stavby, nálepky, denný darček
│   ├── render/
│   │   ├── car-side.js     # auto z boku (SVG)
│   │   ├── car-top.js      # auto zhora (canvas): ikony a náhľady
│   │   ├── car-back.js     # auto zozadu (canvas) v pretekoch
│   │   ├── road-sprites.js # kreslené prekážky, krajina, mince a kanistre v pretekoch
│   │   ├── effects.js      # neón a stopa v pretekoch
│   │   ├── car-pics.js     # obrázky 3D auta zboku, zozadu, zhora (vyrobené raz, v pamäti)
│   │   ├── car-view.js     # 3D auto (točňa, zdvihák) a 3D obrázky; bez WebGL ostane 2D auto
│   │   ├── three/          # kit.js (modely) paint.js (farba, vzory) car3d.js (auto s tuningom)
│   │   │                   # stage.js (scéna s autom) snapshot.js (obrázok auta)
│   │   │                   # town.js (mesto zhora: auto, ovládanie, kamera) town-map.js (ulice, pozemky, mince)
│   │   └── emoji.js        # emoji kreslené do malého plátna (rýchle na tablete)
│   ├── screens/            # home.js garage.js tuning.js crew.js gallery.js parents.js
│   │                       # settings.js test-menu.js topbar.js coloring.js (výber obrázka) trophies.js
│   │                       # races.js (výber trate a úrovne), stat-panel.js (pruhy štatistík, sila auta)
│   │                       # part-card.js (karta dielu, detail s porovnaním), chest.js (truhlica po pretekoch)
│   │                       # set-book.js (kniha setov), games.js (🎪 herňa), city.js album.js daily.js
│   │                       # home-road.js (pohyblivá cesta za tlačidlami domova)
│   └── games/
│       ├── demo/           # skúšobná jazda len z testovacieho menu (overuje slučku a odmeny)
│       ├── race/           # index.js  spawner.js  physics.js  hud.js  boss.js  abilities.js (legendárne schopnosti)
│       │                   # road.js (úseky cesty, projekcia, obloha)  scene.js (prekážky, autá, efekty)  weather.js
│       │                   # drive-scene.js (auto na prázdnej ceste)  test-drive.js (🛣️ skúšobná jazda)
│       ├── coloring/       # index.js  free-paint.js  by-number.js  brush.js  tools.js (panel nástrojov)
│       ├── mini/shell.js   # spoločný rám hier v herni: 🏠, hviezdy obtiažnosti, pruh postupu, 🔊, koniec s hviezdami
│       └── pexeso/ wash/ repair/ park/ puzzle/ count/ maze/ letters/ music/ traffic/   # hry z v1 (bod 12)
└── tests/                  # Playwright testy (bod 10): node --test, package.json, helpers.mjs,
                            # progress-sim.mjs (simulácia dlhého hrania na vyváženie)
```

**Pravidlá:**
- **Veľkosť súborov:** žiadny súbor nemá viac ako ~400 riadkov. Väčší sa rozdelí.
- **Dáta oddelene od logiky:** nové auto, diel, trať alebo obrázok sa pridá len úpravou súboru v `data/`.
- **Rovnaké rozhranie hier:** každá hra (preteky, omaľovánka) exportuje `{ id, title, icon, unlockLevel, start(view, ctx), stop() }` a končí volaním `ctx.finish({ coins, xp, loot?, extra? })`. Hra sama nerozdáva odmeny.
- **Bez globálnych premenných:** okrem jedného `window.__game` na testy.
- **Uloženie:** `localStorage` kľúč `autickove-mesto-v2`. Stav má `version`. Každá zmena schémy má migráciu v `state.js`.
- **Jazyk:** texty sú po slovensky, priamo pri obrazovke alebo v dátach. Kód a komentáre sú po anglicky.

---

## 3. Poučenie z chýb v1

Vo v1 sa našli tri chyby (sú opravené vo v1). Vo v2 im treba predísť od začiatku:

| Chyba vo v1 | Príčina | Pravidlo pre v2 |
|---|---|---|
| Nočná trať zamrzla | Objekt na ceste ešte nemal polohu na obrazovke, výpočet svetla dostal `NaN`, kreslenie hodilo chybu a herná slučka sa zastavila. | Každý objekt dostane všetky súradnice hneď pri vzniku. |
| Dúhový neón zhodil preteky | Index farby vyšiel pri nepatrne zápornom čase záporný a farba bola `undefined`. | Farby a indexy cez pomocné funkcie s náhradnou hodnotou. Test pre každý vzhľad auta. |
| V bludisku sa nedali zobrať mince | Mince ležali za cieľom a vstup do cieľa ukončil hru. | Pri generovaných úrovniach vždy overiť, že sa dá všetko dosiahnuť. |

**Ochrana hernej slučky (`core/loop.js`):** jedna chyba v jednom snímku nesmie zamraziť hru. Slučka chybu zachytí, zapíše do konzoly, vynechá snímok a pokračuje. Ak sa chyba opakuje viac ako 30× za sebou, ukáže sa priateľské okno „Ups, auto sa zaseklo“ s tlačidlom Domov a mince za doterajšiu jazdu sa pripíšu. (Vo v1 je to už takto doplnené.)

---

## 4. Hlavná hra: preteky s korisťou

### 4.1 Preteky

- **Ovládanie:** auto ide samo dopredu a dieťa ťukaním na ľavú alebo pravú polovicu obrazovky mení pruhy.
- **Pohľad (od časti 9):** zozadu v pseudo 3D, ako v náhľade `/v2/preview/pseudo3d.html`, ktorý rodič odsúhlasil. Cesta ubieha do diaľky, má zákruty a kopce, na obzore je krajina trate. Zákruty a kopce sú len na pohľad, fyzika ostáva rovná (pruhy a vzdialenosť), takže vyváženie sa nemení.
- **Na ceste:** súperi, premávka, prekážky, mince, power-upy, rampy a benzín. Súperi nie sú pevná prekážka: keď ich dieťa dobieha v rovnakom pruhu, uhnú mu (narážanie do nich len hnevalo).
- **Trate:** 6 tratí s vlastným vzhľadom a počasím: Mesto, Les, Púšť, Sneh, Noc a Vesmír.
- **Úrovne trate:** každá trať má úrovne 1 až 5 (ako úrovne sveta v Diable). Úroveň sa odomkne víťazstvom na nižšej. Vyššia úroveň znamená rýchlejších súperov, viac prekážok a lepšie diely.
- **Výber trate:** pri každej úrovni je odporúčaná sila auta 🟢 zvládneš, 🟡 bude ťažké, 🔴 ešte nie. Ďalej sú tam medaily a pruh výziev k bossovi.
- **Koniec pretekov:** pódium s umiestnením a truhlica s korisťou (bod 4.5).
- **Výkon:** preteky musia ísť plynulo na staršom tablete. Obloha a kopce na obzore sa nakreslia raz do pomocného plátna a potom sa len posúvajú.
- **Rýchlosť na obrazovke má strop** (po skúšaní: s vylepšeným autom sa nedalo uhýbať). Auto sa na obrazovke pohybuje najviac `RACE.visibleCap` × základná rýchlosť. Silnejšie auto preteky spomalí ako spomalený film, takže súperi aj tak zaostávajú, ale prekážky prichádzajú tempom, na ktoré dieťa stihne zareagovať. Prekážka je jasne viditeľná (hmla menej ako polovičná) aspoň **1 sekundu** pred autom, aj v noci. Stráži to test.
- **Každá trať je iná** (časť 9):

  | Trať | Pruhy | Cesta | Prekážky | Krajina |
  |---|---|---|---|---|
  | Mesto | 3 | mierne zákruty, rovina | kužele, zábrany, debny | domy, stromy, lampy, mrakodrapy na obzore |
  | Les | 2 | lesná cesta, veľa zákrut, pahorky | kmene, kamene, pne | stromy, smreky, huby, zelené kopce |
  | Púšť | 4 | dlhé rovinky cez duny | kaktusy, kamene, guľatý bodliak | kaktusy, skaly, slnko, duny |
  | Sneh | 3 | horské zákruty a kopce | snehuliaci, ľadové kocky, snehové gule | smreky so snehom, hory, sneženie |
  | Noc | 3 | mesto v noci | kužele, zábrany, sudy | lampy so svetlom, okná svietia, mesiac, hviezdy |
  | Vesmír | 5 | veľké vlny hore a dole | asteroidy, satelity, kryštály | planéty, neónové kryštály, hviezdy |

  - Na trati s viacerými pruhmi je viac prekážok a premávky, aby bola rovnako hustá. Vždy ostane aspoň jeden voľný pruh.
  - V noci je hmla tmavá a cestu osvetľujú svetlá auta. Legendárny Svetlomet posunie hmlu ďalej.
  - Prekážky, mince, kanistre, rampy a autá sú kreslené vlastnými tvarmi, nie emoji. Emoji ostávajú pri ikonách power-upov, kamarátov a bossov.
  - Auto hráča je vidieť zozadu so všetkým, čo dieťa kúpilo: druh auta, farba, vzor, kolesá, krídlo, nálepka, vec na streche, neón a stopa.

### 4.2 Dva druhy úprav auta

- **Diely:** padajú z pretekov a majú štatistiky. Nemenia vzhľad auta, ukážu sa len malým znakom (napr. iskra pri legendárnom motore).
- **Vzhľad (tuning):** farba, vzor, kolesá, krídlo, nálepky, strecha, neón, stopa, klaksón. Kupuje sa za mince a **nemá štatistiky**. Dieťa si vždy môže nechať auto, ktoré sa mu páči (bod 5).

### 4.3 Sloty a štatistiky

Auto má 6 slotov. Každý slot má hlavnú štatistiku a 0 až 3 vedľajšie.

| Slot | Ikona | Hlavná štatistika | Čo robí v pretekoch |
|---|---|---|---|
| Motor | 🔥 | ⚡ Rýchlosť | vyššia maximálna rýchlosť, skôr v cieli |
| Pneumatiky | 🛞 | 🌀 Ovládanie | rýchlejší prechod medzi pruhmi, menej šmýka na snehu |
| Nárazník | 🛡️ | 🛡️ Odolnosť | štíty na štarte, kratšie spomalenie po náraze |
| Nádrž | ⛽ | ⛽ Benzín | benzín vydrží dlhšie |
| Magnet | 🧲 | 🧲 Magnet | priťahuje mince zo vzdialenejších pruhov |
| Maskot na palubovke | 🧸 | 🍀 Šťastie | častejšie a vzácnejšie diely |

**Zobrazenie** (po skúšaní zmenené z 5 dielikov na kombináciu čísel a šípok):
- **Karta dielu:** sila dielu ako jedno malé číslo a zelená ⬆ alebo červená ⬇ oproti namontovanému dielu.
- **Detail dielu:** pri každej ikone štatistiky je číslo a pruh. Pri porovnaní je vedľa rozdiel **+6** zelenou alebo **−3** červenou, aj pri celkovej sile dielu.
- **Auto:** každá štatistika je ikona, číslo a súvislý pruh (plný pri 150).
- **Sila auta** je jedno veľké číslo s farebným odznakom (súčet všetkého).

**Štatistiky musia byť cítiť.** Každá má viditeľný účinok:
- Rýchlosť rozhoduje, či dieťa súperov predbehne.
- Ovládanie mení, ako rýchlo auto prejde do vedľajšieho pruhu.
- Odolnosť ukazuje štíty okolo auta.

### 4.4 Vzácnosť

| Vzácnosť | Farba | Vedľajšie štatistiky |
|---|---|---|
| Obyčajný | sivá | 0 |
| Dobrý | zelená | 1 |
| Vzácny | modrá | 2 |
| Epický | fialová | 3 |
| Legendárny | oranžová, svieti | 2 + **zvláštna schopnosť** |

**Legendárne schopnosti** sú jednoduché a viditeľné, okolo 12 kusov. Príklady:
- **Duch:** prvý náraz v pretekoch auto prejde cez prekážku.
- **Hviezdne turbo:** každá zobratá ⭐ dá krátke turbo.
- **Mincový dážď:** každých 20 sekúnd prší mince.
- **Pružiny:** auto samo preskočí každú piatu prekážku.
- **Ľadový štít:** na snehu auto nešmýka vôbec.
- **Svetlomet:** v noci svieti dvakrát ďalej.

Každá schopnosť má vlastný zvuk a efekt, aby ju dieťa spoznalo.

### 4.5 Odkiaľ diely padajú

- **Koniec pretekov:** truhlica, ktorá sa otvorí s animáciou. **Otvára ju dieťa ťuknutím.** Truhlica sa kýve a svieti, po 5 sekundách hlas pripomenie „Ťukni na truhlicu!“ a sama sa otvorí až po 12 sekundách (keď dieťa odišlo). 1. miesto dá 3 diely, 2. miesto 2, 3. a 4. miesto 1. Vzácnosť závisí od úrovne trate a od šťastia.
- **Bossovia:** každá trať má svojho bossa: Kráľ ciest (Mesto), Medveď Drevorubač (Les), Škorpión (Púšť), Snežný Yeti (Sneh), Netopier (Noc) a Ufo (Vesmír). Boss príde po naplnení „pruhu výziev“ (3 preteky na trati). Je väčší, má vlastnú hudbu a niečo hádže na cestu. Výhra nad ním dá istý epický diel, malú šancu na legendárny a vajíčko s kamarátom (bod 6).
- **Boss podrobnejšie:** pred dopadom hodenej veci svieti na ceste červený terč a vždy ostane voľný pruh. Boss je o niečo pomalší než najrýchlejší súper úrovne, aby ho auto s 🟢 isto porazilo. Po výhre sa pruh výziev vyprázdni a k istému dielu pribudnú 2 obyčajné diely. Prehra nič nezoberie: dieťa dostane mince a diel a pruh ostane plný na ďalší pokus.

### 4.6 Garáž

- **Auto a sloty:** veľké auto na zdviháku a okolo neho 6 slotov.
- **Inventár:** 30 dielov, rozšíriteľný za mince do 60.
- **Porovnanie:** pri každom diele je zelená ⬆ alebo červená ⬇ oproti tomu, čo je namontované, a pri ťuknutí sa ukážu pruhy štatistík vedľa seba.
- **Nové diely:** majú značku „NOVÉ“, kým ich dieťa neotvorí.
- **Tlačidlo ✨ Najlepšie:** namontuje najsilnejšie diely jedným ťuknutím.
- **Rozobrať:** diel sa zmení na súčiastky 🔩. Je aj tlačidlo „Rozobrať všetko sivé a zelené“, ktoré sa pred použitím opýta.
- **Vylepšiť:** za súčiastky a mince sa diel vylepší z +1 až na +5. Každé vylepšenie mierne zvýši štatistiky a pribudne hviezdička.
- **Zamknúť 🔒:** zamknutý diel sa omylom nerozoberie.
- **Zložiť ⬇:** namontovaný diel sa dá zložiť do tašky a slot ostane prázdny (aj po načítaní hry). Pri plnej taške to hlas povie. Akýkoľvek diel je lepší ako prázdny slot (⬆).

### 4.7 Sety

Sú 4 sety po 3 dieloch: **Policajný, Hasičský, Vesmírny, Džungľa**. Diel zo setu je epický: padne ako každý tretí epický diel z truhlice (35 %) a ako polovica istých dielov od bossov. Pri 2 dieloch zo setu sa zapne malý bonus, pri 3 veľký bonus a zvláštny vzhľad (napr. siréna na streche, plamene za autom). V Garáži je kniha setov, kde sa nájdené diely odfarbia.

### 4.8 Vyváženie

- **Začiatok:** začiatočné auto má sivé diely v každom slote. Prvý zelený a modrý diel padne isto počas prvých 3 pretekov.
- **Postup:** približne 10 hodín hrania od prvého epického dielu po kompletný set a 5. úroveň tratí. Legendárne diely sú vzácne, ale do 2 až 3 hodín hrania dieťa nejaký isto uvidí. Zaručí to „počítadlo smoly“, ktoré po každých pretekoch bez legendárneho dielu zvýši šancu naň.
- **Bez frustrácie:** preteky sa nedajú prehrať. Aj 4. miesto dá diel a mince.
- **Poistka proti zaseknutiu:** keď dieťa na najnovšej úrovni 6-krát po sebe nevyhrá, súperi na nej spomalia o 1,5 % za každý ďalší pokus, najviac o 12 %. Po víťazstve sa to vráti.
- **Odporúčaná sila** zodpovedá skutočnej rýchlosti súperov: 🟢 znamená, že rovnomerne postavené auto má najvyššiu rýchlosť o 6 % vyššiu než najrýchlejší súper úrovne. 🟡 je od 80 % tejto sily. Hlas pri 🔴 hovorí, že skúsiť sa dá.
- **Namerané v simulácii** (8 simulovaných detí, každé 600 pretekov s chybami ako dieťa, `v2/tests/progress-sim.mjs`):
  - Vesmír 5 sa odomkne medzi 57. a 207. pretekmi (v strede okolo 110).
  - Najdlhší úsek bez novej úrovne je najviac 78 pretekov.
  - Prvý legendárny diel padne do 30 pretekov.
  - Celý set sa nájde medzi 28. a 130. pretekmi.
  - Pri 1,5 až 2 minútach na preteky aj s truhlicou a garážou to je približne 3 až 7 hodín pretekov. Spolu s bossmi, setmi, kamarátmi a omaľovánkou vyjde okolo 10 hodín.
  - Čísla sa dajú doladiť v `data/loot-bases.js` (`partBudgetShare`, `budgetOffset`) a `data/tracks.js` (`ease…`) a overiť simuláciou.

---

## 5. Vzhľad auta (tuning)

- **Autá:** 18 druhov z balíka Kenney Car Kit (osobné, džíp, taxík, dodávka, polícia, športiak, sanitka, hasiči, pikap, smetiari, traktor, pretekár, formula, luxusné auto, kamión, dve motokáry s mimozemšťanom, raketové auto), ktoré sa kupujú za mince (bod 14). Druh auta je len vzhľad, štatistiky dávajú diely.
- **Kategórie vzhľadu:** farba (aj dúhová a galaxia), vzor, kolesá, krídlo, nálepka, strecha, neón, stopa za autom, klaksón. Každá s 5 až 15 možnosťami.
- **Showroom:** auto na otočnej plošine pod reflektorom, tlačidlá 📯 Trúbiť a 🎲 Náhodne.
- **Zobrazenie:** všetko, čo si dieťa kúpi, vidno v pretekoch aj v Garáži.

---

## 6. Kamaráti

Kamarát sedí v aute ako spolujazdec (vidno ho v okne) a pomáha v pretekoch.

- **Získanie:** z vajíčok. Vajíčko padá od bossov a občas z truhlice a vyliahne sa po 3 pretekoch. Zbierka má 20 kamarátov v 4 vzácnostiach. Nechytení sú v zbierke ako šedé tiene.
- **Schopnosť:** každý kamarát má jednu schopnosť v pretekoch, napríklad +⚡, +🍀, viac mincí alebo štít navyše. Silnie s levelom.
- **Level a vývoj:** kamarát rastie jazdením (level 1 až 20) a vyvíja sa až v 3 stupňoch (napr. 🦎→🦕→🦖) za cukríky 🍬. Cukríky sú z dvojitých vajíčok a z rozoberania dielov.
- **Starostlivosť:** pohladkanie a oblečenie (čiapka, okuliare). Bez hladovania a smútenia, aby dieťa nemalo pocit viny.
- **Podrobnosti:**
  - Prvé vajíčko padne isto z truhlice v 3. pretekoch, aby dieťa malo kamaráta skoro. Potom padá z truhlice zriedka (6 %) a isto od bossov. Vajíčko od bossa má menšiu šancu na obyčajného kamaráta.
  - Z vajíčka sa prednostne liahnu kamaráti, ktorých dieťa ešte nemá. Dvojitý kamarát sa zmení na cukríky 🍬.
  - Cukríky sú aj z rozoberania dielov: modrý a lepší diel dá 1 isto, sivý a zelený s 25 % šancou.
  - Vývoj na 2. stupeň je od levelu 7 za 5 🍬, na 3. stupeň od levelu 14 za 15 🍬. Level rastie jazdením kamaráta v aute.
  - Kamarát sa ukazuje v okne auta doma, v Garáži, v showroome, v pretekoch aj na pódiu. Oblečenie sa kupuje za mince a nemá štatistiky.

---

## 7. Omaľovánka

Vo v1 ju malo dieťa rado, ale mala len 3 obrázky. Vo v2 bude mať dva režimy a tri nástroje.

### 7.1 Režim „Voľné maľovanie“
- **Obrázky:** aspoň **24** v 6 témach (Autá, Zvieratá, Kamaráti z hry, Vesmír, Rozprávky, Mesto). 6 je hneď, ďalšie sa odomykajú za preteky a mince.
- **Kreslenie:** obrázky sú SVG s uzavretými plochami a vedierko vyfarbí plochu.

### 7.2 Režim „Maľovanie podľa čísel“ (pixelové obrázky)
- **Mriežka:** obrázok je mriežka štvorčekov (pixel art). V každom štvorčeku je číslo a dole je paleta s číslami, kde každé číslo má svoju farbu.
- **Veľkosti:** 10×10 (ľahké, 3 až 4 farby), 16×16 (stredné, 5 až 6 farieb) a 24×24 (ťažké, 7 až 9 farieb). Aspoň **30 obrázkov**: autá, kamaráti, zvieratká, jedlo, vesmír.
- **Maľovanie:** dieťa vyberie číslo v palete a ťuká alebo ťahá prstom po štvorčekoch.
  - Správny štvorček sa vyfarbí.
  - Nesprávny sa nevyfarbí a jemne zabliká.
  - Štvorčeky vybraného čísla sa zvýraznia, aby ich dieťa našlo.
- **Priebeh:** pri čísle je hotovo ✔, keď sú všetky jeho štvorčeky vyfarbené. Pruh ukazuje, koľko obrázka je hotové.
- **Koniec:** po dokončení čísla zmiznú a ukáže sa celý obrázok s animáciou.
- **Pomôcky:** približovanie dvoma prstami alebo tlačidlami + a −, aby sa dalo trafiť aj na 24×24.

### 7.3 Nástroje (v oboch režimoch)
- **🪣 Vedierko:** vyfarbí celú plochu (vo voľnom režime) alebo štvorček (v režime podľa čísel).
- **🖌️ Štetec:** voľné kreslenie prstom v 3 hrúbkach. **Kreslí cez vyfarbené plochy**, takže dieťa môže dokresliť detaily ako oči, vzory či tiene. Štetec je na samostatnej vrstve nad vedierkom.
- **🧽 Guma:** maže len ťahy štetcom.
- **↩️ Späť:** vráti posledných 20 krokov.
- **Paleta:** 16 farieb plus 4 špeciálne „trblietavé“ farby (zlatá, strieborná, dúhová, galaxia), ktoré sa odomknú.

### 7.4 Galéria a odmeny
- **Galéria:** hotové obrázky (vrstva vedierka aj štetca spolu) sa uložia do Galérie, najviac 40. Ukladajú sa ako malý obrázok, aby nezaplnili pamäť prehliadača.
  - Galéria má vlastný kľúč `autickove-mesto-v2-gallery` a prenos kódom `AM2:` ju neprenáša. Obrázky by kód zväčšili na stovky kB. Pri plnej galérii najstarší obrázok uvoľní miesto a dieťa môže obrázok zmazať 🗑️.
  - Rozpracovaný obrázok podľa čísel sa ukladá (vyfarbené štvorčeky) a v ponuke má pruh postupu, aby sa dal 24×24 dokončiť inokedy. Ťahy štetcom sa do rozpracovaného obrázka neukladajú.
  - Pixelové obrázky sú v dátach zapísané ako jednoduché tvary a mriežka sa z nich vypočíta, nepoužité farby sa vynechajú. Obrázky na voľné maľovanie, ktoré nie sú hneď otvorené, sa odomknú po 2 až 10 pretekoch alebo za 60 až 150 mincí.
- **Odmena:** mince podľa veľkosti obrázka. Občas aj nálepka na auto alebo trblietavá farba. Presne: voľný obrázok 20 🪙, 10×10 15 🪙, 16×16 30 🪙, 24×24 60 🪙; trblietavé farby po 2., 5., 9. a 14. hotovom obrázku; nálepka na auto po 3., 7., 12., 18. a 25. obrázku. Za obrázky sú trofeje (prvý 24×24, 10 obrázkov a pod.).

---

## 8. Okolo hry

- **Domovská obrazovka:** auto dieťaťa s kamarátom, veľké tlačidlá **Preteky**, **Garáž**, **Vzhľad**, **Kamaráti** a **Omaľovánka**.
- **Úlohy:** 3 jednoduché úlohy naraz (napr. „vyhraj preteky“, „rozober 3 diely“, „vymaľuj obrázok“). Za splnenie je odmena.
  - Úlohy sú na domovskej obrazovke pod tlačidlami ako ikona s pruhom. Ťuknutie úlohu prečíta. Splnená úloha sa zmení na 🎁 a ťuknutím sa vyberie odmena (mince, niekedy 🔩 alebo 🍬). Hneď pribudne nová úloha.
  - Úlohy, ktoré by sa nedali splniť (pohladkať kamaráta bez kamaráta, poraziť bossa, keď žiadny nie je pripravený), sa neponúkajú.
- **Trofeje:** za prvý legendárny diel, celý set, všetkých bossov, vylepšenie +5, vyvinutého kamaráta, obrázky a pod.
  - Je ich 23. Poličku trofejí otvára 🏆 na domovskej obrazovke, nezískané trofeje sú šedé tiene a ťuknutie prečíta názov.
  - Nová trofej sa ohlási zvukom, hlasom a bublinou. Trofeje sa dopočítajú aj zo staršieho postupu.
- **Prehľad pre rodičov:** čas hrania za 7 dní, čo dieťa hrá najčastejšie a sila auta. Tu sú aj čísla. Otvára sa v Nastaveniach (👪). Ukazuje stĺpce minút po dňoch, počty hier, štatistiky auta a postup (trate, bossovia, kamaráti, obrázky, trofeje, úlohy).
- **Výkon:** test spomalí procesor 4× vo veľkosti tabletu a s najnáročnejším vzhľadom auta. Na každej trati drží okolo 60 snímok za sekundu a herný kód potrebuje do 2 ms na snímok. Noc sa kreslí na plátne s 1/4 rozlíšením, ktoré ako samostatnú vrstvu zväčšuje grafická karta.
- **Nastavenia:** zvuk, hlas, prenos postupu (kód `AM2:`), začať odznova a skryté testovacie menu (podržať ⚙️ 3 sekundy a vyriešiť príklad).

---

## 9. Postup po častiach

Každá časť sa po dokončení nahrá na GitHub a dá sa hneď hrať na `/v2/`.

| Časť | Obsah | Hotovo, keď |
|---|---|---|
| **0. Kostra** | Štruktúra podľa bodu 2, stav, uloženie, prenos kódu, router, UI, zvuk a hlas, ochrana slučky, domovská obrazovka, nastavenia, testovacie menu, kostra testov | hra sa otvorí na telefóne aj počítači, postup sa uloží a prenesie, testy prejdú |
| **1. Preteky a štatistiky** | Preteky na 6 tratiach s úrovňami, štatistiky auta a ich účinok, odporúčaná sila, pódium | rozdiel medzi slabým a silným autom je v pretekoch jasne viditeľný |
| **2. Korisť a Garáž** | Padanie dielov, truhlica, Garáž, porovnanie, Najlepšie, rozoberanie, vylepšovanie | dieťa vie bez čítania nájsť lepší diel a namontovať ho |
| **3. Vzhľad auta** | Autá, 9 kategórií tuningu, showroom, vzhľad v pretekoch aj v Garáži | všetky kúpené veci vidno v pretekoch |
| **4. Legendárne diely, sety, bossovia** | 12 legendárnych schopností, 4 sety, 6 bossov | každý boss sa dá poraziť a dá istý epický diel |
| **5. Kamaráti** | Vajíčka, zbierka 20 kamarátov, schopnosti, level, vývoj, oblečenie | kamarát vidno v aute a jeho schopnosť je v pretekoch cítiť |
| **6. Omaľovánka** | Oba režimy, nástroje, 24 + 30 obrázkov, galéria | obrázok podľa čísel 24×24 sa dá dokončiť na telefóne |
| **7. Doladenie** | Úlohy, trofeje, prehľad pre rodičov, vyváženie, výkon na tablete; potom `/` vedie na `v2/` | rodič s dieťaťom odsúhlasí, že v2 je hlavná verzia |
| **8. Opravy po skúšaní** | Truhlica čaká na ťuknutie, ⬇ Zložiť diel, strop rýchlosti na obrazovke a dlhší výhľad, štatistiky ako čísla a šípky (body 4.1, 4.3, 4.5, 4.6) | s najsilnejším autom sa dá uhýbať, dieťa vie povedať, ktorý diel je silnejší |
| **9. Rozdielne trate a pseudo 3D** | Pohľad zozadu s perspektívou (náhľad odsúhlasený), zákruty a kopce, pruhy podľa trate (Mesto 3, Les 2, Púšť 4, Sneh 3, Noc 3, Vesmír 5), vlastné prekážky a krajina; vlastné kreslené obrázky namiesto emoji | každá trať vyzerá a jazdí inak |
| **10. Hry 1** | Hlavná ponuka 🎪 Hry a prvé aktivity z v1: Pexeso, Umyváreň, Servis, Parkovisko (bod 12) | dieťa nájde a dohrá každú hru bez čítania |
| **11. Hry 2** | Počítanie, Skladačka, Bludisko, Písmenká, Hudobná garáž, Križovatka (bod 12) | ako pri časti 10 |
| **12. Mesto a album** | Systémy z v1 nanovo: mesto s budovami, album s nálepkami, denný darček (bod 13) | odmeny z hier sa dajú použiť v meste a albume |
| **13. Výber obtiažnosti** | Dieťa si v herni vyberá ★ / ★★ / ★★★, odporúčaný stupeň svieti (bod 12) | dieťa vie bez čítania zvoliť ťažšiu hru |
| **14. Pohyblivé pozadie domova** | Auto dieťaťa jazdí v pseudo 3D za tlačidlami domovskej obrazovky, trate sa striedajú, čas dňa podľa hodín; vypínač pre staršie tablety (bod 14) | domovská obrazovka ide plynulo aj na staršom tablete |
| **15a. 3D auto** | Autá z Kenney Car Kit (nová zostava, raketa → raketové auto v uložení), otočné 3D auto vo Vzhľade a na zdviháku v Garáži, 3D obrázky na dlaždiciach Vzhľadu, 2D auto ako záloha bez WebGL (bod 14) | všetko kúpené vidno na 3D aute; hra ide aj bez WebGL |
| **15b. Obrázky áut všade** | Obrázky toho istého 3D auta zboku, zozadu a zhora všade v hre (domov, preteky, hry, mesto), kužele a krabice ako prekážky, skúšobná jazda vo Vzhľade (bod 14) | auto vyzerá všade rovnako |
| **16. Mesto zhora** | Mesto z City Kit modelov zhora, dieťa jazdí po uliciach a zbiera nájomné (bod 14) | dieťa nájde a vyberie mince samo |

---

## 10. Testovanie

- **Playwright testy** v `v2/tests/` (spúšťajú sa cez malý lokálny server):
  - **Obrazovky:** každá sa otvorí a dá sa z nej vrátiť domov.
  - **Preteky:** každá trať × úroveň × niekoľko kombinácií vzhľadu (všetky neóny, stopy, legendárne schopnosti) a 60 sekúnd jazdy s náhodným ovládaním. **Žiadna chyba v konzole** (ani zachytená ochranou slučky).
  - **Korisť:** 10 000 vygenerovaných dielov, rozloženie vzácnosti podľa tabuľky a žiadny diel bez hlavnej štatistiky.
  - **Uloženie:** export, import a migrácia medzi verziami schémy.
  - **Omaľovánka:** dokončiť obrázok podľa čísel automaticky a overiť odmenu a galériu.
- **Zobrazenie:** každá obrazovka sa skontroluje v šírke telefónu (390 px) aj počítača (1280 px).

---

## 11. Ako začať v novom chate

Napíš do nového chatu:

> Pracujeme na hre Autíčkové mesto v repozitári dzizka/autickove-mesto. Prečítaj si DESIGN-v2.md a CLAUDE.md a začni časťou 0.

---

## 12. Hry z v1 (časti 10 a 11)

**Postup podľa rodiča:** najprv sa hry prenesú tak, ako boli vo v1 (nanovo napísané, rovnaká zábava), a potom sa budú po jednej vylepšovať, aby boli zábavnejšie. Vylepšenia sa zapíšu do tohto bodu ako ďalšie časti.

Rodič chce v2 so všetkým, čo dieťa hralo vo v1. Každá hra je modul v `js/games/<id>/` s rozhraním z bodu 2, dáta v `js/data/`, odomyká sa úrovňou hráča a končí cez `ctx.finish` (mince, XP, občas diel alebo nálepka). Úlohy (bod 8) dostanú aj úlohy z týchto hier.

| Hra | Čo dieťa robí |
|---|---|
| 🃏 Pexeso | otáča kartičky s autami a hľadá dvojice |
| 🧽 Umyváreň | prstom umýva špinavé auto: mydlo, kefa, voda, sušenie |
| 🔧 Servis | opravuje auto: vymení koleso, doleje benzín, nafúka pneumatiku |
| 🅿️ Parkovisko | ťahá auto prstom na voľné miesto rovnakej farby |
| 🔢 Počítanie | spočíta autá a ťukne na správny počet bodiek |
| 🧩 Skladačka | skladá obrázok auta z dielikov |
| 🗺️ Bludisko | vedie auto prstom bludiskom do garáže |
| 🔤 Písmenká | hlas povie písmeno a dieťa ho nájde (prvé písmenká) |
| 🎵 Hudobná garáž | hrá na trúbiace autá a opakuje melódiu |
| 🚦 Križovatka | púšťa autá cez križovatku na zelenú, aby sa nezrazili |

Každá hra má 3 obtiažnosti, ktoré si dieťa vyberá samo (od časti 13), a prehra neexistuje (chyba len zahrá zvuk a hlas poradí).

**Spoločné pravidlá (časť 10):**
- **Herňa 🎪** je šiesta veľká voľba na domovskej obrazovke. Dlaždica ukazuje obtiažnosť hviezdami ★★★, zamknutá hra 🔒 a level, na ktorom sa otvorí.
- **Hviezdy:** hra skončí 1 až 3 hviezdami podľa chýb alebo času. Mince závisia od obtiažnosti a hviezd, XP od obtiažnosti.
- **Výber obtiažnosti (časť 13, rozhodnutie rodiča):** po ťuknutí na hru sa ukážu tri veľké tlačidlá ★ ľahké, ★★ stredné, ★★★ ťažké, hlas ich prečíta. Všetky tri sú otvorené od začiatku. Hra si pamätá posledný výber dieťaťa.
- **Odporúčanie:** dva výsledky s aspoň 2 hviezdami na odporúčanom stupni posunú odporúčanie o stupeň vyššie (nikdy neklesá). Odporúčaný stupeň svieti 👍 a hlas na konci hry povie „Nabudúce skús ťažšie!“. Ťažší stupeň dáva viac mincí a XP.
- **Uloženie:** `minigames: { pexeso: { level, plays, good, best } }` (schéma verzia 9).
- **Úlohy a trofeje:** úlohy „Zahraj si dve / štyri hry v herni“, trofeje „Všetky hry v herni“ a „Najťažšia úroveň v hre“.

| Hra | Obtiažnosť 1 → 3 | Hviezdy |
|---|---|---|
| 🃏 Pexeso | 3, 6, 8 dvojíc; na ľahších sa karty na chvíľu ukážu | podľa chybných dvojíc |
| 🧽 Umyváreň | viac blata, menšia špongia; najprv špongia (blato sa zmení na penu), potom sprcha | podľa času |
| 🔧 Servis | 3, 4, 5 porúch a toľko nástrojov na výber; vlastné auto dieťaťa | podľa zlých nástrojov |
| 🅿️ Parkovisko | 3, 4, 5 áut v kole, 3 kolá; na 3. stupni sa párujú aj bodky | podľa zlých miest |
| 🧩 Skladačka (časť 11) | obrázok s vlastným autom dieťaťa na 4, 9, 16 dielikov; na ľahších stupňoch presvitá obrázok | podľa zlých miest |
| 🔢 Počítanie | do 5, do 10, na 3. stupni aj „koľko spolu“; ťuknutím na vec ju hlas spočíta | podľa kôl, ktoré nevyšli na prvý raz |
| 🗺️ Bludisko | 5×5, 7×7, 9×9; šípky, potiahnutie prstom alebo klávesnica | podľa zozbieraných mincí |
| 🔤 Písmenká | 1. stupeň len ľahké písmená a „obrázok k písmenu“, potom aj „písmeno k obrázku“, na 3. stupni 4 možnosti | podľa kôl, ktoré nevyšli na prvý raz |
| 🎵 Hudobná garáž | melódia od 2–3 tónov rastie do 5, 7, 9 tónov, rýchlejšie; chyba melódiu len zopakuje | podľa chýb |
| 🚦 Križovatka | 8, 12, 16 áut, hustejšie a rýchlejšie; ťuknutie prepne semafor cez žltú; zrazené autá len zastanú a idú ďalej | podľa nárazov |

## 13. Mesto a album (časť 12)

- **🏙️ Mesto** je siedma veľká voľba na domovskej obrazovke. Od časti 16 je to mesto zhora, po ktorom dieťa jazdí (bod 14). Bez WebGL ostáva pôvodná ulica s 12 parcelami, ktorá sa dá posúvať prstom. Obloha sa mení podľa skutočného času (ráno, deň, večer, noc). Po ceste jazdia autá dieťaťa: jeho vlastné a ďalšie druhy, ktoré si kúpilo. Ťuknutie na auto zatrúbi.
- **Budovy** (`data/city.js`): Trafika, Benzínka, Umyváreň, Herňa, Hračkárstvo, Obchod, Servis, Parkovisko, Záhrada s bludiskom, Škola, Hudobňa, Polícia.
  - Každá sa otvorí na svojom leveli, postaví sa za mince a dá sa dvakrát vylepšiť (3 úrovne, každá 2× drahšia, dom je väčší a má viac okien).
  - **Nájom:** každá budova zarába mince za hodinu (× úroveň), najviac za 12 hodín. Nad domom sa ukáže 🪙, ťuknutím sa mince vyberú.
  - **▶ v detaile domu** otvorí jeho hru z herne (Umyváreň → Umyváreň, Škola → Písmenká…), Benzínka preteky a Trafika album.
- **📒 Album** (`data/album.js`): 11 stránok po 9 nálepkách, stránky sa otvárajú levelom. Posledné 2 nálepky na stránke sú vzácne zlaté.
  - **Odkiaľ nálepky:** balíček 🎴 za 80 mincí (3 nálepky), hra v herni s 3 hviezdami (s 2 hviezdami polovičná šanca), denný darček. Chýbajúce nálepky padajú častejšie.
  - **Rovnaké nálepky:** 3 navyše urobia nálepku striebornou 🥈, 6 zlatou 🥇.
  - **Plná stránka** dá raz 150 mincí.
- **🎁 Denný darček:** raz za kalendárny deň pri príchode na domovskú obrazovku. Sedem škatuliek ukazuje dni za sebou; každý ďalší deň je darček väčší (mince, na 3. a 7. deň aj nálepky). Po prestávke sa začína znova od 1. dňa, nič sa nestratí. V úplne novej hre príde prvý darček až na druhý deň (aby nová hra začínala bez okna).
- **Uloženie:** `city`, `album`, `daily` (schéma verzia 10).
- **Úlohy a trofeje:** „Postav alebo vylepši dom“, „Otvor balíček“; trofeje Prvý dom, Celé mesto, Päť domov na najvyššej úrovni, Plná stránka, Celý album, Zlatá nálepka, Sedem dní za sebou.
- **Testovacie menu:** denný darček znova, +30 nálepiek, nájom za 12 hodín.
- **Prenos postupu z v1:** zatiaľ nie. Ak ho rodič bude chcieť, doplní sa ako samostatný bod.

---

## 14. Grafika menu (časti 14 až 16, po skúšaní)

**Pripomienky rodiča:** pseudo 3D z pretekov sa páči a má sa použiť aj inde, kde to dáva zmysel. Otáčanie plochého auta vo Vzhľade vyzerá zle. Domovská obrazovka má mať pohyblivé pozadie.

- **Domov (časť 14, hotové):** za tlačidlami beží pseudo 3D cesta, po ktorej jazdí auto dieťaťa zozadu (so všetkým tuningom a kamarátom) a samo občas mení pruh. Trate sa striedajú každých 25 s (cez deň Mesto, Les, Púšť, Sneh; od 19:00 do 7:00 Noc a Vesmír). Ťuknutie na auto zatrúbi a auto vyskočí. Tlačidlá sú na polopriehľadnom paneli. Pozadie kreslí 30 snímok za sekundu (preteky 60), zastaví sa pri otvorenom okne a skrytej karte. V Nastaveniach je vypínač „🎞️ Pohyblivé pozadie“ (uloženie v12, `settings.motion`); vypnuté alebo pri systémovom „obmedziť pohyb“ ostane jeden nehybný obrázok.
- **Pozadie a široké obrazovky (po skúšaní na PC, rodič vybral možnosť A):** za obrazovkami menu je pokojná pohyblivá obloha (`screens/backdrop.js`): farby podľa času dňa, pomalé mraky, v diaľke kopce a mestečko (v noci svietia okná a hviezdy), občas autíčko na ceste a balón. Kreslí 20 snímok za sekundu, na domove a v pretekoch sa skryje, v minihrách stojí, vypínač „Pohyblivé pozadie“ ho zastaví. Od šírky 1200 px sa obrazovky roztiahnu (`css/screens/wide.css`): Vzhľad má veľkú točňu na celú výšku a panel vedľa, Garáž veľký zdvihák, väčšie trate, kamaráti, obrázky, trofeje a dlaždice herne; minihry rastú s obrazovkou (premenná `--u`: 1,35 od 1200 px, 1,7 od 1700 × 950 px).
- **Audit 3D a stability (8. 10.):** 3D sa zapne len na skutočnej grafickej karte (`failIfMajorPerformanceCaveat`), inak 2D. Mesto kreslí tiene raz (nie každý snímok), auto má mäkký tieň pod sebou, pri pomalom tablete samo zníži rozlíšenie a potom vypne tiene. Pri strate WebGL mesto prejde na 2D ulicu, pri načítaní krúži autíčko. Nájom mení len mince, nie celú budovu; spoločné geometrie a materiály, nič sa nehromadí v pamäti GPU. Rýchle ťukanie vo Vzhľade stavia len posledné auto. Klávesy WASD všade, kde sú šípky.
- **3D auto (časť 15a):** skutočne otočné auto vo Vzhľade (samo sa pomaly otáča, dá sa točiť prstom, pri výbere sa natočí k tomu, čo sa mení) a na zdviháku v Garáži. Dlaždice vo Vzhľade ukazujú obrázky 3D auta. Bez WebGL ostane 2D auto. Tlačidlo „Skúšobná jazda“ (auto na ceste v pseudo 3D) príde v časti 15b spolu s obrázkom auta zozadu.
  - Rodič chce porovnať dve možnosti: vlastný model vytvorený z tvaru auta z boku, a hotový voľne dostupný model (Kenney, licencia CC0). Náhľad: `/v2/preview/car3d.html`.
  - **Rozhodnutie rodiča:** všetky autá v hre budú z balíka **Kenney Car Kit** (CC0), aby grafika bola jednotná. Raketa odpadne (kto ju vlastní, dostane raketové auto; migrácia uloženia v11). Ponechajú sa všetky autá z balíka, pri skúšaní sa niektoré odoberú alebo pridajú.
  - 3D sa kreslí knižnicou three.js. Vo Vzhľade a v Garáži je otočné 3D auto; všade inde sa z toho istého modelu vyrobí obrázok zboku (domov, hry, mesto), zozadu (preteky) alebo zhora (Bludisko, Križovatka).
  - **Obrázky (časť 15b):** obrázok zboku (domov, stupne víťazov, minihry, mesto, dlaždice Vzhľadu), zozadu (preteky, skúšobná jazda) a zhora (Bludisko, Križovatka) sa vyrobí z 3D modelu raz a uloží sa do pamäte. Kým nie je hotový, aj na zariadení bez WebGL, ostane 2D kresba. Súperi jazdia na športových autách, premávka sú dodávky, taxíky, pikapy, kamióny a smetiari (jeden druh na farbu), boss na kamióne. Prekážky kužeľ, debna a zábrana sú modely z balíkov Car Kit a City Kit Roads.
  - **Úprava po skúšaní (rodič: auto „levitovalo“, pohľad bol príliš zozadu):** auto zozadu je vidieť zhora pod uhlom 34° (ako kamera vidí cestu). Tieň a neón sú pod skutočnou stopou auta na ceste, nie za nárazníkom; súperi a premávka majú tiež tieň. Štít je jedna jemná priehľadná bublina namiesto kruhov.
  - **Skúšobná jazda (časť 15b):** tlačidlo „🛣️ Jazda“ vo Vzhľade: 14 sekúnd po prázdnej mestskej ceste, ťukanie vľavo a vpravo mení pruh, 📯 trúbi, ✖ končí. Bez odmien.
  - Všetky autá majú skutočný pomer veľkostí z balíka (motokára je malá, hasiči veľkí). Kolesá sa pri výmene prispôsobia veľkosti a miestu pôvodných kolies; traktory a motokáry si nechávajú svoje.
  - Náhľad: `/v2/preview/carkit.html`.
- **Mesto (časť 16), rozhodnutie rodiča:** mesto **zhora**, ulice v mriežke, dieťa jazdí hore, dole, doľava a doprava (šípky, potiahnutie prstom) a cestou zbiera mince z kúpených pozemkov. Pohľad z uhla je krajší, ale vysoká budova zakryje auto; vrátime sa k nemu možno neskôr. **Hotové v časti 16** (`render/three/town.js`, `town-map.js`, rozloženie v `data/city.js` TOWN): mapa 4 × 4 blokov, budovy na 12 blokoch najbližšie stredu, okolo domy, parky a rad stromov. Auto dieťaťa (3D auto s tuningom a kamarátom) jazdí šípkami, potiahnutím prsta alebo klávesmi. Nájom čaká ako 1 až 3 mince na ulici pred domom (podľa toho, koľko sa nazbieralo); prejazdom cez ne sa vyberie. Ťuknutie na pozemok otvorí detail (postaviť, vylepšiť, ▶ hra). Svetlo podľa času dňa, v noci svietia aj svetlá auta. Modely: Kenney City Kit Roads, Suburban a Commercial (CC0). Budova rastie s úrovňou (malý obchod → poschodový dom → mrakodrap), každá má svoju farbu a ikonu; pozemok na predaj je hlina s kužeľmi, zamknutý má 🔒. Náhľad `/v2/preview/town3d.html`. Rodič nahral aj Nature, Racing a Toy Car Kit; použijú sa podľa potreby (napr. stromy, okolie trate). Pôvodné dve možnosti (už nevybrané) v náhľade `/v2/preview/town.html`:
  - **D1 jazda ulicou:** pohľad zozadu ako v pretekoch, domy po oboch stranách, šípky ◀ ▶ presunú auto k ďalšiemu domu, dom pred autom je veľký a ťuká sa naň.
  - **D2 bočná ulica s vrstvami:** súčasná ulica, ale krajšia: viac vrstiev pozadia, ktoré sa pri posúvaní hýbu rôzne rýchlo, a lepšie kreslené domy.
