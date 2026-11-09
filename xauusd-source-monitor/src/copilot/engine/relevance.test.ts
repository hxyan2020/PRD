import { describe, expect, it } from 'vitest'
import { assessFollowUpRelevance, assessRelevance } from './relevance'

describe('assessRelevance', () => {
  it('accepts BYBIT index alert text', () => {
    expect(
      assessRelevance(
        '【指数源变更剔除告警】当前剔除成分为 (BYBIT_INDEX XAU_USD)',
        'zh-Hant',
      ).ok,
    ).toBe(true)
  })

  it('gently rejects chit-chat and off-topic asks', () => {
    const r = assessRelevance('今天天气怎么样？推荐一部电影', 'zh-Hant')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message).toMatch(/风险排查|risk-investigate|抱歉|Sorry/)
  })

  it('rejects hello-only prompts', () => {
    expect(assessRelevance('hello', 'en').ok).toBe(false)
  })
})

describe('assessFollowUpRelevance', () => {
  it('allows clarifying follow-ups on an open RCA', () => {
    expect(
      assessFollowUpRelevance('下一步怎么做？', 'BYBIT_INDEX XAU_USD 剔除', 'zh-Hant').ok,
    ).toBe(true)
  })

  it('rejects unrelated follow-ups', () => {
    const r = assessFollowUpRelevance('帮我写一首诗', 'BYBIT_INDEX XAU_USD 剔除', 'zh-Hant')
    expect(r.ok).toBe(false)
  })
})
