export type SeverityLevel = 'P0' | 'P1' | 'P2' | 'P3'

export type SeverityFactor = {
  id: string
  name: string
  description: string
  weight: number
  enabled: boolean
}

export type SeverityFormula = {
  version: string
  effectiveFrom: string
  expression: string
  thresholds: { level: SeverityLevel; minScore: number }[]
  factors: SeverityFactor[]
}

export type AlertIncident = {
  id: string
  contract: string
  alertType: string
  alertValue: string
  firedAt: string
  channel: string
  formulaScore: number
  formulaSeverity: SeverityLevel
  factorBreakdown: { factorId: string; raw: number; weighted: number }[]
  feedback?: {
    operator: string
    submittedAt: string
    expectedSeverity: SeverityLevel
    reasons: string[]
    note?: string
  }
}

export const inaccuracyReasonOptions = [
  { value: 'impact_overrated', label: '业务影响被高估（实际可降级处理）' },
  { value: 'auto_recovery', label: '已有自动恢复 / 冗余，无需 P1 响应' },
  { value: 'low_traffic_false_positive', label: '低流量时段误触（夜间/周末）' },
  { value: 'weight_unreasonable', label: '某因子权重不合理' },
  { value: 'missing_factor', label: '缺少关键因子（合约重要性、用户量等）' },
  { value: 'threshold_too_aggressive', label: 'P1/P2 分界阈值过严' },
  { value: 'duplicate_noise', label: '与近期重复告警，不应重复计分' },
  { value: 'other', label: '其他（见备注）' },
]

export const currentSeverityFormula: SeverityFormula = {
  version: 'v2.3.1',
  effectiveFrom: '2026-09-01',
  expression: 'severity_score = clamp(Σ weight_i × normalize(factor_i), 0, 100)',
  thresholds: [
    { level: 'P0', minScore: 92 },
    { level: 'P1', minScore: 78 },
    { level: 'P2', minScore: 55 },
    { level: 'P3', minScore: 0 },
  ],
  factors: [
    {
      id: 'notional_exposure',
      name: '名义敞口',
      description: '告警涉及合约/账户名义价值（USD）',
      weight: 0.28,
      enabled: true,
    },
    {
      id: 'user_reach',
      name: '影响用户数',
      description: '可能受影响的用户或账户数量',
      weight: 0.18,
      enabled: true,
    },
    {
      id: 'market_liquidity',
      name: '流动性风险',
      description: '深度、价差、无成交时长等综合',
      weight: 0.22,
      enabled: true,
    },
    {
      id: 'price_deviation',
      name: '价格偏离',
      description: '相对指数/标记/竞品偏离幅度',
      weight: 0.17,
      enabled: true,
    },
    {
      id: 'duration_persistence',
      name: '持续时长',
      description: '异常状态持续分钟数',
      weight: 0.1,
      enabled: true,
    },
    {
      id: 'slo_breach',
      name: 'SLO 违约',
      description: '是否触及 SLA/SLO 红线',
      weight: 0.05,
      enabled: true,
    },
  ],
}

