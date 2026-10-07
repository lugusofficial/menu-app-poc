import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTableContext } from '../../../app/tableContext'
import { useTableSession } from '../../session/TableSessionContext'
import type { SplitMode } from '../../session/types'
import { DinerAvatar, DinerToggle } from '../../../shared/components/DinerChip'
import { useToast } from '../../../shared/components/Toast'
import { dinerColor } from '../../../shared/lib/dinerColor'
import { formatCents } from '../../../shared/lib/money'
import { CustomAmountField } from '../components/CustomAmountField'
import { computeSplit, lineTotalCents, suggestCustomAmounts } from '../split'
import styles from './BillPage.module.css'

const MODES: SplitMode[] = ['equal', 'byItem', 'custom']

function isSplitMode(value: string | null): value is SplitMode {
  return value !== null && (MODES as string[]).includes(value)
}

export function BillPage() {
  const { t } = useTranslation()
  const { menu } = useTableContext()
  const { session, dispatch } = useTableSession()
  const toast = useToast()

  // The mode lives in the URL, so a diner can send "look at the by-item split"
  // and it opens the way they left it, back button included.
  const [searchParams, setSearchParams] = useSearchParams()
  const modeParam = searchParams.get('split')
  const mode: SplitMode = isSplitMode(modeParam) ? modeParam : 'equal'

  const setMode = (next: SplitMode) => {
    const params = new URLSearchParams(searchParams)
    if (next === 'equal') params.delete('split')
    else params.set('split', next)
    setSearchParams(params, { replace: true })
  }

  const { currency, locale, serviceFeeRate } = menu.venue
  const money = (cents: number) => formatCents(cents, locale, currency)

  const split = useMemo(
    () => computeSplit(session, serviceFeeRate, mode),
    [session, serviceFeeRate, mode],
  )

  if (session.lines.length === 0) {
    return (
      <section>
        <h1>{t('bill.title')}</h1>
        <p className={styles.empty}>{t('bill.empty')}</p>
      </section>
    )
  }

  const suggest = () => {
    const amounts = suggestCustomAmounts(session.diners, split.billTotalCents)
    for (const [dinerId, cents] of Object.entries(amounts)) {
      dispatch({ type: 'setCustomAmount', dinerId, cents })
    }
  }

  const togglePaid = (dinerId: string, name: string) => {
    dispatch({ type: 'togglePaid', dinerId })
    if (!session.paidDinerIds.includes(dinerId)) {
      toast.show(t('bill.paidToast', { name }), { tone: 'success' })
    }
  }

  return (
    <section>
      <h1>{t('bill.title')}</h1>

      <dl className={styles.summary} aria-label={t('bill.summaryTitle')}>
        <div>
          <dt>{t('order.subtotal')}</dt>
          <dd>{money(split.billSubtotalCents)}</dd>
        </div>
        {session.serviceFeeIncluded && (
          <div>
            <dt>{t('order.serviceFee')}</dt>
            <dd>{money(split.billServiceFeeCents)}</dd>
          </div>
        )}
        <div className={styles.grandTotal}>
          <dt>{t('order.total')}</dt>
          <dd>{money(split.billTotalCents)}</dd>
        </div>
      </dl>

      <label className={styles.feeToggle}>
        <input
          type="checkbox"
          checked={session.serviceFeeIncluded}
          onChange={() => dispatch({ type: 'toggleServiceFee' })}
        />
        <span>{t('bill.serviceFeeToggle')}</span>
      </label>

      <div className={styles.modes} role="tablist" aria-label={t('bill.title')}>
        {MODES.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            className={`${styles.mode} ${mode === value ? styles.modeActive : ''}`}
            onClick={() => setMode(value)}
          >
            {t(`bill.modes.${value}`)}
          </button>
        ))}
      </div>
      <p className={styles.modeHint}>{t(`bill.modeHint.${mode}`)}</p>

      {mode === 'byItem' && (
        <>
          <h2 className={styles.sectionTitle}>{t('bill.assignHint')}</h2>
          <ul className={styles.assignList} aria-label={t('bill.itemsTitle')}>
            {session.lines.map((line) => {
              const sharedBy = session.assignments[line.lineId] ?? []
              return (
                <li key={line.lineId} className={styles.assignLine}>
                  <div className={styles.assignHead}>
                    <span className={styles.assignName}>
                      <span aria-hidden="true">{line.emoji}</span> {line.name}
                      {line.quantity > 1 && <span className={styles.qty}> ×{line.quantity}</span>}
                    </span>
                    <span className={styles.assignPrice}>{money(lineTotalCents(line))}</span>
                  </div>
                  <div className={styles.assignPeople}>
                    {session.diners.map((diner) => (
                      <DinerToggle
                        key={diner.dinerId}
                        name={diner.name}
                        colorIndex={diner.colorIndex}
                        selected={sharedBy.includes(diner.dinerId)}
                        onToggle={() =>
                          dispatch({
                            type: 'toggleAssignment',
                            lineId: line.lineId,
                            dinerId: diner.dinerId,
                          })
                        }
                      />
                    ))}
                  </div>
                  {sharedBy.length > 1 && (
                    <p className={styles.sharedNote}>
                      {t('bill.shared', { count: sharedBy.length })}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}

      {/* One polite live region, so a screen reader hears the bill settle as the
          table taps names rather than being interrupted by each change. */}
      <div aria-live="polite">
        {split.unassignedCents > 0 && (
          <p className={`${styles.notice} ${styles.warning}`}>
            {t('bill.unassignedWarning', { amount: money(split.unassignedCents) })}
          </p>
        )}
        {split.unassignedCents === 0 && split.differenceCents > 0 && (
          <p className={`${styles.notice} ${styles.warning}`}>
            {t('bill.missingWarning', { amount: money(split.differenceCents) })}
          </p>
        )}
        {split.differenceCents < 0 && (
          <p className={`${styles.notice} ${styles.warning}`}>
            {t('bill.overWarning', { amount: money(-split.differenceCents) })}
          </p>
        )}
        {split.differenceCents === 0 && split.unassignedCents === 0 && (
          <p className={`${styles.notice} ${styles.settled}`}>{t('bill.settled')}</p>
        )}
      </div>

      {mode === 'custom' && (
        <button type="button" className={styles.suggest} onClick={suggest}>
          {t('bill.suggest')}
        </button>
      )}

      <ul className={styles.shares} aria-label={t('bill.sharesTitle')}>
        {split.shares.map((share) => {
          const paid = session.paidDinerIds.includes(share.dinerId)
          return (
            <li
              key={share.dinerId}
              className={`${styles.share} ${paid ? styles.sharePaid : ''}`}
              /* The stripe down the edge is this person's colour, tying the card
                 to their avatar and to their chips on the items above. */
              style={{ borderInlineStartColor: dinerColor(share.colorIndex) }}
            >
              <div className={styles.shareHead}>
                <DinerAvatar name={share.name} colorIndex={share.colorIndex} />
                <span className={styles.shareName}>{share.name}</span>
                {paid && <span className={styles.paidTag}>{t('bill.paid')}</span>}
              </div>

              <p className={styles.shareTotal}>{money(share.totalCents)}</p>

              {share.serviceFeeCents > 0 && (
                <p className={styles.shareMeta}>
                  {t('bill.ofWhichFee', { amount: money(share.serviceFeeCents) })}
                </p>
              )}

              {mode === 'byItem' && (
                <p className={styles.shareMeta}>
                  {share.lineIds.length === 0
                    ? t('bill.noItems')
                    : share.lineIds
                        .map((lineId) => session.lines.find((l) => l.lineId === lineId)?.name)
                        .filter(Boolean)
                        .join(' · ')}
                </p>
              )}

              {mode === 'custom' && (
                <CustomAmountField
                  id={`amount-${share.dinerId}`}
                  label={t('bill.customLabel', { name: share.name })}
                  cents={session.customAmounts[share.dinerId] ?? 0}
                  onChange={(cents) =>
                    dispatch({ type: 'setCustomAmount', dinerId: share.dinerId, cents })
                  }
                />
              )}

              <button
                type="button"
                className={paid ? styles.unpayButton : styles.payButton}
                onClick={() => togglePaid(share.dinerId, share.name)}
              >
                {paid ? t('bill.markUnpaid') : t('bill.markPaid')}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
