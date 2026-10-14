// ---------------------------------------------------------------------------
// 严重度（Severity P0–P3）指标优化闭环：共享内存数据层
//
// 链路：告警触发 → 公式打分定级 → AI incident 卡片推送 → 值班反馈（定级不准 + 原因勾选）
//      → AI 每周聚合相似告警反馈 → 生成新公式推荐（增删因子 / 调整权重 / 调整阈值）
//      → RO 审批 → 新版本公式生效
//
// 模块级可变 store：页面切换（路由重挂载）后仍保留本次会话内的交互结果，
// 使“提交反馈 → 审批推荐 → 公式版本升级”在 4 个页面间保持一致。
// ---------------------------------------------------------------------------

export type SeverityLevel = 'P0' | 'P1' | 'P2' | 'P3'

export const severityMeta: Record<
  SeverityLevel,
  { label: string; color: string; desc: string; response: string }
> = {
  P0: { label: 'P0 危急', color: 'red', desc: '公司级危急，资金/清算安全受威胁', response: '≤5 分钟响应，电话 + Lark 全量升级' },
  P1: { label: 'P1 严重', color: 'volcano', desc: '核心交易链路受损，需立即处置', response: '≤15 分钟响应，值班群 @所有值班' },
  P2: { label: 'P2 警告', color: 'gold', desc: '局部异常，有自动化兜底', response: '≤1 小时响应，值班确认即可' },
  P3: { label: 'P3 观察', color: 'blue', desc: '指标波动，仅记录观察', response: '次日复盘，无需即时处置' },
}

// ------------------------------- 公式因子 ----------------------------------

export type Factor = {
  code: string
  name: string
  source: string
  desc: string
  weight: number
  discrimination: number // 近30天区分度（与值班最终定级的相关性，0–1）
}

export type Threshold = { level: SeverityLevel; min: number }

export type FormulaVersion = {
  version: string
  status: '生效中' | '已停用' | '草案'
  effectiveAt: string
  approvedBy: string
  origin: string
  changeSummary: string
  factors: Factor[]
  thresholds: Threshold[]
}

const factorsV23: Factor[] = [
  { code: 'F1', name: '资金费率偏离度', source: 'funding-rate-service', desc: '当期资金费率与近7日均值的偏离倍数', weight: 0.2, discrimination: 0.74 },
  { code: 'F2', name: '强平/爆仓规模占比', source: 'liquidation-engine', desc: '近10分钟强平名义价值占全市场持仓比例', weight: 0.25, discrimination: 0.81 },
  { code: 'F3', name: '标记价-指数价偏离幅度', source: 'fair-price-service', desc: 'mark price 与 index price 偏离的基点数', weight: 0.2, discrimination: 0.46 },
  { code: 'F4', name: '受影响用户数', source: 'position-service', desc: '持仓/挂单受波及的独立用户数（对数归一）', weight: 0.15, discrimination: 0.69 },
  { code: 'F5', name: '异常持续时长', source: 'alert-manager', desc: '指标连续越限的分钟数', weight: 0.1, discrimination: 0.31 },
  { code: 'F6', name: '风险准备金消耗', source: 'insurance-fund', desc: '近1小时风险准备金净流出占余额比例', weight: 0.1, discrimination: 0.77 },
]

const thresholdsV23: Threshold[] = [
  { level: 'P0', min: 85 },
  { level: 'P1', min: 65 },
  { level: 'P2', min: 40 },
  { level: 'P3', min: 0 },
]

export const formulaExpression = 'Score = Σ ( wᵢ × fᵢ ) × 100，fᵢ ∈ [0,1] 为因子归一化得分'

export function scoreToLevel(score: number, thresholds: Threshold[]): SeverityLevel {
  for (const t of thresholds) {
    if (score >= t.min) return t.level
  }
  return 'P3'
}

// ------------------------------ 告警与反馈 ----------------------------------

