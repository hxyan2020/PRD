"use client";

import { useCallback, useEffect, useState } from "react";
import { parseUiLocale, t, UI_LOCALE_COOKIE, type UiLocale } from "@/lib/i18n";

function readLocaleCookie(): UiLocale {
  if (typeof document === "undefined") return "en";
  const m = document.cookie.match(new RegExp(`(?:^|; )${UI_LOCALE_COOKIE}=([^;]*)`));
  return parseUiLocale(m?.[1] ? decodeURIComponent(m[1]) : "en");
}

export function useUiLocale() {
  const [locale, setLocaleState] = useState<UiLocale>(() => readLocaleCookie());

  useEffect(() => {
    setLocaleState(readLocaleCookie());
  }, []);

  function setLocale(next: UiLocale) {
    document.cookie = `${UI_LOCALE_COOKIE}=${encodeURIComponent(next)}; path=/; max-age=31536000; samesite=lax`;
    setLocaleState(next);
    // Notify other client listeners (e.g. shell + messenger) in the same tab.
    window.dispatchEvent(new Event("crmp-ui-locale"));
  }

  useEffect(() => {
    function onLocale() {
      setLocaleState(readLocaleCookie());
    }
    window.addEventListener("crmp-ui-locale", onLocale);
    return () => window.removeEventListener("crmp-ui-locale", onLocale);
  }, []);

  return { locale, setLocale };
}

export function useT() {
  const { locale, setLocale } = useUiLocale();
  const tr = useCallback(
    (key: string, vars?: Record<string, string | number>) => t(key, locale, vars),
    [locale]
  );
  return { locale, setLocale, t: tr };
}
