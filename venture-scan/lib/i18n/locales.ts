export type LocaleCode =
  | "en"
  | "zh-CN"
  | "zh-TW"
  | "ja"
  | "ko"
  | "es"
  | "fr"
  | "de"
  | "pt-BR"
  | "ar"
  | "hi"
  | "id"
  | "ru"
  | "it"
  | "tr"
  | "vi"
  | "th"
  | "nl";

export type LocaleMeta = {
  code: LocaleCode;
  /** Native language name */
  label: string;
  /** English label for accessibility */
  labelEn: string;
  /** National / regional flag emoji used in the picker */
  flag: string;
  dir: "ltr" | "rtl";
};

export const LOCALES: LocaleMeta[] = [
  { code: "en", label: "English", labelEn: "English", flag: "🇺🇸", dir: "ltr" },
  { code: "zh-CN", label: "简体中文", labelEn: "Chinese (Simplified)", flag: "🇨🇳", dir: "ltr" },
  { code: "zh-TW", label: "繁體中文", labelEn: "Chinese (Traditional)", flag: "🇹🇼", dir: "ltr" },
  { code: "ja", label: "日本語", labelEn: "Japanese", flag: "🇯🇵", dir: "ltr" },
  { code: "ko", label: "한국어", labelEn: "Korean", flag: "🇰🇷", dir: "ltr" },
  { code: "es", label: "Español", labelEn: "Spanish", flag: "🇪🇸", dir: "ltr" },
  { code: "fr", label: "Français", labelEn: "French", flag: "🇫🇷", dir: "ltr" },
  { code: "de", label: "Deutsch", labelEn: "German", flag: "🇩🇪", dir: "ltr" },
  { code: "pt-BR", label: "Português", labelEn: "Portuguese (Brazil)", flag: "🇧🇷", dir: "ltr" },
  { code: "ar", label: "العربية", labelEn: "Arabic", flag: "🇸🇦", dir: "rtl" },
  { code: "hi", label: "हिन्दी", labelEn: "Hindi", flag: "🇮🇳", dir: "ltr" },
  { code: "id", label: "Bahasa Indonesia", labelEn: "Indonesian", flag: "🇮🇩", dir: "ltr" },
  { code: "ru", label: "Русский", labelEn: "Russian", flag: "🇷🇺", dir: "ltr" },
  { code: "it", label: "Italiano", labelEn: "Italian", flag: "🇮🇹", dir: "ltr" },
  { code: "tr", label: "Türkçe", labelEn: "Turkish", flag: "🇹🇷", dir: "ltr" },
  { code: "vi", label: "Tiếng Việt", labelEn: "Vietnamese", flag: "🇻🇳", dir: "ltr" },
  { code: "th", label: "ไทย", labelEn: "Thai", flag: "🇹🇭", dir: "ltr" },
  { code: "nl", label: "Nederlands", labelEn: "Dutch", flag: "🇳🇱", dir: "ltr" },
];

export const DEFAULT_LOCALE: LocaleCode = "en";
export const LOCALE_STORAGE_KEY = "venturescan.locale.v1";

export function isLocaleCode(value: string): value is LocaleCode {
  return LOCALES.some((l) => l.code === value);
}

export function getLocaleMeta(code: LocaleCode): LocaleMeta {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0];
}
