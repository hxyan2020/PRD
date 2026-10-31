import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Form, Input, Select, Space, Table } from 'antd';
import { AdminPageShell } from '../components/AdminPageShell';
import { useUi } from '../i18n/useUi';
import { contractList } from '../mock/data';

export function ContractListPage() {
  const ui = useUi();
  const [form] = Form.useForm();

  const columns = [
    { title: ui.t('合约ID', 'Contract ID'), dataIndex: 'id', width: 70, fixed: 'left' as const },
    { title: ui.t('合约名', 'Contract name'), dataIndex: 'name', width: 100, fixed: 'left' as const },
    { title: ui.t('显示名称', 'Display name'), dataIndex: 'displayName', width: 220 },
    { title: ui.t('合约类型', 'Contract type'), dataIndex: 'contractType', width: 120 },
    { title: ui.t('开仓类型', 'Open type'), dataIndex: 'openType', width: 80 },
    { title: ui.t('标的货币', 'Underlying'), dataIndex: 'targetCurrency', width: 80 },
    { title: ui.t('报价货币', 'Quote currency'), dataIndex: 'quoteCurrency', width: 80 },
    { title: ui.t('结算货币', 'Settlement currency'), dataIndex: 'settlementCurrency', width: 80 },
    { title: ui.t('面值', 'Face value'), dataIndex: 'faceValue', width: 80 },
    { title: ui.t('方向', 'Direction'), dataIndex: 'direction', width: 70 },
    { title: ui.t('杠杆倍数', 'Leverage'), dataIndex: 'leverage', width: 90 },
    { title: ui.t('价格精度', 'Price precision'), dataIndex: 'pricePrecision', width: 100 },
    { title: ui.t('数量精度', 'Qty precision'), dataIndex: 'qtyPrecision', width: 100 },
    { title: ui.t('金额精度', 'Amount precision'), dataIndex: 'amountPrecision', width: 100 },
    { title: ui.t('价格步进', 'Price step'), dataIndex: 'priceStep', width: 80 },
    { title: ui.t('数量步进', 'Qty step'), dataIndex: 'qtyStep', width: 80 },
    { title: ui.t('最小下单量', 'Min order qty'), dataIndex: 'minOrderQty', width: 90 },
    { title: ui.t('最大下单量', 'Max order qty'), dataIndex: 'maxOrderQty', width: 100 },
    { title: ui.t('限价单张数上限', 'Limit order sheet max'), dataIndex: 'limitSheetMax', width: 120 },
    { title: ui.t('市价单张数上限', 'Market order sheet max'), dataIndex: 'marketSheetMax', width: 120 },
    { title: ui.t('默认Taker', 'Default taker'), dataIndex: 'defaultTaker', width: 90 },
    { title: ui.t('默认Maker', 'Default maker'), dataIndex: 'defaultMaker', width: 90 },
    { title: ui.t('初始保证金率', 'Initial margin rate'), dataIndex: 'initialMargin', width: 100 },
    { title: ui.t('维持保证金率', 'Maint. margin rate'), dataIndex: 'maintenanceMargin', width: 110 },
    { title: ui.t('超额保证金率', 'Excess margin rate'), dataIndex: 'excessMargin', width: 110 },
    { title: ui.t('考核区', 'Assessment zone'), dataIndex: 'assessmentArea', width: 70 },
    { title: ui.t('定时交割', 'Scheduled delivery'), dataIndex: 'timedDelivery', width: 80 },
    { title: ui.t('推送', 'Push'), dataIndex: 'pushEnabled', width: 60 },
    { title: ui.t('状态', 'Status'), dataIndex: 'status', width: 80 },
    {
      title: ui.t('操作', 'Action'),
      key: 'action',
      fixed: 'right' as const,
      width: 120,
      render: () => (
        <Space size={4}>
          <Button type="primary" size="small">
            {ui.t('编辑', 'Edit')}
          </Button>
          <Button size="small">{ui.t('详情', 'Details')}</Button>
        </Space>
      ),
    },
  ];

  return (
    <AdminPageShell titleTag={ui.pageTitle('contract-list')}>
      <Form form={form} layout="inline" className="filter-form" style={{ marginBottom: 16 }}>
        <Form.Item label={ui.t('合约类型', 'Contract type')} name="contractType">
          <Select placeholder={ui.t('请选择', 'Please select')} allowClear style={{ width: 120 }} options={[{ value: 'perp', label: ui.t('永续', 'Perpetual') }]} />
        </Form.Item>
        <Form.Item label={ui.t('标的货币', 'Underlying')} name="target">
          <Select placeholder={ui.t('请选择', 'Please select')} allowClear style={{ width: 100 }} options={[{ value: 'BTC', label: 'BTC' }, { value: 'XAU', label: 'XAU' }]} />
        </Form.Item>
        <Form.Item label={ui.t('报价货币', 'Quote currency')} name="quote">
          <Select placeholder={ui.t('请选择', 'Please select')} allowClear style={{ width: 100 }} options={[{ value: 'USD', label: 'USD' }]} />
        </Form.Item>
        <Form.Item label={ui.t('状态', 'Status')} name="status">
          <Select placeholder={ui.t('请选择', 'Please select')} allowClear style={{ width: 100 }} />
        </Form.Item>
        <Form.Item label={ui.t('考核区', 'Assessment zone')} name="assessment">
          <Select placeholder={ui.t('请选择', 'Please select')} allowClear style={{ width: 100 }} />
        </Form.Item>
        <Form.Item label={ui.t('定时交割', 'Scheduled delivery')} name="delivery">
          <Select placeholder={ui.t('请选择', 'Please select')} allowClear style={{ width: 100 }} />
        </Form.Item>
        <Form.Item label={ui.t('合约名称', 'Contract')} name="name">
          <Input placeholder={ui.t('请输入', 'Please enter')} style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label={ui.t('方向', 'Direction')} name="direction">
          <Select placeholder={ui.t('请选择', 'Please select')} allowClear style={{ width: 100 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              {ui.search}
            </Button>
            <Button onClick={() => form.resetFields()}>{ui.reset}</Button>
          </Space>
        </Form.Item>
      </Form>
      <div className="table-toolbar">
        <Space>
          <Button type="primary" icon={<PlusOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a' }}>
            {ui.t('新增', 'Add')}
          </Button>
          <Button type="primary">{ui.t('批量操作', 'Batch ops')}</Button>
        </Space>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={contractList}
        scroll={{ x: 3200 }}
        pagination={{ total: contractList.length, showSizeChanger: true, showTotal: (t) => ui.total(t) }}
        size="small"
      />
    </AdminPageShell>
  );
}
