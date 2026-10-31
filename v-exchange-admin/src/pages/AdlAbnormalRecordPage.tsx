import { PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Tabs,
  Tag,
  message,
} from 'antd';
import { useState } from 'react';
import { AdminPageShell } from '../components/AdminPageShell';
import { useUi } from '../i18n/useUi';

const { TextArea } = Input;

interface ConfigRecord {
  key: string;
  alertType: string;
  updateTime: string;
  updatedBy: string;
  enabled: boolean;
}

const INITIAL_CONFIGS: ConfigRecord[] = [
  {
    key: '1',
    alertType: 'ADL失败，重试中',
    updateTime: '2026-09-22 13:39:02',
    updatedBy: 'alex.huang@hytechc.com',
    enabled: true,
  },
];

export function AdlAbnormalRecordPage() {
  const ui = useUi();
  const [form] = Form.useForm();
  const [tab, setTab] = useState('records');
  const [open, setOpen] = useState(false);
  const [configs, setConfigs] = useState(INITIAL_CONFIGS);

  const openCreate = () => {
    form.resetFields();
    setOpen(true);
  };

  const handleOk = async () => {
    try {
      await form.validateFields();
      setConfigs((prev) => [
        {
          key: String(Date.now()),
          alertType: 'ADL失败，重试中',
          updateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
          updatedBy: 'Haixiang Yan',
          enabled: true,
        },
        ...prev,
      ]);
      message.success('已新增监控');
      setOpen(false);
    } catch {
      /* inline */
    }
  };

  const toggleConfig = (key: string) => {
    setConfigs((prev) =>
      prev.map((row) => {
        if (row.key !== key) return row;
        const enabled = !row.enabled;
        message.success(enabled ? '已启用' : '已停用');
        return { ...row, enabled };
      }),
    );
  };

  const alertColumns = [
    { title: ui.t('告警类型', 'Alert type'), dataIndex: 'alertType', width: 200 },
    { title: ui.t('告警时间', 'Alert time'), dataIndex: 'alertTime', width: 180 },
    { title: ui.t('告警方式', 'Alert method'), dataIndex: 'method', width: 120 },
  ];

  const configColumns = [
    { title: ui.t('告警类型', 'Alert type'), dataIndex: 'alertType', width: 200 },
    { title: ui.t('更新时间', 'Updated at'), dataIndex: 'updateTime', width: 170 },
    { title: ui.t('更新人', 'Updated by'), dataIndex: 'updatedBy', width: 220 },
    {
      title: ui.t('状态', 'Status'),
      dataIndex: 'enabled',
      width: 90,
      render: (v: boolean) => (v ? <Tag color="success">生效中</Tag> : <Tag>已停用</Tag>),
    },
    {
      title: ui.t('操作', 'Action'),
      key: 'action',
      width: 140,
      render: (_: unknown, record: ConfigRecord) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            danger={record.enabled}
            onClick={() => toggleConfig(record.key)}
          >
            {record.enabled ? '停用' : '启用'}
          </Button>
          <Button type="link" size="small" onClick={() => message.info(`编辑：${record.alertType}`)}>
            {ui.t('编辑', 'Edit')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <AdminPageShell>
      <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>{ui.t('监控告警', 'Monitor & Alert')} / {ui.pageTitle('adl-abnormal-record')}</div>

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: 'records', label: ui.alertRecords },
          { key: 'config', label: ui.monitorConfig },
        ]}
        style={{ marginBottom: 8 }}
      />

      {tab === 'records' && (
        <Table
          rowKey="key"
          columns={alertColumns}
          dataSource={[]}
          locale={{ emptyText: ui.empty }}
          pagination={{ showTotal: (t) => ui.total(t), pageSize: 10 }}
          size="small"
        />
      )}

      {tab === 'config' && (
        <>
          <div className="table-toolbar">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              增加监控
            </Button>
          </div>
          <Table
            rowKey="key"
            columns={configColumns}
            dataSource={configs}
            pagination={{
              total: configs.length,
              showTotal: (t) => ui.total(t),
              pageSize: 20,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
            }}
            size="small"
          />
        </>
      )}

      <Modal
        title="新增 - 监控配置"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleOk}
        okText="确定"
        cancelText="取消"
        width={520}
        destroyOnClose
        maskClosable={false}
      >
        <Form form={form} layout="vertical" requiredMark style={{ marginTop: 8 }}>
          <Form.Item
            label={ui.t('预警群', 'Alert group')}
            name="notify"
            rules={[{ required: true, message: '请填写 Lark 机器人 URL' }]}
          >
            <TextArea rows={4} placeholder="填写 Lark 机器人 URL，多个 URL 使用英文逗号分隔" />
          </Form.Item>
        </Form>
      </Modal>
    </AdminPageShell>
  );
}
