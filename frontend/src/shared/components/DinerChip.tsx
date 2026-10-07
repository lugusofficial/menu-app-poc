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
 * A diner's name as a toggle, used on the bill to say who had an item. It is a
 * real button with `aria-pressed` rather than a styled div, so it reaches the
 * keyboard and announces its state.
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
  const color = dinerColor(colorIndex)

  return (
    <button
      type="button"
      className={`${styles.toggle} ${selected ? styles.toggleOn : ''}`}
      style={selected ? { backgroundColor: color, borderColor: color } : { color }}
      aria-pressed={selected}
      onClick={onToggle}
    >
      <span className={styles.dot} aria-hidden="true" />
      <span style={selected ? undefined : { color: 'var(--ink-soft)' }}>{name}</span>
    </button>
  )
}
