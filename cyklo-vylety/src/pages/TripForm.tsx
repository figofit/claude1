import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { TagChip } from '../components/TagChip'
import { draftFromTrip, emptyDraft } from '../storage'
import { TAGS, type Tag, type TripDraft } from '../types'
import { useTrips } from '../useTrips'
import { computeAvgSpeed, hoursMinutes, toMinutes } from '../utils'

export function TripForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { trips, upsert } = useTrips()
  const existing = id ? trips.find((trip) => trip.id === id) : undefined
  const editing = Boolean(existing)

  const [draft, setDraft] = useState<TripDraft>(() => (existing ? draftFromTrip(existing) : emptyDraft()))
  const [manualSpeed, setManualSpeed] = useState(existing?.avgSpeedKmh != null)
  const duration = hoursMinutes(draft.durationMin)
  const computed = useMemo(
    () => computeAvgSpeed(Number(draft.distanceKm) || 0, draft.durationMin),
    [draft.distanceKm, draft.durationMin],
  )

  const set = <K extends keyof TripDraft,>(key: K, value: TripDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const toggleTag = (tag: Tag) => {
    setDraft((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((item) => item !== tag) : [...prev.tags, tag],
    }))
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const saved = upsert({
      ...draft,
      avgSpeedKmh: manualSpeed ? draft.avgSpeedKmh : null,
    })
    navigate(`/vylety/${saved.id}`)
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <header className="page-head">
        <p className="eyebrow">{editing ? 'Úprava' : 'Nový zápis'}</p>
        <h1>{editing ? 'Upravit výlet' : 'Zapsat výlet'}</h1>
        <p className="lede tight">Název, trasa, kilometry. Průměrnou rychlost dopočítáme z času.</p>
      </header>

      <label>
        Název výletu
        <input
          required
          value={draft.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Např. Večerní kolo na Kopeček"
        />
      </label>

      <label>
        Datum
        <input type="date" required value={draft.date} onChange={(e) => set('date', e.target.value)} />
      </label>

      <div className="form-row">
        <label>
          Start
          <input value={draft.startPlace} onChange={(e) => set('startPlace', e.target.value)} placeholder="Odkud" />
        </label>
        <label>
          Cíl
          <input value={draft.endPlace} onChange={(e) => set('endPlace', e.target.value)} placeholder="Kam" />
        </label>
      </div>

      <label>
        Název trasy
        <input
          value={draft.routeName}
          onChange={(e) => set('routeName', e.target.value)}
          placeholder="Volitelné — okruh, silnice, singletrack…"
        />
      </label>

      <div className="form-row three">
        <label>
          Vzdálenost (km)
          <input
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={draft.distanceKm || ''}
            onChange={(e) => set('distanceKm', Number(e.target.value))}
            placeholder="0"
          />
        </label>
        <label>
          Hodiny
          <input
            type="number"
            min="0"
            step="1"
            value={duration.hours || ''}
            onChange={(e) => set('durationMin', toMinutes(Number(e.target.value), duration.minutes))}
            placeholder="0"
          />
        </label>
        <label>
          Minuty
          <input
            type="number"
            min="0"
            max="59"
            step="1"
            value={duration.minutes || ''}
            onChange={(e) => set('durationMin', toMinutes(duration.hours, Number(e.target.value)))}
            placeholder="0"
          />
        </label>
      </div>

      <label>
        Převýšení (m)
        <input
          type="number"
          min="0"
          step="1"
          value={draft.elevationM || ''}
          onChange={(e) => set('elevationM', Number(e.target.value))}
          placeholder="0"
        />
      </label>

      <fieldset className="speed-box">
        <legend>Průměrná rychlost</legend>
        <p className="hint">
          Dopočteno: <strong>{computed != null ? `${computed.toLocaleString('cs-CZ')} km/h` : '—'}</strong>
        </p>
        <label className="check">
          <input type="checkbox" checked={manualSpeed} onChange={(e) => setManualSpeed(e.target.checked)} />
          Zadat ručně
        </label>
        {manualSpeed ? (
          <label>
            km/h
            <input
              type="number"
              min="0"
              step="0.1"
              value={draft.avgSpeedKmh ?? ''}
              onChange={(e) => set('avgSpeedKmh', e.target.value === '' ? null : Number(e.target.value))}
            />
          </label>
        ) : null}
      </fieldset>

      <fieldset>
        <legend>Typ kola</legend>
        <div className="chip-row wrap">
          {TAGS.map((tag) => (
            <TagChip key={tag} tag={tag} active={draft.tags.includes(tag)} onClick={() => toggleTag(tag)} />
          ))}
        </div>
      </fieldset>

      <label>
        Poznámky
        <textarea
          rows={5}
          value={draft.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Počasí, kafe, defekt, výhled, nálada…"
        />
      </label>

      <div className="form-actions">
        <button type="submit" className="btn primary">
          {editing ? 'Uložit změny' : 'Uložit výlet'}
        </button>
        <Link to={existing ? `/vylety/${existing.id}` : '/vylety'} className="btn ghost">
          Zrušit
        </Link>
      </div>
    </form>
  )
}
