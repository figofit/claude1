// Výpočet dlouhodobých statistik ze všech kolekcí najednou.
//
// Základní pravidlo celého modulu: NIKDY nedopočítávat chybějící čísla.
// Když u záznamu chybí distanceKm/elevationGainM/..., ten záznam se do
// součtu prostě nezapočítá a součet se označí jako částečný (complete: false)
// - UI to pak zobrazí s hvězdičkou/poznámkou místo tiše špatného čísla.

export interface PartialSum {
  value: number;
  complete: boolean;
  missing: number;
}

interface Ref {
  id: string;
}
interface EntryLike<T> {
  id: string;
  data: T;
}

interface TripData {
  dateStart: Date;
  countries: string[];
  status: 'planned' | 'ongoing' | 'completed';
}
interface PlaceData {
  type: string;
  elevation?: number;
  capital?: boolean;
  island?: string;
}
interface RouteData {
  mode: string;
  from: Ref;
  to: Ref;
  distanceKm?: number;
  elevationGainM?: number;
  maxElevationM?: number;
}
interface PeakData {
  elevation?: number;
  island?: string;
}
interface AscentData {
  peak?: Ref;
  ferrata?: Ref;
  ridge?: Ref;
  result: 'summit' | 'repeat_summit' | 'not_completed' | 'attempt';
  from?: Ref;
  distanceKm?: number;
  elevationGainM?: number;
  maxElevationM?: number;
}

export interface StatsInput {
  trips: EntryLike<TripData>[];
  places: EntryLike<PlaceData>[];
  routes: EntryLike<RouteData>[];
  peaks: EntryLike<PeakData>[];
  ferratas: EntryLike<Record<string, unknown>>[];
  ridges: EntryLike<Record<string, unknown>>[];
  ascents: EntryLike<AscentData>[];
}

const SUMMIT_RESULTS = new Set(['summit', 'repeat_summit']);
const LAND_TRANSPORT_MODES = ['foot', 'car', 'train', 'bus', 'hitchhike', 'boat', 'mixed'];

function sum(values: (number | undefined)[]): PartialSum {
  let value = 0;
  let missing = 0;
  let total = 0;
  for (const v of values) {
    total += 1;
    if (v === undefined || v === null || Number.isNaN(v)) {
      missing += 1;
    } else {
      value += v;
    }
  }
  return { value, complete: missing === 0, missing };
}

export interface AtlasStats {
  countriesVisited: string[];
  citiesCount: number;
  capitalsCount: number;
  castlesCount: number;
  zoosCount: number;
  airportsCount: number;
  islandsCount: number;
  peaksCount: number;
  peaksCatalogCount: number;
  ferratasCount: number;
  ferratasCatalogCount: number;
  ridgesCount: number;
  ridgesCatalogCount: number;
  tripsCount: number;
  ascentsCount: number;
  kmFoot: PartialSum;
  kmCar: PartialSum;
  kmTrain: PartialSum;
  kmBus: PartialSum;
  kmOtherLand: PartialSum;
  kmBoat: PartialSum;
  kmAir: PartialSum;
  elevationGainFoot: PartialSum;
  highestPointM: number | undefined;
  tripsByYear: { year: number; count: number }[];
  countriesByTrips: { country: string; count: number }[];
}

