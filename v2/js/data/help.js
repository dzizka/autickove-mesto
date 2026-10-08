// ❔ Explanations for the adult (DESIGN-v2 §15.2, part 20, play-test point 5): what happens on
// a screen, so a parent can tell the child what to do. In Slovak; English in data/i18n/en-help.js.
// Data only.

export const HELP = {
  home: {
    icon: "🏠",
    text: [
      "Domov. Odtiaľto sa ide všade. Najviac sa hrá v Pretekoch 🏁.",
      "Hore sú úlohy: keď je úloha splnená, svieti a ťuknutím sa vyberie odmena. Úplne hore je level, mince a ⚙️ nastavenia (podržaním 3 sekundy sa otvorí menu pre rodiča).",
    ],
  },
  races: {
    icon: "🏁",
    text: [
      "Výber pretekov. Dieťa vyberie trať a úroveň a ťukne na štart.",
      "Pri úrovni je semafor: 🟢 auto je dosť silné, 🟡 bude to ťažké, 🔴 auto je zatiaľ slabé (skúsiť sa dá). Ďalšiu úroveň odomkne víťazstvo, ďalšiu trať medaila. Po troch pretekoch na trati príde boss 👑.",
    ],
  },
  "game-race": {
    icon: "🏎️",
    text: [
      "Preteky. Auto ide samo, ťuknutím na ľavú alebo pravú polovicu obrazovky zmení pruh. Treba sa vyhýbať prekážkam a zbierať mince, benzín ⛽ a hviezdy.",
      "Prehrať sa nedá: aj 4. miesto dá mince a súčiastky. Na konci sa ťukne na truhlicu.",
    ],
  },
  garage: {
    icon: "🔧",
    text: [
      "Garáž. Za súčiastky 🔩 z pretekov sa ťuknutím vylepší diel auta (motor, pneumatiky, nárazník, nádrž, magnet, maskot). Číslo je úroveň dielu, krúžok ukazuje, ako ďaleko je nová schopnosť (na úrovni 6 a 14).",
      "Diel, ktorý svieti, je najlacnejší, na ktorý dieťa má. Každé auto má vlastné vylepšenia, nové auto začína od začiatku.",
    ],
  },
  tuning: {
    icon: "🎨",
    text: [
      "Vzhľad auta: druh auta, farba, vzor, kolesá, spojler, nálepky, vec na streche, neón, stopa a klaksón. Kupuje sa za mince a nemení silu auta.",
      "Ťuknutie na vec, ktorú dieťa nemá, ju ukáže na aute a ponúkne kúpu. 🛣️ je skúšobná jazda, 🎲 náhodný vzhľad z vecí, ktoré už má.",
    ],
  },
  crew: {
    icon: "🐣",
    text: [
      "Kamaráti. Vajíčka padajú od bossov a niekedy z truhlice a vyliahnu sa po troch pretekoch. Kamarát jazdí ako spolujazdec a pomáha (rýchlosť, štít, mince…).",
      "Za cukríky 🍬 sa kamarát vyvinie, za mince sa dá obliecť. Ťuknutím na 🏠 zostane doma.",
    ],
  },
  coloring: {
    icon: "🖍️",
    text: ["Omaľovánka. Voľné maľovanie (štetec, vedierko, guma) alebo maľovanie podľa čísel. Hotový obrázok ide do galérie a dá odmenu (trblietavé farby, nálepky na auto)."],
  },
  "game-coloring": {
    icon: "🖍️",
    text: ["Maľovanie. Vľavo alebo dole sú nástroje a farby. Pri maľovaní podľa čísel sa vyberie číslo a ťuká sa na políčka s rovnakým číslom. ✔ obrázok dokončí."],
  },
  gallery: { icon: "🖼️", text: ["Galéria hotových obrázkov. Obrázok sa dá zväčšiť alebo zmazať."] },
  games: {
    icon: "🎪",
    text: ["Herňa s menšími hrami. Hviezdy ukazujú, ako ťažko sa hrá; po ťuknutí si dieťa vyberie ★, ★★ alebo ★★★ (odporúčaná obtiažnosť svieti). Zamknuté hry sa otvoria vyšším levelom."],
  },
  city: {
    icon: "🏙️",
    text: ["Mesto zhora. Dieťa jazdí autom šípkami alebo potiahnutím prsta a zbiera mince pred domami (nájomné). Ťuknutím na pozemok sa dom postaví alebo vylepší za mince."],
  },
  album: { icon: "📒", text: ["Album nálepiek. Za mince sa kupujú balíčky nálepiek. Z rovnakých nálepiek sa vyrobí strieborná a zlatá. Plná stránka dá odmenu."] },
  trophies: { icon: "🏆", text: ["Trofeje za úspechy v celej hre. Ťuknutím hra povie, za čo trofej je."] },
  settings: { icon: "⚙️", text: ["Nastavenia: jazyk, zvuky, hlas, pohyblivé pozadie, titulky, prenos postupu na iné zariadenie a prehľad pre rodičov."] },
  parents: { icon: "👪", text: ["Prehľad pre rodičov: čas hrania za posledných 7 dní, čo dieťa hrá najčastejšie a jeho postup."] },
  "game-pexeso": { icon: "🃏", text: ["Pexeso. Ťuká sa na dve kartičky; keď sú rovnaké, ostanú otočené. Treba nájsť všetky dvojice."] },
  "game-wash": { icon: "🧽", text: ["Umyváreň. Prstom sa drhne blato špongiou, potom sa sprchou opláchne pena."] },
  "game-repair": { icon: "🔧", text: ["Servis. Na aute bliká, čo je pokazené. Dieťa ťukne na správny nástroj (koleso, žiarovka, benzín, olej…)."] },
  "game-park": { icon: "🅿️", text: ["Parkovisko. Auto sa potiahne alebo ťukne a potom ťukne na miesto rovnakej farby (na ťažšej úrovni s rovnakým počtom bodiek)."] },
  "game-puzzle": { icon: "🧩", text: ["Skladačka. Dielik sa potiahne na jeho miesto v obrázku."] },
  "game-count": { icon: "🔢", text: ["Počítanie. Ťuknutím na veci ich hra spočíta nahlas, potom dieťa ťukne na správne číslo. Na ťažkej úrovni sa sčítava."] },
  "game-maze": { icon: "🗺️", text: ["Bludisko. Šípkami alebo potiahnutím prsta sa auto dovezie do garáže, cestou zbiera mince."] },
  "game-letters": { icon: "🔤", text: ["Písmenká. Vlak prinesie písmeno a dieťa nájde obrázok, ktorý sa naň začína, alebo naopak hľadá prvé písmeno slova."] },
  "game-music": { icon: "🎵", text: ["Hudobná garáž. Autá zatrúbia melódiu (vidno, ktoré auto svieti), potom ju dieťa zopakuje ťukaním na autá. Melódia sa postupne predlžuje."] },
  "game-traffic": { icon: "🚦", text: ["Križovatka. Ťuknutím sa prepne semafor, aby autá prechádzali striedavo a nenarazili do seba."] },
};
