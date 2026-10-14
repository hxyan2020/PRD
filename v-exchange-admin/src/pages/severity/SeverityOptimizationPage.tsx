import { useMemo, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Divider,
  Drawer,
  Form,
  Input,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Steps,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  CheckOutlined,
  CloseOutlined,
  RobotOutlined,
  SendOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { PageFrame } from '../../components/PageFrame'
import {
  currentSeverityFormula,
  factorNameById,
  inaccuracyReasonOptions,
  seedAlertIncidents,
  severityTagColor,
  weeklyRecommendations,
  type AlertIncident,
  type SeverityFormula,
  type SeverityLevel,
  type WeeklyFormulaRecommendation,
} from '../../mock/severityOptimizationData'

const { Text, Paragraph, Title } = Typography
const { TextArea } = Input

function SeverityTag({ level }: { level: SeverityLevel }) {
  return (
    <Tag color={severityTagColor(level)} style={{ fontWeight: 600 }}>
      {level}
    </Tag>
  )
}

function FormulaPanel({ formula, title }: { formula: SeverityFormula; title?: string }) {
  return (
    <Card size="small" title={title ?? `公式 ${formula.version}`} style={{ height: '100%' }}>
      <Paragraph type="secondary" style={{ marginBottom: 12 }}>
        <Text code>{formula.expression}</Text>
      </Paragraph>
      <Descriptions size="small" column={1} bordered>
        <Descriptions.Item label="生效时间">{formula.effectiveFrom}</Descriptions.Item>
        <Descriptions.Item label="分级阈值">
          {formula.thresholds.map((t) => (
            <Tag key={t.level} color={severityTagColor(t.level)}>
              {t.level} ≥ {t.minScore}
            </Tag>
          ))}
        </Descriptions.Item>
      </Descriptions>
      <Divider style={{ margin: '12px 0' }} />
      <Table
        size="small"
        pagination={false}
        rowKey="id"
        dataSource={formula.factors}
        columns={[
          { title: '因子', dataIndex: 'name', width: 120 },
          {
            title: '权重',
            dataIndex: 'weight',
            width: 80,
            render: (w: number) => `${(w * 100).toFixed(0)}%`,
          },
          { title: '说明', dataIndex: 'description', ellipsis: true },
          {
            title: '状态',
            dataIndex: 'enabled',
            width: 72,
            render: (e: boolean) => (e ? <Tag color="success">启用</Tag> : <Tag>停用</Tag>),
          },
        ]}
      />
    </Card>
  )
}

function WorkflowSteps() {
  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Steps
        size="small"
        items={[
          {
            title: '指标告警',
            description: '监控触发 · 按当前公式计算严重度',
          },
          {
            title: 'AI Incident 反馈',
            description: '24/7 Ops 处理告警 · 勾选不准原因',
          },
          {
            title: 'AI 聚合',
            description: '相似告警反馈聚类 · 周度分析',
          },
          {
            title: 'RO 批准',
            description: '推荐新公式（因子/权重/阈值）· 发布',
          },
        ]}
      />
    </Card>
  )
}

