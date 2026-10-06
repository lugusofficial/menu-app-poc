import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from './NotFoundPage.module.css'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className={styles.page}>
      <span className={styles.emoji} aria-hidden="true">
        🍽️
      </span>
      <h1>{t('notFound.title')}</h1>
      <p>{t('notFound.body')}</p>
      <Link to="/" className={styles.link}>
        {t('notFound.home')}
      </Link>
    </div>
  )
}
