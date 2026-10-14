import { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Steps,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import type { TableColumnsType } from 'antd'
import { BulbOutlined, CheckCircleOutlined, RobotOutlined } from '@ant-design/icons'
import { PageFrame } from '../../components/PageFrame'

type SeverityLevel = 'P1' | 'P2' | 'P3' | 'P4'
type RecommendationStatus = '待RO审批' | '已批准' | '已驳回'

type AlertCase = {
  id: string
  metric: string
  formulaVersion: string
  formulaSeverity: SeverityLevel
  opsSeverity?: SeverityLevel
  status: '待反馈' | '已反馈'
  assignedTo: string
  triggeredAt: string
}

type FeedbackRecord = {
  id: string
  alertId: string
  metric: string
  fromSeverity: SeverityLevel
  toSeverity: SeverityLevel
  reasons: string[]
  note?: string
  operator: string
  createdAt: string
}

type FactorChange = {
  type: '新增因子' | '减少因子' | '调整权重'
  factor: string
  from?: number
  to?: number
  detail: string
}

type FormulaRecommendation = {
  id: string
  week: string
  sourceFeedbackCount: number
  baseFormula: string
  candidateFormula: string
  summary: string
  factorChanges: FactorChange[]
  status: RecommendationStatus
  roComment?: string
}

type FeedbackFormValues = {
  correctedSeverity: SeverityLevel
  reasons: string[]
  note?: string
}

type RoFormValues = {
  comment?: string
}

const feedbackReasonOptions = [
  '业务影响被高估',
  '单一交易所噪声导致偏高',
  '重复告警未被合并',
  '已有人工缓释措施生效',
  '市场深度恢复快于模型假设',
  '缺少仓位集中度因子',
]

const severityColors: Record<SeverityLevel, string> = {
  P1: 'red',
  P2: 'orange',
  P3: 'gold',
  P4: 'green',
}

const initialAlerts: AlertCase[] = [
  {
    id: 'ALT-240913-001',
    metric: 'BTC 永续价差偏离率',
    formulaVersion: 'sev-v3.2',
    formulaSeverity: 'P1',
    status: '待反馈',
    assignedTo: '24/7 Ops - Alice',
    triggeredAt: '2026-10-13 22:14:03',
  },
  {
    id: 'ALT-240913-002',
    metric: 'ETH 盘口深度骤降',
    formulaVersion: 'sev-v3.2',
    formulaSeverity: 'P2',
    status: '待反馈',
    assignedTo: '24/7 Ops - Bob',
    triggeredAt: '2026-10-13 22:36:11',
  },
  {
    id: 'ALT-240913-003',
    metric: 'Funding 溢价异常波动',
    formulaVersion: 'sev-v3.2',
    formulaSeverity: 'P1',
    opsSeverity: 'P2',
    status: '已反馈',
    assignedTo: '24/7 Ops - Carol',
    triggeredAt: '2026-10-13 23:04:42',
  },
]

const initialFeedbacks: FeedbackRecord[] = [
  {
    id: 'FDBK-001',
    alertId: 'ALT-240913-003',
    metric: 'Funding 溢价异常波动',
    fromSeverity: 'P1',
    toSeverity: 'P2',
    reasons: ['业务影响被高估', '已有人工缓释措施生效'],
    note: '做市团队已在 3 分钟内恢复报价，实际影响有限',
    operator: 'Carol',
    createdAt: '2026-10-13 23:12:18',
  },
]

const initialRecommendations: FormulaRecommendation[] = [
  {
    id: 'REC-2026-W40',
    week: '2026-W40',
    sourceFeedbackCount: 18,
    baseFormula: 'sev-v3.1',
    candidateFormula: 'sev-v3.2',
    summary: '降低短时噪声影响，加入缓释措施作为降权因子',
    factorChanges: [
      {
        type: '调整权重',
        factor: 'price_deviation',
        from: 0.36,
        to: 0.28,
        detail: '减少单点价格偏离对 P1 告警的过敏感',
      },
      {
        type: '新增因子',
        factor: 'mitigation_status',
        to: -0.15,
        detail: '已执行人工缓释时，整体严重度得分下调',
      },
    ],
    status: '已批准',
    roComment: '批准上线，观察两周误报率',
  },
]

function nextFormulaVersion(recommendations: FormulaRecommendation[]) {
  const versions = recommendations
    .map((item) => item.candidateFormula)
    .map((value) => Number(value.split('sev-v3.')[1]))
    .filter((num) => Number.isFinite(num))
  const max = versions.length ? Math.max(...versions) : 2
  return `sev-v3.${max + 1}`
}

function buildAiRecommendation(feedbacks: FeedbackRecord[], recommendations: FormulaRecommendation[]) {
  const reasonCounts = new Map<string, number>()
  for (const item of feedbacks) {
    for (const reason of item.reasons) {
      reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1)
    }
  }

  const sortedReasons = [...reasonCounts.entries()].sort((a, b) => b[1] - a[1])
  const topReasons = sortedReasons.slice(0, 3).map(([reason]) => reason)
  const factorChanges: FactorChange[] = []

  if (topReasons.includes('业务影响被高估')) {
    factorChanges.push({
      type: '调整权重',
      factor: 'impact_score',
      from: 0.42,
      to: 0.31,
      detail: '下调业务影响因子权重，避免 P1 过度触发',
    })
  }
  if (topReasons.includes('单一交易所噪声导致偏高')) {
    factorChanges.push({
      type: '新增因子',
      factor: 'cross_exchange_consensus',
      to: 0.19,
      detail: '仅当跨交易所一致偏离时提升严重度',
    })
  }
  if (topReasons.includes('重复告警未被合并')) {
    factorChanges.push({
      type: '减少因子',
      factor: 'duplicate_penalty',
      from: 0.12,
      to: 0.04,
      detail: '降低重复告警放大惩罚，配合告警聚合',
    })
  }
  if (topReasons.includes('已有人工缓释措施生效')) {
    factorChanges.push({
      type: '调整权重',
      factor: 'mitigation_status',
      from: -0.15,
      to: -0.22,
      detail: '缓释措施生效时进一步降权',
    })
  }
  if (topReasons.includes('缺少仓位集中度因子')) {
    factorChanges.push({
      type: '新增因子',
      factor: 'position_concentration',
      to: 0.21,
      detail: '新增仓位集中度捕捉局部清算风险',
    })
  }

  if (!factorChanges.length) {
    factorChanges.push({
      type: '调整权重',
      factor: 'depth_recovery_speed',
      from: 0.18,
      to: 0.12,
      detail: '默认下调深度恢复速度惩罚，减少短时异常误报',
    })
  }

  const now = new Date()
  const week = `${now.getUTCFullYear()}-W${String(Math.ceil((now.getUTCDate() + 6) / 7)).padStart(2, '0')}`
  const candidateFormula = nextFormulaVersion(recommendations)
  const baseFormula = recommendations[0]?.candidateFormula ?? 'sev-v3.2'

  return {
    id: `REC-${week}-${feedbacks.length}`,
    week,
    sourceFeedbackCount: feedbacks.length,
    baseFormula,
    candidateFormula,
    summary: `AI 聚合 ${feedbacks.length} 条值班反馈，推荐调整 ${factorChanges.length} 个因子`,
    factorChanges,
    status: '待RO审批' as const,
  }
}

