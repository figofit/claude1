import { Link } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { TripCard } from '../components/TripCard'
import { totals } from '../storage'
import { useTrips } from '../useTrips'
import { formatDuration, formatElevation, formatKm } from '../utils'

export function Home() {
  const { trips } = useTrips()
  const stats = totals(trips)
  const recent = trips.slice(0, 4)

  return (
    <div className="home">
      <section className="hero">
        <p className="eyebrow">Kam tě kolo zavezlo</p>
        <h1>
          Kilometry,
          <br />
          které stojí za zápis.
        </h1>
        <p className="lede">
          Jednoduchý deník cyklistických výletů — trasy, čas v sedle, kopce a poznámky. Žádný sporák, jen radost z jízdy.
        </p>
        <div className="hero-actions">
          <Link to="/vylety/novy" className="btn primary">
            Zapsat výlet
          </Link>
          <Link to="/vylety" className="btn ghost">
            Všechny výlety
          </Link>
        </div>
      </section>

      <section className="stats-grid" aria-label="Souhrn">
        <article className="stat">
          <span className="stat-label">Ujeto</span>
          <strong>{formatKm(stats.km)}</strong>
        </article>
        <article className="stat">
          <span className="stat-label">V sedle</span>
          <strong>{stats.min ? formatDuration(stats.min) : '0 h'}</strong>
        </article>
        <article className="stat">
          <span className="stat-label">Nastoupáno</span>
          <strong>{formatElevation(stats.elev)}</strong>
        </article>
        <article className="stat accent">
          <span className="stat-label">Výletů</span>
          <strong>{stats.count}</strong>
        </article>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Poslední výlety</h2>
          <Link to="/vylety">Zobrazit vše</Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState
            title="Prázdný deník"
            text="Zatím žádné výlety. Vyraz na kolo a zapiš první kilometry — stačí název, trasa a čas."
            actionLabel="Zapsat první výlet"
            actionTo="/vylety/novy"
          />
        ) : (
          <div className="card-grid">
            {recent.map((trip, i) => (
              <TripCard key={trip.id} trip={trip} featured={i === 0} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
