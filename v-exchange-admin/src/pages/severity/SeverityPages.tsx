import { useMemo, useState } from 'react'
import {
  Alert,
  App,
  Badge,
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
  Segmented,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Timeline,
  Tooltip,
  Typography,
} from 'antd'
import {
  ArrowRightOutlined,
  BellOutlined,
  CalculatorOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CommentOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { PageFrame } from '../../components/PageFrame'
import {
  factorByKey,
  feedbackReasons,
  type FormulaChange,
  type IncidentAlert,
  type Recommendation,
  type SeverityFormula,
  type SeverityLevel,
} from '../../mock/severityData'
import {
  applyFormula,
  approveRecommendation,
  rejectRecommendation,
  resetSeverityStore,
  severityColor,
  submitFeedback,
  useSeverityState,
} from './severityStore'
import './severity.css'

const { Text, Title, Paragraph } = Typography
const RO_NAME = 'RO · Haixiang Yan'
const SEVERITIES: SeverityLevel[] = ['P1', 'P2', 'P3', 'P4']

function SeverityTag({ level }: { level: SeverityLevel }) {
  return <Tag color={severityColor[level]}>{level}</Tag>
}

/** Count P1..P4 distribution when a formula is applied over a set of alerts. */
function distribution(formula: SeverityFormula, alerts: IncidentAlert[]): Record<SeverityLevel, number> {
  const dist: Record<SeverityLevel, number> = { P1: 0, P2: 0, P3: 0, P4: 0 }
  alerts.forEach((a) => {
    dist[applyFormula(formula, a.factorScores).severity] += 1
  })
  return dist
}

// ===========================================================================
// 1. Pipeline Overview
// ===========================================================================

const PIPELINE_STAGES = [
  {
    icon: <BellOutlined />,
    color: '#ff4d4f',
    title: '告警触发',
    role: '监控系统',
    desc: '指标越过阈值，产生一条 incident 告警（如指数源超时、大额爆仓）。',
  },
  {
    icon: <CalculatorOutlined />,
    color: '#fa8c16',
    title: '公式计算严重度',
    role: '严重度公式',
    desc: '按当前加权公式对各因子打分，映射为 P1–P4。',
  },
  {
    icon: <CommentOutlined />,
    color: '#1890ff',
    title: '24/7 值班反馈',
    role: '值班 Ops',
    desc: '值班判断严重度是否准确，不准则勾选原因并给出建议等级（如 P1→P2）。',
  },
  {
    icon: <RobotOutlined />,
    color: '#722ed1',
    title: 'AI 聚合相似反馈',
    role: 'AI',
    desc: '按告警类型与原因聚类，识别系统性偏差（如"自愈类被判 P1"）。',
  },
  {
    icon: <SafetyCertificateOutlined />,
    color: '#13c2c2',
    title: '每周推荐新公式',
    role: 'AI',
    desc: '每周生成新公式建议：增/减因子、调整权重与阈值，并回放模拟影响。',
  },
  {
    icon: <CheckCircleOutlined />,
    color: '#52c41a',
    title: 'RO 批准 → 生效',
    role: 'RO',
    desc: 'RO 审阅模拟结果后批准或驳回；批准后新公式成为活动版本。',
  },
]

export function SeverityPipelinePage() {
  const { formula, alerts, recommendations } = useSeverityState()

  const feedbackThisWeek = alerts.filter((a) => a.feedback).length
  const disagreements = alerts.filter((a) => a.feedback && !a.feedback.agree).length
  const pending = recommendations.filter((r) => r.status === 'pending').length

  const recentEvents = useMemo(() => {
    const events = alerts
      .filter((a) => a.feedback)
      .map((a) => ({
        at: a.feedback!.at,
        color: a.feedback!.agree ? 'green' : 'orange',
        text: a.feedback!.agree
          ? `${a.feedback!.operator} 确认 ${a.id}「${a.title}」严重度准确`
          : `${a.feedback!.operator} 对 ${a.id}「${a.title}」提交反馈，建议 ${a.feedback!.suggestedSeverity}`,
      }))
    return events.sort((x, y) => (x.at < y.at ? 1 : -1)).slice(0, 6)
  }, [alerts])

  return (
    <PageFrame title="严重度优化链路总览 (AI Severity Optimization)">
      <Paragraph type="secondary" style={{ maxWidth: 980 }}>
        从告警触发到公式生效的闭环：公式计算严重度 → 24/7 值班反馈不准原因 → AI 聚合相似反馈 →
        每周推荐新的严重度计算公式（增减因子、调整权重/阈值）→ RO 批准后自动生效。
      </Paragraph>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="活动公式版本" value={formula.version} valueStyle={{ color: '#13c2c2' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="本周值班反馈" value={feedbackThisWeek} suffix={`/ ${alerts.length}`} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="判定不准 (建议调整)" value={disagreements} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="待 RO 批准的推荐" value={pending} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
      </Row>

      <Card size="small" title="闭环链路" style={{ marginBottom: 20 }}>
        <div className="sev-pipeline">
          {PIPELINE_STAGES.map((stage, i) => (
            <div key={stage.title} style={{ display: 'contents' }}>
              <div className="sev-stage" style={{ ['--sev-stage-color' as string]: stage.color }}>
                <div className="sev-stage-head">
                  <span className="sev-stage-index">{i + 1}</span>
                  <span style={{ color: stage.color, fontSize: 16 }}>{stage.icon}</span>
                </div>
                <div>
                  <div className="sev-stage-title">{stage.title}</div>
                  <div className="sev-stage-role">{stage.role}</div>
                </div>
                <div className="sev-stage-desc">{stage.desc}</div>
              </div>
              {i < PIPELINE_STAGES.length - 1 && (
                <div className="sev-arrow">
                  <ArrowRightOutlined />
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Row gutter={16}>
        <Col span={12}>
          <Card size="small" title="最近值班反馈事件">
            {recentEvents.length ? (
              <Timeline
                items={recentEvents.map((e) => ({
                  color: e.color,
                  children: (
                    <>
                      <div>{e.text}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {e.at}
                      </Text>
                    </>
                  ),
                }))}
              />
            ) : (
              <Empty description="暂无反馈" />
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" title="当前严重度分布 (按活动公式)">
            <DistributionBars dist={distribution(formula, alerts)} total={alerts.length} />
            <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 12, marginBottom: 0 }}>
              角色：监控系统触发告警 · 公式计算严重度 · 24/7 值班提交反馈 · AI 聚合推荐 · RO 审批生效。
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </PageFrame>
  )
}

function DistributionBars({ dist, total }: { dist: Record<SeverityLevel, number>; total: number }) {
  const barColor: Record<SeverityLevel, string> = {
    P1: '#ff4d4f',
    P2: '#fa8c16',
    P3: '#faad14',
    P4: '#1890ff',
  }
  return (
    <Space direction="vertical" style={{ width: '100%' }} size={10}>
      {SEVERITIES.map((lvl) => (
        <div key={lvl} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 28 }}>
            <SeverityTag level={lvl} />
          </span>
          <Progress
            percent={total ? Math.round((dist[lvl] / total) * 100) : 0}
            strokeColor={barColor[lvl]}
            format={() => `${dist[lvl]}`}
            style={{ flex: 1, marginBottom: 0 }}
          />
        </div>
      ))}
    </Space>
  )
}

// ===========================================================================
// 2. Incident Alerts & Feedback
// ===========================================================================

export function SeverityAlertsPage() {
  const { formula, alerts } = useSeverityState()
  const { message } = App.useApp()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<IncidentAlert | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [form] = Form.useForm()
  const agree = Form.useWatch('agree', form)

  const openDrawer = (alert: IncidentAlert) => {
    setActive(alert)
    form.setFieldsValue({
      agree: alert.feedback ? alert.feedback.agree : true,
      suggestedSeverity: alert.feedback?.suggestedSeverity ?? applyFormula(formula, alert.factorScores).severity,
      reasons: alert.feedback?.reasons ?? [],
      note: alert.feedback?.note ?? '',
    })
    setOpen(true)
  }

  const onSubmit = async () => {
    const values = await form.validateFields()
    if (!active) return
    submitFeedback(active.id, {
      agree: values.agree,
      suggestedSeverity: values.agree ? applyFormula(formula, active.factorScores).severity : values.suggestedSeverity,
      reasons: values.agree ? [] : values.reasons ?? [],
      note: values.note ?? '',
      operator: '值班 · Alex Huang',
      at: new Date().toISOString().slice(0, 16).replace('T', ' '),
    })
    message.success('反馈已提交，将汇入本周 AI 聚合推荐')
    setOpen(false)
  }

  const rows = alerts.filter((a) => {
    if (filter === 'all') return true
    if (filter === 'disagree') return a.feedback && !a.feedback.agree
    if (filter === 'none') return !a.feedback
    return applyFormula(formula, a.factorScores).severity === filter
  })

  const scored = active ? applyFormula(formula, active.factorScores) : null

  return (
    <PageFrame title="Incident 告警与值班反馈">
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="当前严重度由活动公式实时计算得出；值班人员若认为不准，可提交反馈并勾选不准原因，反馈将汇入每周 AI 聚合推荐。"
      />
      <Space style={{ marginBottom: 12 }} wrap>
        <Text>筛选：</Text>
        <Segmented
          value={filter}
          onChange={(v) => setFilter(v as string)}
          options={[
            { label: '全部', value: 'all' },
            { label: '判定不准', value: 'disagree' },
            { label: '未反馈', value: 'none' },
            { label: 'P1', value: 'P1' },
            { label: 'P2', value: 'P2' },
            { label: 'P3', value: 'P3' },
            { label: 'P4', value: 'P4' },
          ]}
        />
      </Space>
      <Table<IncidentAlert>
        size="small"
        bordered
        rowKey="id"
        dataSource={rows}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: '告警 ID', dataIndex: 'id', width: 100 },
          { title: '告警名称', dataIndex: 'title' },
          { title: '分类', dataIndex: 'category', width: 170 },
          { title: '触发时间', dataIndex: 'triggeredAt', width: 160 },
          {
            title: '计算得分',
            width: 90,
            render: (_, r) => applyFormula(formula, r.factorScores).score.toFixed(1),
          },
          {
            title: '公式判定',
            width: 90,
            render: (_, r) => <SeverityTag level={applyFormula(formula, r.factorScores).severity} />,
          },
          {
            title: '值班反馈',
            width: 150,
            render: (_, r) => {
              if (!r.feedback) return <Tag>未反馈</Tag>
              if (r.feedback.agree) return <Tag color="green">同意</Tag>
              return (
                <Tag color="orange">
                  建议 {r.feedback.suggestedSeverity}
                </Tag>
              )
            },
          },
          {
            title: '操作',
            width: 110,
            render: (_, r) => (
              <Button type="link" size="small" onClick={() => openDrawer(r)}>
                {r.feedback ? '查看 / 修改' : '反馈'}
              </Button>
            ),
          },
        ]}
      />

      <Drawer
        title={active ? `${active.id} · ${active.title}` : ''}
        width={560}
        open={open}
        onClose={() => setOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button type="primary" onClick={onSubmit}>
              提交反馈
            </Button>
          </Space>
        }
      >
        {active && scored && (
          <>
            <Descriptions size="small" column={1} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="分类">{active.category}</Descriptions.Item>
              <Descriptions.Item label="指标逻辑">{active.metric}</Descriptions.Item>
              <Descriptions.Item label="触发时间">{active.triggeredAt}</Descriptions.Item>
              <Descriptions.Item label="公式判定">
                <Space>
                  <SeverityTag level={scored.severity} />
                  <Text type="secondary">得分 {scored.score.toFixed(1)}</Text>
                </Space>
              </Descriptions.Item>
            </Descriptions>

            <Title level={5}>因子得分明细（{formula.version}）</Title>
            <Table
              size="small"
              bordered
              rowKey="key"
              pagination={false}
              style={{ marginBottom: 20 }}
              dataSource={scored.contributions}
              columns={[
                { title: '因子', render: (_, r) => factorByKey[r.key]?.name ?? r.key },
                { title: '原始分', dataIndex: 'rawScore', width: 70 },
                { title: '权重', width: 70, render: (_, r) => r.weight.toFixed(2) },
                { title: '贡献', width: 80, render: (_, r) => r.contribution.toFixed(1) },
              ]}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}>
                    <Text strong>加权总分</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} colSpan={2}>
                    <Text type="secondary">阈值 P1≥{formula.thresholds.p1} · P2≥{formula.thresholds.p2} · P3≥{formula.thresholds.p3}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    <Text strong>{scored.score.toFixed(1)}</Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />

            <Title level={5}>值班反馈</Title>
            <Form form={form} layout="vertical">
              <Form.Item label="公式判定的严重度是否准确？" name="agree">
                <Radio.Group>
                  <Radio value={true}>准确 (同意)</Radio>
                  <Radio value={false}>不准确 (建议调整)</Radio>
                </Radio.Group>
              </Form.Item>
              {agree === false && (
                <>
                  <Form.Item
                    label="建议严重度"
                    name="suggestedSeverity"
                    rules={[{ required: true, message: '请选择建议严重度' }]}
                  >
                    <Select
                      style={{ width: 160 }}
                      options={SEVERITIES.map((s) => ({ label: s, value: s }))}
                    />
                  </Form.Item>
                  <Form.Item
                    label="不准原因（可多选）"
                    name="reasons"
                    rules={[{ required: true, message: '请至少勾选一个原因' }]}
                  >
                    <Checkbox.Group>
                      <Space direction="vertical">
                        {feedbackReasons.map((r) => (
                          <Checkbox key={r} value={r}>
                            {r}
                          </Checkbox>
                        ))}
                      </Space>
                    </Checkbox.Group>
                  </Form.Item>
                </>
              )}
              <Form.Item label="备注" name="note">
                <Input.TextArea rows={3} placeholder="补充说明（可选）" />
              </Form.Item>
            </Form>
          </>
        )}
      </Drawer>
    </PageFrame>
  )
}

// ===========================================================================
// 3. Weekly AI Recommendations
// ===========================================================================

function ChangeTag({ change }: { change: FormulaChange }) {
  const factorName = 'factor' in change ? factorByKey[change.factor]?.name ?? change.factor : ''
  if (change.type === 'add_factor')
    return <Tag color="green">新增因子「{factorName}」权重 {change.weight.toFixed(2)}</Tag>
  if (change.type === 'remove_factor') return <Tag color="red">移除因子「{factorName}」</Tag>
  if (change.type === 'adjust_weight')
    return (
      <Tag color="blue">
        「{factorName}」权重 {change.from.toFixed(2)} → {change.to.toFixed(2)}
      </Tag>
    )
  return (
    <Tag color="purple">
      {change.level.toUpperCase()} 阈值 {change.from} → {change.to}
    </Tag>
  )
}

export function SeverityRecommendationsPage() {
  const { recommendations, formula, alerts } = useSeverityState()
  const { message } = App.useApp()
  const [decision, setDecision] = useState<{ rec: Recommendation; action: 'approve' | 'reject' } | null>(null)
  const [note, setNote] = useState('')

  const confirm = () => {
    if (!decision) return
    if (decision.action === 'approve') {
      approveRecommendation(decision.rec.id, RO_NAME, note || '批准')
      message.success(`已批准 ${decision.rec.id}，新公式已生效`)
    } else {
      rejectRecommendation(decision.rec.id, RO_NAME, note || '驳回')
      message.info(`已驳回 ${decision.rec.id}`)
    }
    setDecision(null)
    setNote('')
  }

  const statusMeta: Record<Recommendation['status'], { color: string; text: string }> = {
    pending: { color: 'processing', text: '待 RO 批准' },
    approved: { color: 'success', text: '已批准' },
    rejected: { color: 'error', text: '已驳回' },
  }

  return (
    <PageFrame title="每周 AI 推荐 (严重度公式优化)">
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="AI 每周聚合值班反馈，识别系统性偏差并推荐新的严重度公式（增减因子 / 调整权重 / 调整阈值），附模拟回放影响，供 RO 批准。"
      />
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {recommendations.map((rec) => {
          const before = distribution(formula, alerts)
          const after = distribution(rec.proposedFormula, alerts)
          const meta = statusMeta[rec.status]
          return (
            <Card
              key={rec.id}
              size="small"
              title={
                <Space>
                  <Badge status={meta.color as 'processing' | 'success' | 'error'} />
                  <Text strong>{rec.id}</Text>
                  <Text type="secondary">{rec.week}</Text>
                </Space>
              }
              extra={<Tag color={rec.status === 'pending' ? 'blue' : rec.status === 'approved' ? 'green' : 'red'}>{meta.text}</Tag>}
            >
              <Paragraph>{rec.summary}</Paragraph>
              <Row gutter={16}>
                <Col span={14}>
                  <Text strong>公式变更建议</Text>
                  <div style={{ margin: '8px 0 16px' }}>
                    <Space direction="vertical" size={6}>
                      {rec.changes.map((c, i) => (
                        <div key={i}>
                          <ChangeTag change={c} />
                          <Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>
                            {c.rationale}
                          </Text>
                        </div>
                      ))}
                    </Space>
                  </div>

                  <Text strong>AI 聚合的 Top 反馈原因（{rec.basedOnFeedbackCount} 条反馈）</Text>
                  <div style={{ marginTop: 8 }}>
                    {rec.aggregatedReasons.map((r) => {
                      const max = rec.aggregatedReasons[0].count
                      return (
                        <div key={r.reason} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <div style={{ width: 240, fontSize: 12 }}>{r.reason}</div>
                          <div
                            className="sev-reason-bar"
                            style={{ width: `${(r.count / max) * 160 + 20}px` }}
                          />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {r.count}
                          </Text>
                        </div>
                      )
                    })}
                  </div>
                </Col>
                <Col span={10}>
                  <Card size="small" type="inner" title="模拟回放影响（对当前告警集）">
                    <ImpactTable before={before} after={after} />
                    <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>
                      回放基于当前 {alerts.length} 条告警，对比活动公式（{formula.version}）与建议公式（
                      {rec.proposedFormula.version}）。
                    </Paragraph>
                  </Card>
                </Col>
              </Row>

              {rec.status === 'pending' ? (
                <Space style={{ marginTop: 16 }}>
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => setDecision({ rec, action: 'approve' })}>
                    批准并生效 (RO)
                  </Button>
                  <Button danger icon={<CloseCircleOutlined />} onClick={() => setDecision({ rec, action: 'reject' })}>
                    驳回
                  </Button>
                </Space>
              ) : (
                <Alert
                  style={{ marginTop: 12 }}
                  type={rec.status === 'approved' ? 'success' : 'warning'}
                  showIcon
                  message={`${rec.decidedBy} 于 ${rec.decidedAt} ${rec.status === 'approved' ? '批准' : '驳回'}：${rec.decisionNote ?? ''}`}
                />
              )}
            </Card>
          )
        })}
      </Space>

      <Modal
        open={!!decision}
        title={decision?.action === 'approve' ? '批准推荐并使新公式生效' : '驳回推荐'}
        okText={decision?.action === 'approve' ? '确认批准' : '确认驳回'}
        okButtonProps={{ danger: decision?.action === 'reject' }}
        onOk={confirm}
        onCancel={() => {
          setDecision(null)
          setNote('')
        }}
      >
        {decision && (
          <>
            <Paragraph>
              {decision.action === 'approve' ? (
                <>
                  批准后，建议公式 <Text strong>{decision.rec.proposedFormula.version}</Text> 将替换当前活动公式并立即生效。
                </>
              ) : (
                <>驳回后该推荐将被归档，活动公式保持不变。</>
              )}
            </Paragraph>
            <Input.TextArea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="RO 决策备注（可选）"
            />
          </>
        )}
      </Modal>
    </PageFrame>
  )
}

