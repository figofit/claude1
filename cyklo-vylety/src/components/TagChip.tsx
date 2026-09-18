import type { Tag } from '../types'
import { tagLabel } from '../utils'

export function TagChip({
  tag,
  active = true,
  onClick,
}: {
  tag: Tag
  active?: boolean
  onClick?: () => void
}) {
  if (onClick) {
    return (
      <button type="button" className={`chip ${tag} ${active ? 'on' : 'off'}`} onClick={onClick}>
        {tagLabel(tag)}
      </button>
    )
  }
  return <span className={`chip ${tag} on`}>{tagLabel(tag)}</span>
}
