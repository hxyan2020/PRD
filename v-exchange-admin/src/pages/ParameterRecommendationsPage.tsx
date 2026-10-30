import { useMemo, useState } from 'react'
import { Alert, Button, Input, Select, Table, Tag, Typography } from 'antd'
import { PageFrame } from '../components/PageFrame'
import { contractRecords, fairPriceRecords, fundingRateRecords, indexPriceRecords, marketSourceRecords } from '../mock/data'

type Item={key:string;group:string;field:string;symbol:string;old:string;recommended:string;reason:string;priority:'P1'|'P2';basis:string}
const old=(x:unknown)=>x===undefined||x===null||x===''?'未提供':String(x)
const index=(symbol:string)=>indexPriceRecords.find(x=>x.indexName===symbol)
const fair=(symbol:string)=>fairPriceRecords.find(x=>x.contractName.startsWith(symbol==='XAUUSD'?'XAU':'BTC'))
const funding=(symbol:string)=>fundingRateRecords.find(x=>x.contract.startsWith(symbol==='XAUUSD'?'XAU':'BTC'))
const contract=(symbol:string)=>contractRecords.find(x=>x.symbol.startsWith(symbol==='XAUUSD'?'XAU':'BTC'))
const items:Item[]=[]
function add(group:string,field:string,symbol:string,oldValue:unknown,recommended:string,reason:string,priority:'P1'|'P2'='P2',basis='后台 Mock 数据'){
 items.push({key:String(items.length+1),group,field,symbol,old:old(oldValue),recommended,reason,priority,basis})
}
for(const symbol of ['XAUUSD','BTCUSD']){
 const i=index(symbol),f=fair(symbol),r=funding(symbol),c=contract(symbol)
 add('价格管理 / Index','最小行情源数',symbol,i?.minSourceCount,'≥3 个独立健康源','减少单源故障或操纵导致的指数失真；源不足时触发降级告警。','P1')
 add('价格管理 / Index','价格精度',symbol,i?.pricePrecision,symbol==='XAUUSD'?'2 位（0.01 USD）':'1 位（0.1 USD）','与现有 tick size 保持一致，避免精度错配。')
 add('价格管理 / Index','中位数偏离比例',symbol,'未见独立快照',symbol==='XAUUSD'?'0.30%（试运行）':'0.50%（试运行）','先识别异常源，再按历史价差分位数和极端行情回测；不建议直接用于强平。','P1','页面编辑默认值并非生产值')
 add('价格管理 / Index','超出偏离值的调整机制',symbol,'未见独立快照','优先剔除异常源并告警','避免把离群价格修正后继续污染指数；确保健康源数量充足。','P1','未核实生产配置')
 add('价格管理 / Index','指数计算方式',symbol,i?.calcMethod,symbol==='XAUUSD'?'保留人工权重，增加集中度上限和异常源剔除':'保留成交量加权，增加单源权重上限','黄金报价源成交量不可直接等同交易所现货成交量；BTC 交易量可比性较好。','P1')
 add('价格管理 / Fair Price','基差移动平均周期',symbol,f?.basisMaPeriod+' 秒',symbol==='XAUUSD'?'60 秒':'30 秒','黄金减少报价噪声；BTC 缩短对快速市场变化的响应，需回测延迟。')
 add('价格管理 / Fair Price','期现价差阈值比例',symbol,f?.spreadThreshold,symbol==='XAUUSD'?'0.30%（预警）':'0.50%（预警）','将异常预警与实际保护动作分离，避免因单一阈值触发错误强平。','P1')
 add('价格管理 / Fair Price','观察阈值',symbol,f?.observeThreshold+' 秒',symbol==='XAUUSD'?'30 秒':'10 秒','异常持续一段时间才升级，平衡噪声与响应速度。')
 add('价格管理 / Fair Price','恢复阈值',symbol,f?.recoveryThreshold+' 秒',symbol==='XAUUSD'?'120 秒':'60 秒','设置恢复滞后，减少反复进入/退出保护模式。')
 add('价格管理 / Funding','资金费率收取周期',symbol,r?.periodHours+' 小时','维持现有周期；比较时统一换算到 8 小时','避免更改结算频率影响客户预期；XAU 4h 与 BTC 8h 不可直接比较原始费率。','P1')
 add('价格管理 / Funding','费率浮动上限',symbol,r?.upperLimit,symbol==='XAUUSD'?'+0.05% / 4h（相当于 +0.10% / 8h）':'+0.15% / 8h','先限制极端费率，按结算周期换算；需验证资金费公式与风控影响。','P1')
 add('价格管理 / Funding','费率浮动下限',symbol,r?.lowerLimit,symbol==='XAUUSD'?'-0.05% / 4h（相当于 -0.10% / 8h）':'-0.15% / 8h','与上限对称，防止单边资金费用异常；最终需由 Pricing 与 RC 审核。','P1')
 add('价格管理 / Funding','自动调整资金费率',symbol,r?.autoAdjust?'开启':'关闭','暂维持关闭；先影子运行','新交易所缺少可靠历史数据，先积累观测、验证计算与上限保护。')
 add('合约管理','价格最小变动单位',symbol,c?.minTick,symbol==='XAUUSD'?'0.01 USD':'0.1 USD','维持当前精度，待订单簿深度和最小报价单位验证后再调整。')
 add('合约管理','最大杠杆',symbol,c?.leverage,'先保持现值并按仓位阶梯复核','不在缺乏 IMR/MMR、保险基金及压力测试时直接提高杠杆。','P1')
 add('风险管理 / 爆仓','大额爆仓后通知阈值',symbol,'截图示例：100,000 USD',symbol==='XAUUSD'?'100,000 USD':'200,000 USD','BTC 可按更高名义价值试运行；以承接容量、订单簿冲击和压力测试校准。','P1','截图仅显示规则示例，非合约级生产确认')
 add('风险管理 / 爆仓','大额爆仓预警阈值',symbol,'未确认合约级当前值',symbol==='XAUUSD'?'100,000 USD':'200,000 USD','按预期滑点与可承接流动性设定，区分爆仓前预警和爆仓后通知。','P1','缺少可核实生产参数')
 add('做市 / DB','DB 大额接仓预警',symbol,'截图示例：300,000 / 500,000 USD',symbol==='XAUUSD'?'100,000 USD':'200,000 USD','先使用保守观察阈值，后续依据 DB 可用资金、市场深度及单笔冲击调节。','P1','截图为账户级规则，建议值为按合约分层的二期方案')
 add('做市 / DB','DB 长时间持仓预警',symbol,'截图示例：5 / 10 分钟',symbol==='XAUUSD'?'5 分钟':'3 分钟','及时识别接仓后未能对冲或出清的风险；按实际做市流动性回测。','P1','截图为账户级规则，建议值为按合约分层的二期方案')
 add('告警配置','资金费率偏离预警',symbol,'未核实合约级当前值',symbol==='XAUUSD'?'0.02% / 8h':'0.03% / 8h','同周期标准化后比较外部可比市场；先观察误报率再定生产阈值。')
 add('告警配置','资金费率检查频率',symbol,'未核实','5 分钟（结算前可 1 分钟）','降低计算负担，结算窗口加密检查。')
}
add('价格管理 / Market Source','异常源观察期','XAUUSD',marketSourceRecords.find(x=>x.marketName==='LMAX')?.observationSeconds+' 秒','30 秒（试运行）','在确认行情推送频率后缩短异常识别时间；避免因瞬时抖动误剔除。')
add('价格管理 / Market Source','异常源恢复期','XAUUSD',marketSourceRecords.find(x=>x.marketName==='LMAX')?.reenableSeconds+' 秒','120 秒（试运行）','恢复期应长于异常识别期，减少反复切换。')
add('价格管理 / Market Source','异常源观察期','BTCUSD',marketSourceRecords.find(x=>x.marketName==='BINANCE')?.observationSeconds+' 秒','10 秒（试运行）','高频报价环境可较快识别断流，但需按延迟分布回测。')
add('价格管理 / Market Source','异常源恢复期','BTCUSD',marketSourceRecords.find(x=>x.marketName==='BINANCE')?.reenableSeconds+' 秒','60 秒（试运行）','增加恢复稳定性检查，避免刚恢复就再次失效。')
add('做市 / DB','自动注资水位线','共用 DB 账户','截图示例：40,000 USD','压力场景预计接仓需求 × 1.5','资金需求取决于持仓、波动和滑点，不能仅凭固定金额建议替换。','P1','截图示例，不等于已核实生产配置')
add('做市 / DB','注资目标水位线','共用 DB 账户','截图示例：200,000 USD','压力场景预计接仓需求 × 2–3','覆盖连续爆仓及对冲延迟，并核对资金划拨限额。','P1','截图示例，不等于已核实生产配置')
add('告警配置','DB 心跳预警','共用 DB 账户','截图仅确认已配置，未确认阈值','15 秒预警 / 30 秒升级（待测）','需以实际心跳周期、网络延迟和故障演练结果校准。','P1','缺少可核实生产阈值')