export type FactorReading = { code: string; raw: string; normalized: number }

export type OpsFeedback = {
  accurate: boolean
  suggestedLevel?: SeverityLevel
  reasons: string[]
  note?: string
  ratedBy: string
  ratedAt: string
}

export type AlertRecord = {
  id: string
  title: string
  contract: string
  triggeredAt: string
  readings: FactorReading[]
  score: number
  formulaLevel: SeverityLevel
  clusterId?: string
  feedback?: OpsFeedback
}

export const feedbackReasonOptions = [
  '因子权重过高，放大了实际影响',
  '缺少关键业务影响因子（如受影响资金规模）',
  '数据源噪声 / 数据质量问题',
  '低峰时段（深夜/周末）影响被高估',
  '告警风暴重复计数导致评分虚高',
  '已有自动化处置兜底，无需人工升级',
  '因子定级阈值设置不合理',
  '其他（备注说明）',
]

function weightedScore(readings: FactorReading[], factors: Factor[]): number {
  let total = 0
  for (const r of readings) {
    const f = factors.find((x) => x.code === r.code)
    if (f) total += f.weight * r.normalized
  }
  return Math.round(total * 1000) / 10
}

function buildAlert(
  id: string,
  title: string,
  contract: string,
  triggeredAt: string,
  readings: FactorReading[],
  clusterId?: string,
  feedback?: OpsFeedback,
): AlertRecord {
  const score = weightedScore(readings, factorsV23)
  return { id, title, contract, triggeredAt, readings, score, formulaLevel: scoreToLevel(score, thresholdsV23), clusterId, feedback }
}

