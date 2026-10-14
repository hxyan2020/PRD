// Mock data for the severity (严重度) optimization closed-loop pipeline.
// Chain: metric ingest -> formula scoring (P-level) -> alert dispatch to 24/7 ops
//   -> on-call feedback (mark wrong + reason) -> AI aggregates similar feedback
//   -> weekly formula recommendation -> RO approval -> new formula deployed.

export type SeverityLevel = 'P1' | 'P2' | 'P3' | 'P4'

export const severityMeta: Record<
  SeverityLevel,
  { label: string; color: string; responseSla: string }
> = {
  P1: { label: 'P1 · 严重', color: '#cf1322', responseSla: '< 3 min' },
  P2: { label: 'P2 · 高', color: '#d46b08', responseSla: '< 10 min' },
  P3: { label: 'P3 · 中', color: '#d4b106', responseSla: '< 15 min' },
  P4: { label: 'P4 · 低', color: '#389e0d', responseSla: '< 60 min' },
}

export type SeverityFactor = {
  id: string
  name: string
  description: string
  weight: number
  enabled: boolean
}

// Current, production severity formula: score = Σ(weight_i × factorScore_i), 0..100.
export const currentFormula = {
  version: 'v4',
  effectiveFrom: '2026-09-29',
  approvedBy: 'Risk Owner · Alex Huang',
  thresholds: [
    { level: 'P1' as SeverityLevel, min: 75 },
    { level: 'P2' as SeverityLevel, min: 50 },
    { level: 'P3' as SeverityLevel, min: 25 },
    { level: 'P4' as SeverityLevel, min: 0 },
  ],
  factors: [
    {
      id: 'business_impact',
      name: '业务影响面 Business Impact',
      description: '受影响的合约/用户规模与潜在资金敞口',
      weight: 0.35,
      enabled: true,
    },
    {
      id: 'deviation_magnitude',
      name: '偏离幅度 Deviation Magnitude',
      description: '指标相对阈值的偏离倍数（如价差比例、MMR）',
      weight: 0.3,
      enabled: true,
    },
    {
      id: 'duration',
      name: '持续时长 Duration',
      description: '告警持续未恢复的时间窗口',
      weight: 0.2,
      enabled: true,
    },
    {
      id: 'trading_session',
      name: '交易时段 Trading Session',
      description: '是否处于高流动性主交易时段',
      weight: 0.15,
      enabled: true,
    },
  ] as SeverityFactor[],
}

export type FormulaVersion = {
  version: string
  effectiveFrom: string
  status: 'active' | 'superseded'
  summary: string
  approvedBy: string
}

export const formulaHistory: FormulaVersion[] = [
  {
    version: 'v4',
    effectiveFrom: '2026-09-29',
    status: 'active',
    summary: '新增「交易时段」因子，下调「持续时长」权重 0.25 → 0.20',
    approvedBy: 'RO · Alex Huang',
  },
  {
    version: 'v3',
    effectiveFrom: '2026-08-11',
    status: 'superseded',
    summary: '上调「业务影响面」权重 0.30 → 0.35',
    approvedBy: 'RO · Alex Huang',
  },
  {
    version: 'v2',
    effectiveFrom: '2026-06-02',
    status: 'superseded',
    summary: '引入「偏离幅度」因子替代固定阈值映射',
    approvedBy: 'RO · Natalie Chen',
  },
  {
    version: 'v1',
    effectiveFrom: '2026-04-15',
    status: 'superseded',
    summary: '初版：仅按单一指标阈值映射 P 级',
    approvedBy: 'RO · Natalie Chen',
  },
]

export type FeedbackReason =
  | 'impact_overestimated'
  | 'impact_underestimated'
  | 'false_positive'
  | 'auto_recovered'
  | 'duplicate'
  | 'off_hours'
  | 'missing_factor'
  | 'weight_unreasonable'

export const feedbackReasonLabels: Record<FeedbackReason, string> = {
  impact_overestimated: '业务影响被高估',
  impact_underestimated: '业务影响被低估',
  false_positive: '误报（指标正常）',
  auto_recovered: '短时抖动已自动恢复',
  duplicate: '重复告警',
  off_hours: '非主交易时段、影响有限',
  missing_factor: '缺少关键因子',
  weight_unreasonable: '某因子权重不合理',
}

export type FactorContribution = {
  factorId: string
  factorName: string
  factorScore: number
  weight: number
  weighted: number
}

export type IncidentFeedback = {
  suggestedSeverity: SeverityLevel
  reasons: FeedbackReason[]
  comment: string
  submittedBy: string
  submittedAt: string
}

export type IncidentAlert = {
  id: string
  alertName: string
  category: string
  contract: string
  triggeredAt: string
  metricSummary: string
  score: number
  computedSeverity: SeverityLevel
  breakdown: FactorContribution[]
  feedback: IncidentFeedback | null
}

