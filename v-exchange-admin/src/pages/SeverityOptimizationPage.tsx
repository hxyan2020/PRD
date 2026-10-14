import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Divider,
  Form,
  Input,
  Progress,
  Radio,
  Row,
  Space,
  Statistic,
  Steps,
  Table,
  Tag,
  Timeline,
  Typography,
  message,
} from 'antd'
import { PageFrame } from '../components/PageFrame'
import './SeverityOptimizationPage.css'

const { Paragraph, Text, Title } = Typography

type Severity = 'P1' | 'P2' | 'P3'
type FeedbackReason =
  | 'protective-controls-active'
  | 'metric-amplitude-overstated'
  | 'blast-radius-overestimated'
  | 'human-mitigation-ready'
  | 'maintenance-window'

type FactorKey =
  | 'breachAmplitude'
  | 'userImpactScope'
  | 'recoveryUncertainty'
  | 'runbookCoverageGap'
  | 'persistenceMinutes'
  | 'fallbackCoverageGap'
  | 'hedgeCapacityGap'

type FormulaFactor = {
  key: FactorKey
  label: string
  weight: number
  description: string
}

type SeverityFormula = {
  version: string
  thresholdP1: number
  thresholdP2: number
  factors: FormulaFactor[]
  owner: string
  effectiveAt: string
  summary: string
}

type AlertScenario = {
  id: string
  metricName: string
  signalGroup: string
  description: string
  clusterId: string
  triggerTime: string
  values: Record<FactorKey, number>
}

type FeedbackRecord = {
  opsSeverity: Severity
  reasons: FeedbackReason[]
  note: string
  syncToAi: boolean
  submittedAt: string
}

type FeedbackCluster = {
  id: string
  signalGroup: string
  sampleCount: number
  affectedRules: string[]
  dominantReasons: { reason: FeedbackReason; count: number }[]
  aiSummary: string
  projectedPrecisionGain: number
}

type RecommendationStatus = 'pending' | 'approved' | 'sent-back'

type ActivityItem = {
  id: string
  title: string
  detail: string
  color?: string
}

type FeedbackFormValues = {
  opsSeverity: Severity
  reasons: FeedbackReason[]
  note?: string
  syncToAi?: boolean
}

const severityColorMap: Record<Severity, string> = {
  P1: 'red',
  P2: 'orange',
  P3: 'blue',
}

const feedbackReasonLabels: Record<FeedbackReason, string> = {
  'protective-controls-active': '保护性控制已生效，但公式尚未纳入',
  'metric-amplitude-overstated': '指标偏离幅度被放大，和真实风险不一致',
  'blast-radius-overestimated': '影响范围被高估，未达到 P1 级别',
  'human-mitigation-ready': '24/7 ops 有明确人工缓解手段',
  'maintenance-window': '处于维护/切换窗口，风险可控',
}

const feedbackReasonOptions = Object.entries(feedbackReasonLabels).map(([value, label]) => ({
  value,
  label,
}))

const baselineFormula: SeverityFormula = {
  version: 'v3.4',
  thresholdP1: 78,
  thresholdP2: 55,
  owner: 'AI Incident',
  effectiveAt: '2026-10-07 09:30 UTC',
  summary: '当前生产公式更看重指标突破幅度与影响面，对人工兜底能力建模不足。',
  factors: [
    {
      key: 'breachAmplitude',
      label: '指标突破幅度',
      weight: 0.32,
      description: '告警指标偏离阈值的幅度。',
    },
    {
      key: 'userImpactScope',
      label: '用户影响面',
      weight: 0.28,
      description: '受影响用户与交易对范围。',
    },
    {
      key: 'recoveryUncertainty',
      label: '自动恢复不确定性',
      weight: 0.14,
      description: '自动恢复机制能否及时收敛。',
    },
    {
      key: 'runbookCoverageGap',
      label: 'Runbook 覆盖缺口',
      weight: 0.1,
      description: '值班手册与自动化兜底是否完备。',
    },
    {
      key: 'persistenceMinutes',
      label: '持续时长风险',
      weight: 0.16,
      description: '异常持续时长转化出的风险评分。',
    },
  ],
}

