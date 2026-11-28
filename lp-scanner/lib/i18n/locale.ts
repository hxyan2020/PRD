import type { Locale } from "@/lib/types";

export const LOCALES: Locale[] = ["en", "zh-CN", "zh-TW"];

export function isZh(locale: Locale): boolean {
  return locale === "zh-CN" || locale === "zh-TW";
}

export function dateLocale(locale: Locale): string {
  if (locale === "zh-TW") return "zh-TW";
  if (locale === "zh-CN") return "zh-CN";
  return "en-SG";
}

/** Cycle EN → 简中 → 繁中 → EN */
export function cycleLocale(locale: Locale): Locale {
  if (locale === "en") return "zh-CN";
  if (locale === "zh-CN") return "zh-TW";
  return "en";
}

/** Label for the language toggle (shows the next locale). */
export function nextLocaleLabel(locale: Locale): string {
  if (locale === "en") return "简中";
  if (locale === "zh-CN") return "繁中";
  return "EN";
}

export function parseStoredLocale(value: string | null | undefined): Locale | null {
  if (value === "en" || value === "zh-CN" || value === "zh-TW") return value;
  return null;
}

export function detectBrowserLocale(lang: string): Locale {
  const lower = lang.toLowerCase();
  if (lower.startsWith("zh-tw") || lower.startsWith("zh-hk") || lower.startsWith("zh-hant")) {
    return "zh-TW";
  }
  if (lower.startsWith("zh")) return "zh-CN";
  return "en";
}