export function computeStats(input: StatsInput): AtlasStats {
  const { trips, places, routes, peaks, ferratas, ridges, ascents } = input;

  const visitedPlaceIds = new Set<string>();
  for (const r of routes) {
    visitedPlaceIds.add(r.data.from.id);
    visitedPlaceIds.add(r.data.to.id);
  }
  for (const a of ascents) {
    if (a.data.from) visitedPlaceIds.add(a.data.from.id);
  }
  const citiesCount = places.filter(
    (p) => visitedPlaceIds.has(p.id) && ['city', 'town', 'village'].includes(p.data.type),
  ).length;
  // Hlavní města jsou podmnožina měst - platí pro ně stejné pravidlo jako
  // pro citiesCount (počítá se, jen když je město skutečně navštívené přes
  // routes/ascents, ne jen zmíněné v katalogu).
  const capitalsCount = places.filter((p) => visitedPlaceIds.has(p.id) && p.data.capital).length;
  // Hrady a zoo se do katalogu přidávají jen tehdy, když byly skutečně
  // navštívené (na rozdíl od měst nejde o průjezdní body) - proto se tu
  // nefiltruje přes visitedPlaceIds a počítá se celý katalog.
  const castlesCount = places.filter((p) => p.data.type === 'castle').length;
  const zoosCount = places.filter((p) => p.data.type === 'zoo').length;

  // "Letiště" nejsou v datech samostatný bod (lety se vedou město-město) -
  // počítá se tedy počet různých míst použitých jako from/to letecké trasy,
  // což je nejbližší poctivá aproximace bez vymýšlení konkrétních IATA kódů.
  const airportPlaceIds = new Set<string>();
  for (const r of routes) {
    if (r.data.mode === 'plane') {
      airportPlaceIds.add(r.data.from.id);
      airportPlaceIds.add(r.data.to.id);
    }
  }
  const airportsCount = airportPlaceIds.size;

  const summitedPeakIds = new Set(
    ascents.filter((a) => a.data.peak && SUMMIT_RESULTS.has(a.data.result)).map((a) => a.data.peak!.id),
  );

  // Ostrov je navštívený, když je na něm buď skutečně navštívené místo
  // (přes visitedPlaceIds), nebo zdolaný vrchol na něm ležící.
  const peaksById = new Map(peaks.map((p) => [p.id, p.data]));
  const visitedIslands = new Set<string>();
  for (const p of places) {
    if (p.data.island && visitedPlaceIds.has(p.id)) visitedIslands.add(p.data.island);
  }
  for (const peakId of summitedPeakIds) {
    const island = peaksById.get(peakId)?.island;
    if (island) visitedIslands.add(island);
  }
  const islandsCount = visitedIslands.size;

  const summitedFerrataIds = new Set(
    ascents.filter((a) => a.data.ferrata && SUMMIT_RESULTS.has(a.data.result)).map((a) => a.data.ferrata!.id),
  );
  const summitedRidgeIds = new Set(
    ascents.filter((a) => a.data.ridge && SUMMIT_RESULTS.has(a.data.result)).map((a) => a.data.ridge!.id),
  );

  const footRoutes = routes.filter((r) => r.data.mode === 'foot');
  const kmFoot = sum([...footRoutes.map((r) => r.data.distanceKm), ...ascents.map((a) => a.data.distanceKm)]);
  const kmCar = sum(routes.filter((r) => r.data.mode === 'car').map((r) => r.data.distanceKm));
  const kmTrain = sum(routes.filter((r) => r.data.mode === 'train').map((r) => r.data.distanceKm));
  const kmBus = sum(routes.filter((r) => r.data.mode === 'bus').map((r) => r.data.distanceKm));
  const kmOtherLand = sum(
    routes.filter((r) => r.data.mode === 'hitchhike' || r.data.mode === 'mixed').map((r) => r.data.distanceKm),
  );
  const kmBoat = sum(routes.filter((r) => r.data.mode === 'boat').map((r) => r.data.distanceKm));
  const kmAir = sum(routes.filter((r) => r.data.mode === 'plane').map((r) => r.data.distanceKm));

  const elevationGainFoot = sum([
    ...footRoutes.map((r) => r.data.elevationGainM),
    ...ascents.map((a) => a.data.elevationGainM),
  ]);

  const effectiveAscentMaxElevation = (a: EntryLike<AscentData>): number | undefined => {
    if (a.data.maxElevationM !== undefined) return a.data.maxElevationM;
    if (a.data.peak && SUMMIT_RESULTS.has(a.data.result)) {
      return peaksById.get(a.data.peak.id)?.elevation;
    }
    return undefined;
  };
  const candidateElevations: number[] = [
    ...routes.map((r) => r.data.maxElevationM),
    ...ascents.map(effectiveAscentMaxElevation),
    ...places.filter((p) => visitedPlaceIds.has(p.id)).map((p) => p.data.elevation),
  ].filter((v): v is number => v !== undefined);
  const highestPointM = candidateElevations.length > 0 ? Math.max(...candidateElevations) : undefined;

  const yearCounts = new Map<number, number>();
  for (const t of trips) {
    const year = t.data.dateStart.getFullYear();
    yearCounts.set(year, (yearCounts.get(year) ?? 0) + 1);
  }
  const tripsByYear = [...yearCounts.entries()]
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year);

  const countryTripCounts = new Map<string, number>();
  for (const t of trips) {
    for (const c of t.data.countries) {
      countryTripCounts.set(c, (countryTripCounts.get(c) ?? 0) + 1);
    }
  }
  const countriesByTrips = [...countryTripCounts.entries()]
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);

  return {
    countriesVisited: [...countryTripCounts.keys()].sort(),
    citiesCount,
    capitalsCount,
    castlesCount,
    zoosCount,
    airportsCount,
    islandsCount,
    peaksCount: summitedPeakIds.size,
    peaksCatalogCount: peaks.length,
    ferratasCount: summitedFerrataIds.size,
    ferratasCatalogCount: ferratas.length,
    ridgesCount: summitedRidgeIds.size,
    ridgesCatalogCount: ridges.length,
    tripsCount: trips.length,
    ascentsCount: ascents.length,
    kmFoot,
    kmCar,
    kmTrain,
    kmBus,
    kmOtherLand,
    kmBoat,
    kmAir,
    elevationGainFoot,
    highestPointM,
    tripsByYear,
    countriesByTrips,
  };
}

export { LAND_TRANSPORT_MODES, SUMMIT_RESULTS };
