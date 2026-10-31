import { useState } from 'react'
import { Button, Form, Input, Modal, Select, Table, Tag, message } from 'antd'
import { PageFrame } from '../components/PageFrame'
import { BilingualText } from '../components/BilingualText'
import { useLocale } from '../i18n/LocaleContext'

type Alert = { key: string; type: string; value: string; updated: string; operator: string; enabled: boolean }
const initial: Alert[] = [
  ['注资通知', '事件触发'],
  ['回拨通知', '事件触发'],
  ['DB心跳预警', '事件触发'],
  ['注资金额上限预警', '事件触发'],
  ['DB长时间持仓预警', '持仓时间 > 10 mins'],
  ['DB长时间持仓预警', '持仓时间 > 5 mins'],
  ['DB大额持仓预警', '当前持仓仓位价值 > 500,000 USD'],
  ['DB大额持仓预警', '当前持仓仓位价值 > 300,000 USD'],
].map(([type, value], i) => ({
  key: String(i + 1),
  type,
  value,
  updated: '2026-09-22 15:25:39',
  operator: 'DEMO',
  enabled: true,
}))
const types = [
  'DB资金一级预警',
  'DB资金二级预警',
  'DB账户权益预警',
  'DB大额持仓预警',
  'DB长时间持仓预警',
  '注资金额上限预警',
  'DB心跳预警',
  '回拨通知',
  '注资通知',
]

function Metric({ name, value }: { name: string; value: string }) {
  return (
    <div className="db-metric">
      <span className="db-metric__label">
        <BilingualText name={name} />
      </span>
      <span className="db-metric__value">{value}</span>
    </div>
  )
}

