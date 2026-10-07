import { useCallback, useState } from 'react'
import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { menuApi } from '../features/menu/api'
import { PeopleSheet } from '../features/session/components/PeopleSheet'
import { TableSessionProvider, useTableSession } from '../features/session/TableSessionContext'
import { DinerAvatar } from '../shared/components/DinerChip'
import { LanguageSwitcher } from '../shared/i18n/LanguageSwitcher'
import { useAsync } from '../shared/lib/useAsync'
import type { TableContext } from './tableContext'
import styles from './TableLayout.module.css'

export function TableLayout() {
  const { venueSlug = '', tableId = '' } = useParams()
  const { t } = useTranslation()

  const load = useCallback(
    () =>
      Promise.all([menuApi.getMenu(venueSlug), menuApi.getTable(venueSlug, tableId)]).then(
        ([menu, table]) => ({ menu, table }),
      ),
    [venueSlug, tableId],
  )
  const { data, loading, error } = useAsync(load)

  if (loading) {
    return (
      <p className={styles.state} aria-live="polite">
        {t('common.loading')}
      </p>
    )
  }

  if (error || !data) {
    return (
      <div className={styles.state}>
        <h1>{t('join.notFound')}</h1>
        <p>{t('join.notFoundBody')}</p>
        <Link to="/" className={styles.stateLink}>
          {t('notFound.home')}
        </Link>
      </div>
    )
  }

  return (
    <TableSessionProvider key={`${venueSlug}/${tableId}`} venueSlug={venueSlug} tableId={tableId}>
      <TableChrome context={data} />
    </TableSessionProvider>
  )
}

function TableChrome({ context }: { context: TableContext }) {
  const { t } = useTranslation()
  const { session, currentDiner, cartQuantity } = useTableSession()
  const [peopleOpen, setPeopleOpen] = useState(false)
  const { menu, table } = context
  const base = `/t/${encodeURIComponent(menu.venue.venueSlug)}/${encodeURIComponent(table.tableId)}`

  return (
    <div className={styles.shell}>
      <a href="#main" className="skipLink">
        {t('common.skipToContent')}
      </a>

      <header className={styles.header}>
        <div className={styles.headerTop}>
          <Link to="/" className={styles.venue}>
            <span className={styles.venueEmoji} aria-hidden="true">
              {menu.venue.emoji}
            </span>
            <span className={styles.venueText}>
              {/* A venue name is a proper noun: never machine translated. */}
              <span className={styles.venueName} translate="no">
                {menu.venue.name}
              </span>
              <span className={styles.tableName}>{table.label}</span>
            </span>
          </Link>
          <LanguageSwitcher />
        </div>

        {currentDiner && (
          <button type="button" className={styles.diners} onClick={() => setPeopleOpen(true)}>
            <span className={styles.dinerStack}>
              {session.diners.map((diner) => (
                <span
                  key={diner.dinerId}
                  className={`${styles.dinerSlot} ${
                    diner.dinerId === currentDiner.dinerId ? styles.dinerSelf : ''
                  }`}
                >
                  <DinerAvatar name={diner.name} colorIndex={diner.colorIndex} size="sm" />
                </span>
              ))}
              {/* The empty slot is the affordance: a table is something you add
                  people to, and most tables share one phone. */}
              <span className={`${styles.dinerSlot} ${styles.addSlot}`} aria-hidden="true">
                +
              </span>
            </span>
            <span className={styles.dinerCount}>
              {session.diners.length === 1
                ? t('people.addSomeone')
                : t('table.peopleAtTable', { count: session.diners.length })}
            </span>
          </button>
        )}
      </header>

      <main className={styles.main} id="main">
        <Outlet context={context} />
      </main>

      {peopleOpen && <PeopleSheet onClose={() => setPeopleOpen(false)} />}

      {currentDiner && (
        <nav className={styles.tabs} aria-label={t('table.sections')}>
          <NavLink to={`${base}/menu`} className={navClass}>
            <span className={styles.tabIcon} aria-hidden="true">
              🍽️
            </span>
            {t('table.menu')}
          </NavLink>
          <NavLink to={`${base}/order`} className={navClass}>
            <span className={styles.tabIcon} aria-hidden="true">
              🧾
            </span>
            {t('table.order')}
            {cartQuantity > 0 && <span className={styles.badge}>{cartQuantity}</span>}
          </NavLink>
          <NavLink to={`${base}/bill`} className={navClass}>
            <span className={styles.tabIcon} aria-hidden="true">
              🤝
            </span>
            {t('table.bill')}
          </NavLink>
        </nav>
      )}
    </div>
  )
}

function navClass({ isActive }: { isActive: boolean }): string {
  return isActive ? `${styles.tab} ${styles.tabActive}` : styles.tab
}
