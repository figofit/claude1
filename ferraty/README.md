# Moje ferraty

Osobní evidence absolvovaných via ferrat. Statická webová aplikace (čisté HTML/CSS/JS,
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
  index.html         Přehled (hero, souhrnné statistiky, poslední záznamy)
  ferraty.html        Seznam / tabulka se řazením a filtry
  mapa.html            Interaktivní mapa všech ferrat
  detail.html          Detail jedné ferraty (?id=...)
  statistiky.html      Automaticky počítané statistiky
  pridat.html          Formulář pro vygenerování nového záznamu

  data/
    ferraty.json       Jediný zdroj pravdy — pole "records" se všemi ferratami

  gpx/                 GPX/TCX soubory tras (volitelné, odkazované z data/ferraty.json)
  photos/
    <id-ferraty>/      Fotografie k dané ferratě (volitelné, jedna složka na záznam)

  assets/
    css/style.css      Sdílený vzhled
    js/data.js          Načítání dat + formátovací a statistické funkce (sdílené)
    js/nav.js           Společná hlavička a patička
    js/home.js, list.js, map.js, detail.js, stats.js, add.js
                         Logika jednotlivých stránek
```

## Datový model

Každý záznam v `data/ferraty.json` → `records[]` vypadá takto (viz i ukázková data):

```jsonc
{
  "id": "donnerkogel-austriaweg-2023",   // stabilní, ručně čitelné ID — nikdy neměnit
  "type": "ferrata",                      // typ záznamu, viz "Budoucí rozšíření"

  "name": "Donnerkogel – Austriaweg",
  "country": "Rakousko",
  "region": "Dachstein – Gosaukamm",
  "locality": "Gosau",
  "coordinates": { "lat": 47.559, "lng": 13.549 },

  "date": "2023-08-12",                   // YYYY-MM-DD, nebo null

  "difficulty": { "grade": "C/D", "scale": "Hüsler" },  // nebo null
  "length_m": 850,
  "elevationGain_m": 400,
  "summit": "Donnerkogel",
  "altitude_m": 2054,
  "duration_min": 240,

  "myRating": {                            // každá položka 1–5, nebo null; celý objekt může být null
    "technical": 4,
    "physical": 3,
    "exposure": 5,
    "views": 5,
    "overall": 5
  },

  "note": "Volný text — poznámka z hory.",

  "track": { "file": "gpx/donnerkogel-austriaweg-2023.gpx", "format": "gpx" },  // nebo null
  "photos": ["photos/donnerkogel-austriaweg-2023/01.jpg"],                       // nebo []

  "sourceUrl": "https://www.dachstein-salzkammergut.at/",  // nebo null
  "relatedIds": [],                        // odkazy na budoucí propojené záznamy (viz níže)

  "createdAt": "2023-08-14T18:00:00Z",
  "updatedAt": "2023-08-14T18:00:00Z"
}
```

**Pravidlo číslo jedna: co nevíš, necháváš `null` (nebo prázdné pole `[]`).** Aplikace nic
nedopočítává ani nedomýšlí — pokud je pole `null`, zobrazí se jako „—“ nebo „neuvedeno“,
a do statistik se počítá jen z toho, co skutečně je vyplněné (a je to tak i okomentované).

### Obtížnost

`difficulty.grade` je čistě text, který si zapíšeš tak, jak je uvedený u zdroje (např. `C`,
`C/D`, `4a`...). Pro řazení a seskupování aplikace rozumí klasické Hüslerově stupnici
A–E (i kombinacím typu `C/D`) — cokoliv jiného zůstane brané jako "nezařaditelné" a při
řazení skončí na konci, ale zobrazí a filtruje se v pohodě dál.

### GPX/TCX trasa

Soubor s trasou dej do `gpx/` a v `track.file` odkaž relativní cestou (`gpx/nazev.gpx`).
Živý náhled na mapě detailu funguje zatím jen pro `.gpx` (`track.format: "gpx"`) — `.tcx`
soubor se nabídne ke stažení, ale nevykresluje se (šlo by doplnit později parserem).

### Fotografie

Slož je do vlastní podsložky `photos/<id-ferraty>/` a v poli `photos` vypiš relativní cesty
k jednotlivým souborům. Prázdné pole `[]` znamená "zatím žádné fotky", ne chybu.

## Jak přidat novou ferratu

1. Otevři stránku **Přidat ferratu** (`pridat.html`) a vyplň formulář — cokoliv nevíš, nech
   prázdné.
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

`data/ferraty.json` teď obsahuje prvních 12 skutečných záznamů. U řady z nich zatím chybí
datum, obtížnost, GPS nebo přesný název trasy — u těch je v poli `note` napsané, co je potřeba
doplnit/zkontrolovat. Klidně uprav ručně nebo přes `pridat.html` (u úprav existujícího záznamu
viz sekci výše).

## Budoucí rozšíření (vrcholy, hřebenovky, výpravy…)

Datový model je záměrně navržený tak, aby šel replikovat pro další typy aktivit beze změny
základu:

- Pro nový modul (např. vrcholy) by vznikl vlastní soubor `data/vrcholy.json` se stejnou
  obálkou (`id`, `type: "peak"`, společná pole `name/country/region/locality/coordinates/
  date/myRating/note/track/photos/sourceUrl/relatedIds`) a specifickými poli podle
  potřeby (např. `prominence_m`).
- `id` je stabilní a nezávislé na pořadí v souboru — proto ho lze bezpečně použít i z jiného
  modulu.
- Pole **`relatedIds`** už dnes existuje u každého záznamu právě proto, aby šlo později
  propojit konkrétní ferratu s konkrétním výstupem, hřebenovkou nebo výpravou — stačí tam
  vypsat `id` souvisejících záznamů (i z jiného datového souboru, např. `"peak:hoher-dachstein-2023"`).
- `type` pole u každého záznamu do budoucna umožní sloučit více modulů do jednoho přehledu
  nebo jedné mapy, pokud by to dávalo smysl.

Až budeš chtít modul přidat, stačí zkopírovat vzor stránek (seznam/mapa/detail/statistiky/
přidat) a napojit ho na nový JSON soubor — `assets/js/data.js` je psané tak, aby šlo stejné
funkce (formátování, řazení, statistiky) použít i pro nový typ dat.
