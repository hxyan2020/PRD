import {
  groupMarketEventPoints,
  mergeSimilarEventPoints,
  sameMarketEvent,
  eventTopicKeys,
  inferMarketPointTone,
} from '../src/engine/hourlyScan.ts'

const kitcoSurvey = {
  en: 'Kitco News Weekly Gold Survey: after spot gold broke below $3,900 (weekly low near $3,870 — weakest in over a year) amid a hawkish Fed hold, firm GDP/PCE, and Friday tech-led liquidation, Wall Street flipped sharply bearish — only 1 of 16 analysts (6%) expect a rebound next week vs 63% looking for further losses — while Main Street stayed narrowly bullish (53%); several desks flag a possible extension toward roughly $3,750–$3,850 if support fails.',
  zh: 'Kitco 每週黃金調查：現貨金跌破 3,900（週低約 3,870，逾一年最弱），背景是聯準會鷹派按兵不動。',
  sourceIds: ['kitco-survey'],
}
const kitcoParadox = {
  en: 'Kitco constructive take: sharply lower yields and a softer dollar remain the classic support mix for non-yielding gold, long-term fundamentals are intact, and the pullback below $3,900 still leaves lower prices as long-term buying opportunities even after a Fed hold and short-term liquidation.',
  zh: 'Kitco 建設性觀點：債息明顯下行與美元走軟仍是無孳息黃金的經典利好組合，長期基本面未破；即便聯準會按兵不動且短線有所回吐，跌破 3,900 後的更低價位仍可視為長期買入機會。',
  sourceIds: ['kitco-paradox'],
}
const kitcoHawkish = {
  en: 'Kitco / TD Securities (Bart Melek): the Fed left rates unchanged but kept a hawkish focus on returning inflation to 2%, leaving gold consolidating near key levels with TDS seeing a roughly $3,900–$4,250 range; Melek expects higher carry and opportunity cost while long-end yields stay restrictive, so a material near-term rebound looks unlikely even though TDS is not calling for a rout.',
  zh: 'Kitco／道明證券（Bart Melek）：聯準會維持利率不變但仍鷹派盯住 2% 通脹目標，金價在關鍵位附近盤整。',
  sourceIds: ['kitco-hawkish-pause'],
}
const kitcoRates = {
  en: 'Kitco / Catalyst Funds (David Miller): spot gold slid below $3,900 (about −3% on the week, weakest in roughly a year) as sticky inflation and higher-for-longer rate expectations outweighed softer yields and a weaker dollar; Miller frames the move as a correction after large 2024–25 gains rather than a broken bull thesis, with speculative flows weak while longer-term holders and sovereign demand still underpin the metal.',
  zh: 'Kitco／Catalyst Funds（David Miller）：現貨金跌破 3,900（週跌約 3%，約一年低位），黏性通脹與「更高更久」利率預期蓋過債息回落與美元走弱。',
  sourceIds: ['kitco-rates-holdback'],
}

console.log('tone_survey', inferMarketPointTone(kitcoSurvey.en, kitcoSurvey.zh, 'risk'))
console.log('tone_paradox', inferMarketPointTone(kitcoParadox.en, kitcoParadox.zh, 'opportunity'))
console.log('tone_hawkish', inferMarketPointTone(kitcoHawkish.en, kitcoHawkish.zh, 'risk'))
console.log('tone_rates', inferMarketPointTone(kitcoRates.en, kitcoRates.zh, 'risk'))

const softDxy = {
  en: 'Yahoo DX-Y.NYB prints 99.500, a soft dollar backdrop that lowers FX headwinds for gold and is constructive for XAUUSD perps while the index stays subdued.',
  zh: '美元偏弱减轻黄金的汇率逆风，对 XAUUSD 永续偏建设性。',
  sourceIds: ['yahoo-dxy'],
}
const firmDxy = {
  en: 'Yahoo DX-Y.NYB prints 104.500, a firm dollar backdrop that raises the FX opportunity cost of holding gold and typically pressures XAUUSD perps until the index cools.',
  zh: '美元偏强推高持有黄金的汇率机会成本，通常会压抑 XAUUSD。',
  sourceIds: ['yahoo-dxy-firm'],
}
console.log('tone_soft_dxy', inferMarketPointTone(softDxy.en, softDxy.zh, 'opportunity'))
console.log('tone_firm_dxy', inferMarketPointTone(firmDxy.en, firmDxy.zh, 'risk'))

const grouped = groupMarketEventPoints(
  [kitcoParadox, softDxy],
  [kitcoSurvey, kitcoHawkish, kitcoRates, firmDxy],
)
console.log('grouped_opp', grouped.opportunity.length, grouped.opportunity.map((p) => p.sourceIds.join('+')).join(' | '))
console.log('grouped_risk', grouped.risk.length, grouped.risk.map((p) => p.sourceIds.join('+')).join(' | '))

const oppHasParadox = grouped.opportunity.some((p) => p.sourceIds.includes('kitco-paradox'))
const oppHasSoft = grouped.opportunity.some((p) => p.sourceIds.includes('yahoo-dxy'))
const riskHasSurvey = grouped.risk.some((p) => p.sourceIds.includes('kitco-survey'))
const riskHasParadox = grouped.risk.some((p) => p.sourceIds.includes('kitco-paradox'))
const riskCluster = grouped.risk.find((p) => p.sourceIds.includes('kitco-survey'))
const oppHasNegative =
  grouped.opportunity.some((p) => /bearish|hawkish|further losses|pressures XAUUSD/i.test(p.en))
const riskHasPositiveOnlyBuy =
  grouped.risk.some((p) => /buying opportunities|constructive take|偏建设性/i.test(p.en))

const tape = {
  en: 'Binance XAUUSDT last 3900.00 vs Kitco spot 3890.00 leaves a +25.7 bps futures–spot basis — wide enough to distort mid marks.',
  zh: '基差 +25.7 bps',
  sourceIds: ['binance-ticker'],
}

const ok =
  inferMarketPointTone(kitcoParadox.en, kitcoParadox.zh, 'opportunity') === 'opportunity' &&
  inferMarketPointTone(kitcoSurvey.en, kitcoSurvey.zh, 'risk') === 'risk' &&
  inferMarketPointTone(softDxy.en, softDxy.zh, 'opportunity') === 'opportunity' &&
  inferMarketPointTone(firmDxy.en, firmDxy.zh, 'risk') === 'risk' &&
  oppHasParadox &&
  oppHasSoft &&
  riskHasSurvey &&
  !riskHasParadox &&
  (riskCluster?.sourceIds.length || 0) >= 2 &&
  !oppHasNegative &&
  !riskHasPositiveOnlyBuy &&
  sameMarketEvent(tape, kitcoSurvey) === false &&
  mergeSimilarEventPoints([kitcoSurvey, kitcoHawkish, kitcoRates]).length === 1

if (!ok) {
  console.error('FAIL', {
    oppHasParadox,
    oppHasSoft,
    riskHasSurvey,
    riskHasParadox,
    riskSources: riskCluster?.sourceIds,
    oppHasNegative,
    riskHasPositiveOnlyBuy,
  })
  process.exit(1)
}
console.log('PASS')
