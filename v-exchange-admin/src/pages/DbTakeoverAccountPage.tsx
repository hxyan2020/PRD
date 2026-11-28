import { InfoCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Space, Table, Tooltip, Typography, message } from 'antd';
import { useState } from 'react';
import { AdminPageShell } from '../components/AdminPageShell';

const { Text, Title } = Typography;

function InfoLabel({ label, tip }: { label: string; tip: string }) {
  return (
    <span style={{ color: '#666' }}>
      {label}{' '}
      <Tooltip title={tip}>
        <InfoCircleOutlined style={{ color: '#1677ff', cursor: 'help' }} />
      </Tooltip>
    </span>
  );
}

const accountBasic = {
  accountId: '100000002',
  walletBalance: '200560.26 USD',
  maxTransferable: '200560.26 USD',
  injectedAmount: '200000 USD',
};

const paramSettings = {
  autoInjectWaterline: '40000 USD',
  injectTargetWaterline: '200000 USD',
};

const positionSummary = [
  { label: '总占用保证金', value: '0 USD' },
  { label: '持仓总额', value: '0 USD' },
  { label: '总未实现盈亏', value: '0 USD' },
  { label: '账户权益', value: '200560.26 USD' },
  { label: '账户MMR', value: '1000000%' },
];

const positionColumns = [
  { title: '合约名称', dataIndex: 'contractName' },
  { title: '持仓方向', dataIndex: 'direction' },
  { title: '持仓均价', dataIndex: 'avgPrice' },
  {
    title: <span style={{ color: '#ff4d4f' }}>持仓仓位价值 (USD)</span>,
    dataIndex: 'positionValue',
  },
  { title: '占用保证金 (USD)', dataIndex: 'occupiedMargin' },
  { title: '未实现盈亏 (USD)', dataIndex: 'unrealizedPnl' },
];

export function DbTakeoverAccountPage() {
  const [filterForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [editOpen, setEditOpen] = useState(false);
  const [editField, setEditField] = useState<'auto' | 'target'>('auto');
  const [autoLine, setAutoLine] = useState(paramSettings.autoInjectWaterline);
  const [targetLine, setTargetLine] = useState(paramSettings.injectTargetWaterline);

  const openEdit = (field: 'auto' | 'target') => {
    setEditField(field);
    editForm.setFieldsValue({
      value: field === 'auto' ? autoLine.replace(' USD', '') : targetLine.replace(' USD', ''),
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    const { value } = await editForm.validateFields();
    const formatted = `${value} USD`;
    if (editField === 'auto') setAutoLine(formatted);
    else setTargetLine(formatted);
    message.success('已更新');
    setEditOpen(false);
  };

  return (
    <AdminPageShell>
      <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>做市管理 / DB接仓账户管理</div>

      {/* 1. 账户基础信息 */}
      <section className="db-section">
        <div className="db-section-header">
          <Title level={5} style={{ margin: 0 }}>
            账户基础信息
          </Title>
          <Button
            type="primary"
            onClick={() => message.info('回拨资金（演示）')}
          >
            回拨资金
          </Button>
        </div>
        <div className="db-info-row">
          <div className="db-info-item">
            <div className="db-info-label">账户ID</div>
            <div className="db-info-value">{accountBasic.accountId}</div>
          </div>
          <div className="db-info-item">
            <div className="db-info-label">
              <InfoLabel
                label="钱包余额"
                tip="接仓账户当前钱包余额（USD），含可用资金；持仓占用保证金后余额仍会显示总额口径，请结合下方持仓信息查看。"
              />
            </div>
            <div className="db-info-value">{accountBasic.walletBalance}</div>
          </div>
          <div className="db-info-item">
            <div className="db-info-label">
              <InfoLabel
                label="最大可转金额"
                tip="当前可从该接仓账户回拨/转出的上限（USD）。受钱包余额、占用保证金与风控规则约束，不一定等于钱包余额。"
              />
            </div>
            <div className="db-info-value">{accountBasic.maxTransferable}</div>
          </div>
          <div className="db-info-item">
            <div className="db-info-label">
              <InfoLabel
                label="当前注资金额"
                tip="已注入该接仓账户的累计资金（USD）。用于对照目标水位线，判断是否还需补资或可回拨。"
              />
            </div>
            <div className="db-info-value">{accountBasic.injectedAmount}</div>
          </div>
        </div>
      </section>

      {/* 2. 参数设置 */}
      <section className="db-section">
        <Title level={5} style={{ margin: '0 0 16px' }}>
          参数设置
        </Title>
        <div className="db-info-row">
          <div className="db-info-item">
            <div className="db-info-label">
              <InfoLabel
                label="自动注资水位线"
                tip="当账户可用资金低于该水位线（USD）时，系统自动触发注资，补至「注资目标水位线」，避免接仓账户穿仓或保证金不足。"
              />
            </div>
            <div className="db-info-value">
              {autoLine}{' '}
              <Button type="link" size="small" onClick={() => openEdit('auto')}>
                编辑
              </Button>
            </div>
          </div>
          <div className="db-info-item">
            <div className="db-info-label">
              <InfoLabel
                label="注资目标水位线"
                tip="自动注资时希望达到的目标余额（USD）。应高于自动注资水位线，差额决定单次补资金额规模。"
              />
            </div>
            <div className="db-info-value">
              {targetLine}{' '}
              <Button type="link" size="small" onClick={() => openEdit('target')}>
                编辑
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 账户持仓信息 */}
      <section className="db-section">
        <Title level={5} style={{ margin: '0 0 16px' }}>
          账户持仓信息
        </Title>
        <div className="db-info-row" style={{ marginBottom: 16 }}>
          {positionSummary.map((item) => (
            <div className="db-info-item" key={item.label}>
              <div className="db-info-label">{item.label}</div>
              <div className="db-info-value">{item.value}</div>
            </div>
          ))}
        </div>

        <Form form={filterForm} layout="inline" style={{ marginBottom: 12 }}>
          <Form.Item label="合约名称" name="contractName">
            <Input placeholder="请输入合约名称" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />}>
                查询
              </Button>
              <Button onClick={() => filterForm.resetFields()}>重置</Button>
            </Space>
          </Form.Item>
        </Form>

        <Table
          rowKey="contractName"
          columns={positionColumns}
          dataSource={[]}
          locale={{ emptyText: '暂无数据' }}
          pagination={false}
          size="small"
        />
      </section>

      <Modal
        title={editField === 'auto' ? '编辑自动注资水位线' : '编辑注资目标水位线'}
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={saveEdit}
        okText="确定"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            label="金额 (USD)"
            name="value"
            rules={[{ required: true, message: '请输入金额' }]}
            extra={
              <Text type="secondary">
                {editField === 'auto'
                  ? '单位：USD。建议低于注资目标水位线，作为触发自动补资的下限阈值。'
                  : '单位：USD。建议高于自动注资水位线，作为补资后的目标余额。'}
              </Text>
            }
          >
            <Input placeholder="请输入" />
          </Form.Item>
        </Form>
      </Modal>
    </AdminPageShell>
  );
}
