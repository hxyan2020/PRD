import { useState } from 'react'
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Input,
  Modal,
  Popconfirm,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  RobotOutlined,
} from '@ant-design/icons'
import type { TableProps } from 'antd'
import { PageFrame } from '../../components/PageFrame'
import {
  approveRecommendation,
  getRecommendations,
  rejectRecommendation,
  severityMeta,
  type FormulaChange,
  type WeeklyRecommendation,
} from '../../mock/severityData'

const { Text, Paragraph } = Typography

const RO_NAME = 'RO Haixiang Yan'

const statusColor: Record<WeeklyRecommendation['status'], string> = {
  待RO审批: 'red',
  已批准生效: 'green',
  已驳回: 'default',
}

const changeKindColor: Record<FormulaChange['kind'], string> = {
  新增因子: 'green',
  移除因子: 'red',
  调整权重: 'blue',
  调整阈值: 'purple',
}

export function SeverityRecommendationPage() {
  const { message } = App.useApp()
  const [, forceRender] = useState(0)
  const [detailRec, setDetailRec] = useState<WeeklyRecommendation | null>(null)
  const [rejectRec, setRejectRec] = useState<WeeklyRecommendation | null>(null)
  const [rejectNote, setRejectNote] = useState('')

  const recommendations = getRecommendations()
  const pendingCount = recommendations.filter((r) => r.status === '待RO审批').length

  const doApprove = (rec: WeeklyRecommendation) => {
    approveRecommendation(rec.id, RO_NAME, '模拟一致率提升显著，批准发布。')
    forceRender((n) => n + 1)
    setDetailRec(null)
    message.success(`已批准 ${rec.id}：新公式 ${rec.proposedVersion} 立即生效（见 Severity Formula 页）`)
  }

  const doReject = () => {
    if (!rejectRec) return
    if (!rejectNote.trim()) {
      message.warning('请填写驳回原因')
      return
    }
    rejectRecommendation(rejectRec.id, RO_NAME, rejectNote.trim())
    setRejectRec(null)
    setRejectNote('')
    setDetailRec(null)
    forceRender((n) => n + 1)
    message.success('已驳回，AI 将在下周合并更多反馈后重新推荐')
  }

  const columns: TableProps<WeeklyRecommendation>['columns'] = [
    { title: '推荐ID', dataIndex: 'id', width: 140, fixed: 'left' },
    { title: '周期', dataIndex: 'week', width: 210 },
    { title: '生成时间', dataIndex: 'generatedAt', width: 160 },
    {
      title: '版本变更',
      key: 'version',
      width: 140,
      render: (_, r) => (
        <Text>
          {r.baseVersion} → <Text strong>{r.proposedVersion}</Text>
        </Text>
      ),
    },
    { title: '聚合反馈', dataIndex: 'feedbackCount', width: 90, render: (n: number) => `${n} 条` },
    {
      title: '反馈簇',
      key: 'clusters',
      width: 90,
      render: (_, r) => `${r.clusters.length} 个`,
    },
    {
      title: '变更条数',
      key: 'changes',
      width: 90,
      render: (_, r) => `${r.changes.length} 项`,
    },
    {
      title: '一致率（模拟）',
      key: 'agreement',
      width: 140,
      render: (_, r) => (
        <Text>
          {r.simulation.agreementBefore}% →{' '}
          <Text strong type={r.simulation.agreementAfter > r.simulation.agreementBefore ? 'success' : 'danger'}>
            {r.simulation.agreementAfter}%
          </Text>
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (s: WeeklyRecommendation['status']) => <Tag color={statusColor[s]}>{s}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 230,
      fixed: 'right',
      render: (_, rec) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setDetailRec(rec)}>
            详情
          </Button>
          {rec.status === '待RO审批' && (
            <>
              <Popconfirm
                title={`批准 ${rec.id}？`}
                description={`新公式 ${rec.proposedVersion} 将立即生效`}
                okText="确认批准"
                cancelText="取消"
                onConfirm={() => doApprove(rec)}
              >
                <Button size="small" type="primary" icon={<CheckCircleOutlined />}>
                  批准
                </Button>
              </Popconfirm>
              <Button
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => setRejectRec(rec)}
              >
                驳回
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <PageFrame title="AI 每周公式推荐与 RO 审批">
      <Alert
        type={pendingCount > 0 ? 'warning' : 'success'}
        showIcon
        style={{ marginBottom: 16 }}
        message={
          pendingCount > 0
            ? `有 ${pendingCount} 份 AI 周推荐等待 RO 审批`
            : '当前无待审批推荐'
        }
        description="AI 每周一 06:00 聚合上周值班对定级不准告警的原因反馈，按相似告警聚簇后生成新的严重度计算公式建议（新增/移除因子、调整各因子权重、调整定级阈值），并给出历史告警重算的影响模拟。只有 RO 批准后新公式才会生效。"
      />

      <Table
        size="small"
        bordered
        rowKey="id"
        columns={columns}
        dataSource={recommendations}
        scroll={{ x: 1500 }}
        pagination={false}
      />

      <Drawer
        title={
          <Space>
            <RobotOutlined />
            {detailRec?.id} · {detailRec?.baseVersion} → {detailRec?.proposedVersion}
          </Space>
        }
        width={860}
        open={!!detailRec}
        onClose={() => setDetailRec(null)}
        extra={
          detailRec?.status === '待RO审批' ? (
            <Space>
              <Popconfirm
                title={`批准 ${detailRec.id}？`}
                description={`新公式 ${detailRec.proposedVersion} 将立即生效`}
                okText="确认批准"
                cancelText="取消"
                onConfirm={() => doApprove(detailRec)}
              >
                <Button type="primary" icon={<CheckCircleOutlined />}>
                  批准生效
                </Button>
              </Popconfirm>
              <Button danger icon={<CloseCircleOutlined />} onClick={() => setRejectRec(detailRec)}>
                驳回
              </Button>
            </Space>
          ) : detailRec ? (
            <Tag color={statusColor[detailRec.status]}>{detailRec.status}</Tag>
          ) : null
        }
      >
        {detailRec && <RecommendationDetail rec={detailRec} />}
      </Drawer>

      <Modal
        title={`驳回 ${rejectRec?.id}`}
        open={!!rejectRec}
        onOk={doReject}
        onCancel={() => {
          setRejectRec(null)
          setRejectNote('')
        }}
        okText="确认驳回"
        okButtonProps={{ danger: true }}
        cancelText="取消"
      >
        <Paragraph type="secondary">
          驳回后本周推荐不会生效，相关反馈将与下周反馈合并后重新聚合推荐。
        </Paragraph>
        <Input.TextArea
          rows={3}
          placeholder="请填写驳回原因（必填），例如：样本量不足 / 因子为监管必需维度不可移除"
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
        />
      </Modal>
    </PageFrame>
  )
}

function RecommendationDetail({ rec }: { rec: WeeklyRecommendation }) {
  return (
    <>
      <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
        <Descriptions.Item label="周期" span={2}>
          {rec.week}
        </Descriptions.Item>
        <Descriptions.Item label="生成时间">{rec.generatedAt}</Descriptions.Item>
        <Descriptions.Item label="聚合反馈">{rec.feedbackCount} 条</Descriptions.Item>
        {rec.reviewedBy && (
          <>
            <Descriptions.Item label="审批人">{rec.reviewedBy}</Descriptions.Item>
            <Descriptions.Item label="审批时间">{rec.reviewedAt}</Descriptions.Item>
            <Descriptions.Item label="审批意见" span={2}>
              {rec.reviewNote}
            </Descriptions.Item>
          </>
        )}
      </Descriptions>

      <Card size="small" title="① 相似告警反馈聚簇（AI 聚合依据）" style={{ marginBottom: 16 }}>
        <Table
          size="small"
          bordered
          rowKey="id"
          pagination={false}
          columns={[
            { title: '簇', dataIndex: 'id', width: 70, render: (c: string) => <Tag color="purple">{c}</Tag> },
            { title: '共性问题', dataIndex: 'name', width: 240 },
            { title: '相似告警', dataIndex: 'alertCount', width: 90, render: (n: number) => `${n} 条` },
            { title: '反馈数', dataIndex: 'feedbackCount', width: 80, render: (n: number) => `${n} 条` },
            {
              title: '高频勾选原因',
              dataIndex: 'topReasons',
              render: (reasons: string[]) => (
                <Space size={[4, 4]} wrap>
                  {reasons.map((r) => (
                    <Tag key={r} color="orange" style={{ marginInlineEnd: 0 }}>
                      {r}
                    </Tag>
                  ))}
                </Space>
              ),
            },
          ]}
          dataSource={rec.clusters}
        />
      </Card>

      <Card size="small" title="② 公式变更建议（增删因子 / 调整权重 / 调整阈值）" style={{ marginBottom: 16 }}>
        <Table
          size="small"
          bordered
          rowKey={(r) => `${r.kind}-${r.target}`}
          pagination={false}
          columns={[
            {
              title: '类型',
              dataIndex: 'kind',
              width: 95,
              render: (k: FormulaChange['kind']) => <Tag color={changeKindColor[k]}>{k}</Tag>,
            },
            { title: '对象', dataIndex: 'target', width: 180 },
            { title: '当前', dataIndex: 'before', width: 110 },
            { title: '建议', dataIndex: 'after', width: 220 },
            { title: 'AI 依据', dataIndex: 'rationale' },
          ]}
          dataSource={rec.changes}
        />
      </Card>

      <Card size="small" title="③ 影响模拟（历史告警按新公式重算）">
        <Row gutter={16} style={{ marginBottom: 12 }}>
          <Col span={8}>
            <Statistic title="重算样本" value={rec.simulation.sampleSize} suffix="条告警（近4周）" />
          </Col>
          <Col span={8}>
            <Statistic title="当前与值班反馈一致率" value={rec.simulation.agreementBefore} suffix="%" />
          </Col>
          <Col span={8}>
            <Statistic
              title="新公式一致率（预估）"
              value={rec.simulation.agreementAfter}
              suffix="%"
              valueStyle={{
                color:
                  rec.simulation.agreementAfter > rec.simulation.agreementBefore ? '#3f8600' : '#cf1322',
              }}
            />
          </Col>
        </Row>
        <Space size={[8, 8]} wrap>
          {rec.simulation.shifts.map((s) => (
            <Tag key={`${s.from}-${s.to}`} style={{ padding: '4px 10px' }}>
              <Tag color={severityMeta[s.from].color} style={{ marginInlineEnd: 4 }}>
                {s.from}
              </Tag>
              →
              <Tag color={severityMeta[s.to].color} style={{ marginInlineStart: 4, marginInlineEnd: 4 }}>
                {s.to}
              </Tag>
              {s.count} 条
            </Tag>
          ))}
        </Space>
      </Card>
    </>
  )
}
