import {
  groupMarketEventPoints,
  mergeSimilarEventPoints,
  sameMarketEvent,
  eventTopicKeys,
} from '../src/engine/hourlyScan.ts'

const kitcoSurvey = {
  en: 'Kitco News Weekly Gold Survey: after spot gold broke below $3,900 (weekly low near $3,870 — weakest in over a year) amid a hawkish Fed hold, firm GDP/PCE, and Friday tech-led liquidation, Wall Street flipped sharply bearish — only 1 of 16 analysts (6%) expect a rebound next week vs 63% looking for further losses — while Main Street stayed narrowly bullish (53%); several desks flag a possible extension toward roughly $3,750–$3,850 if support fails.',
  zh: 'Kitco 每週黃金調查：現貨金跌破 3,900（週低約 3,870，逾一年最弱），背景是聯準會鷹派按兵不動。',
  sourceIds: ['kitco-survey'],
}
const kitcoParadox = {
  en: "Kitco: even after a Fed hold, sharply lower yields and a softer dollar — the classic support mix for non-yielding gold — prices still fell about 3% on the week below $3,900, their weakest level in over a year, as traders price higher-for-longer policy and Iran-linked oil inflation; Kitco argues the long-term fundamentals are intact and frames the selloff as frustrating short-term action that still leaves lower prices as long-term buying opportunities.",
  zh: 'Kitco：即便聯準會按兵不動、債息明顯下行、美元走軟——金價仍週跌約 3%、跌破 3,900。',
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

const opportunityRaw = [kitcoParadox]
const riskRaw = [kitcoSurvey, kitcoHawkish, kitcoRates]

console.log('keys_survey', [...eventTopicKeys(kitcoSurvey.en)].join(','))
console.log('keys_hawkish', [...eventTopicKeys(kitcoHawkish.en)].join(','))
console.log('keys_paradox', [...eventTopicKeys(kitcoParadox.en)].join(','))
console.log('keys_rates', [...eventTopicKeys(kitcoRates.en)].join(','))
console.log('same survey↔hawkish', sameMarketEvent(kitcoSurvey, kitcoHawkish))
console.log('same survey↔paradox', sameMarketEvent(kitcoSurvey, kitcoParadox))
console.log('same hawkish↔rates', sameMarketEvent(kitcoHawkish, kitcoRates))

const grouped = groupMarketEventPoints(opportunityRaw, riskRaw)
const all = [...grouped.opportunity, ...grouped.risk]
console.log('grouped_opp', grouped.opportunity.length, 'grouped_risk', grouped.risk.length)
console.log(
  'clusters',
  all.map((p) => `${p.sourceIds.length}:${p.sourceIds.join('+')}`).join(' | '),
)

const goldCluster = all.find((p) => p.sourceIds.includes('kitco-survey'))
console.log('gold_cluster_sources', goldCluster?.sourceIds.join(','))
console.log('gold_cluster_tone_section', grouped.risk.some((p) => p.sourceIds.includes('kitco-survey')) ? 'risk' : 'opportunity')

const tape = {
  en: 'Binance XAUUSDT last 3900.00 vs Kitco spot 3890.00 leaves a +25.7 bps futures–spot basis — wide enough to distort mid marks.',
  zh: '基差 +25.7 bps',
  sourceIds: ['binance-ticker'],
}
console.log('tape_vs_news_same', sameMarketEvent(tape, kitcoSurvey))

const dxyA = {
  en: 'Yahoo DX-Y.NYB prints 104.500, a firm dollar backdrop that raises the FX opportunity cost of holding gold.',
  zh: '美元指数偏强',
  sourceIds: ['yahoo-dxy'],
}
const dxyB = {
  en: 'Yahoo DX-Y.NYB prints 104.800, a firm dollar backdrop that raises the FX opportunity cost of holding gold and typically pressures XAUUSD perps until the index cools.',
  zh: '美元指数偏强压制金价',
  sourceIds: ['yahoo-dxy-dup'],
}
console.log('same dxy↔dxy', sameMarketEvent(dxyA, dxyB))
console.log('dxy_vs_kitco', sameMarketEvent(dxyA, kitcoSurvey))

const mergedRisk = mergeSimilarEventPoints(riskRaw)
console.log('merged_risk_only', mergedRisk.length, mergedRisk.map((p) => p.sourceIds.join('+')).join(' | '))

const ok =
  Boolean(goldCluster) &&
  (goldCluster?.sourceIds.length || 0) >= 3 &&
  all.length === 1 &&
  sameMarketEvent(kitcoSurvey, kitcoParadox) === true &&
  sameMarketEvent(tape, kitcoSurvey) === false &&
  sameMarketEvent(dxyA, dxyB) === true &&
  sameMarketEvent(dxyA, kitcoSurvey) === false &&
  mergedRisk.length === 1

if (!ok) {
  console.error('FAIL', { allLen: all.length, sources: goldCluster?.sourceIds })
  process.exit(1)
}
console.log('PASS')
