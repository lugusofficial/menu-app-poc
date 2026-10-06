import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTableContext } from '../../../app/tableContext'
import { useTableSession } from '../../session/TableSessionContext'
import type { OrderLine } from '../../session/types'
import { lineTotalCents, subtotalOf } from '../../bill/split'
import { DinerAvatar } from '../../../shared/components/DinerChip'
import { useToast } from '../../../shared/components/Toast'
import { formatCents, percentOfCents } from '../../../shared/lib/money'
import styles from './OrderPage.module.css'

export function OrderPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { menu, table } = useTableContext()
  const { session, cartLines, placedLines, dispatch, placeOrder } = useTableSession()
  const toast = useToast()

  const { currency, locale, serviceFeeRate } = menu.venue
  const base = `/t/${encodeURIComponent(menu.venue.venueSlug)}/${encodeURIComponent(table.tableId)}`
  const money = (cents: number) => formatCents(cents, locale, currency)

  const subtotal = subtotalOf(session.lines)
  const serviceFee = session.serviceFeeIncluded ? percentOfCents(subtotal, serviceFeeRate) : 0

  const nameOf = (dinerId: string) =>
    session.diners.find((d) => d.dinerId === dinerId)?.name ?? '—'
  const colorOf = (dinerId: string) =>
    session.diners.find((d) => d.dinerId === dinerId)?.colorIndex ?? 0

  const send = () => {
    placeOrder()
    toast.show(t('order.placedToast'), 'success')
  }

  if (session.lines.length === 0) {
    return (
      <section className={styles.emptyState}>
        <h1 className={styles.title}>{t('order.title')}</h1>
        <p>{t('order.empty')}</p>
        <Link to={`${base}/menu`} className={styles.primaryLink}>
          {t('order.goToMenu')}
        </Link>
      </section>
    )
  }

  const renderLine = (line: OrderLine, editable: boolean) => (
    <li key={line.lineId} className={styles.line}>
      <span className={styles.lineEmoji} aria-hidden="true">
        {line.emoji}
      </span>
      <span className={styles.lineBody}>
        <span className={styles.lineName}>{line.name}</span>
        {line.notes !== '' && <span className={styles.lineNotes}>{line.notes}</span>}
        <span className={styles.lineDiner}>
          <DinerAvatar name={nameOf(line.addedByDinerId)} colorIndex={colorOf(line.addedByDinerId)} size="sm" />
          {t('order.addedBy', { name: nameOf(line.addedByDinerId) })}
        </span>
      </span>
      <span className={styles.lineRight}>
        <span className={styles.linePrice}>{money(lineTotalCents(line))}</span>
        {editable ? (
          <span className={styles.stepper}>
            <button
              type="button"
              aria-label={t('itemSheet.decrease')}
              onClick={() =>
                dispatch({ type: 'setQuantity', lineId: line.lineId, quantity: line.quantity - 1 })
              }
            >
              −
            </button>
            <span className={styles.quantity}>{line.quantity}</span>
            <button
              type="button"
              aria-label={t('itemSheet.increase')}
              onClick={() =>
                dispatch({ type: 'setQuantity', lineId: line.lineId, quantity: line.quantity + 1 })
              }
            >
              +
            </button>
          </span>
        ) : (
          <span className={styles.quantityStatic}>×{line.quantity}</span>
        )}
      </span>
    </li>
  )

  return (
    <section>
      <h1 className={styles.title}>{t('order.title')}</h1>

      {cartLines.length > 0 && (
        <div className={styles.group}>
          <h2 className={styles.groupTitle}>{t('order.cartSection')}</h2>
          <ul className={styles.lines}>{cartLines.map((line) => renderLine(line, true))}</ul>
          <button type="button" className={styles.primary} onClick={send}>
            {t('order.place')}
          </button>
        </div>
      )}

      {placedLines.length > 0 && (
        <div className={styles.group}>
          <h2 className={styles.groupTitle}>
            <span className={styles.kitchenDot} aria-hidden="true" />
            {t('order.placedSection')}
          </h2>
          <ul className={styles.lines}>{placedLines.map((line) => renderLine(line, false))}</ul>
        </div>
      )}

      <dl className={styles.totals}>
        <div>
          <dt>{t('order.subtotal')}</dt>
          <dd>{money(subtotal)}</dd>
        </div>
        {session.serviceFeeIncluded && (
          <div>
            <dt>{t('order.serviceFee')}</dt>
            <dd>{money(serviceFee)}</dd>
          </div>
        )}
        <div className={styles.grandTotal}>
          <dt>{t('order.total')}</dt>
          <dd>{money(subtotal + serviceFee)}</dd>
        </div>
      </dl>

      <button type="button" className={styles.split} onClick={() => navigate(`${base}/bill`)}>
        {t('order.split')}
      </button>
    </section>
  )
}
