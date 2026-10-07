import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { formatCents } from '../../../shared/lib/money'
import type { MenuItem } from '../types'
import styles from './ItemSheet.module.css'

/** The bottom sheet that opens when a diner taps a dish. */
export function ItemSheet({
  item,
  currency,
  locale,
  onAdd,
  onClose,
}: {
  item: MenuItem
  currency: string
  locale: string
  onAdd: (item: MenuItem, quantity: number, notes: string) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // Focus moves into the sheet so the keyboard is not left behind the overlay.
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const total = item.priceCents * quantity

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={item.name}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.grabber} aria-hidden="true" />

        <button
          type="button"
          ref={closeRef}
          className={styles.close}
          onClick={onClose}
          aria-label={t('common.close')}
        >
          <span aria-hidden="true">✕</span>
        </button>

        <span className={styles.emoji} aria-hidden="true">
          {item.emoji}
        </span>
        <h2 className={styles.name}>{item.name}</h2>
        <p className={styles.description}>{item.description}</p>
        <p className={styles.price}>{formatCents(item.priceCents, locale, currency)}</p>

        <label className={styles.label} htmlFor="item-notes">
          {t('itemSheet.notesLabel')}
        </label>
        <textarea
          id="item-notes"
          name="notes"
          className={styles.textarea}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder={t('itemSheet.notesPlaceholder')}
          rows={2}
        />

        <div className={styles.footer}>
          <div className={styles.stepper} role="group" aria-label={t('itemSheet.quantityLabel')}>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label={t('itemSheet.decrease')}
              disabled={quantity <= 1}
            >
              <span aria-hidden="true">−</span>
            </button>
            <output className={styles.quantity}>{quantity}</output>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              aria-label={t('itemSheet.increase')}
            >
              <span aria-hidden="true">+</span>
            </button>
          </div>

          <button type="button" className={styles.add} onClick={() => onAdd(item, quantity, notes)}>
            {t('itemSheet.addFor', { total: formatCents(total, locale, currency) })}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
