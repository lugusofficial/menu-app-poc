import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { menuApi } from '../../menu/api'
import { useAsync } from '../../../shared/lib/useAsync'
import { LanguageSwitcher } from '../../../shared/i18n/LanguageSwitcher'
import { APP_VERSION } from '../../../version'
import { PHOTO_CREDITS } from '../../menu/photoCredits'
import { TableQrCode } from '../components/TableQrCode'
import styles from './HomePage.module.css'

const DEMO_VENUE = 'cantina-do-porto'

export function HomePage() {
  const { t } = useTranslation()
  const load = useCallback(() => menuApi.getMenu(DEMO_VENUE), [])
  const { data, loading, error } = useAsync(load)
  const tables = data?.venue.tables ?? []

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>{t('home.eyebrow')}</span>
        <LanguageSwitcher />
      </header>

      <section className={styles.hero}>
        <h1>{t('home.title')}</h1>
        <p className={styles.subtitle}>{t('home.subtitle')}</p>
      </section>

      <section className={styles.features}>
        <article className={styles.feature}>
          <span className={styles.featureIcon} aria-hidden="true">📷</span>
          <h3>{t('home.features.scanTitle')}</h3>
          <p>{t('home.features.scanBody')}</p>
        </article>
        <article className={styles.feature}>
          <span className={styles.featureIcon} aria-hidden="true">🧾</span>
          <h3>{t('home.features.orderTitle')}</h3>
          <p>{t('home.features.orderBody')}</p>
        </article>
        <article className={styles.feature}>
          <span className={styles.featureIcon} aria-hidden="true">🤝</span>
          <h3>{t('home.features.splitTitle')}</h3>
          <p>{t('home.features.splitBody')}</p>
        </article>
      </section>

      <section className={styles.tables}>
        <h2>{t('home.demoTitle')}</h2>
        <p className={styles.hint}>{t('home.demoHint')}</p>

        {loading ? (
          <p className={styles.state}>{t('common.loading')}</p>
        ) : error ? (
          <p className={styles.state}>{t('common.error')}</p>
        ) : (
          <ul className={styles.tableGrid}>
            {tables.map((table) => {
              const path = `/t/${DEMO_VENUE}/${encodeURIComponent(table.tableId)}`
              return (
                <li key={table.tableId}>
                  <Link to={path} className={styles.tableCard}>
                    <TableQrCode
                      path={path}
                      title={t('home.qrAlt', { label: table.label })}
                      size={128}
                    />
                    <span className={styles.tableLabel}>{table.label}</span>
                    <span className={styles.tableSeats}>
                      {t('home.seats', { count: table.seats })}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <details className={styles.credits}>
        <summary>{t('home.photosTitle')}</summary>
        <p className={styles.creditsBody}>{t('home.photosBody')}</p>
        <ul className={styles.creditsList}>
          {PHOTO_CREDITS.map((credit) => (
            <li key={credit.itemId}>
              <a href={credit.source} target="_blank" rel="noreferrer noopener">
                {credit.title}
              </a>{' '}
              {t('home.photosBy')} {credit.creator || '—'} ·{' '}
              <a href={credit.licenseUrl} target="_blank" rel="noreferrer noopener">
                {credit.license}
              </a>
            </li>
          ))}
        </ul>
      </details>

      <footer className={styles.footer}>
        <span>{APP_VERSION}</span>
      </footer>
    </div>
  )
}
