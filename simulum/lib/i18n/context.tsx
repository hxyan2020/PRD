"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DEFAULT_LOCALE, isLocale, LOCALES, type LocaleMeta } from "@/lib/i18n/locales";
import { t as translate, type MessageKey } from "@/lib/i18n/messages";
import type { LocaleCode } from "@/lib/types";

const STORAGE_KEY = "simulum-locale";
const COOKIE_KEY = "simulum-locale";

type I18nValue = {
  locale: LocaleCode;
  setLocale: (l: LocaleCode) => void;
  t: (key: MessageKey) => string;
  locales: LocaleMeta[];
  dir: "ltr" | "rtl";
};

const Ctx = createContext<I18nValue | null>(null);

function writeLocaleCookie(locale: LocaleCode) {
  try {
    document.cookie = `${COOKIE_KEY}=${encodeURIComponent(locale)};path=/;max-age=31536000;samesite=lax`;
  } catch {
    // ignore
  }
}

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  /** From server cookie so SSR matches the viewer's language. */
  initialLocale?: LocaleCode;
}) {
  const [locale, setLocaleState] = useState<LocaleCode>(
    initialLocale && isLocale(initialLocale) ? initialLocale : DEFAULT_LOCALE,
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && isLocale(stored)) {
        setLocaleState(stored);
        writeLocaleCookie(stored);
        return;
      }
      if (initialLocale && isLocale(initialLocale)) {
        localStorage.setItem(STORAGE_KEY, initialLocale);
        return;
      }
      const nav = navigator.language.toLowerCase();
      const hit = LOCALES.find(
        (l) => nav === l.code || nav.startsWith(`${l.code}-`),
      );
      if (hit) {
        setLocaleState(hit.code);
        writeLocaleCookie(hit.code);
      }
    } catch {
      // ignore
    }
    // Only on mount — initialLocale is the SSR seed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const meta = LOCALES.find((l) => l.code === locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = meta?.dir ?? "ltr";
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // ignore
    }
    writeLocaleCookie(locale);
  }, [locale]);

  const setLocale = useCallback((l: LocaleCode) => {
    setLocaleState(l);
    writeLocaleCookie(l);
  }, []);
  const t = useCallback((key: MessageKey) => translate(locale, key), [locale]);
  const dir = LOCALES.find((l) => l.code === locale)?.dir ?? "ltr";
  const value = useMemo(
    () => ({ locale, setLocale, t, locales: LOCALES, dir }),
    [locale, setLocale, t, dir],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n outside provider");
  return v;
}
