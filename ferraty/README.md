# Moje hory

Osobní evidence absolvovaných ferrat, vrcholů a hřebenovek — jeden společný seznam, mapa
a statistiky pro všechno, co zvládneš v horách. Statická webová aplikace (čisté HTML/CSS/JS,
bez frameworku a bez buildu) — žádná databáze, žádný backend. Všechna data jsou v jednom
čitelném JSON souboru, který postupně doplňuješ ty sám.

## Jak to spustit

Aplikace načítá data přes `fetch()`, takže **musí běžet přes http(s) server**, ne otevřením
souboru `index.html` přímo v prohlížeči (`file://` fetch blokuje).

Nejjednodušší lokální spuštění:

```bash
cd ferraty
python3 -m http.server 8000
# pak otevři http://localhost:8000
```

Na ostrém hostingu stačí nahrát celou složku `ferraty/` (např. přes FTP, GitHub Pages,
Netlify apod.) — je to čistě statický obsah.

## Struktura souborů

```
ferraty/
  index.html         Přehled (hero, souhrnné statistiky, TOP výstupy, poslední záznamy)
  ferraty.html        Výstupy — seznam/tabulka se řazením a filtry (typ, země, rok)
  mapa.html            Interaktivní mapa všech výstupů
  detail.html          Detail jednoho záznamu (?id=...)
  statistiky.html      Automaticky počítané statistiky + žebříček podle nadmořské výšky
  tatry.html           Regionální podstránka pro Vysoké Tatry (výstupy + doprava/logistika)
  beskydy.html         Regionální podstránka pro Beskydy (výstupy + doprava/logistika)
  alpy.html            Regionální podstránka pro Alpy (výstupy + doprava/logistika)
  pridat.html          Formulář pro vygenerování nového záznamu

  data/
    ferraty.json       Jediný zdroj pravdy — pole "records" se všemi výstupy
                         (ferraty i vrcholy i hřebenovky pohromadě, rozlišené polem "type")

  gpx/                 GPX/TCX soubory tras (volitelné, odkazované z data/ferraty.json)
  photos/
    <id-zaznamu>/      Fotografie k danému záznamu (volitelné, jedna složka na záznam)

  assets/
    css/style.css      Sdílený vzhled
    js/data.js          Načítání dat + formátovací a statistické funkce (sdílené)
    js/nav.js           Společná hlavička a patička
    js/region.js         Sdílená logika pro regionální podstránky (stat řádek + tabulka)
    js/home.js, list.js, map.js, detail.js, stats.js, add.js
                         Logika jednotlivých stránek
    js/tatry.js, beskydy.js
                         Tenké konfigurace regionálních podstránek nad region.js
```

## Datový model

Každý záznam v `data/ferraty.json` → `records[]` vypadá takto (viz i uložená data):

```jsonc
{
  "id": "donnerkogel-austriaweg-2023",   // stabilní, ručně čitelné ID — nikdy neměnit
  "type": "ferrata",                      // "ferrata" | "vrchol" | "hřebenovka"

  "name": "Donnerkogel – Austriaweg",
  "country": "Rakousko",
  "region": "Dachstein – Gosaukamm",
  "regionGroup": "Alpy",                  // nebo null — pro regionální podstránky (viz níže)
  "locality": "Gosau",
  "coordinates": { "lat": 47.559, "lng": 13.549 },

  "date": "2023-08-12",                   // YYYY-MM-DD, nebo null

  "length_m": 850,
  "elevationGain_m": 400,
  "summit": "Donnerkogel",                // u typu "vrchol" obvykle netřeba (název = vrchol)
  "altitude_m": 2054,
  "duration_min": 240,

  "featured": false,                      // true = "TOP výstup", ukáže se na Přehledu

  "days": [                               // nepovinné — u vícedenních akcí itinerář po dnech
    {
      "day": 1,
      "date": "2023-08-11",               // nebo null
      "from": "Gosausee",
      "to": "Gablonzer Hütte",
      "overnightAt": "Gablonzer Hütte",   // nebo null, pokud se ten den nespalo na chatě
      "note": "Nástup a nocleh před summit dnem."
    }
  ],                                      // nebo [] u jednodenních výstupů

  "note": "Volný text — poznámka z hory.",

  "track": { "file": "gpx/donnerkogel-austriaweg-2023.gpx", "format": "gpx" },  // nebo null
  "photos": ["photos/donnerkogel-austriaweg-2023/01.jpg"],                       // nebo []

  "sourceUrl": "https://www.dachstein-salzkammergut.at/",  // nebo null
  "relatedIds": [],                        // odkazy na související záznamy (viz níže)

  "createdAt": "2023-08-14T18:00:00Z",
  "updatedAt": "2023-08-14T18:00:00Z"
}
```

