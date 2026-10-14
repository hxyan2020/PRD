// Mock data + domain model for the AI Severity Optimization pipeline.
//
// Pipeline (完整链路):
//   1. 告警触发 (alert triggered)
//   2. 公式计算严重度 (severity formula -> P1..P4)
//   3. 24/7 值班反馈 (ops feedback: agree / disagree + 勾选不准原因)
//   4. AI 聚合相似反馈 (AI aggregates similar feedback)
//   5. 每周推荐新严重度公式 (weekly recommendation: add/remove factors, re-weight)
//   6. RO 批准 -> 新公式生效 (RO approval -> new formula active)

export type SeverityLevel = 'P1' | 'P2' | 'P3' | 'P4'

/** A single factor that can participate in a severity formula. */
export type SeverityFactor = {
  key: string
  name: string
  nameEn: string
  description: string
}

/** A concrete, versioned severity formula (weighted factor model). */
export type SeverityFormula = {
  version: string
  /** factor key -> weight (weights across used factors sum to 1). */
  weights: Record<string, number>
  /** score cut-offs; score >= p1 => P1, >= p2 => P2, >= p3 => P3, else P4. */
  thresholds: { p1: number; p2: number; p3: number }
}

export type FormulaVersionMeta = {
  version: string
  status: 'active' | 'archived' | 'proposed'
  effectiveFrom: string
  author: string
  note: string
}

/** 值班反馈不准原因 options. */
export const feedbackReasons = [
  '资金影响被高估',
  '影响范围被高估',
  '可自动恢复 / 自愈，无需 P1 响应',
  '重复 / 抖动告警 (flapping)',
  '缺少"自愈能力"因子导致误判',
  '监管 / 合规风险被低估',
  '客户已实际受影响，严重度被低估',
  '阈值划分不合理',
] as const

export type OpsFeedback = {
  agree: boolean
  suggestedSeverity: SeverityLevel
  reasons: string[]
  note: string
  operator: string
  at: string
}

export type IncidentAlert = {
  id: string
  title: string
  category: string
  metric: string
  triggeredAt: string
  /** raw per-factor scores (0-100). Superset of all known factors so any
   *  formula version can be re-applied for simulation. */
  factorScores: Record<string, number>
  feedback?: OpsFeedback
}

export type FormulaChange =
  | { type: 'add_factor'; factor: string; weight: number; rationale: string }
  | { type: 'remove_factor'; factor: string; rationale: string }
  | { type: 'adjust_weight'; factor: string; from: number; to: number; rationale: string }
  | { type: 'adjust_threshold'; level: 'p1' | 'p2' | 'p3'; from: number; to: number; rationale: string }

export type Recommendation = {
  id: string
  week: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  summary: string
  basedOnFeedbackCount: number
  /** aggregated top reasons with counts (AI clustering output). */
  aggregatedReasons: { reason: string; count: number }[]
  changes: FormulaChange[]
  proposedFormula: SeverityFormula
  decidedBy?: string
  decidedAt?: string
  decisionNote?: string
}

// ---------------------------------------------------------------------------
// Factor catalogue
// ---------------------------------------------------------------------------

export const factorCatalogue: SeverityFactor[] = [
  { key: 'funds', name: '资金影响', nameEn: 'Funds Impact', description: '潜在资金损失规模 / 对平台与用户资产的影响' },
  { key: 'scope', name: '用户影响范围', nameEn: 'User Impact Scope', description: '受影响的用户数 / 订单数 / 合约数' },
  { key: 'recover', name: '可恢复性', nameEn: 'Recoverability', description: '恢复难度，越高表示越难人工/自动恢复' },
  { key: 'compliance', name: '监管合规风险', nameEn: 'Compliance Risk', description: '监管、合规与声誉风险' },
  { key: 'duration', name: '持续时长', nameEn: 'Duration', description: '告警持续时间，越长越严重' },
  { key: 'selfHealRisk', name: '自愈失败风险', nameEn: 'Self-Heal Failure Risk', description: '无法自动恢复的风险，越高表示越不可能自愈 (AI 推荐新增)' },
]