function buildBreakdown(scores: Record<string, number>): FactorContribution[] {
  return currentFormula.factors
    .filter((f) => f.enabled)
    .map((f) => ({
      factorId: f.id,
      factorName: f.name,
      factorScore: scores[f.id] ?? 0,
      weight: f.weight,
      weighted: Math.round((scores[f.id] ?? 0) * f.weight * 10) / 10,
    }))
}

export const incidentAlerts: IncidentAlert[] = [
  {
    id: 'INC-26101401',
    alertName: '价差预警 · 盘口插针',
    category: '盘面异常',
    contract: 'BTC_USD永续',
    triggeredAt: '2026-10-14 02:58:11',
    metricSummary: '最新成交价相对指数价偏离 1.8%（阈值 0.8%）',
    score: 78,
    computedSeverity: 'P1',
    breakdown: buildBreakdown({
      business_impact: 70,
      deviation_magnitude: 95,
      duration: 60,
      trading_session: 90,
    }),
    feedback: {
      suggestedSeverity: 'P2',
      reasons: ['auto_recovered', 'off_hours'],
      comment: '偏离仅持续 12s 即自动恢复，发生在亚洲清晨低流动性时段，实际无撮合成交受影响。',
      submittedBy: 'OnCall · Kelvin Ng',
      submittedAt: '2026-10-14 03:04:22',
    },
  },
  {
    id: 'INC-26101402',
    alertName: 'DB 资金一级预警',
    category: 'DB 资金 / 账户',
    contract: '—',
    triggeredAt: '2026-10-14 01:20:45',
    metricSummary: '可用金额触及一级预警水位线（剩余 18%）',
    score: 62,
    computedSeverity: 'P2',
    breakdown: buildBreakdown({
      business_impact: 80,
      deviation_magnitude: 50,
      duration: 55,
      trading_session: 40,
    }),
    feedback: {
      suggestedSeverity: 'P1',
      reasons: ['impact_underestimated', 'missing_factor'],
      comment: '一级水位线下滑速度很快，应结合「下滑速率」因子升级为 P1，避免错过注资窗口。',
      submittedBy: 'OnCall · Priya S.',
      submittedAt: '2026-10-14 01:28:03',
    },
  },
  {
    id: 'INC-26101403',
    alertName: '指数价格源超时未更新',
    category: '指数价格源预警',
    contract: 'XAU_USD永续',
    triggeredAt: '2026-10-14 00:11:09',
    metricSummary: 'Kraken 源 TTL 内未更新，已切换备用源',
    score: 54,
    computedSeverity: 'P2',
    breakdown: buildBreakdown({
      business_impact: 45,
      deviation_magnitude: 60,
      duration: 70,
      trading_session: 40,
    }),
    feedback: null,
  },
  {
    id: 'INC-26101404',
    alertName: '大额爆仓预警',
    category: '强平',
    contract: 'BTC_USD永续',
    triggeredAt: '2026-10-13 22:47:52',
    metricSummary: 'MMR 0.92，仓位价值 2.3M USD',
    score: 88,
    computedSeverity: 'P1',
    breakdown: buildBreakdown({
      business_impact: 95,
      deviation_magnitude: 90,
      duration: 70,
      trading_session: 85,
    }),
    feedback: null,
  },
  {
    id: 'INC-26101405',
    alertName: '外部资金费率监控',
    category: '资金费异常',
    contract: 'ETH_USD永续',
    triggeredAt: '2026-10-13 20:03:14',
    metricSummary: '平台与竞品资金费率差 0.09%',
    score: 31,
    computedSeverity: 'P3',
    breakdown: buildBreakdown({
      business_impact: 30,
      deviation_magnitude: 45,
      duration: 25,
      trading_session: 20,
    }),
    feedback: {
      suggestedSeverity: 'P4',
      reasons: ['impact_overestimated', 'weight_unreasonable'],
      comment: '费率差在下一结算周期即收敛，对用户基本无感，偏离幅度因子权重偏高。',
      submittedBy: 'OnCall · Kelvin Ng',
      submittedAt: '2026-10-13 20:10:41',
    },
  },
  {
    id: 'INC-26101406',
    alertName: '档位深度监控（盘面流动性）',
    category: '盘面异常',
    contract: 'SOL_USD永续',
    triggeredAt: '2026-10-13 18:35:27',
    metricSummary: '买盘累计深度价值跌破阈值 40%',
    score: 48,
    computedSeverity: 'P3',
    breakdown: buildBreakdown({
      business_impact: 55,
      deviation_magnitude: 50,
      duration: 45,
      trading_session: 35,
    }),
    feedback: null,
  },
]

export type ProposedChange = {
  type: 'add_factor' | 'remove_factor' | 'adjust_weight'
  factor: string
  from: string
  to: string
  rationale: string
}

export type AiRecommendation = {
  id: string
  week: string
  generatedAt: string
  proposedVersion: string
  basedOnFeedbackCount: number
  clusteredIncidents: number
  summary: string
  expectedImpact: string
  misclassificationBefore: number
  misclassificationAfter: number
  changes: ProposedChange[]
  status: 'pending' | 'approved' | 'rejected'
  reviewer: string | null
  reviewedAt: string | null
  reviewComment: string | null
}

