import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * DATOVÝ MODEL CESTOVATELSKÉHO ATLASU
 * ------------------------------------
 * Cestovatelská vrstva (kam a jak jsem se přesunul):
 *  - trips  = velké výpravy - deštník, pod který patří místa, trasy i výstupy
 *  - places = obecný bod na mapě (město, vesnice, sedlo, chata, letiště...)
 *  - routes = přesun mezi dvěma místy libovolným dopravním prostředkem
 *
 * Horská vrstva (co jsem zkusil/zdolal) - záměrně odděluje OBJEKT od NÁVŠTĚVY,
 * protože na stejný vrchol/ferratu/hřebenovku se dá vrátit vícekrát a výsledek
 * se může lišit (dřív neúspěšný pokus, později úspěšný výstup):
 *  - peaks    = OBJEKT: konkrétní vrchol (jméno, pohoří, výška, souřadnice)
 *  - ferratas = OBJEKT: konkrétní via ferrata (obtížnost, oblast, cílový vrchol)
 *  - ridges   = OBJEKT: konkrétní hřebenovka/přechod
 *  - ascents  = UDÁLOST: jeden konkrétní výstup/pokus, vázaný na trip a na
 *               peak/ferratu/ridge (stejný objekt může mít víc ascents v čase)
 *
 * Podrobné zdůvodnění, konvence a pravidla pro doplňování dat viz
 * docs/ARCHITEKTURA.md a docs/PRIDAVANI_DAT.md.
 */

const ISO_COUNTRY = /^[A-Z]{2}$/;
const countryCode = () => z.string().regex(ISO_COUNTRY, 'Očekávám ISO 3166-1 alpha-2 kód, např. "ME"');

// [lng, lat] - GeoJSON pořadí (ne lat/lng!)
const lngLat = () => z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);

// "day" = plné datum jistý, "month"/"year" = jistá jen hrubší granularita
// (den, případně i měsíc, je jen technický placeholder v datu). Používá se
// všude, kde datum může u starších cest chybět v plné přesnosti.
const datePrecisionField = () => z.enum(['day', 'month', 'year']).default('day');

export const TRACK_QUALITIES = [
  'gps', // přesná GPS stopa (GPX/TCX soubor)
  'reconstructed', // ručně sestavená podle známých cest/bodů
  'approximate', // jen orientační průběh
] as const;

const trackSchema = () =>
  z.object({
    quality: z.enum(TRACK_QUALITIES),
    // Jméno souboru (bez přípony) v data/gpx/, zpracované scripts/build-tracks.mjs
    // do public/tracks/<file>.geojson. Nechat prázdné, pokud GPS není k dispozici.
    file: z.string().optional(),
    // Ruční "orientační"/"rekonstruovaná" linie, pokud nemáš/nechceš GPX.
    // Když chybí i tohle, web dokreslí rovnou čáru mezi from/cílem a vizuálně
    // ji odliší (tečkovaně), takže na mapě nic "nechybí", jen je to nepřesné.
    coordinates: z.array(lngLat()).optional(),
  });

export const PLACE_TYPES = [
  'city', // velké město
  'town', // menší město
  'village', // vesnice
  'pass', // sedlo/průsmyk
  'hut', // chata/bouda
  'camp', // tábořiště / kemp
  'poi', // obecný zajímavý bod
  'airport', // letiště
  'border', // hraniční přechod
  'castle', // hrad/zámek/zřícenina
  'zoo', // zoo/safari park
  'other',
] as const;

export const TRANSPORT_MODES = [
  'foot', // pěšky
  'car', // auto
  'train', // vlak
  'bus', // autobus
  'hitchhike', // odvoz / stop
  'boat', // loď
  'plane', // letadlo
  'mixed', // kombinace pozemní dopravy, kde přesný poměr není znám (viz ARCHITEKTURA.md)
] as const;

export const ASCENT_RESULTS = [
  'summit', // cíl dosažen (vrchol / konec ferraty / dokončený přechod)
  'repeat_summit', // cíl dosažen znovu, po dřívějším úspěšném výstupu
  'not_completed', // pokus, cíl nedosažen (návrat, počasí, zranění, zvěř na trase...)
  'attempt', // pokus bez jednoznačně uzavřeného výsledku
] as const;

export const ASCENT_ACTIVITY_TYPES = [
  'hike', // pěší výstup
  'ferrata', // via ferrata
  'ridge', // hřebenovka / přechod
  'other',
] as const;

// --- Cestovatelská vrstva ---------------------------------------------

const trips = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/trips' }),
  schema: z.object({
    title: z.string(),
    dateStart: z.coerce.date(),
    datePrecision: datePrecisionField(),
    // chybí = cesta ještě neskončila (status "ongoing"/"planned")
    dateEnd: z.coerce.date().optional(),
    status: z.enum(['planned', 'ongoing', 'completed']).default('completed'),
    // Země, kterými cesta skutečně prošla - ne země, kterých se jen "dotkla" na mapě.
    countries: z.array(countryCode()).min(1),
    summary: z.string().optional(),
    cover: z.string().optional(),
    photos: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    // Jména/přezdívky spolucestovatelů na celé výpravě - volný text jako u tags,
    // viz src/lib/people.ts (slugifikace pro /lide). Pokud se lidé liší podle
    // konkrétního výstupu v rámci výpravy, upřesni to v ascents.companions.
    companions: z.array(z.string()).default([]),
  }),
});

