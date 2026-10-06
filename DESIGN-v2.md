# Autíčkové mesto 2: zadanie

Verzia 2 je **nová hra**, ktorá sa stavia od začiatku. Z verzie 1 (`v1/`) nič nepreberá, okrem skúseností. Verzia 1 ostáva hrateľná samostatne na `/v1/`.

V jadre je **akčná hra s autami a korisťou** (ako Diablo): dieťa jazdí preteky, z pretekov padajú diely na auto so štatistikami a auto je čoraz silnejšie. Okolo toho sú **tuning vzhľadu**, **kamaráti** a **Omaľovánka**.

---

## 1. Pre koho a z čoho vychádzame

**Hráč:** dieťa okolo 6 rokov, ktoré ešte nevie čítať (alebo len začína).

Z toho vyplýva:
- **Ovládanie:** všetko ide ťuknutím alebo ťahaním prstom. Veľké tlačidlá (aspoň 56 px).
- **Pokyny:** každý pokyn hra predčíta hlasom.
- **Bez čísel a textu:** štatistiky, porovnania a vzácnosť sa ukazujú ikonami, farbami, hviezdičkami a šípkami ⬆⬇. Čísla vidí len rodič v Prehľade pre rodičov.
- **Prehra neexistuje:** dieťa vždy niečo dostane. Najľahšiu trať musí vyhrať aj so začiatočným autom.

**Čo dieťa vo v1 bavilo najviac** (podľa rodiča): **preteky, tuning, kamaráti, omaľovánka**. Verzia 2 je postavená na týchto štyroch pilieroch.

**Čo sa z v1 osvedčilo a čo dodržať:**
- jasné farby a hlasové pokyny,
- odmena po každej hre (mince, truhla),
- veľa vecí na zbieranie a vylepšovanie,
- skryté testovacie menu pre rodiča,
- prenos postupu kódom medzi zariadeniami.

Iné hry a systémy z v1 (mesto, album, minihry…) do v2 nepatria. Ak ich bude chcieť rodič neskôr, pridajú sa ako nové časti tohto zadania.

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
│   │   ├── cars.js  tuning.js  tracks.js  bosses.js
│   │   ├── loot-bases.js  affixes.js  legendaries.js  sets.js
│   │   ├── crew.js  trophies.js
│   │   └── coloring/       # obrázky na voľné maľovanie a podľa čísel
│   ├── systems/            # logika bez kreslenia
│   │   ├── economy.js  progress.js  quests.js  trophies.js
│   │   ├── loot.js         # generovanie dielov, vzácnosť, sila
│   │   ├── garage.js       # nasadenie, porovnanie, rozoberanie, vylepšenie
│   │   ├── stats.js        # súčet štatistík auta (diely + sety + kamarát)
│   │   └── crew.js         # kamaráti: vajíčka, levely, vývoj
│   ├── render/
│   │   ├── car-side.js     # auto z boku (SVG)
│   │   └── car-top.js      # auto zhora (canvas)
│   ├── screens/            # home.js garage.js tuning.js crew.js gallery.js parents.js
│   └── games/
│       ├── race/           # index.js  track.js  spawner.js  physics.js  draw.js  hud.js  boss.js
│       └── coloring/       # index.js  free-paint.js  by-number.js  brush.js
└── tests/                  # Playwright testy (bod 10)
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

- **Ovládanie:** pohľad zhora, auto ide samo dopredu a dieťa ťukaním vľavo a vpravo mení pruhy.
- **Na ceste:** súperi, premávka, prekážky, mince, power-upy, rampy a benzín.
- **Trate:** 6 tratí s vlastným vzhľadom a počasím: Mesto, Les, Púšť, Sneh, Noc a Vesmír.
- **Úrovne trate:** každá trať má úrovne 1 až 5 (ako úrovne sveta v Diable). Úroveň sa odomkne víťazstvom na nižšej. Vyššia úroveň znamená rýchlejších súperov, viac prekážok a lepšie diely.
- **Výber trate:** pri každej úrovni je odporúčaná sila auta 🟢 zvládneš, 🟡 bude ťažké, 🔴 ešte nie. Ďalej sú tam medaily a pruh výziev k bossovi.
- **Koniec pretekov:** pódium s umiestnením a truhlica s korisťou (bod 4.5).
- **Výkon:** preteky musia ísť plynulo na staršom tablete. Svetlá v noci sa kreslia na zmenšenom plátne.

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

