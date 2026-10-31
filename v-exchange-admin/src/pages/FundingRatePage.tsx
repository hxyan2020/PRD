import { DownloadOutlined, EditOutlined, EyeOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Form, Select, Space, Switch, Table } from 'antd';
import { AdminPageShell } from '../components/AdminPageShell';
import { useUi } from '../i18n/useUi';
import { fundingRateList } from '../mock/data';

export function FundingRatePage() {
  const ui = useUi();
  const columns = [
    { title: ui.t('对应合约', 'Contract'), dataIndex: 'contract', width: 120 },
    { title: ui.t('合约展示名称', 'Contract display name'), dataIndex: 'contractDisplayName', width: 120 },
    { title: ui.t('费率收取周期(小时)', 'Fee cycle (hours)'), dataIndex: 'feeCycleHours', width: 140 },
    { title: ui.t('首次收取时间(小时)', 'First collect hour'), dataIndex: 'firstCollectionHour', width: 140 },
    { title: ui.t('费率浮动上限', 'Rate float upper'), dataIndex: 'floatUpper', width: 110 },
    { title: ui.t('费率浮动下限', 'Rate float lower'), dataIndex: 'floatLower', width: 110 },
    { title: ui.t('保证金影响额', 'Margin impact'), dataIndex: 'marginImpact', width: 120 },
    {
      title: ui.t('自动调整资金费率', 'Auto adjust funding rate'),
      dataIndex: 'autoAdjust',
      width: 140,
      render: (v: boolean) => (v ? '是' : <span style={{ color: '#ff4d4f' }}>✕</span>),
    },
    { title: ui.t('行情源', 'Market source'), dataIndex: 'marketSource', width: 80 },
    { title: ui.t('资金费自动调整系数区间', 'Auto-adjust coeff. range'), dataIndex: 'autoAdjustRange', width: 180 },
    { title: ui.t('费率精度', 'Rate precision'), dataIndex: 'ratePrecision', width: 120 },
    { title: ui.t('老算法利率', 'Legacy algo rate'), dataIndex: 'oldAlgorithmRate', width: 100 },
    { title: ui.t('新算法利率', 'New algo rate'), dataIndex: 'newAlgorithmRate', width: 110 },
    {
      title: ui.t('结算费率', 'Settlement rate'),
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
      title: ui.t('是否启用', 'Enabled'),
      dataIndex: 'enabled',
      width: 90,
      render: (v: boolean) => <Switch checked={v} size="small" />,
    },
    {
      title: ui.t('操作记录', 'Operation log'),
      key: 'log',
      width: 90,
      render: () => (
        <Button type="link" size="small" icon={<EyeOutlined />}>
          {ui.t('查看', 'View')}
        </Button>
      ),
    },
    {
      title: ui.t('操作', 'Action'),
      key: 'action',
      width: 80,
      render: () => (
        <Button type="primary" size="small">
          {ui.t('编辑', 'Edit')}
        </Button>
      ),
    },
  ];

  return (
    <AdminPageShell title={ui.pageTitle('funding-rate')}>
      <Form layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item label={ui.contractName}>
          <Select allowClear style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label={ui.status}>
          <Select allowClear style={{ width: 100 }} />
        </Form.Item>
        <Form.Item label={ui.t('行情源', 'Market source')}>
          <Select allowClear style={{ width: 120 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              {ui.search}
            </Button>
            <Button>{ui.reset}</Button>
            <Button type="primary" icon={<PlusOutlined />}>
              {ui.add}
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
        pagination={{ total: 2, showTotal: (t) => ui.total(t), pageSize: 10 }}
        size="small"
      />
    </AdminPageShell>
  );
}
