import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json'
import pt from './locales/pt.json'

export const supportedLanguages = ['pt', 'en'] as const
export type SupportedLanguage = (typeof supportedLanguages)[number]

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      pt: { translation: pt },
    },
    fallbackLng: 'pt',
    supportedLngs: supportedLanguages,
    interpolation: { escapeValue: false },
    detection: {
      // Default to Portuguese; only a saved switcher choice overrides it, so a
      // tourist's phone language does not change the menu out from under them.
      order: ['localStorage'],
      caches: ['localStorage'],
    },
  })

export default i18n
