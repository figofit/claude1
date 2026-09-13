# Jak přidat novou cestu

Praktický návod. Proč je to takhle navržené, viz [ARCHITEKTURA.md](./ARCHITEKTURA.md).

Dva způsoby, jak přidávat data - klidně kombinuj podle chuti:

- **`npm run new:*`** - interaktivní otázky v terminálu, na konci zapíše
  soubor. Nejrychlejší cesta, hlídá formát a reference na existující data.
- **Ruční YAML soubor** ve `src/content/<kolekce>/` - když chceš víc
  kontroly (např. napsat delší poznámku, nebo rovnou vyplnit `coordinates`
  z mapy). Formát viz schéma níže nebo existující ukázková data.

Po přidání dat stačí `npm run dev` (živý náhled) nebo `npm run build`
(ověří, že všechno sedí - chybějící reference nebo špatný typ pole spadne
jako chyba se srozumitelnou hláškou).

## Běžný případ: nová cesta s přesuny

```
npm run new:trip      # založí src/content/trips/<slug>.md
npm run new:place     # opakuj pro každé nové místo (existující přeskoč)
npm run new:route     # opakuj pro každý úsek mezi místy
```

Příklad - stejná logika jako u ukázkové cesty Černá Hora 2026:

1. `npm run new:trip` → název, datum (stačí i jen "2026-09", když neznáš
   přesný den), země, shrnutí.
2. `npm run new:place` pro každé **nové** místo (existující místa, kterými
   jsi už projížděl dřív, znovu nezakládej - `npm run new:route` se na
   existující místa jen odkáže).
3. `npm run new:route` pro každý úsek: vyber `trip`, typ dopravy, odkud/kam.
   Nemusíš evidovat každou zastávku - jen "významné průjezdní body" (viz
   příklad Podgorica → Nikšić → Plužine → Mratinje v ukázkových datech).
   Když přesně nevíš vzdálenost/trvání, nech pole prázdné (Enter) - systém
   si nic nedomyslí, jen to vynechá ze statistik.

## Horská výprava (vrchol / ferrata / hřebenovka)

```
npm run new:peak       # jen když ten vrchol/ferrata/hřebenovka ještě není v katalogu
npm run new:ferrata
npm run new:ridge
npm run new:ascent     # samotný výstup/pokus - tohle zakládáš pokaždé znovu
```

Klíčové: **objekt** (vrchol/ferrata/hřebenovka) zakládáš jednou. Každou další
návštěvu/pokus přidáváš jako nový `npm run new:ascent` s vazbou na existující
objekt - `npm run new:ascent` ti při psaní ukáže seznam už existujících
vrcholů/ferrat/hřebenovek, ze kterých vybíráš.

Pole `výsledek` u výstupu:

| Hodnota          | Znamená                                                      |
|-------------------|---------------------------------------------------------------|
| `summit`          | Cíl dosažen (poprvé)                                          |
| `repeat_summit`   | Cíl dosažen znovu, po dřívějším úspěšném výstupu               |
| `not_completed`   | Pokus, cíl nedosažen (návrat, počasí, zranění, zvěř na trase…) |
| `attempt`         | Pokus bez jednoznačně uzavřeného výsledku                     |

## GPS trasa (GPX/TCX)

1. Ulož soubor do `data/gpx/<jméno>.gpx` (nebo `.tcx`).
2. V `route`/`ascent` nastav:
   ```yaml
   track:
     quality: gps
     file: <jméno>   # bez přípony, musí sedět se souborem v data/gpx/
   ```
3. `npm run dev`/`npm run build` soubor automaticky převede na GeoJSON do
   `public/tracks/` (viz `scripts/build-tracks.mjs`). Nic dalšího dělat
   nemusíš.

Když přesnou GPS nemáš, ale znáš přibližný průběh (např. podle mapy),
můžeš místo `file` napsat `coordinates` s vlastní linií `[lng, lat]` bodů a
`quality: reconstructed` nebo `approximate`. Když nemáš ani to, nech `track`
úplně pryč - mapa dokreslí rovnou (tečkovanou) čáru mezi start a cíl bodem,
takže na mapě nic "nechybí", jen je to viditelně označené jako nepřesné.

## Fotky

`trips`, `routes` i `ascents` mají nepovinné pole `photos` (seznam cest k
souborům). Fotky ulož třeba do `public/photos/<trip-id>/` a v datech odkazuj
relativní cestou (`/photos/cerna-hora-2026/01.jpg`). Web fotky zobrazí jen
tam, kde nějaké jsou - žádná sekce se nezobrazí prázdná.

## Přehled polí (pro ruční editaci)

Přesný a aktuální zdroj pravdy je vždycky `src/content.config.ts` - tohle je
jen rychlý přehled. Tučně = povinné, zbytek nepovinné.

**`trips`** (Markdown, frontmatter): **title**, **dateStart**, datePrecision,
dateEnd, status (`planned`/`ongoing`/`completed`), **countries** (pole ISO
kódů), summary, cover, photos, tags. Tělo souboru = volný Markdown text.

**`places`**: **name**, **country**, **type**
(`city`/`town`/`village`/`pass`/`hut`/`camp`/`poi`/`airport`/`border`/`other`),
**coordinates** (`[lng, lat]`), elevation, description, tags.

**`routes`**: **trip**, **mode**
(`foot`/`car`/`train`/`bus`/`hitchhike`/`boat`/`plane`/`mixed`), **from**,
**to**, date, datePrecision, status (`completed`/`planned`), distanceKm,
elevationGainM, maxElevationM, durationMin, track, notes, photos.

**`peaks`**: **name**, **country**, range, elevation, **coordinates**,
description, tags.

**`ferratas`**: **name**, **country**, area, difficulty (volný text),
targetPeak, coordinates, distanceKm, elevationGainM, description, tags.

**`ridges`**: **name**, **country**, range, coordinates, distanceKm,
elevationGainM, typicalDays, description, tags.

**`ascents`**: **trip**, peak/ferrata/ridge (vyplň aspoň jedno), activityType
(`hike`/`ferrata`/`ridge`/`other`), **result**
(`summit`/`repeat_summit`/`not_completed`/`attempt`), date, datePrecision,
from, distanceKm, elevationGainM, elevationLossM, maxElevationM, durationMin,
days, track, notes, photos.

## Poznámka k varování při buildu

Dokud nemáš žádnou ferratu ani hřebenovku, `npm run build`/`npm run dev`
vypíše:

```
[WARN] [content] The collection "ferratas" does not exist or is empty...
```

To je neškodné - prázdná kolekce, ne chyba. Zmizí to samo, jakmile přidáš
první záznam přes `npm run new:ferrata` / `new:ridge`.

## Nasazení

`npm run build` vyrobí statický web do `dist/` - nahraj ho kamkoliv (GitHub
Pages, Netlify, Cloudflare Pages, vlastní hosting). Žádná databáze ani
server se neřeší. Admin/přidávací rozhraní (CLI skripty) běží jen lokálně u
tebe v terminálu, není potřeba ho nikam nasazovat ani zveřejňovat.
