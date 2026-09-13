# Architektura

Tenhle dokument vysvětluje **proč** je atlas postavený tak, jak je - hlavně
datový model, protože ten je pro dlouhodobou použitelnost nejdůležitější.
Pro praktický návod "jak přidat cestu" viz [PRIDAVANI_DAT.md](./PRIDAVANI_DAT.md).

## Základní princip: web a data jsou oddělené

Web (Astro, TypeScript, MapLibre) je **generický prohlížeč dat**. Neobsahuje
nic specifického pro Černou Horu, Maglić ani jakoukoliv konkrétní cestu -
všechno, co vidíš na webu, se generuje z obsahu `src/content/`. Přidání nové
cesty nikdy neznamená upravovat `.astro` soubory, komponenty ani mapovou
logiku. Znamená to přidat nový datový soubor (ručně, nebo přes
`npm run new:*`).

Technicky to zajišťuje Astro **Content Collections** - `src/content.config.ts`
definuje sedm kolekcí a jejich schéma (pomocí Zod), Astro při buildu všechna
data načte, provaliduje proti schématu a vygeneruje z nich statické stránky
i dva GeoJSON endpointy (`/data/places.geojson`, `/data/routes.geojson`),
které na klientovi čte mapa.

Pokud v datech uděláš chybu (překlep v odkazu na neexistující místo, špatný
typ), `npm run dev` / `npm run build` to nahlásí jako chybu se srozumitelnou
hláškou - ne až za běhu v prohlížeči.

## Sedm kolekcí, dvě vrstvy

### Cestovatelská vrstva - kam a jak ses přesunul

| Kolekce  | Co to je                                             | Formát            |
|----------|-------------------------------------------------------|--------------------|
| `trips`  | Velká výprava - deštník nad místy/trasami/výstupy     | Markdown (`.md`)  |
| `places` | Libovolný bod: město, vesnice, sedlo, chata, letiště… | YAML/JSON          |
| `routes` | Přesun mezi dvěma `places` libovolnou dopravou        | YAML/JSON          |

`trips` jsou Markdown záměrně - frontmatter nese strukturovaná data (datum,
země, stav...), tělo souboru je volný text s příběhem cesty. Ostatní kolekce
nemají potřebu dlouhého textu, takže zůstávají čistá strukturovaná data.

### Horská vrstva - co jsi zkusil/zdolal

Tohle je oddělené záměrně: **objekt** (konkrétní hora) je jiná věc než
**konkrétní návštěva** té hory. Na Maglić se dá vrátit za pět let znovu -
nechceš mít dvě kopie "Maglić" v systému, chceš jeden vrchol a dva záznamy
o výstupu.

| Kolekce    | Role   | Co nese                                                      |
|------------|--------|---------------------------------------------------------------|
| `peaks`    | OBJEKT | Jméno, země, pohoří, výška, souřadnice vrcholu                |
| `ferratas` | OBJEKT | Jméno, oblast, obtížnost, případný cílový vrchol, délka/převýšení trasy |
| `ridges`   | OBJEKT | Jméno, pohoří, typická délka/převýšení/počet dní              |
| `ascents`  | UDÁLOST | Jeden konkrétní výstup/pokus: datum, výsledek, trip, vazba na peak/ferrata/ridge, GPS trasa, poznámka |

`ascents` je jediná kolekce, kde se "stejná věc" (výstup na Maglić) může
objevit vícekrát v čase - to je přesně to chování, které tahle vrstva
umožňuje. Statistiky typu "počet zdolaných vrcholů" pak počítají **distinct
peaks, které mají aspoň jeden ascent s výsledkem summit/repeat_summit** - ne
počet záznamů v katalogu.

Pěší/ferratový/hřebenovkový výstup se **nezdvojuje** i v `routes` - `ascents`
nese svůj vlastní `from` (výchozí místo) a `track`, takže mapa i statistiky
čerpají čáry a kilometry pěšky ze dvou zdrojů najednou (`routes` s
`mode: foot` + všechny `ascents`), bez duplicity dat.

## Reference mezi kolekcemi

Astro `reference()` (v `content.config.ts`) zajišťuje, že např. `routes.from`
musí ukazovat na existující `places` záznam - jinak build spadne s chybou.
V YAML/JSON datech se reference píšou jako obyčejný string (jméno souboru
bez přípony):

```yaml
# src/content/routes/podgorica-niksic.yaml
trip: cerna-hora-2026    # -> src/content/trips/cerna-hora-2026.md
from: podgorica          # -> src/content/places/podgorica.yaml
to: niksic                # -> src/content/places/niksic.yaml
```

`ascents` může (nemusí) odkazovat na `peak`, `ferrata` NEBO `ridge` - Zod
schema to nevynucuje jako "právě jedno z", protože by to zkomplikovalo
validaci referencí. CLI (`npm run new:ascent`) se na to ptá a nutí vybrat
přesně jednu vazbu.

## Kvalita trasy - GPS / rekonstruovaná / orientační

Každý úsek (`routes` i `ascents`) může nést `track`:

```yaml
track:
  quality: gps            # gps | reconstructed | approximate
  file: maglic-2026        # jméno GPX/TCX v data/gpx/ (bez přípony), nepovinné
  coordinates: [[...]]     # ruční linie [lng,lat], nepovinné
```

