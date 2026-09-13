# GPX / TCX stopy

Sem patří syrové exporty z GPS zařízení nebo aplikací (Garmin, Strava, OsmAnd,
Locus, Mapy.cz...) - jeden soubor = jedna stopa.

**Jméno souboru = `id`, na který se odkazuje `track.file` v `routes`/`ascents`.**
Např. `maglic-2026.gpx` zpřístupníš v datech jako:

```yaml
track:
  quality: gps
  file: maglic-2026
```

Při `npm run dev` / `npm run build` se všechny soubory odsud automaticky
převedou na GeoJSON do `public/tracks/` (viz `scripts/build-tracks.mjs`).
Tenhle adresář se needituje ručně.
