import { Button, Checkbox, Form, Input, InputNumber, Modal, Select, Table, Tag, Radio, message } from 'antd'
import { useState } from 'react'
import { EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { PageFrame } from '../components/PageFrame'
import { QueryResetButtons } from '../components/QueryResetButtons'
import { marketSourceRecords } from '../mock/data'

export function MarketSourcePage() {
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [editing, setEditing] = useState(false)
  const openEditor = (record?: (typeof marketSourceRecords)[number]) => {
    editForm.setFieldsValue({
      marketName: record?.marketName ?? '', displayName: record?.displayName ?? '',
      observation: record?.observationSeconds ?? 120, reenable: record?.reenableSeconds ?? 120,
      enabled: record?.enabled ?? true, spreadMonitor: record?.spreadMonitor === '是',
      marketUrl: record?.marketName === 'BINANCE' ? 'wss://stream.binance.com:9443/ws' : '',
      tradeUrl: record?.marketName === 'BINANCE' ? 'https://api.binance.com/api/v3/klines' : '',
      premiumLong: record?.marketName === 'BINANCE' ? 'https://fapi.binance.com/fapi/v1/premiumIndex?symbol=' : '',
      premiumShort: record?.marketName === 'BINANCE' ? 'https://dapi.binance.com/dapi/v1/premiumIndex?symbol=' : '',
      useApi: record?.marketName === 'BINANCE',
      spotUrl: record?.marketName === 'BINANCE' ? 'https://fapi.binance.com/fapi/v1/klines' : '',
      indexUrl: record?.marketName === 'BINANCE' ? 'https://fapi.binance.com/fapi/v1/indexPriceKlines' : '',
      fairUrl: record?.marketName === 'BINANCE' ? 'https://fapi.binance.com/fapi/v1/markPriceKlines' : '',
      description: record?.description ?? ''
    })
    setEditing(true)
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
      render: (enabled: boolean) => (enabled ? <Tag color="success">启用</Tag> : <Tag>禁用</Tag>),
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
      render: (_: unknown, record: (typeof marketSourceRecords)[number]) => <Button type="primary" size="small" onClick={() => openEditor(record)}>编辑</Button>,
    },
  ]

  return (
    <PageFrame
      title="行情源"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>添加</Button>
      }
    >
      <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item label="市场名称" name="marketName">
          <Input placeholder="请输入" style={{ width: 160 }} />
        </Form.Item>
        <Form.Item label="显示名称" name="displayName">
          <Input placeholder="请输入" style={{ width: 160 }} />
        </Form.Item>
        <Form.Item label="状态" name="status">
          <Select placeholder="请选择" allowClear style={{ width: 120 }} />
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
        pagination={{ total: 17, showTotal: (t) => `共 ${t} 条`, pageSize: 10, showSizeChanger: true }}
      />
      <Modal title="修改指数市场" open={editing} width={660} onCancel={() => setEditing(false)} okText="确定"
        onOk={async () => {try {await editForm.validateFields();message.success('演示参数已校验（未连接生产后台）');setEditing(false)}catch{message.error('请检查输入')}}}>
        <Form form={editForm} layout="vertical">
          <Form.Item name="marketName" label="市场名称" rules={[{required:true}]}><Input /></Form.Item>
          <Form.Item name="displayName" label="显示名称" rules={[{required:true}]}><Input /></Form.Item>
          <Form.Item name="observation" label="进入观察期（秒）" rules={[{required:true}]}><InputNumber min={0} /></Form.Item>
          <Form.Item name="reenable" label="重新启用（秒）" rules={[{required:true}]}><InputNumber min={0} /></Form.Item>
          <Form.Item name="enabled" label="是否启用"><Radio.Group options={[{label:'启用',value:true},{label:'禁用',value:false}]} /></Form.Item>
          <Form.Item name="marketUrl" label="市场地址"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="tradeUrl" label="交易量 URL"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="premiumLong" label="正向资金费率 URL"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="premiumShort" label="反向资金费率 URL"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="useApi" label="是否需要设置价差监控" valuePropName="checked"><Checkbox /></Form.Item>
          <Form.Item name="spotUrl" label="获取最新价 URL"><Input /></Form.Item>
          <Form.Item name="indexUrl" label="获取指数价 URL"><Input /></Form.Item>
          <Form.Item name="fairUrl" label="获取合理价 URL"><Input /></Form.Item>
          <Form.Item name="description" label="描述信息"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </PageFrame>
  )
}
