import { useState } from 'react'
import { Button, Form, Input, Modal, Table, Tabs, Tag, message } from 'antd'
import { PageFrame } from '../components/PageFrame'

type Rule={key:string;value:string;group:string;enabled:boolean;updated:string;operator:string}
const demoRules:Rule[]=[{key:'1',value:'100000',group:'',enabled:true,updated:'2026-09-22 13:38:13',operator:'DEMO'}]
function RuleManager({adl=false}:{adl?:boolean}){
 const [rows,setRows]=useState<Rule[]>(adl?[{...demoRules[0],value:'ADL失败，重试中'}]:demoRules)
 const [open,setOpen]=useState(false)
 const [editing,setEditing]=useState<Rule|null>(null)
 const [form]=Form.useForm()
 const save=async()=>{try{
  const v=await form.validateFields()
  const row:Rule={key:editing?.key??String(Date.now()),value:adl?'ADL失败，重试中':String(v.value),group:v.group,enabled:editing?.enabled??true,updated:'演示数据',operator:'DEMO'}
  setRows(old=>editing?old.map(x=>x.key===editing.key?row:x):[...old,row])
  setOpen(false);message.info('仅更新演示界面，不影响生产监控')
 }catch{}}
 return <><div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}><Button type="primary" onClick={()=>{setEditing(null);form.resetFields();setOpen(true)}}>＋ 增加监控</Button></div>
  <Table size="small" rowKey="key" pagination={{pageSize:20}} dataSource={rows} columns={[
   {title:adl?'告警类型':'爆仓通知仓位价值阈值（USD）',dataIndex:'value'},
   {title:'更新时间',dataIndex:'updated'},{title:'更新人',dataIndex:'operator'},
   {title:'状态',render:(_,r:Rule)=>r.enabled?<Tag color="success">生效中</Tag>:<Tag>已停用</Tag>},
   {title:'操作',render:(_,r:Rule)=><><Button type="link" onClick={()=>setRows(x=>x.map(a=>a.key===r.key?{...a,enabled:!a.enabled}:a))}>{r.enabled?'停用':'启用'}</Button><Button type="link" onClick={()=>{setEditing(r);form.setFieldsValue({value:r.value,group:r.group});setOpen(true)}}>编辑</Button></>}
  ]}/>
  <Modal title={editing?'编辑 — 监控配置':'新增 — 监控配置'} open={open} onCancel={()=>setOpen(false)} onOk={save} okText="确定">
   <Form form={form} layout="vertical">
    {!adl&&<Form.Item name="value" label="爆仓通知仓位价值阈值" rules={[{required:true,message:'请输入阈值'}]}><Input type="number" addonAfter="USD"/></Form.Item>}
    <Form.Item name="group" label="预警群" rules={[{required:true,message:'请输入 Lark 机器人 URL'}]}><Input.TextArea rows={3} placeholder="填写 Lark 机器人 URL，多个 URL 使用英文逗号分隔"/></Form.Item>
   </Form>
  </Modal>
 </>
}
function Alerts({adl=false}:{adl?:boolean}){
 return <Table size="small" rowKey="key" dataSource={[]} locale={{emptyText:'暂无数据'}} columns={adl?[
 {title:'告警类型',dataIndex:'type'},{title:'告警时间',dataIndex:'time'},{title:'告警方式',dataIndex:'channel'}
 ]:[{title:'爆仓仓位价值（USD）',dataIndex:'value'},{title:'告警时间',dataIndex:'time'},{title:'告警方式',dataIndex:'channel'}]}/>
}
export function LargeLiquidationNotifyPage(){
 return <PageFrame title="大额爆仓后通知"><Tabs items={[{key:'record',label:'告警记录',children:<Alerts/>},{key:'config',label:'监控配置',children:<RuleManager/>}]} defaultActiveKey="config"/></PageFrame>
}
export function AdlFailurePage(){
 return <PageFrame title="ADL异常记录"><Tabs items={[{key:'record',label:'告警记录',children:<Alerts adl/>},{key:'config',label:'监控配置',children:<RuleManager adl/>}]} /></PageFrame>
}