function ImpactTable({
  before,
  after,
}: {
  before: Record<SeverityLevel, number>
  after: Record<SeverityLevel, number>
}) {
  return (
    <Table
      size="small"
      bordered
      pagination={false}
      rowKey="lvl"
      dataSource={SEVERITIES.map((lvl) => ({ lvl, before: before[lvl], after: after[lvl] }))}
      columns={[
        { title: '严重度', dataIndex: 'lvl', render: (v: SeverityLevel) => <SeverityTag level={v} /> },
        { title: '当前', dataIndex: 'before', align: 'center' },
        {
          title: '建议后',
          align: 'center',
          render: (_, r) => {
            const delta = r.after - r.before
            const color = delta === 0 ? undefined : delta > 0 ? '#cf1322' : '#389e0d'
            return (
              <Space size={4}>
                <span>{r.after}</span>
                {delta !== 0 && (
                  <Text style={{ color, fontSize: 12 }}>
                    ({delta > 0 ? '+' : ''}
                    {delta})
                  </Text>
                )}
              </Space>
            )
          },
        },
      ]}
    />
  )
}

// ===========================================================================
// 4. Severity Formula & RO Approval
// ===========================================================================

export function SeverityFormulaPage() {
  const { formula, formulaHistory, recommendations } = useSeverityState()
  const pending = recommendations.filter((r) => r.status === 'pending')

  const weightRows = Object.entries(formula.weights).map(([key, weight]) => ({ key, weight }))

  return (
    <PageFrame
      title="严重度公式 & RO 审批"
      extra={<Button onClick={() => resetSeverityStore()}>重置演示数据</Button>}
    >
      <Row gutter={16}>
        <Col span={14}>
          <Card
            size="small"
            title={
              <Space>
                <span>当前活动公式</span>
                <Tag color="cyan">{formula.version}</Tag>
                <Badge status="success" text="active" />
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Paragraph type="secondary" style={{ marginBottom: 12 }}>
              严重度得分 = Σ(因子原始分 × 权重)；判定阈值：
              <Text strong>
                {' '}
                P1 ≥ {formula.thresholds.p1} · P2 ≥ {formula.thresholds.p2} · P3 ≥ {formula.thresholds.p3} · 其余 P4
              </Text>
            </Paragraph>
            <Table
              size="small"
              bordered
              rowKey="key"
              pagination={false}
              dataSource={weightRows}
              columns={[
                {
                  title: '因子',
                  render: (_, r) => (
                    <Tooltip title={factorByKey[r.key]?.description}>
                      <span>
                        {factorByKey[r.key]?.name ?? r.key}{' '}
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {factorByKey[r.key]?.nameEn}
                        </Text>
                      </span>
                    </Tooltip>
                  ),
                },
                {
                  title: '权重',
                  width: 260,
                  render: (_, r) => (
                    <Space style={{ width: '100%' }}>
                      <div style={{ width: 120 }}>
                        <div className="sev-weight-bar" style={{ width: `${r.weight * 120}px` }} />
                      </div>
                      <Text strong>{r.weight.toFixed(2)}</Text>
                    </Space>
                  ),
                },
              ]}
              summary={(data) => {
                const sum = data.reduce((s, r) => s + r.weight, 0)
                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0}>
                      <Text strong>合计</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <Text strong>{sum.toFixed(2)}</Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )
              }}
            />
          </Card>

          {pending.length > 0 && (
            <Alert
              type="warning"
              showIcon
              message={`有 ${pending.length} 条 AI 推荐等待 RO 批准`}
              description="前往「每周 AI 推荐」页审阅模拟影响并批准 / 驳回；批准后新公式将替换此处的活动公式。"
              style={{ marginBottom: 16 }}
            />
          )}
        </Col>

        <Col span={10}>
          <Card size="small" title="公式版本历史">
            <Timeline
              items={formulaHistory.map((m) => ({
                color: m.status === 'active' ? 'green' : 'gray',
                children: (
                  <>
                    <Space>
                      <Text strong>{m.version}</Text>
                      {m.status === 'active' && <Tag color="green">生效中</Tag>}
                    </Space>
                    <div style={{ fontSize: 12, color: '#595959' }}>{m.note}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {m.effectiveFrom} · {m.author}
                    </Text>
                  </>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>
    </PageFrame>
  )
}
