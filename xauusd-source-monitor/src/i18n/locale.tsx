import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { LANG_LABEL, messages, type AppLang } from './messages'

const STORAGE_KEY = 'xauusd-monitor-lang'

type LocaleCtx = {
  lang: AppLang
  setLang: (lang: AppLang) => void
  t: (key: string) => string
  langLabel: typeof LANG_LABEL
}

const Ctx = createContext<LocaleCtx | null>(null)

function readLang(): AppLang {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'en' || v === 'zh-Hant') return v
  } catch {
    /* ignore */
  }
  return 'en'
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AppLang>(() => readLang())

  const setLang = (next: AppLang) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    document.documentElement.lang = lang === 'zh-Hant' ? 'zh-Hant' : 'en'
  }, [lang])

  const value = useMemo<LocaleCtx>(
    () => ({
      lang,
      setLang,
      t: (key) => messages[lang][key] ?? messages.en[key] ?? key,
      langLabel: LANG_LABEL,
    }),
    [lang],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useLocale() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useLocale requires LocaleProvider')
  return ctx
}
