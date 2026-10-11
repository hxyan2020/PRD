import { DownloadOutlined, EditOutlined, EyeOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Form, Select, Space, Switch, Table } from 'antd';
import { AdminPageShell } from '../components/AdminPageShell';
import { fundingRateList } from '../mock/data';

export function FundingRatePage() {
  const columns = [
    { title: '对应合约', dataIndex: 'contract', width: 120 },
    { title: '合约展示名称', dataIndex: 'contractDisplayName', width: 120 },
    { title: '费率收取周期(小时)', dataIndex: 'feeCycleHours', width: 140 },
    { title: '首次收取时间(小时)', dataIndex: 'firstCollectionHour', width: 140 },
    { title: '费率浮动上限', dataIndex: 'floatUpper', width: 110 },
    { title: '费率浮动下限', dataIndex: 'floatLower', width: 110 },
    { title: '保证金影响额', dataIndex: 'marginImpact', width: 120 },
    {
      title: '自动调整资金费率',
      dataIndex: 'autoAdjust',
      width: 140,
      render: (v: boolean) => (v ? '是' : <span style={{ color: '#ff4d4f' }}>✕</span>),
    },
    { title: '行情源', dataIndex: 'marketSource', width: 80 },
    { title: '资金费自动调整系数区间', dataIndex: 'autoAdjustRange', width: 180 },
    { title: '费率精度', dataIndex: 'ratePrecision', width: 120 },
    { title: '老算法利率', dataIndex: 'oldAlgorithmRate', width: 100 },
    { title: '新算法利率', dataIndex: 'newAlgorithmRate', width: 110 },
    {
      title: '结算费率',
      dataIndex: 'settlementRate',
      width: 100,
      render: (v: string) => (
        <Space>
          {v}
          <EditOutlined style={{ color: '#1677ff' }} />
        </Space>
      ),
    },
    {
      title: '是否启用',
      dataIndex: 'enabled',
      width: 90,
      render: (v: boolean) => <Switch checked={v} size="small" />,
    },
    {
      title: '操作记录',
      key: 'log',
      width: 90,
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
  ];

  return (
    <AdminPageShell title="Funding Rate">
      <Form layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item label="合约名称">
          <Select allowClear style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label="状态">
          <Select allowClear style={{ width: 100 }} />
        </Form.Item>
        <Form.Item label="行情源">
          <Select allowClear style={{ width: 120 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button>重置</Button>
            <Button type="primary" icon={<PlusOutlined />}>
              添加
            </Button>
            <Button type="primary" icon={<DownloadOutlined />}>
              下载
            </Button>
          </Space>
        </Form.Item>
      </Form>
      <Table
        rowKey="key"
        columns={columns}
        dataSource={fundingRateList}
        scroll={{ x: 2200 }}
        pagination={{ total: 2, showTotal: (t) => `共 ${t} 条`, pageSize: 10 }}
        size="small"
      />
    </AdminPageShell>
  );
}
