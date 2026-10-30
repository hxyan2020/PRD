import { Button, Checkbox, Form, InputNumber, Modal, Select, Space, Switch, Table, message } from 'antd'
import { useState } from 'react'
import { CloseOutlined, DownloadOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { PageFrame } from '../components/PageFrame'
import { QueryResetButtons } from '../components/QueryResetButtons'
import { fundingRateRecords } from '../mock/data'

export function FundingRatePage() {
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [editing, setEditing] = useState(false)
  const openEditor = (record?: (typeof fundingRateRecords)[number]) => {
    editForm.setFieldsValue({
      contract: record?.contract ?? 'XAU_USD永续', period: record?.periodHours ?? 4,
      first: record?.firstCollectHour ?? 20,
      upper: parseFloat(record?.upperLimit ?? '0.5'), lower: parseFloat(record?.lowerLimit ?? '-0.5'),
      precision: parseInt(record?.ratePrecision ?? '6',10), oldRate: parseFloat(record?.oldAlgoRate ?? '0'),
      newRate: parseFloat(record?.newAlgoRate ?? '0.005'), margin: parseFloat(record?.marginImpact ?? '200'),
      useNew: true, autoAdjust: record?.autoAdjust ?? false, enabled: record?.enabled ?? true,
      notifyMinutes: undefined
    })
    setEditing(true)
  }

  const columns = [
    { title: '对应合约', dataIndex: 'contract', width: 120, fixed: 'left' as const },
    { title: '合约展示名称', dataIndex: 'displayName', width: 120 },
    { title: '费率收取周期(小时)', dataIndex: 'periodHours', width: 140 },
    { title: '首次收取时间(小时)', dataIndex: 'firstCollectHour', width: 140 },
    { title: '费率浮动上限', dataIndex: 'upperLimit', width: 110 },
    { title: '费率浮动下限', dataIndex: 'lowerLimit', width: 110 },
    { title: '保证金影响额', dataIndex: 'marginImpact', width: 120 },
    {
      title: '自动调整资金费率',
      dataIndex: 'autoAdjust',
      width: 140,
      render: (v: boolean) => (v ? '是' : <CloseOutlined style={{ color: '#ff4d4f' }} />),
    },
    { title: '行情源', dataIndex: 'marketSource', width: 100 },
    { title: '资金费自动调整系数区间', dataIndex: 'adjustFactorRange', width: 180 },
    { title: '费率精度', dataIndex: 'ratePrecision', width: 120 },
    { title: '老算法利率', dataIndex: 'oldAlgoRate', width: 100 },
    { title: '新算法利率', dataIndex: 'newAlgoRate', width: 110 },
    { title: '结算费率', dataIndex: 'settlementRate', width: 90 },
    {
      title: '是否启用',
      dataIndex: 'enabled',
      width: 90,
      render: (enabled: boolean) => <Checkbox checked={enabled} />,
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
      render: (_: unknown, record: (typeof fundingRateRecords)[number]) => <Button type="primary" size="small" onClick={() => openEditor(record)}>编辑</Button>,
    },
  ]

  return (
    <PageFrame
      extra={
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>增加</Button>
          <Button type="primary" icon={<DownloadOutlined />}>
            下载
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item label="合约名称" name="contract">
          <Select placeholder="请选择合约名称" allowClear style={{ width: 180 }} />
        </Form.Item>
        <Form.Item label="状态" name="status">
          <Select placeholder="请选择状态" allowClear style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label="行情源" name="source">
          <Select placeholder="请选择行情源" allowClear style={{ width: 160 }} />
        </Form.Item>
        <Form.Item>
          <QueryResetButtons onReset={() => form.resetFields()} />
        </Form.Item>
      </Form>
      <Table
        rowKey="contract"
        size="small"
        bordered
        scroll={{ x: 2400 }}
        columns={columns}
        dataSource={fundingRateRecords}
        pagination={{ total: 2, showTotal: (t) => `共 ${t} 条`, pageSize: 10, showSizeChanger: true }}
      />
      <Modal title="修改资金费率" open={editing} width={760} onCancel={() => setEditing(false)} okText="确定"
        onOk={async () => {try {await editForm.validateFields();message.success('演示参数已校验（未连接生产后台）');setEditing(false)}catch{message.error('请检查输入')}}}>
        <Form form={editForm} layout="vertical">
          <Form.Item name="contract" label="对应合约" rules={[{required:true}]}><Select options={[{value:'BTC_USD永续'},{value:'XAU_USD永续'}]} /></Form.Item>
          <Space wrap>
            <Form.Item name="period" label="费率收取周期（小时）" rules={[{required:true}]}><Select style={{width:130}} options={[1,2,3,4,6,8,12,24].map(value=>({value}))} /></Form.Item>
            <Form.Item name="first" label="首次收取时间（小时）" rules={[{required:true}]}><InputNumber min={0} max={24} /></Form.Item>
            <Form.Item name="notifyMinutes" label="距离新周期启用时间（分钟）"><InputNumber min={0} /></Form.Item>
          </Space>
          <Space wrap>
            <Form.Item name="lower" label="费率浮动下限" rules={[{required:true}]}><InputNumber addonAfter="%" /></Form.Item>
            <Form.Item name="upper" label="费率浮动上限" rules={[{required:true}]}><InputNumber addonAfter="%" /></Form.Item>
            <Form.Item name="precision" label="费率精度" rules={[{required:true}]}><InputNumber min={0} max={12} /></Form.Item>
          </Space>
          <Space wrap>
            <Form.Item name="oldRate" label="老算法利率"><InputNumber addonAfter="%" /></Form.Item>
            <Form.Item name="newRate" label="新算法利率"><InputNumber addonAfter="%" /></Form.Item>
            <Form.Item name="margin" label="保证金影响额"><InputNumber min={0} addonAfter="USDT" /></Form.Item>
          </Space>
          <Form.Item name="useNew" label="采用新算法资金费率" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item name="autoAdjust" label="是否开启自动调整资金费率" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item name="enabled" label="是否启用" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>
    </PageFrame>
  )
}
