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
    expect(r.body.indexOf('\n根因\n')).toBeGreaterThanOrEqual(0)
    expect(r.body.indexOf('\n根因\n')).toBeLessThan(r.body.indexOf('\n排查路徑\n'))
    expect(r.body.indexOf('\n排查路徑\n')).toBeLessThan(r.body.indexOf('\n下一步'))
    expect(r.body).not.toMatch(/^#{1,6}\s/m)
    expect(r.body).not.toMatch(/\*\*/)
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
    expect(r.body.indexOf('\nRoot cause\n')).toBeGreaterThanOrEqual(0)
    expect(r.body.indexOf('\nRoot cause\n')).toBeLessThan(r.body.indexOf('\nInvestigation path\n'))
    expect(r.body.indexOf('\nInvestigation path\n')).toBeLessThan(
      r.body.indexOf('\nNext steps / recommendations'),
    )
    expect(r.body).not.toMatch(/【Root cause】/)
  })
})