export function ParameterRecommendationsPage(){
 const [symbol,setSymbol]=useState('全部')
 const [group,setGroup]=useState('全部')
 const [query,setQuery]=useState('')
 const data=useMemo(()=>items.filter(x=>(symbol==='全部'||x.symbol===symbol)&&(group==='全部'||x.group===group)&&[x.field,x.reason,x.recommended].join(' ').toLowerCase().includes(query.toLowerCase())),[symbol,group,query])
 const groups=Array.from(new Set(items.map(x=>x.group)))
 const download=()=>{
  const csv=[['模块','字段','合约','旧参数/参考值','新参数（建议）','推荐原因','优先级','旧值依据'],...data.map(x=>[x.group,x.field,x.symbol,x.old,x.recommended,x.reason,x.priority,x.basis])].map(a=>a.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n')
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'})
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='VExchange_Parameter_Recommendations.csv';a.click();URL.revokeObjectURL(url)
 }
 return <PageFrame title="推荐参数列表">
  <Alert showIcon type="warning" style={{marginBottom:16}} message="仅供 RC Product、Pricing、Risk Ops、Admin Ops/BIT 评审；不是生产参数变更指令。" description="旧参数优先来自本项目截图对应的 Mock 数据；无法核实的值明确标记。新参数为未经回测的初始建议，须经数据验证、负责人审批、UAT 和回滚预案后方可实施。" />
  <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>
   <Select value={symbol} onChange={setSymbol} style={{width:150}} options={['全部','XAUUSD','BTCUSD','共用 DB 账户'].map(value=>({value,label:value}))}/>
   <Select value={group} onChange={setGroup} style={{width:240}} options={['全部',...groups].map(value=>({value,label:value}))}/>
   <Input.Search allowClear placeholder="搜索字段或建议原因" value={query} onChange={e=>setQuery(e.target.value)} style={{width:250}}/>
   <Button onClick={download}>导出 CSV</Button>
  </div>
  <Typography.Text type="secondary">共 {data.length} 条建议 · P1 表示优先评审，并非直接上线</Typography.Text>
  <Table style={{marginTop:12}} rowKey="key" size="small" bordered scroll={{x:1500}} dataSource={data} pagination={{pageSize:20,showSizeChanger:true}} columns={[
   {title:'模块',dataIndex:'group',width:190},{title:'字段',dataIndex:'field',width:210},{title:'合约',dataIndex:'symbol',width:120},
   {title:'旧参数 / 参考值',dataIndex:'old',width:230},{title:'新参数（建议）',dataIndex:'recommended',width:290},
   {title:'新参数推荐原因',dataIndex:'reason',width:420},{title:'优先级',dataIndex:'priority',width:85,render:(x:string)=><Tag color={x==='P1'?'orange':'default'}>{x}</Tag>},
   {title:'旧值依据',dataIndex:'basis',width:230}
  ]}/>
 </PageFrame>
}
