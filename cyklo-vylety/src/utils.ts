import type { Tag, Trip } from './types'

export function uid(): string {
  return crypto.randomUUID()
}

export function computeAvgSpeed(distanceKm: number, durationMin: number): number | null {
  if (!distanceKm || !durationMin || durationMin <= 0) return null
  return Math.round((distanceKm / (durationMin / 60)) * 10) / 10
}

export function effectiveSpeed(trip: Pick<Trip, 'distanceKm' | 'durationMin' | 'avgSpeedKmh'>): number | null {
  if (trip.avgSpeedKmh != null && trip.avgSpeedKmh > 0) return trip.avgSpeedKmh
  return computeAvgSpeed(trip.distanceKm, trip.durationMin)
}

export function formatKm(km: number): string {
  return `${km.toLocaleString('cs-CZ', { maximumFractionDigits: 1 })} km`
}

export function formatElevation(m: number): string {
  return `${Math.round(m).toLocaleString('cs-CZ')} m`
}

export function formatDuration(min: number): string {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (h <= 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}

export function formatSpeed(kmh: number | null): string {
  if (kmh == null) return '—'
  return `${kmh.toLocaleString('cs-CZ', { maximumFractionDigits: 1 })} km/h`
}

export function formatDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString('cs-CZ', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })
}

export function tagLabel(tag: Tag): string {
  switch (tag) {
    case 'silnice':
      return 'Silnice'
    case 'gravel':
      return 'Gravel'
    case 'mtb':
      return 'MTB'
  }
}

export function routeLine(trip: Pick<Trip, 'startPlace' | 'endPlace' | 'routeName'>): string {
  if (trip.routeName.trim()) return trip.routeName.trim()
  const start = trip.startPlace.trim()
  const end = trip.endPlace.trim()
  if (start && end && start !== end) return `${start} → ${end}`
  return start || end || 'Bez názvu trasy'
}

export function hoursMinutes(durationMin: number): { hours: number; minutes: number } {
  return {
    hours: Math.floor(Math.max(0, durationMin) / 60),
    minutes: Math.round(Math.max(0, durationMin) % 60),
  }
}

export function toMinutes(hours: number, minutes: number): number {
  return Math.max(0, hours) * 60 + Math.max(0, minutes)
}

export function searchHaystack(trip: Trip): string {
  return [
    trip.title,
    trip.startPlace,
    trip.endPlace,
    trip.routeName,
    trip.notes,
    ...trip.tags.map(tagLabel),
  ]
    .join(' ')
    .toLowerCase()
}
