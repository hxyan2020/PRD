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

const extendedHelp:Record<string,string>={
 '市场名称':'行情供应商唯一标识。XAUUSD 优先选可验证的黄金现货/CFD报价源；BTCUSD 优先 Binance、OKX、Bybit。',
 '显示名称':'行情源在后台展示的名称，便于值班人员识别。',
 '是否需要设置价差监控':'是否检查买卖报价异常。建议 XAUUSD/BTCUSD 均开启，阈值按交易时段和流动性回测。',
 '描述信息':'记录来源、合约口径、异常处理与备用接口。',
 '进入观察期 (秒)':'发现源异常后等待多久才剔除，防止瞬时抖动。XAUUSD 30秒、BTCUSD 10秒作为待验证起点。',
 '进入观察期（秒）':'行情源异常持续多久进入观察状态。XAUUSD 30秒、BTCUSD 10秒，须按采样频率回测。',
 '重新启用 (秒)':'异常行情源恢复正常后持续观察多久重新接入。XAUUSD 120秒、BTCUSD 60秒，避免反复切换。',
 '重新启用（秒）':'异常源恢复后连续稳定多久再启用。XAUUSD 120秒、BTCUSD 60秒，待回测。',
 '市场地址':'行情源 WebSocket/API 地址；需检查连接、证书、心跳和备用源。',
 '交易量 URL':'拉取外部交易量的接口；仅使用同类产品的可比成交量。',
 '正向资金费率 URL':'读取线性合约资金费率的接口；注意报价币种和结算周期。',
 '反向资金费率 URL':'读取反向合约资金费率的接口；不可与线性合约直接混用。',
 '获取最新价 URL':'获取行情源最新成交价；不应单独作为强平价格。',
 '获取指数价 URL':'获取外部指数价；校验交易对和币种。',
 '获取合理价 URL':'获取外部标记价；与内部 Mark 计算口径可能不同。',
 '指数名称':'多源价格指数的名称，供标记价格与风险引擎引用。',
 '基础币种':'标的资产。XAUUSD 选 XAU，BTCUSD 选 BTC。',
 '基础货币':'标的资产。黄金选 XAU，比特币选 BTC。',
 '计价币种':'价格计价单位。XAUUSD、BTCUSD 均为 USD。',
 '计价货币':'合约计价单位；本示例均为 USD。',
 '价格精度':'指数价格小数位。XAUUSD 建议 2 位，BTCUSD 建议 1–2 位，须与合约 tick size 一致。',
 '最小行情源数':'参与指数计算的最低健康源数。建议两种合约至少 3 个独立来源；不足时降级并告警。',
 '行情源':'用于价格/资金费率计算的外部数据源。优先多家独立、同口径、低延迟来源。',
 '行情源交易量白名单':'允许参与交易量加权的来源；不具备可比成交量的黄金报价源应排除。',
 '计算方式':'多源指数聚合方法。XAUUSD 建议稳健加权中位数/截尾均值；BTCUSD 可用经清洗的交易量加权。',
 '订阅币种':'数据订阅的标的币种；须与指数标的一致。',
 '放大倍数':'指数换算系数；非必要建议 1，防止报价单位错配。',
 '中位数偏离控制开关':'检测并剔除离群报价，建议 XAUUSD/BTCUSD 均开启。',
 '中位数偏离比例':'单源相对多源中位数允许的偏离。XAUUSD 0.3%、BTCUSD 0.5% 为待回测初值。',
 '超出偏离值的调整机制':'异常报价的处理方式。优先剔除并告警，避免错误价格污染指数。',
 '各行情源交易量加权系数':'手动设置来源权重；须归一化且设置单源上限，防止过度依赖。',
 '权重展示开关':'展示指数来源权重，方便检查集中度和异常切换。',
 '目标交易对':'指数映射的外部市场交易对；必须核对 XAU/USD、BTC/USD 单位和合约类型。',
 '合约展示名称':'面向操作人员显示的合约名称。',
 '基差移动平均值周期(秒)':'计算期现基差的平滑窗口。XAUUSD 建议 60秒，BTCUSD 30秒，需结合行情噪声回测。',
 '期现价差阈值比例':'Mark 与 Index 基差异常阈值。XAUUSD 0.3%、BTCUSD 0.5% 作为初始预警，不直接用于强平。',
 '观察阈值(秒)':'基差异常持续多久触发保护。XAUUSD 30秒，BTCUSD 10秒，须压测。',
 '恢复阈值(秒)':'基差恢复正常后持续多久解除保护。XAUUSD 120秒，BTCUSD 60秒。',
 '新算法计算状态':'新标记价格算法是否正常运行；上线前需并行比对旧算法。',
 '采用状态':'当前正式采用的新/旧价格算法；切换需审批、回滚和审计。',
 '近24小时计算记录':'查看近期 Mark/Index 计算结果和异常，辅助 RCA。',
 '费率收取周期(小时)':'资金费结算频率。建议先与合约设计保持一致，例 4h；跨平台比较统一换算为 8h。',
 '首次收取时间(小时)':'首个资金费结算时间（应明确 UTC 时区），避免重复扣费。',
 '费率浮动上限':'单结算周期费率上限。试运行建议 XAUUSD +0.10%/8h、BTCUSD +0.15%/8h，若周期4h须换算。',
 '费率浮动下限':'单结算周期费率下限。试运行建议 XAUUSD -0.10%/8h、BTCUSD -0.15%/8h，按周期换算。',
 '保证金影响额':'资金费结算影响可用保证金的金额；应验证是否计入风险引擎。',
 '自动调整资金费率':'是否根据规则自动调整；建议先影子运行并设置上下限和人工回滚。',
 '资金费自动调整系数区间':'自动费率调整的允许系数范围；须由风控批准。',
 '费率精度':'资金费率计算和展示的小数位，建议至少 6 位并核对舍入。',
 '老算法利率':'旧资金费算法计算值，用于迁移比对。',
 '新算法利率':'新资金费算法计算值；上线前检查偏差。',
 '结算费率':'本次实际收取或支付的资金费率；需核对周期和时区。',
 '本期结算费率':'本次实际应用的资金费率；人工修改须双人审批。',
 '距离新周期启用时间（分钟）':'切换费率前的通知提前量；建议至少 30 分钟，视业务规则。',
 '采用新算法资金费率':'是否使用新费率计算引擎；需回测、灰度和回滚。',
 '是否开启自动调整资金费率':'启用自动调节；先观察并限定最大变化率。',
 '流水ID':'资金流水唯一标识，便于对账追踪。',
 '告警值':'触发阈值或事件条件。DB 心跳丢失建议 15秒预警、30秒升级；需按实际心跳频率调整。',
 'DB大额持仓预警':'DB 接仓持仓价值超限。XAUUSD 100,000 USD、BTCUSD 200,000 USD 为初始观察值。',
 'DB长时间持仓预警':'接仓后持仓未及时出清。XAUUSD 5分钟、BTCUSD 3分钟先预警，依流动性回测。',
 '注资金额上限预警':'单次注资超过批准限额即告警；建议关联审批记录。',
 'DB心跳预警':'接仓系统心跳异常，可能影响强平承接；建议 15秒预警、30秒升级，需验证频率。',
 'DB资金一级预警':'接仓资金低于预计极端需求 1.5 倍时预警；按压力测试动态确定。',
 'DB资金二级预警':'接仓资金低于预计极端需求 1.0 倍时升级；同步值班负责人。',
 'DB账户权益预警':'账户权益下降触发风险处置；结合未实现亏损和可转金额。',
 '爆仓预警':'持仓接近强平的预警，建议与维持保证金覆盖率联动。',
 '仓位模式':'逐仓/全仓，决定保证金共享范围。',
 '持仓均价':'当前持仓的平均开仓价格，用于计算未实现盈亏。',
 '未实现盈亏 (USD)':'按标记价计算的浮动盈亏，影响账户权益。',
 '总未实现盈亏':'账户所有未平仓头寸的浮动盈亏。',
 '总占用保证金':'账户全部仓位与订单占用的保证金，需核对是否包含挂单冻结。',
 '持仓总额':'账户所有仓位的名义价值合计。',
 '账户ID':'账户唯一标识，定位 DB 或用户风险。',
 '钱包余额':'账户已结算余额，不含未实现盈亏。',
 '最大可转金额':'不侵蚀最低安全保证金时允许转出的金额。',
 '操作人员':'执行配置变更的人员，供审计追踪。',
 '类型':'事件或配置类别，用于筛选与审计。',
 '是否启用':'启停对应监控或算法；生产环境应遵循审批流程。',
 '操作记录':'查看配置修改历史，核对操作人、时间与前后值。',
 '预警群':'Lark 告警通知地址。按风险等级配置值班、负责人和备用群，避免敏感信息外泄。',
 '告警方式':'告警推送渠道；关键事件建议 Lark+备用通知。',
}
function helpText(label:string):string {
 const k=label.replace(/[＊*:：]/g,'').trim().replace(/\s+/g,' ')
 if(extendedHelp[k])return extendedHelp[k]
 if(help[k])return help[k]
 const found=Object.keys(extendedHelp).find(x=>k.includes(x)||x.includes(k)) || Object.keys(help).find(x=>k.includes(x)||x.includes(k))
 return found?(extendedHelp[found]||help[found]):`字段「${k}」用于查询、配置或展示对应的监控数据；建议核对业务定义、单位与计算口径后设定阈值。`
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
    if(!el.querySelector('.field-help-mark')){
      const mark=document.createElement('span')
      mark.className='field-help-mark'
      mark.textContent=' ⓘ'
      mark.style.color='#1677ff'
      mark.style.fontSize='12px'
      mark.style.fontWeight='normal'
      mark.title=helpText(label)
      el.appendChild(mark)
    }
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