/** 示例：公式判 P1，值班认为 P2 */
export const seedAlertIncidents: AlertIncident[] = [
  {
    id: 'INC-20261013-0847',
    contract: 'XAU_USD',
    alertType: '深度告警',
    alertValue: 'BUY 侧 0.1% 深度 12,400 USD（阈值 ≤ 50,000）',
    firedAt: '2026-10-13 08:47:22',
    channel: 'Lark · 盘面异常告警（生产）',
    formulaScore: 81.6,
    formulaSeverity: 'P1',
    factorBreakdown: [
      { factorId: 'market_liquidity', raw: 88, weighted: 19.36 },
      { factorId: 'notional_exposure', raw: 72, weighted: 20.16 },
      { factorId: 'price_deviation', raw: 65, weighted: 11.05 },
      { factorId: 'duration_persistence', raw: 40, weighted: 4.0 },
      { factorId: 'user_reach', raw: 55, weighted: 9.9 },
      { factorId: 'slo_breach', raw: 0, weighted: 0 },
    ],
    feedback: {
      operator: 'Ops · Chen Wei',
      submittedAt: '2026-10-13 09:05:11',
      expectedSeverity: 'P2',
      reasons: ['low_traffic_false_positive', 'auto_recovery', 'impact_overrated'],
      note: '亚洲早盘流动性本就偏薄，5 分钟内深度已恢复；无需 P1 全员响应。',
    },
  },
  {
    id: 'INC-20261012-2315',
    contract: 'BTC_USD',
    alertType: '标记价格偏离',
    alertValue: '偏离指数 0.42%（阈值 0.35%）',
    firedAt: '2026-10-12 23:15:08',
    channel: 'Lark · 标记价格异常告警（生产）',
    formulaScore: 76.2,
    formulaSeverity: 'P1',
    factorBreakdown: [
      { factorId: 'price_deviation', raw: 82, weighted: 13.94 },
      { factorId: 'notional_exposure', raw: 95, weighted: 26.6 },
      { factorId: 'user_reach', raw: 78, weighted: 14.04 },
      { factorId: 'market_liquidity', raw: 45, weighted: 9.9 },
      { factorId: 'duration_persistence', raw: 25, weighted: 2.5 },
      { factorId: 'slo_breach', raw: 50, weighted: 2.5 },
    ],
    feedback: {
      operator: 'Ops · Li Ming',
      submittedAt: '2026-10-13 00:02:44',
      expectedSeverity: 'P2',
      reasons: ['weight_unreasonable', 'missing_factor'],
      note: 'BTC 主合约权重过高；应加入「是否已有指数源降级」因子。',
    },
  },
  {
    id: 'INC-20261011-1410',
    contract: 'ETH_USD',
    alertType: '无成交监控',
    alertValue: '无成交 195s（阈值 ≥ 30s）',
    firedAt: '2026-10-11 14:10:33',
    channel: 'Lark · 盘面异常告警（生产）',
    formulaScore: 58.4,
    formulaSeverity: 'P2',
    factorBreakdown: [
      { factorId: 'duration_persistence', raw: 70, weighted: 7.0 },
      { factorId: 'market_liquidity', raw: 62, weighted: 13.64 },
      { factorId: 'notional_exposure', raw: 48, weighted: 13.44 },
      { factorId: 'user_reach', raw: 35, weighted: 6.3 },
      { factorId: 'price_deviation', raw: 20, weighted: 3.4 },
      { factorId: 'slo_breach', raw: 0, weighted: 0 },
    ],
  },
  {
    id: 'INC-20261010-0318',
    contract: 'XAU_USD',
    alertType: '深度告警',
    alertValue: 'SELL 侧深度不足',
    firedAt: '2026-10-10 03:18:51',
    channel: 'Lark · 盘面异常告警（生产）',
    formulaScore: 79.8,
    formulaSeverity: 'P1',
    factorBreakdown: [
      { factorId: 'market_liquidity', raw: 85, weighted: 18.7 },
      { factorId: 'notional_exposure', raw: 68, weighted: 19.04 },
      { factorId: 'duration_persistence', raw: 55, weighted: 5.5 },
      { factorId: 'user_reach', raw: 50, weighted: 9.0 },
      { factorId: 'price_deviation', raw: 58, weighted: 9.86 },
      { factorId: 'slo_breach', raw: 0, weighted: 0 },
    ],
    feedback: {
      operator: 'Ops · Chen Wei',
      submittedAt: '2026-10-10 03:45:00',
      expectedSeverity: 'P2',
      reasons: ['low_traffic_false_positive', 'duplicate_noise'],
    },
  },
]

export type WeeklyFormulaRecommendation = {
  id: string
  weekLabel: string
  generatedAt: string
  status: 'pending_ro' | 'approved' | 'rejected'
  summary: string
  clusterLabel: string
  feedbackCount: number
  similarIncidentIds: string[]
  proposedFormula: SeverityFormula
  changes: {
    type: 'weight' | 'threshold' | 'factor_add' | 'factor_remove' | 'factor_enable'
    detail: string
  }[]
  expectedImpact: string
  roDecision?: {
    by: string
    at: string
    comment?: string
  }
}