const seedAlerts: AlertRecord[] = [
  buildAlert(
    'ALT-20261013-021',
    '标记价-指数价偏离超限',
    'BTCUSDT',
    '2026-10-13 02:13:40',
    [
      { code: 'F1', raw: '2.1 倍', normalized: 0.55 },
      { code: 'F2', raw: '0.9%', normalized: 0.62 },
      { code: 'F3', raw: '86 bp', normalized: 0.95 },
      { code: 'F4', raw: '1,204 人', normalized: 0.71 },
      { code: 'F5', raw: '14 分钟', normalized: 0.78 },
      { code: 'F6', raw: '0.4%', normalized: 0.58 },
    ],
    'C-02',
  ),
  buildAlert(
    'ALT-20261012-044',
    '资金费率异常跳变',
    'ETHUSDT',
    '2026-10-12 03:47:02',
    [
      { code: 'F1', raw: '4.8 倍', normalized: 0.92 },
      { code: 'F2', raw: '0.3%', normalized: 0.35 },
      { code: 'F3', raw: '41 bp', normalized: 0.66 },
      { code: 'F4', raw: '318 人', normalized: 0.52 },
      { code: 'F5', raw: '22 分钟', normalized: 0.88 },
      { code: 'F6', raw: '0.1%', normalized: 0.2 },
    ],
    'C-02',
    {
      accurate: false,
      suggestedLevel: 'P2',
      reasons: ['低峰时段（深夜/周末）影响被高估', '因子权重过高，放大了实际影响'],
      note: '凌晨低峰期价差因子噪声大，实际无用户资金受损，MM 已自动回补。',
      ratedBy: '值班 Ops-Chen',
      ratedAt: '2026-10-12 04:05:11',
    },
  ),
  buildAlert(
    'ALT-20261011-018',
    '强平引擎延迟升高',
    'BTCUSDT',
    '2026-10-11 14:22:19',
    [
      { code: 'F1', raw: '1.2 倍', normalized: 0.3 },
      { code: 'F2', raw: '2.4%', normalized: 0.93 },
      { code: 'F3', raw: '35 bp', normalized: 0.6 },
      { code: 'F4', raw: '2,870 人', normalized: 0.86 },
      { code: 'F5', raw: '6 分钟', normalized: 0.45 },
      { code: 'F6', raw: '1.8%', normalized: 0.9 },
    ],
    undefined,
    {
      accurate: true,
      reasons: [],
      note: 'P1 准确，强平高峰期资金面确实承压。',
      ratedBy: '值班 Ops-Liu',
      ratedAt: '2026-10-11 14:40:00',
    },
  ),
  buildAlert(
    'ALT-20261011-007',
    '指数价源断流（单一交易所）',
    'SOLUSDT',
    '2026-10-11 02:58:33',
    [
      { code: 'F1', raw: '1.0 倍', normalized: 0.22 },
      { code: 'F2', raw: '0.2%', normalized: 0.28 },
      { code: 'F3', raw: '72 bp', normalized: 0.88 },
      { code: 'F4', raw: '96 人', normalized: 0.31 },
      { code: 'F5', raw: '31 分钟', normalized: 0.95 },
      { code: 'F6', raw: '0.0%', normalized: 0.05 },
    ],
    'C-02',
    {
      accurate: false,
      suggestedLevel: 'P2',
      reasons: ['数据源噪声 / 数据质量问题', '已有自动化处置兜底，无需人工升级'],
      note: '单一价源断流已被加权中位数自动剔除，盘面无感知。',
      ratedBy: '值班 Ops-Wang',
      ratedAt: '2026-10-11 03:20:45',
    },
  ),
  buildAlert(
    'ALT-20261010-052',
    '风险准备金快速消耗',
    'ETHUSDT',
    '2026-10-10 21:05:27',
    [
      { code: 'F1', raw: '1.9 倍', normalized: 0.5 },
      { code: 'F2', raw: '1.6%', normalized: 0.82 },
      { code: 'F3', raw: '28 bp', normalized: 0.5 },
      { code: 'F4', raw: '1,530 人', normalized: 0.75 },
      { code: 'F5', raw: '9 分钟', normalized: 0.6 },
      { code: 'F6', raw: '2.6%', normalized: 0.97 },
    ],
    undefined,
    {
      accurate: true,
      reasons: [],
      ratedBy: '值班 Ops-Chen',
      ratedAt: '2026-10-10 21:30:02',
    },
  ),
  buildAlert(
    'ALT-20261010-036',
    '深度骤降（盘口 5 档）',
    'BTCUSDT',
    '2026-10-10 04:11:08',
    [
      { code: 'F1', raw: '1.1 倍', normalized: 0.25 },
      { code: 'F2', raw: '0.4%', normalized: 0.4 },
      { code: 'F3', raw: '55 bp', normalized: 0.78 },
      { code: 'F4', raw: '210 人', normalized: 0.44 },
      { code: 'F5', raw: '18 分钟', normalized: 0.83 },
      { code: 'F6', raw: '0.1%', normalized: 0.15 },
    ],
    'C-01',
    {
      accurate: false,
      suggestedLevel: 'P3',
      reasons: ['低峰时段（深夜/周末）影响被高估', '告警风暴重复计数导致评分虚高'],
      note: '凌晨 MM 轮换空窗 3 分钟触发连环告警，实际深度 1 分钟内恢复。',
      ratedBy: '值班 Ops-Liu',
      ratedAt: '2026-10-10 04:28:50',
    },
  ),
  buildAlert(
    'ALT-20261009-063',
    '无成交监控触发',
    'XRPUSDT',
    '2026-10-09 03:33:12',
    [
      { code: 'F1', raw: '1.0 倍', normalized: 0.18 },
      { code: 'F2', raw: '0.1%', normalized: 0.12 },
      { code: 'F3', raw: '48 bp', normalized: 0.72 },
      { code: 'F4', raw: '42 人', normalized: 0.2 },
      { code: 'F5', raw: '26 分钟', normalized: 0.92 },
      { code: 'F6', raw: '0.0%', normalized: 0.02 },
    ],
    'C-01',
    {
      accurate: false,
      suggestedLevel: 'P3',
      reasons: ['因子定级阈值设置不合理', '低峰时段（深夜/周末）影响被高估'],
      note: '小币种凌晨本就低频成交，持续时长因子权重放大了评分。',
      ratedBy: '值班 Ops-Wang',
      ratedAt: '2026-10-09 04:02:33',
    },
  ),
  buildAlert(
    'ALT-20261009-012',
    '现货价差告警（跨所套利空间）',
    'BTCUSDT',
    '2026-10-09 11:15:55',
    [
      { code: 'F1', raw: '2.4 倍', normalized: 0.6 },
      { code: 'F2', raw: '0.7%', normalized: 0.55 },
      { code: 'F3', raw: '63 bp', normalized: 0.82 },
      { code: 'F4', raw: '884 人', normalized: 0.66 },
      { code: 'F5', raw: '7 分钟', normalized: 0.5 },
      { code: 'F6', raw: '0.3%', normalized: 0.42 },
    ],
    'C-02',
  ),
  buildAlert(
    'ALT-20261008-029',
    'ADL 自动减仓触发量异常',
    'ETHUSDT',
    '2026-10-08 19:42:07',
    [
      { code: 'F1', raw: '1.6 倍', normalized: 0.42 },
      { code: 'F2', raw: '1.9%', normalized: 0.88 },
      { code: 'F3', raw: '31 bp', normalized: 0.55 },
      { code: 'F4', raw: '1,960 人', normalized: 0.8 },
      { code: 'F5', raw: '11 分钟', normalized: 0.68 },
      { code: 'F6', raw: '1.2%', normalized: 0.82 },
    ],
    undefined,
    {
      accurate: true,
      reasons: [],
      ratedBy: '值班 Ops-Zhao',
      ratedAt: '2026-10-08 20:01:19',
    },
  ),
  buildAlert(
    'ALT-20261008-005',
    'K线数据延迟（行情推送）',
    'SOLUSDT',
    '2026-10-08 02:27:46',
    [
      { code: 'F1', raw: '1.0 倍', normalized: 0.15 },
      { code: 'F2', raw: '0.1%', normalized: 0.1 },
      { code: 'F3', raw: '52 bp', normalized: 0.75 },
      { code: 'F4', raw: '67 人', normalized: 0.26 },
      { code: 'F5', raw: '24 分钟', normalized: 0.9 },
      { code: 'F6', raw: '0.0%', normalized: 0.02 },
    ],
    'C-01',
    {
      accurate: false,
      suggestedLevel: 'P3',
      reasons: ['数据源噪声 / 数据质量问题', '已有自动化处置兜底，无需人工升级'],
      note: '推送延迟由上游行情源抖动引起，撮合与清算完全不受影响。',
      ratedBy: '值班 Ops-Chen',
      ratedAt: '2026-10-08 02:55:08',
    },
  ),
]

