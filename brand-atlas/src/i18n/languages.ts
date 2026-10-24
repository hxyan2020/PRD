export interface Language {
  code: string;
  label: string;
  /** ISO 3166-1 alpha-2 for flagcdn, or special */
  flag: string;
  dir?: "ltr" | "rtl";
}

/** Major languages with national flag codes (flagcdn.com). */
export const LANGUAGES: Language[] = [
  { code: "en", label: "English", flag: "gb" },
  { code: "zh-Hans", label: "简体中文", flag: "cn" },
  { code: "zh-Hant", label: "繁體中文", flag: "tw" },
  { code: "ja", label: "日本語", flag: "jp" },
  { code: "ko", label: "한국어", flag: "kr" },
  { code: "es", label: "Español", flag: "es" },
  { code: "fr", label: "Français", flag: "fr" },
  { code: "de", label: "Deutsch", flag: "de" },
  { code: "pt", label: "Português", flag: "pt" },
  { code: "it", label: "Italiano", flag: "it" },
  { code: "ru", label: "Русский", flag: "ru" },
  { code: "ar", label: "العربية", flag: "sa", dir: "rtl" },
  { code: "hi", label: "हिन्दी", flag: "in" },
  { code: "th", label: "ไทย", flag: "th" },
  { code: "vi", label: "Tiếng Việt", flag: "vn" },
  { code: "id", label: "Bahasa Indonesia", flag: "id" },
  { code: "tr", label: "Türkçe", flag: "tr" },
  { code: "nl", label: "Nederlands", flag: "nl" },
  { code: "pl", label: "Polski", flag: "pl" },
  { code: "sv", label: "Svenska", flag: "se" },
  { code: "uk", label: "Українська", flag: "ua" },
  { code: "ms", label: "Bahasa Melayu", flag: "my" },
  { code: "bn", label: "বাংলা", flag: "bd" },
  { code: "fa", label: "فارسی", flag: "ir", dir: "rtl" },
  { code: "he", label: "עברית", flag: "il", dir: "rtl" },
];

export function flagUrl(code: string): string {
  return `https://flagcdn.com/w40/${code}.png`;
}
