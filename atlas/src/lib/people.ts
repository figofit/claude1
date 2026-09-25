import type { CollectionEntry } from 'astro:content';

// Spolucestovníci nejsou samostatná kolekce (podobně jako tags) - jen volný
// text na trips/ascents. Tady se z toho textu při buildu poskládá rejstřík
// pro /lide. Jméno je vždy to, co je zapsané v datech - žádná kanonizace
// přezdívek navíc, takže konzistence záleží na tom, jak se jméno píše
// v jednotlivých .md/.yaml souborech.
export function slugifyPerson(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface CompanionSummary {
  slug: string;
  name: string;
  tripIds: Set<string>;
  ascentIds: Set<string>;
}

/**
 * Sesbírá spolucestovníky z trips.companions i ascents.companions do jednoho
 * rejstříku podle slugu. Výstup výpravy dědí i jména z trip.companions (ta
 * platí pro celou výpravu), pokud samotný výstup nemá vlastní, užší seznam.
 */
export function getCompanions(data: { trips: CollectionEntry<'trips'>[]; ascents: CollectionEntry<'ascents'>[] }): Map<string, CompanionSummary> {
  const map = new Map<string, CompanionSummary>();

  const add = (name: string, kind: 'trip' | 'ascent', id: string) => {
    const slug = slugifyPerson(name);
    if (!slug) return;
    if (!map.has(slug)) map.set(slug, { slug, name, tripIds: new Set(), ascentIds: new Set() });
    const entry = map.get(slug)!;
    if (kind === 'trip') entry.tripIds.add(id);
    else entry.ascentIds.add(id);
  };

  for (const t of data.trips) for (const c of t.data.companions) add(c, 'trip', t.id);
  for (const a of data.ascents) {
    const names = a.data.companions.length > 0 ? a.data.companions : (data.trips.find((t) => t.id === a.data.trip.id)?.data.companions ?? []);
    for (const c of names) add(c, 'ascent', a.id);
  }

  return map;
}

export function sortCompanions(map: Map<string, CompanionSummary>): CompanionSummary[] {
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'cs'));
}
