import { Button, Form, Input, Modal, Switch, Table, Tag, message } from 'antd'
import { useState } from 'react'
import { PageFrame } from '../components/PageFrame'

export function RiskFundingFeeChangePage() {
  const [editing, setEditing] = useState(false)
  const [form] = Form.useForm()
  return <PageFrame title="资金费率修改">
    <Table rowKey="contract" size="small" bordered dataSource={[]}
      columns={[
        { title: '合约名称', dataIndex: 'contract' },
        { title: '本期结算费率', dataIndex: 'rate' },
        { title: '是否启用', dataIndex: 'enabled' },
        { title: '操作', render: () => <Button onClick={() => setEditing(true)}>编辑</Button> },
      ]} locale={{emptyText:'No data'}} pagination={false} />
    <Modal title="资金费率修改" open={editing} onCancel={() => setEditing(false)} onOk={async()=>{try{await form.validateFields();message.info('仅为演示界面，不会修改生产数据');setEditing(false)}catch{}}}>
      <Form form={form} layout="vertical"><Form.Item name="contract" label="合约名称" rules={[{required:true}]}><Input /></Form.Item>
      <Form.Item name="rate" label="本期结算费率" rules={[{required:true}]}><Input /></Form.Item></Form>
    </Modal>
  </PageFrame>
}

export function RiskLiquidationSwitchPage() {
  const [enabled, setEnabled] = useState(true)
  const [pending, setPending] = useState(false)
  return <PageFrame title="强平引擎开关">
    <Table rowKey="type" size="small" bordered pagination={false}
      dataSource={[{type:'强平引擎开关设置',updated:'2026-10-29 23:43:47',operator:'SYSTEM'}]}
      columns={[
        {title:'类型',dataIndex:'type'},
        {title:'更新时间',dataIndex:'updated'},
        {title:'操作人员',dataIndex:'operator'},
        {title:'状态',render:()=>enabled?<Tag color="success">开启</Tag>:<Tag>关闭</Tag>},
        {title:'操作',render:()=> <Button onClick={()=>setPending(true)}>{enabled?'关闭':'开启'}</Button>}
      ]} />
    <Modal title="强平引擎开关（演示）" open={pending} onCancel={()=>setPending(false)}
      onOk={()=>{setEnabled(!enabled);setPending(false);message.info('仅变更演示页面状态，未触达生产系统')}}>
      <p>高风险生产操作，真实执行须经授权审批。本页面仅展示截图对应的开关布局。</p>
      <Switch checked={enabled} disabled /> 当前状态：{enabled?'开启':'关闭'}
    </Modal>
  </PageFrame>
}
