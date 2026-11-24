import { describe, expect, it } from 'vitest'
import {
  assessFollowUpRelevance,
  assessRelevance,
  capabilityAnswer,
  greetingAnswer,
} from './relevance'

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
    if (!r.ok) expect(r.message).toMatch(/风险|risk-investigate|闲聊|outside/i)
  })

  it('treats hello-only as greeting mode (not a recycled off-topic brick)', () => {
    const r = assessRelevance('hello', 'en')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.mode).toBe('greeting')
  })

  it('answers knowledge-base questions as capability — not greeting', () => {
    const r = assessRelevance('你有知识库吗', 'zh-Hant')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.mode).toBe('capability')
    const reply = capabilityAnswer('你有知识库吗', 'zh-Hant')
    expect(reply).toMatch(/知识树|Knowledge/)
    expect(reply).not.toMatch(/不闲聊天气|Good afternoon/)
  })

  it('answers skill-library questions as capability', () => {
    const r = assessRelevance('你有 skill 库吗', 'zh-Hant')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.mode).toBe('capability')
    const reply = capabilityAnswer('你有 skill 库吗', 'zh-Hant')
    expect(reply).toMatch(/L1|L2|Skills/)
    expect(reply).not.toEqual(greetingAnswer('zh-Hant'))
  })

  it('handles help as capability', () => {
    const r = assessRelevance('help', 'en')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.mode).toBe('capability')
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

  it('answers capability follow-ups without off-topic reject', () => {
    const r = assessFollowUpRelevance('你有知识库吗', 'BYBIT_INDEX XAU_USD 剔除', 'zh-Hant')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.mode).toBe('capability')
  })
})
