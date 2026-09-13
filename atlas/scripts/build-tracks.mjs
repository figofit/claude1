#!/usr/bin/env node
// Převede GPX/TCX soubory z data/gpx/ na GeoJSON v public/tracks/, odkud si
// je bere src/lib/geo.ts (viz track.file v routes/ascents schématu).
//
// Záměrně bez závislosti na knihovně pro XML - GPX i TCX trackpointy mají
// jednoduchou, stabilní strukturu a regexový parser tu nic nepřidává do
// dlouhodobé údržby navíc. Když soubor selže, skript ho jen přeskočí a
// pokračuje dál (jeden rozbitý GPX nesmí shodit celý build).

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const gpxDir = join(root, 'data', 'gpx');
const outDir = join(root, 'public', 'tracks');

function attr(tagAttrs, name) {
  const m = tagAttrs.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i'));
  return m ? parseFloat(m[1]) : undefined;
}

function tag(inner, name) {
  const m = inner.match(new RegExp(`<${name}>([^<]+)</${name}>`, 'i'));
  return m ? parseFloat(m[1]) : undefined;
}

function pushPoint(points, lat, lon, ele) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
  points.push(Number.isFinite(ele) ? [lon, lat, ele] : [lon, lat]);
}

function parseGpx(xml) {
  const points = [];
  const trkptRe = /<trkpt\b([^>]*)>([\s\S]*?)<\/trkpt>/g;
  let m;
  while ((m = trkptRe.exec(xml))) {
    const [, attrs, inner] = m;
    pushPoint(points, attr(attrs, 'lat'), attr(attrs, 'lon'), tag(inner, 'ele'));
  }
  if (points.length >= 2) return points;

  // fallback: <rtept> (trasové/route body) pro GPX bez track segmentu
  const rteptRe = /<rtept\b([^>]*)>([\s\S]*?)<\/rtept>/g;
  points.length = 0;
  while ((m = rteptRe.exec(xml))) {
    const [, attrs, inner] = m;
    pushPoint(points, attr(attrs, 'lat'), attr(attrs, 'lon'), tag(inner, 'ele'));
  }
  return points;
}

function parseTcx(xml) {
  const points = [];
  const tpRe = /<Trackpoint\b[^>]*>([\s\S]*?)<\/Trackpoint>/gi;
  let m;
  while ((m = tpRe.exec(xml))) {
    const inner = m[1];
    const lat = tag(inner, 'LatitudeDegrees');
    const lon = tag(inner, 'LongitudeDegrees');
    pushPoint(points, lat, lon, tag(inner, 'AltitudeMeters'));
  }
  return points;
}

function main() {
  if (!existsSync(gpxDir)) {
    console.log('[tracks] data/gpx/ neexistuje - není co zpracovat.');
    return;
  }
  const files = readdirSync(gpxDir).filter((f) => ['.gpx', '.tcx'].includes(extname(f).toLowerCase()));
  if (files.length === 0) {
    console.log('[tracks] Ve data/gpx/ zatím nejsou žádné GPX/TCX soubory - přeskakuji.');
    return;
  }

  mkdirSync(outDir, { recursive: true });
  let ok = 0;
  let skipped = 0;

  for (const file of files) {
    const path = join(gpxDir, file);
    const id = basename(file, extname(file));
    try {
      const xml = readFileSync(path, 'utf-8');
      const isTcx = extname(file).toLowerCase() === '.tcx';
      const points = isTcx ? parseTcx(xml) : parseGpx(xml);

      if (points.length < 2) {
        console.warn(`[tracks] ${file}: nenašel jsem aspoň 2 body trasy, přeskakuji.`);
        skipped++;
        continue;
      }

      const geojson = {
        type: 'Feature',
        properties: {
          id,
          source: file,
          pointCount: points.length,
          hasElevation: points.every((p) => p.length === 3),
        },
        geometry: { type: 'LineString', coordinates: points },
      };
      writeFileSync(join(outDir, `${id}.geojson`), JSON.stringify(geojson));
      console.log(`[tracks] ${file} -> public/tracks/${id}.geojson (${points.length} bodů)`);
      ok++;
    } catch (err) {
      console.error(`[tracks] Chyba při zpracování ${file}, přeskakuji:`, err instanceof Error ? err.message : err);
      skipped++;
    }
  }

  console.log(`[tracks] Hotovo: ${ok} zpracováno, ${skipped} přeskočeno.`);
}

main();