function AlertWorkbench({
  incidents,
  onOpenFeedback,
  onViewDetail,
}: {
  incidents: AlertIncident[]
  onOpenFeedback: (row: AlertIncident) => void
  onViewDetail: (row: AlertIncident) => void
}) {
  const columns: ColumnsType<AlertIncident> = [
    { title: 'Incident ID', dataIndex: 'id', width: 160 },
    { title: '合约', dataIndex: 'contract', width: 96 },
    { title: '告警类型', dataIndex: 'alertType', width: 120 },
    { title: '告警时间', dataIndex: 'firedAt', width: 168 },
    {
      title: '公式得分',
      dataIndex: 'formulaScore',
      width: 88,
      render: (s: number) => s.toFixed(1),
    },
    {
      title: '公式严重度',
      dataIndex: 'formulaSeverity',
      width: 100,
      render: (l: SeverityLevel) => <SeverityTag level={l} />,
    },
    {
      title: '值班反馈',
      width: 120,
      render: (_, row) =>
        row.feedback ? (
          <Space direction="vertical" size={0}>
            <SeverityTag level={row.feedback.expectedSeverity} />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {row.feedback.operator}
            </Text>
          </Space>
        ) : (
          <Tag color="processing">待反馈</Tag>
        ),
    },
    {
      title: '是否分歧',
      width: 96,
      render: (_, row) => {
        if (!row.feedback) return '—'
        const mismatch = row.feedback.expectedSeverity !== row.formulaSeverity
        return mismatch ? (
          <Tag color="orange">公式 ≠ 值班</Tag>
        ) : (
          <Tag color="green">一致</Tag>
        )
      },
    },
    {
      title: '操作',
      fixed: 'right',
      width: 180,
      render: (_, row) => (
        <Space>
          <Button type="link" size="small" onClick={() => onViewDetail(row)}>
            得分明细
          </Button>
          <Button type="link" size="small" onClick={() => onOpenFeedback(row)}>
            {row.feedback ? '查看反馈' : '反馈严重度'}
          </Button>
        </Space>
      ),
    },
  ]

  const mismatchCount = incidents.filter(
    (i) => i.feedback && i.feedback.expectedSeverity !== i.formulaSeverity,
  ).length

  return (
    <>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="本周告警" value={incidents.length} suffix="条" />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="已反馈" value={incidents.filter((i) => i.feedback).length} suffix="条" />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="严重度分歧" value={mismatchCount} suffix="条" valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="待 RO 审批公式"
              value={weeklyRecommendations.filter((r) => r.status === 'pending_ro').length}
              suffix="份"
            />
          </Card>
        </Col>
      </Row>
      <Table
        size="small"
        bordered
        rowKey="id"
        scroll={{ x: 1200 }}
        columns={columns}
        dataSource={incidents}
        pagination={{ pageSize: 10 }}
      />
    </>
  )
}

function RecommendationTab({
  recommendations,
  onSelect,
}: {
  recommendations: WeeklyFormulaRecommendation[]
  onSelect: (rec: WeeklyFormulaRecommendation) => void
}) {
  const columns: ColumnsType<WeeklyFormulaRecommendation> = [
    { title: '推荐 ID', dataIndex: 'id', width: 140 },
    { title: '周期', dataIndex: 'weekLabel', width: 120 },
    { title: '聚类主题', dataIndex: 'clusterLabel', ellipsis: true },
    { title: '反馈样本', dataIndex: 'feedbackCount', width: 88 },
    { title: '生成时间', dataIndex: 'generatedAt', width: 168 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s: WeeklyFormulaRecommendation['status']) => {
        if (s === 'pending_ro') return <Badge status="processing" text="待 RO 批准" />
        if (s === 'approved') return <Badge status="success" text="已批准" />
        return <Badge status="error" text="已驳回" />
      },
    },
    {
      title: '操作',
      width: 120,
      render: (_, row) => (
        <Button type="primary" size="small" ghost onClick={() => onSelect(row)}>
          {row.status === 'pending_ro' ? '审阅 / 批准' : '查看详情'}
        </Button>
      ),
    },
  ]

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Alert
        type="info"
        showIcon
        icon={<RobotOutlined />}
        message="AI 每周一 06:00 UTC 聚合过去 7 日「公式 vs 值班」分歧反馈，生成公式变更建议，仅 RO 可发布至生产。"
      />
      <Table size="small" bordered rowKey="id" columns={columns} dataSource={recommendations} pagination={false} />
    </Space>
  )
}

