import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import type { Locale } from 'antd/es/locale';

export type AppLang = 'zh' | 'en';

const STORAGE_KEY = 'mm-admin-lang';

type LocaleContextValue = {
  lang: AppLang;
  setLang: (lang: AppLang) => void;
  antdLocale: Locale;
  t: (zh: string, en: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLang(): AppLang {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'en' || v === 'zh') return v;
  } catch {
    /* ignore */
  }
  return 'zh';
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AppLang>(() => readStoredLang());

  const setLang = (next: AppLang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  }, [lang]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      lang,
      setLang,
      antdLocale: lang === 'zh' ? zhCN : enUS,
      t: (zh, en) => (lang === 'zh' ? zh : en),
    }),
    [lang],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
