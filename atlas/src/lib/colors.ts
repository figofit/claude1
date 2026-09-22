// Jednotná paleta pro mapu (MapLibre potřebuje hex stringy) i pro legendy.
// Stejné odstíny se zrcadlí v CSS proměnných (src/styles/tokens.css), takže
// mapa a zbytek webu vizuálně ladí.

export const MODE_COLORS: Record<string, string> = {
  foot: '#c1622d',
  car: '#3a6ea5',
  train: '#7d5ba6',
  bus: '#2e8b7e',
  hitchhike: '#d4a24c',
  boat: '#4fa8c9',
  plane: '#8fa3b0',
  mixed: '#9b9b93',
};

export const ACTIVITY_COLORS: Record<string, string> = {
  hike: '#c1622d',
  ferrata: '#ad3b32',
  ridge: '#9c7a3c',
  other: '#9b9b93',
};

export const PLACE_TYPE_COLORS: Record<string, string> = {
  city: '#3d4a5c',
  town: '#3d4a5c',
  village: '#5c6b7a',
  pass: '#8b6f4e',
  hut: '#8b6f4e',
  camp: '#8b6f4e',
  poi: '#6e7b8b',
  airport: '#6e7b8b',
  border: '#6e7b8b',
  castle: '#7a6a52',
  zoo: '#4a7c4e',
  other: '#6e7b8b',
};

export const PEAK_COLOR = '#d4a24c';
export const PEAK_SUMMITED_COLOR = '#d4a24c';
export const PEAK_UNSUMMITED_COLOR = '#8b7a5e';

export const TRACK_QUALITY_DASH: Record<string, number[] | undefined> = {
  gps: undefined,
  reconstructed: [3, 1.6],
  approximate: [1, 2.2],
};

export const TRACK_QUALITY_OPACITY: Record<string, number> = {
  gps: 0.95,
  reconstructed: 0.85,
  approximate: 0.65,
};

export function modeColor(mode: string): string {
  return MODE_COLORS[mode] ?? MODE_COLORS.mixed;
}

export function activityColor(type: string): string {
  return ACTIVITY_COLORS[type] ?? ACTIVITY_COLORS.other;
}

export function placeTypeColor(type: string): string {
  return PLACE_TYPE_COLORS[type] ?? PLACE_TYPE_COLORS.other;
}
