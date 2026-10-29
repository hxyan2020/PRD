import { Button, Form, InputNumber, Radio, Space, Typography } from 'antd'
import { PageFrame } from '../components/PageFrame'
import { tradeAmountFactorConfig } from '../mock/data'
import { fh } from '../components/FieldHelpLabel'

const { Text, Paragraph } = Typography

export function TradeAmountFactorPage() {
  const [form] = Form.useForm()

  return (
    <PageFrame title="交易量系数配置">
      <Space style={{ marginBottom: 16 }} align="center">
        <Text>
          当前系数：<Text strong>{tradeAmountFactorConfig.currentFactor}</Text>
        </Text>
        <Button>刷新</Button>
        <Button type="primary">编辑</Button>
      </Space>
      <Paragraph type="danger" style={{ maxWidth: 900, marginBottom: 24 }}>
        24小时交易量数据将乘以该系数，作用于内部行情/交易页、合约概览及 CMC、Coingecko 等外部平台（U本位与币本位均生效）。
      </Paragraph>
      <Form
        form={form}
        layout="vertical"
        style={{ maxWidth: 480 }}
        initialValues={{
          targetFactor: tradeAmountFactorConfig.targetFactor,
          effectiveMode: tradeAmountFactorConfig.effectiveMode,
          adjustmentIntervalMinutes: tradeAmountFactorConfig.adjustmentIntervalMinutes,
          adjustmentAmplitude: tradeAmountFactorConfig.adjustmentAmplitude,
        }}
      >
        <Form.Item label={fh('目标系数')} name="targetFactor" rules={[{ required: true }]}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label={fh('生效模式')} name="effectiveMode" rules={[{ required: true }]}>
          <Radio.Group>
            <Radio value="immediate">立即生效</Radio>
            <Radio value="smooth">平滑过渡</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label={fh('调整间隔时间')} name="adjustmentIntervalMinutes" rules={[{ required: true }]}>
          <InputNumber min={1} addonAfter="分钟" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label={fh('调整幅度')} name="adjustmentAmplitude" rules={[{ required: true }]}>
          <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </PageFrame>
  )
}