// ------------------------------ AI 每周推荐 ---------------------------------

export type FeedbackCluster = {
  id: string
  name: string
  alertCount: number
  feedbackCount: number
  topReasons: string[]
}

export type FormulaChange = {
  kind: '新增因子' | '移除因子' | '调整权重' | '调整阈值'
  target: string
  before: string
  after: string
  rationale: string
}

export type RegradeShift = { from: SeverityLevel; to: SeverityLevel; count: number }

export type WeeklyRecommendation = {
  id: string
  week: string
  generatedAt: string
  baseVersion: string
  proposedVersion: string
  feedbackCount: number
  clusters: FeedbackCluster[]
  changes: FormulaChange[]
  simulation: {
    sampleSize: number
    shifts: RegradeShift[]
    agreementBefore: number
    agreementAfter: number
  }
  status: '待RO审批' | '已批准生效' | '已驳回'
  reviewedBy?: string
  reviewedAt?: string
  reviewNote?: string
}

const seedRecommendations: WeeklyRecommendation[] = [
  {
    id: 'REC-2026-W42',
    week: '2026 第42周（10-06 ~ 10-12）',
    generatedAt: '2026-10-13 06:00:00',
    baseVersion: 'v2.3',
    proposedVersion: 'v2.4',
    feedbackCount: 23,
    clusters: [
      {
        id: 'C-01',
        name: '低峰时段行情类告警被高估',
        alertCount: 9,
        feedbackCount: 8,
        topReasons: ['低峰时段（深夜/周末）影响被高估', '因子定级阈值设置不合理'],
      },
      {
        id: 'C-02',
        name: '价差/价源类告警缺少资金影响度量',
        alertCount: 7,
        feedbackCount: 6,
        topReasons: ['缺少关键业务影响因子（如受影响资金规模）', '数据源噪声 / 数据质量问题'],
      },
      {
        id: 'C-03',
        name: '告警风暴重复计分',
        alertCount: 5,
        feedbackCount: 4,
        topReasons: ['告警风暴重复计数导致评分虚高'],
      },
    ],
    changes: [
      {
        kind: '新增因子',
        target: 'F7 受影响资金规模',
        before: '—',
        after: '权重 0.12（来源 position-service，按受波及名义价值对数归一）',
        rationale: '簇 C-02 中 6 条反馈指出“只看价差幅度、不看真实资金敞口”导致 P1 虚高。',
      },
      {
        kind: '移除因子',
        target: 'F5 异常持续时长',
        before: '权重 0.10',
        after: '移除（区分度 0.31，近 30 天与值班最终定级相关性最低）',
        rationale: '簇 C-01 中低峰时段告警的持续时长天然偏长，系统性推高评分。',
      },
      {
        kind: '调整权重',
        target: 'F3 标记价-指数价偏离幅度',
        before: '权重 0.20',
        after: '权重 0.13',
        rationale: '价差因子在凌晨流动性薄时噪声显著，8 条反馈勾选“权重过高”。',
      },
      {
        kind: '调整权重',
        target: 'F2 强平/爆仓规模占比',
        before: '权重 0.25',
        after: '权重 0.28',
        rationale: '值班反馈中强平类 P1 全部被确认准确，区分度 0.81 为全因子最高。',
      },
      {
        kind: '调整阈值',
        target: 'P1 判定下限',
        before: 'Score ≥ 65',
        after: 'Score ≥ 68',
        rationale: '重算显示 65–68 分段内 83% 的告警被值班改判为 P2。',
      },
    ],
    simulation: {
      sampleSize: 142,
      shifts: [
        { from: 'P1', to: 'P2', count: 18 },
        { from: 'P2', to: 'P3', count: 9 },
        { from: 'P2', to: 'P1', count: 3 },
      ],
      agreementBefore: 71,
      agreementAfter: 89,
    },
    status: '待RO审批',
  },
  {
    id: 'REC-2026-W41',
    week: '2026 第41周（09-29 ~ 10-05）',
    generatedAt: '2026-10-06 06:00:00',
    baseVersion: 'v2.2',
    proposedVersion: 'v2.3',
    feedbackCount: 17,
    clusters: [
      {
        id: 'C-01',
        name: '资金费率类告警漏升级',
        alertCount: 6,
        feedbackCount: 5,
        topReasons: ['因子定级阈值设置不合理'],
      },
      {
        id: 'C-02',
        name: '风险准备金消耗权重不足',
        alertCount: 4,
        feedbackCount: 4,
        topReasons: ['因子权重过高，放大了实际影响'],
      },
    ],
    changes: [
      {
        kind: '调整权重',
        target: 'F6 风险准备金消耗',
        before: '权重 0.06',
        after: '权重 0.10',
        rationale: '两次准备金快速消耗事件被公式低估为 P2，值班升级为 P1。',
      },
      {
        kind: '调整权重',
        target: 'F1 资金费率偏离度',
        before: '权重 0.24',
        after: '权重 0.20',
        rationale: '资金费率在交割前波动属正常现象，降低噪声。',
      },
    ],
    simulation: {
      sampleSize: 128,
      shifts: [
        { from: 'P2', to: 'P1', count: 6 },
        { from: 'P1', to: 'P2', count: 4 },
      ],
      agreementBefore: 64,
      agreementAfter: 78,
    },
    status: '已批准生效',
    reviewedBy: 'RO Haixiang Yan',
    reviewedAt: '2026-10-07 10:12:00',
    reviewNote: '模拟结果一致率提升明显，批准发布 v2.3。',
  },
  {
    id: 'REC-2026-W40',
    week: '2026 第40周（09-22 ~ 09-28）',
    generatedAt: '2026-09-29 06:00:00',
    baseVersion: 'v2.2',
    proposedVersion: 'v2.3-draft-a',
    feedbackCount: 9,
    clusters: [
      {
        id: 'C-01',
        name: 'ADL 类告警样本不足',
        alertCount: 3,
        feedbackCount: 2,
        topReasons: ['其他（备注说明）'],
      },
    ],
    changes: [
      {
        kind: '移除因子',
        target: 'F4 受影响用户数',
        before: '权重 0.15',
        after: '移除',
        rationale: '个别反馈认为用户数与严重度相关性弱。',
      },
    ],
    simulation: {
      sampleSize: 117,
      shifts: [{ from: 'P1', to: 'P2', count: 2 }],
      agreementBefore: 64,
      agreementAfter: 66,
    },
    status: '已驳回',
    reviewedBy: 'RO Haixiang Yan',
    reviewedAt: '2026-09-30 09:40:00',
    reviewNote: '样本量不足（9 条反馈），且受影响用户数是监管报送必需维度，驳回待下周合并复评。',
  },
]

