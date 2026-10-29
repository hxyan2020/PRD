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
  Space,
  Switch,
  Table,
  message,
} from 'antd'
import { CloseOutlined, DownloadOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { PageFrame } from '../components/PageFrame'
import { QueryResetButtons } from '../components/QueryResetButtons'
import { perpContractOptions } from '../config/pairs'
import { fundingRateRecords, marketSourceRecords, type FundingRateRecord } from '../mock/data'

export function FundingRatePage() {
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<FundingRateRecord | null>(null)

  const openEdit = (record: FundingRateRecord) => {
    setCurrent(record)
    editForm.setFieldsValue({
      contract: record.contract,
      periodHours: record.periodHours,
      firstCollectHour: record.firstCollectHour,
      notifyMinutes: undefined,
      lowerLimit: Number(record.lowerLimit.replace('%', '')),
      upperLimit: Number(record.upperLimit.replace('%', '')),
      ratePrecision: Number(record.ratePrecision.split(' ')[0]),
      oldAlgoRate: Number(record.oldAlgoRate.replace('%', '')),
      useNewAlgo: true,
      marginImpact: Number(record.marginImpact.replace(/[^\d.]/g, '')),
      newAlgoRate: Number(record.newAlgoRate.replace('%', '')),
      autoAdjust: record.autoAdjust,
      enabled: record.enabled,
    })
    setOpen(true)
  }

  const columns = [
    { title: '对应合约对', dataIndex: 'contract', width: 130, fixed: 'left' as const },
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
      render: (enabled: boolean) => <Checkbox checked={enabled}>启用</Checkbox>,
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
      fixed: 'right' as const,
      render: (_: unknown, record: FundingRateRecord) => (
        <Button type="primary" size="small" onClick={() => openEdit(record)}>
          编辑
        </Button>
      ),
    },
  ]

  return (
    <PageFrame
      title="资金费率"
      extra={
        <Space>
          <Button type="primary" icon={<PlusOutlined />}>
            增加
          </Button>
          <Button type="primary" icon={<DownloadOutlined />}>
            下载
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item label="合约名称" name="contract">
          <Select placeholder="请选择合约名称" allowClear style={{ width: 180 }} options={perpContractOptions} />
        </Form.Item>
        <Form.Item label="状态" name="status">
          <Select
            placeholder="请选择状态"
            allowClear
            style={{ width: 140 }}
            options={[
              { value: 'on', label: '启用' },
              { value: 'off', label: '禁用' },
            ]}
          />
        </Form.Item>
        <Form.Item label="行情源" name="source">
          <Select
            placeholder="请选择行情源"
            allowClear
            style={{ width: 160 }}
            options={marketSourceRecords.map((s) => ({ value: s.marketName, label: s.marketName }))}
          />
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

      <Modal
        title="修改资金费率"
        open={open}
        onCancel={() => setOpen(false)}
        width={640}
        destroyOnHidden
        footer={[
          <Button key="cancel" onClick={() => setOpen(false)}>
            取消
          </Button>,
          <Button
            key="ok"
            type="primary"
            onClick={() => {
              message.success(`已保存资金费率：${current?.contract ?? ''}`)
              setOpen(false)
            }}
          >
            确定
          </Button>,
        ]}
      >
        <Form form={editForm} layout="vertical" style={{ maxHeight: '70vh', overflow: 'auto' }}>
          <Form.Item label="对应合约对" name="contract">
            <Select options={perpContractOptions} />
          </Form.Item>
          <Form.Item
            label="费率收取周期 (小时)"
            name="periodHours"
            extra="最小 1, 最大 24, 取值只能是 1, 2, 3, 4, 6, 8, 12, 24"
          >
            <InputNumber style={{ width: '100%' }} min={1} max={24} />
          </Form.Item>
          <Form.Item label="首次收取时间 (小时)" name="firstCollectHour" extra="最小 0, 最大 24">
            <InputNumber style={{ width: '100%' }} min={0} max={24} />
          </Form.Item>
          <Form.Item label="距离新周期启用时间" name="notifyMinutes" extra="分钟前通知用户">
            <Input placeholder="请输入…分钟前通知用户" />
          </Form.Item>
          <Form.Item label="费率浮动下限" name="lowerLimit" extra="百分比">
            <InputNumber style={{ width: '100%' }} addonAfter="%" />
          </Form.Item>
          <Form.Item label="费率浮动上限" name="upperLimit" extra="百分比">
            <InputNumber style={{ width: '100%' }} addonAfter="%" />
          </Form.Item>
          <Form.Item label="费率精度" name="ratePrecision" extra="0.000001">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item label="老算法利率" name="oldAlgoRate" extra="百分比">
            <InputNumber style={{ width: '100%' }} addonAfter="%" />
          </Form.Item>
          <Form.Item label="采用新算法资金费率" name="useNewAlgo" valuePropName="checked">
            <Switch />
          </Form.Item>
          <div style={{ marginTop: -8, marginBottom: 12, color: '#8c8c8c', fontSize: 12 }}>
            新算法资金费率: {current?.newAlgoRate ?? '--'} · 老算法资金费率: {current?.oldAlgoRate ?? '--'}
          </div>
          <Form.Item
            label="保证金影响额"
            name="marginImpact"
            extra="U本位合约单位为USDT, 币本位合约单位为USD"
          >
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item label="新算法利率" name="newAlgoRate" extra="百分比">
            <InputNumber style={{ width: '100%' }} addonAfter="%" />
          </Form.Item>
          <Form.Item label="是否开启自动调整资金费率" name="autoAdjust" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="是否启用" name="enabled">
            <Radio.Group>
              <Radio value={true}>启用</Radio>
              <Radio value={false}>禁用</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </PageFrame>
  )
}
