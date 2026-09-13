import {
  Map as MapLibreMap,
  NavigationControl,
  Popup,
  setWorkerUrl,
  type GeoJSONSource,
  type FilterSpecification,
  type ExpressionSpecification,
  type MapMouseEvent,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// MapLibre si jinak sestavuje URL svého web workeru za běhu z import.meta.url
// vlastního (zabaleného) chunku - ta po přebalení Vitem/Astrem neodpovídá
// skutečnosti. scripts/copy-maplibre-assets.mjs kopíruje worker (a jeho
// "shared" závislost, kterou si worker žádá jako sourozední soubor bez
// hashe) do public/, odkud je Astro servíruje na stabilní cestě.
setWorkerUrl(`${import.meta.env.BASE_URL}maplibre-gl-worker.mjs`);
import { MODE_COLORS, ACTIVITY_COLORS, PLACE_TYPE_COLORS, PEAK_SUMMITED_COLOR, PEAK_UNSUMMITED_COLOR } from '../colors';
import {
  TRANSPORT_LABELS,
  ACTIVITY_TYPE_LABELS,
  RESULT_LABELS,
  PLACE_TYPE_LABELS,
  TRACK_QUALITY_LABELS,
  formatKm,
  formatElevation,
} from '../format';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

// MapLibre přidává `features` do MapMouseEvent jen když posluchač visí na
// konkrétní vrstvě (map.on('click', layerId, ...)) - v .d.ts je to typované
// zvlášť jako MapLayerMouseEvent, který ale balíček neexportuje, takže si
// stejný tvar dopíšeme sami přes průnik typů.
type LayerClickEvent = MapMouseEvent & { features?: GeoJSON.Feature[] };

export type FilterCategory =
  | 'all'
  | 'foot'
  | 'car'
  | 'train'
  | 'bus'
  | 'hitchhike'
  | 'boat'
  | 'plane'
  | 'ferratas'
  | 'ridges'
  | 'cities'
  | 'peaks';

export interface TravelMapOptions {
  container: HTMLElement;
  /** Když je vyplněné, mapa se omezí jen na tuhle cestu (bez filtrů/legendy). */
  tripId?: string;
  interactive?: boolean;
  initialCategory?: FilterCategory;
  initialLandOnly?: boolean;
}

type PointFC = GeoJSON.FeatureCollection<GeoJSON.Point>;
type LineFC = GeoJSON.FeatureCollection<GeoJSON.LineString>;

const QUALITIES: Array<'gps' | 'reconstructed' | 'approximate'> = ['gps', 'reconstructed', 'approximate'];
const QUALITY_DASH: Record<string, number[] | undefined> = {
  gps: undefined,
  reconstructed: [3, 1.6],
  approximate: [1, 2.2],
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

function lineColorExpression(): ExpressionSpecification {
  return [
    'match',
    ['coalesce', ['get', 'activityType'], ['get', 'mode']],
    'ferrata', ACTIVITY_COLORS.ferrata,
    'ridge', ACTIVITY_COLORS.ridge,
    'hike', ACTIVITY_COLORS.hike,
    'foot', MODE_COLORS.foot,
    'car', MODE_COLORS.car,
    'train', MODE_COLORS.train,
    'bus', MODE_COLORS.bus,
    'hitchhike', MODE_COLORS.hitchhike,
    'boat', MODE_COLORS.boat,
    'plane', MODE_COLORS.plane,
    'mixed', MODE_COLORS.mixed,
    MODE_COLORS.mixed,
  ] as unknown as ExpressionSpecification;
}

function pointColorExpression(): ExpressionSpecification {
  return [
    'case',
    ['==', ['get', 'kind'], 'peak'],
    ['case', ['get', 'summited'], PEAK_SUMMITED_COLOR, PEAK_UNSUMMITED_COLOR],
    [
      'match',
      ['get', 'type'],
      'city', PLACE_TYPE_COLORS.city,
      'town', PLACE_TYPE_COLORS.town,
      'village', PLACE_TYPE_COLORS.village,
      'pass', PLACE_TYPE_COLORS.pass,
      'hut', PLACE_TYPE_COLORS.hut,
      'camp', PLACE_TYPE_COLORS.camp,
      'airport', PLACE_TYPE_COLORS.airport,
      'border', PLACE_TYPE_COLORS.border,
      PLACE_TYPE_COLORS.other,
    ],
  ] as unknown as ExpressionSpecification;
}

function lineCategoryFilter(category: FilterCategory): FilterSpecification {
  switch (category) {
    case 'foot':
      return ['any', ['==', ['get', 'mode'], 'foot'], ['==', ['get', 'activityType'], 'hike']] as FilterSpecification;
    case 'car':
    case 'train':
    case 'bus':
    case 'hitchhike':
    case 'boat':
    case 'plane':
      return ['==', ['get', 'mode'], category] as FilterSpecification;
    case 'ferratas':
      return ['==', ['get', 'activityType'], 'ferrata'] as FilterSpecification;
    case 'ridges':
      return ['==', ['get', 'activityType'], 'ridge'] as FilterSpecification;
    case 'cities':
    case 'peaks':
      return false as unknown as FilterSpecification;
    default:
      return true as unknown as FilterSpecification;
  }
}

// Body měst/vesnic a body vrcholů jedou ve DVOU oddělených zdrojích (viz
// addSourcesAndLayers) - MapLibre clustering totiž shlukuje na úrovni
// zdroje, bez ohledu na filtr vrstvy. Kdyby byly ve stejném zdroji, filtr
// "Hory" by uměl skrýt jednotlivé nashlukované body, ale ne shluk samotný
// (ten by dál ukazoval počet včetně měst).
function placeCategoryFilter(category: FilterCategory): FilterSpecification {
  if (category === 'peaks') return false as unknown as FilterSpecification;
  if (category === 'cities') {
    return ['in', ['get', 'type'], ['literal', ['city', 'town', 'village']]] as unknown as FilterSpecification;
  }
  return true as unknown as FilterSpecification;
}

function peakCategoryFilter(category: FilterCategory): FilterSpecification {
  if (category === 'cities') return false as unknown as FilterSpecification;
  return true as unknown as FilterSpecification;
}

function popupHtml(props: Record<string, unknown>): string {
  const kind = props.kind as string;
  if (kind === 'place' || kind === 'peak') {
    const name = escapeHtml(String(props.name ?? ''));
    const typeLabel = kind === 'peak' ? 'Vrchol' : (PLACE_TYPE_LABELS[String(props.type)] ?? String(props.type));
    const elevation = typeof props.elevation === 'number' ? ` · ${formatElevation(props.elevation)}` : '';
    const range = props.range ? ` · ${escapeHtml(String(props.range))}` : '';
    const summited = kind === 'peak' ? (props.summited ? ' · zdolán' : ' · zatím nezdolán') : '';
    return `<strong>${name}</strong><br><span class="popup-meta">${typeLabel}${elevation}${range}${summited}</span>`;
  }
  // linie: route nebo ascent
  const title =
    kind === 'ascent'
      ? escapeHtml(String(props.toName ?? ''))
      : `${escapeHtml(String(props.fromName ?? ''))} → ${escapeHtml(String(props.toName ?? ''))}`;
  const sub =
    kind === 'ascent'
      ? `${ACTIVITY_TYPE_LABELS[String(props.activityType)] ?? String(props.activityType)} · ${RESULT_LABELS[String(props.result)] ?? String(props.result)}`
      : TRANSPORT_LABELS[String(props.mode)] ?? String(props.mode);
  const dist = typeof props.distanceKm === 'number' ? ` · ${formatKm(props.distanceKm)}` : '';
  const quality = props.quality ? `<br><span class="popup-quality">${TRACK_QUALITY_LABELS[String(props.quality)] ?? ''}</span>` : '';
  return `<strong>${title}</strong><br><span class="popup-meta">${sub}${dist}</span>${quality}`;
}

export class TravelMap {
  private map: MapLibreMap;
  private popup: Popup;
  private category: FilterCategory;
  private landOnly: boolean;
  private ready: Promise<void>;

  constructor(private options: TravelMapOptions) {
    this.category = options.initialCategory ?? 'all';
    this.landOnly = options.initialLandOnly ?? false;
    this.map = new MapLibreMap({
      container: options.container,
      style: STYLE_URL,
      center: [15, 45],
      zoom: 4,
      attributionControl: { compact: true },
      interactive: options.interactive ?? true,
    });
    if (options.interactive ?? true) {
      this.map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    }
    this.popup = new Popup({ closeButton: false, maxWidth: '260px' });
    this.ready = new Promise((resolve) => this.map.on('load', () => resolve()));
  }

  async load(): Promise<void> {
    const [pointsRes, linesRes] = await Promise.all([fetch('/data/places.geojson'), fetch('/data/routes.geojson')]);
    let points: PointFC = await pointsRes.json();
    let lines: LineFC = await linesRes.json();

    if (this.options.tripId) {
      lines = { type: 'FeatureCollection', features: lines.features.filter((f) => f.properties?.trip === this.options.tripId) };
      const ids = new Set<string>();
      for (const f of lines.features) {
        if (f.properties?.from) ids.add(String(f.properties.from));
        if (f.properties?.to) ids.add(String(f.properties.to));
      }
      points = { type: 'FeatureCollection', features: points.features.filter((f) => ids.has(String(f.properties?.id))) };
    }

    await this.ready;
    const placePoints: PointFC = { type: 'FeatureCollection', features: points.features.filter((f) => f.properties?.kind !== 'peak') };
    const peakPoints: PointFC = { type: 'FeatureCollection', features: points.features.filter((f) => f.properties?.kind === 'peak') };
    this.addSourcesAndLayers(placePoints, peakPoints, lines);
    this.applyFilter();
    this.fitToData(points, lines);
    this.wireInteractions();
  }

  private addSourcesAndLayers(placePoints: PointFC, peakPoints: PointFC, lines: LineFC) {
    const map = this.map;
    map.addSource('lines', { type: 'geojson', data: lines });
    map.addSource('places', {
      type: 'geojson',
      data: placePoints,
      cluster: this.options.tripId ? false : true,
      clusterMaxZoom: 12,
      clusterRadius: 44,
    });
    map.addSource('peaks', { type: 'geojson', data: peakPoints });

    for (const quality of QUALITIES) {
      map.addLayer({
        id: `lines-${quality}`,
        type: 'line',
        source: 'lines',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': lineColorExpression(),
          'line-width': ['interpolate', ['linear'], ['zoom'], 5, 1.6, 10, 3, 15, 5],
          'line-opacity': quality === 'gps' ? 0.95 : quality === 'reconstructed' ? 0.85 : 0.6,
          ...(QUALITY_DASH[quality] ? { 'line-dasharray': QUALITY_DASH[quality] as number[] } : {}),
        },
      });
    }

    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'places',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#3d4a5c',
        'circle-opacity': 0.85,
        'circle-radius': ['step', ['get', 'point_count'], 14, 10, 18, 50, 24],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#f4efe6',
      },
    });
    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'places',
      filter: ['has', 'point_count'],
      layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 12, 'text-font': ['Noto Sans Bold'] },
      paint: { 'text-color': '#f4efe6' },
    });
    map.addLayer({
      id: 'unclustered-places',
      type: 'circle',
      source: 'places',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': pointColorExpression(),
        'circle-radius': 5.5,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#f4efe6',
      },
    });
    map.addLayer({
      id: 'peak-points',
      type: 'circle',
      source: 'peaks',
      paint: {
        'circle-color': pointColorExpression(),
        'circle-radius': 7,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#f4efe6',
      },
    });
  }

  private wireInteractions() {
    const map = this.map;
    const interactiveLayers = ['unclustered-places', 'peak-points', 'lines-gps', 'lines-reconstructed', 'lines-approximate'];

    for (const id of [...interactiveLayers, 'clusters']) {
      map.on('mouseenter', id, () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', id, () => (map.getCanvas().style.cursor = ''));
    }

    map.on('click', 'clusters', async (e: LayerClickEvent) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
      const clusterId = features[0]?.properties?.cluster_id;
      const source = map.getSource('places') as GeoJSONSource;
      if (clusterId === undefined) return;
      const zoom = await source.getClusterExpansionZoom(clusterId);
      const geom = features[0].geometry as GeoJSON.Point;
      map.easeTo({ center: geom.coordinates as [number, number], zoom });
    });

    for (const id of interactiveLayers) {
      map.on('click', id, (e: LayerClickEvent) => {
        const f = e.features?.[0];
        if (!f) return;
        const coords =
          f.geometry.type === 'Point' ? (f.geometry.coordinates as [number, number]) : (e.lngLat.toArray() as [number, number]);
        this.popup.setLngLat(coords).setHTML(popupHtml(f.properties ?? {})).addTo(map);
      });
    }
  }

  private fitToData(points: PointFC, lines: LineFC) {
    const coords: [number, number][] = [];
    for (const f of points.features) coords.push(f.geometry.coordinates as [number, number]);
    for (const f of lines.features) coords.push(...(f.geometry.coordinates as [number, number][]));
    if (coords.length === 0) return;
    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;
    for (const [lng, lat] of coords) {
      if (lng < minLng) minLng = lng;
      if (lat < minLat) minLat = lat;
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
    }
    this.map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: 48, maxZoom: 14, duration: 0 },
    );
  }

  setCategory(category: FilterCategory) {
    this.category = category;
    if (category === 'plane') this.landOnly = false;
    this.applyFilter();
  }

  setLandOnly(landOnly: boolean) {
    this.landOnly = landOnly;
    if (landOnly && this.category === 'plane') this.category = 'all';
    this.applyFilter();
  }

  private applyFilter() {
    if (!this.map.getLayer('lines-gps')) return;
    const catFilter = lineCategoryFilter(this.category);
    const landFilter: FilterSpecification = this.landOnly
      ? (['!=', ['get', 'mode'], 'plane'] as unknown as FilterSpecification)
      : (true as unknown as FilterSpecification);

    for (const quality of QUALITIES) {
      const qualityFilter = ['==', ['get', 'quality'], quality] as unknown as FilterSpecification;
      this.map.setFilter(`lines-${quality}`, ['all', qualityFilter, catFilter, landFilter] as unknown as FilterSpecification);
    }

    const placeFilter = placeCategoryFilter(this.category);
    this.map.setFilter('unclustered-places', ['all', ['!', ['has', 'point_count']], placeFilter] as unknown as FilterSpecification);
    // Shluky nemají jednotlivé vlastnosti (type/kind) svých členů, takže je
    // nejde filtrovat na podtyp "města" - jde je jen schovat úplně, když
    // aktuální kategorie město/vesnici vůbec nezobrazuje (filtr "Hory").
    const clustersVisible = this.category !== 'peaks';
    this.map.setFilter('clusters', ['all', ['has', 'point_count'], clustersVisible] as unknown as FilterSpecification);
    this.map.setFilter('cluster-count', ['all', ['has', 'point_count'], clustersVisible] as unknown as FilterSpecification);
    this.map.setFilter('peak-points', peakCategoryFilter(this.category));
  }

  getMaplibreMap(): MapLibreMap {
    return this.map;
  }
}