// ------------------------------- 版本历史 -----------------------------------

const seedVersions: FormulaVersion[] = [
  {
    version: 'v2.3',
    status: '生效中',
    effectiveAt: '2026-10-07 10:12:00',
    approvedBy: 'RO Haixiang Yan',
    origin: 'AI 周推荐 REC-2026-W41',
    changeSummary: 'F6 风险准备金消耗权重 0.06→0.10；F1 资金费率偏离度权重 0.24→0.20',
    factors: factorsV23,
    thresholds: thresholdsV23,
  },
  {
    version: 'v2.2',
    status: '已停用',
    effectiveAt: '2026-08-18 15:00:00',
    approvedBy: 'RO Haixiang Yan',
    origin: 'AI 周推荐 REC-2026-W33',
    changeSummary: '新增 F6 风险准备金消耗（权重 0.06）；P0 阈值 88→85',
    factors: [],
    thresholds: thresholdsV23,
  },
  {
    version: 'v2.1',
    status: '已停用',
    effectiveAt: '2026-06-02 11:30:00',
    approvedBy: 'RO Haixiang Yan',
    origin: '人工修订（季度风控复盘）',
    changeSummary: '初版六因子加权模型上线，替代人工经验定级',
    factors: [],
    thresholds: [
      { level: 'P0', min: 88 },
      { level: 'P1', min: 65 },
      { level: 'P2', min: 40 },
      { level: 'P3', min: 0 },
    ],
  },
]

