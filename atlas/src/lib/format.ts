// Formátovací pomůcky - centralizované na jednom místě, aby "neuvedeno"
// (chybějící číslo) vypadalo všude na webu stejně a aby čeština (skloňování,
// jednotky) nebyla rozesetá po komponentách.

export type DatePrecision = 'day' | 'month' | 'year';

const numberFmt = new Intl.NumberFormat('cs-CZ');
const dayFmt = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
const monthFmt = new Intl.DateTimeFormat('cs-CZ', { month: 'long', year: 'numeric' });
const yearFmt = new Intl.DateTimeFormat('cs-CZ', { year: 'numeric' });
const pluralRules = new Intl.PluralRules('cs-CZ');

export const NEZNAMO = 'neuvedeno';

/** Formátuje datum podle deklarované přesnosti ("5. září 2026" / "září 2026" / "2026"). */
export function formatDate(date: Date | undefined, precision: DatePrecision = 'day'): string {
  if (!date) return NEZNAMO;
  if (precision === 'year') return yearFmt.format(date);
  if (precision === 'month') return monthFmt.format(date);
  return dayFmt.format(date);
}

/** Rozsah dat pro výpravu - řeší i probíhající/neukončené cesty. */
export function formatDateRange(
  start: Date | undefined,
  end: Date | undefined,
  precision: DatePrecision = 'day',
): string {
  if (!start) return NEZNAMO;
  const startLabel = formatDate(start, precision);
  if (!end) return `od ${startLabel} (probíhá)`;
  const endLabel = formatDate(end, precision);
  return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
}

export function formatYear(date: Date | undefined): string {
  return date ? yearFmt.format(date) : NEZNAMO;
}

export function formatKm(value: number | undefined, opts: { digits?: number } = {}): string {
  if (value === undefined || value === null || Number.isNaN(value)) return NEZNAMO;
  const digits = opts.digits ?? (value < 10 ? 1 : 0);
  return `${numberFmt.format(Number(value.toFixed(digits)))} km`;
}

export function formatMeters(value: number | undefined): string {
  if (value === undefined || value === null || Number.isNaN(value)) return NEZNAMO;
  return `${numberFmt.format(Math.round(value))} m`;
}

export function formatElevation(value: number | undefined): string {
  if (value === undefined || value === null || Number.isNaN(value)) return NEZNAMO;
  return `${numberFmt.format(Math.round(value))} m n. m.`;
}

export function formatNumber(value: number | undefined): string {
  if (value === undefined || value === null || Number.isNaN(value)) return NEZNAMO;
  return numberFmt.format(value);
}

/** Doba trvání v minutách -> "3 h 20 min" / "45 min". */
export function formatDuration(minutes: number | undefined): string {
  if (minutes === undefined || minutes === null || Number.isNaN(minutes)) return NEZNAMO;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export function formatDays(days: number | undefined): string {
  if (days === undefined || days === null) return NEZNAMO;
  return `${numberFmt.format(days)} ${pluralCs(days, { one: 'den', few: 'dny', many: 'dne', other: 'dní' })}`;
}

interface PluralForms {
  one: string;
  few: string;
  many: string;
  other: string;
}

/** Vybere správný český tvar podstatného jména podle počtu (1 vrchol / 2 vrcholy / 5 vrcholů). */
export function pluralCs(n: number, forms: PluralForms): string {
  const rule = pluralRules.select(n) as keyof PluralForms;
  return forms[rule] ?? forms.other;
}

export function countLabel(n: number, forms: PluralForms): string {
  return `${numberFmt.format(n)} ${pluralCs(n, forms)}`;
}

export const RESULT_LABELS: Record<string, string> = {
  summit: 'Cíl dosažen',
  repeat_summit: 'Cíl dosažen znovu',
  not_completed: 'Nedokončeno',
  attempt: 'Pokus',
};

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  hike: 'Pěší výstup',
  ferrata: 'Via ferrata',
  ridge: 'Hřebenovka / přechod',
  other: 'Jiná aktivita',
};

export const TRANSPORT_LABELS: Record<string, string> = {
  foot: 'Pěšky',
  car: 'Autem',
  train: 'Vlakem',
  bus: 'Autobusem',
  hitchhike: 'Odvoz / stop',
  boat: 'Lodí',
  plane: 'Letadlem',
  mixed: 'Kombinovaná pozemní doprava',
};

export const PLACE_TYPE_LABELS: Record<string, string> = {
  city: 'Město',
  town: 'Městečko',
  village: 'Vesnice',
  pass: 'Sedlo/průsmyk',
  hut: 'Chata',
  camp: 'Tábořiště',
  poi: 'Zajímavé místo',
  airport: 'Letiště',
  border: 'Hraniční přechod',
  other: 'Jiné',
};

export const TRACK_QUALITY_LABELS: Record<string, string> = {
  gps: 'GPS - přesná stopa',
  reconstructed: 'Rekonstruovaná trasa',
  approximate: 'Orientační průběh',
};
