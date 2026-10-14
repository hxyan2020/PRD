import { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  Modal,
  Progress,
  Radio,
  Row,
  Space,
  Statistic,
  Steps,
  Table,
  Tag,
  Timeline,
  Tooltip,
  Typography,
  message,
} from 'antd'
import {
  AimOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClusterOutlined,
  FunctionOutlined,
  MessageOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { PageFrame } from '../../components/PageFrame'
import {
  aiRecommendations,
  currentFormula,
  feedbackClusters,
  feedbackReasonLabels,
  formulaHistory,
  incidentAlerts,
  pipelineStats,
  severityMeta,
  type AiRecommendation,
  type FeedbackReason,
  type IncidentAlert,
  type IncidentFeedback,
  type SeverityLevel,
} from '../../mock/severityData'

const { Text, Paragraph } = Typography

function SeverityTag({ level }: { level: SeverityLevel }) {
  const meta = severityMeta[level]
  return (
    <Tag color={meta.color} style={{ fontWeight: 600 }}>
      {meta.label}
    </Tag>
  )
}

const severityLevels: SeverityLevel[] = ['P1', 'P2', 'P3', 'P4']

// ----------------------------------------------------------------------------
// Page 1 — Optimization pipeline (complete closed-loop chain)
// ----------------------------------------------------------------------------

const pipelineSteps = [
  {
    title: '1. 指标采集',
    icon: <AimOutlined />,
    description: '监控系统实时采集盘面、定价、资金费、强平、对账等指标（见告警清单）。',
  },
  {
    title: '2. 公式评分 → P 级',
    icon: <FunctionOutlined />,
    description: '按当前严重度公式加权计算 0–100 分，映射到 P1–P4。例：插针告警得 78 分 → P1。',
  },
  {
    title: '3. 告警派发 24/7 Ops',
    icon: <SendOutlined />,
    description: '按 P 级与 SLA 推送到对应 Lark 值班群，附带因子拆解明细。',
  },
  {
    title: '4. 值班反馈',
    icon: <MessageOutlined />,
    description: '值班人员若认为 P 级不准（如系统判 P1 实为 P2），勾选不准原因并提交修正建议。',
  },
  {
    title: '5. AI 聚合相似反馈',
    icon: <ClusterOutlined />,
    description: 'AI 将相似告警的反馈聚类，识别系统性错分模式（高估/低估、缺失因子）。',
  },
  {
    title: '6. 每周公式推荐',
    icon: <BranchesOutlined />,
    description: '每周生成新公式草案：增/减因子、调整权重，并给出预期误分类改善。',
  },
  {
    title: '7. RO 审批',
    icon: <SafetyCertificateOutlined />,
    description: 'Risk Owner 审阅推荐的 diff 与预期影响，批准或驳回（可留备注）。',
  },
  {
    title: '8. 新公式上线',
    icon: <RocketOutlined />,
    description: '批准后灰度 → 全量，公式版本 +1，闭环回到步骤 2 持续优化。',
  },
]

export function SeverityPipelinePage() {
  return (
    <PageFrame title="严重度优化链路 Severity Optimization Pipeline">
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="从告警到公式进化的闭环"
        description="指标告警按公式评分得到 P 级 → 24/7 值班反馈不准原因 → AI 聚合相似反馈 → 每周推荐新的严重度公式（增减因子 / 调整权重）→ RO 审批上线。该链路持续降低误分类率。"
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card size="small">
            <Statistic title="本周告警" value={pipelineStats.openIncidentsThisWeek} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="本周反馈" value={pipelineStats.feedbackThisWeek} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="反馈率" value={pipelineStats.feedbackRate} suffix="%" />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="P1 误分类率"
              value={pipelineStats.p1MisclassificationRate}
              suffix="%"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="待审批推荐"
              value={pipelineStats.pendingRecommendations}
              valueStyle={{ color: '#d46b08' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="当前公式" value={pipelineStats.deployedFormulaVersion} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={14}>
          <Card title="闭环链路 Closed Loop" size="small" style={{ height: '100%' }}>
            <Steps
              direction="vertical"
              size="small"
              current={-1}
              items={pipelineSteps.map((s) => ({
                title: s.title,
                description: s.description,
                icon: s.icon,
                status: 'process',
              }))}
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card
            title="本周 AI 聚合的反馈分布 Feedback Clusters"
            size="small"
            style={{ marginBottom: 16 }}
          >
            <Table
              size="small"
              bordered
              rowKey="reason"
              pagination={false}
              dataSource={feedbackClusters}
              columns={[
                {
                  title: '不准原因',
                  dataIndex: 'reason',
                  render: (r: FeedbackReason) => feedbackReasonLabels[r],
                },
                { title: '反馈数', dataIndex: 'count', width: 72, align: 'center' },
                { title: '高频分类', dataIndex: 'topCategory' },
              ]}
            />
          </Card>
          <Card title="产出 Output" size="small">
            <Paragraph style={{ marginBottom: 8 }}>
              AI 基于上述聚类生成下一版公式草案，提交 Risk Owner 审批。
            </Paragraph>
            <Space>
              <Tag color="processing">增减因子</Tag>
              <Tag color="processing">调整权重</Tag>
              <Tag color="processing">阈值重标定</Tag>
            </Space>
          </Card>
        </Col>
      </Row>
    </PageFrame>
  )
}

// ----------------------------------------------------------------------------
// Page 2 — Current severity formula
// ----------------------------------------------------------------------------

export function SeverityFormulaPage() {
  const totalWeight = currentFormula.factors
    .filter((f) => f.enabled)
    .reduce((acc, f) => acc + f.weight, 0)

  return (
    <PageFrame title="当前严重度公式 Severity Formula">
      <Card size="small" style={{ marginBottom: 16 }}>
        <Descriptions size="small" column={3} bordered>
          <Descriptions.Item label="公式版本">
            <Tag color="blue">{currentFormula.version}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="生效日期">{currentFormula.effectiveFrom}</Descriptions.Item>
          <Descriptions.Item label="批准人">{currentFormula.approvedBy}</Descriptions.Item>
        </Descriptions>
        <Alert
          style={{ marginTop: 16 }}
          type="success"
          showIcon
          message="评分公式"
          description="severity_score = Σ ( weight_i × factor_score_i )，取值 0–100；再按阈值映射到 P1–P4。"
        />
      </Card>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="因子与权重 Factors & Weights" size="small">
            <Table
              size="small"
              bordered
              rowKey="id"
              pagination={false}
              dataSource={currentFormula.factors}
              columns={[
                { title: '因子', dataIndex: 'name', width: 220 },
                { title: '说明', dataIndex: 'description' },
                {
                  title: '权重',
                  dataIndex: 'weight',
                  width: 180,
                  render: (w: number) => (
                    <Space>
                      <Progress
                        percent={Math.round(w * 100)}
                        size="small"
                        style={{ width: 90 }}
                        format={(p) => `${p}%`}
                      />
                    </Space>
                  ),
                },
                {
                  title: '状态',
                  dataIndex: 'enabled',
                  width: 80,
                  align: 'center',
                  render: (e: boolean) =>
                    e ? <Tag color="success">启用</Tag> : <Tag>停用</Tag>,
                },
              ]}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={2}>
                    <Text strong>权重合计</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    <Text strong>{Math.round(totalWeight * 100)}%</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} />
                </Table.Summary.Row>
              )}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="P 级阈值 Thresholds" size="small" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {currentFormula.thresholds.map((t) => (
                <div
                  key={t.level}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <SeverityTag level={t.level} />
                  <Text>score ≥ {t.min}</Text>
                  <Text type="secondary">SLA {severityMeta[t.level].responseSla}</Text>
                </div>
              ))}
            </Space>
          </Card>
          <Card title="版本历史 Version History" size="small">
            <Timeline
              items={formulaHistory.map((v) => ({
                color: v.status === 'active' ? 'green' : 'gray',
                children: (
                  <div>
                    <Space>
                      <Tag color={v.status === 'active' ? 'green' : 'default'}>{v.version}</Tag>
                      <Text type="secondary">{v.effectiveFrom}</Text>
                    </Space>
                    <div style={{ marginTop: 4 }}>{v.summary}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {v.approvedBy}
                    </Text>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>
    </PageFrame>
  )
}

// ----------------------------------------------------------------------------
// Page 3 — Incident severity feedback (24/7 ops interaction surface)
// ----------------------------------------------------------------------------

function FeedbackSummary({ feedback }: { feedback: IncidentFeedback }) {
  return (
    <Space direction="vertical" size={2}>
      <Space size={4}>
        <Text type="secondary">建议</Text>
        <SeverityTag level={feedback.suggestedSeverity} />
      </Space>
      <Space size={[4, 4]} wrap>
        {feedback.reasons.map((r) => (
          <Tag key={r} color="orange">
            {feedbackReasonLabels[r]}
          </Tag>
        ))}
      </Space>
    </Space>
  )
}

export function SeverityIncidentsPage() {
  const [alerts, setAlerts] = useState<IncidentAlert[]>(incidentAlerts)
  const [editing, setEditing] = useState<IncidentAlert | null>(null)
  const [form] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()

  const openDrawer = (record: IncidentAlert) => {
    setEditing(record)
    form.setFieldsValue({
      suggestedSeverity: record.feedback?.suggestedSeverity ?? record.computedSeverity,
      reasons: record.feedback?.reasons ?? [],
      comment: record.feedback?.comment ?? '',
    })
  }

  const closeDrawer = () => {
    setEditing(null)
    form.resetFields()
  }

  const submitFeedback = async () => {
    const values = await form.validateFields()
    if (!editing) return
    const feedback: IncidentFeedback = {
      suggestedSeverity: values.suggestedSeverity,
      reasons: values.reasons,
      comment: values.comment ?? '',
      submittedBy: 'OnCall · 当前值班',
      submittedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    }
    setAlerts((prev) => prev.map((a) => (a.id === editing.id ? { ...a, feedback } : a)))
    messageApi.success(`已提交反馈：${editing.id} 建议修正为 ${feedback.suggestedSeverity}`)
    closeDrawer()
  }

  const feedbackCount = alerts.filter((a) => a.feedback).length

  return (
    <PageFrame title="告警严重度反馈 Incident Severity Feedback">
      {contextHolder}
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message="24/7 值班反馈入口"
        description="若系统按公式计算的 P 级与实际情况不符，请点击「反馈」选择正确严重度并勾选不准原因。所有反馈将由 AI 每周聚合并推荐公式优化。"
      />
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="当前告警" value={alerts.length} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="已反馈" value={feedbackCount} valueStyle={{ color: '#d46b08' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="系统判 P1"
              value={alerts.filter((a) => a.computedSeverity === 'P1').length}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="值班下调建议"
              value={
                alerts.filter(
                  (a) =>
                    a.feedback &&
                    severityLevels.indexOf(a.feedback.suggestedSeverity) >
                      severityLevels.indexOf(a.computedSeverity),
                ).length
              }
            />
          </Card>
        </Col>
      </Row>

      <Table
        size="small"
        bordered
        rowKey="id"
        dataSource={alerts}
        pagination={{ pageSize: 10 }}
        expandable={{
          expandedRowRender: (record) => (
            <Table
              size="small"
              bordered
              rowKey="factorId"
              pagination={false}
              dataSource={record.breakdown}
              columns={[
                { title: '因子', dataIndex: 'factorName' },
                { title: '因子得分 (0-100)', dataIndex: 'factorScore', align: 'center' },
                {
                  title: '权重',
                  dataIndex: 'weight',
                  align: 'center',
                  render: (w: number) => `${Math.round(w * 100)}%`,
                },
                { title: '加权贡献', dataIndex: 'weighted', align: 'center' },
              ]}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3}>
                    <Text strong>总分 → 严重度</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    <Space>
                      <Text strong>{record.score}</Text>
                      <SeverityTag level={record.computedSeverity} />
                    </Space>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          ),
        }}
        columns={[
          { title: '告警 ID', dataIndex: 'id', width: 130 },
          { title: '告警', dataIndex: 'alertName', width: 180 },
          { title: '分类', dataIndex: 'category', width: 130 },
          { title: '合约', dataIndex: 'contract', width: 120 },
          { title: '指标', dataIndex: 'metricSummary' },
          { title: '触发时间', dataIndex: 'triggeredAt', width: 160 },
          {
            title: '系统 P 级',
            dataIndex: 'computedSeverity',
            width: 110,
            render: (level: SeverityLevel, record) => (
              <Space>
                <SeverityTag level={level} />
                <Tooltip title={`score ${record.score}`}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {record.score}
                  </Text>
                </Tooltip>
              </Space>
            ),
          },
          {
            title: '值班反馈',
            dataIndex: 'feedback',
            width: 220,
            render: (feedback: IncidentFeedback | null) =>
              feedback ? (
                <FeedbackSummary feedback={feedback} />
              ) : (
                <Tag>待反馈</Tag>
              ),
          },
          {
            title: '操作',
            key: 'action',
            width: 110,
            fixed: 'right',
            render: (_, record) => (
              <Button
                type="link"
                size="small"
                icon={<MessageOutlined />}
                onClick={() => openDrawer(record)}
              >
                {record.feedback ? '修改反馈' : '反馈'}
              </Button>
            ),
          },
        ]}
        scroll={{ x: 1500 }}
      />

      <Drawer
        title={editing ? `严重度反馈 · ${editing.id}` : '严重度反馈'}
        width={480}
        open={!!editing}
        onClose={closeDrawer}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={closeDrawer}>取消</Button>
            <Button type="primary" onClick={submitFeedback}>
              提交反馈
            </Button>
          </Space>
        }
      >
        {editing && (
          <>
            <Descriptions size="small" column={1} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="告警">{editing.alertName}</Descriptions.Item>
              <Descriptions.Item label="指标">{editing.metricSummary}</Descriptions.Item>
              <Descriptions.Item label="系统判定">
                <Space>
                  <SeverityTag level={editing.computedSeverity} />
                  <Text type="secondary">score {editing.score}</Text>
                </Space>
              </Descriptions.Item>
            </Descriptions>
            <Form form={form} layout="vertical">
              <Form.Item
                label="你认为正确的严重度"
                name="suggestedSeverity"
                rules={[{ required: true, message: '请选择严重度' }]}
              >
                <Radio.Group>
                  {severityLevels.map((lvl) => (
                    <Radio.Button key={lvl} value={lvl}>
                      {lvl}
                    </Radio.Button>
                  ))}
                </Radio.Group>
              </Form.Item>
              <Form.Item
                label="不准原因（可多选）"
                name="reasons"
                rules={[{ required: true, message: '请至少选择一个原因' }]}
              >
                <Checkbox.Group style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(Object.keys(feedbackReasonLabels) as FeedbackReason[]).map((r) => (
                    <Checkbox key={r} value={r}>
                      {feedbackReasonLabels[r]}
                    </Checkbox>
                  ))}
                </Checkbox.Group>
              </Form.Item>
              <Form.Item label="补充说明" name="comment">
                <Input.TextArea rows={4} placeholder="描述实际影响、恢复情况、建议新增/调整的因子等" />
              </Form.Item>
            </Form>
          </>
        )}
      </Drawer>
    </PageFrame>
  )
}

// ----------------------------------------------------------------------------
// Page 4 — AI weekly recommendations + RO approval
// ----------------------------------------------------------------------------

const changeTypeMeta: Record<string, { label: string; color: string }> = {
  add_factor: { label: '新增因子', color: 'green' },
  remove_factor: { label: '移除因子', color: 'red' },
  adjust_weight: { label: '调整权重', color: 'blue' },
}

const statusMeta: Record<AiRecommendation['status'], { label: string; color: string }> = {
  pending: { label: '待审批', color: 'orange' },
  approved: { label: '已批准', color: 'green' },
  rejected: { label: '已驳回', color: 'red' },
}

function RecommendationCard({
  rec,
  onReview,
}: {
  rec: AiRecommendation
  onReview: (rec: AiRecommendation, decision: 'approved' | 'rejected') => void
}) {
  const status = statusMeta[rec.status]
  return (
    <Card
      size="small"
      style={{ marginBottom: 16 }}
      title={
        <Space>
          <Text strong>{rec.week}</Text>
          <Tag color="blue">{rec.proposedVersion}</Tag>
          <Tag color={status.color}>{status.label}</Tag>
        </Space>
      }
      extra={
        rec.status === 'pending' ? (
          <Space>
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => onReview(rec, 'rejected')}
            >
              驳回
            </Button>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => onReview(rec, 'approved')}
            >
              RO 批准
            </Button>
          </Space>
        ) : (
          <Text type="secondary">
            {rec.reviewer} · {rec.reviewedAt}
          </Text>
        )
      }
    >
      <Paragraph>{rec.summary}</Paragraph>
      <Row gutter={16} style={{ marginBottom: 12 }}>
        <Col span={6}>
          <Statistic title="聚合反馈数" value={rec.basedOnFeedbackCount} />
        </Col>
        <Col span={6}>
          <Statistic title="覆盖告警数" value={rec.clusteredIncidents} />
        </Col>
        <Col span={12}>
          <Text type="secondary">预期 P1 误分类率</Text>
          <Space align="center" style={{ display: 'flex', marginTop: 4 }}>
            <Tag color="red">{rec.misclassificationBefore}%</Tag>
            <Text>→</Text>
            <Tag color="green">{rec.misclassificationAfter}%</Tag>
            <Progress
              percent={100 - rec.misclassificationAfter}
              success={{ percent: 100 - rec.misclassificationBefore }}
              size="small"
              style={{ width: 120 }}
              showInfo={false}
            />
          </Space>
        </Col>
      </Row>
      <Alert type="info" showIcon style={{ marginBottom: 12 }} message={rec.expectedImpact} />
      <Table
        size="small"
        bordered
        rowKey={(r) => `${rec.id}-${r.type}-${r.factor}`}
        pagination={false}
        dataSource={rec.changes}
        columns={[
          {
            title: '变更类型',
            dataIndex: 'type',
            width: 110,
            render: (t: string) => (
              <Tag color={changeTypeMeta[t]?.color}>{changeTypeMeta[t]?.label ?? t}</Tag>
            ),
          },
          { title: '因子', dataIndex: 'factor', width: 200 },
          {
            title: '变更',
            key: 'change',
            width: 160,
            render: (_, r) => (
              <Space>
                <Text delete type="secondary">
                  {r.from}
                </Text>
                <Text>→</Text>
                <Text strong>{r.to}</Text>
              </Space>
            ),
          },
          { title: '依据 Rationale', dataIndex: 'rationale' },
        ]}
      />
      {rec.reviewComment && (
        <Paragraph style={{ marginTop: 12, marginBottom: 0 }}>
          <Text type="secondary">RO 备注：</Text>
          {rec.reviewComment}
        </Paragraph>
      )}
    </Card>
  )
}

export function SeverityRecommendationsPage() {
  const [recs, setRecs] = useState<AiRecommendation[]>(aiRecommendations)
  const [review, setReview] = useState<{
    rec: AiRecommendation
    decision: 'approved' | 'rejected'
  } | null>(null)
  const [comment, setComment] = useState('')
  const [messageApi, contextHolder] = message.useMessage()

  const pendingCount = useMemo(() => recs.filter((r) => r.status === 'pending').length, [recs])

  const openReview = (rec: AiRecommendation, decision: 'approved' | 'rejected') => {
    setReview({ rec, decision })
    setComment('')
  }

  const confirmReview = () => {
    if (!review) return
    const reviewedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
    setRecs((prev) =>
      prev.map((r) =>
        r.id === review.rec.id
          ? {
              ...r,
              status: review.decision,
              reviewer: 'RO · 当前审批人',
              reviewedAt,
              reviewComment: comment || (review.decision === 'approved' ? '同意' : '驳回'),
            }
          : r,
      ),
    )
    messageApi.success(
      review.decision === 'approved'
        ? `已批准 ${review.rec.proposedVersion}，将进入灰度上线`
        : `已驳回 ${review.rec.week} 的推荐`,
    )
    setReview(null)
  }

  return (
    <PageFrame title="AI 公式推荐与审批 Weekly Recommendations">
      {contextHolder}
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="AI 每周推荐 · RO 审批"
        description="AI 聚合值班反馈，每周推荐新的严重度计算公式（增减因子、调整权重）。Risk Owner 审阅 diff 与预期影响后批准上线。"
      />
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="待审批推荐"
              value={pendingCount}
              valueStyle={{ color: pendingCount ? '#d46b08' : undefined }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="已批准"
              value={recs.filter((r) => r.status === 'approved').length}
              valueStyle={{ color: '#389e0d' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="已驳回"
              value={recs.filter((r) => r.status === 'rejected').length}
            />
          </Card>
        </Col>
      </Row>

      {recs.length === 0 ? (
        <Empty description="暂无推荐" />
      ) : (
        recs.map((rec) => (
          <RecommendationCard key={rec.id} rec={rec} onReview={openReview} />
        ))
      )}

      <Modal
        title={
          review?.decision === 'approved' ? 'RO 批准公式推荐' : 'RO 驳回公式推荐'
        }
        open={!!review}
        onCancel={() => setReview(null)}
        onOk={confirmReview}
        okText={review?.decision === 'approved' ? '确认批准' : '确认驳回'}
        okButtonProps={{ danger: review?.decision === 'rejected' }}
      >
        {review && (
          <>
            <Paragraph>
              {review.decision === 'approved' ? '批准' : '驳回'}
              <Text strong> {review.rec.proposedVersion} </Text>
              （{review.rec.week}）？
            </Paragraph>
            <Input.TextArea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="审批备注（可选），如灰度范围、生效时间等"
            />
          </>
        )}
      </Modal>
    </PageFrame>
  )
}
