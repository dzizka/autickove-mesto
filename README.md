# Autíčkové mesto 🚗🏙️

Detská hra v prehliadači pre deti okolo 6 rokov. Autíčka, preteky, mesto, nálepky a kamaráti.
Hrá sa ťukaním na telefóne, tablete aj počítači a pokyny hra predčítava, takže dieťa nemusí vedieť čítať.

**Hrať:** https://dzizka.github.io/autickove-mesto/

## Verzia 1 (priečinok `v1/`)

Celá hra je jeden súbor `v1/index.html` bez inštalácie a bez servera.

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

Stačí otvoriť `v1/index.html` v prehliadači. Písmo sa načítava z Google Fonts. Bez internetu hra použije náhradné písmo.

## Plán

Verzia 2 bude v priečinku `v2/`. Zadanie je v [DESIGN-v2.md](DESIGN-v2.md): korisť so štatistikami do áut, Garáž, bossovia, nová Omaľovánka s maľovaním podľa čísel a kód rozdelený do súborov.
