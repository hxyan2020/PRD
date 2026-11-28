import type { LocaleCode } from "@/lib/types";

export type LocaleMeta = {
  code: LocaleCode;
  name: string;
  nativeName: string;
  /** ISO 3166-1 alpha-2 for flagcdn */
  flag: string;
  dir: "ltr" | "rtl";
};

/** Major world languages (by speakers / UN / regional reach) available in the UI switcher. */
export const LOCALES: LocaleMeta[] = [
  { code: "en", name: "English", nativeName: "English", flag: "gb", dir: "ltr" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "cn", dir: "ltr" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "in", dir: "ltr" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "es", dir: "ltr" },
  { code: "fr", name: "French", nativeName: "Français", flag: "fr", dir: "ltr" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "sa", dir: "rtl" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "bd", dir: "ltr" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "pt", dir: "ltr" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "ru", dir: "ltr" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "id", dir: "ltr" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "de", dir: "ltr" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "jp", dir: "ltr" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "tr", dir: "ltr" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "vn", dir: "ltr" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "kr", dir: "ltr" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "it", dir: "ltr" },
  { code: "th", name: "Thai", nativeName: "ไทย", flag: "th", dir: "ltr" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "pl", dir: "ltr" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "nl", dir: "ltr" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", flag: "ua", dir: "ltr" },
];

export const DEFAULT_LOCALE: LocaleCode = "en";

export function isLocale(value: string): value is LocaleCode {
  return LOCALES.some((l) => l.code === value);
}

export function flagUrl(flag: string, width = 40): string {
  return `https://flagcdn.com/w${width}/${flag}.png`;
}
