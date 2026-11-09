import { describe, expect, it } from 'vitest'
import { detectReplyLang } from './detectReplyLang'

describe('detectReplyLang', () => {
  it('detects Chinese input even with XAUUSD ticker noise', () => {
    expect(detectReplyLang('XAUUSD 指數源突然跳價，請排查根因', 'en')).toBe('zh-Hant')
  })

  it('detects English input', () => {
    expect(
      detectReplyLang(
        'XAUUSD index source jumped; please investigate root cause and next steps.',
        'zh-Hant',
      ),
    ).toBe('en')
  })

  it('falls back when there is no linguistic signal', () => {
    expect(detectReplyLang('', 'en')).toBe('en')
    expect(detectReplyLang('12345', 'zh-Hant')).toBe('zh-Hant')
  })
})
