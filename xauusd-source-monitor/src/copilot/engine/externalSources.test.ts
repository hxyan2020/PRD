import { describe, expect, it } from 'vitest'
import { resolveCuratedExternalPages } from './externalSources'

describe('resolveCuratedExternalPages', () => {
  it('attaches Bybit trade/help deep links for BYBIT_INDEX alerts', () => {
    const pages = resolveCuratedExternalPages(
      '【指数源变更剔除告警】当前剔除成分为 (BYBIT_INDEX XAU_USD)',
      'zh-Hant',
    )
    expect(pages.some((p) => /bybit\.com\/trade/i.test(p.url))).toBe(true)
    expect(pages.some((p) => /index-price|Index-Price|Index Price/i.test(p.url + p.label))).toBe(
      true,
    )
    expect(pages.every((p) => p.url.startsWith('http'))).toBe(true)
  })
})
