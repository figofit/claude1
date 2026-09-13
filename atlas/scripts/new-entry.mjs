#!/usr/bin/env node
// Interaktivní CLI pro přidávání dat, aniž by ses musel(a) štrachat v kódu.
// Spouští se přes `npm run new:trip` / `new:place` / `new:route` / `new:peak`
// / `new:ferrata` / `new:ridge` / `new:ascent` (nebo přímo `node
// scripts/new-entry.mjs <typ>`).
//
// Zapisuje JSON (ne YAML) - je to validní podmnožina YAML, kterou Astro čte
// úplně stejně, ale bez rizika ručně psaného YAML serializeru. Ruční editace
// stávajících .yaml souborů tím není nijak omezená - obojí vedle sebe funguje.

import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const contentDir = join(root, 'src', 'content');
const rl = createInterface({ input: stdin, output: stdout });

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function listIds(collection) {
  const dir = join(contentDir, collection);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /\.(ya?ml|json|md)$/i.test(f))
    .map((f) => f.replace(/\.(ya?ml|json|md)$/i, ''))
    .sort();
}

let emptyStreak = 0;
async function askString(label, { required = false, default: def } = {}) {
  while (true) {
    const hint = def !== undefined ? ` [${def}]` : required ? ' *' : ' (Enter = přeskočit)';
    const v = (await rl.question(`${label}${hint}: `)).trim();
    if (v === '') {
      emptyStreak++;
      if (emptyStreak > 25) {
        throw new Error('Moc prázdných odpovědí za sebou - běžíš tohle interaktivně v terminálu?');
      }
      if (def !== undefined) return def;
      if (!required) return undefined;
      console.log('  -> povinné pole.');
      continue;
    }
    emptyStreak = 0;
    return v;
  }
}

async function askNumber(label, opts = {}) {
  while (true) {
    const v = await askString(`${label} (číslo)`, opts);
    if (v === undefined) return undefined;
    const n = Number(String(v).replace(',', '.'));
    if (!Number.isFinite(n)) {
      console.log('  -> zadej platné číslo.');
      continue;
    }
    return n;
  }
}

async function askEnum(label, choices, opts = {}) {
  while (true) {
    const v = await askString(`${label} (${choices.join('/')})`, opts);
    if (v === undefined) return undefined;
    if (!choices.includes(v)) {
      console.log(`  -> platné hodnoty: ${choices.join(', ')}`);
      continue;
    }
    return v;
  }
}

async function askList(label) {
  const v = await askString(`${label} (odděl čárkou)`);
  return v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [];
}

async function askCoordinates(label, opts = {}) {
  while (true) {
    const v = await askString(`${label} - zadej "lat, lon" (např. 42.4304, 19.2594)`, opts);
    if (v === undefined) return undefined;
    const parts = v.split(',').map((s) => Number(s.trim()));
    if (parts.length !== 2 || parts.some((n) => !Number.isFinite(n))) {
      console.log('  -> čekám dvě čísla oddělená čárkou: lat, lon');
      continue;
    }
    const [lat, lon] = parts;
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      console.log('  -> lat musí být -90..90 a lon -180..180 - nezaměnil(a) jsi pořadí?');
      continue;
    }
    return [lon, lat]; // interně/v datech se ukládá [lng, lat] (GeoJSON pořadí)
  }
}

async function askDate(label, opts = {}) {
  while (true) {
    const v = await askString(`${label} (RRRR-MM-DD, nebo jen RRRR-MM / RRRR, když přesné datum neznáš)`, opts);
    if (v === undefined) return undefined;
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return { date: v, datePrecision: 'day' };
    if (/^\d{4}-\d{2}$/.test(v)) return { date: `${v}-01`, datePrecision: 'month' };
    if (/^\d{4}$/.test(v)) return { date: `${v}-01-01`, datePrecision: 'year' };
    console.log('  -> nerozpoznaný formát data.');
  }
}

async function askRef(label, collection, opts = {}) {
  const ids = listIds(collection);
  const hintCmd = collection.replace(/s$/, '');
  console.log(`  dostupné v ${collection}: ${ids.length ? ids.join(', ') : `(zatím žádné - založ přes npm run new:${hintCmd})`}`);
  while (true) {
    const v = await askString(label, opts);
    if (v === undefined) return undefined;
    if (!ids.includes(v)) {
      console.log(`  -> "${v}" v ${collection} nenašel jsem, zkontroluj přesný zápis (viz seznam výš).`);
      continue;
    }
    return v;
  }
}

async function askTrack() {
  const quality = await askEnum('Kvalita trasy', ['gps', 'reconstructed', 'approximate', 'zadna'], { default: 'zadna' });
  if (!quality || quality === 'zadna') return undefined;
  const file = await askString(
    quality === 'gps'
      ? 'Jméno GPX/TCX souboru v data/gpx/ (bez přípony; Enter, pokud ho zatím nemáš)'
      : 'Volitelně jméno souboru v data/gpx/, pokud existuje (jinak Enter)',
  );
  return file ? { quality, file } : { quality };
}

