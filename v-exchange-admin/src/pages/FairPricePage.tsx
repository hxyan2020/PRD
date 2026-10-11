import { Button, Form, Select, Space, Table } from 'antd'
import { DownloadOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { PageFrame } from '../components/PageFrame'
import { QueryResetButtons } from '../components/QueryResetButtons'
import { fairPriceRecords } from '../mock/data'

export function FairPricePage() {
  const [form] = Form.useForm()

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
      render: () => (
        <Button type="primary" size="small">
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
    </PageFrame>
  )
}
