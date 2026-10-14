import { useMemo, useState } from 'react'
import {
  Alert,
  App,
  Button,
  Checkbox,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import { CommentOutlined, ProfileOutlined, RobotOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import { PageFrame } from '../../components/PageFrame'
import { QueryResetButtons } from '../../components/QueryResetButtons'
import {
  feedbackReasonOptions,
  getActiveVersion,
  getAlerts,
  severityMeta,
  submitAlertFeedback,
  type AlertRecord,
  type SeverityLevel,
} from '../../mock/severityData'

const { Text } = Typography

type FeedbackFormValues = {
  accurate: 'yes' | 'no'
  suggestedLevel?: SeverityLevel
  reasons?: string[]
  note?: string
}

export function SeverityAlertFeedbackPage() {
  const { message } = App.useApp()
  const [filterForm] = Form.useForm()
  const [feedbackForm] = Form.useForm<FeedbackFormValues>()
  const [, forceRender] = useState(0)
  const [levelFilter, setLevelFilter] = useState<SeverityLevel | 'all'>('all')
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'done' | 'todo'>('all')
  const [detailAlert, setDetailAlert] = useState<AlertRecord | null>(null)
  const [feedbackAlert, setFeedbackAlert] = useState<AlertRecord | null>(null)
  const accurateChoice = Form.useWatch('accurate', feedbackForm)

  const activeVersion = getActiveVersion()
  const alerts = getAlerts()

  const dataSource = useMemo(
    () =>
      alerts.filter((a) => {
        if (levelFilter !== 'all' && a.formulaLevel !== levelFilter) return false
        if (feedbackFilter === 'done' && !a.feedback) return false
        if (feedbackFilter === 'todo' && a.feedback) return false
        return true
      }),
    [alerts, levelFilter, feedbackFilter],
  )

  const openFeedback = (alert: AlertRecord) => {
    setFeedbackAlert(alert)
    feedbackForm.setFieldsValue({
      accurate: alert.feedback ? (alert.feedback.accurate ? 'yes' : 'no') : 'no',
      suggestedLevel: alert.feedback?.suggestedLevel ?? nextLowerLevel(alert.formulaLevel),
      reasons: alert.feedback?.reasons ?? [],
      note: alert.feedback?.note ?? '',
    })
  }

  const submitFeedback = async () => {
    if (!feedbackAlert) return
    const values = await feedbackForm.validateFields()
    submitAlertFeedback(feedbackAlert.id, {
      accurate: values.accurate === 'yes',
      suggestedLevel: values.accurate === 'no' ? values.suggestedLevel : undefined,
      reasons: values.accurate === 'no' ? (values.reasons ?? []) : [],
      note: values.note,
      ratedBy: '值班 Ops-Chen',
      ratedAt: nowString(),
    })
    setFeedbackAlert(null)
    forceRender((n) => n + 1)
    message.success(
      values.accurate === 'yes'
        ? '已确认定级准确，反馈已记录'
        : `反馈已提交：建议 ${values.suggestedLevel}，将进入本周 AI 聚合`,
    )
  }

  const columns: TableProps<AlertRecord>['columns'] = [
    { title: '告警ID', dataIndex: 'id', width: 150, fixed: 'left' },
    { title: '告警名称', dataIndex: 'title', width: 200 },
    { title: '合约', dataIndex: 'contract', width: 100 },
    { title: '触发时间', dataIndex: 'triggeredAt', width: 160 },
    {
      title: `公式得分（${activeVersion.version}）`,
      dataIndex: 'score',
      width: 140,
      render: (score: number, record) => (
        <Button type="link" size="small" onClick={() => setDetailAlert(record)}>
          {score.toFixed(1)} 分
        </Button>
      ),
    },
    {
      title: '公式定级',
      dataIndex: 'formulaLevel',
      width: 100,
      render: (level: SeverityLevel) => <Tag color={severityMeta[level].color}>{level}</Tag>,
    },
    {
      title: '值班反馈',
      key: 'feedback',
      width: 130,
      render: (_, record) => {
        if (!record.feedback) return <Tag>待反馈</Tag>
        if (record.feedback.accurate) return <Tag color="green">确认准确</Tag>
        return (
          <Space size={4}>
            <Tag color="red">不准</Tag>
            <Tag color={severityMeta[record.feedback.suggestedLevel!].color}>
              建议 {record.feedback.suggestedLevel}
            </Tag>
          </Space>
        )
      },
    },
    {
      title: '不准原因（勾选）',
      key: 'reasons',
      width: 300,
      render: (_, record) =>
        record.feedback && record.feedback.reasons.length ? (
          <Space size={[4, 4]} wrap>
            {record.feedback.reasons.map((r) => (
              <Tag key={r} color="orange" style={{ marginInlineEnd: 0 }}>
                {r}
              </Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: '相似簇',
      dataIndex: 'clusterId',
      width: 90,
      render: (c?: string) => (c ? <Tag color="purple">{c}</Tag> : <Text type="secondary">-</Text>),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<ProfileOutlined />} onClick={() => setDetailAlert(record)}>
            评分明细
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<CommentOutlined />}
            onClick={() => openFeedback(record)}
          >
            {record.feedback ? '修改反馈' : '定级反馈'}
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <PageFrame title="告警定级与值班反馈（AI Incident 反馈入口）">
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message="24/7 值班操作指引"
        description="每条告警均由严重度公式自动定级并推送 AI incident 卡片。若你认为定级不符合实际（如公式判 P1、实际应为 P2），请点击「定级反馈」勾选不准原因。反馈将进入 AI 每周聚合，用于推荐新的严重度计算公式。"
      />

      <Form form={filterForm} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item label="公式定级" name="level" initialValue="all">
          <Select
            style={{ width: 120 }}
            onChange={(v: SeverityLevel | 'all') => setLevelFilter(v)}
            options={[
              { value: 'all', label: '全部' },
              { value: 'P0', label: 'P0' },
              { value: 'P1', label: 'P1' },
              { value: 'P2', label: 'P2' },
              { value: 'P3', label: 'P3' },
            ]}
          />
        </Form.Item>
        <Form.Item label="反馈状态" name="feedback" initialValue="all">
          <Select
            style={{ width: 130 }}
            onChange={(v: 'all' | 'done' | 'todo') => setFeedbackFilter(v)}
            options={[
              { value: 'all', label: '全部' },
              { value: 'todo', label: '待反馈' },
              { value: 'done', label: '已反馈' },
            ]}
          />
        </Form.Item>
        <Form.Item>
          <QueryResetButtons
            onReset={() => {
              filterForm.resetFields()
              setLevelFilter('all')
              setFeedbackFilter('all')
            }}
          />
        </Form.Item>
      </Form>

      <Table
        size="small"
        bordered
        rowKey="id"
        columns={columns}
        dataSource={dataSource}
        scroll={{ x: 1500 }}
        pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
      />

      <Drawer
        title={detailAlert ? `评分明细 · ${detailAlert.id}` : ''}
        width={620}
        open={!!detailAlert}
        onClose={() => setDetailAlert(null)}
      >
        {detailAlert && <ScoreDetail alert={detailAlert} />}
      </Drawer>

      <Modal
        title={
          <Space>
            <RobotOutlined />
            AI Incident 定级反馈 · {feedbackAlert?.id}
          </Space>
        }
        open={!!feedbackAlert}
        onOk={submitFeedback}
        onCancel={() => setFeedbackAlert(null)}
        okText="提交反馈"
        cancelText="取消"
        width={560}
        destroyOnHidden
      >
        {feedbackAlert && (
          <>
            <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="告警名称" span={2}>
                {feedbackAlert.title}（{feedbackAlert.contract}）
              </Descriptions.Item>
              <Descriptions.Item label="公式得分">{feedbackAlert.score.toFixed(1)} 分</Descriptions.Item>
              <Descriptions.Item label="公式定级">
                <Tag color={severityMeta[feedbackAlert.formulaLevel].color}>
                  {severityMeta[feedbackAlert.formulaLevel].label}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
            <Form form={feedbackForm} layout="vertical">
              <Form.Item
                label="公式定级是否准确？"
                name="accurate"
                rules={[{ required: true, message: '请选择' }]}
              >
                <Radio.Group>
                  <Radio value="yes">准确，无需调整</Radio>
                  <Radio value="no">不准，需要修正</Radio>
                </Radio.Group>
              </Form.Item>
              {accurateChoice === 'no' && (
                <>
                  <Form.Item
                    label="你认为的实际严重度"
                    name="suggestedLevel"
                    rules={[{ required: true, message: '请选择建议定级' }]}
                  >
                    <Select
                      style={{ width: 240 }}
                      options={(['P0', 'P1', 'P2', 'P3'] as SeverityLevel[]).map((l) => ({
                        value: l,
                        label: `${severityMeta[l].label} — ${severityMeta[l].desc}`,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item
                    label="定级不准的原因（可多选，供 AI 聚合分析）"
                    name="reasons"
                    rules={[{ required: true, message: '请至少勾选一个原因' }]}
                  >
                    <Checkbox.Group
                      options={feedbackReasonOptions.map((r) => ({ label: r, value: r }))}
                      style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                    />
                  </Form.Item>
                </>
              )}
              <Form.Item label="补充说明（可选）" name="note">
                <Input.TextArea rows={3} placeholder="例如：凌晨低峰期价差因子噪声大，MM 已自动回补，无真实用户资金影响" />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </PageFrame>
  )
}

function ScoreDetail({ alert }: { alert: AlertRecord }) {
  const version = getActiveVersion()
  const rows = alert.readings
    .map((r) => {
      const factor = version.factors.find((f) => f.code === r.code)
      return factor
        ? {
            key: r.code,
            factor: `${factor.code} ${factor.name}`,
            raw: r.raw,
            normalized: r.normalized,
            weight: factor.weight,
            contribution: Math.round(factor.weight * r.normalized * 1000) / 10,
          }
        : null
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  return (
    <>
      <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
        <Descriptions.Item label="告警名称" span={2}>
          {alert.title}（{alert.contract}）
        </Descriptions.Item>
        <Descriptions.Item label="公式版本">{version.version}</Descriptions.Item>
        <Descriptions.Item label="触发时间">{alert.triggeredAt}</Descriptions.Item>
        <Descriptions.Item label="总得分">
          <Text strong>{alert.score.toFixed(1)} 分</Text>
        </Descriptions.Item>
        <Descriptions.Item label="映射定级">
          <Tag color={severityMeta[alert.formulaLevel].color}>{severityMeta[alert.formulaLevel].label}</Tag>
        </Descriptions.Item>
      </Descriptions>
      <Table
        size="small"
        bordered
        rowKey="key"
        pagination={false}
        columns={[
          { title: '因子', dataIndex: 'factor', width: 190 },
          { title: '原始值', dataIndex: 'raw', width: 90 },
          {
            title: '归一化得分',
            dataIndex: 'normalized',
            width: 100,
            render: (v: number) => v.toFixed(2),
          },
          { title: '权重', dataIndex: 'weight', width: 80, render: (v: number) => v.toFixed(2) },
          {
            title: '加权贡献（分）',
            dataIndex: 'contribution',
            width: 120,
            render: (v: number) => <Text strong>{v.toFixed(1)}</Text>,
          },
        ]}
        dataSource={rows}
      />
      <Alert
        type="info"
        showIcon
        style={{ marginTop: 16 }}
        message="定级阈值"
        description={version.thresholds
          .map((t) => `${t.level}：Score ≥ ${t.min}`)
          .join('　|　')}
      />
    </>
  )
}

function nextLowerLevel(level: SeverityLevel): SeverityLevel {
  const order: SeverityLevel[] = ['P0', 'P1', 'P2', 'P3']
  const idx = order.indexOf(level)
  return order[Math.min(idx + 1, order.length - 1)]
}

function nowString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
