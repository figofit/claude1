import { Link } from 'react-router-dom'
import type { Tag, Trip } from '../types'
import { effectiveSpeed, formatDuration, formatElevation, formatKm, formatShortDate, formatSpeed, routeLine } from '../utils'
import { ElevationSpark } from './ElevationSpark'
import { TagChip } from './TagChip'

export function TripCard({ trip, featured = false }: { trip: Trip; featured?: boolean }) {
  const speed = effectiveSpeed(trip)

  return (
    <Link to={`/vylety/${trip.id}`} className={`trip-card ${featured ? 'featured' : ''}`}>
      <div className="trip-card-top">
        <time dateTime={trip.date}>{formatShortDate(trip.date)}</time>
        <div className="chip-row">
          {trip.tags.map((tag: Tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
        </div>
      </div>
      <h3>{trip.title}</h3>
      <p className="route">{routeLine(trip)}</p>
      <ElevationSpark seed={trip.id} elevationM={trip.elevationM} distanceKm={trip.distanceKm} />
      <dl className="mini-stats">
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
          <dt>Tempo</dt>
          <dd>{formatSpeed(speed)}</dd>
        </div>
      </dl>
    </Link>
  )
}
