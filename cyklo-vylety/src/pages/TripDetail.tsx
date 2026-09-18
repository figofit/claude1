import { Link, useNavigate, useParams } from 'react-router-dom'
import { ElevationSpark } from '../components/ElevationSpark'
import { EmptyState } from '../components/EmptyState'
import { TagChip } from '../components/TagChip'
import { useTrips } from '../useTrips'
import {
  effectiveSpeed,
  formatDate,
  formatDuration,
  formatElevation,
  formatKm,
  formatSpeed,
  routeLine,
} from '../utils'

export function TripDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { trips, remove } = useTrips()
  const trip = trips.find((item) => item.id === id)

  if (!trip) {
    return (
      <EmptyState
        title="Výlet se nenašel"
        text="Možná byl smazaný, nebo odkaz už neplatí."
        actionLabel="Zpět na seznam"
        actionTo="/vylety"
      />
    )
  }

  const onDelete = () => {
    const ok = window.confirm(`Opravdu smazat výlet „${trip.title}“?`)
    if (!ok) return
    remove(trip.id)
    navigate('/vylety')
  }

  return (
    <article className="detail">
      <Link to="/vylety" className="back">
        ← Všechny výlety
      </Link>
      <header className="detail-hero">
        <time dateTime={trip.date}>{formatDate(trip.date)}</time>
        <h1>{trip.title}</h1>
        <p className="route big">{routeLine(trip)}</p>
        <div className="chip-row">
          {trip.tags.map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
        </div>
        <ElevationSpark seed={trip.id} elevationM={trip.elevationM} distanceKm={trip.distanceKm} />
      </header>

      <dl className="detail-stats">
        <div>
          <dt>Vzdálenost</dt>
          <dd>{formatKm(trip.distanceKm)}</dd>
        </div>
        <div>
          <dt>Čas</dt>
          <dd>{formatDuration(trip.durationMin)}</dd>
        </div>
        <div>
          <dt>Převýšení</dt>
          <dd>{formatElevation(trip.elevationM)}</dd>
        </div>
        <div>
          <dt>Průměr</dt>
          <dd>{formatSpeed(effectiveSpeed(trip))}</dd>
        </div>
      </dl>

      <section className="places">
        {trip.startPlace ? (
          <p>
            <span>Start</span>
            {trip.startPlace}
          </p>
        ) : null}
        {trip.endPlace ? (
          <p>
            <span>Cíl</span>
            {trip.endPlace}
          </p>
        ) : null}
        {trip.routeName ? (
          <p>
            <span>Trasa</span>
            {trip.routeName}
          </p>
        ) : null}
      </section>

      {trip.notes ? (
        <section className="notes">
          <h2>Poznámky z výletu</h2>
          <p>{trip.notes}</p>
        </section>
      ) : (
        <section className="notes muted">
          <h2>Poznámky z výletu</h2>
          <p>K tomuto výletu zatím nejsou žádné poznámky.</p>
        </section>
      )}

      <div className="detail-actions">
        <Link to={`/vylety/${trip.id}/upravit`} className="btn primary">
          Upravit
        </Link>
        <button type="button" className="btn danger" onClick={onDelete}>
          Smazat
        </button>
      </div>
    </article>
  )
}
