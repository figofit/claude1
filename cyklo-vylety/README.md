# CYKLO VÝLETY

Jednoduchá statická stránka — seznam cyklistických výletů s fotkou, mapkou a údaji. Čeština. Žádný build.

Leží ve vlastní složce, web odhadů nemovitostí v kořeni repozitáře se nemění.

## Spuštění / nasazení

Stačí nahrát složku `cyklo-vylety/` na hosting (FTP, GitHub Pages, Netlify…). Otevřete `/cyklo-vylety/`.

Lokálně (kvůli mapovým dlaždicím a fotkám raději přes http, ne `file://`):

```bash
cd cyklo-vylety
python3 -m http.server 5173
```

Pak http://localhost:5173

## Použití

- Hlavní pohled je seznam výletů.
- U každého: datum, trasa, km, čas, poznámky, volitelná fotka, malá mapa start → cíl.
- **Přidat výlet** / **Upravit** — doplňování průběžně v prohlížeči.
- Fotka: nahrání ze zařízení, nebo URL.
- Mapa: tlačítko **Najít místa na mapě** (OpenStreetMap / Nominatim), nebo ruční souřadnice.
- Data se ukládají v `localStorage`. **Stáhnout zálohu** uloží JSON.

Ukázkové výlety a fotky (Wikimedia Commons) jsou předvyplněné, ať stránka není prázdná.
