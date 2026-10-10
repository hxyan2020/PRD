"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LOCALE,
  getLocaleMeta,
  isLocaleCode,
  LOCALE_STORAGE_KEY,
  LOCALES,
  type LocaleCode,
  type LocaleMeta,
} from "./locales";
import { translate, type MessageKey } from "./messages";

type I18nContextValue = {
  locale: LocaleCode;
  meta: LocaleMeta;
  locales: LocaleMeta[];
  setLocale: (code: LocaleCode) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function detectLocale(): LocaleCode {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && isLocaleCode(stored)) return stored;
  } catch {
    // ignore
  }
  const nav = navigator.language || "en";
  if (isLocaleCode(nav)) return nav;
  const short = nav.split("-")[0];
  const hit = LOCALES.find(
    (l) => l.code === short || l.code.startsWith(`${short}-`) || l.code.startsWith(short),
  );
  if (nav.toLowerCase().startsWith("zh-tw") || nav.toLowerCase().startsWith("zh-hk")) {
    return "zh-TW";
  }
  if (nav.toLowerCase().startsWith("zh")) return "zh-CN";
  if (nav.toLowerCase().startsWith("pt")) return "pt-BR";
  if (hit) return hit.code;
  return DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLocaleState(detectLocale());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const meta = getLocaleMeta(locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = meta.dir;
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // ignore
    }
  }, [locale, ready]);

  const setLocale = useCallback((code: LocaleCode) => {
    setLocaleState(code);
  }, []);

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      meta: getLocaleMeta(locale),
      locales: LOCALES,
      setLocale,
      t,
    }),
    [locale, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
