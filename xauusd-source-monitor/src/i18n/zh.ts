import * as OpenCC from 'opencc-js'
import { isZh, type AppLang } from './messages'

const toHans = OpenCC.Converter({ from: 'tw', to: 'cn' })
const toHant = OpenCC.Converter({ from: 'cn', to: 'tw' })

/**
 * Pick Chinese vs English content for bilingual fields.
 * Stored `*.zh` blobs are treated as Chinese (shared by 简中 / 繁中);
 * when UI is Simplified, Traditional source strings are converted.
 */
export function zhField(lang: AppLang, zh: string, en: string): string {
  if (!isZh(lang)) return en
  if (lang === 'zh-Hans') return toHans(zh)
  return zh
}

/** Localize an inline Traditional Chinese string for the active UI lang. */
export function zhUi(lang: AppLang, hant: string, hans?: string): string {
  if (lang === 'zh-Hans') return hans ?? toHans(hant)
  return hant
}

/** Localize an inline Simplified Chinese string for the active UI lang. */
export function zhFromHans(lang: AppLang, hans: string): string {
  if (lang === 'zh-Hant') return toHant(hans)
  return hans
}

export { isZh }
export type { AppLang }
