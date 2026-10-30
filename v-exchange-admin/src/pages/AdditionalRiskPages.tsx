import { useMemo, useState } from 'react'
import { Alert, Button, Form, Input, InputNumber, Modal, Select, Table, Tag, message } from 'antd'
import { PageFrame } from '../components/PageFrame'

type Rule={key:string;symbol:string;metric:string;threshold:number;unit:string;window:number;severity:string;enabled:boolean;group:string}
type Config={title:string;metric:string;unit:string;xau:number;btc:number;window:number;reason:string;details:string}
const configs:Record<string,Config>={
 'market-price-limit':{title:'Market Price Limit / 市价单价格保护',metric:'市价单最大价格偏离',unit:'%',xau:0.3,btc:0.5,window:10,reason:'XAUUSD 0.3%、BTCUSD 0.5%：限制市价单异常成交；应按深度和波动率回测。',details:'计算订单预估成交价相对有效 Mark/Index 的偏离；保护动作与价格预警需分离。'},
 'reserve-list':{title:'Risk Reserve List / 风险储备监控',metric:'储备覆盖倍数下限',unit:'倍',xau:1.5,btc:1.5,window:60,reason:'储备至少覆盖压力情景需求的 1.5 倍作为观察线；真实金额取决于压力测试。',details:'展示保险基金、DB 资金和可用储备的监控规则；不要将这些资金混为同一账户。'},
 'reserve-detail':{title:'Risk Reserve Detail / 风险储备明细',metric:'储备日内下降幅度',unit:'%',xau:10,btc:10,window:60,reason:'10% 日内下降先预警；应结合基金规模、异常强平及资金调拨回测。',details:'关注储备流入、流出、账户权益和异常变动的可审计明细。'},
 'trading-restriction':{title:'Trading Restriction / 交易限制',metric:'单账户新增仓位名义金额',unit:'USD',xau:100000,btc:200000,window:60,reason:'初始观察值需结合分级保证金、账户限额和订单簿冲击，不能直接作为生产硬限制。',details:'交易限制应明确合约、用户范围、持续时间、审批和恢复条件。'},
 'spread-alert':{title:'Spread Alert / 买卖价差监控',metric:'最优买卖价差占中间价',unit:'%',xau:0.2,btc:0.1,window:30,reason:'黄金与 BTC 流动性结构不同，阈值按时段、报价源和历史价差分位数校准。',details:'Spread=(Best Ask-Best Bid)/Mid；需剔除异常或过期报价。'},
 'no-trade-monitor':{title:'No Trade Monitor / 无成交监控',metric:'连续无成交时长',unit:'秒',xau:300,btc:120,window:30,reason:'BTC 更活跃，先用较短窗口；XAU 需考虑休市及低流动性时段，避免误报。',details:'无成交必须结合订单、活跃用户、交易时段和撮合引擎健康度综合判断。'},
 'depth-monitor':{title:'Depth Monitor / 订单簿深度监控',metric:'±0.5% 价格范围内双边深度下限',unit:'USD',xau:100000,btc:200000,window:30,reason:'按预计清算冲击、做市承接能力和市场深度校准；单边深度也应独立监控。',details:'统计 Mark 中心 ±0.5% 内有效挂单名义价值，排除自成交、过期与异常订单。'},
 'funding-fee-list':{title:'Funding Fee List / 资金费流水',metric:'单周期费率异常偏离',unit:'%',xau:0.02,btc:0.03,window:300,reason:'XAUUSD 0.02%/8h、BTCUSD 0.03%/8h 为观察值，跨结算周期先标准化。',details:'本页展示演示监控规则；真实资金费流水需从结算账本读取并对账。'},
}
export function AdditionalRiskPage({page}:{page:string}){
 const cfg=configs[page]||configs['spread-alert']
 const [rows,setRows]=useState<Rule[]>(['XAUUSD','BTCUSD'].map((symbol,i)=>({key:symbol,symbol,metric:cfg.metric,threshold:i?cfg.btc:cfg.xau,unit:cfg.unit,window:cfg.window,severity:'P2',enabled:true,group:''})))
 const [symbol,setSymbol]=useState('全部')
 const [editing,setEditing]=useState<Rule|null>(null)
 const [open,setOpen]=useState(false)
 const [form]=Form.useForm()
 const data=useMemo(()=>rows.filter(x=>symbol==='全部'||x.symbol===symbol),[rows,symbol])
 const save=async()=>{try{const v=await form.validateFields();const row:Rule={key:editing?.key||String(Date.now()),symbol:v.symbol,metric:cfg.metric,threshold:Number(v.threshold),unit:cfg.unit,window:Number(v.window),severity:v.severity,enabled:editing?.enabled??true,group:v.group||''};setRows(old=>editing?old.map(x=>x.key===editing.key?row:x):[...old,row]);setOpen(false);message.info('仅保存当前页面演示状态，未连接生产监控')}catch{}}
 return <PageFrame title={cfg.title}>
  <Alert type="info" showIcon style={{marginBottom:14}} message="演示配置 / 非生产实时数据" description={cfg.details+' 推荐理由：'+cfg.reason}/>
  <div style={{display:'flex',gap:12,justifyContent:'space-between',marginBottom:12}}>
   <Select value={symbol} onChange={setSymbol} style={{width:160}} options={['全部','XAUUSD','BTCUSD'].map(value=>({value,label:value}))}/>
   <Button type="primary" onClick={()=>{setEditing(null);form.resetFields();setOpen(true)}}>增加监控</Button>
  </div>
  <Table rowKey="key" size="small" bordered dataSource={data} scroll={{x:1050}} columns={[
   {title:'合约',dataIndex:'symbol',width:120},{title:'监控指标',dataIndex:'metric',width:270},
   {title:'告警阈值（演示建议）',width:190,render:(_,r:Rule)=>r.threshold+' '+r.unit},
   {title:'检查窗口（秒）',dataIndex:'window',width:130},{title:'级别',dataIndex:'severity',width:90},
   {title:'状态',width:110,render:(_,r:Rule)=>r.enabled?<Tag color="green">开启</Tag>:<Tag>关闭</Tag>},
   {title:'操作',width:160,render:(_,r:Rule)=><><Button type="link" onClick={()=>{setEditing(r);form.setFieldsValue(r);setOpen(true)}}>编辑</Button><Button type="link" onClick={()=>setRows(x=>x.map(y=>y.key===r.key?{...y,enabled:!y.enabled}:y))}>{r.enabled?'停用':'启用'}</Button></>}
  ]}/>
  <Modal title={editing?'编辑监控（演示）':'新增监控（演示）'} open={open} onCancel={()=>setOpen(false)} onOk={save}>
   <Form form={form} layout="vertical">
    <Form.Item name="symbol" label="合约" rules={[{required:true}]}><Select options={['XAUUSD','BTCUSD'].map(value=>({value,label:value}))}/></Form.Item>
    <Form.Item name="threshold" label={'告警阈值（'+cfg.unit+'）'} rules={[{required:true}]}><InputNumber style={{width:'100%'}} min={0}/></Form.Item>
    <Form.Item name="window" label="检查窗口（秒）" rules={[{required:true}]}><InputNumber min={1} style={{width:'100%'}}/></Form.Item>
    <Form.Item name="severity" label="告警级别" initialValue="P2"><Select options={['P0','P1','P2','P3'].map(value=>({value,label:value}))}/></Form.Item>
    <Form.Item name="group" label="通知群（仅展示，不发送）"><Input placeholder="Lark Webhook / 值班群"/></Form.Item>
   </Form>
  </Modal>
 </PageFrame>
}
