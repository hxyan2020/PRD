import {
  InfoCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Button,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  Tooltip,
  message,
} from 'antd';
import { useState } from 'react';
import { AdminPageShell } from '../components/AdminPageShell';
import { indexPriceList } from '../mock/data';

/** From production 新增指数映射 modal screenshot */
const MARKET_SOURCE_OPTIONS = [
  'BINANCE',
  'OKX',
  'BITGET',
  'BYBIT',
  'BINANCE_INDEX',
  'GATEIO_INDEX',
  'MEXC_INDEX',
  'OKX_INDEX',
  'BYBIT_INDEX',
  'BITGET_INDEX',
  'LMAX',
  'POLYGON',
  'FINALTO',
  'ISPRIME',
  'STARPRIME',
  'VELOCITY',
];

const indexNameOptions = indexPriceList.map((r) => ({
  label: r.indexName,
  value: r.indexName,
}));

function Tip({ text }: { text: string }) {
  return (
    <Tooltip title={text}>
      <InfoCircleOutlined style={{ color: '#1677ff', marginLeft: 4, cursor: 'help' }} />
    </Tooltip>
  );
}

export function IndexMarketLinkPage() {
  const [filterForm] = Form.useForm();
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);

  const openCreate = () => {
    form.resetFields();
    setOpen(true);
  };

  const handleOk = async () => {
    try {
      await form.validateFields();
      message.success('新增成功');
      setOpen(false);
    } catch {
      /* validation shown inline */
    }
  };

  const columns = [
    {
      title: (
        <span>
          指数名称
          <Tip text="关联的指数价格名称，如 BTCUSD、XAUUSD。" />
        </span>
      ),
      dataIndex: 'indexName',
    },
    {
      title: (
        <span>
          目标交易对
          <Tip text="行情源上对应的目标交易对符号。" />
        </span>
      ),
      dataIndex: 'targetPair',
    },
    {
      title: (
        <span>
          行情源
          <Tip text="该映射所使用的外部行情源。" />
        </span>
      ),
      dataIndex: 'marketSource',
    },
    {
      title: (
        <span>
          操作
          <Tip text="编辑或删除该指数映射。" />
        </span>
      ),
      key: 'action',
      render: () => (
        <Button type="primary" size="small">
          编辑
        </Button>
      ),
    },
  ];

  return (
    <AdminPageShell titleTag="指数价格关联">
      <Form form={filterForm} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item
          label={
            <span>
              行情源
              <Tip text="按行情源筛选已配置的指数映射。" />
            </span>
          }
          name="marketSource"
        >
          <Select
            placeholder="请选择"
            allowClear
            style={{ width: 160 }}
            options={MARKET_SOURCE_OPTIONS.map((v) => ({ label: v, value: v }))}
          />
        </Form.Item>
        <Form.Item
          label={
            <span>
              指数名称
              <Tip text="按指数名称筛选。" />
            </span>
          }
          name="indexName"
        >
          <Input placeholder="请输入" style={{ width: 160 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => filterForm.resetFields()}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <div className="table-toolbar">
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          添加
        </Button>
      </div>

      <Table
        rowKey="indexName"
        columns={columns}
        dataSource={[]}
        locale={{ emptyText: '暂无数据' }}
        size="small"
      />

      <Modal
        title="新增指数映射"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleOk}
        okText="确定"
        cancelText="取消"
        width={640}
        destroyOnClose
        maskClosable={false}
      >
        <Form form={form} layout="vertical" requiredMark colon style={{ marginTop: 8 }}>
          <Form.Item
            label="指数名称"
            name="indexName"
            rules={[{ required: true, message: '请选择指数名称' }]}
          >
            <Select placeholder="指数名称" options={indexNameOptions} />
          </Form.Item>

          <Form.Item
            label="行情源"
            name="marketSource"
            rules={[{ required: true, message: '请选择行情源' }]}
          >
            <Radio.Group
              options={MARKET_SOURCE_OPTIONS.map((v) => ({ label: v, value: v }))}
              style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}
            />
          </Form.Item>

          <Form.Item
            label="目标交易对"
            name="targetPair"
            rules={[{ required: true, message: '请填写目标交易对' }]}
          >
            <Input placeholder="请填写目标交易对" />
          </Form.Item>
        </Form>
      </Modal>
    </AdminPageShell>
  );
}