Priorita při vykreslování (viz `src/lib/geo.ts`):

1. **GPX/TCX soubor** (`track.file`) - `scripts/build-tracks.mjs` ho při
   buildu převede na GeoJSON do `public/tracks/`.
2. **Ruční `coordinates`** - když nemáš GPX, ale znáš přibližný průběh.
3. **Rovná čára mezi start/cíl** - fallback, když není ani jedno. Mapa ji
   vždy kreslí tečkovaně/přerušovaně podle `quality`, takže nikdy nevypadá
   jako přesná GPS stopa, i když je to jen dokreslená spojnice.

## Proti vymýšlení čísel

Tohle je návrhové pravidlo, ne jen "pěkné mít": **žádné číselné pole není
povinné** (kromě těch, co definují samotnou existenci záznamu - typ, vazby).
`distanceKm`, `elevationGainM`, `maxElevationM`, `durationMin`... všechno je
`.optional()` v `content.config.ts`.

`src/lib/stats.ts` sčítá jen to, co je vyplněné, a u každého součtu vrací
`{ value, complete, missing }` - `complete: false` znamená "některé záznamy
chyběly, tohle je jen částečný součet". Statistiky to zobrazují s hvězdičkou
a poznámkou, nikdy neschovají neúplnost za hladké číslo. Totéž platí pro
`nejvyšší dosažený bod` (bere jen skutečně vyplněná/odvoditelná čísla) a pro
mapu (nevyplněná trasa = tečkovaná čára, ne vymyšlená přesná).

Jediná výjimka je "efektivní výška výstupu": pokud `ascent.result` je
`summit`/`repeat_summit` a `maxElevationM` není vyplněné, statistiky použijí
výšku navázaného vrcholu (`peak.elevation`) - to není vymyšlené číslo, je to
logický důsledek "dosáhl jsi vrcholu, tedy jsi byl v jeho výšce".

## `mode: "mixed"` - proč existuje

`TRANSPORT_MODES` obsahuje kromě pěšky/auto/vlak/autobus/odvoz/loď/letadlo i
`mixed`. Je pro přesně tenhle případ: víš, že úsek byl kombinací autobusu a
stopu, ale ne který přesně - a nechceš to hádat. `mixed` úseky se počítají do
"vše" a do režimu "jen po zemi", ale ne do konkrétního filtru
autobus/odvoz (protože by to bylo tvrzení, které nemáš podložené). Časem,
až/pokud zjistíš přesný poměr, stačí soubor přepsat na konkrétní `mode` nebo
ho rozdělit na víc `routes` záznamů.

## Přesnost data - `datePrecision`

`trips`, `routes` i `ascents` mají `dateStart`/`date` (vždy platné datum) a
`datePrecision: day | month | year`. Datum se ukládá vždy jako plný ISO
string (den je technický placeholder, když neznáš přesný den), ale UI ho
zobrazuje podle `datePrecision` - "září 2026", ne "1. září 2026", pokud
přesný den nevíš. To samé se bude hodit za pár let, až budeš zpětně doplňovat
starší cesty, kde si nepamatuješ přesné datum.

## Mapa: proč dva zdroje bodů

`src/lib/map/TravelMap.ts` drží body ve **dvou** MapLibre zdrojích - `places`
(shlukované/clustered, pro škálování na stovky měst) a `peaks` (vždy
jednotlivě, protože vrcholů realisticky nikdy nebude tolik, aby potřebovaly
shlukování). Kdyby byly v jednom zdroji, MapLibre by shlukoval vrcholy
dohromady s městy podle geografické blízkosti bez ohledu na typ - filtr
"Hory" by pak uměl schovat jednotlivé (neshlukované) body, ale ne shluk,
který uvnitř skrývá i nehorská místa. Rozdělení podle role (ne jen podle
"typu bodu") je řešení, které bude fungovat i s tisíci budoucích míst.

## Technologie a proč

- **Astro (static output)** - žádný server, `npm run build` vyrobí čistý
  `dist/` adresář nasaditelný kamkoliv (GitHub Pages, Netlify, Cloudflare
  Pages, vlastní hosting). Content Collections dávají typovanou, validovanou
  datovou vrstvu bez databáze.
- **MapLibre GL JS + OpenFreeMap** - open-source vektorová mapa bez API
  klíče a bez rizika, že jednou přestane fungovat kvůli změně cenění (na
  rozdíl od Google Maps/Mapbox). `tiles.openfreemap.org` je zdarma a
  self-hostovatelné, kdyby to bylo časem potřeba.
- **Žádný UI framework** (React/Vue/Svelte) - interaktivita (mapa, filtry)
  je pár set řádků vanilla TypeScriptu. Pro rozsah tohohle webu by framework
  přidal jen závislosti navíc.
- **Vlastní GPX/TCX parser** (`scripts/build-tracks.mjs`) bez knihovny -
  formát trackpointů je stabilní a jednoduchý, ušetří to jednu dlouhodobou
  závislost navíc.
- **JSON jako datový formát pro CLI výstup** - je to validní podmnožina
  YAML (Astro ho čte úplně stejně), takže `scripts/new-entry.mjs` nemusí
  implementovat vlastní YAML serializer. Ruční editace v YAML zůstává stejně
  pohodlná jako dřív - oba formáty fungují vedle sebe ve stejné kolekci.
