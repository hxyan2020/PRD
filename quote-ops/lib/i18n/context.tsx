"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Locale = "zh-CN" | "en";

type I18nCtx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (zh: string, en: string) => string;
};

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("zh-CN");
  const value = useMemo<I18nCtx>(
    () => ({
      locale,
      setLocale,
      t: (zh, en) => (locale === "zh-CN" ? zh : en),
    }),
    [locale],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n outside provider");
  return ctx;
}