const places = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml,json}', base: './src/content/places' }),
  schema: z.object({
    name: z.string(),
    country: countryCode(),
    type: z.enum(PLACE_TYPES),
    // Jen u type: 'city' - hlavní město státu (ne kraje/regionu). Sporné
    // případy (Jeruzalém/Tel Aviv, Haag vs. Amsterdam) řešeny individuálně,
    // ne automaticky.
    capital: z.boolean().default(false),
    coordinates: lngLat(),
    // Nadmořská výška - pokud není jistá, radši nevyplňovat než odhadovat.
    elevation: z.number().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

const routes = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml,json}', base: './src/content/routes' }),
  schema: z.object({
    trip: reference('trips'),
    mode: z.enum(TRANSPORT_MODES),
    from: reference('places'),
    to: reference('places'),
    date: z.coerce.date().optional(),
    datePrecision: datePrecisionField(),
    status: z.enum(['completed', 'planned']).default('completed'),
    // Číselné statistiky úseku - VŠECHNY nepovinné. Když číslo neznáš, nech
    // pole prázdné - statistiky pak úsek vynechají a jasně označí částečný
    // součet, nikdy si nic nedopočítávají samy.
    distanceKm: z.number().positive().optional(),
    elevationGainM: z.number().nonnegative().optional(),
    maxElevationM: z.number().optional(),
    durationMin: z.number().positive().optional(),
    track: trackSchema().optional(),
    notes: z.string().optional(),
    photos: z.array(z.string()).default([]),
  }),
});

// --- Horská vrstva: OBJEKTY ---------------------------------------------

const peaks = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml,json}', base: './src/content/peaks' }),
  schema: z.object({
    name: z.string(),
    country: countryCode(),
    range: z.string().optional(), // pohoří, např. "Dinárské hory"
    elevation: z.number().optional(),
    coordinates: lngLat(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

const ferratas = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml,json}', base: './src/content/ferratas' }),
  schema: z.object({
    name: z.string(),
    country: countryCode(),
    area: z.string().optional(), // oblast, např. "Dolomity"
    // Volný text záměrně - stupnice obtížnosti (Hüsler A-E, francouzská,
    // dolomitská...) se liší podle země a nemá smysl je vměstnávat do jedné enum.
    difficulty: z.string().optional(),
    targetPeak: reference('peaks').optional(),
    coordinates: lngLat().optional(), // start ferraty
    // Délka/převýšení ferraty jako fixní vlastnost trasy (na rozdíl od
    // konkrétního výstupu - ten má svoje durationMin v ascents).
    distanceKm: z.number().positive().optional(),
    elevationGainM: z.number().nonnegative().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

const ridges = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml,json}', base: './src/content/ridges' }),
  schema: z.object({
    name: z.string(),
    country: countryCode(),
    range: z.string().optional(),
    coordinates: lngLat().optional(), // orientační počátek
    // Typické/plánované parametry trasy - konkrétní zdolaný přechod má svoje
    // vlastní hodnoty v ascents (typicallyDays vs. skutečné days apod.).
    distanceKm: z.number().positive().optional(),
    elevationGainM: z.number().nonnegative().optional(),
    typicalDays: z.number().positive().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

// --- Horská vrstva: UDÁLOSTI ---------------------------------------------

const ascents = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml,json}', base: './src/content/ascents' }),
  schema: z.object({
    trip: reference('trips'),
    // Aspoň jedno z peak/ferrata/ridge by mělo být vyplněné - viz
    // docs/ARCHITEKTURA.md (Zod to nevynucuje, aby nekomplikoval reference()).
    peak: reference('peaks').optional(),
    ferrata: reference('ferratas').optional(),
    ridge: reference('ridges').optional(),
    activityType: z.enum(ASCENT_ACTIVITY_TYPES).default('hike'),
    result: z.enum(ASCENT_RESULTS),
    date: z.coerce.date().optional(),
    datePrecision: datePrecisionField(),
    from: reference('places').optional(), // výchozí bod výstupu
    distanceKm: z.number().positive().optional(),
    elevationGainM: z.number().nonnegative().optional(),
    elevationLossM: z.number().nonnegative().optional(),
    maxElevationM: z.number().optional(),
    durationMin: z.number().positive().optional(),
    days: z.number().positive().optional(), // pro vícedenní hřebenovky/přechody
    track: trackSchema().optional(),
    notes: z.string().optional(),
    photos: z.array(z.string()).default([]),
    // Nepovinné - jen když se společníci na tomto konkrétním výstupu liší od
    // trip.companions (např. sólo vrchol uprostřed jinak skupinové výpravy).
    companions: z.array(z.string()).default([]),
  }),
});

export const collections = { trips, places, routes, peaks, ferratas, ridges, ascents };
