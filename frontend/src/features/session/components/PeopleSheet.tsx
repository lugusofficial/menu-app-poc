import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { DinerAvatar } from '../../../shared/components/DinerChip'
import { canRemoveDiner } from '../sessionReducer'
import { useTableSession } from '../TableSessionContext'
import styles from './PeopleSheet.module.css'

/**
 * Everyone at the table, and the one place to add more.
 *
 * The common case is one phone for the whole table: somebody scans the code and
 * then types in the people who did not. So the field keeps focus after each
 * name, letting a group be entered in one go, and adding never changes who is
 * holding the phone.
 */
export function PeopleSheet({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const { session, currentDiner, addDiner, dispatch } = useTableSession()

  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (trimmed === '') return
    addDiner(trimmed)
    setName('')
    // Straight back to the field: a table of four is four names in a row.
    inputRef.current?.focus()
  }

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={t('people.title')}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.grabber} aria-hidden="true" />

        <div className={styles.head}>
          <h2 className={styles.title}>{t('people.title')}</h2>
          <button type="button" className={styles.close} onClick={onClose}>
            {t('common.done')}
          </button>
        </div>
        <p className={styles.hint}>{t('people.hint')}</p>

        {/* The row appearing is the confirmation, so there is no toast to cover
            the button you are about to press again. The live region is what
            carries that same confirmation to a screen reader. */}
        <ul className={styles.list} aria-live="polite">
          {session.diners.map((diner) => {
            const isMe = diner.dinerId === currentDiner?.dinerId
            const removable = canRemoveDiner(session, diner.dinerId)
            return (
              <li key={diner.dinerId} className={styles.person}>
                <DinerAvatar name={diner.name} colorIndex={diner.colorIndex} />
                <span className={styles.personName}>{diner.name}</span>

                {isMe ? (
                  <span className={styles.youTag}>{t('table.you')}</span>
                ) : (
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={() => dispatch({ type: 'switchDiner', dinerId: diner.dinerId })}
                  >
                    {t('people.setAsMe')}
                  </button>
                )}

                <button
                  type="button"
                  className={styles.remove}
                  disabled={!removable}
                  // Why it cannot go is more useful than a greyed out button.
                  title={removable ? undefined : isMe ? t('people.cannotRemoveSelf') : t('people.cannotRemoveOrdered')}
                  aria-label={t('people.remove', { name: diner.name })}
                  onClick={() => dispatch({ type: 'removeDiner', dinerId: diner.dinerId })}
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </li>
            )
          })}
        </ul>

        <form className={styles.form} onSubmit={submit} noValidate>
          <label className={styles.label} htmlFor="new-person">
            {t('people.addLabel')}
          </label>
          <div className={styles.row}>
            <input
              id="new-person"
              name="given-name"
              type="text"
              ref={inputRef}
              className={styles.input}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t('join.namePlaceholder')}
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" className={styles.add} disabled={name.trim() === ''}>
              {t('people.add')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
