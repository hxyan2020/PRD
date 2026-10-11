import { EyeOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Form, Input, Select, Space, Table } from 'antd';
import { AdminPageShell } from '../components/AdminPageShell';
import { marketSourceList } from '../mock/data';

export function MarketSourcePage() {
  const columns = [
    { title: '市场名称', dataIndex: 'marketName', width: 140 },
    { title: '显示名称', dataIndex: 'displayName', width: 120 },
    { title: '是否需要设置价差监控', dataIndex: 'spreadMonitoring', width: 160 },
    { title: '描述信息', dataIndex: 'description', width: 220 },
    { title: '进入观察期 (秒)', dataIndex: 'observationPeriodSec', width: 130 },
    { title: '更新周期 (秒)', dataIndex: 'updateCycleSec', width: 120 },
    {
      title: '是否启用',
      dataIndex: 'enabled',
      width: 100,
      render: (v: boolean) => (v ? <span>✓ 启用</span> : '禁用'),
    },
    {
      title: '操作记录',
      key: 'log',
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
      width: 90,
      render: () => (
        <Button type="primary" size="small">
          编辑
        </Button>
      ),
    },
  ];

  return (
    <AdminPageShell title="Market Source">
      <Form layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item label="市场名称">
          <Input placeholder="请输入" style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label="显示名称">
          <Input placeholder="请输入" style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label="状态">
          <Select placeholder="请选择" allowClear style={{ width: 120 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button>重置</Button>
          </Space>
        </Form.Item>
      </Form>
      <div className="table-toolbar">
        <Button type="primary" icon={<PlusOutlined />}>
          添加
        </Button>
      </div>
      <Table
        rowKey="key"
        columns={columns}
        dataSource={marketSourceList}
        pagination={{ total: 17, showTotal: (t) => `共 ${t} 条`, pageSize: 10 }}
        size="small"
      />
    </AdminPageShell>
  );
}