function clean(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)),
  );
}

function writeJsonEntry(collection, id, data) {
  const dir = join(contentDir, collection);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${id}.json`);
  if (existsSync(path) || existsSync(join(dir, `${id}.yaml`)) || existsSync(join(dir, `${id}.yml`))) {
    throw new Error(`"${id}" v kolekci ${collection} už existuje - zvol jiné ID.`);
  }
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`\n✓ Vytvořeno: ${relative(root, path)}`);
}

// --- Jednotlivé typy záznamů ------------------------------------------

async function newTrip() {
  console.log('\n== Nová cesta / výprava ==\n');
  const title = await askString('Název cesty', { required: true });
  const id = await askString('ID souboru (slug)', { default: slugify(title) });
  const startInfo = await askDate('Datum začátku', { required: true });
  const endInfo = await askDate('Datum konce (Enter, pokud cesta ještě běží)');
  const status = await askEnum('Stav', ['planned', 'ongoing', 'completed'], {
    default: endInfo ? 'completed' : 'ongoing',
  });
  const countries = await askList('Země (ISO kódy, např. ME, BA)');
  const summary = await askString('Krátké shrnutí');
  const tags = await askList('Štítky');

  const fm = clean({
    title,
    dateStart: startInfo.date,
    datePrecision: startInfo.datePrecision !== 'day' ? startInfo.datePrecision : undefined,
    dateEnd: endInfo?.date,
    status,
    countries: countries.map((c) => c.toUpperCase()),
    summary,
    tags,
  });

  const dir = join(contentDir, 'trips');
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${id}.md`);
  if (existsSync(path)) throw new Error(`"${id}" v trips už existuje - zvol jiné ID.`);
  const frontmatter = Object.entries(fm)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join('\n');
  writeFileSync(path, `---\n${frontmatter}\n---\n\nTady může být krátký příběh cesty (nepovinné, obyčejný Markdown).\n`);
  console.log(`\n✓ Vytvořeno: ${relative(root, path)}`);
  console.log(`  Další krok: npm run new:place a npm run new:route (s trip: ${id})`);
}

async function newPlace() {
  console.log('\n== Nové místo ==\n');
  const name = await askString('Název', { required: true });
  const id = await askString('ID souboru (slug)', { default: slugify(name) });
  const country = await askString('Země (ISO kód, např. ME)', { required: true });
  const type = await askEnum(
    'Typ',
    ['city', 'town', 'village', 'pass', 'hut', 'camp', 'poi', 'airport', 'border', 'other'],
    { required: true },
  );
  const coordinates = await askCoordinates('Souřadnice', { required: true });
  const elevation = await askNumber('Nadmořská výška v metrech');
  const description = await askString('Popis');
  const tags = await askList('Štítky');

  writeJsonEntry(
    'places',
    id,
    clean({ name, country: country.toUpperCase(), type, coordinates, elevation, description, tags }),
  );
}

async function newRoute() {
  console.log('\n== Nový přesun (route) ==\n');
  const trip = await askRef('Trip ID', 'trips', { required: true });
  const mode = await askEnum('Typ dopravy', ['foot', 'car', 'train', 'bus', 'hitchhike', 'boat', 'plane', 'mixed'], {
    required: true,
  });
  const from = await askRef('Odkud (place ID)', 'places', { required: true });
  const to = await askRef('Kam (place ID)', 'places', { required: true });
  const id = await askString('ID souboru (slug)', { default: slugify(`${from}-${to}`) });
  const dateInfo = await askDate('Datum');
  const status = await askEnum('Stav', ['completed', 'planned'], { default: 'completed' });
  const distanceKm = await askNumber('Vzdálenost v km');
  const elevationGainM = await askNumber('Převýšení v m');
  const maxElevationM = await askNumber('Nejvyšší bod úseku v m');
  const durationMin = await askNumber('Doba trvání v minutách');
  const track = await askTrack();
  const notes = await askString('Poznámka');

  writeJsonEntry(
    'routes',
    id,
    clean({
      trip,
      mode,
      from,
      to,
      date: dateInfo?.date,
      datePrecision: dateInfo && dateInfo.datePrecision !== 'day' ? dateInfo.datePrecision : undefined,
      status,
      distanceKm,
      elevationGainM,
      maxElevationM,
      durationMin,
      track,
      notes,
    }),
  );
}

async function newPeak() {
  console.log('\n== Nový vrchol ==\n');
  const name = await askString('Název', { required: true });
  const id = await askString('ID souboru (slug)', { default: slugify(name) });
  const country = await askString('Země (ISO kód)', { required: true });
  const range = await askString('Pohoří');
  const elevation = await askNumber('Nadmořská výška v m');
  const coordinates = await askCoordinates('Souřadnice', { required: true });
  const description = await askString('Popis');
  const tags = await askList('Štítky');

  writeJsonEntry(
    'peaks',
    id,
    clean({ name, country: country.toUpperCase(), range, elevation, coordinates, description, tags }),
  );
}

