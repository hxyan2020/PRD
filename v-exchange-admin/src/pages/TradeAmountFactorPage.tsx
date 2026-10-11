import { Button, Form, Input, Radio, Space, Typography } from 'antd';
import { AdminPageShell } from '../components/AdminPageShell';

const { Text } = Typography;

export function TradeAmountFactorPage() {
  return (
    <AdminPageShell title="交易额系数配置">
      <div style={{ marginBottom: 24 }}>
        <Space>
          <Text>当前系数: 1</Text>
          <Button size="small">刷新</Button>
          <Button type="primary" size="small">
            编辑
          </Button>
        </Space>
      </div>
      <Text type="danger" style={{ display: 'block', marginBottom: 24, maxWidth: 900 }}>
        24小时交易额将乘以当前系数。该配置影响内部行情页、交易页、合约概览及 CMC、Coingecko 等外部平台展示的所有 USDT
        本位及币本位交易对成交额。
      </Text>
      <Form
        layout="horizontal"
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 12 }}
        initialValues={{ factor: '1', mode: 'smooth', interval: '1', step: '0.01' }}
        style={{ maxWidth: 720 }}
      >
        <Form.Item label="目标系数" name="factor">
          <Input />
        </Form.Item>
        <Form.Item label="生效模式" name="mode">
          <Radio.Group>
            <Radio value="immediate">立即生效</Radio>
            <Radio value="smooth">平滑过渡</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="调整间隔时间" name="interval">
          <Space>
            <Input style={{ width: 80 }} />
            <span>分钟</span>
          </Space>
        </Form.Item>
        <Form.Item label="调整幅度" name="step">
          <Input style={{ width: 120 }} />
        </Form.Item>
      </Form>
    </AdminPageShell>
  );
}
