import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { deleteTrip, loadTrips, saveTrip } from './storage'
import type { Trip, TripDraft } from './types'

type TripsContextValue = {
  trips: Trip[]
  upsert: (draft: TripDraft) => Trip
  remove: (id: string) => void
  refresh: () => void
}

const TripsContext = createContext<TripsContextValue | null>(null)

export function TripsProvider({ children }: { children: ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>(() => loadTrips())

  const refresh = useCallback(() => setTrips(loadTrips()), [])

  const upsert = useCallback((draft: TripDraft) => {
    const saved = saveTrip(draft)
    setTrips(loadTrips())
    return saved
  }, [])

  const remove = useCallback((id: string) => {
    deleteTrip(id)
    setTrips(loadTrips())
  }, [])

  const value = useMemo(() => ({ trips, upsert, remove, refresh }), [trips, upsert, remove, refresh])

  return <TripsContext.Provider value={value}>{children}</TripsContext.Provider>
}

export function useTrips() {
  const ctx = useContext(TripsContext)
  if (!ctx) throw new Error('useTrips musí být uvnitř TripsProvider')
  return ctx
}