const recommendedFormula: SeverityFormula = {
  version: 'v3.5',
  thresholdP1: 78,
  thresholdP2: 55,
  owner: 'AI Incident Weekly Recommender',
  effectiveAt: '待 RO 审批',
  summary: '新增保护性控制与对冲兜底因子，下调单纯幅度因子的权重，减少重复性误判。',
  factors: [
    {
      key: 'breachAmplitude',
      label: '指标突破幅度',
      weight: 0.24,
      description: '降低该因子的独立决定权，避免“振幅高但可控”的误判。',
    },
    {
      key: 'userImpactScope',
      label: '用户影响面',
      weight: 0.24,
      description: '保留影响面因子，但与兜底能力联合判断。',
    },
    {
      key: 'persistenceMinutes',
      label: '持续时长风险',
      weight: 0.16,
      description: '保留时长，但不再把短时尖峰直接拉升到 P1。',
    },
    {
      key: 'fallbackCoverageGap',
      label: '保护性控制缺口',
      weight: 0.2,
      description: '新增因子，衡量降级策略、熔断和人工兜底是否可用。',
    },
    {
      key: 'hedgeCapacityGap',
      label: '人工/对冲兜底缺口',
      weight: 0.16,
      description: '新增因子，衡量 24/7 ops 是否具备可执行的人工缓解能力。',
    },
  ],
}

const alertScenarios: AlertScenario[] = [
  {
    id: 'ALT-24091',
    metricName: 'Spread deviation > 35bp',
    signalGroup: 'spread_spike_xau_usd',
    description:
      'XAU_USD 永续价差告警连续 9 分钟高于阈值，公式根据突破幅度和影响面判定为 P1。',
    clusterId: 'cluster-spread-spike',
    triggerTime: '2026-10-14 02:18 UTC',
    values: {
      breachAmplitude: 92,
      userImpactScope: 78,
      recoveryUncertainty: 70,
      runbookCoverageGap: 64,
      persistenceMinutes: 73,
      fallbackCoverageGap: 25,
      hedgeCapacityGap: 22,
    },
  },
  {
    id: 'ALT-24094',
    metricName: 'Matching backlog > 4x baseline',
    signalGroup: 'matching_backlog_btc',
    description: '撮合积压持续扩张且没有可用兜底，应该继续维持 P1。',
    clusterId: 'cluster-matching-backlog',
    triggerTime: '2026-10-14 01:41 UTC',
    values: {
      breachAmplitude: 88,
      userImpactScope: 91,
      recoveryUncertainty: 82,
      runbookCoverageGap: 84,
      persistenceMinutes: 79,
      fallbackCoverageGap: 77,
      hedgeCapacityGap: 73,
    },
  },
  {
    id: 'ALT-24098',
    metricName: 'Funding rate drift > 8bp',
    signalGroup: 'funding_drift_eth',
    description: '告警存在但风险有限，P3 已足够。',
    clusterId: 'cluster-funding-drift',
    triggerTime: '2026-10-13 23:52 UTC',
    values: {
      breachAmplitude: 48,
      userImpactScope: 42,
      recoveryUncertainty: 33,
      runbookCoverageGap: 37,
      persistenceMinutes: 31,
      fallbackCoverageGap: 24,
      hedgeCapacityGap: 28,
    },
  },
]

