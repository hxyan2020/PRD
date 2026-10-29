import { useState } from 'react'
import { Button, Form, InputNumber, Modal, Radio, Select, Space, Switch, Table, message } from 'antd'
import { DownloadOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { PageFrame } from '../components/PageFrame'
import { QueryResetButtons } from '../components/QueryResetButtons'
import { perpContractOptions } from '../config/pairs'
import { fairPriceRecords, type FairPriceRecord } from '../mock/data'
import { fh } from '../components/FieldHelpLabel'

export function FairPricePage() {
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<FairPriceRecord | null>(null)

  const openEdit = (record: FairPriceRecord) => {
    setCurrent(record)
    editForm.setFieldsValue({
      contractName: record.contractName,
      basisMaPeriod: record.basisMaPeriod,
      spreadThreshold: Number(record.spreadThreshold.replace('%', '')),
      observeThreshold: record.observeThreshold,
      recoveryThreshold: record.recoveryThreshold,
      newAlgoEnabled: record.newAlgoStatus === '启用',
      adoptStatus: record.adoptStatus === '新算法' ? '新算法' : '老算法',
    })
    setOpen(true)
  }

  const columns = [
    { title: fh('合约名称'), dataIndex: 'contractName', width: 130 },
    { title: fh('合约展示名称'), dataIndex: 'displayName', width: 120 },
    { title: fh('基差移动平均值周期(秒)'), dataIndex: 'basisMaPeriod', width: 180 },
    { title: fh('期现价差阈值比例'), dataIndex: 'spreadThreshold', width: 140 },
    { title: fh('观察阈值(秒)'), dataIndex: 'observeThreshold', width: 110 },
    { title: fh('恢复阈值(秒)'), dataIndex: 'recoveryThreshold', width: 110 },
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
      render: (_: unknown, record: FairPriceRecord) => (
        <Button type="primary" size="small" onClick={() => openEdit(record)}>
          编辑
        </Button>
      ),
    },
  ]

  return (
    <PageFrame
      title="合理价格"
      extra={
        <Space>
          <Button type="primary" icon={<PlusOutlined />}>
            添加
          </Button>
          <Button type="primary" icon={<DownloadOutlined />}>
            下载
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item label={fh('合约名称')} name="contract">
          <Select placeholder="请选择" allowClear style={{ width: 160 }} options={perpContractOptions} />
        </Form.Item>
        <Form.Item label="新算法计算状态" name="newAlgo" initialValue="all">
          <Select
            style={{ width: 140 }}
            options={[
              { value: 'all', label: '全部' },
              { value: 'on', label: '启用' },
              { value: 'off', label: '禁用' },
            ]}
          />
        </Form.Item>
        <Form.Item label="采用状态" name="adopt">
          <Select
            placeholder="请选择"
            allowClear
            style={{ width: 140 }}
            options={[
              { value: '新算法', label: '新算法' },
              { value: '老算法', label: '老算法' },
            ]}
          />
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

      <Modal
        title="编辑合理价格"
        open={open}
        onCancel={() => setOpen(false)}
        destroyOnHidden
        footer={[
          <Button key="cancel" onClick={() => setOpen(false)}>
            取消
          </Button>,
          <Button
            key="ok"
            type="primary"
            onClick={() => {
              message.success(`已保存合理价格：${current?.contractName ?? ''}`)
              setOpen(false)
            }}
          >
            确定
          </Button>,
        ]}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label={fh('合约名称')} name="contractName">
            <Select options={perpContractOptions} />
          </Form.Item>
          <Form.Item label={fh('基差移动平均值周期(秒)')} name="basisMaPeriod">
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item label={fh('期现价差阈值比例')} name="spreadThreshold">
            <InputNumber style={{ width: '100%' }} min={0} addonAfter="%" />
          </Form.Item>
          <Form.Item label={fh('观察阈值(秒)')} name="observeThreshold">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item label={fh('恢复阈值(秒)')} name="recoveryThreshold">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item label="新算法计算状态" name="newAlgoEnabled" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="采用状态" name="adoptStatus">
            <Radio.Group>
              <Radio value="老算法">老算法</Radio>
              <Radio value="新算法">新算法</Radio>
            </Radio.Group>
          </Form.Item>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>
            老算法价格: -- · 新算法价格:{' '}
            {current?.contractName?.startsWith('BTC') ? '85149.80' : '4348.55'}
          </div>
        </Form>
      </Modal>
    </PageFrame>
  )
}
