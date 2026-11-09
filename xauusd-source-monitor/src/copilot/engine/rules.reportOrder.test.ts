import { describe, expect, it } from 'vitest'
import { analyzeWithRules } from './rules'
import type { SkillRecord } from '../types'

const emptySkills: SkillRecord[] = []

describe('analyzeWithRules report order', () => {
  it('puts root cause before path and next steps (zh)', () => {
    const r = analyzeWithRules({
      text: 'XAUUSD 指數源突然偏離，疑似 LP 報價異常',
      severity: '自动建议',
      skills: emptySkills,
      knowledge: [],
      tree: [],
      startedAt: Date.now(),
      lang: 'zh-Hant',
    })
    expect(r.rootCauses.length).toBeGreaterThan(0)
    expect(r.pathSteps.length).toBeGreaterThan(0)
    expect(r.nextSteps.length).toBeGreaterThan(0)
    expect(r.body.indexOf('【根因】')).toBeGreaterThanOrEqual(0)
    expect(r.body.indexOf('【根因】')).toBeLessThan(r.body.indexOf('【排查路徑】'))
    expect(r.body.indexOf('【排查路徑】')).toBeLessThan(r.body.indexOf('【下一步'))
  })

  it('puts root cause before path and next steps (en)', () => {
    const r = analyzeWithRules({
      text: 'XAUUSD index source sudden deviation, suspected LP quote fault',
      severity: '自动建议',
      skills: emptySkills,
      knowledge: [],
      tree: [],
      startedAt: Date.now(),
      lang: 'en',
    })
    expect(r.body.indexOf('【Root cause】')).toBeGreaterThanOrEqual(0)
    expect(r.body.indexOf('【Root cause】')).toBeLessThan(r.body.indexOf('【Investigation path】'))
    expect(r.body.indexOf('【Investigation path】')).toBeLessThan(
      r.body.indexOf('【Next steps / recommendations'),
    )
  })
})
