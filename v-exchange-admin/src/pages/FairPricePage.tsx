import { Button, Form, InputNumber, Modal, Radio, Select, Space, Switch, Table, message } from 'antd'
import { useState } from 'react'
import { DownloadOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { PageFrame } from '../components/PageFrame'
import { QueryResetButtons } from '../components/QueryResetButtons'
import { fairPriceRecords } from '../mock/data'

export function FairPricePage() {
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [editing, setEditing] = useState(false)
  const openEditor = (record?: (typeof fairPriceRecords)[number]) => {
    editForm.setFieldsValue({
      contract: record?.contractName ?? 'XAU_USD永续',
      period: record?.basisMaPeriod ?? 30,
      spread: Number(record?.spreadThreshold.replace('%','') ?? 3),
      observe: record?.observeThreshold ?? 60,
      recover: record?.recoveryThreshold ?? 60,
      enabled: record?.newAlgoStatus === '启用',
      adopt: record?.adoptStatus === '新算法' ? 'new' : 'old'
    })
    setEditing(true)
  }

  const columns = [
    { title: '合约名称', dataIndex: 'contractName', width: 130 },
    { title: '合约展示名称', dataIndex: 'displayName', width: 120 },
    { title: '基差移动平均值周期(秒)', dataIndex: 'basisMaPeriod', width: 180 },
    { title: '期现价差阈值比例', dataIndex: 'spreadThreshold', width: 140 },
    { title: '观察阈值(秒)', dataIndex: 'observeThreshold', width: 110 },
    { title: '恢复阈值(秒)', dataIndex: 'recoveryThreshold', width: 110 },
    {
      title: '近24小时计算记录',
      key: 'calc24',
      width: 150,
      render: () => (
        <Button type="link" size="small">
          查看
        </Button>
      ),
    },
    { title: '新算法计算状态', dataIndex: 'newAlgoStatus', width: 130 },
    { title: '采用状态', dataIndex: 'adoptStatus', width: 100 },
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
      render: (_: unknown, record: (typeof fairPriceRecords)[number]) => <Button type="primary" size="small" onClick={() => openEditor(record)}>编辑</Button>,
    },
  ]

  return (
    <PageFrame
      title="合理价格"
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
          <Select placeholder="请选择" allowClear style={{ width: 160 }} />
        </Form.Item>
        <Form.Item label="新算法计算状态" name="newAlgo" initialValue="all">
          <Select style={{ width: 140 }} options={[{ value: 'all', label: '全部' }]} />
        </Form.Item>
        <Form.Item label="采用状态" name="adopt">
          <Select placeholder="请选择" allowClear style={{ width: 140 }} />
        </Form.Item>
        <Form.Item>
          <QueryResetButtons onReset={() => form.resetFields()} />
        </Form.Item>
      </Form>
      <Table
        rowKey="contractName"
        size="small"
        bordered
        scroll={{ x: 1600 }}
        columns={columns}
        dataSource={fairPriceRecords}
        pagination={{ total: 2, showTotal: (t) => `共 ${t} 条`, pageSize: 10, showSizeChanger: true }}
      />
      <Modal title="编辑合理价格" open={editing} onCancel={() => setEditing(false)} okText="确定" onOk={async () => {try {await editForm.validateFields();message.success('演示参数已校验（未连接生产后台）');setEditing(false)} catch {message.error('请检查输入')}}}>
        <Form form={editForm} layout="vertical">
          <Form.Item name="contract" label="合约名称" rules={[{required:true}]}><Select options={[{value:'XAU_USD永续'},{value:'BTC_USD永续'}]} /></Form.Item>
          <Form.Item name="period" label="基差移动平均值周期(秒)" rules={[{required:true}]}><InputNumber min={1} style={{width:'100%'}} /></Form.Item>
          <Space wrap>
            <Form.Item name="spread" label="期现价差阈值比例" rules={[{required:true}]}><InputNumber min={0} addonAfter="%" /></Form.Item>
            <Form.Item name="observe" label="观察阈值(秒)" rules={[{required:true}]}><InputNumber min={0} /></Form.Item>
            <Form.Item name="recover" label="恢复阈值(秒)" rules={[{required:true}]}><InputNumber min={0} /></Form.Item>
          </Space>
          <Form.Item name="enabled" label="新算法计算状态" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item name="adopt" label="采用状态"><Radio.Group options={[{label:'老算法',value:'old'},{label:'新算法',value:'new'}]} /></Form.Item>
        </Form>
      </Modal>
    </PageFrame>
  )
}
