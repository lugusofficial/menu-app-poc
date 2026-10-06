import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTableContext } from '../../../app/tableContext'
import { DinerAvatar } from '../../../shared/components/DinerChip'
import { useTableSession } from '../TableSessionContext'
import styles from './JoinTablePage.module.css'

export function JoinTablePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { menu, table } = useTableContext()
  const { session, currentDiner, joinTable, dispatch } = useTableSession()

  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [switching, setSwitching] = useState(false)

  const menuPath = `/t/${encodeURIComponent(menu.venue.venueSlug)}/${encodeURIComponent(table.tableId)}/menu`

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (name.trim() === '') {
      setError(t('join.nameError'))
      return
    }
    setError(null)
    joinTable(name)
    navigate(menuPath)
  }

  const continueAs = (dinerId: string) => {
    dispatch({ type: 'switchDiner', dinerId })
    navigate(menuPath)
  }

  const showContinue = currentDiner !== null && !switching

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{t('join.title', { venue: menu.venue.name })}</h1>
      <p className={styles.table}>{t('join.tableLabel', { table: table.label })}</p>
      <p className={styles.tagline}>{menu.venue.tagline}</p>

      {showContinue ? (
        <div className={styles.card}>
          <button
            type="button"
            className={styles.primary}
            onClick={() => continueAs(currentDiner.dinerId)}
          >
            {t('join.continueAs', { name: currentDiner.name })}
          </button>
          <button type="button" className={styles.secondary} onClick={() => setSwitching(true)}>
            {t('join.switch')}
          </button>
        </div>
      ) : (
        <form className={styles.card} onSubmit={submit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="diner-name">
              {t('join.nameLabel')}
            </label>
            <input
              id="diner-name"
              className={`${styles.input} ${error ? styles.inputError : ''}`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t('join.namePlaceholder')}
              autoComplete="given-name"
              aria-invalid={error !== null}
              aria-describedby={error ? 'diner-name-error' : undefined}
            />
            {error && (
              <p className={styles.fieldError} id="diner-name-error">
                {error}
              </p>
            )}
          </div>
          <button type="submit" className={styles.primary}>
            {t('join.submit')}
          </button>
        </form>
      )}

      {session.diners.length > 0 && (
        <div className={styles.seated}>
          <h2 className={styles.seatedTitle}>{t('join.alreadyHere')}</h2>
          <ul className={styles.seatedList}>
            {session.diners.map((diner) => (
              <li key={diner.dinerId}>
                <button
                  type="button"
                  className={styles.seatedButton}
                  onClick={() => continueAs(diner.dinerId)}
                >
                  <DinerAvatar name={diner.name} colorIndex={diner.colorIndex} />
                  <span>{diner.name}</span>
                  {diner.dinerId === currentDiner?.dinerId && (
                    <span className={styles.youTag}>{t('table.you')}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
