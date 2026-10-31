import { Button, Space, Table, Tag, message } from 'antd';
import { useState } from 'react';
import { AdminPageShell } from '../components/AdminPageShell';
import { useUi } from '../i18n/useUi';

export interface DbAccountAlertRecord {
  key: string;
  name: string;
  condition: string;
  updateTime: string;
  recipient: string;
  enabled: boolean;
}

const INITIAL_ALERTS: DbAccountAlertRecord[] = [
  {
    key: '1',
    name: '注资通知',
    condition: '事件触发',
    updateTime: '2026-09-22 15:25:39',
    recipient: 'alex.huang@hytechc.com',
    enabled: true,
  },
  {
    key: '2',
    name: '回拨通知',
    condition: '事件触发',
    updateTime: '2026-09-22 15:25:31',
    recipient: 'alex.huang@hytechc.com',
    enabled: true,
  },
  {
    key: '3',
    name: 'DB心跳预警',
    condition: '事件触发',
    updateTime: '2026-09-22 15:25:26',
    recipient: 'alex.huang@hytechc.com',
    enabled: true,
  },
  {
    key: '4',
    name: '注资金额上限预警',
    condition: '事件触发',
    updateTime: '2026-09-24 19:11:59',
    recipient: 'gary.liang@hytechc.com',
    enabled: true,
  },
  {
    key: '5',
    name: 'DB长时间持仓预警',
    condition: '持仓时间 > 10 mins',
    updateTime: '2026-09-22 15:25:10',
    recipient: 'alex.huang@hytechc.com',
    enabled: true,
  },
  {
    key: '6',
    name: 'DB长时间持仓预警',
    condition: '持仓时间 > 5 mins',
    updateTime: '2026-10-30 17:33:24',
    recipient: 'natalie.chen@hytechc.com',
    enabled: false,
  },
  {
    key: '7',
    name: 'DB大额持仓预警',
    condition: '当前持仓仓位价值 > 500,000 USD',
    updateTime: '2026-09-22 15:24:55',
    recipient: 'alex.huang@hytechc.com',
    enabled: true,
  },
  {
    key: '8',
    name: 'DB大额持仓预警',
    condition: '当前持仓仓位价值 > 300,000 USD',
    updateTime: '2026-09-22 15:24:43',
    recipient: 'alex.huang@hytechc.com',
    enabled: true,
  },
  {
    key: '9',
    name: 'DB账户权益预警',
    condition: '！！DB账户净权益不足 -1 USD',
    updateTime: '2026-09-22 15:24:32',
    recipient: 'alex.huang@hytechc.com',
    enabled: true,
  },
  {
    key: '10',
    name: 'DB账户权益预警',
    condition: '！！DB账户净权益不足 50,000 USD',
    updateTime: '2026-09-22 18:23:36',
    recipient: 'natalie.chen@hytechc.com',
    enabled: false,
  },
  {
    key: '11',
    name: 'DB账户权益预警',
    condition: '！！DB账户净权益不足 100,000 USD',
    updateTime: '2026-09-22 18:23:39',
    recipient: 'natalie.chen@hytechc.com',
    enabled: false,
  },
  {
    key: '12',
    name: 'DB资金二级预警',
    condition: '事件触发',
    updateTime: '2026-09-22 15:24:00',
    recipient: 'alex.huang@hytechc.com',
    enabled: true,
  },
  {
    key: '13',
    name: 'DB资金一级预警',
    condition: 'DB账户可用 <= 100,000 USD 时触发',
    updateTime: '2026-09-24 19:11:31',
    recipient: 'gary.liang@hytechc.com',
    enabled: true,
  },
];

export function DbAccountAlertPage() {
  const ui = useUi();
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);

  const toggleEnabled = (key: string) => {
    setAlerts((prev) =>
      prev.map((row) => {
        if (row.key !== key) return row;
        const next = !row.enabled;
        message.success(next ? '已启用' : '已停用');
        return { ...row, enabled: next };
      }),
    );
  };

  const columns = [
    { title: ui.t('告警名称', 'Alert name'), dataIndex: 'name', width: 180 },
    { title: ui.t('触发条件', 'Trigger condition'), dataIndex: 'condition', width: 280 },
    { title: ui.t('更新时间', 'Updated at'), dataIndex: 'updateTime', width: 170 },
    { title: ui.t('接收邮箱', 'Email'), dataIndex: 'recipient', width: 220 },
    {
      title: ui.t('状态', 'Status'),
      dataIndex: 'enabled',
      width: 100,
      render: (enabled: boolean) =>
        enabled ? <Tag color="success">生效中</Tag> : <Tag>已停用</Tag>,
    },
    {
      title: ui.t('操作', 'Action'),
      key: 'action',
      width: 140,
      render: (_: unknown, record: DbAccountAlertRecord) => (
        <Space size={4}>
          <Button type="link" size="small" onClick={() => toggleEnabled(record.key)}>
            {record.enabled ? '停用' : '启用'}
          </Button>
          <Button type="link" size="small" onClick={() => message.info(`编辑：${record.name}`)}>
            {ui.t('编辑', 'Edit')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <AdminPageShell>
      <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>做市管理 / DB账户告警</div>
      <Table
        rowKey="key"
        columns={columns}
        dataSource={alerts}
        pagination={{
          total: alerts.length,
          showTotal: (t) => ui.total(t),
          pageSize: 20,
          showSizeChanger: false,
        }}
        size="small"
      />
    </AdminPageShell>
  );
}
