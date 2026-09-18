export const TAGS = ['silnice', 'gravel', 'mtb'] as const
export type Tag = (typeof TAGS)[number]

export type Trip = {
  id: string
  title: string
  date: string
  startPlace: string
  endPlace: string
  routeName: string
  distanceKm: number
  durationMin: number
  elevationM: number
  avgSpeedKmh: number | null
  notes: string
  tags: Tag[]
  createdAt: string
}

export type TripDraft = Omit<Trip, 'id' | 'createdAt'> & {
  id?: string
  createdAt?: string
}