**Zobrazenie:** každá štatistika je ikona s 1 až 5 farebnými dielikmi na pruhu, nie číslo. **Sila auta** je jedno veľké číslo s farebným odznakom (súčet všetkého). Dieťa vďaka tomu vidí, či je väčšia alebo menšia.

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

- **Koniec pretekov:** truhlica, ktorá sa otvorí s animáciou. 1. miesto dá 3 diely, 2. miesto 2, 3. a 4. miesto 1. Vzácnosť závisí od úrovne trate a od šťastia.
- **Bossovia:** každá trať má svojho bossa: Kráľ ciest (Mesto), Medveď Drevorubač (Les), Škorpión (Púšť), Snežný Yeti (Sneh), Netopier (Noc) a Ufo (Vesmír). Boss príde po naplnení „pruhu výziev“ (3 preteky na trati). Je väčší, má vlastnú hudbu a niečo hádže na cestu. Výhra nad ním dá istý epický diel, malú šancu na legendárny a vajíčko s kamarátom (bod 6).

### 4.6 Garáž

- **Auto a sloty:** veľké auto na zdviháku a okolo neho 6 slotov.
- **Inventár:** 30 dielov, rozšíriteľný za mince do 60.
- **Porovnanie:** pri každom diele je zelená ⬆ alebo červená ⬇ oproti tomu, čo je namontované, a pri ťuknutí sa ukážu pruhy štatistík vedľa seba.
- **Nové diely:** majú značku „NOVÉ“, kým ich dieťa neotvorí.
- **Tlačidlo ✨ Najlepšie:** namontuje najsilnejšie diely jedným ťuknutím.
- **Rozobrať:** diel sa zmení na súčiastky 🔩. Je aj tlačidlo „Rozobrať všetko sivé a zelené“, ktoré sa pred použitím opýta.
- **Vylepšiť:** za súčiastky a mince sa diel vylepší z +1 až na +5. Každé vylepšenie mierne zvýši štatistiky a pribudne hviezdička.
- **Zamknúť 🔒:** zamknutý diel sa omylom nerozoberie.

### 4.7 Sety

Sú 4 sety po 3 dieloch: **Policajný, Hasičský, Vesmírny, Džungľa**. Pri 2 dieloch zo setu sa zapne malý bonus, pri 3 veľký bonus a zvláštny vzhľad (napr. siréna na streche, plamene za autom). V Garáži je kniha setov, kde sa nájdené diely odfarbia.

### 4.8 Vyváženie

- **Začiatok:** začiatočné auto má sivé diely v každom slote. Prvý zelený a modrý diel padne isto počas prvých 3 pretekov.
- **Postup:** približne 10 hodín hrania od prvého epického dielu po kompletný set a 5. úroveň tratí. Legendárne diely sú vzácne, ale do 2 až 3 hodín hrania dieťa nejaký isto uvidí. Zaručí to „počítadlo smoly“, ktoré po každých pretekoch bez legendárneho dielu zvýši šancu naň.
- **Bez frustrácie:** preteky sa nedajú prehrať. Aj 4. miesto dá diel a mince.

---

## 5. Vzhľad auta (tuning)

- **Autá:** aspoň 8 druhov (osobné, džíp, taxík, polícia, hasiči, formula, kamión, raketa), ktoré sa kupujú za mince. Druh auta je len vzhľad, štatistiky dávajú diely.
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
- **Odmena:** mince podľa veľkosti obrázka. Občas aj nálepka na auto alebo trblietavá farba. Za obrázky sú trofeje (prvý 24×24, 10 obrázkov a pod.).

---

## 8. Okolo hry

- **Domovská obrazovka:** auto dieťaťa s kamarátom, veľké tlačidlá **Preteky**, **Garáž**, **Vzhľad**, **Kamaráti** a **Omaľovánka**.
- **Úlohy:** 3 jednoduché úlohy naraz (napr. „vyhraj preteky“, „rozober 3 diely“, „vymaľuj obrázok“). Za splnenie je odmena.
- **Trofeje:** za prvý legendárny diel, celý set, všetkých bossov, vylepšenie +5, vyvinutého kamaráta, obrázky a pod.
- **Prehľad pre rodičov:** čas hrania za 7 dní, čo dieťa hrá najčastejšie a sila auta. Tu sú aj čísla.
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
