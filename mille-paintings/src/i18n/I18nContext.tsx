import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { detectBrowserLang, resolveLang } from './languages'
import { translate } from './translations'

type I18nValue = {
  lang: string
  setLang: (code: string) => void
  t: (key: string, vars?: Record<string, string | number>) => string
  dir: 'ltr' | 'rtl'
}

const I18nContext = createContext<I18nValue | null>(null)
const LANG_KEY = 'mille.lang'

function initialLang(): string {
  try {
    return localStorage.getItem(LANG_KEY) || detectBrowserLang()
  } catch {
    return 'en'
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState(initialLang)

  const setLang = (code: string) => {
    setLangState(code)
    localStorage.setItem(LANG_KEY, code)
  }

  const dir = resolveLang(lang).dir || 'ltr'

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      t: (key, vars) => translate(lang, key, vars),
      dir,
    }),
    [lang, dir],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n requires I18nProvider')
  return ctx
}
