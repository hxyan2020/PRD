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
  /** ISO 3166-1 alpha-2 code for the national / regional flag image */
  flagCode: string;
  dir: "ltr" | "rtl";
};

export const LOCALES: LocaleMeta[] = [
  { code: "en", label: "English", labelEn: "English", flagCode: "us", dir: "ltr" },
  { code: "zh-CN", label: "简体中文", labelEn: "Chinese (Simplified)", flagCode: "cn", dir: "ltr" },
  { code: "zh-TW", label: "繁體中文", labelEn: "Chinese (Traditional)", flagCode: "tw", dir: "ltr" },
  { code: "ja", label: "日本語", labelEn: "Japanese", flagCode: "jp", dir: "ltr" },
  { code: "ko", label: "한국어", labelEn: "Korean", flagCode: "kr", dir: "ltr" },
  { code: "es", label: "Español", labelEn: "Spanish", flagCode: "es", dir: "ltr" },
  { code: "fr", label: "Français", labelEn: "French", flagCode: "fr", dir: "ltr" },
  { code: "de", label: "Deutsch", labelEn: "German", flagCode: "de", dir: "ltr" },
  { code: "pt-BR", label: "Português", labelEn: "Portuguese (Brazil)", flagCode: "br", dir: "ltr" },
  { code: "ar", label: "العربية", labelEn: "Arabic", flagCode: "sa", dir: "rtl" },
  { code: "hi", label: "हिन्दी", labelEn: "Hindi", flagCode: "in", dir: "ltr" },
  { code: "id", label: "Bahasa Indonesia", labelEn: "Indonesian", flagCode: "id", dir: "ltr" },
  { code: "ru", label: "Русский", labelEn: "Russian", flagCode: "ru", dir: "ltr" },
  { code: "it", label: "Italiano", labelEn: "Italian", flagCode: "it", dir: "ltr" },
  { code: "tr", label: "Türkçe", labelEn: "Turkish", flagCode: "tr", dir: "ltr" },
  { code: "vi", label: "Tiếng Việt", labelEn: "Vietnamese", flagCode: "vn", dir: "ltr" },
  { code: "th", label: "ไทย", labelEn: "Thai", flagCode: "th", dir: "ltr" },
  { code: "nl", label: "Nederlands", labelEn: "Dutch", flagCode: "nl", dir: "ltr" },
];

export const DEFAULT_LOCALE: LocaleCode = "en";
export const LOCALE_STORAGE_KEY = "venturescan.locale.v1";

export function isLocaleCode(value: string): value is LocaleCode {
  return LOCALES.some((l) => l.code === value);
}

export function getLocaleMeta(code: LocaleCode): LocaleMeta {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0];
}
