# Atlas cest

Osobní dlouhodobý cestovatelský atlas: interaktivní mapa + databáze cest,
míst, vrcholů, ferrat a hřebenovek. Statický web (Astro), data odděleně v
`src/content/` (YAML/JSON/Markdown) + GPX/TCX v `data/gpx/`. Navrženo na roky
dopředu - přidání nové cesty nikdy nevyžaduje zásah do kódu webu.

- **Jak to funguje / proč je to takhle navržené:** [docs/ARCHITEKTURA.md](./docs/ARCHITEKTURA.md)
- **Jak přidat novou cestu, výstup, GPX soubor...:** [docs/PRIDAVANI_DAT.md](./docs/PRIDAVANI_DAT.md)

## Rychlý start

```bash
npm install
npm run dev        # http://localhost:4321
```

```bash
npm run build      # statický web do dist/
npm run preview    # lokální náhled dist/ buildu
```

## Přidání dat

```bash
npm run new:trip      # nová výprava
npm run new:place     # nové místo (město, vesnice, sedlo, chata...)
npm run new:route     # nový přesun mezi místy
npm run new:peak      # nový vrchol do katalogu
npm run new:ferrata    # nová via ferrata do katalogu
npm run new:ridge      # nová hřebenovka/přechod do katalogu
npm run new:ascent     # nový výstup/pokus (váže se na peak/ferrata/ridge)
```

Podrobnosti a příklady: [docs/PRIDAVANI_DAT.md](./docs/PRIDAVANI_DAT.md).

## Struktura

```
src/content.config.ts    datový model (schéma všech kolekcí)
src/content/              samotná data - trips/places/routes/peaks/ferratas/ridges/ascents
data/gpx/                  syrové GPX/TCX soubory
src/lib/                   geo, statistiky, formátování, barvy, mapová třída
src/components/            Layout, mapa, karty
src/pages/                  jednotlivé stránky webu
scripts/                    build-tracks.mjs (GPX→GeoJSON), new-entry.mjs (CLI), copy-maplibre-assets.mjs
docs/                       architektura + návod na přidávání dat
```

## Technologie

Astro (statický build, Content Collections) · TypeScript · MapLibre GL JS +
[OpenFreeMap](https://openfreemap.org) (vektorová mapa, bez API klíče) ·
žádný UI framework, žádná databáze.
