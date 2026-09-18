import { SAMPLE_TRIPS } from './sampleData'
import type { Trip, TripDraft } from './types'
import { uid } from './utils'

const KEY = 'cyklo-vylety:trips:v1'
const SEEDED_KEY = 'cyklo-vylety:seeded:v1'

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

function readRaw(): Trip[] | null {
  if (!canUseStorage()) return null
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Trip[]
    if (!Array.isArray(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

function writeRaw(trips: Trip[]): void {
  if (!canUseStorage()) return
  localStorage.setItem(KEY, JSON.stringify(trips))
}

export function loadTrips(): Trip[] {
  const existing = readRaw()
  if (existing) {
    return [...existing].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  }
  if (canUseStorage() && !localStorage.getItem(SEEDED_KEY)) {
    writeRaw(SAMPLE_TRIPS)
    localStorage.setItem(SEEDED_KEY, '1')
    return [...SAMPLE_TRIPS].sort((a, b) => b.date.localeCompare(a.date))
  }
  return [...SAMPLE_TRIPS]
}

export function saveTrip(draft: TripDraft): Trip {
  const trips = loadTrips()
  const now = new Date().toISOString()
  const trip: Trip = {
    id: draft.id ?? uid(),
    title: draft.title.trim() || 'Bez názvu',
    date: draft.date,
    startPlace: draft.startPlace.trim(),
    endPlace: draft.endPlace.trim(),
    routeName: draft.routeName.trim(),
    distanceKm: Number(draft.distanceKm) || 0,
    durationMin: Number(draft.durationMin) || 0,
    elevationM: Number(draft.elevationM) || 0,
    avgSpeedKmh: draft.avgSpeedKmh,
    notes: draft.notes.trim(),
    tags: draft.tags,
    createdAt: draft.createdAt ?? now,
  }
  const index = trips.findIndex((item) => item.id === trip.id)
  const next = index >= 0 ? trips.map((item) => (item.id === trip.id ? trip : item)) : [trip, ...trips]
  writeRaw(next)
  return trip
}

export function deleteTrip(id: string): void {
  writeRaw(loadTrips().filter((trip) => trip.id !== id))
}

export function getTrip(id: string): Trip | undefined {
  return loadTrips().find((trip) => trip.id === id)
}

export function totals(trips: Trip[]) {
  return trips.reduce(
    (acc, trip) => {
      acc.km += trip.distanceKm
      acc.min += trip.durationMin
      acc.elev += trip.elevationM
      acc.count += 1
      return acc
    },
    { km: 0, min: 0, elev: 0, count: 0 },
  )
}

export function emptyDraft(): TripDraft {
  const today = new Date().toISOString().slice(0, 10)
  return {
    title: '',
    date: today,
    startPlace: '',
    endPlace: '',
    routeName: '',
    distanceKm: 0,
    durationMin: 0,
    elevationM: 0,
    avgSpeedKmh: null,
    notes: '',
    tags: [],
  }
}

export function draftFromTrip(trip: Trip): TripDraft {
  return { ...trip }
}