// --------------------------------- Store -----------------------------------

type SeverityStore = {
  alerts: AlertRecord[]
  recommendations: WeeklyRecommendation[]
  versions: FormulaVersion[]
}

const store: SeverityStore = {
  alerts: seedAlerts.map((a) => ({ ...a })),
  recommendations: seedRecommendations.map((r) => ({ ...r })),
  versions: seedVersions.map((v) => ({ ...v })),
}

export function getAlerts(): AlertRecord[] {
  return store.alerts
}

export function getRecommendations(): WeeklyRecommendation[] {
  return store.recommendations
}

export function getVersions(): FormulaVersion[] {
  return store.versions
}

export function getActiveVersion(): FormulaVersion {
  return store.versions.find((v) => v.status === '生效中') ?? store.versions[0]
}

export function submitAlertFeedback(alertId: string, feedback: OpsFeedback): void {
  const alert = store.alerts.find((a) => a.id === alertId)
  if (alert) alert.feedback = { ...feedback }
}

const factorsV24: Factor[] = [
  { code: 'F1', name: '资金费率偏离度', source: 'funding-rate-service', desc: '当期资金费率与近7日均值的偏离倍数', weight: 0.2, discrimination: 0.74 },
  { code: 'F2', name: '强平/爆仓规模占比', source: 'liquidation-engine', desc: '近10分钟强平名义价值占全市场持仓比例', weight: 0.28, discrimination: 0.81 },
  { code: 'F3', name: '标记价-指数价偏离幅度', source: 'fair-price-service', desc: 'mark price 与 index price 偏离的基点数', weight: 0.13, discrimination: 0.46 },
  { code: 'F4', name: '受影响用户数', source: 'position-service', desc: '持仓/挂单受波及的独立用户数（对数归一）', weight: 0.15, discrimination: 0.69 },
  { code: 'F6', name: '风险准备金消耗', source: 'insurance-fund', desc: '近1小时风险准备金净流出占余额比例', weight: 0.12, discrimination: 0.77 },
  { code: 'F7', name: '受影响资金规模', source: 'position-service', desc: '受波及持仓名义价值（USDT，对数归一）', weight: 0.12, discrimination: 0.8 },
]

