import { describe, expect, it } from 'vitest'
import {
  findRecentSameInvestigation,
  investigationFingerprint,
} from './fingerprint'

describe('investigationFingerprint', () => {
  it('is stable for the same alert text', () => {
    const a = investigationFingerprint({
      facts: '【指数源变更剔除告警】BYBIT_INDEX',
    })
    const b = investigationFingerprint({
      facts: '【指数源变更剔除告警】  BYBIT_INDEX',
    })
    expect(a).toEqual(b)
  })

  it('differs for a different alert', () => {
    const a = investigationFingerprint({ facts: '剔除告警 BYBIT' })
    const b = investigationFingerprint({ facts: 'Mark 降级告警' })
    expect(a).not.toEqual(b)
  })

  it('findRecentSameInvestigation returns prior within window', () => {
    const fp = investigationFingerprint({ facts: 'IDX-08 single source' })
    const prior = {
      fingerprint: fp,
      facts: 'IDX-08 single source',
      createdAt: Date.now() - 60_000,
    }
    expect(findRecentSameInvestigation([prior], fp)).toBe(prior)
    expect(
      findRecentSameInvestigation(
        [{ ...prior, createdAt: Date.now() - 60 * 60 * 1000 }],
        fp,
      ),
    ).toBeNull()
  })
})
