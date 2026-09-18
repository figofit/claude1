import { useMemo, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { TagChip } from '../components/TagChip'
import { TripCard } from '../components/TripCard'
import { TAGS, type Tag } from '../types'
import { useTrips } from '../useTrips'
import { searchHaystack } from '../utils'

export function TripList() {
  const { trips } = useTrips()
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState<Tag | 'all'>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return trips.filter((trip) => {
      if (tag !== 'all' && !trip.tags.includes(tag)) return false
      if (q && !searchHaystack(trip).includes(q)) return false
      return true
    })
  }, [trips, query, tag])

  return (
    <div className="list-page">
      <header className="page-head">
        <p className="eyebrow">Archiv</p>
        <h1>Výlety</h1>
        <p className="lede tight">Hledej podle názvu, místa nebo poznámky. Filtruj podle typu kola.</p>
      </header>

      <div className="filters">
        <label className="search">
          <span className="sr-only">Hledat výlety</span>
          <input
            type="search"
            placeholder="Hledat výlet, místo, poznámku…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="chip-row wrap">
          <button type="button" className={`chip filter ${tag === 'all' ? 'on' : 'off'}`} onClick={() => setTag('all')}>
            Vše
          </button>
          {TAGS.map((item) => (
            <TagChip key={item} tag={item} active={tag === item} onClick={() => setTag(tag === item ? 'all' : item)} />
          ))}
        </div>
      </div>

      {trips.length === 0 ? (
        <EmptyState
          title="Zatím tu fouká vítr"
          text="Žádný výlet v deníku. Až se vrátíš z kola, zapiš si ho — stačí kilometry, čas a pár slov."
          actionLabel="Přidat první výlet"
          actionTo="/vylety/novy"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nic nesedí na filtr"
          text="Zkuste jiné slovo nebo vypněte filtr typu kola. Výlety nikam nezmizely."
        />
      ) : (
        <div className="card-grid">
          {filtered.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  )
}