**Pravidlo číslo jedna: co nevíš, necháváš `null` (nebo prázdné pole `[]`).** Aplikace nic
nedopočítává ani nedomýšlí — pokud je pole `null`, zobrazí se jako „—“ nebo „neuvedeno“,
a do statistik se počítá jen z toho, co skutečně je vyplněné (a je to tak i okomentované).

### Typ záznamu

`type` rozlišuje tři druhy výstupů, které appka zvládá v jednom seznamu/mapě/statistikách:

- `"ferrata"` — via ferrata
- `"vrchol"` — výstup na vrchol pěšky/lezením bez zajištěné ferraty
- `"hřebenovka"` — traverz/hřebenovka mezi více vrcholy

Pole jako `length_m` (délka zajištěné trasy) dávají smysl hlavně u ferrat, `summit` zase
hlavně u ferrat (cílový vrchol jiný než název trasy) — u vrcholu je to typicky zbytečné,
protože `name` už je ten vrchol. Nic se ale nevynucuje, klidně nech prázdné, co nesedí.

Pokud `hřebenovka` cestou vede přes další pojmenované vrcholy (ne jen ten v `name`), každý
takový vrchol si zaslouží i vlastní `vrchol` záznam se stejným datem — ne jen zmínku v
poznámce hřebenovky. Oba/všechny záznamy se pak propojí přes `relatedIds`, aby bylo z
detailu vidět, že patří k sobě (příklad: hřebenovka Koncheto Vihren–Kutelo a k ní zvlášť
vrcholy Vihren i Kutelo).

### GPX/TCX trasa

Soubor s trasou dej do `gpx/` a v `track.file` odkaž relativní cestou (`gpx/nazev.gpx`).
Živý náhled na mapě detailu funguje zatím jen pro `.gpx` (`track.format: "gpx"`) — `.tcx`
soubor se nabídne ke stažení, ale nevykresluje se (šlo by doplnit později parserem).

### Poloha na mapě bez souřadnic i bez GPX

Pokud u záznamu chybí `coordinates`, detail se nevzdá — automaticky zkusí najít přibližnou
polohu podle `name`, `locality`, `region` a `country` přes Nominatim (bezplatný open-source
geocoder z projektu OpenStreetMap, bez API klíče). Najde-li něco, mini-mapa ukáže orientační
bod a napíše se to tam jasně („Přibližná poloha dohledaná automaticky…“) — není to náhrada
za skutečné souřadnice vrcholu, jen lepší než nic. Pokud se nic nenajde (nebo je offline),
zobrazí se prostě hláška, že polohu nemáme.

### Fotografie

Slož je do vlastní podsložky `photos/<id-zaznamu>/` a v poli `photos` vypiš relativní cesty
k jednotlivým souborům. Prázdné pole `[]` znamená "zatím žádné fotky", ne chybu.

### Regionální skupina a regionální podstránky