const thresholdsV24: Threshold[] = [
  { level: 'P0', min: 85 },
  { level: 'P1', min: 68 },
  { level: 'P2', min: 40 },
  { level: 'P3', min: 0 },
]

export function approveRecommendation(recId: string, reviewer: string, note: string): void {
  const rec = store.recommendations.find((r) => r.id === recId)
  if (!rec || rec.status !== '待RO审批') return
  const now = formatNow()
  rec.status = '已批准生效'
  rec.reviewedBy = reviewer
  rec.reviewedAt = now
  rec.reviewNote = note

  for (const v of store.versions) {
    if (v.status === '生效中') v.status = '已停用'
  }
  store.versions.unshift({
    version: rec.proposedVersion,
    status: '生效中',
    effectiveAt: now,
    approvedBy: reviewer,
    origin: `AI 周推荐 ${rec.id}`,
    changeSummary: rec.changes.map((c) => `${c.kind}：${c.target}`).join('；'),
    factors: factorsV24,
    thresholds: thresholdsV24,
  })
}

export function rejectRecommendation(recId: string, reviewer: string, note: string): void {
  const rec = store.recommendations.find((r) => r.id === recId)
  if (!rec || rec.status !== '待RO审批') return
  rec.status = '已驳回'
  rec.reviewedBy = reviewer
  rec.reviewedAt = formatNow()
  rec.reviewNote = note
}

function formatNow(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// ------------------------------ 汇总统计 ------------------------------------

export function getLoopStats() {
  const alerts = store.alerts
  const withFeedback = alerts.filter((a) => a.feedback)
  const inaccurate = withFeedback.filter((a) => a.feedback && !a.feedback.accurate)
  const pending = store.recommendations.filter((r) => r.status === '待RO审批')
  const levelCount: Record<SeverityLevel, number> = { P0: 0, P1: 0, P2: 0, P3: 0 }
  for (const a of alerts) levelCount[a.formulaLevel] += 1
  return {
    alertTotal: alerts.length,
    levelCount,
    feedbackCount: withFeedback.length,
    inaccurateCount: inaccurate.length,
    inaccurateRate: withFeedback.length ? Math.round((inaccurate.length / withFeedback.length) * 100) : 0,
    clusterCount: 3,
    pendingRecommendations: pending.length,
    activeVersion: getActiveVersion().version,
  }
}
