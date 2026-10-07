import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTableContext } from '../../../app/tableContext'
import { useTableSession } from '../../session/TableSessionContext'
import { useToast } from '../../../shared/components/Toast'
import { formatCents } from '../../../shared/lib/money'
import { itemsOfCategory, searchItems } from '../api'
import type { MenuItem } from '../types'
import { ItemSheet } from '../components/ItemSheet'
import { MenuItemCard } from '../components/MenuItemCard'
import styles from './MenuPage.module.css'

export function MenuPage() {
  const { t } = useTranslation()
  const { menu, table } = useTableContext()
  const { addItem, cartLines, cartQuantity } = useTableSession()
  const toast = useToast()

  // The search sits in the URL so a diner can send "look at this" and the other
  // phone opens on the same filtered menu.
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const setQuery = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value === '') params.delete('q')
    else params.set('q', value)
    setSearchParams(params, { replace: true })
  }

  const [selected, setSelected] = useState<MenuItem | null>(null)
  const { currency, locale } = menu.venue

  const matches = useMemo(() => searchItems(menu.items, query), [menu.items, query])
  const sections = useMemo(
    () =>
      menu.categories
        .map((category) => ({ category, items: itemsOfCategory(matches, category.categoryId) }))
        .filter((section) => section.items.length > 0),
    [menu.categories, matches],
  )

  const cartTotal = cartLines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0)
  const orderPath = `/t/${encodeURIComponent(menu.venue.venueSlug)}/${encodeURIComponent(table.tableId)}/order`

  const add = (item: MenuItem, quantity: number, notes: string) => {
    addItem(item, quantity, notes)
    setSelected(null)
    toast.show(t('itemSheet.addedToast', { name: item.name }), { tone: 'success' })
  }

  return (
    <section>
      <h1>{t('menu.title')}</h1>

      <div className={styles.search}>
        <label className={styles.srOnly} htmlFor="menu-search">
          {t('menu.searchLabel')}
        </label>
        <input
          id="menu-search"
          name="q"
          type="search"
          className={styles.searchInput}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('menu.searchPlaceholder')}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {sections.length === 0 ? (
        <p className={styles.empty}>{t('menu.empty')}</p>
      ) : (
        sections.map(({ category, items }) => (
          <div key={category.categoryId} className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span aria-hidden="true">{category.emoji}</span> {category.name}
            </h2>
            <div className={styles.items}>
              {items.map((item) => (
                <MenuItemCard
                  key={item.itemId}
                  item={item}
                  currency={currency}
                  locale={locale}
                  onSelect={setSelected}
                />
              ))}
            </div>
          </div>
        ))
      )}

      {selected && (
        <ItemSheet
          item={selected}
          currency={currency}
          locale={locale}
          onAdd={add}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Navigation, so it opens in a new tab on middle click like any link. */}
      {cartQuantity > 0 && (
        <Link to={orderPath} className={styles.cartBar}>
          <span className={styles.cartCount}>{t('menu.itemCount', { count: cartQuantity })}</span>
          <span className={styles.cartLabel}>{t('menu.viewOrder')}</span>
          <span className={styles.cartTotal}>{formatCents(cartTotal, locale, currency)}</span>
        </Link>
      )}
    </section>
  )
}
