import { Link } from 'react-router-dom'

export function EmptyState({
  title,
  text,
  actionLabel,
  actionTo,
}: {
  title: string
  text: string
  actionLabel?: string
  actionTo?: string
}) {
  return (
    <div className="empty">
      <div className="empty-art" aria-hidden="true">
        <svg viewBox="0 0 160 90" width="160" height="90">
          <path d="M8 70 C40 48, 70 78, 120 42 S150 22, 156 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="4 6" />
          <circle cx="46" cy="62" r="14" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="108" cy="62" r="14" fill="none" stroke="currentColor" strokeWidth="3" />
          <path d="M46 62 L78 28 H102 L108 62 M78 28 L88 62" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      {actionLabel && actionTo ? (
        <Link to={actionTo} className="btn primary">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  )
}
