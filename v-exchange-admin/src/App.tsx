import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { isPageKey, type PageKey } from './config/menu'
import { AdminLayout } from './layout/AdminLayout'
import { pageComponents } from './pages/registry'


const help: Record<string,string> = {
 '合约名称':'选择监控的交易合约。建议 XAU_USD、BTC_USD 分别配置，避免波动特征混用。',
 '合约':'交易标的；XAUUSD 为黄金永续，BTCUSD 为比特币永续。',
 '对标交易所':'外部比较基准。BTCUSD 推荐 Binance、OKX、Bybit 至少三源；XAUUSD 优先采用真实可比黄金报价源，核实合约口径。',
 '资金费率数值':'外部资金费率观测值。建议先按相同结算周期标准化，再比较。',
 '收取周期 (Hour)':'资金费率结算间隔；跨交易所比较前应统一到同一时间单位。',
 '对标交易所资金费率':'外部平台同期费率，用于检查内部费率偏离。',
 '对标交易所收取周期 (Hour)':'外部平台资金费结算周期；4h、8h 不可直接比较原始费率。',
 '监控阈值':'触发告警的偏离幅度。BTCUSD 初始建议 0.03%/8h；XAUUSD 0.02%/8h，需按历史分布回测。',
 '监控频率':'每隔多久检查。资金费率建议 5 分钟，临近结算可提高至 1 分钟。',
 '监控周期':'监控计算的采样间隔。资金费率建议 5 分钟；应与结算周期分开。',
 '平台资金费率':'本平台计算的资金费率；需与可比外部来源做同周期比较。',
 '监控费率上限':'内部资金费率高于此值触发。BTCUSD 试运行 ±0.15%/8h；XAUUSD ±0.10%/8h，均需回测。',
 '监控费率下限':'内部资金费率低于此值触发；建议与上限对称并允许动态调整。',
 '爆仓预警仓位价值阈值（USD）':'尚未爆仓的大仓位风险预警。XAUUSD 建议 100,000 USD；BTCUSD 200,000 USD，结合流动性分层。',
 '仓位价值阈值（USD）':'超过该名义仓位触发关注。XAUUSD 100,000 USD、BTCUSD 200,000 USD 为试运行建议。',
 '爆仓通知仓位价值阈值':'已完成强平后的大额通知阈值。XAUUSD 建议 100,000 USD，BTCUSD 200,000 USD。',
 '爆仓通知仓位价值阈值（USD）':'已完成强平后的大额通知阈值。XAUUSD 100,000 USD，BTCUSD 200,000 USD。',
 '爆仓通知仓位价值阈值 (USD)':'已完成强平后的大额通知阈值。',
 '爆仓预警MMR阈值':'强平风险预警比例。若定义为保证金覆盖率，建议先在 120% 预警；须确认平台公式。',
 '预警群':'接收告警的 Lark 机器人 Webhook。推荐 Risk Ops 值班群；P0 同步负责人，避免无权限人员访问。',
 '告警群':'接收告警的 Lark 机器人 Webhook；按事件等级路由。',
 '告警类型':'事件类别，用于区分 ADL、强平、资金不足等。',
 '告警时间':'告警触发时间，建议统一显示 UTC 与本地时区。',
 '告警方式':'通知渠道，例如 Lark。',
 '更新时间':'配置最近修改时间，便于审计。',
 '更新人':'最近修改配置的操作者。',
 '状态':'监控规则当前是否启用。',
 '操作':'编辑、启用或停用规则；演示页面不影响生产。',
 '爆仓通知仓位价值阈值（USD）':'单笔或单账户强平名义金额超过阈值即通知；应确认统计口径。',
 '自动注资水位线':'DB 余额低于此值时触发补资。建议设为预计极端接仓需求的 1.5 倍，而非固定照搬。',
 '注资目标水位线':'自动补资后希望达到的余额，建议覆盖极端需求 2–3 倍。',
 '账户权益':'账户净资产，通常为余额加未实现盈亏；判断承接能力。',
 '可转金额':'可从账户转出的资金，不应侵蚀接仓安全缓冲。',
 '持仓名义价值':'当前持仓按标记价格计算的名义金额。',
 '占用保证金':'持仓和订单锁定的保证金；不等于账户全部权益。',
 '账户MMR':'账户维持保证金风险指标；必须核对平台公式和强平方向。',
 '流水类型':'资金变化的业务原因，例如注资、回拨、资金费用、自动减仓。',
 '金额 (USD)':'该笔资金流水的美元金额，正负号表示流入或流出。',
 '合约账户ID':'衍生品账户标识，用于定位强平事件。',
 '持仓信息':'强平关联的交易方向、数量和合约。',
 '仓位模式':'逐仓或全仓；影响风险计算与强平范围。',
 '爆仓仓位价值（USD）':'触发强平的仓位名义价值，非实际亏损额。'
}
function helpText(label:string):string {
 const k=label.replace(/[＊*:：]/g,'').trim().replace(/\s+/g,' ')
 if(help[k])return help[k]
 const found=Object.keys(help).find(x=>k.includes(x)||x.includes(k))
 return found?help[found]:`字段「${k}」用于查询、配置或展示对应的监控数据；建议核对业务定义、单位与计算口径后设定阈值。`
}
function FieldHelp(){
 useEffect(()=>{
  const decorate=()=>{
   document.querySelectorAll<HTMLElement>('.ant-form-item-label label, .ant-table-thead th, .ant-descriptions-item-label, .ant-form-item .ant-input-group-addon, .ant-modal .ant-form-item-label label').forEach(el=>{
    if(el.dataset.helpReady)return
    const label=(el.textContent||'').trim()
    if(!label)return
    el.dataset.helpReady='1'
    el.title=helpText(label)
    el.style.cursor='help'
    el.setAttribute('aria-label',label+'：'+helpText(label))
   })
  }
  decorate()
  const observer=new MutationObserver(decorate)
  observer.observe(document.body,{childList:true,subtree:true})
  return()=>observer.disconnect()
 },[])
 return null
}

const routeKeys = Object.keys(pageComponents) as PageKey[]

function PageRouter() {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Navigate to="/overview" replace />} />
        {routeKeys.map((key) => {
          const Page = pageComponents[key]
          return <Route key={key} path={key} element={<Page />} />
        })}
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return <><FieldHelp/><PageRouter /></>
}

export { isPageKey }
