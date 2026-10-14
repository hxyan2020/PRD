import { useMemo, useState } from 'react'
import type { TableProps } from 'antd'
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  Empty,
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
} from 'antd'
import {
  CheckCircleOutlined,
  ExperimentOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import { PageFrame } from '../components/PageFrame'
import './SeverityOptimizationPage.css'

const { Paragraph, Text, Title } = Typography
const { TextArea } = Input

type Severity = 'P1' | 'P2' | 'P3'
type ApprovalStatus = 'draft' | 'submitted' | 'approved'
type FactorAction = '新增' | '减少' | '调整' | '保留'

type SimilarFeedbackRow = {
  id: string
  pattern: string
  samples: number
  opsVotes: string
  topReason: string
  aiConfidence: string
}

type FormulaFactorRow = {
  factor: string
  action: FactorAction
  currentWeight: string
  recommendedWeight: string
  impact: string
  reason: string
}

const severityColors: Record<Severity, string> = {
  P1: 'red',
  P2: 'orange',
  P3: 'blue',
}

const actionColors: Record<FactorAction, string> = {
  新增: 'green',
  减少: 'red',
  调整: 'gold',
  保留: 'blue',
}

const feedbackReasonOptions = [
  { label: '影响面被高估：活跃账户数低于 P1 门槛', value: 'impact-overestimated' },
  { label: '持续时间不足：尖峰在 5 分钟内自动恢复', value: 'duration-short' },
  { label: '已有保护动作：风控限价和熔断已生效', value: 'guardrail-active' },
  { label: '市场时段噪音：低流动性窗口重复误报', value: 'market-noise' },
]

const similarFeedbackRows: SimilarFeedbackRow[] = [
  {
    id: 'cluster-spread-btc',
    pattern: 'BTC/XAU 指数偏离在低流动性窗口短暂越线',
    samples: 18,
    opsVotes: 'P2: 15 / P1: 3',
    topReason: '持续时间不足 + 已有保护动作',
    aiConfidence: '91%',
  },
  {
    id: 'cluster-depth-mm',
    pattern: '做市商深度撤单导致盘口短时变薄',
    samples: 12,
    opsVotes: 'P2: 10 / P3: 2',
    topReason: '影响面被高估',
    aiConfidence: '86%',
  },
  {
    id: 'cluster-index-lag',
    pattern: '单一指数源延迟但备用源权重正常',
    samples: 9,
    opsVotes: 'P2: 8 / P1: 1',
    topReason: '已有保护动作',
    aiConfidence: '88%',
  },
]

const formulaFactorRows: FormulaFactorRow[] = [
  {
    factor: 'affected_active_accounts',
    action: '调整',
    currentWeight: '0.35',
    recommendedWeight: '0.28',
    impact: '降低影响面单因子触发 P1 的概率',
    reason: '过去 4 周 71% 误报来自活跃账户数被短时放大',
  },
  {
    factor: 'duration_minutes',
    action: '调整',
    currentWeight: '0.20',
    recommendedWeight: '0.27',
    impact: '更看重异常持续时间',
    reason: 'Ops 反馈显示 5 分钟内恢复的告警多为 P2',
  },
  {
    factor: 'guardrail_coverage',
    action: '新增',
    currentWeight: '--',
    recommendedWeight: '-0.16',
    impact: '已有熔断/限价保护时下调严重度',
    reason: '保护动作可显著降低用户损失面',
  },
  {
    factor: 'market_session_noise',
    action: '新增',
    currentWeight: '--',
    recommendedWeight: '-0.08',
    impact: '识别低流动性时段重复噪音',
    reason: '类似告警集中在 UTC 00:00-01:00',
  },
  {
    factor: 'single_source_latency',
    action: '减少',
    currentWeight: '0.12',
    recommendedWeight: '--',
    impact: '移除与指数备用源覆盖重复的因素',
    reason: '与备用源健康度高度相关，保留会重复计分',
  },
  {
    factor: 'estimated_loss_usd',
    action: '保留',
    currentWeight: '0.33',
    recommendedWeight: '0.33',
    impact: '保留直接财务损失影响',
    reason: '仍是 P1 识别的核心因子',
  },
]

const factorColumns: TableProps<FormulaFactorRow>['columns'] = [
  { title: '因子', dataIndex: 'factor', width: 190 },
  {
    title: '动作',
    dataIndex: 'action',
    width: 80,
    render: (action: FactorAction) => <Tag color={actionColors[action]}>{action}</Tag>,
  },
  { title: '当前权重', dataIndex: 'currentWeight', width: 92 },
  { title: '推荐权重', dataIndex: 'recommendedWeight', width: 92 },
  { title: '预期影响', dataIndex: 'impact', width: 210 },
  { title: 'AI 依据', dataIndex: 'reason' },
]

const similarColumns: TableProps<SimilarFeedbackRow>['columns'] = [
  { title: '相似告警簇', dataIndex: 'pattern' },
  { title: '反馈样本', dataIndex: 'samples', width: 90 },
  { title: 'Ops 复核', dataIndex: 'opsVotes', width: 130 },
  { title: '高频原因', dataIndex: 'topReason', width: 210 },
  { title: 'AI 置信度', dataIndex: 'aiConfidence', width: 100 },
]

function SeverityTag({ severity }: { severity: Severity }) {
  return <Tag color={severityColors[severity]}>{severity}</Tag>
}

export function SeverityOptimizationPage() {
  const [opsSeverity, setOpsSeverity] = useState<Severity>('P2')
  const [selectedReasons, setSelectedReasons] = useState<string[]>([
    'duration-short',
    'guardrail-active',
  ])
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [recommendationReady, setRecommendationReady] = useState(true)
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>('draft')

  const currentStep = useMemo(() => {
    if (approvalStatus === 'approved') return 3
    if (approvalStatus === 'submitted' || recommendationReady) return 2
    if (feedbackSubmitted) return 1
    return 0
  }, [approvalStatus, feedbackSubmitted, recommendationReady])

  const weeklyFeedbackCount = feedbackSubmitted ? 47 : 46
  const inaccurateRate = feedbackSubmitted ? 31 : 30

  const submitFeedback = () => {
    setFeedbackSubmitted(true)
    setRecommendationReady(false)
    setApprovalStatus('draft')
  }

  const runAggregation = () => {
    setRecommendationReady(true)
    setApprovalStatus('submitted')
  }

  const approveFormula = () => {
    setApprovalStatus('approved')
  }

  return (
    <PageFrame
      title="AI Incident Severity Optimization"
      extra={
        <Space wrap>
          <Button onClick={submitFeedback} disabled={selectedReasons.length === 0}>
            提交 Ops 反馈
          </Button>
          <Button type="primary" icon={<SyncOutlined />} onClick={runAggregation}>
            AI 周聚合
          </Button>
          <Button
            type="primary"
            icon={<SafetyCertificateOutlined />}
            disabled={!recommendationReady}
            onClick={approveFormula}
          >
            RO 批准公式
          </Button>
        </Space>
      }
    >
      <div className="severity-page">
        <Alert
          showIcon
          type="info"
          message="严重度指标优化闭环"
          description="展示指标告警按公式落到 P1，24/7 Ops 在 AI Incident 警报中标记为 P2 并勾选不准原因，AI 每周聚合同类反馈后推荐新的严重度计算公式，最终由 RO 审批发布。"
        />

        <Steps
          current={currentStep}
          items={[
            { title: '公式定级', description: '指标告警命中 P1' },
            { title: 'Ops 反馈', description: '改判 P2 并标注原因' },
            { title: 'AI 推荐', description: '周聚合生成新公式' },
            { title: 'RO 审批', description: '批准后进入发布队列' },
          ]}
        />

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small">
              <Statistic title="本周严重度反馈" value={weeklyFeedbackCount} suffix="条" />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small">
              <Statistic title="不准确反馈占比" value={inaccurateRate} suffix="%" />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small">
              <Statistic title="推荐公式预计误报下降" value={22} suffix="%" />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small">
              <Statistic
                title="RO 审批状态"
                value={approvalStatus === 'approved' ? 'Approved' : approvalStatus === 'submitted' ? 'Reviewing' : 'Draft'}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={12}>
            <Card
              className="severity-section-card"
              title="1. 指标告警按当前公式定级"
              extra={<SeverityTag severity="P1" />}
            >
              <div className="severity-card-body">
                <div className="severity-kv-grid">
                  <div className="severity-kv">
                    <div className="severity-kv-label">Alert ID</div>
                    <Text strong>INC-2026-1014-0427</Text>
                  </div>
                  <div className="severity-kv">
                    <div className="severity-kv-label">Metric</div>
                    <Text strong>index_spread_bps</Text>
                  </div>
                  <div className="severity-kv">
                    <div className="severity-kv-label">Contract</div>
                    <Text strong>BTC_USD Perpetual</Text>
                  </div>
                  <div className="severity-kv">
                    <div className="severity-kv-label">Calculated score</div>
                    <Text strong>86 / 100</Text>
                  </div>
                </div>
                <div className="severity-formula">
                  severity_score = 0.35 * affected_active_accounts + 0.20 * duration_minutes
                  {'\n'}+ 0.33 * estimated_loss_usd + 0.12 * single_source_latency
                  {'\n'}P1 when severity_score &gt;= 80
                </div>
                <Progress percent={86} strokeColor="#ff4d4f" />
                <Alert
                  type="warning"
                  showIcon
                  message="当前公式将该告警归为 P1"
                  description="但告警 4 分钟内恢复，且风险限价与备用指数源都已生效，Ops 判断用户影响更接近 P2。"
                />
              </div>
            </Card>
          </Col>

          <Col xs={24} xl={12}>
            <Card
              className="severity-section-card"
              title="2. 24/7 Ops 在 AI Incident 中反馈"
              extra={feedbackSubmitted ? <Badge status="success" text="已提交" /> : <Badge status="processing" text="待提交" />}
            >
              <div className="severity-card-body">
                <div className="severity-feedback-box">
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div>
                      <Text type="secondary">Ops 复核严重度</Text>
                      <Radio.Group
                        value={opsSeverity}
                        onChange={(event) => setOpsSeverity(event.target.value)}
                        style={{ display: 'block', marginTop: 8 }}
                      >
                        <Radio.Button value="P1">P1</Radio.Button>
                        <Radio.Button value="P2">P2</Radio.Button>
                        <Radio.Button value="P3">P3</Radio.Button>
                      </Radio.Group>
                    </div>
                    <div>
                      <Text type="secondary">不准确原因</Text>
                      <Checkbox.Group
                        value={selectedReasons}
                        onChange={(values) => setSelectedReasons(values.map(String))}
                        className="severity-reason-group"
                        options={feedbackReasonOptions}
                        style={{ marginTop: 8 }}
                      />
                    </div>
                    <TextArea
                      rows={3}
                      defaultValue="本次告警在低流动性窗口触发，自动保护动作已覆盖风险，建议本类短时恢复告警默认降到 P2。"
                    />
                    <Button type="primary" onClick={submitFeedback} disabled={selectedReasons.length === 0}>
                      提交到 AI Incident 反馈池
                    </Button>
                  </Space>
                </div>
                <Alert
                  type={feedbackSubmitted ? 'success' : 'info'}
                  showIcon
                  message={
                    feedbackSubmitted
                      ? `已记录：公式 P1，Ops 改判 ${opsSeverity}`
                      : `待提交：公式 P1，Ops 当前选择 ${opsSeverity}`
                  }
                  description="该反馈会进入每周聚合任务，与相同告警簇、相同原因组合的样本一起生成公式调整建议。"
                />
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={12}>
            <Card
              className="severity-section-card"
              title="3. AI 每周聚合同类告警反馈"
              extra={
                recommendationReady ? (
                  <Tag icon={<ExperimentOutlined />} color="processing">
                    recommendation ready
                  </Tag>
                ) : (
                  <Tag color="default">waiting for weekly batch</Tag>
                )
              }
            >
              <div className="severity-card-body">
                <Table
                  size="small"
                  bordered
                  rowKey="id"
                  columns={similarColumns}
                  dataSource={recommendationReady ? similarFeedbackRows : []}
                  locale={{ emptyText: <Empty description="点击 AI 周聚合生成推荐" /> }}
                  pagination={false}
                />
                <Timeline
                  items={[
                    {
                      color: 'green',
                      children: <p className="severity-timeline-note">收集 Ops 反馈、告警上下文、实际影响面和恢复时间。</p>,
                    },
                    {
                      color: 'blue',
                      children: <p className="severity-timeline-note">按告警模式聚类，提取高频“不准确原因”。</p>,
                    },
                    {
                      color: 'purple',
                      children: <p className="severity-timeline-note">离线回放最近 90 天告警，比较当前公式与候选公式。</p>,
                    },
                  ]}
                />
              </div>
            </Card>
          </Col>

          <Col xs={24} xl={12}>
            <Card
              className="severity-section-card"
              title="4. 推荐公式变更与 RO 审批"
              extra={
                approvalStatus === 'approved' ? (
                  <Tag icon={<CheckCircleOutlined />} color="success">
                    approved
                  </Tag>
                ) : (
                  <Tag color={approvalStatus === 'submitted' ? 'gold' : 'default'}>
                    {approvalStatus === 'submitted' ? 'RO reviewing' : 'draft'}
                  </Tag>
                )
              }
            >
              <div className="severity-card-body">
                <div className="severity-recommendation">
                  <Title level={5} style={{ marginTop: 0 }}>
                    Recommended formula v2026.10.14
                  </Title>
                  <Paragraph style={{ marginBottom: 0 }}>
                    score = 0.28 * affected_active_accounts + 0.27 * duration_minutes + 0.33 *
                    estimated_loss_usd - 0.16 * guardrail_coverage - 0.08 * market_session_noise
                  </Paragraph>
                </div>
                <div className="severity-factor-summary">
                  <div className="severity-factor-summary-item">
                    <Text type="secondary">新增因子</Text>
                    <span className="severity-factor-number">2</span>
                  </div>
                  <div className="severity-factor-summary-item">
                    <Text type="secondary">减少因子</Text>
                    <span className="severity-factor-number">1</span>
                  </div>
                  <div className="severity-factor-summary-item">
                    <Text type="secondary">调整权重</Text>
                    <span className="severity-factor-number">2</span>
                  </div>
                </div>
                <Table
                  size="small"
                  bordered
                  rowKey="factor"
                  columns={factorColumns}
                  dataSource={recommendationReady ? formulaFactorRows : []}
                  locale={{ emptyText: <Empty description="暂无公式推荐" /> }}
                  pagination={false}
                  scroll={{ x: 900 }}
                />
                <div className="severity-approval-panel">
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong>RO 审批摘要</Text>
                    <Text>
                      预计 P1 误报下降 22%，P1 漏报回放未增加；批准后会创建灰度发布任务，并保留回滚到当前公式的版本指针。
                    </Text>
                    <div className="severity-footer-actions">
                      <Space>
                        <Button>要求补充样本</Button>
                        <Button type="primary" onClick={approveFormula} disabled={!recommendationReady}>
                          批准并进入发布队列
                        </Button>
                      </Space>
                    </div>
                  </Space>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </PageFrame>
  )
}