const initialClusters: FeedbackCluster[] = [
  {
    id: 'cluster-spread-spike',
    signalGroup: 'spread_spike_xau_usd',
    sampleCount: 19,
    affectedRules: ['spread deviation > 35bp', 'stale market-maker quote coverage'],
    dominantReasons: [
      { reason: 'protective-controls-active', count: 11 },
      { reason: 'human-mitigation-ready', count: 10 },
      { reason: 'metric-amplitude-overstated', count: 7 },
    ],
    aiSummary:
      '过去一周内，类似价差告警多次被 24/7 ops 降级为 P2，主要原因是保护性控制和人工兜底能力未被建模。',
    projectedPrecisionGain: 12,
  },
  {
    id: 'cluster-matching-backlog',
    signalGroup: 'matching_backlog_btc',
    sampleCount: 6,
    affectedRules: ['matching backlog > 4x baseline'],
    dominantReasons: [{ reason: 'blast-radius-overestimated', count: 2 }],
    aiSummary: '该簇样本量不足，不建议调整公式。',
    projectedPrecisionGain: 2,
  },
]

const initialActivity: ActivityItem[] = [
  {
    id: 'evt-1',
    title: '当前公式 v3.4 生效',
    detail: 'RO 在上周批准了以幅度和影响面为主的 severity 计算公式。',
    color: 'green',
  },
  {
    id: 'evt-2',
    title: 'AI Incident 聚合到误判簇',
    detail: '19 条类似 spread spike 告警反馈被识别为“公式高估严重度”的簇。',
    color: 'blue',
  },
  {
    id: 'evt-3',
    title: '待审批推荐草案 v3.5',
    detail: '推荐新增保护性控制与人工兜底因子，并下调突破幅度权重。',
    color: 'orange',
  },
]

function scoreFormula(formula: SeverityFormula, values: Record<FactorKey, number>) {
  return Math.round(
    formula.factors.reduce((total, factor) => total + values[factor.key] * factor.weight, 0),
  )
}

function scoreToSeverity(score: number, formula: SeverityFormula): Severity {
  if (score >= formula.thresholdP1) return 'P1'
  if (score >= formula.thresholdP2) return 'P2'
  return 'P3'
}

function formatWeight(weight: number) {
  return `${Math.round(weight * 100)}%`
}

function statusLabel(formulaSeverity: Severity, opsSeverity?: Severity) {
  if (!opsSeverity) return { label: '待值班确认', color: 'default' as const }
  if (formulaSeverity === opsSeverity) return { label: '公式已对齐', color: 'success' as const }
  return { label: '反馈待公式吸收', color: 'processing' as const }
}

function sortedReasons(
  reasons: { reason: FeedbackReason; count: number }[],
): { reason: FeedbackReason; count: number }[] {
  return [...reasons].sort((a, b) => b.count - a.count)
}