export const weeklyRecommendations: WeeklyFormulaRecommendation[] = [
  {
    id: 'REC-2026-W42',
    weekLabel: '2026 第 42 周',
    generatedAt: '2026-10-14 06:00:00',
    status: 'pending_ro',
    clusterLabel: '盘面流动性类 · 公式 P1 偏高',
    feedbackCount: 23,
    similarIncidentIds: [
      'INC-20261013-0847',
      'INC-20261010-0318',
      'INC-20261008-0212',
      'INC-20261007-0440',
    ],
    summary:
      '聚合 23 条「公式 P1 vs 值班 P2」反馈：68% 勾选低流量误触，52% 勾选自动恢复。建议下调流动性因子权重、新增交易时段因子，并将 P1 阈值从 78 提至 82。',
    proposedFormula: {
      version: 'v2.4.0-draft',
      effectiveFrom: '（待 RO 批准）',
      expression: 'severity_score = clamp(Σ weight_i × normalize(factor_i) × session_modifier, 0, 100)',
      thresholds: [
        { level: 'P0', minScore: 92 },
        { level: 'P1', minScore: 82 },
        { level: 'P2', minScore: 55 },
        { level: 'P3', minScore: 0 },
      ],
      factors: [
        {
          id: 'notional_exposure',
          name: '名义敞口',
          description: '告警涉及合约/账户名义价值（USD）',
          weight: 0.26,
          enabled: true,
        },
        {
          id: 'user_reach',
          name: '影响用户数',
          description: '可能受影响的用户或账户数量',
          weight: 0.18,
          enabled: true,
        },
        {
          id: 'market_liquidity',
          name: '流动性风险',
          description: '深度、价差、无成交时长等综合',
          weight: 0.16,
          enabled: true,
        },
        {
          id: 'price_deviation',
          name: '价格偏离',
          description: '相对指数/标记/竞品偏离幅度',
          weight: 0.17,
          enabled: true,
        },
        {
          id: 'duration_persistence',
          name: '持续时长',
          description: '异常状态持续分钟数',
          weight: 0.1,
          enabled: true,
        },
        {
          id: 'trading_session',
          name: '交易时段',
          description: '亚洲/欧美盘流动性基线不同，夜间降权',
          weight: 0.08,
          enabled: true,
        },
        {
          id: 'index_source_degraded',
          name: '指数源降级',
          description: '是否已处于指数源剔除/降级状态',
          weight: 0.05,
          enabled: true,
        },
      ],
    },
    changes: [
      { type: 'weight', detail: 'market_liquidity：0.22 → 0.16（−27%）' },
      { type: 'weight', detail: 'notional_exposure：0.28 → 0.26' },
      { type: 'factor_add', detail: '新增 trading_session（权重 0.08，夜间 Asia 盘 normalize ×0.65）' },
      { type: 'factor_remove', detail: '移除 slo_breach（与 price_deviation 高度共线，反馈中极少单独勾选）' },
      { type: 'threshold', detail: 'P1 minScore：78 → 82' },
    ],
    expectedImpact:
      '回测本周 41 条盘面类告警：P1 误报率预计从 34% 降至 18%；真正 P0/P1 召回率保持 ≥97%。',
  },
  {
    id: 'REC-2026-W41',
    weekLabel: '2026 第 41 周',
    generatedAt: '2026-10-07 06:00:00',
    status: 'approved',
    summary: '标记价格类：引入「指数源数量」因子，P1 阈值 80→78 已与 prod 对齐。',
    clusterLabel: '标记价格偏离 · 缺因子',
    feedbackCount: 11,
    similarIncidentIds: ['INC-20261005-1120'],
    proposedFormula: currentSeverityFormula,
    changes: [{ type: 'factor_add', detail: '新增 index_source_count（已在 v2.3.1 全量）' }],
    expectedImpact: '已上线，W41 反馈闭环率 91%。',
    roDecision: {
      by: 'RO · Natalie Chen',
      at: '2026-10-08 11:30:00',
      comment: '批准全量；下周观察 BTC 主合约权重反馈。',
    },
  },
]

export function severityTagColor(level: SeverityLevel): string {
  switch (level) {
    case 'P0':
      return 'red'
    case 'P1':
      return 'volcano'
    case 'P2':
      return 'gold'
    default:
      return 'default'
  }
}

export function factorNameById(id: string, formula: SeverityFormula = currentSeverityFormula): string {
  return formula.factors.find((f) => f.id === id)?.name ?? id
}