export const factorByKey: Record<string, SeverityFactor> = Object.fromEntries(
  factorCatalogue.map((f) => [f.key, f]),
)

// ---------------------------------------------------------------------------
// Formula versions
// ---------------------------------------------------------------------------

/** Currently active formula (v3). Does NOT include a self-heal factor. */
export const activeFormula: SeverityFormula = {
  version: 'v3',
  weights: { funds: 0.3, scope: 0.25, recover: 0.15, compliance: 0.15, duration: 0.15 },
  thresholds: { p1: 75, p2: 50, p3: 25 },
}

export const formulaHistory: FormulaVersionMeta[] = [
  { version: 'v3', status: 'active', effectiveFrom: '2026-09-29', author: 'RO · Haixiang Yan', note: '新增"持续时长"因子，缓解瞬时抖动误报' },
  { version: 'v2', status: 'archived', effectiveFrom: '2026-07-14', author: 'RO · Natalie Chen', note: '上调"监管合规风险"权重' },
  { version: 'v1', status: 'archived', effectiveFrom: '2026-05-05', author: 'Risk Team', note: '初始四因子加权模型' },
]

// ---------------------------------------------------------------------------
// Incident alerts (with ops feedback)
// ---------------------------------------------------------------------------

export const severityAlerts: IncidentAlert[] = [
  {
    id: 'ALM-24101',
    title: '指数价格源超时未更新',
    category: '指数价格源预警',
    metric: '当前时间 − 上次更新时间 ≥ TTL',
    triggeredAt: '2026-10-13 02:14:08',
    factorScores: { funds: 70, scope: 90, recover: 85, compliance: 60, duration: 80, selfHealRisk: 20 },
    feedback: {
      agree: false,
      suggestedSeverity: 'P2',
      reasons: ['可自动恢复 / 自愈，无需 P1 响应', '缺少"自愈能力"因子导致误判'],
      note: '备用源 (Binance) 已自动接管，指数在 8s 内恢复，无需 P1 全员响应。',
      operator: '值班 · Alex Huang',
      at: '2026-10-13 02:19:40',
    },
  },
  {
    id: 'ALM-24102',
    title: '大额爆仓预警',
    category: '强平',
    metric: 'MMR < 阈值 且 仓位价值 > 阈值',
    triggeredAt: '2026-10-13 05:41:22',
    factorScores: { funds: 95, scope: 80, recover: 95, compliance: 70, duration: 60, selfHealRisk: 100 },
    feedback: {
      agree: true,
      suggestedSeverity: 'P1',
      reasons: [],
      note: '确为大额爆仓，P1 合理，已拉群处理。',
      operator: '值班 · Mia Zhao',
      at: '2026-10-13 05:44:10',
    },
  },
  {
    id: 'ALM-24103',
    title: '盘口插针 (价差预警)',
    category: '盘面异常',
    metric: '|最新成交价 − 指数价格| / 指数价格 × 100%',
    triggeredAt: '2026-10-13 08:02:55',
    factorScores: { funds: 55, scope: 70, recover: 40, compliance: 30, duration: 45, selfHealRisk: 20 },
    feedback: {
      agree: false,
      suggestedSeverity: 'P3',
      reasons: ['重复 / 抖动告警 (flapping)', '影响范围被高估'],
      note: '单笔小额插针，1s 内回归，属抖动，建议 P3。',
      operator: '值班 · Alex Huang',
      at: '2026-10-13 08:05:12',
    },
  },
  {
    id: 'ALM-24104',
    title: 'DB 心跳预警',
    category: '强平 · DB 账户',
    metric: 'DB 心跳断连',
    triggeredAt: '2026-10-12 23:11:03',
    factorScores: { funds: 85, scope: 80, recover: 85, compliance: 70, duration: 75, selfHealRisk: 90 },
    feedback: {
      agree: true,
      suggestedSeverity: 'P1',
      reasons: [],
      note: 'DB 断连确属 P1，立即介入。',
      operator: '值班 · Mia Zhao',
      at: '2026-10-12 23:12:40',
    },
  },
  {
    id: 'ALM-24105',
    title: '外部资金费率监控',
    category: '资金费异常',
    metric: '|平台费率 − 竞品费率|',
    triggeredAt: '2026-10-12 16:30:41',
    factorScores: { funds: 55, scope: 65, recover: 45, compliance: 45, duration: 50, selfHealRisk: 40 },
    feedback: {
      agree: false,
      suggestedSeverity: 'P3',
      reasons: ['资金影响被高估'],
      note: '费率差在可接受区间，不构成 P2，建议 P3 观察。',
      operator: '值班 · Leo Tan',
      at: '2026-10-12 16:36:20',
    },
  },
  {
    id: 'ALM-24106',
    title: '用户快照与流水勾稽失败',
    category: '财务报表与对账预警',
    metric: '快照与流水不一致',
    triggeredAt: '2026-10-12 00:05:17',
    factorScores: { funds: 80, scope: 70, recover: 75, compliance: 90, duration: 80, selfHealRisk: 80 },
    feedback: {
      agree: false,
      suggestedSeverity: 'P2',
      reasons: ['可自动恢复 / 自愈，无需 P1 响应', '资金影响被高估'],
      note: 'T+1 对账任务可重跑修复，非实时资金风险，建议 P2。',
      operator: '值班 · Leo Tan',
      at: '2026-10-12 00:12:51',
    },
  },
  {
    id: 'ALM-24107',
    title: '档位深度监控 (盘面流动性)',
    category: '盘面异常',
    metric: '买/卖盘累计深度价值',
    triggeredAt: '2026-10-11 19:48:30',
    factorScores: { funds: 30, scope: 45, recover: 25, compliance: 15, duration: 30, selfHealRisk: 30 },
    feedback: {
      agree: true,
      suggestedSeverity: 'P3',
      reasons: [],
      note: '深度略薄，P3 合理，已通知 MM。',
      operator: '值班 · Alex Huang',
      at: '2026-10-11 19:55:02',
    },
  },
  {
    id: 'ALM-24108',
    title: '友商价差监控',
    category: '平台定价 / 价格异常',
    metric: '|平台最新价 − 竞品最新价| / 最新价 × 100%',
    triggeredAt: '2026-10-13 10:22:14',
    factorScores: { funds: 40, scope: 55, recover: 30, compliance: 25, duration: 35, selfHealRisk: 25 },
  },
  {
    id: 'ALM-24109',
    title: '标记价格降级',
    category: '标记价格计算异常预警',
    metric: '计算失败 → 降级 / 进入观察期',
    triggeredAt: '2026-10-13 03:58:47',
    factorScores: { funds: 60, scope: 70, recover: 55, compliance: 45, duration: 55, selfHealRisk: 60 },
    feedback: {
      agree: false,
      suggestedSeverity: 'P1',
      reasons: ['客户已实际受影响，严重度被低估', '影响范围被高估'],
      note: '标记价降级直接影响强平线，客户已反馈异常，应升为 P1。',
      operator: '值班 · Mia Zhao',
      at: '2026-10-13 04:03:30',
    },
  },
  {
    id: 'ALM-24110',
    title: '注资金额上限预警',
    category: '强平 · DB 账户',
    metric: '注资金额超过上限',
    triggeredAt: '2026-10-13 11:40:09',
    factorScores: { funds: 50, scope: 40, recover: 45, compliance: 60, duration: 40, selfHealRisk: 70 },
  },
]

