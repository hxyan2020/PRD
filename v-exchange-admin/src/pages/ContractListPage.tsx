import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Form, Input, Select, Space, Table } from 'antd';
import { AdminPageShell } from '../components/AdminPageShell';
import { contractList } from '../mock/data';

export function ContractListPage() {
  const [form] = Form.useForm();

  const columns = [
    { title: '合约ID', dataIndex: 'id', width: 70, fixed: 'left' as const },
    { title: '合约名', dataIndex: 'name', width: 100, fixed: 'left' as const },
    { title: '显示名称', dataIndex: 'displayName', width: 220 },
    { title: '合约类型', dataIndex: 'contractType', width: 120 },
    { title: '开仓类型', dataIndex: 'openType', width: 80 },
    { title: '标的货币', dataIndex: 'targetCurrency', width: 80 },
    { title: '报价货币', dataIndex: 'quoteCurrency', width: 80 },
    { title: '结算货币', dataIndex: 'settlementCurrency', width: 80 },
    { title: '面值', dataIndex: 'faceValue', width: 80 },
    { title: '方向', dataIndex: 'direction', width: 70 },
    { title: '杠杆倍数', dataIndex: 'leverage', width: 90 },
    { title: '价格精度', dataIndex: 'pricePrecision', width: 100 },
    { title: '数量精度', dataIndex: 'qtyPrecision', width: 100 },
    { title: '金额精度', dataIndex: 'amountPrecision', width: 100 },
    { title: '价格步进', dataIndex: 'priceStep', width: 80 },
    { title: '数量步进', dataIndex: 'qtyStep', width: 80 },
    { title: '最小下单量', dataIndex: 'minOrderQty', width: 90 },
    { title: '最大下单量', dataIndex: 'maxOrderQty', width: 100 },
    { title: '限价单张数上限', dataIndex: 'limitSheetMax', width: 120 },
    { title: '市价单张数上限', dataIndex: 'marketSheetMax', width: 120 },
    { title: '默认Taker', dataIndex: 'defaultTaker', width: 90 },
    { title: '默认Maker', dataIndex: 'defaultMaker', width: 90 },
    { title: '初始保证金率', dataIndex: 'initialMargin', width: 100 },
    { title: '维持保证金率', dataIndex: 'maintenanceMargin', width: 110 },
    { title: '超额保证金率', dataIndex: 'excessMargin', width: 110 },
    { title: '考核区', dataIndex: 'assessmentArea', width: 70 },
    { title: '定时交割', dataIndex: 'timedDelivery', width: 80 },
    { title: '推送', dataIndex: 'pushEnabled', width: 60 },
    { title: '状态', dataIndex: 'status', width: 80 },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 120,
      render: () => (
        <Space size={4}>
          <Button type="primary" size="small">
            编辑
          </Button>
          <Button size="small">详情</Button>
        </Space>
      ),
    },
  ];

  return (
    <AdminPageShell titleTag="合约列表">
      <Form form={form} layout="inline" className="filter-form" style={{ marginBottom: 16 }}>
        <Form.Item label="合约类型" name="contractType">
          <Select placeholder="请选择" allowClear style={{ width: 120 }} options={[{ value: 'perp', label: '永续' }]} />
        </Form.Item>
        <Form.Item label="标的货币" name="target">
          <Select placeholder="请选择" allowClear style={{ width: 100 }} options={[{ value: 'BTC', label: 'BTC' }, { value: 'XAU', label: 'XAU' }]} />
        </Form.Item>
        <Form.Item label="报价货币" name="quote">
          <Select placeholder="请选择" allowClear style={{ width: 100 }} options={[{ value: 'USD', label: 'USD' }]} />
        </Form.Item>
        <Form.Item label="状态" name="status">
          <Select placeholder="请选择" allowClear style={{ width: 100 }} />
        </Form.Item>
        <Form.Item label="考核区" name="assessment">
          <Select placeholder="请选择" allowClear style={{ width: 100 }} />
        </Form.Item>
        <Form.Item label="定时交割" name="delivery">
          <Select placeholder="请选择" allowClear style={{ width: 100 }} />
        </Form.Item>
        <Form.Item label="合约名称" name="name">
          <Input placeholder="请输入" style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label="方向" name="direction">
          <Select placeholder="请选择" allowClear style={{ width: 100 }} />
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
      <div className="table-toolbar">
        <Space>
          <Button type="primary" icon={<PlusOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a' }}>
            新增
          </Button>
          <Button type="primary">批量操作</Button>
        </Space>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={contractList}
        scroll={{ x: 3200 }}
        pagination={{ total: contractList.length, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        size="small"
      />
    </AdminPageShell>
  );
}