export function SeverityOptimizationPage() {
  const [alerts, setAlerts] = useState(initialAlerts)
  const [feedbacks, setFeedbacks] = useState(initialFeedbacks)
  const [recommendations, setRecommendations] = useState(initialRecommendations)
  const [feedbackForm] = Form.useForm<FeedbackFormValues>()
  const [roForm] = Form.useForm<RoFormValues>()
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  const [roModalOpen, setRoModalOpen] = useState(false)
  const [roDecision, setRoDecision] = useState<Exclude<RecommendationStatus, '待RO审批'>>('已批准')
  const [activeAlert, setActiveAlert] = useState<AlertCase>()
  const [activeRecommendation, setActiveRecommendation] = useState<FormulaRecommendation>()

  const pendingFeedbackCount = useMemo(
    () => alerts.filter((item) => item.status === '待反馈').length,
    [alerts],
  )
  const pendingApprovalCount = useMemo(
    () => recommendations.filter((item) => item.status === '待RO审批').length,
    [recommendations],
  )

  const openFeedbackModal = (alert: AlertCase) => {
    setActiveAlert(alert)
    feedbackForm.setFieldsValue({
      correctedSeverity: alert.formulaSeverity === 'P1' ? 'P2' : alert.formulaSeverity,
      reasons: [],
      note: '',
    })
    setFeedbackModalOpen(true)
  }

  const submitFeedback = async () => {
    const values = await feedbackForm.validateFields()
    if (!activeAlert) return

    const newRecord: FeedbackRecord = {
      id: `FDBK-${String(feedbacks.length + 1).padStart(3, '0')}`,
      alertId: activeAlert.id,
      metric: activeAlert.metric,
      fromSeverity: activeAlert.formulaSeverity,
      toSeverity: values.correctedSeverity,
      reasons: values.reasons,
      note: values.note,
      operator: activeAlert.assignedTo.replace('24/7 Ops - ', ''),
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    }

    setFeedbacks((prev) => [newRecord, ...prev])
    setAlerts((prev) =>
      prev.map((item) =>
        item.id === activeAlert.id
          ? { ...item, opsSeverity: values.correctedSeverity, status: '已反馈' }
          : item,
      ),
    )
    setFeedbackModalOpen(false)
    feedbackForm.resetFields()
    message.success('反馈已提交，已进入 AI Incident 周聚合池')
  }

  const runWeeklyAggregation = () => {
    if (!feedbacks.length) {
      message.warning('暂无可聚合的反馈数据')
      return
    }
    const recommendation = buildAiRecommendation(feedbacks, recommendations)
    setRecommendations((prev) => [recommendation, ...prev])
    message.success('已生成本周 severity 公式推荐，等待 RO 审批')
  }

  const openRoModal = (recommendation: FormulaRecommendation, decision: Exclude<RecommendationStatus, '待RO审批'>) => {
    setActiveRecommendation(recommendation)
    setRoDecision(decision)
    roForm.setFieldsValue({ comment: '' })
    setRoModalOpen(true)
  }

  const submitRoDecision = async () => {
    const values = await roForm.validateFields()
    if (!activeRecommendation) return

    setRecommendations((prev) =>
      prev.map((item) =>
        item.id === activeRecommendation.id
          ? { ...item, status: roDecision, roComment: values.comment ?? '' }
          : item,
      ),
    )
    setRoModalOpen(false)
    message.success(roDecision === '已批准' ? 'RO 已批准推荐公式' : 'RO 已驳回推荐公式')
  }

  const alertColumns: TableColumnsType<AlertCase> = [
    { title: '告警ID', dataIndex: 'id', width: 170 },
    { title: '指标', dataIndex: 'metric', width: 220 },
    { title: '触发时间', dataIndex: 'triggeredAt', width: 170 },
    { title: '当前公式', dataIndex: 'formulaVersion', width: 110 },
    {
      title: '公式判级',
      dataIndex: 'formulaSeverity',
      width: 100,
      render: (value: SeverityLevel) => <Tag color={severityColors[value]}>{value}</Tag>,
    },
    {
      title: 'Ops判级',
      dataIndex: 'opsSeverity',
      width: 100,
      render: (value?: SeverityLevel) =>
        value ? <Tag color={severityColors[value]}>{value}</Tag> : <Tag>待反馈</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (value: AlertCase['status']) => (
        <Tag color={value === '已反馈' ? 'green' : 'blue'}>{value}</Tag>
      ),
    },
    { title: '值班人', dataIndex: 'assignedTo', width: 170 },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_value, record) => (
        <Button type="link" onClick={() => openFeedbackModal(record)}>
          {record.status === '已反馈' ? '补充反馈' : '提交反馈'}
        </Button>
      ),
    },
  ]

  const feedbackColumns: TableColumnsType<FeedbackRecord> = [
    { title: '反馈ID', dataIndex: 'id', width: 110 },
    { title: '告警ID', dataIndex: 'alertId', width: 170 },
    { title: '指标', dataIndex: 'metric', width: 190 },
    {
      title: '公式判级',
      dataIndex: 'fromSeverity',
      width: 100,
      render: (value: SeverityLevel) => <Tag color={severityColors[value]}>{value}</Tag>,
    },
    {
      title: '人工判级',
      dataIndex: 'toSeverity',
      width: 100,
      render: (value: SeverityLevel) => <Tag color={severityColors[value]}>{value}</Tag>,
    },
    {
      title: '不准原因',
      dataIndex: 'reasons',
      width: 280,
      render: (reasons: string[]) => (
        <Space size={[0, 6]} wrap>
          {reasons.map((reason) => (
            <Tag key={reason}>{reason}</Tag>
          ))}
        </Space>
      ),
    },
    { title: '补充说明', dataIndex: 'note', width: 220, ellipsis: true },
    { title: '提交人', dataIndex: 'operator', width: 90 },
    { title: '提交时间', dataIndex: 'createdAt', width: 170 },
  ]

  const recommendationColumns: TableColumnsType<FormulaRecommendation> = [
    { title: '推荐ID', dataIndex: 'id', width: 170 },
    { title: '统计周', dataIndex: 'week', width: 110 },
    { title: '反馈样本', dataIndex: 'sourceFeedbackCount', width: 100 },
    { title: '基线公式', dataIndex: 'baseFormula', width: 100 },
    { title: '推荐公式', dataIndex: 'candidateFormula', width: 110 },
    { title: '推荐摘要', dataIndex: 'summary', width: 280 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value: RecommendationStatus) => {
        const color = value === '已批准' ? 'green' : value === '已驳回' ? 'red' : 'blue'
        return <Tag color={color}>{value}</Tag>
      },
    },
    { title: 'RO意见', dataIndex: 'roComment', width: 200, ellipsis: true },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_value, record) =>
        record.status === '待RO审批' ? (
          <Space>
            <Button size="small" type="primary" ghost onClick={() => openRoModal(record, '已批准')}>
              批准
            </Button>
            <Button size="small" danger ghost onClick={() => openRoModal(record, '已驳回')}>
              驳回
            </Button>
          </Space>
        ) : (
          <Tag>{record.status}</Tag>
        ),
    },
  ]

  return (
    <PageFrame
      title="Severity 指标优化链路"
      extra={
        <Button type="primary" icon={<RobotOutlined />} onClick={runWeeklyAggregation}>
          运行本周 AI 聚合推荐
        </Button>
      }
    >
      <Alert
        showIcon
        type="info"
        style={{ marginBottom: 16 }}
        message="目标：把“公式分级 → 值班反馈 → AI聚合推荐 → RO审批”做成闭环，持续优化 severity 计算公式。"
      />

      <Card size="small" style={{ marginBottom: 16 }}>
        <Steps
          items={[
            { title: '公式判级', description: '基于当前 severity 公式自动分配 P1-P4' },
            { title: 'Ops反馈', description: '值班人员可修正等级并勾选不准原因' },
            { title: 'AI周聚合', description: '聚合同类反馈并推荐因子/权重调整' },
            { title: 'RO审批', description: 'RO 批准后发布新公式版本' },
          ]}
        />
      </Card>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="待反馈告警" value={pendingFeedbackCount} prefix={<BulbOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="反馈池样本" value={feedbacks.length} prefix={<RobotOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="待RO审批推荐" value={pendingApprovalCount} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="已生效公式版本"
              value={recommendations.find((item) => item.status === '已批准')?.candidateFormula ?? 'sev-v3.2'}
            />
          </Card>
        </Col>
      </Row>

      <Card title="1) 指标告警与值班反馈" size="small" style={{ marginBottom: 16 }}>
        <Table
          size="small"
          bordered
          rowKey="id"
          columns={alertColumns}
          dataSource={alerts}
          scroll={{ x: 1300 }}
          pagination={false}
        />
      </Card>

      <Card title="2) AI Incident 反馈池" size="small" style={{ marginBottom: 16 }}>
        <Table
          size="small"
          bordered
          rowKey="id"
          columns={feedbackColumns}
          dataSource={feedbacks}
          scroll={{ x: 1450 }}
          pagination={{ pageSize: 5 }}
        />
      </Card>

      <Card title="3) 每周公式推荐与 RO 审批" size="small">
        <Table
          size="small"
          bordered
          rowKey="id"
          columns={recommendationColumns}
          dataSource={recommendations}
          scroll={{ x: 1600 }}
          pagination={{ pageSize: 5 }}
          expandable={{
            expandedRowRender: (record) => (
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <Typography.Text strong>推荐变更明细</Typography.Text>
                <Space size={[0, 6]} wrap>
                  {record.factorChanges.map((item) => (
                    <Tag key={`${record.id}-${item.factor}-${item.type}`} color="processing">
                      {item.type} · {item.factor}
                      {typeof item.from === 'number' && typeof item.to === 'number'
                        ? ` (${item.from} → ${item.to})`
                        : typeof item.to === 'number'
                          ? ` (→ ${item.to})`
                          : ''}
                    </Tag>
                  ))}
                </Space>
                <Typography.Paragraph style={{ marginBottom: 0 }}>
                  {record.factorChanges.map((item) => `${item.type} ${item.factor}: ${item.detail}`).join('；')}
                </Typography.Paragraph>
              </Space>
            ),
          }}
        />
      </Card>

      <Modal
        title={`反馈告警分级 - ${activeAlert?.id ?? ''}`}
        open={feedbackModalOpen}
        onCancel={() => setFeedbackModalOpen(false)}
        onOk={submitFeedback}
        okText="提交反馈"
      >
        <Form layout="vertical" form={feedbackForm}>
          <Form.Item label="公式判级">
            <Tag color={activeAlert ? severityColors[activeAlert.formulaSeverity] : 'default'}>
              {activeAlert?.formulaSeverity ?? '-'}
            </Tag>
          </Form.Item>
          <Form.Item<FeedbackFormValues>
            label="你认为正确的等级"
            name="correctedSeverity"
            rules={[{ required: true, message: '请选择正确等级' }]}
          >
            <Select
              options={[
                { value: 'P1', label: 'P1' },
                { value: 'P2', label: 'P2' },
                { value: 'P3', label: 'P3' },
                { value: 'P4', label: 'P4' },
              ]}
            />
          </Form.Item>
          <Form.Item<FeedbackFormValues>
            label="不准原因（可多选）"
            name="reasons"
            rules={[{ required: true, message: '请至少选择一个原因' }]}
          >
            <Checkbox.Group options={feedbackReasonOptions} />
          </Form.Item>
          <Form.Item<FeedbackFormValues> label="补充说明" name="note">
            <Input.TextArea rows={3} placeholder="例如：为什么应该从 P1 调整为 P2" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${roDecision}推荐公式 - ${activeRecommendation?.candidateFormula ?? ''}`}
        open={roModalOpen}
        onCancel={() => setRoModalOpen(false)}
        onOk={submitRoDecision}
        okText={roDecision === '已批准' ? '确认批准' : '确认驳回'}
        okButtonProps={{ icon: roDecision === '已批准' ? <CheckCircleOutlined /> : undefined }}
      >
        <Form layout="vertical" form={roForm}>
          <Form.Item label="推荐摘要">
            <Typography.Text>{activeRecommendation?.summary ?? '-'}</Typography.Text>
          </Form.Item>
          <Form.Item<RoFormValues> label="RO审批意见" name="comment">
            <Input.TextArea
              rows={3}
              placeholder={roDecision === '已批准' ? '例如：同意上线并观察 2 周' : '例如：样本量不足，暂缓发布'}
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageFrame>
  )
}
