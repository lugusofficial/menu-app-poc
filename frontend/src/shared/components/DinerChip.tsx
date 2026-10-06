import { dinerColor, initialsOf } from '../lib/dinerColor'
import styles from './DinerChip.module.css'

export function DinerAvatar({
  name,
  colorIndex,
  size = 'md',
}: {
  name: string
  colorIndex: number
  size?: 'sm' | 'md'
}) {
  return (
    <span
      className={`${styles.avatar} ${styles[size]}`}
      style={{ backgroundColor: dinerColor(colorIndex) }}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  )
}

/**
 * A diner's name as a tappable pill. Used on the bill to say who had an item,
 * so it is a real button with a pressed state rather than a styled div.
 */
export function DinerToggle({
  name,
  colorIndex,
  selected,
  onToggle,
}: {
  name: string
  colorIndex: number
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      className={`${styles.toggle} ${selected ? styles.toggleOn : ''}`}
      style={selected ? { backgroundColor: dinerColor(colorIndex), borderColor: dinerColor(colorIndex) } : undefined}
      aria-pressed={selected}
      onClick={onToggle}
    >
      {name}
    </button>
  )
}
