import { Button, DatePicker, Empty, Form, Input, Select, Space, Table, Tabs, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { AdminPageShell } from '../components/AdminPageShell';
import { financialAccountInfo, financialFundRecords } from '../mock/financialData';

const { Title } = Typography;
const emptyLocale = { emptyText: <Empty description="暂无数据" /> };

export function FinancialReportPage() {
  const [form] = Form.useForm();
  return (
    <AdminPageShell title="财务报表">
      <Form form={form} layout="inline" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <Form.Item label="报表类型" name="type">
          <Select placeholder="请选择" allowClear style={{ width: 160 }} />
        </Form.Item>
        <Form.Item name="range">
          <DatePicker.RangePicker />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button onClick={() => form.resetFields()}>重置</Button>
          </Space>
        </Form.Item>
      </Form>
      <Table
        rowKey="id"
        size="small"
        columns={[
          { title: '报表ID', dataIndex: 'id', width: 140 },
          { title: '类型', dataIndex: 'type', width: 140 },
          { title: '生成时间', dataIndex: 'generatedAt', width: 180 },
        ]}
        dataSource={[]}
        locale={emptyLocale}
        pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
      />
    </AdminPageShell>
  );
}

export function TransferRecordPage() {
  const [form] = Form.useForm();
  return (
    <AdminPageShell title="划转记录">
      <Form form={form} layout="inline" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <Form.Item label="账户ID" name="accountId">
          <Input style={{ width: 160 }} placeholder="请输入" />
        </Form.Item>
        <Form.Item name="range">
          <DatePicker.RangePicker />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button onClick={() => form.resetFields()}>重置</Button>
          </Space>
        </Form.Item>
      </Form>
      <Table
        rowKey="id"
        size="small"
        columns={[
          { title: '转出', dataIndex: 'from', width: 140 },
          { title: '转入', dataIndex: 'to', width: 140 },
          { title: '金额', dataIndex: 'amount', width: 120 },
          { title: '时间', dataIndex: 'time', width: 180 },
        ]}
        dataSource={[]}
        locale={emptyLocale}
        pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
      />
    </AdminPageShell>
  );
}

export function FinancialAccountPage() {
  return (
    <AdminPageShell title="财务账户管理">
      <div className="db-section">
        <div className="db-section-header">
          <Title level={5} style={{ margin: 0 }}>
            账户信息
          </Title>
          <Button type="primary">注入资金</Button>
        </div>
        <div className="db-info-row">
          <div className="db-info-item">
            <div className="db-info-label">账户ID</div>
            <div className="db-info-value">{financialAccountInfo.accountId}</div>
          </div>
          <div className="db-info-item">
            <div className="db-info-label">当前注资金额</div>
            <div className="db-info-value">
              {financialAccountInfo.currentInjectionUsd.toLocaleString()} USD
            </div>
          </div>
        </div>
      </div>
      <div className="db-section">
        <div className="db-section-header">
          <Title level={5} style={{ margin: 0 }}>
            资金记录
          </Title>
        </div>
        <Table
          rowKey="key"
          size="small"
          pagination={false}
          columns={[
            { title: '账户ID', dataIndex: 'accountId', width: 120 },
            { title: '流水类型', dataIndex: 'flowType', width: 100 },
            { title: '触发类型', dataIndex: 'triggerType', width: 100 },
            { title: '流水金额 (USD)', dataIndex: 'amountUsd', width: 150 },
            { title: '更新时间', dataIndex: 'updatedAt', width: 170 },
          ]}
          dataSource={financialFundRecords}
        />
      </div>
    </AdminPageShell>
  );
}

export function FinancialReconPage() {
  const [form] = Form.useForm();
  const alertTable = (
    <>
      <Form
        form={form}
        layout="inline"
        style={{ marginBottom: 16, flexWrap: 'wrap' }}
        initialValues={{ user: 'BROKER', alertType: 'all' }}
      >
        <Form.Item label="用户" name="user">
          <Select style={{ width: 120 }} options={[{ value: 'BROKER', label: 'BROKER' }]} />
        </Form.Item>
        <Form.Item label="告警类型" name="alertType">
          <Select style={{ width: 120 }} options={[{ value: 'all', label: '全部' }]} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button onClick={() => form.resetFields()}>重置</Button>
          </Space>
        </Form.Item>
      </Form>
      <Table
        rowKey="alertId"
        size="small"
        locale={emptyLocale}
        columns={[
          { title: '用户ID', dataIndex: 'userId', width: 120 },
          { title: '告警ID', dataIndex: 'alertId', width: 120 },
          { title: '告警类型', dataIndex: 'alertType', width: 120 },
          { title: '触发详情', dataIndex: 'detail', width: 200 },
          { title: '告警时间', dataIndex: 'alertTime', width: 170 },
          { title: '告警方式', dataIndex: 'method', width: 100 },
        ]}
        dataSource={[]}
        scroll={{ x: 900 }}
        pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
      />
    </>
  );

  return (
    <AdminPageShell title="财务对账监控">
      <Tabs
        items={[
          { key: 'alerts', label: '告警记录', children: alertTable },
          { key: 'config', label: '监控配置', children: <Empty description="暂无数据" /> },
        ]}
      />
    </AdminPageShell>
  );
}

export function FinanceFlowPage() {
  const [form] = Form.useForm();
  return (
    <AdminPageShell title="资金流水">
      <Form form={form} layout="inline" style={{ marginBottom: 16, flexWrap: 'wrap', rowGap: 8 }}>
        <Form.Item label="用户合约FID" name="fid">
          <Select placeholder="请选择" allowClear style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label="合约名称" name="contract">
          <Select placeholder="请选择" allowClear style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label="币种" name="coin">
          <Select placeholder="请选择" allowClear style={{ width: 120 }} />
        </Form.Item>
        <Form.Item label="类型" name="type">
          <Select placeholder="请选择" allowClear style={{ width: 120 }} />
        </Form.Item>
        <Form.Item label="出入金类型" name="flowType">
          <Select placeholder="请选择" allowClear style={{ width: 140 }} />
        </Form.Item>
        <Form.Item name="range">
          <DatePicker.RangePicker placeholder={['开始日期', '结束日期']} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button onClick={() => form.resetFields()}>重置</Button>
          </Space>
        </Form.Item>
      </Form>
      <Table
        rowKey="fid"
        size="small"
        locale={emptyLocale}
        scroll={{ x: 900 }}
        columns={[
          { title: '合约FID', dataIndex: 'fid', width: 110 },
          { title: '合约名称', dataIndex: 'contractName', width: 120 },
          { title: '币种', dataIndex: 'coin', width: 80 },
          { title: '类型', dataIndex: 'type', width: 100 },
          { title: '入/出', dataIndex: 'direction', width: 80 },
          { title: '金额', dataIndex: 'amount', width: 120 },
          { title: '时间', dataIndex: 'time', width: 170 },
        ]}
        dataSource={[]}
        pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
      />
    </AdminPageShell>
  );
}
