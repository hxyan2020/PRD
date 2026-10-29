import { useState } from 'react'
import {
  Button,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Switch,
  Table,
  message,
} from 'antd'
import { EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { PageFrame } from '../components/PageFrame'
import { QueryResetButtons } from '../components/QueryResetButtons'
import { marketSourceRecords, type MarketSourceRecord } from '../mock/data'
import { marketSourceDetails } from '../mock/marketSourceDetails'
import { fh } from '../components/FieldHelpLabel'

export function MarketSourcePage() {
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<MarketSourceRecord | null>(null)

  const openEdit = (record: MarketSourceRecord) => {
    const detail = marketSourceDetails[record.marketName]
    setEditing(record)
    editForm.setFieldsValue({
      marketName: record.marketName,
      displayName: record.displayName,
      observationSeconds: record.observationSeconds,
      reenableSeconds: record.reenableSeconds,
      enabled: record.enabled,
      spreadMonitor: record.spreadMonitor === '是',
      marketUrl: detail?.marketUrl ?? '',
      volumeUrl: detail?.volumeUrl ?? '',
      forwardFundingUrl: detail?.forwardFundingUrl ?? '',
      inverseFundingUrl: detail?.inverseFundingUrl ?? '',
      latestPriceUrl: detail?.latestPriceUrl ?? '',
      indexPriceUrl: detail?.indexPriceUrl ?? '',
      fairPriceUrl: detail?.fairPriceUrl ?? '',
      description: record.description,
    })
    setOpen(true)
  }

  const columns = [
    { title: '市场名称', dataIndex: 'marketName', width: 140 },
    { title: '显示名称', dataIndex: 'displayName', width: 120 },
    { title: '是否需要设置价差监控', dataIndex: 'spreadMonitor', width: 160 },
    { title: '描述信息', dataIndex: 'description', ellipsis: true },
    { title: '进入观察期 (秒)', dataIndex: 'observationSeconds', width: 130 },
    { title: '重新启用 (秒)', dataIndex: 'reenableSeconds', width: 120 },
    {
      title: '是否启用',
      dataIndex: 'enabled',
      width: 100,
      render: (enabled: boolean) => <Switch checked={enabled} size="small" />,
    },
    {
      title: '操作记录',
      key: 'record',
      width: 100,
      render: () => (
        <Button type="link" size="small" icon={<EyeOutlined />}>
          查看
        </Button>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: MarketSourceRecord) => (
        <Button type="primary" size="small" onClick={() => openEdit(record)}>
          编辑
        </Button>
      ),
    },
  ]

  return (
    <PageFrame
      title="行情源"
      extra={
        <Button type="primary" icon={<PlusOutlined />}>
          增加
        </Button>
      }
    >
      <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item label="市场名称" name="marketName">
          <Input placeholder="请输入" style={{ width: 160 }} />
        </Form.Item>
        <Form.Item label="显示名称" name="displayName">
          <Input placeholder="请输入" style={{ width: 160 }} />
        </Form.Item>
        <Form.Item label={fh('状态')} name="status">
          <Select
            placeholder="请选择"
            allowClear
            style={{ width: 120 }}
            options={[
              { value: 'on', label: '启用' },
              { value: 'off', label: '禁用' },
            ]}
          />
        </Form.Item>
        <Form.Item>
          <QueryResetButtons onReset={() => form.resetFields()} />
        </Form.Item>
      </Form>
      <Table
        rowKey="marketName"
        size="small"
        bordered
        columns={columns}
        dataSource={marketSourceRecords}
        pagination={{
          total: marketSourceRecords.length,
          showTotal: (t) => `共 ${t} 条`,
          pageSize: 10,
          showSizeChanger: true,
        }}
      />

      <Modal
        title="修改指数市场"
        open={open}
        onCancel={() => setOpen(false)}
        width={720}
        destroyOnHidden
        footer={[
          <Button key="cancel" onClick={() => setOpen(false)}>
            取消
          </Button>,
          <Button
            key="ok"
            type="primary"
            onClick={() => {
              message.success(`已保存行情源 ${editing?.marketName ?? ''}`)
              setOpen(false)
            }}
          >
            确定
          </Button>,
        ]}
      >
        <Form form={editForm} layout="vertical" style={{ maxHeight: '70vh', overflow: 'auto', paddingRight: 8 }}>
          <Form.Item label="市场名称" name="marketName">
            <Input disabled />
          </Form.Item>
          <Form.Item label="显示名称" name="displayName">
            <Input disabled />
          </Form.Item>
          <Form.Item label="进入观察期 (秒)" name="observationSeconds">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item label="重新启用 (秒)" name="reenableSeconds">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item label="是否启用" name="enabled">
            <Radio.Group>
              <Radio value={true}>启用</Radio>
              <Radio value={false}>禁用</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="行情url" name="marketUrl">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="交易量url" name="volumeUrl">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="正向资金费率URL" name="forwardFundingUrl">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="反向资金费率URL" name="inverseFundingUrl">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="spreadMonitor" valuePropName="checked">
            <Checkbox>是否需要设置价差监控</Checkbox>
          </Form.Item>
          <Form.Item label="获取最新价URL" name="latestPriceUrl" required>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="获取指数价URL" name="indexPriceUrl" required>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="获取合理价URL" name="fairPriceUrl" required>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="描述信息" name="description">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </PageFrame>
  )
}
