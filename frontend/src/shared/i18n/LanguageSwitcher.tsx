import { useTranslation } from 'react-i18next'
import { supportedLanguages } from './index'
import type { SupportedLanguage } from './index'
import styles from './LanguageSwitcher.module.css'

const LABEL: Record<SupportedLanguage, string> = { pt: 'PT', en: 'EN' }

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const current = (supportedLanguages as readonly string[]).includes(i18n.resolvedLanguage ?? '')
    ? (i18n.resolvedLanguage as SupportedLanguage)
    : 'pt'

  return (
    <div className={styles.group} role="group" aria-label={t('common.language')}>
      {supportedLanguages.map((lang) => (
        <button
          key={lang}
          type="button"
          className={`${styles.button} ${lang === current ? styles.active : ''}`}
          aria-pressed={lang === current}
          onClick={() => void i18n.changeLanguage(lang)}
        >
          {LABEL[lang]}
        </button>
      ))}
    </div>
  )
}