function ClusterInsightTab({ incidents }: { incidents: AlertIncident[] }) {
  const reasonCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const inc of incidents) {
      if (!inc.feedback) continue
      for (const r of inc.feedback.reasons) {
        map.set(r, (map.get(r) ?? 0) + 1)
      }
    }
    return inaccuracyReasonOptions
      .map((opt) => ({ label: opt.label, value: opt.value, count: map.get(opt.value) ?? 0 }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [incidents])

  const maxCount = reasonCounts[0]?.count ?? 1

  return (
    <Row gutter={16}>
      <Col span={12}>
        <Card title="本周反馈 · 不准原因分布" size="small">
          {reasonCounts.length === 0 ? (
            <Text type="secondary">暂无反馈数据</Text>
          ) : (
            reasonCounts.map((item) => (
              <div key={item.value} style={{ marginBottom: 12 }}>
                <Text>{item.label}</Text>
                <Progress percent={Math.round((item.count / maxCount) * 100)} format={() => `${item.count} 次`} />
              </div>
            ))
          )}
        </Card>
      </Col>
      <Col span={12}>
        <Card title="典型分歧样例（驱动 W42 推荐）" size="small">
          <Paragraph>
            <Text strong>XAU_USD 深度告警</Text>：公式得分 81.6 →{' '}
            <SeverityTag level="P1" />，值班认定 <SeverityTag level="P2" />。
          </Paragraph>
          <Paragraph type="secondary">
            勾选原因：低流量误触、自动恢复、业务影响高估。AI 将同类 4 条 Incident 与 19 条历史反馈聚类为「盘面流动性 · P1 偏高」主题。
          </Paragraph>
        </Card>
      </Col>
    </Row>
  )
}

