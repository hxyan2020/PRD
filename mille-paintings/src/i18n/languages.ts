export type Lang = {
  code: string
  name: string
  /** ISO 3166-1 alpha-2 country code for flagcdn.com */
  flagCode: string
  dir?: 'ltr' | 'rtl'
}

/** Major world languages with national flag codes for the picker. */
export const LANGUAGES: Lang[] = [
  { code: 'en', name: 'English', flagCode: 'gb' },
  { code: 'zh', name: '中文（简体）', flagCode: 'cn' },
  { code: 'zh-TW', name: '中文（繁體）', flagCode: 'tw' },
  { code: 'es', name: 'Español', flagCode: 'es' },
  { code: 'fr', name: 'Français', flagCode: 'fr' },
  { code: 'de', name: 'Deutsch', flagCode: 'de' },
  { code: 'pt', name: 'Português', flagCode: 'pt' },
  { code: 'pt-BR', name: 'Português (Brasil)', flagCode: 'br' },
  { code: 'it', name: 'Italiano', flagCode: 'it' },
  { code: 'ru', name: 'Русский', flagCode: 'ru' },
  { code: 'ja', name: '日本語', flagCode: 'jp' },
  { code: 'ko', name: '한국어', flagCode: 'kr' },
  { code: 'ar', name: 'العربية', flagCode: 'sa', dir: 'rtl' },
  { code: 'hi', name: 'हिन्दी', flagCode: 'in' },
  { code: 'bn', name: 'বাংলা', flagCode: 'bd' },
  { code: 'ur', name: 'اردو', flagCode: 'pk', dir: 'rtl' },
  { code: 'fa', name: 'فارسی', flagCode: 'ir', dir: 'rtl' },
  { code: 'tr', name: 'Türkçe', flagCode: 'tr' },
  { code: 'id', name: 'Bahasa Indonesia', flagCode: 'id' },
  { code: 'ms', name: 'Bahasa Melayu', flagCode: 'my' },
  { code: 'vi', name: 'Tiếng Việt', flagCode: 'vn' },
  { code: 'th', name: 'ไทย', flagCode: 'th' },
  { code: 'fil', name: 'Filipino', flagCode: 'ph' },
  { code: 'nl', name: 'Nederlands', flagCode: 'nl' },
  { code: 'pl', name: 'Polski', flagCode: 'pl' },
  { code: 'uk', name: 'Українська', flagCode: 'ua' },
  { code: 'ro', name: 'Română', flagCode: 'ro' },
  { code: 'cs', name: 'Čeština', flagCode: 'cz' },
  { code: 'el', name: 'Ελληνικά', flagCode: 'gr' },
  { code: 'hu', name: 'Magyar', flagCode: 'hu' },
  { code: 'sv', name: 'Svenska', flagCode: 'se' },
  { code: 'da', name: 'Dansk', flagCode: 'dk' },
  { code: 'fi', name: 'Suomi', flagCode: 'fi' },
  { code: 'no', name: 'Norsk', flagCode: 'no' },
  { code: 'he', name: 'עברית', flagCode: 'il', dir: 'rtl' },
]

export function flagUrl(flagCode: string, width = 24): string {
  return `https://flagcdn.com/w${width}/${flagCode}.png`
}

export function resolveLang(code: string): Lang {
  return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0]
}

/** Map browser language tags onto our supported codes. */
export function detectBrowserLang(): string {
  const candidates = [navigator.language, ...(navigator.languages || [])]
  for (const raw of candidates) {
    const tag = (raw || '').toLowerCase()
    if (!tag) continue
    const exact = LANGUAGES.find((l) => l.code.toLowerCase() === tag)
    if (exact) return exact.code
    if (tag.startsWith('zh-tw') || tag.startsWith('zh-hant')) return 'zh-TW'
    if (tag.startsWith('zh')) return 'zh'
    if (tag.startsWith('pt-br')) return 'pt-BR'
    if (tag.startsWith('pt')) return 'pt'
    const base = tag.split('-')[0]
    const hit = LANGUAGES.find((l) => l.code.toLowerCase() === base)
    if (hit) return hit.code
  }
  return 'en'
}
