import { Alert, Card, Col, Descriptions, Progress, Row, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { PageFrame } from '../../components/PageFrame'
import {
  formulaExpression,
  getActiveVersion,
  getVersions,
  severityMeta,
  type Factor,
  type FormulaVersion,
} from '../../mock/severityData'

const { Text } = Typography

export function SeverityFormulaPage() {
  const active = getActiveVersion()
  const versions = getVersions()

  const factorColumns: TableProps<Factor>['columns'] = [
    { title: '因子', dataIndex: 'code', width: 70, render: (c: string) => <Tag>{c}</Tag> },
    { title: '名称', dataIndex: 'name', width: 180 },
    { title: '说明', dataIndex: 'desc' },
    { title: '数据来源', dataIndex: 'source', width: 170, render: (s: string) => <Text code>{s}</Text> },
    {
      title: '权重',
      dataIndex: 'weight',
      width: 160,
      render: (w: number) => (
        <Progress
          percent={Math.round(w * 100)}
          size="small"
          format={(p) => `${((p ?? 0) / 100).toFixed(2)}`}
        />
      ),
    },
    {
      title: '近30天区分度',
      dataIndex: 'discrimination',
      width: 130,
      render: (d: number) => (
        <Text type={d < 0.4 ? 'danger' : d < 0.6 ? 'warning' : undefined}>{d.toFixed(2)}</Text>
      ),
    },
  ]

  const versionColumns: TableProps<FormulaVersion>['columns'] = [
    {
      title: '版本',
      dataIndex: 'version',
      width: 90,
      render: (v: string, record) => (
        <Text strong={record.status === '生效中'}>{v}</Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (s: FormulaVersion['status']) => (
        <Tag color={s === '生效中' ? 'green' : s === '草案' ? 'blue' : undefined}>{s}</Tag>
      ),
    },
    { title: '生效时间', dataIndex: 'effectiveAt', width: 160 },
    { title: '批准人（RO）', dataIndex: 'approvedBy', width: 150 },
    {
      title: '来源',
      dataIndex: 'origin',
      width: 220,
      render: (o: string) => (o.includes('AI 周推荐') ? <Tag color="purple">{o}</Tag> : <Tag>{o}</Tag>),
    },
    { title: '变更摘要', dataIndex: 'changeSummary' },
  ]

  return (
    <PageFrame title="严重度计算公式（Severity Formula）">
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={`当前生效版本 ${active.version} · 由 ${active.approvedBy} 批准 · 来源：${active.origin}`}
        description={
          <>
            <Text code>{formulaExpression}</Text>
            <div style={{ marginTop: 4 }}>
              权重由 AI 每周根据值班反馈聚合推荐、RO 审批后更新；区分度过低（&lt;0.40）的因子会被 AI 建议移除。
            </div>
          </>
        }
      />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={16}>
          <Card size="small" title={`因子与权重（${active.version}，权重合计 ${active.factors.reduce((s, f) => s + f.weight, 0).toFixed(2)}）`}>
            <Table
              size="small"
              bordered
              rowKey="code"
              pagination={false}
              columns={factorColumns}
              dataSource={active.factors}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" title="评分 → P0–P3 定级阈值">
            <Descriptions size="small" column={1} bordered>
              {active.thresholds.map((t) => (
                <Descriptions.Item
                  key={t.level}
                  label={<Tag color={severityMeta[t.level].color}>{severityMeta[t.level].label}</Tag>}
                >
                  Score ≥ {t.min}
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {severityMeta[t.level].response}
                    </Text>
                  </div>
                </Descriptions.Item>
              ))}
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Card size="small" title="公式版本历史（每次变更均需 RO 审批）">
        <Table
          size="small"
          bordered
          rowKey="version"
          pagination={false}
          columns={versionColumns}
          dataSource={versions}
        />
      </Card>
    </PageFrame>
  )
}