`regionGroup` je volitelný štítek nezávislý na `region` (který je volný text) — používají ho
regionální podstránky typu `tatry.html`/`beskydy.html`/`alpy.html`, co k výstupům přidávají
vlastní hero, statistiky a třeba tipy na dopravu. Sdílenou logiku (stat řádek + tabulka výstupů)
má na starosti `assets/js/region.js` — samotná stránka je jen HTML (hero + sekce "Doprava a
logistika") plus tenký `*.js` soubor, který zavolá
`Ferraty.Region.init({ regionGroup, countLabel, emptyMessage })`.

Zatím existují `"Tatry"`, `"Beskydy"` a `"Alpy"`. `"Pyreneje"` je zatím jen vyplněná u záznamů
(Aneto, Comapedrosa) bez vlastní podstránky — až tam přibude víc výstupů, založí se stejným
způsobem. Další skupina (Balkán, Kavkaz…) by fungovala stejně: nová `<region>.html` podle vzoru
`tatry.html`/`beskydy.html`/`alpy.html`, tenký `<region>.js` podle vzoru `tatry.js`, přidání
odkazu do `NAV_ITEMS` v `assets/js/nav.js`, a vyplnění `regionGroup` u příslušných záznamů.

### TOP výstupy

`featured: true` označí záznam jako TOP výstup — na `index.html` se pak ukáže v samostatné
sekci „🏆 Nej výstupy“ úplně nahoře. Appka do toho sama nic nevymýšlí — je to čistě tvůj vlastní
výběr, buď zaškrtnutím ve formuláři, nebo ruční úpravou pole v JSONu.

### Nedokončené pokusy

`reachedSummit: false` znamená, že vrchol nebyl dosažen — otočka kvůli počasí, zdraví,
vybavení a podobně. Výchozí hodnota je `true` (appka to nedomýšlí, ale beze změny pole
se každý záznam bere jako dokončený). U nedokončeného pokusu nech `altitude_m` prázdné
(nedosáhl jsi té výšky) — kam ses dostal, popiš v `note`. Na detailu se ukáže žlutý štítek
„⚠ Nedokončeno (pokus)“, v seznamu výstupů malá značka u názvu, a počet je vidět na
`statistiky.html` v kartě „Další“.

### Nejvyšší bod státu

`highestOfCountry: true` znamená, že tenhle záznam je nejvyšší bod země uvedené v poli
`country` — ne jen nejznámější nebo nejvyšší vrchol, na který jsi v té zemi vylezl. Appka to
nedopočítává sama (musela by znát nejvyšší bod každého státu na světě) — nastavuje se ručně,
buď zaškrtnutím ve formuláři, nebo v JSONu. Zobrazuje se v sekci „Nejvyšší hory států“ na
`statistiky.html`.

### Nejvyšší bod jiné oblasti (pohoří, poloostrov, ostrov…)

`highestOfAreas: []` je obdoba `highestOfCountry`, ale pro cokoliv jiného než stát — pohoří,
poloostrov, ostrov, kontinentální část apod. Je to pole volného textu, protože takových
oblastí a jejich hranic je nekonečno a appka je nezná (na rozdíl od zemí nejde ani sestavit
jednoduchý seznam vlajek). Jeden záznam jich může mít víc najednou — třeba Mulhacén je
zároveň nejvyšší bod pevninského Španělska/Iberského poloostrova i pohoří Sierra Nevada,
a klidně vedle toho ještě jiný záznam může být `highestOfCountry: true` u jiné země. Nastavuje
se ručně (ve formuláři jako seznam oddělený čárkou, v JSONu jako pole řetězců). Zobrazuje se
v sekci „Nejvyšší body dalších oblastí“ na `statistiky.html`.

### Osobní milníky

`milestones: []` je pole volného textu pro osobní "poprvé" — první 2000, první 3000, první
4000, první 3000 v konkrétním pohoří apod. Funguje stejně jako `highestOfAreas` (víc hodnot
na záznam, ruční nastavení, ve formuláři jako seznam oddělený čárkou) a zobrazuje se
chronologicky (podle `date`) v sekci „Osobní milníky“ na `statistiky.html`.

### Sopka a ledovec

`volcano: true` je jednoduchý příznak pro statistiky — sopka jako typ hory (např. Teide).

`glacier` rozlišuje, jestli byl na hoře ledovec, a hlavně jak: `"route"` znamená, že jsi po
něm skutečně šel (byl na tvé trase), `"massif"` že na hoře/masivu ledovec je, ale tvoje
konkrétní trasa přes něj nevedla, `null` že ne. K tomu `glacierName` — jméno ledovce, pokud
ho znáš. Nastavuje se ručně (výběr + textové pole ve formuláři, v JSONu jako řetězec/`null`).
Počet (route i massif dohromady) se zobrazuje na `statistiky.html` v kartě „Další“.

### S kým

`companions: []` je pole jmen lidí, se kterými jsi výstup absolvoval — volný text, víc jmen na
záznam. Na `ferraty.html` podle něj jde filtrovat (filtr „S kým“), na detailu se zobrazí jako
fakt. Prázdné pole `[]` znamená sám/neuvedeno. Nastavuje se ručně (ve formuláři jako seznam
oddělený čárkou, v JSONu jako pole řetězců) — appka ho samo nedomýšlí ani nedopočítává
z poznámky, i když u starších záznamů byl jednorázově odvozený z volného textu v `note`.

### Vícedenní itinerář

Pole `days` je pro výstupy s noclehem na chatě/pod stanem po cestě — pole objektů `{day, date,
from, to, overnightAt, note}`, jeden objekt na den. Na detailu záznamu se pak zobrazí jako
sekce „Itinerář“ nad poznámkou. U jednodenních výstupů nech `days: []`.

`overnightAt` (kde jsi tu noc opravdu spal — chata, rifugio, útulna) appka navíc posbírá ze
všech záznamů dohromady do sekce „Kde jsem spal“ na `statistiky.html`. Piš stejnou chatu
pokaždé stejně (i při zpáteční cestě přes stejné místo), ať se to v přehledu nezdvojí.

## Jak přidat nový výstup

1. Otevři stránku **Přidat výstup** (`pridat.html`), vyber typ (ferrata/vrchol/hřebenovka)
   a vyplň formulář — cokoliv nevíš, nech prázdné.
2. Klikni na „Vygenerovat záznam“. Formulář si sám vymyslí stabilní `id` (ze slugu názvu a
   roku), zkontroluje, že se nekryje s existujícím záznamem, a poskládá kompletní JSON blok
   ve správném formátu.
3. Zkopíruj vygenerovaný JSON (tlačítko „Kopírovat JSON“, nebo si ho stáhni jako soubor) a
   vlož ho na konec pole `"records"` v `data/ferraty.json` (odděl čárkou od předchozího
   záznamu).
4. Pokud máš GPX/TCX trasu, nahraj ji do `gpx/` pod názvem, který jsi zadal do formuláře.
5. Pokud máš fotografie, vytvoř složku `photos/<id>/` (ID uvidíš ve výstupu formuláře) a
   nahraj tam soubory se stejnými názvy, jaké jsi napsal do formuláře.
6. Ulož a nahraj (commitni a pushni / nahraj na hosting). Seznam, mapa i statistiky se
   při dalším načtení stránky aktualizují samy — nikde jinde nic upravovat nemusíš.

Editaci `data/ferraty.json` jde samozřejmě udělat i přímo (např. rovnou v editoru na GitHubu)
— formulář na `pridat.html` je jen pohodlná pomůcka, která hlídá formát a generuje ID.

### Úprava nebo smazání existujícího záznamu

Formulář zatím neumí editovat/mazat existující záznamy (bezpečně to jde jen přímou úpravou
souboru) — najdi záznam podle `id` v `data/ferraty.json` a uprav nebo smaž ho ručně.

## Stav dat

`data/ferraty.json` obsahuje reálné záznamy, ne ukázková data. U řady z nich zatím chybí
datum, GPS nebo přesný název trasy/vrcholu — u těch je v poli `note` napsané,
co je potřeba doplnit/zkontrolovat. Klidně uprav ručně nebo přes `pridat.html` (u úprav
existujícího záznamu viz sekci výše).

## Budoucí rozšíření (výpravy, cestovatelský atlas…)

Datový model je záměrně navržený tak, aby šel dál rozšiřovat beze změny základu:

- `id` je stabilní a nezávislé na pořadí v souboru — proto ho lze bezpečně použít i
  z jiného, budoucího datového souboru (např. samostatný cestovatelský atlas).
- Pole **`relatedIds`** už dnes existuje u každého záznamu právě proto, aby šlo později
  propojit konkrétní výstup s konkrétní výpravou nebo cestou — stačí tam vypsat `id`
  souvisejících záznamů.
- Další modul (např. samostatný "cestovatelský atlas" cest a vlaků, jak plánuješ) může žít
  klidně jako úplně samostatný projekt/appka — nemusí sdílet tenhle datový soubor ani stránky,
  stačí mu jen stejný přístup (JSON + GPX/fotky ve složkách, žádný backend).

Až budeš chtít podobný modul přidat, stačí zkopírovat vzor stránek (seznam/mapa/detail/
statistiky/přidat) — `assets/js/data.js` je psané tak, aby šlo stejné funkce (formátování,
řazení, statistiky) použít i pro nový typ dat.