export function SeverityOptimizationPage() {
  const [messageApi, contextHolder] = message.useMessage()
  const [form] = Form.useForm<FeedbackFormValues>()
  const [selectedAlertId, setSelectedAlertId] = useState(alertScenarios[0].id)
  const [feedbackByAlertId, setFeedbackByAlertId] = useState<Record<string, FeedbackRecord>>({})
  const [clusters, setClusters] = useState(initialClusters)
  const [activeFormula, setActiveFormula] = useState<SeverityFormula>(baselineFormula)
  const [recommendationStatus, setRecommendationStatus] = useState<RecommendationStatus>('pending')
  const [activity, setActivity] = useState<ActivityItem[]>(initialActivity)

  const selectedAlert = useMemo(
    () => alertScenarios.find((alert) => alert.id === selectedAlertId) ?? alertScenarios[0],
    [selectedAlertId],
  )

  const currentScore = scoreFormula(baselineFormula, selectedAlert.values)
  const proposedScore = scoreFormula(recommendedFormula, selectedAlert.values)
  const currentSeverity = scoreToSeverity(currentScore, baselineFormula)
  const proposedSeverity = scoreToSeverity(proposedScore, recommendedFormula)

  const alertRows = useMemo(
    () =>
      alertScenarios.map((alert) => {
        const formulaScore = scoreFormula(activeFormula, alert.values)
        const formulaSeverity = scoreToSeverity(formulaScore, activeFormula)
        const feedback = feedbackByAlertId[alert.id]
        return {
          ...alert,
          formulaScore,
          formulaSeverity,
          opsSeverity: feedback?.opsSeverity,
          syncToAi: feedback?.syncToAi,
          feedbackStatus: statusLabel(formulaSeverity, feedback?.opsSeverity),
        }
      }),
    [activeFormula, feedbackByAlertId],
  )

  const selectedAlertRow = useMemo(
    () => alertRows.find((alert) => alert.id === selectedAlert.id) ?? alertRows[0],
    [alertRows, selectedAlert.id],
  )

  const selectedCluster = useMemo(
    () => clusters.find((cluster) => cluster.id === selectedAlert.clusterId) ?? clusters[0],
    [clusters, selectedAlert.clusterId],
  )

  useEffect(() => {
    const feedback = feedbackByAlertId[selectedAlertId]
    form.setFieldsValue({
      opsSeverity: feedback?.opsSeverity ?? 'P2',
      reasons: feedback?.reasons ?? ['protective-controls-active', 'human-mitigation-ready'],
      note:
        feedback?.note ??
        '值班确认可通过人工切换 + 保护性控制兜底，建议从 P1 调整为 P2，并同步纳入类似样本。',
      syncToAi: feedback?.syncToAi ?? true,
    })
  }, [feedbackByAlertId, form, selectedAlertId])

  const lifecycleStep = recommendationStatus === 'approved' ? 3 : feedbackByAlertId[selectedAlertId] ? 2 : 1
  const feedbackCount = Object.keys(feedbackByAlertId).length
  const weeklyOverrideRate = 21 + feedbackCount
  const agreementRate = recommendationStatus === 'approved' ? 91 : feedbackCount ? 84 : 79

  const factorRows = useMemo(
    () =>
      baselineFormula.factors.map((factor) => {
        const value = selectedAlert.values[factor.key]
        return {
          key: factor.key,
          factor: factor.label,
          score: value,
          baselineWeight: formatWeight(factor.weight),
          baselineContribution: Math.round(value * factor.weight),
          recommendedWeight:
            recommendedFormula.factors.find((item) => item.key === factor.key)?.weight ?? null,
        }
      }),
    [selectedAlert.values],
  )

  const recommendationRows = useMemo(() => {
    const keys = Array.from(
      new Set([
        ...baselineFormula.factors.map((factor) => factor.key),
        ...recommendedFormula.factors.map((factor) => factor.key),
      ]),
    )

    return keys.map((key) => {
      const current = baselineFormula.factors.find((factor) => factor.key === key)
      const next = recommendedFormula.factors.find((factor) => factor.key === key)
      return {
        key,
        factor: next?.label ?? current?.label ?? key,
        currentWeight: current ? formatWeight(current.weight) : '移除',
        nextWeight: next ? formatWeight(next.weight) : '移除',
        change:
          current && next
            ? current.weight === next.weight
              ? '保持'
              : '调整权重'
            : current
              ? '删除因子'
              : '新增因子',
        reason: next?.description ?? current?.description ?? '-',
      }
    })
  }, [])

  const submitFeedback = async () => {
    const values = await form.validateFields()
    const nextRecord: FeedbackRecord = {
      opsSeverity: values.opsSeverity,
      reasons: values.reasons,
      note: values.note?.trim() ?? '',
      syncToAi: Boolean(values.syncToAi),
      submittedAt: '2026-10-14 03:46 UTC',
    }

    setFeedbackByAlertId((previous) => ({
      ...previous,
      [selectedAlertId]: nextRecord,
    }))

    if (nextRecord.syncToAi) {
      setClusters((previous) =>
        previous.map((cluster) => {
          if (cluster.id !== selectedAlert.clusterId) return cluster

          const reasonMap = new Map(
            cluster.dominantReasons.map((item) => [item.reason, item.count] as const),
          )

          nextRecord.reasons.forEach((reason) => {
            reasonMap.set(reason, (reasonMap.get(reason) ?? 0) + 1)
          })

          return {
            ...cluster,
            sampleCount: cluster.sampleCount + 1,
            dominantReasons: sortedReasons(
              Array.from(reasonMap.entries()).map(([reason, count]) => ({ reason, count })),
            ).slice(0, 4),
            aiSummary:
              '最新值班反馈已纳入同类 spread spike 告警簇，AI 推荐会在周度窗口重新计算权重与因子组合。',
          }
        }),
      )
    }

    messageApi.success('值班反馈已提交，并同步到 AI Incident 聚合池。')
  }

  const approveRecommendation = () => {
    setRecommendationStatus('approved')
    setActiveFormula({
      ...recommendedFormula,
      effectiveAt: '2026-10-14 03:52 UTC',
    })
    setActivity((previous) => [
      {
        id: 'evt-4',
        title: 'RO 批准公式 v3.5',
        detail: '推荐已通过审批并生效，同类价差告警将优先识别保护性控制与人工兜底能力。',
        color: 'green',
      },
      ...previous,
    ])
    messageApi.success('RO 已批准 severity 推荐，新公式已生效。')
  }

  const sendBackRecommendation = () => {
    setRecommendationStatus('sent-back')
    setActivity((previous) => [
      {
        id: 'evt-rollback',
        title: 'RO 退回推荐草案',
        detail: '已要求 AI Incident 补充更多样本与回测结果。',
        color: 'red',
      },
      ...previous,
    ])
    messageApi.info('推荐草案已退回，等待补充样本与回测。')
  }

  return (
    <PageFrame title="Severity Optimization / 严重度优化闭环">
      {contextHolder}
      <div className="severity-optimization-page">
        <Alert
          type="info"
          showIcon
          message="完整链路：指标告警 -> 公式判级 -> 24/7 ops 人工纠偏 -> AI Incident 聚合反馈 -> 周度推荐新公式 -> RO 审批生效"
          description="本页以一个实际的 spread 指标告警为例：旧公式判定 P1，但值班人员依据保护性控制和人工兜底能力降为 P2；AI 聚合类似反馈后，生成新的 severity 计算公式供 RO 审批。"
        />

        <Card className="severity-card" bordered={false}>
          <Steps
            current={lifecycleStep}
            items={[
              {
                title: '公式判级',
                description: `${baselineFormula.version} 对当前样本给出 ${currentSeverity}`,
              },
              {
                title: '值班反馈',
                description: '24/7 ops 改判并勾选不准确原因',
              },
              {
                title: 'AI 周推荐',
                description: `${selectedCluster.sampleCount} 条同类反馈已聚合`,
              },
              {
                title: 'RO 审批生效',
                description: recommendationStatus === 'approved' ? 'v3.5 已生效' : '等待审批',
              },
            ]}
          />
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12} xl={6}>
            <Card className="severity-card">
              <Statistic title="当前生产公式" value={activeFormula.version} />
              <Text type="secondary">RO owner: {activeFormula.owner}</Text>
            </Card>
          </Col>
          <Col xs={24} md={12} xl={6}>
            <Card className="severity-card">
              <Statistic title="本周改判率" value={weeklyOverrideRate} suffix="%" />
              <Text type="secondary">包含值班人工降级与升级。</Text>
            </Card>
          </Col>
          <Col xs={24} md={12} xl={6}>
            <Card className="severity-card">
              <Statistic title="公式判级一致率" value={agreementRate} suffix="%" />
              <Text type="secondary">审批后预计减少重复误判。</Text>
            </Card>
          </Col>
          <Col xs={24} md={12} xl={6}>
            <Card className="severity-card">
              <Statistic
                title="待 RO 审批推荐"
                value={recommendationStatus === 'approved' ? 0 : 1}
              />
              <Text type="secondary">
                {recommendationStatus === 'approved' ? '当前周推荐已完成审批。' : 'AI 已生成新的严重度公式草案。'}
              </Text>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={12}>
            <Card className="severity-card" title="当前生产公式">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="版本">{baselineFormula.version}</Descriptions.Item>
                <Descriptions.Item label="阈值">
                  P1 &gt;= {baselineFormula.thresholdP1} / P2 &gt;= {baselineFormula.thresholdP2}
                </Descriptions.Item>
                <Descriptions.Item label="说明">{baselineFormula.summary}</Descriptions.Item>
              </Descriptions>
              <Divider />
              <Space wrap>
                {baselineFormula.factors.map((factor) => (
                  <Tag key={factor.key} color="blue">
                    {factor.label} {formatWeight(factor.weight)}
                  </Tag>
                ))}
              </Space>
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card
              className="severity-card"
              title="AI 推荐公式草案"
              extra={
                <Tag color={recommendationStatus === 'approved' ? 'success' : recommendationStatus === 'sent-back' ? 'error' : 'processing'}>
                  {recommendationStatus === 'approved'
                    ? 'Approved'
                    : recommendationStatus === 'sent-back'
                      ? 'Sent Back'
                      : 'Pending RO'}
                </Tag>
              }
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="版本">{recommendedFormula.version}</Descriptions.Item>
                <Descriptions.Item label="预计收益">
                  同类误判减少 {selectedCluster.projectedPrecisionGain}pp，P1 噪音下降 18%
                </Descriptions.Item>
                <Descriptions.Item label="推荐摘要">{recommendedFormula.summary}</Descriptions.Item>
              </Descriptions>
              <Divider />
              <Space wrap>
                {recommendedFormula.factors.map((factor) => (
                  <Tag key={factor.key} color="purple">
                    {factor.label} {formatWeight(factor.weight)}
                  </Tag>
                ))}
              </Space>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={14}>
            <Card className="severity-card" title="1. 指标告警与公式判级">
              <Table
                size="small"
                rowKey="id"
                pagination={false}
                className="severity-table"
                rowClassName={(record) =>
                  record.id === selectedAlertId ? 'severity-table-row-selected' : 'severity-table-row'
                }
                onRow={(record) => ({
                  onClick: () => setSelectedAlertId(record.id),
                })}
                columns={[
                  { title: 'Alert ID', dataIndex: 'id', width: 120 },
                  { title: 'Metric', dataIndex: 'metricName' },
                  {
                    title: '公式分数',
                    dataIndex: 'formulaScore',
                    width: 110,
                  },
                  {
                    title: '公式严重度',
                    dataIndex: 'formulaSeverity',
                    width: 120,
                    render: (value: Severity) => <Tag color={severityColorMap[value]}>{value}</Tag>,
                  },
                  {
                    title: '值班严重度',
                    dataIndex: 'opsSeverity',
                    width: 120,
                    render: (value?: Severity) =>
                      value ? <Tag color={severityColorMap[value]}>{value}</Tag> : <Text type="secondary">待确认</Text>,
                  },
                  {
                    title: '状态',
                    dataIndex: 'feedbackStatus',
                    width: 140,
                    render: (value: { label: string; color: 'default' | 'success' | 'processing' }) => (
                      <Tag color={value.color}>{value.label}</Tag>
                    ),
                  },
                  { title: 'Trigger Time', dataIndex: 'triggerTime', width: 180 },
                ]}
                dataSource={alertRows}
              />
            </Card>
          </Col>
          <Col xs={24} xl={10}>
            <Card className="severity-card" title="2. 24/7 ops 值班反馈">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="当前告警">{selectedAlert.metricName}</Descriptions.Item>
                <Descriptions.Item label="场景说明">{selectedAlert.description}</Descriptions.Item>
                <Descriptions.Item label="旧公式结果">
                  <Space size={8}>
                    <Tag color={severityColorMap[currentSeverity]}>{currentSeverity}</Tag>
                    <Text type="secondary">score {currentScore}</Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="新公式预览">
                  <Space size={8}>
                    <Tag color={severityColorMap[proposedSeverity]}>{proposedSeverity}</Tag>
                    <Text type="secondary">score {proposedScore}</Text>
                  </Space>
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">因子拆解</Divider>
              <Table
                size="small"
                pagination={false}
                rowKey="key"
                columns={[
                  { title: '因子', dataIndex: 'factor' },
                  { title: '因子分数', dataIndex: 'score', width: 100 },
                  { title: `${baselineFormula.version} 权重`, dataIndex: 'baselineWeight', width: 120 },
                  { title: '贡献分', dataIndex: 'baselineContribution', width: 100 },
                  {
                    title: `${recommendedFormula.version} 权重`,
                    dataIndex: 'recommendedWeight',
                    width: 120,
                    render: (value: number | null) => (value ? formatWeight(value) : <Text type="secondary">移除</Text>),
                  },
                ]}
                dataSource={factorRows}
              />

              <Divider orientation="left">AI Incident 反馈</Divider>
              <Form form={form} layout="vertical">
                <Form.Item
                  label="值班确认严重度"
                  name="opsSeverity"
                  rules={[{ required: true, message: '请选择值班确认的严重度' }]}
                >
                  <Radio.Group
                    options={[
                      { label: 'P1', value: 'P1' },
                      { label: 'P2', value: 'P2' },
                      { label: 'P3', value: 'P3' },
                    ]}
                    optionType="button"
                    buttonStyle="solid"
                  />
                </Form.Item>
                <Form.Item
                  label="不准确原因"
                  name="reasons"
                  rules={[{ required: true, type: 'array', min: 1, message: '至少选择一个原因' }]}
                >
                  <Checkbox.Group options={feedbackReasonOptions} />
                </Form.Item>
                <Form.Item label="值班备注" name="note">
                  <Input.TextArea rows={4} />
                </Form.Item>
                <Form.Item name="syncToAi" valuePropName="checked">
                  <Checkbox>同步到 AI Incident 聚合池，作为周度 severity 公式优化样本</Checkbox>
                </Form.Item>
                <Space wrap>
                  <Button type="primary" onClick={submitFeedback}>
                    提交反馈
                  </Button>
                  {selectedAlertRow.opsSeverity && (
                    <Tag color="processing">
                      已在 {feedbackByAlertId[selectedAlertId]?.submittedAt} 提交为 {selectedAlertRow.opsSeverity}
                    </Tag>
                  )}
                </Space>
              </Form>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={14}>
            <Card className="severity-card" title="3. AI 聚合类似告警反馈">
              <Paragraph type="secondary">
                AI Incident 会把同类 metric alert 的值班反馈按 signal group、影响面和兜底能力进行聚类，周度生成 severity 公式优化建议。
              </Paragraph>
              <Table
                size="small"
                rowKey="id"
                pagination={false}
                columns={[
                  { title: 'Signal Group', dataIndex: 'signalGroup' },
                  { title: '样本数', dataIndex: 'sampleCount', width: 90 },
                  {
                    title: '主要反馈原因',
                    dataIndex: 'dominantReasons',
                    render: (value: { reason: FeedbackReason; count: number }[]) => (
                      <Space wrap>
                        {value.map((item) => (
                          <Tag key={item.reason}>
                            {feedbackReasonLabels[item.reason]} x{item.count}
                          </Tag>
                        ))}
                      </Space>
                    ),
                  },
                ]}
                dataSource={clusters}
              />
              <Divider />
              <Title level={5} style={{ marginTop: 0 }}>
                当前选中簇：{selectedCluster.signalGroup}
              </Title>
              <Paragraph>{selectedCluster.aiSummary}</Paragraph>
              <Space wrap>
                {selectedCluster.affectedRules.map((rule) => (
                  <Tag key={rule} color="geekblue">
                    {rule}
                  </Tag>
                ))}
              </Space>
              <div className="severity-progress-block">
                <div>
                  <Text strong>预计准确率提升</Text>
                  <Progress percent={selectedCluster.projectedPrecisionGain} showInfo={false} strokeColor="#722ed1" />
                </div>
                <Text type="secondary">AI 建议将误判最多的簇优先作为 severity 公式优化样本。</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} xl={10}>
            <Card className="severity-card" title="4. 周度 severity 推荐与 RO 审批">
              <Alert
                showIcon
                type={recommendationStatus === 'approved' ? 'success' : recommendationStatus === 'sent-back' ? 'warning' : 'info'}
                message={
                  recommendationStatus === 'approved'
                    ? 'v3.5 已通过 RO 审批并生效'
                    : recommendationStatus === 'sent-back'
                      ? '推荐已退回补充回测'
                      : 'v3.5 正等待 RO 审批'
                }
                description="推荐包含：新增因子、减少因子数量、调整各因子权重，并展示对当前样本和同类告警簇的预估影响。"
              />
              <Divider />
              <Table
                size="small"
                rowKey="key"
                pagination={false}
                columns={[
                  { title: '因子', dataIndex: 'factor' },
                  { title: '当前', dataIndex: 'currentWeight', width: 90 },
                  { title: '推荐', dataIndex: 'nextWeight', width: 90 },
                  { title: '动作', dataIndex: 'change', width: 100 },
                ]}
                dataSource={recommendationRows}
              />
              <Divider />
              <Descriptions column={1} size="small">
                <Descriptions.Item label="当前样本预估结果">
                  {baselineFormula.version}: <Tag color={severityColorMap[currentSeverity]}>{currentSeverity}</Tag>
                  {recommendedFormula.version}: <Tag color={severityColorMap[proposedSeverity]}>{proposedSeverity}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="审批建议">
                  若 RO 批准，本类告警将优先考虑保护性控制与人工兜底能力，避免所有高振幅事件一律被判成 P1。
                </Descriptions.Item>
              </Descriptions>
              <Space wrap style={{ marginTop: 16 }}>
                <Button
                  type="primary"
                  onClick={approveRecommendation}
                  disabled={recommendationStatus === 'approved'}
                >
                  RO 批准并生效
                </Button>
                <Button danger onClick={sendBackRecommendation} disabled={recommendationStatus === 'approved'}>
                  退回补充样本
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={10}>
            <Card className="severity-card" title="审批与生效历史">
              <Timeline
                items={activity.map((item) => ({
                  color: item.color,
                  children: (
                    <div>
                      <Text strong>{item.title}</Text>
                      <div>
                        <Text type="secondary">{item.detail}</Text>
                      </div>
                    </div>
                  ),
                }))}
              />
            </Card>
          </Col>
          <Col xs={24} xl={14}>
            <Card className="severity-card" title="当前样本在新旧公式下的 severity 对比">
              <div className="severity-preview-grid">
                <div className="severity-preview-box">
                  <Text type="secondary">{baselineFormula.version}</Text>
                  <Title level={3}>{currentScore}</Title>
                  <Tag color={severityColorMap[currentSeverity]}>{currentSeverity}</Tag>
                  <Paragraph type="secondary">
                    旧公式主要由突破幅度和影响面驱动，因此直接把该告警抬到 P1。
                  </Paragraph>
                </div>
                <div className="severity-preview-box">
                  <Text type="secondary">{recommendedFormula.version}</Text>
                  <Title level={3}>{proposedScore}</Title>
                  <Tag color={severityColorMap[proposedSeverity]}>{proposedSeverity}</Tag>
                  <Paragraph type="secondary">
                    新公式考虑保护性控制与人工缓解能力后，推荐落在更符合值班认知的 P2。
                  </Paragraph>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </PageFrame>
  )
}