export function SeverityOptimizationPage() {
  const [incidents, setIncidents] = useState<AlertIncident[]>(() => [...seedAlertIncidents])
  const [recommendations, setRecommendations] = useState<WeeklyFormulaRecommendation[]>(() => [
    ...weeklyRecommendations,
  ])
  const [activeTab, setActiveTab] = useState('alerts')
  const [feedbackTarget, setFeedbackTarget] = useState<AlertIncident | null>(null)
  const [detailTarget, setDetailTarget] = useState<AlertIncident | null>(null)
  const [recDrawer, setRecDrawer] = useState<WeeklyFormulaRecommendation | null>(null)
  const [feedbackForm] = Form.useForm()
  const [roForm] = Form.useForm()

  const openFeedback = (row: AlertIncident) => {
    setFeedbackTarget(row)
    feedbackForm.setFieldsValue({
      expectedSeverity: row.feedback?.expectedSeverity ?? (row.formulaSeverity === 'P1' ? 'P2' : row.formulaSeverity),
      reasons: row.feedback?.reasons ?? [],
      note: row.feedback?.note ?? '',
    })
  }

  const submitFeedback = () => {
    if (!feedbackTarget) return
    feedbackForm.validateFields().then((values) => {
      const updated: AlertIncident = {
        ...feedbackTarget,
        feedback: {
          operator: feedbackTarget.feedback?.operator ?? 'Ops · 当前值班',
          submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
          expectedSeverity: values.expectedSeverity as SeverityLevel,
          reasons: values.reasons as string[],
          note: values.note,
        },
      }
      setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
      message.success('严重度反馈已提交，将纳入 AI 周度聚类')
      setFeedbackTarget(null)
    })
  }

  const approveRecommendation = () => {
    if (!recDrawer) return
    roForm.validateFields().then((values) => {
      setRecommendations((prev) =>
        prev.map((r) =>
          r.id === recDrawer.id
            ? {
                ...r,
                status: 'approved' as const,
                roDecision: {
                  by: 'RO · 当前用户',
                  at: new Date().toISOString().replace('T', ' ').slice(0, 19),
                  comment: values.comment,
                },
              }
            : r,
        ),
      )
      message.success('已批准并排队发布公式 ' + recDrawer.proposedFormula.version)
      setRecDrawer(null)
    })
  }

  const rejectRecommendation = () => {
    if (!recDrawer) return
    Modal.confirm({
      title: '驳回本周公式推荐？',
      content: '驳回后不会修改生产公式，AI 将在下周结合新反馈重新生成建议。',
      okText: '驳回',
      okButtonProps: { danger: true },
      onOk: () => {
        setRecommendations((prev) =>
          prev.map((r) =>
            r.id === recDrawer.id
              ? {
                  ...r,
                  status: 'rejected' as const,
                  roDecision: {
                    by: 'RO · 当前用户',
                    at: new Date().toISOString().replace('T', ' ').slice(0, 19),
                    comment: roForm.getFieldValue('comment'),
                  },
                }
              : r,
          ),
        )
        message.info('已驳回推荐 ' + recDrawer.id)
        setRecDrawer(null)
      },
    })
  }

  return (
    <PageFrame
      title="严重度指标优化（AI Incident → 公式迭代）"
      extra={
        <Space>
          <Tag icon={<ThunderboltOutlined />} color="blue">
            生产公式 {currentSeverityFormula.version}
          </Tag>
          <Button type="link" href="/alarm-list.html" target="_blank">
            告警清单 SOP
          </Button>
        </Space>
      }
    >
      <WorkflowSteps />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'alerts',
            label: '告警工作台',
            children: (
              <AlertWorkbench
                incidents={incidents}
                onOpenFeedback={openFeedback}
                onViewDetail={setDetailTarget}
              />
            ),
          },
          {
            key: 'formula',
            label: '当前严重度公式',
            children: <FormulaPanel formula={currentSeverityFormula} title="生产环境 · 严重度计算公式" />,
          },
          {
            key: 'recommendations',
            label: (
              <span>
                AI 周度推荐{' '}
                {recommendations.some((r) => r.status === 'pending_ro') && (
                  <Badge count={recommendations.filter((r) => r.status === 'pending_ro').length} size="small" />
                )}
              </span>
            ),
            children: (
              <RecommendationTab
                recommendations={recommendations}
                onSelect={(rec) => {
                  setRecDrawer(rec)
                  roForm.setFieldsValue({ comment: rec.roDecision?.comment ?? '' })
                }}
              />
            ),
          },
          {
            key: 'insights',
            label: '反馈聚类洞察',
            children: <ClusterInsightTab incidents={incidents} />,
          },
        ]}
      />

      <Modal
        title={
          feedbackTarget ? (
            <Space>
              <SendOutlined />
              AI Incident · 严重度反馈
              <Text type="secondary">({feedbackTarget.id})</Text>
            </Space>
          ) : (
            ''
          )
        }
        open={!!feedbackTarget}
        onCancel={() => setFeedbackTarget(null)}
        width={640}
        footer={
          feedbackTarget?.feedback ? (
            <Button onClick={() => setFeedbackTarget(null)}>关闭</Button>
          ) : (
            <Space>
              <Button onClick={() => setFeedbackTarget(null)}>取消</Button>
              <Button type="primary" onClick={submitFeedback}>
                提交反馈
              </Button>
            </Space>
          )
        }
      >
        {feedbackTarget && (
          <>
            <Descriptions bordered size="small" column={1} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="告警">{feedbackTarget.alertType}</Descriptions.Item>
              <Descriptions.Item label="内容">{feedbackTarget.alertValue}</Descriptions.Item>
              <Descriptions.Item label="公式判定">
                得分 {feedbackTarget.formulaScore.toFixed(1)} → <SeverityTag level={feedbackTarget.formulaSeverity} />
              </Descriptions.Item>
            </Descriptions>
            <Form form={feedbackForm} layout="vertical" disabled={!!feedbackTarget.feedback}>
              <Form.Item
                label="您认为合理严重度"
                name="expectedSeverity"
                rules={[{ required: true, message: '请选择严重度' }]}
              >
                <Select
                  options={(['P0', 'P1', 'P2', 'P3'] as SeverityLevel[]).map((l) => ({
                    value: l,
                    label: l,
                  }))}
                />
              </Form.Item>
              <Form.Item
                label="不准原因（可多选，供 AI 聚类）"
                name="reasons"
                rules={[{ required: true, message: '请至少选择一项' }]}
              >
                <Checkbox.Group
                  style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                  options={inaccuracyReasonOptions.map((o) => ({ label: o.label, value: o.value }))}
                />
              </Form.Item>
              <Form.Item label="补充说明" name="note">
                <TextArea rows={3} placeholder="例如：亚洲早盘流动性偏薄，5 分钟内已恢复…" />
              </Form.Item>
            </Form>
            {feedbackTarget.feedback && (
              <Alert
                type="success"
                message={`已于 ${feedbackTarget.feedback.submittedAt} 由 ${feedbackTarget.feedback.operator} 提交`}
              />
            )}
          </>
        )}
      </Modal>

      <Drawer
        title={detailTarget ? `因子得分明细 · ${detailTarget.id}` : ''}
        open={!!detailTarget}
        width={520}
        onClose={() => setDetailTarget(null)}
      >
        {detailTarget && (
          <>
            <Title level={5}>
              总分 {detailTarget.formulaScore.toFixed(1)} → <SeverityTag level={detailTarget.formulaSeverity} />
            </Title>
            <Table
              size="small"
              pagination={false}
              rowKey="factorId"
              dataSource={detailTarget.factorBreakdown}
              columns={[
                {
                  title: '因子',
                  dataIndex: 'factorId',
                  render: (id: string) => factorNameById(id),
                },
                { title: '原始分', dataIndex: 'raw', width: 72 },
                { title: '加权贡献', dataIndex: 'weighted', width: 88, render: (w: number) => w.toFixed(2) },
              ]}
            />
          </>
        )}
      </Drawer>

      <Drawer
        title={
          recDrawer ? (
            <Space>
              <RobotOutlined />
              {recDrawer.id} · {recDrawer.weekLabel}
            </Space>
          ) : (
            ''
          )
        }
        open={!!recDrawer}
        width={960}
        onClose={() => setRecDrawer(null)}
        extra={
          recDrawer?.status === 'pending_ro' && (
            <Space>
              <Button danger icon={<CloseOutlined />} onClick={rejectRecommendation}>
                驳回
              </Button>
              <Button type="primary" icon={<CheckOutlined />} onClick={approveRecommendation}>
                批准发布
              </Button>
            </Space>
          )
        }
      >
        {recDrawer && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Alert message={recDrawer.summary} type="warning" showIcon />
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="聚类">{recDrawer.clusterLabel}</Descriptions.Item>
              <Descriptions.Item label="反馈样本">{recDrawer.feedbackCount} 条</Descriptions.Item>
              <Descriptions.Item label="关联 Incident" span={2}>
                {recDrawer.similarIncidentIds.map((id) => (
                  <Tag key={id}>{id}</Tag>
                ))}
              </Descriptions.Item>
              <Descriptions.Item label="预期影响" span={2}>
                {recDrawer.expectedImpact}
              </Descriptions.Item>
            </Descriptions>
            <Card size="small" title="变更摘要">
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {recDrawer.changes.map((c, i) => (
                  <li key={i}>
                    <Tag>{c.type}</Tag> {c.detail}
                  </li>
                ))}
              </ul>
            </Card>
            <Row gutter={16}>
              <Col span={12}>
                <FormulaPanel formula={currentSeverityFormula} title="当前生产公式" />
              </Col>
              <Col span={12}>
                <FormulaPanel formula={recDrawer.proposedFormula} title="AI 推荐公式（草案）" />
              </Col>
            </Row>
            {recDrawer.status === 'pending_ro' && (
              <Form form={roForm} layout="vertical">
                <Form.Item label="RO 审批备注" name="comment">
                  <TextArea rows={2} placeholder="批准或驳回说明（可选）" />
                </Form.Item>
              </Form>
            )}
            {recDrawer.roDecision && (
              <Alert
                type={recDrawer.status === 'approved' ? 'success' : 'error'}
                message={`${recDrawer.roDecision.by} · ${recDrawer.roDecision.at}`}
                description={recDrawer.roDecision.comment}
              />
            )}
          </Space>
        )}
      </Drawer>
    </PageFrame>
  )
}
