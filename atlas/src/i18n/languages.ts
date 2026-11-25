export type LocaleCode =
  | "en"
  | "zh-Hans"
  | "zh-Hant"
  | "es"
  | "hi"
  | "ar"
  | "fr"
  | "pt"
  | "ru"
  | "ja"
  | "de"
  | "ko"
  | "it"
  | "tr"
  | "vi"
  | "th"
  | "id"
  | "nl"
  | "pl"
  | "sv"
  | "el"
  | "he"
  | "uk"
  | "fa"
  | "bn"
  | "sw"
  | "la"
  | "grc"
  | "sa"
  | "egy"
  | "akk"
  | "non";

export type LanguageMeta = {
  code: LocaleCode;
  /** National / civilizational flag or emblem shown before the name */
  flag: string;
  /** Name in its own language */
  nativeLabel: string;
  /** English label for accessibility */
  englishLabel: string;
  dir?: "ltr" | "rtl";
  group: "modern" | "ancient";
};

/** Major modern languages, then ancient literary languages with period emblems. */
export const LANGUAGES: LanguageMeta[] = [
  { code: "en", flag: "🇬🇧", nativeLabel: "English", englishLabel: "English", group: "modern" },
  { code: "zh-Hans", flag: "🇨🇳", nativeLabel: "简体中文", englishLabel: "Chinese (Simplified)", group: "modern" },
  { code: "zh-Hant", flag: "🇹🇼", nativeLabel: "繁體中文", englishLabel: "Chinese (Traditional)", group: "modern" },
  { code: "es", flag: "🇪🇸", nativeLabel: "Español", englishLabel: "Spanish", group: "modern" },
  { code: "hi", flag: "🇮🇳", nativeLabel: "हिन्दी", englishLabel: "Hindi", group: "modern" },
  { code: "ar", flag: "🇸🇦", nativeLabel: "العربية", englishLabel: "Arabic", dir: "rtl", group: "modern" },
  { code: "fr", flag: "🇫🇷", nativeLabel: "Français", englishLabel: "French", group: "modern" },
  { code: "pt", flag: "🇧🇷", nativeLabel: "Português", englishLabel: "Portuguese", group: "modern" },
  { code: "ru", flag: "🇷🇺", nativeLabel: "Русский", englishLabel: "Russian", group: "modern" },
  { code: "ja", flag: "🇯🇵", nativeLabel: "日本語", englishLabel: "Japanese", group: "modern" },
  { code: "de", flag: "🇩🇪", nativeLabel: "Deutsch", englishLabel: "German", group: "modern" },
  { code: "ko", flag: "🇰🇷", nativeLabel: "한국어", englishLabel: "Korean", group: "modern" },
  { code: "it", flag: "🇮🇹", nativeLabel: "Italiano", englishLabel: "Italian", group: "modern" },
  { code: "tr", flag: "🇹🇷", nativeLabel: "Türkçe", englishLabel: "Turkish", group: "modern" },
  { code: "vi", flag: "🇻🇳", nativeLabel: "Tiếng Việt", englishLabel: "Vietnamese", group: "modern" },
  { code: "th", flag: "🇹🇭", nativeLabel: "ไทย", englishLabel: "Thai", group: "modern" },
  { code: "id", flag: "🇮🇩", nativeLabel: "Bahasa Indonesia", englishLabel: "Indonesian", group: "modern" },
  { code: "nl", flag: "🇳🇱", nativeLabel: "Nederlands", englishLabel: "Dutch", group: "modern" },
  { code: "pl", flag: "🇵🇱", nativeLabel: "Polski", englishLabel: "Polish", group: "modern" },
  { code: "sv", flag: "🇸🇪", nativeLabel: "Svenska", englishLabel: "Swedish", group: "modern" },
  { code: "el", flag: "🇬🇷", nativeLabel: "Ελληνικά", englishLabel: "Greek", group: "modern" },
  { code: "he", flag: "🇮🇱", nativeLabel: "עברית", englishLabel: "Hebrew", dir: "rtl", group: "modern" },
  { code: "uk", flag: "🇺🇦", nativeLabel: "Українська", englishLabel: "Ukrainian", group: "modern" },
  { code: "fa", flag: "🇮🇷", nativeLabel: "فارسی", englishLabel: "Persian", dir: "rtl", group: "modern" },
  { code: "bn", flag: "🇧🇩", nativeLabel: "বাংলা", englishLabel: "Bengali", group: "modern" },
  { code: "sw", flag: "🇰🇪", nativeLabel: "Kiswahili", englishLabel: "Swahili", group: "modern" },
  // Ancient / classical — emblems of their civilizations (successor or period symbols)
  { code: "la", flag: "🦅", nativeLabel: "Latina", englishLabel: "Latin (Ancient Rome)", group: "ancient" },
  { code: "grc", flag: "🏛️", nativeLabel: "Ἀρχαία Ἑλληνική", englishLabel: "Ancient Greek", group: "ancient" },
  { code: "sa", flag: "🕉️", nativeLabel: "संस्कृतम्", englishLabel: "Sanskrit", group: "ancient" },
  { code: "egy", flag: "🇪🇬", nativeLabel: "r n kmt (Egyptian)", englishLabel: "Ancient Egyptian", group: "ancient" },
  { code: "akk", flag: "🇮🇶", nativeLabel: "Akkadû", englishLabel: "Akkadian (Mesopotamia)", group: "ancient" },
  { code: "non", flag: "🇳🇴", nativeLabel: "Norrœnt", englishLabel: "Old Norse", group: "ancient" },
];

export const LOCALE_STORAGE_KEY = "ludus-atlas-locale-v1";

export function getLanguage(code: string): LanguageMeta {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}
