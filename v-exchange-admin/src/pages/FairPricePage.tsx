import { DownloadOutlined, EyeOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Form, Input, Select, Space, Table } from 'antd';
import { AdminPageShell } from '../components/AdminPageShell';
import { fairPriceList } from '../mock/data';

export function FairPricePage() {
  const columns = [
    { title: '合约名称', dataIndex: 'contractName', width: 130 },
    { title: '合约显示名称', dataIndex: 'contractDisplayName', width: 120 },
    { title: '基准移动平均值周期(秒)', dataIndex: 'baselineMaPeriodSec', width: 180 },
    { title: '期现价差阈值比例', dataIndex: 'spreadThresholdRatio', width: 140 },
    { title: '观察阈值(秒)', dataIndex: 'observationThresholdSec', width: 110 },
    { title: '恢复阈值(秒)', dataIndex: 'recoveryThresholdSec', width: 110 },
    {
      title: '近24小时计算记录',
      key: 'calc24h',
      width: 150,
      render: () => (
        <Button type="link" size="small">
          查看
        </Button>
      ),
    },
    { title: '新算法计算状态', dataIndex: 'newAlgorithmStatus', width: 130 },
    { title: '采用状态', dataIndex: 'adoptionStatus', width: 100 },
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
      width: 80,
      render: () => (
        <Button type="primary" size="small">
          编辑
        </Button>
      ),
    },
  ];

  return (
    <AdminPageShell title="Fair Price">
      <Form layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item label="合约名称">
          <Input placeholder="请输入" style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label="新算法计算状态">
          <Select allowClear style={{ width: 120 }} />
        </Form.Item>
        <Form.Item label="采用状态">
          <Select allowClear style={{ width: 120 }} />
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
        <Space>
          <Button type="primary" icon={<PlusOutlined />} />
          <Button type="primary" icon={<DownloadOutlined />} />
        </Space>
      </div>
      <Table
        rowKey="key"
        columns={columns}
        dataSource={fairPriceList}
        pagination={{ total: 2, showTotal: (t) => `共 ${t} 条`, pageSize: 10 }}
        size="small"
      />
    </AdminPageShell>
  );
}
