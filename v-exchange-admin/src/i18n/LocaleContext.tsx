import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ConfigProvider } from 'antd'
import enUS from 'antd/locale/en_US'
import zhCN from 'antd/locale/zh_CN'
import {
  formatTermLabel,
  getFinanceTerm,
  type UiLang,
} from './financeTerms'

const STORAGE_KEY = 'v-exchange-admin-ui-lang'

type LocaleApi = {
  lang: UiLang
  setLang: (lang: UiLang) => void
  /** Short UI label for a Chinese field/page name */
  label: (zhName: string) => string
  /** Always-bilingual title for tips: EN / 中文 */
  bilingualTitle: (zhName: string) => string
  explainEn: (zhName: string) => string
  explainZh: (zhName: string) => string
}

const LocaleContext = createContext<LocaleApi | null>(null)

function readStoredLang(): UiLang {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'zh' || v === 'en' || v === 'both') return v
  } catch {
    /* ignore */
  }
  return 'both'
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<UiLang>(() => readStoredLang())

  const setLang = useCallback((next: UiLang) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN'
    document.documentElement.dataset.uiLang = lang
  }, [lang])

  const api = useMemo<LocaleApi>(
    () => ({
      lang,
      setLang,
      label: (zhName: string) => formatTermLabel(zhName, lang),
      bilingualTitle: (zhName: string) => {
        const t = getFinanceTerm(zhName)
        return `${t.en} / ${t.zh}`
      },
      explainEn: (zhName: string) => getFinanceTerm(zhName).explainEn,
      explainZh: (zhName: string) => getFinanceTerm(zhName).explainZh,
    }),
    [lang, setLang],
  )

  const antdLocale = lang === 'en' ? enUS : zhCN

  return (
    <LocaleContext.Provider value={api}>
      <ConfigProvider
        locale={antdLocale}
        theme={{
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 2,
            fontSize: 13,
          },
        }}
      >
        {children}
      </ConfigProvider>
    </LocaleContext.Provider>
  )
}

export function useLocale(): LocaleApi {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
