import { useState } from 'react'
import { parseCents } from '../../../shared/lib/money'
import styles from './CustomAmountField.module.css'

/**
 * A money input a person can actually type into.
 *
 * The session stores integer cents, but reformatting the text on every
 * keystroke would turn "50" into "5,00" before the second digit lands. So the
 * field keeps what was typed and only reports the parsed value upwards. It
 * re-reads the stored amount when it is changed from outside the field, which
 * is what the "split what is left evenly" button does.
 */
export function CustomAmountField({
  id,
  label,
  cents,
  onChange,
}: {
  id: string
  label: string
  cents: number
  onChange: (cents: number) => void
}) {
  const [draft, setDraft] = useState(() => centsToText(cents))
  const [previousCents, setPreviousCents] = useState(cents)

  // Only a change of the stored amount redraws the text, and only when it says
  // something other than what is already typed, so echoing back the value this
  // field just reported leaves the typing alone. This is React's "adjusting
  // state when a prop changes" pattern, which runs during render on purpose.
  if (cents !== previousCents) {
    setPreviousCents(cents)
    if ((parseCents(draft) ?? 0) !== cents) setDraft(centsToText(cents))
  }

  const change = (value: string) => {
    setDraft(value)
    onChange(parseCents(value) ?? 0)
  }

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={styles.input}
        inputMode="decimal"
        value={draft}
        onChange={(event) => change(event.target.value)}
        onBlur={() => setDraft(centsToText(parseCents(draft) ?? 0))}
      />
    </div>
  )
}

function centsToText(cents: number): string {
  if (cents === 0) return ''
  return (cents / 100).toFixed(2).replace('.', ',')
}
