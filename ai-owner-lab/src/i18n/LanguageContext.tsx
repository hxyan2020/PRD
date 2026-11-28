import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { translate, type UiKey } from './ui'
import { LANG_STORAGE_KEY, type Lang } from './types'

interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: UiKey, vars?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function readLang(): Lang {
  const stored = localStorage.getItem(LANG_STORAGE_KEY)
  return stored === 'zh' ? 'zh' : 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() =>
    typeof window === 'undefined' ? 'en' : readLang(),
  )

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    localStorage.setItem(LANG_STORAGE_KEY, next)
  }, [])

  const t = useCallback(
    (key: UiKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  )

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
