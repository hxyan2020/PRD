import { Button, DatePicker, Form, Input, Select } from 'antd';
import { AdminPageShell } from '../components/AdminPageShell';
import { useUi } from '../i18n/useUi';
import { contractNameOptions } from '../mock/data';

export function KLineManagePage() {
  const ui = useUi();
  return (
    <AdminPageShell title={ui.pageTitle('kline-manage')}>
      <Form layout="inline" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
        <Form.Item label={ui.t('交易对', 'Pair')} required>
          <Select placeholder={ui.pleaseSelect} style={{ width: 160 }} options={contractNameOptions} />
        </Form.Item>
        <Form.Item label={ui.t('周期', 'Period')} required>
          <Select placeholder={ui.pleaseSelect} style={{ width: 120 }} options={[{ value: '1m', label: '1m' }, { value: '5m', label: '5m' }, { value: '1h', label: '1h' }]} />
        </Form.Item>
        <Form.Item
          label={ui.t('窗口时间', 'Window')}
          extra="可选。留空则修改该交易对、周期下最新一根 K 线；填写则定位到对应时间点的 K 线蜡烛进行修改。"
        >
          <DatePicker showTime style={{ width: 200 }} />
        </Form.Item>
        <Form.Item label={ui.t('修改属性', 'Modified field')} required>
          <Select placeholder={ui.pleaseSelect} style={{ width: 120 }} options={[{ value: 'open', label: 'open' }, { value: 'close', label: 'close' }]} />
        </Form.Item>
        <Form.Item label={ui.t('修改属性值', 'Modified value')} required>
          <Input placeholder={ui.pleaseInput} style={{ width: 140 }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary">修改K线</Button>
        </Form.Item>
      </Form>
      <div style={{ minHeight: 360 }} />
    </AdminPageShell>
  );
}
