'use client'

/**
 * LocaleContext — lightweight i18n context for the dashboard.
 *
 * Provides:
 *   locale   — current locale ('en' | 'es')
 *   t        — translation object for the active locale
 *   setLocale — toggle function, persists preference to localStorage
 *
 * Scope: wraps app/(dashboard)/layout.tsx only.
 * Auth pages (/login, /register) use hardcoded English strings.
 *
 * Persistence: reads/writes localStorage key 'ct_locale' on mount.
 * SSR: defaults to 'en' until client hydration reads localStorage.
 */

import { createContext, use, useState, type ReactNode } from 'react'
import type { Locale, Translation } from '@/lib/i18n/types'
import en from '@/lib/i18n/en.json'
import es from '@/lib/i18n/es.json'

const STORAGE_KEY = 'ct_locale'
const DEFAULT_LOCALE: Locale = 'en'

const TRANSLATIONS: Record<Locale, Translation> = {
  en: en as Translation,
  es: es as Translation,
}

interface LocaleContextValue {
  locale: Locale
  t: Translation
  setLocale: (locale: Locale) => void
}

export const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  t: TRANSLATIONS[DEFAULT_LOCALE],
  setLocale: () => undefined,
})

interface LocaleProviderProps {
  children: ReactNode
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  // Lazily initialise from localStorage so no effect + setState is needed.
  // Falls back to DEFAULT_LOCALE on SSR or when localStorage is unavailable.
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === 'undefined') return DEFAULT_LOCALE
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'en' || stored === 'es') return stored
    } catch {
      // localStorage unavailable (e.g. private browsing)
    }
    return DEFAULT_LOCALE
  })

  function setLocale(next: Locale) {
    setLocaleState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore
    }
  }

  return (
    <LocaleContext value={{ locale, t: TRANSLATIONS[locale], setLocale }}>{children}</LocaleContext>
  )
}

/**
 * Convenience hook — use inside any Client Component under (dashboard)/layout.
 *
 * @example
 * const { t, setLocale } = useLocale()
 */
export function useLocale(): LocaleContextValue {
  return use(LocaleContext)
}