export function DbAccountAlertPage() {
  const { label, lang } = useLocale()
  const en = lang === 'en'
  const [rows, setRows] = useState(initial)
  const [filter, setFilter] = useState<string | undefined>()
  const [editing, setEditing] = useState<Alert | null>(null)
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()
  const save = async () => {
    try {
      const v = await form.validateFields()
      const row: Alert = {
        key: editing?.key ?? String(Date.now()),
        type: v.type,
        value: v.value || '事件触发',
        updated: '演示数据',
        operator: 'DEMO',
        enabled: editing?.enabled ?? true,
      }
      setRows((old) => (editing ? old.map((x) => (x.key === editing.key ? row : x)) : [...old, row]))
      setOpen(false)
      message.info('Demo only — does not change production / 仅演示，不改生产')
    } catch {
      /* validation */
    }
  }
  return (
    <PageFrame title={label('DB账户告警')}>
      <div className="db-alert-toolbar">
        <Select
          allowClear
          placeholder={`${label('告警类型')}: ${en ? 'All' : lang === 'both' ? 'All / 全部' : '全部'}`}
          className="db-alert-toolbar__select"
          value={filter}
          onChange={setFilter}
          options={types.map((x) => ({ label: label(x), value: x }))}
        />
        <Button onClick={() => setFilter(undefined)}>
          {en ? 'Reset' : lang === 'both' ? 'Reset / 重置' : '重置'}
        </Button>
        <Button
          type="primary"
          className="db-alert-toolbar__add"
          onClick={() => {
            setEditing(null)
            form.resetFields()
            setOpen(true)
          }}
        >
          ＋ {en ? 'Add monitor' : lang === 'both' ? 'Add / 增加监控' : '增加监控'}
        </Button>
      </div>
      <div className="admin-table-scroll">
      <Table
        size="small"
        rowKey="key"
        scroll={{ x: true }}
        dataSource={rows.filter((x) => !filter || x.type === filter)}
        pagination={{ pageSize: 20, simple: true }}
        columns={[
          {
            title: <BilingualText name="告警类型" />,
            dataIndex: 'type',
            render: (v: string) => label(v),
          },
          { title: <BilingualText name="告警值" />, dataIndex: 'value' },
          { title: <BilingualText name="更新时间" />, dataIndex: 'updated' },
          { title: <BilingualText name="更新人" />, dataIndex: 'operator' },
          {
            title: <BilingualText name="状态" />,
            render: (_: unknown, r: Alert) =>
              r.enabled ? (
                <Tag color="success">{en ? 'Active' : lang === 'both' ? 'Active / 生效中' : '生效中'}</Tag>
              ) : (
                <Tag>{en ? 'Disabled' : lang === 'both' ? 'Disabled / 已停用' : '已停用'}</Tag>
              ),
          },
          {
            title: <BilingualText name="操作" />,
            render: (_: unknown, r: Alert) => (
              <>
                <Button
                  type="link"
                  onClick={() =>
                    setRows((old) => old.map((x) => (x.key === r.key ? { ...x, enabled: !x.enabled } : x)))
                  }
                >
                  {r.enabled
                    ? en
                      ? 'Disable'
                      : lang === 'both'
                        ? 'Disable / 停用'
                        : '停用'
                    : en
                      ? 'Enable'
                      : lang === 'both'
                        ? 'Enable / 启用'
                        : '启用'}
                </Button>
                <Button
                  type="link"
                  onClick={() => {
                    setEditing(r)
                    form.setFieldsValue(r)
                    setOpen(true)
                  }}
                >
                  {en ? 'Edit' : lang === 'both' ? 'Edit / 编辑' : '编辑'}
                </Button>
              </>
            ),
          },
        ]}
      />
      </div>
      <Modal
        title={
          editing
            ? en
              ? 'Edit — monitor'
              : lang === 'both'
                ? 'Edit / 编辑 — monitor'
                : '编辑 — 监控配置'
            : en
              ? 'Add — monitor'
              : lang === 'both'
                ? 'Add / 新增 — monitor'
                : '新增 — 监控配置'
        }
        open={open}
        onCancel={() => setOpen(false)}
        onOk={save}
        okText={en ? 'OK' : '确定'}
        styles={{ body: { maxHeight: '70vh', overflow: 'auto' } }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="type" label={<BilingualText name="告警类型" />} rules={[{ required: true }]}>
            <Select options={types.map((x) => ({ label: label(x), value: x }))} />
          </Form.Item>
          <Form.Item name="value" label={<BilingualText name="告警值" />}>
            <Input placeholder="事件触发 / 持仓时间 > 5 mins" />
          </Form.Item>
          <Form.Item name="group" label={<BilingualText name="预警群" />} rules={[{ required: true }]}>
            <Input.TextArea placeholder="Lark bot webhook URL(s), comma-separated" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </PageFrame>
  )
}

export function DbTakeoverAccountPage() {
  const { label, lang } = useLocale()
  const columns = [
    '合约名称',
    '持仓方向',
    '持仓均价',
    '持仓仓位价值 (USD)',
    '占用保证金 (USD)',
    '未实现盈亏 (USD)',
  ]
  return (
    <PageFrame title={label('DB接仓账户管理')}>
      <div className="db-metric-grid">
        <Metric name="账户ID" value="100000002" />
        <Metric name="钱包余额" value="200560.26 USD" />
        <Metric name="最大可转金额" value="200560.26 USD" />
        <Metric name="自动注资水位线" value="40000 USD" />
        <Metric name="注资目标水位线" value="200000 USD" />
        <Metric name="总占用保证金" value="0 USD" />
        <Metric name="持仓总额" value="0 USD" />
        <Metric name="总未实现盈亏" value="0 USD" />
        <Metric name="账户权益" value="200560.26 USD" />
      </div>
      <div className="admin-table-scroll">
        <Table
          rowKey="contract"
          size="small"
          dataSource={[]}
          scroll={{ x: true }}
          locale={{
            emptyText: lang === 'en' ? 'No data' : lang === 'both' ? 'No data / 暂无数据' : '暂无数据',
          }}
          columns={columns.map((title) => ({
            title: <BilingualText name={title} />,
            dataIndex: title,
          }))}
        />
      </div>
    </PageFrame>
  )
}

export function DbTakeoverFundRecordPage() {
  const { label } = useLocale()
  const data = [
    { key: '21654551', type: '自动减仓', amount: '+8.67111' },
    { key: '21654532', type: '自动减仓', amount: '+0.03044' },
    { key: '21654499', type: '资金费用', amount: '+0.000200917' },
  ]
  return (
    <PageFrame title={label('DB接仓账户资金流水')}>
      <div className="admin-table-scroll">
        <Table
          rowKey="key"
          size="small"
          dataSource={data}
          scroll={{ x: true }}
          columns={[
            { title: <BilingualText name="账户ID" />, render: () => '100000002' },
            { title: <BilingualText name="流水ID" />, dataIndex: 'key' },
            {
              title: <BilingualText name="流水类型" />,
              dataIndex: 'type',
              render: (v: string) => label(v),
            },
            { title: <BilingualText name="金额 (USD)" />, dataIndex: 'amount' },
            { title: <BilingualText name="更新时间" />, render: () => '2026-10-26' },
          ]}
        />
      </div>
    </PageFrame>
  )
}
