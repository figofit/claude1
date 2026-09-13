import type { APIRoute } from 'astro';
import { getAtlasData, byId } from '../../lib/content';
import { featureCollection, lineStringFeature, resolveGeometry, type LngLat } from '../../lib/geo';

export const prerender = true;

// Statický GeoJSON čar - obyčejné přesuny (routes) i horské výstupy/pokusy
// (ascents) v jedné vrstvě, se sjednocenými vlastnostmi pro filtrování na mapě.
export const GET: APIRoute = async () => {
  const { routes, ascents, places, peaks, ferratas, ridges } = await getAtlasData();

  const placesById = byId(places);
  const peaksById = byId(peaks);
  const ferratasById = byId(ferratas);
  const ridgesById = byId(ridges);

  const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];

  for (const r of routes) {
    const from = placesById.get(r.data.from.id);
    const to = placesById.get(r.data.to.id);
    const geom = resolveGeometry(r.data.track, from?.data.coordinates, to?.data.coordinates);
    if (!geom) continue;
    features.push(
      lineStringFeature(geom.coordinates, {
        id: r.id,
        trip: r.data.trip.id,
        kind: 'route',
        mode: r.data.mode,
        status: r.data.status,
        quality: geom.quality,
        isFallbackLine: geom.isFallbackLine,
        distanceKm: r.data.distanceKm ?? null,
        elevationGainM: r.data.elevationGainM ?? null,
        maxElevationM: r.data.maxElevationM ?? null,
        date: r.data.date?.toISOString() ?? null,
        datePrecision: r.data.datePrecision,
        from: r.data.from.id,
        fromName: from?.data.name ?? r.data.from.id,
        to: r.data.to.id,
        toName: to?.data.name ?? r.data.to.id,
        toKind: 'place',
        notes: r.data.notes ?? null,
      }),
    );
  }

  for (const a of ascents) {
    const from = a.data.from ? placesById.get(a.data.from.id) : undefined;
    let toCoords: LngLat | undefined;
    let toId: string | undefined;
    let toName: string | undefined;
    let toKind: string | undefined;

    if (a.data.peak) {
      const peak = peaksById.get(a.data.peak.id);
      toCoords = peak?.data.coordinates;
      toId = a.data.peak.id;
      toName = peak?.data.name;
      toKind = 'peak';
    } else if (a.data.ferrata) {
      const fer = ferratasById.get(a.data.ferrata.id);
      toCoords = fer?.data.coordinates;
      toId = a.data.ferrata.id;
      toName = fer?.data.name;
      toKind = 'ferrata';
    } else if (a.data.ridge) {
      const ridge = ridgesById.get(a.data.ridge.id);
      toCoords = ridge?.data.coordinates;
      toId = a.data.ridge.id;
      toName = ridge?.data.name;
      toKind = 'ridge';
    }

    const geom = resolveGeometry(a.data.track, from?.data.coordinates, toCoords);
    if (!geom) continue;

    features.push(
      lineStringFeature(geom.coordinates, {
        id: a.id,
        trip: a.data.trip.id,
        kind: 'ascent',
        activityType: a.data.activityType,
        result: a.data.result,
        quality: geom.quality,
        isFallbackLine: geom.isFallbackLine,
        distanceKm: a.data.distanceKm ?? null,
        elevationGainM: a.data.elevationGainM ?? null,
        maxElevationM: a.data.maxElevationM ?? null,
        date: a.data.date?.toISOString() ?? null,
        datePrecision: a.data.datePrecision,
        from: a.data.from?.id ?? null,
        fromName: from?.data.name ?? null,
        to: toId ?? null,
        toName: toName ?? null,
        toKind: toKind ?? null,
        notes: a.data.notes ?? null,
      }),
    );
  }

  const fc = featureCollection(features);
  return new Response(JSON.stringify(fc), {
    headers: { 'Content-Type': 'application/geo+json' },
  });
};
