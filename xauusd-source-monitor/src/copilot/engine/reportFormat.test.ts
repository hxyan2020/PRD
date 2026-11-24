import { describe, expect, it } from 'vitest'
import { stripMarkdownNoise } from './reportFormat'

describe('stripMarkdownNoise', () => {
  it('removes common markdown chrome but keeps alert titles with 【】', () => {
    const raw = [
      '## Root cause',
      '',
      '**Confirmed** fact from 【指数源变更剔除告警】',
      '- check `IDX-01`',
      '',
      '---',
      '',
      'See [OKX](https://www.okx.com/trade)',
    ].join('\n')
    const out = stripMarkdownNoise(raw)
    expect(out).not.toMatch(/\*\*/)
    expect(out).not.toMatch(/^## /m)
    expect(out).not.toMatch(/`IDX-01`/)
    expect(out).toContain('【指数源变更剔除告警】')
    expect(out).toContain('OKX (https://www.okx.com/trade)')
    expect(out).toContain('IDX-01')
  })
})
