import { useTranslation } from 'react-i18next'
import { formatCents } from '../../../shared/lib/money'
import type { MenuItem } from '../types'
import styles from './MenuItemCard.module.css'

export function MenuItemCard({
  item,
  currency,
  locale,
  onSelect,
}: {
  item: MenuItem
  currency: string
  locale: string
  onSelect: (item: MenuItem) => void
}) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      className={`${styles.card} ${item.available ? '' : styles.unavailable}`}
      onClick={() => onSelect(item)}
      disabled={!item.available}
    >
      <span className={styles.emoji} aria-hidden="true">
        {item.emoji}
      </span>
      <span className={styles.body}>
        <span className={styles.name}>{item.name}</span>
        <span className={styles.description}>{item.description}</span>
        {item.tags.length > 0 && (
          <span className={styles.tags}>
            {item.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {t(`menu.tags.${tag}`)}
              </span>
            ))}
          </span>
        )}
      </span>
      <span className={styles.price}>
        {item.available ? (
          formatCents(item.priceCents, locale, currency)
        ) : (
          <span className={styles.soldOut}>{t('menu.unavailable')}</span>
        )}
      </span>
    </button>
  )
}
