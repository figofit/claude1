import type { APIRoute } from 'astro';
import { getAtlasData, isSummitResult } from '../../lib/content';
import { featureCollection, pointFeature } from '../../lib/geo';

export const prerender = true;

// Statický GeoJSON bodů (obecná místa + vrcholy) - generovaný při buildu ze
// content collections. Mapa na klientovi ho jen fetchne a filtruje v prohlížeči.
export const GET: APIRoute = async () => {
  const { places, peaks, ascents } = await getAtlasData();

  const summitedPeakIds = new Set(
    ascents.filter((a) => a.data.peak && isSummitResult(a.data.result)).map((a) => a.data.peak!.id),
  );

  const placeFeatures = places.map((p) =>
    pointFeature(p.data.coordinates, {
      id: p.id,
      name: p.data.name,
      kind: 'place',
      type: p.data.type,
      country: p.data.country,
      elevation: p.data.elevation ?? null,
      description: p.data.description ?? null,
    }),
  );

  const peakFeatures = peaks.map((p) =>
    pointFeature(p.data.coordinates, {
      id: p.id,
      name: p.data.name,
      kind: 'peak',
      type: 'peak',
      country: p.data.country,
      range: p.data.range ?? null,
      elevation: p.data.elevation ?? null,
      summited: summitedPeakIds.has(p.id),
      description: p.data.description ?? null,
    }),
  );

  const fc = featureCollection([...placeFeatures, ...peakFeatures]);
  return new Response(JSON.stringify(fc), {
    headers: { 'Content-Type': 'application/geo+json' },
  });
};
