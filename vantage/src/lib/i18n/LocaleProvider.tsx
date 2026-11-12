"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MessageKey } from "./messages";
import { translate } from "./messages";
import { LOCALE_STORAGE_KEY, parseLocale, type Locale } from "./locale";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    setLocaleState(parseLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY)));
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  const value = useMemo<LocaleContextValue>(() => {
    function setLocale(next: Locale) {
      setLocaleState(next);
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    }
    return {
      locale,
      setLocale,
      t: (key, vars) => translate(locale, key, vars),
    };
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used inside LocaleProvider");
  }
  return context;
}
