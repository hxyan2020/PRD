import { Button, DatePicker, Form, Input, Select } from 'antd';
import { AdminPageShell } from '../components/AdminPageShell';
import { contractNameOptions } from '../mock/data';

export function KLineManagePage() {
  return (
    <AdminPageShell title="K线管理">
      <Form layout="inline" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
        <Form.Item label="交易对" required>
          <Select placeholder="请选择" style={{ width: 160 }} options={contractNameOptions} />
        </Form.Item>
        <Form.Item label="周期" required>
          <Select placeholder="请选择" style={{ width: 120 }} options={[{ value: '1m', label: '1m' }, { value: '5m', label: '5m' }, { value: '1h', label: '1h' }]} />
        </Form.Item>
        <Form.Item label="窗口时间" extra="可选 (为空代表修改最后一个点)">
          <DatePicker showTime style={{ width: 200 }} />
        </Form.Item>
        <Form.Item label="修改属性" required>
          <Select placeholder="请选择" style={{ width: 120 }} options={[{ value: 'open', label: 'open' }, { value: 'close', label: 'close' }]} />
        </Form.Item>
        <Form.Item label="修改属性值" required>
          <Input placeholder="请输入" style={{ width: 140 }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary">修改K线</Button>
        </Form.Item>
      </Form>
      <div style={{ minHeight: 360 }} />
    </AdminPageShell>
  );
}
