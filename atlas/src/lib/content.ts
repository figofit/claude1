import { getCollection, type CollectionEntry } from 'astro:content';

/** Načte všech 7 kolekcí najednou - používá se na většině stránek a v data endpointech. */
export async function getAtlasData() {
  const [trips, places, routes, peaks, ferratas, ridges, ascents] = await Promise.all([
    getCollection('trips'),
    getCollection('places'),
    getCollection('routes'),
    getCollection('peaks'),
    getCollection('ferratas'),
    getCollection('ridges'),
    getCollection('ascents'),
  ]);
  return { trips, places, routes, peaks, ferratas, ridges, ascents };
}

export function byId<T extends { id: string }>(entries: T[]): Map<string, T> {
  return new Map(entries.map((e) => [e.id, e]));
}

export function sortTripsByDate<T extends CollectionEntry<'trips'>>(trips: T[]): T[] {
  return [...trips].sort((a, b) => b.data.dateStart.getTime() - a.data.dateStart.getTime());
}

export function sortByDateDesc<T extends { data: { date?: Date } }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => (b.data.date?.getTime() ?? 0) - (a.data.date?.getTime() ?? 0));
}

export const SUMMIT_RESULTS = new Set(['summit', 'repeat_summit']);

export function isSummitResult(result: string): boolean {
  return SUMMIT_RESULTS.has(result);
}
