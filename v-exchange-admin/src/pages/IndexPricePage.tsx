import { Button, Checkbox, Form, InputNumber, Modal, Radio, Select, Space, Switch, Table, Tag, message } from 'antd'
import { useState } from 'react'
import { DownloadOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { PageFrame } from '../components/PageFrame'
import { QueryResetButtons } from '../components/QueryResetButtons'
import { indexPriceRecords } from '../mock/data'

export function IndexPricePage() {
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [editing, setEditing] = useState(false)
  const [trial, setTrial] = useState(false)
  const [calcMethod, setCalcMethod] = useState('manual')
  const [weightsVisible, setWeightsVisible] = useState(false)
  const sourceNames = ['BINANCE', 'OKEX', 'BITGET', 'BYBIT', 'BINANCE_INDEX', 'OKEX_INDEX', 'BYBIT_INDEX', 'BITGET_INDEX', 'LMAX', 'ISPRIME', 'STARPRIME', 'VELOCITY', 'RC_INDEX']
  const openEditor = (record?: (typeof indexPriceRecords)[number]) => {
    const method = record?.calcMethod.includes('手动') ? 'manual' : 'volume'
    setCalcMethod(method)
    setTrial(false)
    editForm.setFieldsValue({
      baseCoin: record?.baseCoin ?? 'XAU', quoteCoin: record?.quoteCoin ?? 'USD',
      subscriptionCoin: record?.subscriptionCoin ?? 'XAU',
      precision: Number(record?.pricePrecision.split(' ')[0] ?? 2),
      minSources: record?.minSourceCount ?? 2,
      enabled: record?.enabled ?? true, medianEnabled: true, medianThreshold: 1,
      deviationHandling: 'correct', calcMethod: method,
      sources: (record?.priceSources ?? '').split(', ').filter(Boolean),
      whitelist: (record?.whitelist ?? '').split(', ').filter(Boolean),
      weights: { BINANCE_INDEX: 0.4, OKEX_INDEX: 0.2, BYBIT_INDEX: 0.2, BITGET_INDEX: 0.2, LMAX: 3, ISPRIME: 3, STARPRIME: 1.5, VELOCITY: 1.5, RC_INDEX: 90 }
    })
    setEditing(true)
  }

  const columns = [
    { title: '指数名称', dataIndex: 'indexName', width: 100 },
    { title: '基础币种', dataIndex: 'baseCoin', width: 90 },
    { title: '计价币种', dataIndex: 'quoteCoin', width: 90 },
    { title: '价格精度', dataIndex: 'pricePrecision', width: 100 },
    { title: '最小行情源数', dataIndex: 'minSourceCount', width: 110 },
    { title: '行情源', dataIndex: 'priceSources', width: 220, ellipsis: true },
    {
      title: '行情源交易量白名单',
      dataIndex: 'whitelist',
      width: 180,
      render: (text: string) => (
        <Space>
          <span>{text}</span>
          <Button type="link" size="small">
            编辑白名单
          </Button>
        </Space>
      ),
    },
    { title: '计算方式', dataIndex: 'calcMethod', width: 160 },
    { title: '订阅币种', dataIndex: 'subscriptionCoin', width: 90 },
    { title: '放大倍数', dataIndex: 'magnification', width: 90 },
    {
      title: '是否启用',
      dataIndex: 'enabled',
      width: 90,
      render: (enabled: boolean) =>
        enabled ? <Tag color="success">启用</Tag> : <Tag color="error">禁用</Tag>,
    },
    {
      title: '操作记录',
      key: 'record',
      width: 100,
      render: () => (
        <Button type="link" size="small" icon={<EyeOutlined />}>
          查看
        </Button>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: (typeof indexPriceRecords)[number]) => <Button type="primary" size="small" onClick={() => openEditor(record)}>编辑</Button>,
    },
  ]

  return (
    <PageFrame
      extra={
        <Space wrap>
          <Button danger>批量获取行情源</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>添加</Button>
          <Button type="primary" icon={<DownloadOutlined />}>
            指数价格权重详情下载
          </Button>
          <Button type="primary" icon={<DownloadOutlined />}>
            指数差异详情下载
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="inline" style={{ marginBottom: 16, rowGap: 12 }}>
        <Form.Item label="基础币种" name="base">
          <Select placeholder="请选择" allowClear style={{ width: 120 }} />
        </Form.Item>
        <Form.Item label="计价币种" name="quote">
          <Select placeholder="请选择" allowClear style={{ width: 120 }} />
        </Form.Item>
        <Form.Item label="状态" name="status">
          <Select placeholder="请选择" allowClear style={{ width: 120 }} />
        </Form.Item>
        <Form.Item label="计算方式" name="calc">
          <Select placeholder="请选择" allowClear style={{ width: 160 }} />
        </Form.Item>
        <Form.Item label="行情源" name="source">
          <Select placeholder="请选择" allowClear style={{ width: 140 }} />
        </Form.Item>
        <Form.Item label="权重展示开关">
          <Switch checked={weightsVisible} onChange={setWeightsVisible} />
        </Form.Item>
        <Form.Item>
          <QueryResetButtons onReset={() => form.resetFields()} />
        </Form.Item>
      </Form>
      {weightsVisible && <div style={{ marginBottom: 12 }}>XAUUSD 权重详情可在编辑窗口查看。</div>}
      <Table
        rowKey="indexName"
        size="small"
        bordered
        scroll={{ x: 2000 }}
        columns={columns}
        dataSource={indexPriceRecords}
        pagination={{ total: 2, showTotal: (t) => `共 ${t} 条`, pageSize: 10 }}
      />
      <Modal title="修改指数价格" open={editing} width={760} okText="修改审核" onCancel={() => setEditing(false)}
        onOk={async () => { try { await editForm.validateFields(); if (!trial) { message.warning('请先试算'); return } message.success('演示界面校验通过（未提交生产后台）'); setEditing(false) } catch { message.error('请检查必填字段') } }}>
        <Form form={editForm} layout="vertical" onValuesChange={() => setTrial(false)}>
          <Space wrap>
            <Form.Item name="baseCoin" label="基础货币"><Select style={{width:110}} options={[{value:'XAU'},{value:'BTC'}]} /></Form.Item>
            <Form.Item name="quoteCoin" label="计价货币"><Select style={{width:110}} options={[{value:'USD'}]} /></Form.Item>
            <Form.Item name="subscriptionCoin" label="订阅币种"><Select style={{width:110}} options={[{value:'XAU'},{value:'BTC'}]} /></Form.Item>
            <Form.Item name="precision" label="价格精度"><InputNumber min={0} max={12}/></Form.Item>
            <Form.Item name="minSources" label="最小行情源数"><InputNumber min={1}/></Form.Item>
          </Space>
          <Form.Item name="enabled" label="是否启用" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item name="medianEnabled" label="中位数偏离控制开关" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item name="medianThreshold" label="中位数偏离比例"><InputNumber min={0} addonAfter="%" /></Form.Item>
          <Form.Item name="deviationHandling" label="超出偏离值的调整机制"><Radio.Group options={[{label:'直接剔除',value:'exclude'},{label:'修正后纳入计算',value:'correct'}]} /></Form.Item>
          <Form.Item name="calcMethod" label="计算方式"><Radio.Group onChange={e => setCalcMethod(e.target.value)} options={[{label:'几何平均计算',value:'geometric'},{label:'手动设置权重计算',value:'manual'},{label:'交易量自动权重计算',value:'volume'}]} /></Form.Item>
          <Form.Item name="sources" label="行情源"><Checkbox.Group options={sourceNames} /></Form.Item>
          {calcMethod === 'manual' && <div style={{padding:12,border:'1px solid #eee',marginBottom:12}}><strong>各行情源交易量加权系数</strong><Space wrap style={{display:'flex',marginTop:12}}>
            {['BINANCE_INDEX','OKEX_INDEX','BYBIT_INDEX','BITGET_INDEX','LMAX','ISPRIME','STARPRIME','VELOCITY','RC_INDEX'].map(name =>
              <Form.Item key={name} label={name} name={['weights',name]}><InputNumber min={0} step={0.1} style={{width:110}} /></Form.Item>)}
          </Space></div>}
          <Form.Item name="whitelist" label="行情源交易量白名单"><Checkbox.Group options={sourceNames} /></Form.Item>
          <Button type="primary" onClick={() => {setTrial(true);message.info('演示试算：未连接真实行情服务')}}>试算</Button>
          <span style={{marginLeft:12,color:trial?'green':'#cf1322'}}>{trial?'演示试算完成':'请先完成试算，再操作保存'}</span>
          <div style={{marginTop:12,color:'#cf1322'}}>建议先在测试环境模拟极端行情演练，确定无异常再到线上配置。</div>
        </Form>
      </Modal>
    </PageFrame>
  )
}
