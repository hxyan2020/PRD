/** Map UI language codes onto Wikidata label codes + Wikipedia site codes. */

export type WikiLangTarget = {
  /** Preferred Wikidata label language codes (first wins via languagefallback). */
  labelLangs: string[]
  /** Wikipedia subdomain, e.g. zh, jawiki → ja */
  wiki: string
  /** Optional MediaWiki variant, e.g. zh-hant */
  variant?: string
}

export function wikiLangFor(uiLang: string): WikiLangTarget {
  switch (uiLang) {
    case 'zh':
      return { labelLangs: ['zh-hans', 'zh', 'zh-cn', 'en'], wiki: 'zh', variant: 'zh-hans' }
    case 'zh-TW':
      return { labelLangs: ['zh-hant', 'zh-tw', 'zh', 'en'], wiki: 'zh', variant: 'zh-hant' }
    case 'pt-BR':
      return { labelLangs: ['pt-br', 'pt', 'en'], wiki: 'pt' }
    case 'fil':
      return { labelLangs: ['tl', 'en'], wiki: 'tl' }
    case 'he':
      return { labelLangs: ['he', 'en'], wiki: 'he' }
    case 'fa':
      return { labelLangs: ['fa', 'en'], wiki: 'fa' }
    case 'ur':
      return { labelLangs: ['ur', 'en'], wiki: 'ur' }
    case 'no':
      return { labelLangs: ['nb', 'no', 'nn', 'en'], wiki: 'no' }
    default:
      return { labelLangs: [uiLang, 'en'], wiki: uiLang.split('-')[0] }
  }
}

export function wikiSitelinkKey(wiki: string): string {
  return `${wiki}wiki`
}

/**
 * Map UI language codes onto Wikimedia MinT / cxserver target codes.
 * Returns null when machine translation should be skipped.
 */
export function mintLangFor(uiLang: string): string | null {
  if (!uiLang || uiLang === 'en') return null
  switch (uiLang) {
    case 'zh':
      return 'zh'
    case 'zh-TW':
      // MinT has no zh-hant pair; Simplified Chinese is the best available MT target.
      return 'zh'
    case 'pt-BR':
      return 'pt'
    case 'fil':
      return 'tl'
    case 'no':
      return 'nb'
    default:
      return uiLang.split('-')[0]
  }
}
