import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Form, Input, Select, Space, Table } from 'antd';
import { AdminPageShell } from '../components/AdminPageShell';
import { useUi } from '../i18n/useUi';
import { coinIntroduceList } from '../mock/data';

export function CoinIntroducePage() {
  const ui = useUi();
  const columns = [
    { title: ui.t('合约名称', 'Contract'), dataIndex: 'contractName' },
    { title: ui.t('合约显示名称', 'Contract display name'), dataIndex: 'contractDisplayName' },
    { title: ui.t('币种名称', 'Coin name'), dataIndex: 'currencyName' },
    { title: ui.t('更新时间', 'Updated at'), dataIndex: 'updateTime' },
    {
      title: ui.t('操作记录', 'Operation log'),
      key: 'log',
      render: () => (
        <Button type="link" size="small">
          {ui.t('查看', 'View')}
        </Button>
      ),
    },
    {
      title: ui.t('操作', 'Action'),
      key: 'action',
      render: () => (
        <Space>
          <Button type="primary" size="small">
            {ui.t('查看', 'View')}
          </Button>
          <Button type="primary" size="small">
            {ui.t('编辑', 'Edit')}
          </Button>
          <Button danger size="small">
            {ui.t('删除', 'Delete')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <AdminPageShell title={ui.t('合约币种概览配置', 'Contract coin overview')} titleTag={ui.pageTitle('coin-introduce')}>
      <Form layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item label={ui.t('合约名称', 'Contract')}>
          <Select placeholder={ui.pleaseSelect} style={{ width: 160 }} allowClear />
        </Form.Item>
        <Form.Item>
          <Input placeholder={ui.t('请输入币种名称', 'Enter coin name')} style={{ width: 180 }} />
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
        <Button type="primary" icon={<PlusOutlined />}>
          {ui.t('新增', 'Add')}
        </Button>
      </div>
      <Table
        rowKey="contractName"
        columns={columns}
        dataSource={coinIntroduceList}
        pagination={{ total: 1, showTotal: (t) => ui.total(t), pageSize: 10 }}
        size="small"
      />
    </AdminPageShell>
  );
}
