import { describe, expect, it } from 'vitest'
import { analyzeWithRules, extractAlertFacts } from './rules'
import { defaultSkills } from '../storage'

const ALERT = `【指数源变更剔除告警】
指数: XAU_USD
触发时间: 2026-11-08 16:39:35
内容: XAU_USD指数成分被剔除，当前剔除成分为 (BYBIT_INDEX XAU_USD)

【指数价格线性过渡结束】
指数: XAU_USD
触发时间: 2026-11-08 16:39:36
窗口时长: 15秒
当前价格: 4065.636176216581268972

【指数价格线性过渡开始】
指数: XAU_USD
触发时间: 2026-11-08 16:41:39
窗口时长: 15秒
当前价格: 4065.591649483256924819

【指数源变更恢复告警】
指数: XAU_USD
内容: XAU_USD指数成分被恢复，当前恢复成分为 (BYBIT_INDEX XAU_USD)`

const NOISY_BRIEFING = `
【XAUUSD source-monitor briefing】CRITICAL 突發衝擊
【Causes】Kitco 華爾街拋售
Mark vs Index Funding K线 对账 强平
`

describe('alert-grounded RCA', () => {
  it('extracts BYBIT_INDEX removal / transition / recovery facts', () => {
    const facts = extractAlertFacts(ALERT, true)
    expect(facts.some((f) => /剔除|BYBIT_INDEX/.test(f))).toBe(true)
    expect(facts.some((f) => /线性过渡/.test(f))).toBe(true)
    expect(facts.some((f) => /恢复/.test(f))).toBe(true)
  })

  it('matches IDX skills and does not dump unrelated L2 boilerplate', () => {
    const r = analyzeWithRules({
      text: `${ALERT}\n\n${NOISY_BRIEFING}`,
      matchFocus: ALERT,
      severity: '自动建议',
      skills: defaultSkills(),
      knowledge: [],
      tree: [],
      lang: 'zh-Hant',
    })
    expect(r.hits.some((id) => id.startsWith('IDX-'))).toBe(true)
    expect(r.skillMatched).toBe(true)
    expect(r.rootCauses.some((x) => /已证实|BYBIT_INDEX|剔除/.test(x))).toBe(true)
    expect(r.rootCauses.every((x) => !/需驗證其上游故障是否早於下游異常/.test(x))).toBe(true)
    // Noisy briefing must not force funding/kline as primary root causes
    expect(r.rootCauses.some((x) => /Funding 异常|K线策略/.test(x))).toBe(false)
    expect(r.pathSteps[0]).toMatch(/告警原文|alert text/i)
  })

  it('states skill gap when nothing in the catalog matches', () => {
    const r = analyzeWithRules({
      text: '完全无关的内部代号 XYZ-999 没有技能覆盖',
      matchFocus: '完全无关的内部代号 XYZ-999 没有技能覆盖',
      severity: '自动建议',
      skills: defaultSkills(),
      knowledge: [],
      tree: [],
      lang: 'zh-Hant',
    })
    expect(r.skillMatched).toBe(false)
    expect(r.hits.length).toBe(0)
    expect(r.rootCauses.some((x) => /Skill 缺口|未匹配到已定义/.test(x))).toBe(true)
  })
})
