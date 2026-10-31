import { DownloadOutlined, EyeOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Form, Input, Select, Space, Table } from 'antd';
import { AdminPageShell } from '../components/AdminPageShell';
import { useUi } from '../i18n/useUi';
import { fairPriceList } from '../mock/data';

export function FairPricePage() {
  const ui = useUi();
  const columns = [
    { title: ui.t('合约名称', 'Contract'), dataIndex: 'contractName', width: 130 },
    { title: ui.t('合约显示名称', 'Contract display name'), dataIndex: 'contractDisplayName', width: 120 },
    { title: ui.t('基准移动平均值周期(秒)', 'Baseline MA period (sec)'), dataIndex: 'baselineMaPeriodSec', width: 180 },
    { title: ui.t('期现价差阈值比例', 'Basis spread threshold'), dataIndex: 'spreadThresholdRatio', width: 140 },
    { title: ui.t('观察阈值(秒)', 'Observation threshold (sec)'), dataIndex: 'observationThresholdSec', width: 110 },
    { title: ui.t('恢复阈值(秒)', 'Recovery threshold (sec)'), dataIndex: 'recoveryThresholdSec', width: 110 },
    {
      title: ui.t('近24小时计算记录', '24h calc records'),
      key: 'calc24h',
      width: 150,
      render: () => (
        <Button type="link" size="small">
          {ui.t('查看', 'View')}
        </Button>
      ),
    },
    { title: ui.t('新算法计算状态', 'New algo status'), dataIndex: 'newAlgorithmStatus', width: 130 },
    { title: ui.t('采用状态', 'Adoption status'), dataIndex: 'adoptionStatus', width: 100 },
    {
      title: ui.t('操作记录', 'Operation log'),
      key: 'log',
      width: 100,
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
    <AdminPageShell title={ui.pageTitle('fair-price')}>
      <Form layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item label={ui.contractName}>
          <Input placeholder={ui.pleaseInput} style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label={ui.t('新算法计算状态', 'New algo status')}>
          <Select allowClear style={{ width: 120 }} />
        </Form.Item>
        <Form.Item label={ui.t('采用状态', 'Adoption status')}>
          <Select allowClear style={{ width: 120 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              {ui.search}
            </Button>
            <Button>{ui.reset}</Button>
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
        pagination={{ total: 2, showTotal: (t) => ui.total(t), pageSize: 10 }}
        size="small"
      />
    </AdminPageShell>
  );
}