// ---------------------------------------------------------------------------
// Weekly AI recommendations
// ---------------------------------------------------------------------------

export const recommendations: Recommendation[] = [
  {
    id: 'REC-2026-W41',
    week: '2026-W41 (10/06 – 10/12)',
    status: 'pending',
    createdAt: '2026-10-13 06:00',
    summary:
      '本周 58 条值班反馈中 41 条认为 P1 过载，集中在"可自愈的指数源/标记价类告警"。AI 建议新增「自愈失败风险」因子，并下调"资金影响""可恢复性"权重、上调 P1 阈值，使自愈类告警自动降级。',
    basedOnFeedbackCount: 58,
    aggregatedReasons: [
      { reason: '可自动恢复 / 自愈，无需 P1 响应', count: 23 },
      { reason: '缺少"自愈能力"因子导致误判', count: 18 },
      { reason: '重复 / 抖动告警 (flapping)', count: 11 },
      { reason: '资金影响被高估', count: 9 },
      { reason: '客户已实际受影响，严重度被低估', count: 6 },
    ],
    changes: [
      { type: 'add_factor', factor: 'selfHealRisk', weight: 0.12, rationale: '区分可自愈与不可自愈告警，自愈类自动降级' },
      { type: 'adjust_weight', factor: 'funds', from: 0.3, to: 0.24, rationale: '腾出权重给自愈因子，减少资金维度对瞬时告警的放大' },
      { type: 'adjust_weight', factor: 'recover', from: 0.15, to: 0.12, rationale: '与自愈因子存在重叠，适度下调' },
      { type: 'adjust_threshold', level: 'p1', from: 75, to: 78, rationale: '收紧 P1 入口，降低 P1 过载' },
    ],
    proposedFormula: {
      version: 'v4 (proposed)',
      weights: { funds: 0.24, scope: 0.25, recover: 0.12, compliance: 0.15, duration: 0.12, selfHealRisk: 0.12 },
      thresholds: { p1: 78, p2: 50, p3: 25 },
    },
  },
  {
    id: 'REC-2026-W40',
    week: '2026-W40 (09/29 – 10/05)',
    status: 'approved',
    createdAt: '2026-10-06 06:00',
    summary: '新增"持续时长"因子以抑制瞬时抖动误报；该版本已由 RO 批准并作为 v3 生效。',
    basedOnFeedbackCount: 44,
    aggregatedReasons: [
      { reason: '重复 / 抖动告警 (flapping)', count: 19 },
      { reason: '影响范围被高估', count: 12 },
      { reason: '阈值划分不合理', count: 8 },
    ],
    changes: [
      { type: 'add_factor', factor: 'duration', weight: 0.15, rationale: '引入持续时长，抑制瞬时抖动误报' },
    ],
    proposedFormula: {
      version: 'v3',
      weights: { funds: 0.3, scope: 0.25, recover: 0.15, compliance: 0.15, duration: 0.15 },
      thresholds: { p1: 75, p2: 50, p3: 25 },
    },
    decidedBy: 'RO · Haixiang Yan',
    decidedAt: '2026-10-06 14:20',
    decisionNote: '批准，抖动误报下降明显。',
  },
  {
    id: 'REC-2026-W39',
    week: '2026-W39 (09/22 – 09/28)',
    status: 'rejected',
    createdAt: '2026-09-29 06:00',
    summary: '建议移除"监管合规风险"因子以简化模型，RO 认为合规维度不可删除，已驳回。',
    basedOnFeedbackCount: 31,
    aggregatedReasons: [
      { reason: '阈值划分不合理', count: 14 },
      { reason: '资金影响被高估', count: 10 },
    ],
    changes: [
      { type: 'remove_factor', factor: 'compliance', rationale: '触发频率低，疑似冗余' },
    ],
    proposedFormula: {
      version: 'v3-alt (rejected)',
      weights: { funds: 0.35, scope: 0.3, recover: 0.2, duration: 0.15 },
      thresholds: { p1: 75, p2: 50, p3: 25 },
    },
    decidedBy: 'RO · Haixiang Yan',
    decidedAt: '2026-09-29 15:10',
    decisionNote: '驳回：合规维度为硬性要求，不可移除。',
  },
]
