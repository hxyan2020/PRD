"use client";

import { useEffect, useState } from "react";
import { parseUiLocale, UI_LOCALE_COOKIE, type UiLocale } from "@/lib/i18n";

function readLocaleCookie(): UiLocale {
  if (typeof document === "undefined") return "en";
  const m = document.cookie.match(new RegExp(`(?:^|; )${UI_LOCALE_COOKIE}=([^;]*)`));
  return parseUiLocale(m?.[1] ? decodeURIComponent(m[1]) : "en");
}

export function useUiLocale() {
  const [locale, setLocaleState] = useState<UiLocale>("en");

  useEffect(() => {
    setLocaleState(readLocaleCookie());
  }, []);

  function setLocale(next: UiLocale) {
    document.cookie = `${UI_LOCALE_COOKIE}=${encodeURIComponent(next)}; path=/; max-age=31536000; samesite=lax`;
    setLocaleState(next);
  }

  return { locale, setLocale };
}