async function newFerrata() {
  console.log('\n== Nová via ferrata ==\n');
  const name = await askString('Název', { required: true });
  const id = await askString('ID souboru (slug)', { default: slugify(name) });
  const country = await askString('Země (ISO kód)', { required: true });
  const area = await askString('Oblast');
  const difficulty = await askString('Obtížnost (volný text, např. B/C)');
  const targetPeak = await askRef('Cílový vrchol (peak ID, Enter = žádný)', 'peaks');
  const coordinates = await askCoordinates('Souřadnice startu (Enter, pokud nevíš)');
  const distanceKm = await askNumber('Délka v km');
  const elevationGainM = await askNumber('Převýšení v m');
  const description = await askString('Popis');
  const tags = await askList('Štítky');

  writeJsonEntry(
    'ferratas',
    id,
    clean({
      name,
      country: country.toUpperCase(),
      area,
      difficulty,
      targetPeak,
      coordinates,
      distanceKm,
      elevationGainM,
      description,
      tags,
    }),
  );
}

async function newRidge() {
  console.log('\n== Nová hřebenovka / přechod ==\n');
  const name = await askString('Název', { required: true });
  const id = await askString('ID souboru (slug)', { default: slugify(name) });
  const country = await askString('Země (ISO kód)', { required: true });
  const range = await askString('Pohoří');
  const coordinates = await askCoordinates('Souřadnice orientačního startu (Enter, pokud nevíš)');
  const distanceKm = await askNumber('Typická délka v km');
  const elevationGainM = await askNumber('Typické převýšení v m');
  const typicalDays = await askNumber('Typický počet dní');
  const description = await askString('Popis');
  const tags = await askList('Štítky');

  writeJsonEntry(
    'ridges',
    id,
    clean({ name, country: country.toUpperCase(), range, coordinates, distanceKm, elevationGainM, typicalDays, description, tags }),
  );
}

async function newAscent() {
  console.log('\n== Nový výstup / pokus ==\n');
  const trip = await askRef('Trip ID', 'trips', { required: true });
  const targetKind = await askEnum('Váže se na', ['peak', 'ferrata', 'ridge'], { required: true });
  const peak = targetKind === 'peak' ? await askRef('Peak ID', 'peaks', { required: true }) : undefined;
  const ferrata = targetKind === 'ferrata' ? await askRef('Ferrata ID', 'ferratas', { required: true }) : undefined;
  const ridge = targetKind === 'ridge' ? await askRef('Ridge ID', 'ridges', { required: true }) : undefined;
  const activityType = await askEnum('Typ aktivity', ['hike', 'ferrata', 'ridge', 'other'], {
    default: targetKind === 'peak' ? 'hike' : targetKind,
  });
  const result = await askEnum('Výsledek', ['summit', 'repeat_summit', 'not_completed', 'attempt'], { required: true });
  const id = await askString('ID souboru (slug)', { default: slugify(`${peak || ferrata || ridge}-${trip}`) });
  const dateInfo = await askDate('Datum');
  const from = await askRef('Výchozí místo (place ID, Enter = žádné)', 'places');
  const distanceKm = await askNumber('Vzdálenost v km');
  const elevationGainM = await askNumber('Převýšení v m');
  const elevationLossM = await askNumber('Klesání v m');
  const maxElevationM = await askNumber('Nejvyšší dosažený bod v m');
  const durationMin = await askNumber('Doba trvání v minutách');
  const days = await askNumber('Počet dní (u vícedenních přechodů)');
  const track = await askTrack();
  const notes = await askString('Poznámka');

  writeJsonEntry(
    'ascents',
    id,
    clean({
      trip,
      peak,
      ferrata,
      ridge,
      activityType,
      result,
      date: dateInfo?.date,
      datePrecision: dateInfo && dateInfo.datePrecision !== 'day' ? dateInfo.datePrecision : undefined,
      from,
      distanceKm,
      elevationGainM,
      elevationLossM,
      maxElevationM,
      durationMin,
      days,
      track,
      notes,
    }),
  );
}

const TYPES = {
  trip: newTrip,
  place: newPlace,
  route: newRoute,
  peak: newPeak,
  ferrata: newFerrata,
  ridge: newRidge,
  ascent: newAscent,
};

async function main() {
  const type = process.argv[2];
  const fn = TYPES[type];
  if (!fn) {
    console.log(`Použití: node scripts/new-entry.mjs <${Object.keys(TYPES).join('|')}>`);
    console.log('Nebo přes npm skripty: new:trip, new:place, new:route, new:peak, new:ferrata, new:ridge, new:ascent');
    process.exitCode = 1;
    rl.close();
    return;
  }
  try {
    await fn();
  } catch (err) {
    console.error(`\n✗ ${err instanceof Error ? err.message : err}`);
    process.exitCode = 1;
  } finally {
    rl.close();
  }
}

main();
