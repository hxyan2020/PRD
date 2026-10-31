import { Button, Form, Input, Radio, Space, Typography } from 'antd';
import { AdminPageShell } from '../components/AdminPageShell';
import { useUi } from '../i18n/useUi';

const { Text } = Typography;

export function TradeAmountFactorPage() {
  const ui = useUi();
  return (
    <AdminPageShell title={ui.pageTitle('trade-amount-factor')}>
      <div style={{ marginBottom: 24 }}>
        <Space>
          <Text>当前系数: 1</Text>
          <Button size="small">刷新</Button>
          <Button type="primary" size="small">
            {ui.t('编辑', 'Edit')}
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
        <Form.Item label={ui.t('目标系数', 'Target factor')} name="factor">
          <Input />
        </Form.Item>
        <Form.Item label={ui.t('生效模式', 'Effective mode')} name="mode">
          <Radio.Group>
            <Radio value="immediate">立即生效</Radio>
            <Radio value="smooth">平滑过渡</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label={ui.t('调整间隔时间', 'Adjust interval')} name="interval">
          <Space>
            <Input style={{ width: 80 }} />
            <span>分钟</span>
          </Space>
        </Form.Item>
        <Form.Item label={ui.t('调整幅度', 'Adjust step')} name="step">
          <Input style={{ width: 120 }} />
        </Form.Item>
      </Form>
    </AdminPageShell>
  );
}
