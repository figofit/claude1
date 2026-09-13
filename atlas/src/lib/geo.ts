import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export type LngLat = [number, number];
export type TrackQuality = 'gps' | 'reconstructed' | 'approximate';

export interface TrackRef {
  quality: TrackQuality;
  file?: string;
  coordinates?: LngLat[];
}

export interface ResolvedGeometry {
  coordinates: LngLat[];
  quality: TrackQuality;
  /** true = žádná skutečná trasa nebyla k dispozici, dokreslili jsme rovnou čáru mezi body */
  isFallbackLine: boolean;
}

const tracksDir = fileURLToPath(new URL('../../public/tracks/', import.meta.url));
const trackCache = new Map<string, LngLat[] | null>();

/** Načte předzpracovaný GeoJSON (viz scripts/build-tracks.mjs) pro danou GPX/TCX stopu. */
function loadTrackGeoJSON(file: string): LngLat[] | null {
  if (trackCache.has(file)) return trackCache.get(file)!;
  const path = `${tracksDir}${file}.geojson`;
  if (!existsSync(path)) {
    trackCache.set(file, null);
    return null;
  }
  try {
    const raw = JSON.parse(readFileSync(path, 'utf-8'));
    const geom = raw.type === 'FeatureCollection' ? raw.features[0]?.geometry : raw.type === 'Feature' ? raw.geometry : raw;
    const coords: LngLat[] | undefined = geom?.type === 'LineString' ? geom.coordinates : undefined;
    const result = coords && coords.length >= 2 ? coords : null;
    trackCache.set(file, result);
    return result;
  } catch {
    trackCache.set(file, null);
    return null;
  }
}

/**
 * Vyřeší, jakou čáru pro daný úsek/výstup vykreslit - v pořadí priorit:
 * 1) zpracovaná GPX/TCX stopa, 2) ruční coordinates v datech, 3) rovná čára
 * mezi start/cíl bodem (jasně označená jako isFallbackLine, mapa ji kreslí tečkovaně).
 */
export function resolveGeometry(
  track: TrackRef | undefined,
  fromCoords: LngLat | undefined,
  toCoords: LngLat | undefined,
): ResolvedGeometry | null {
  if (track?.file) {
    const coords = loadTrackGeoJSON(track.file);
    if (coords) return { coordinates: coords, quality: track.quality, isFallbackLine: false };
  }
  if (track?.coordinates && track.coordinates.length >= 2) {
    return { coordinates: track.coordinates, quality: track.quality, isFallbackLine: false };
  }
  if (fromCoords && toCoords) {
    return { coordinates: [fromCoords, toCoords], quality: track?.quality ?? 'approximate', isFallbackLine: true };
  }
  return null;
}

/** Vzdálenost "vzdušnou čarou" mezi dvěma body v km - Haviverzínův vzorec.
 * Pozor: NIKDY nepoužívat jako náhradu za skutečnou (ušlou/ujetou) distanceKm
 * ve statistikách - jen jako doplňkový, jasně označený odhad na mapě. */
export function haversineKm(a: LngLat, b: LngLat): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function lineStringFeature(
  coordinates: LngLat[],
  properties: Record<string, unknown>,
): GeoJSON.Feature<GeoJSON.LineString> {
  return { type: 'Feature', geometry: { type: 'LineString', coordinates }, properties };
}

export function pointFeature(
  coordinates: LngLat,
  properties: Record<string, unknown>,
): GeoJSON.Feature<GeoJSON.Point> {
  return { type: 'Feature', geometry: { type: 'Point', coordinates }, properties };
}

export function featureCollection<G extends GeoJSON.Geometry>(
  features: GeoJSON.Feature<G>[],
): GeoJSON.FeatureCollection<G> {
  return { type: 'FeatureCollection', features };
}