export const aiRecommendations: AiRecommendation[] = [
  {
    id: 'REC-2026-W42',
    week: '2026-W42 (Oct 12 – Oct 18)',
    generatedAt: '2026-10-14 03:30:00',
    proposedVersion: 'v5 (草案)',
    basedOnFeedbackCount: 37,
    clusteredIncidents: 112,
    summary:
      'AI 聚合本周 37 条值班反馈，识别出两类高频错分：短时抖动类告警被高估为 P1，以及 DB 资金类告警因缺少「下滑速率」因子被低估。',
    expectedImpact: '预计将 P1 误分类率从 23% 降至 9%，并将 DB 资金类漏报（P2→应 P1）减少约 60%。',
    misclassificationBefore: 23,
    misclassificationAfter: 9,
    changes: [
      {
        type: 'add_factor',
        factor: '下滑速率 Depletion Rate',
        from: '—',
        to: 'weight 0.12',
        rationale: 'DB 资金类反馈显示水位线下滑速度是升级 P1 的关键信号，当前公式未覆盖。',
      },
      {
        type: 'adjust_weight',
        factor: '偏离幅度 Deviation Magnitude',
        from: '0.30',
        to: '0.24',
        rationale: '短时插针类告警偏离幅度大但影响小，权重偏高导致过度升级。',
      },
      {
        type: 'adjust_weight',
        factor: '持续时长 Duration',
        from: '0.20',
        to: '0.26',
        rationale: '自动恢复类反馈表明持续时长对真实严重度更具区分度。',
      },
    ],
    status: 'pending',
    reviewer: null,
    reviewedAt: null,
    reviewComment: null,
  },
  {
    id: 'REC-2026-W41',
    week: '2026-W41 (Oct 5 – Oct 11)',
    generatedAt: '2026-10-07 03:30:00',
    proposedVersion: 'v4',
    basedOnFeedbackCount: 29,
    clusteredIncidents: 98,
    summary: '非主交易时段告警被普遍高估，建议引入「交易时段」因子并下调「持续时长」权重。',
    expectedImpact: '已落地为 v4，P1 误分类率由 31% 降至 23%。',
    misclassificationBefore: 31,
    misclassificationAfter: 23,
    changes: [
      {
        type: 'add_factor',
        factor: '交易时段 Trading Session',
        from: '—',
        to: 'weight 0.15',
        rationale: '非主交易时段告警影响有限，引入时段因子区分。',
      },
      {
        type: 'adjust_weight',
        factor: '持续时长 Duration',
        from: '0.25',
        to: '0.20',
        rationale: '为新增因子腾出权重空间。',
      },
    ],
    status: 'approved',
    reviewer: 'RO · Alex Huang',
    reviewedAt: '2026-10-07 11:02:33',
    reviewComment: '同意，灰度一周后全量。',
  },
  {
    id: 'REC-2026-W40',
    week: '2026-W40 (Sep 28 – Oct 4)',
    generatedAt: '2026-09-30 03:30:00',
    proposedVersion: '—',
    basedOnFeedbackCount: 14,
    clusteredIncidents: 61,
    summary: '建议为「友商价差监控」单独拆分因子，样本量不足，暂缓。',
    expectedImpact: '预期收益不显著，样本置信度低。',
    misclassificationBefore: 28,
    misclassificationAfter: 27,
    changes: [
      {
        type: 'add_factor',
        factor: '友商价差 Competitor Spread',
        from: '—',
        to: 'weight 0.10',
        rationale: '样本量不足（14 条），置信度低。',
      },
    ],
    status: 'rejected',
    reviewer: 'RO · Alex Huang',
    reviewedAt: '2026-09-30 15:41:10',
    reviewComment: '样本量不足，下周继续观察后再议。',
  },
]

// Aggregated stats for the pipeline overview page.
export const pipelineStats = {
  openIncidentsThisWeek: 112,
  feedbackThisWeek: 37,
  feedbackRate: 33,
  p1MisclassificationRate: 23,
  pendingRecommendations: 1,
  deployedFormulaVersion: 'v4',
}

export type FeedbackReasonCluster = {
  reason: FeedbackReason
  count: number
  topCategory: string
}

export const feedbackClusters: FeedbackReasonCluster[] = [
  { reason: 'auto_recovered', count: 11, topCategory: '盘面异常' },
  { reason: 'off_hours', count: 8, topCategory: '盘面异常' },
  { reason: 'impact_underestimated', count: 6, topCategory: 'DB 资金 / 账户' },
  { reason: 'missing_factor', count: 5, topCategory: 'DB 资金 / 账户' },
  { reason: 'weight_unreasonable', count: 4, topCategory: '资金费异常' },
  { reason: 'impact_overestimated', count: 3, topCategory: '资金费异常' },
]
