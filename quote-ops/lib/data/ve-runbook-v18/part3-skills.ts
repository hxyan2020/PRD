import type { Skill, SkillStep } from "@/lib/types";

function stepsFromTable(
  rows: Array<{ id: string; titleZh: string; titleEn: string; detailZh: string; detailEn: string }>,
): SkillStep[] {
  return rows.map((r) => ({
    id: r.id, title: r.titleEn, titleZh: r.titleZh, detail: r.detailEn, detailZh: r.detailZh,
  }));
}

/** Interactive checklists for L1-16..28 + L2-A/B (tables in part3 markdown). */
export const VE_RUNBOOK_PART3_SKILLS: Skill[] = [
  {
    id: "ve-sk-l1-16-ext-funding",
    slug: "ve-l1-16-external-funding-deviation",
    title: "L1-16 External Funding deviation",
    titleZh: "L1-16｜外部资金费率偏差监控",
    summary: "Platform vs peer Funding ≥0.1pp; 4h cycle; L2-B on price disconnect.",
    summaryZh: "平台vs友商Funding≥0.1个百分点；4小时周期；价格脱节跳转L2-B。",
    severity: "P1",
    owners: ['L1', 'BIT', 'Pricing', 'Finance', 'RC'],
    relatedRiskIds: [],
    triggers: ['Lark external Funding deviation', 'Funding gap ≥0.1pp'],
    triggersZh: ['Lark 外部资金费率偏差', '偏差≥0.1个百分点'],
    steps: stepsFromTable([
      {
        id: "1", titleZh: "统一比较口径", titleEn: "Align basis",
        detailZh: "百分比/百分点、预测/实际结算口径统一后再判。", detailEn: "Unify %/pp and predicted/settled before judging.",
      },
      {
        id: "2", titleZh: "多家友商对照", titleEn: "Multi-peer Funding",
        detailZh: "一家异常查友商；多家一致本所偏离→本所计算。", detailEn: "One peer odd→peer; peers agree we diverge→our calc.",
      },
      {
        id: "3", titleZh: "Premium与资金费率管理", titleEn: "Premium & funding admin",
        detailZh: "Premium变→价格输入；输入正常输出异→BIT明细。", detailEn: "Premium move→price inputs; input OK output bad→BIT.",
      },
      {
        id: "4", titleZh: "前端三价与盘口", titleEn: "Front prices & book",
        detailZh: "价格异常查Premium影响；正常查Funding/友商口径。", detailEn: "Price odd→Premium impact; else Funding/peer basis.",
      },
      {
        id: "5", titleZh: "联动07/08→L2-B", titleEn: "Link 07/08 → L2-B",
        detailZh: "同周期价格脱节→L2-B；无关联继续单点。", detailEn: "Same-cycle price disconnect→L2-B; else single-point.",
      },
      {
        id: "6", titleZh: "【可选】周期/上下限", titleEn: "[Optional] cycle/caps",
        detailZh: "配置变化→BIT/Pricing；正常→Premium采样与公式。", detailEn: "Config change→BIT/Pricing; else Premium sample/formula.",
      },
      {
        id: "7", titleZh: "BIT采样与算法", titleEn: "BIT sample & algo",
        detailZh: "采集/计算错误修复；真实差异Pricing确认。", detailEn: "Ingest/calc fix; real gap→Pricing confirm.",
      },
      {
        id: "8", titleZh: "资金流水与结算", titleEn: "Ledger & settlement",
        detailZh: "错误结算→Finance授权纠错；临近结算→RC/BIT；未影响观察。", detailEn: "Bad settle→Finance; near settle→RC/BIT; else watch.",
      },
      {
        id: "9", titleZh: "验收/归档", titleEn: "Accept/archive",
        detailZh: "恢复结束；仍异跟踪；风险处置归档。", detailEn: "Recovered→end; still bad→track; risk done→archive.",
      },
    ]),
    evidence: ['Funding vs peer', 'Premium Index', 'Ledger Funding rows', 'Next settle time'],
    evidenceZh: ['平台/友商Funding', 'Premium Index', 'Funding流水', '下次结算时间'],
    tags: ['v-exchange-perp', 'runbook-v18', 'skill', 'l1-16', 'funding', 'part3'],
  },
  {
    id: "ve-sk-l1-17-int-funding",
    slug: "ve-l1-17-internal-funding",
    title: "L1-17 Internal Funding monitor",
    titleZh: "L1-17｜内部资金费率监控",
    summary: "Internal Funding caps/publish/settle; Premium path; Finance ledger.",
    summaryZh: "内部Funding限幅/发布/结算；Premium路径；Finance流水。",
    severity: "P1",
    owners: ['L1', 'BIT', 'Pricing', 'Finance'],
    relatedRiskIds: [],
    triggers: ['Lark internal Funding', 'Funding not updating / over caps'],
    triggersZh: ['Lark 内部资金费率', '费率未更新/超上下限'],
    steps: stepsFromTable([
      {
        id: "1", titleZh: "读异常类型", titleEn: "Read anomaly type",
        detailZh: "超上下限查限幅；未更新查计算发布；结算异查流水。", detailEn: "Over caps→limiter; stale→publish; settle odd→ledger.",
      },
      {
        id: "2", titleZh: "资金费率管理对照Lark", titleEn: "Admin vs Lark",
        detailZh: "不一致截图交BIT同步；一致但异常继续。", detailEn: "Mismatch→BIT sync; match but odd→continue.",
      },
      {
        id: "3", titleZh: "Premium/基础费率", titleEn: "Premium/base rate",
        detailZh: "输入异→价格源；输出异→公式限幅。", detailEn: "Bad input→sources; bad output→formula/caps.",
      },
      {
        id: "4", titleZh: "价格偏差联动", titleEn: "Price deviation link",
        detailZh: "价格异按L1-07/指数源；正常查Funding计算。", detailEn: "Price odd→L1-07/index; else Funding calc.",
      },
      {
        id: "5", titleZh: "BIT原始/限幅/发布费率", titleEn: "BIT raw/capped/published",
        detailZh: "计算/限幅错修复；规则正常确认市场波动。", detailEn: "Calc/cap bug→fix; in-rule→market move.",
      },
      {
        id: "6", titleZh: "资金流水", titleEn: "Ledger",
        detailZh: "错误入账Finance+BIT；未结算监控下时点。", detailEn: "Bad post→Finance+BIT; unsettle→next settle.",
      },
      {
        id: "7", titleZh: "改参/补账审批", titleEn: "Param/ledger approval",
        detailZh: "改参审批；补账幂等；无需修复说明依据。", detailEn: "Param approve; top-up idempotent; else justify.",
      },
      {
        id: "8", titleZh: "费率结算余额一致", titleEn: "Rate/settle/balance",
        detailZh: "通过结束/归档；失败跟踪。", detailEn: "Pass→end/archive; fail→track.",
      },
    ]),
    evidence: ['Published Funding', 'Caps', 'Premium samples', 'Ledger settle rows'],
    evidenceZh: ['发布费率', '上下限', 'Premium采样', '结算流水'],
    tags: ['v-exchange-perp', 'runbook-v18', 'skill', 'l1-17', 'funding', 'part3'],
  },
  {
    id: "ve-sk-l1-18-db-fund",
    slug: "ve-l1-18-db-fund-alert",
    title: "L1-18 DB fund L1/L2 alert",
    titleZh: "L1-18｜DB资金一级 / 二级预警",
    summary: "Takeover vs MM/K-line accounts; auto top-up; do not reuse takeover balance.",
    summaryZh: "接仓vs报价/K线账户；自动注资；不得套用接仓余额。",
    severity: "P0",
    owners: ['L1', 'DB', 'Finance', 'BIT', 'RC'],
    relatedRiskIds: [],
    triggers: ['Lark DB fund L1/L2', 'takeover wallet low'],
    triggersZh: ['Lark DB资金一二级预警', '接仓钱包余额不足'],
    steps: stepsFromTable([
      {
        id: "1", titleZh: "核对账户类型", titleEn: "Confirm account type",
        detailZh: "接仓用接仓管理；报价/K线用对应数据，不套用接仓余额。", detailEn: "Takeover page for takeover; never reuse its balance for MM/K-line.",
      },
      {
        id: "2", titleZh: "钱包/保证金/权益", titleEn: "Wallet/margin/equity",
        detailZh: "可用不足→DB/Finance；权益速降→L1-19。", detailEn: "Low free→DB/Finance; equity drop→L1-19.",
      },
      {
        id: "3", titleZh: "注资/划转流水", titleEn: "Top-up/transfer ledger",
        detailZh: "已发起未到账→Finance+BIT；无记录查自动注资。", detailEn: "Pending→Finance+BIT; none→auto top-up.",
      },
      {
        id: "4", titleZh: "接仓需求", titleEn: "Takeover demand",
        detailZh: "需求增且资金不足→DB/RC；无压力观察。", detailEn: "Demand up + short→DB/RC; else watch.",
      },
      {
        id: "5", titleZh: "【可选】水位线", titleEn: "[Optional] waterlines",
        detailZh: "自动注资失败BIT修；额度不足Finance/RC；成功未入账同步。", detailEn: "Auto fail→BIT; quota→Finance/RC; success not posted→sync.",
      },
      {
        id: "6", titleZh: "净敞口与需求", titleEn: "Net exposure vs need",
        detailZh: "需求超可用→减险/资金交RC。", detailEn: "Need > cash→de-risk/funds via RC.",
      },
      {
        id: "7", titleZh: "人工注资/同步", titleEn: "Manual top-up/sync",
        detailZh: "人工注资授权；仅延迟修同步。", detailEn: "Manual top-up authorized; delay→sync fix.",
      },
      {
        id: "8", titleZh: "验收", titleEn: "Accept",
        detailZh: "正常结束/归档；仍不足升级。", detailEn: "OK→end/archive; still short→escalate.",
      },
    ]),
    evidence: ['Account type', 'Wallet & equity', 'Top-up waterlines', 'Transfer records'],
    evidenceZh: ['账户类型', '钱包与权益', '注资水位线', '划转记录'],
    tags: ['v-exchange-perp', 'runbook-v18', 'skill', 'l1-18', 'db', 'fund', 'part3'],
  },
  {
    id: "ve-sk-l1-19-db-equity",
    slug: "ve-l1-19-db-equity-alert",
    title: "L1-19 DB equity alert",
    titleZh: "L1-19｜DB账户权益预警",
    summary: "Equity vs wallet/uPnL; hedge check; RC if beyond tolerance—not top-up to hide loss.",
    summaryZh: "权益vs钱包/浮亏；对冲核查；超容忍RC—不以注资掩盖亏损。",
    severity: "P0",
    owners: ['L1', 'DB', 'Finance', 'BIT', 'RC', 'Pricing'],
    relatedRiskIds: [],
    triggers: ['Lark DB equity alert', 'sustained equity drop'],
    triggersZh: ['Lark DB账户权益预警', '权益持续下降'],
    steps: stepsFromTable([
      {
        id: "1", titleZh: "单次vs持续", titleEn: "Spike vs sustained",
        detailZh: "单次查浮亏/资金流；持续查持仓净敞口。", detailEn: "Spike→uPnL/flows; sustained→pos/net.",
      },
      {
        id: "2", titleZh: "余额权益浮亏", titleEn: "Wallet/equity/uPnL",
        detailZh: "浮亏→持仓市场；余额降→划转；无法解释→Finance/BIT。", detailEn: "uPnL→pos/mkt; wallet down→transfer; unexplained→Finance/BIT.",
      },
      {
        id: "3", titleZh: "持仓敞口", titleEn: "Position exposure",
        detailZh: "大额单边浮亏扩→DB对冲；仓减权益未回→已实现损益。", detailEn: "Large one-side→DB hedge; size down equity not→realized PNL.",
      },
      {
        id: "4", titleZh: "流水划转", titleEn: "Flows/transfers",
        detailZh: "正常回拨核保证金；异常减少Finance+RC。", detailEn: "Normal pullback→margin; odd drain→Finance+RC.",
      },
      {
        id: "5", titleZh: "行情与深度", titleEn: "Market & depth",
        detailZh: "行情扩亏→DB减险；价格异常→Pricing/BIT。", detailEn: "Mkt loss→DB de-risk; price odd→Pricing/BIT.",
      },
      {
        id: "6", titleZh: "外部对冲", titleEn: "External hedge",
        detailZh: "未对冲→减险方案；已对冲仍降→基差损益。", detailEn: "Unhedged→plan; hedged still down→basis/PNL.",
      },
      {
        id: "7", titleZh: "账务/计算", titleEn: "Ledger/calc",
        detailZh: "账务错Finance纠；计算错BIT；真实亏损DB/RC。", detailEn: "Ledger→Finance; calc→BIT; real loss→DB/RC.",
      },
      {
        id: "8", titleZh: "RC决策", titleEn: "RC decision",
        detailZh: "超容忍审批措施；可控监控，不注资掩盖。", detailEn: "Beyond tolerance→RC; else watch, no top-up cover.",
      },
      {
        id: "9", titleZh: "验收", titleEn: "Accept",
        detailZh: "恢复结束；恶化升级；处置归档。", detailEn: "Recovered→end; worsen→escalate; done→archive.",
      },
    ]),
    evidence: ['Equity path', 'uPnL by contract', 'Hedge status', 'RC decision'],
    evidenceZh: ['权益路径', '分合约浮亏', '对冲状态', 'RC决策'],
    tags: ['v-exchange-perp', 'runbook-v18', 'skill', 'l1-19', 'db', 'equity', 'part3'],
  },
  {
    id: "ve-sk-l1-20-db-pos-timeout",
    slug: "ve-l1-20-db-position-timeout",
    title: "L1-20 DB takeover position timeout / size",
    titleZh: "L1-20｜DB接仓账户持仓超时 / 大额风险",
    summary: ">10m timeout; position ≠ unhedged; L2-E/F links.",
    summaryZh: "超时>10分钟；持仓≠未对冲；联动L2-E/F。",
    severity: "P0",
    owners: ['L1', 'DB', 'BIT', 'Finance', 'RC'],
    relatedRiskIds: [],
    triggers: ['Lark DB position timeout', 'takeover >10 minutes'],
    triggersZh: ['Lark DB接仓持仓超时', '接仓>10分钟'],
    steps: stepsFromTable([
      {
        id: "1", titleZh: "时长与名义", titleEn: "Duration & notional",
        detailZh: ">10m超时排查；大额按阈值；重复告警同仓？", detailEn: " >10m→timeout path; large→threshold; repeat=same pos?",
      },
      {
        id: "2", titleZh: "接仓仓位明细", titleEn: "Takeover position",
        detailZh: "同仓持续→外部对冲；不同批次分别匹配。", detailEn: "Same pos→hedge; batches match sources.",
      },
      {
        id: "3", titleZh: "强平映射", titleEn: "Liq mapping",
        detailZh: "数量不一致→BIT接仓接口；一致查净敞口。", detailEn: "Qty mismatch→BIT API; else net exposure.",
      },
      {
        id: "4", titleZh: "联动23/02", titleEn: "Link 23/02",
        detailZh: "强平接仓对应→L2-E；流动性影响→L2-F。", detailEn: "Liq↔takeover→L2-E; depth hit→L2-F.",
      },
      {
        id: "5", titleZh: "资金权益", titleEn: "Funds/equity",
        detailZh: "资金不足Finance/DB；权益恶化L1-19。", detailEn: "Short cash→Finance/DB; equity bad→L1-19.",
      },
      {
        id: "6", titleZh: "行情深度", titleEn: "Market depth",
        detailZh: "不利且稀薄→分批减险；正常查对冲执行。", detailEn: "Adverse thin→batch de-risk; else hedge exec.",
      },
      {
        id: "7", titleZh: "DB对冲结果", titleEn: "DB hedge result",
        detailZh: "充分/部分/失败分支；失败通知RC。", detailEn: "Full/partial/fail branches; fail→RC.",
      },
      {
        id: "8", titleZh: "仓位/资金记录", titleEn: "Pos/fund records",
        detailZh: "记录错BIT/Finance；正确按真实敞口。", detailEn: "Record bug→BIT/Finance; else real exposure.",
      },
      {
        id: "9", titleZh: "RC审批", titleEn: "RC approval",
        detailZh: "重大未对冲升级RC；一般按授权。", detailEn: "Major unhedged→RC; else authorized plan.",
      },
      {
        id: "10", titleZh: "验收", titleEn: "Accept",
        detailZh: "解除归档；已对冲无风险结束；未对冲跟踪。", detailEn: "Cleared→archive; hedged no risk→end; unhedged→track.",
      },
    ]),
    evidence: ['Hold duration', 'Takeover qty vs liq', 'Hedge fills', 'Net exposure'],
    evidenceZh: ['持仓时长', '接仓量vs强平', '对冲成交', '净敞口'],
    tags: ['v-exchange-perp', 'runbook-v18', 'skill', 'l1-20', 'db', 'takeover', 'part3'],
  },
  {
    id: "ve-sk-l1-21-db-topup",
    slug: "ve-l1-21-db-topup-callback",
    title: "L1-21 DB top-up / callback notice",
    titleZh: "L1-21｜DB注资 / 回拨通知",
    summary: "Bilateral ledger vs notice; idempotent retry; L1-18 if still short.",
    summaryZh: "双边账vs通知；重试幂等；仍不足转L1-18。",
    severity: "P1",
    owners: ['L1', 'Finance', 'BIT', 'RC'],
    relatedRiskIds: [],
    triggers: ['Lark DB top-up/callback', 'duplicate transfer notice'],
    triggersZh: ['Lark DB注资/回拨', '重复通知'],
    steps: stepsFromTable([
      {
        id: "1", titleZh: "读类型金额", titleEn: "Read type/amount",
        detailZh: "正常核账务；金额异/重复优先流水。", detailEn: "Normal→ledger; odd/dup→flows first.",
      },
      {
        id: "2", titleZh: "流水与划转", titleEn: "Flows & transfers",
        detailZh: "一致核余额；方向金额不一Finance；缺失BIT。", detailEn: "Match→balance; mismatch→Finance; missing→BIT.",
      },
      {
        id: "3", titleZh: "余额权益", titleEn: "Balance/equity",
        detailZh: "到账正确继续；通知成功余额未变核查；回拨不足→L1-18。", detailEn: "Posted OK→continue; notice OK balance no→check; callback short→L1-18.",
      },
      {
        id: "4", titleZh: "财务账户管理", titleEn: "Finance account admin",
        detailZh: "双边一致且授权→完成；重复错账未授权→RC纠错。", detailEn: "Bilateral+auth→done; dup/wrong/unauth→RC.",
      },
      {
        id: "5", titleZh: "是否触发资金预警", titleEn: "Fund alert too?",
        detailZh: "仍不足L1-18；恢复验收。", detailEn: "Still short→L1-18; else accept.",
      },
      {
        id: "6", titleZh: "重试幂等", titleEn: "Retry idempotency",
        detailZh: "重试先核幂等防重复；否则修状态同步。", detailEn: "Retry only after idempotency; else status sync.",
      },
      {
        id: "7", titleZh: "验收", titleEn: "Accept",
        detailZh: "无风险结束；异常处置归档；仍不一升级。", detailEn: "No risk→end; fixed→archive; mismatch→escalate.",
      },
    ]),
    evidence: ['Notice vs ledger', 'Transfer pair', 'Idempotency key', 'Auth trail'],
    evidenceZh: ['通知vs流水', '划转双边', '幂等键', '授权轨迹'],
    tags: ['v-exchange-perp', 'runbook-v18', 'skill', 'l1-21', 'db', 'topup', 'part3'],
  },
  {
    id: "ve-sk-l1-22-db-heartbeat",
    slug: "ve-l1-22-db-heartbeat",
    title: "L1-22 DB heartbeat alert",
    titleZh: "L1-22｜DB心跳预警",
    summary: "Quote vs takeover service; book OK ≠ takeover OK; RC if both fail.",
    summaryZh: "报价vs接仓服务；盘口正常≠接仓正常；双失效RC。",
    severity: "P0",
    owners: ['L1', 'DB', 'BIT', 'RC'],
    relatedRiskIds: [],
    triggers: ['Lark DB heartbeat', 'MM or takeover heartbeat timeout'],
    triggersZh: ['Lark DB心跳预警', '报价或接仓心跳超时'],
    steps: stepsFromTable([
      {
        id: "1", titleZh: "心跳对象", titleEn: "Heartbeat target",
        detailZh: "报价→盘口；接仓→强平接仓；不明→BIT标识。", detailEn: "Quote→book; takeover→liq/takeover; unclear→BIT id.",
      },
      {
        id: "2", titleZh: "盘口刷新", titleEn: "Book refresh",
        detailZh: "缺失→DB/BIT；正常仍查接仓，不直接结束。", detailEn: "Missing→DB/BIT; OK still check takeover.",
      },
      {
        id: "3", titleZh: "【可选】接入配置", titleEn: "[Optional] MM access cfg",
        detailZh: "配置变化BIT确认；正常查业务响应。", detailEn: "Cfg change→BIT; else business response.",
      },
      {
        id: "4", titleZh: "关联业务告警", titleEn: "Related business alerts",
        detailZh: "报价影响成交修复；接仓失败影响强平→RC。", detailEn: "Quote hit fills→fix; takeover fail liq→RC.",
      },
      {
        id: "5", titleZh: "DB业务状态", titleEn: "DB business state",
        detailZh: "策略暂停授权恢复；接仓失败联合修复；业务正常查误报。", detailEn: "Paused→restore; takeover fail→joint fix; OK→false alarm?",
      },
      {
        id: "6", titleZh: "BIT连接/错误码", titleEn: "BIT session/codes",
        detailZh: "断连恢复；在线业务失败修服务；误报修监控。", detailEn: "Disconnect→reconnect; online fail→service; false→monitor.",
      },
      {
        id: "7", titleZh: "RC双失效", titleEn: "RC dual failure",
        detailZh: "报价+接仓双失或强平受阻→授权措施。", detailEn: "Both fail / liq blocked→RC measures.",
      },
      {
        id: "8", titleZh: "验收", titleEn: "Accept",
        detailZh: "心跳报价订单接仓全恢复；任一失败跟踪。", detailEn: "All recover→end; any fail→track.",
      },
    ]),
    evidence: ['Heartbeat target', 'Book refresh', 'Takeover API codes', 'RC decision'],
    evidenceZh: ['心跳对象', '盘口刷新', '接仓错误码', 'RC决策'],
    tags: ['v-exchange-perp', 'runbook-v18', 'skill', 'l1-22', 'db', 'heartbeat', 'part3'],
  },
  {
    id: "ve-sk-l1-23-large-liq",
    slug: "ve-l1-23-large-liquidation",
    title: "L1-23 Large liq notice & execution RCA",
    titleZh: "L1-23｜大额爆仓通知及强平执行异常排查",
    summary: "Lark notice ≠ bad liq; verify rules/exec/ledger/takeover; L2-D/E/F.",
    summaryZh: "通知≠强平错误；核规则/执行/账务/接仓；联动L2-D/E/F。",
    severity: "P0",
    owners: ['L1', 'BIT', 'Finance', 'DB', 'RC', 'Pricing'],
    relatedRiskIds: [],
    triggers: ['Lark large liquidation', 'liq execution anomaly'],
    triggersZh: ['Lark 大额爆仓', '强平执行异常'],
    steps: stepsFromTable([
      {
        id: "1", titleZh: "读UID与仓位", titleEn: "UID & positions",
        detailZh: "多条通知核不同仓/批次；单条查强平记录。", detailEn: "Multi notices→pos/batches; single→liq record.",
      },
      {
        id: "2", titleZh: "规则触发", titleEn: "Rule trigger",
        detailZh: "Mark/保证金符合继续；不符→RC+BIT计算。", detailEn: "Rules OK→exec; else RC+BIT calc.",
      },
      {
        id: "3", titleZh: "执行完整性", titleEn: "Exec completeness",
        detailZh: "全成→仓位账务；部分→残余接仓；失败→撮合指令。", detailEn: "Full→pos/ledger; partial→residual/takeover; fail→match.",
      },
      {
        id: "4", titleZh: "残余仓位", titleEn: "Residual position",
        detailZh: "符合分级继续；异常残余BIT。", detailEn: "Tiered OK→continue; odd residual→BIT.",
      },
      {
        id: "5", titleZh: "PNL流水", titleEn: "PNL & ledger",
        detailZh: "一致继续；不一Finance+BIT授权纠。", detailEn: "Match→continue; mismatch→Finance+BIT.",
      },
      {
        id: "6", titleZh: "DB接仓", titleEn: "DB takeover",
        detailZh: "成功量一致继续；失败不一BIT+DB。", detailEn: "OK qty→continue; fail/mismatch→BIT+DB.",
      },
      {
        id: "7", titleZh: "超时/资金/对冲", titleEn: "Timeout/funds/hedge",
        detailZh: ">10m→L1-20；资金不足L1-18；对冲未知DB说明。", detailEn: ">10m→L1-20; short→L1-18; hedge unknown→DB.",
      },
      {
        id: "8", titleZh: "价格与深度", titleEn: "Price & depth",
        detailZh: "价格异查定价；深度不足查流动性。", detailEn: "Price odd→pricing; thin→liquidity.",
      },
      {
        id: "9", titleZh: "联动L2", titleEn: "L2 links",
        detailZh: "定价+强平L2-D；接仓积压L2-E；深度影响L2-F。", detailEn: "Price+liq→L2-D; backlog→L2-E; depth→L2-F.",
      },
      {
        id: "10", titleZh: "集中强平", titleEn: "Clustered liqs",
        detailZh: "集中+行情异→RC/Pricing；真实波动核执行。", detailEn: "Cluster+odd mkt→RC/Pricing; real move→exec OK?",
      },
      {
        id: "11", titleZh: "多方处置", titleEn: "Multi-party dispose",
        detailZh: "技术BIT；账务Finance；未对冲DB/RC；正常无需纠错。", detailEn: "Tech BIT; ledger Finance; unhedged DB/RC; normal no fix.",
      },
      {
        id: "12", titleZh: "验收", titleEn: "Accept",
        detailZh: "全正常结束；处置归档；残余跟踪。", detailEn: "All OK→end; disposed→archive; residual→track.",
      },
    ]),
    evidence: ['Liq history row', 'Mark vs liq price', 'Takeover qty', 'Related L2'],
    evidenceZh: ['强平历史', 'Markvs强平价', '接仓数量', '关联L2'],
    tags: ['v-exchange-perp', 'runbook-v18', 'skill', 'l1-23', 'liquidation', 'part3'],
  },
  {
    id: "ve-sk-l1-24-adl",
    slug: "ve-l1-24-adl-anomaly",
    title: "L1-24 ADL anomaly",
    titleZh: "L1-24｜ADL异常预警",
    summary: "False/miss/partial ADL; L1 must not execute ADL; RC/Finance approve fixes.",
    summaryZh: "误/漏/部分执行；L1不得执行ADL；纠错须RC/Finance审批。",
    severity: "P0",
    owners: ['L1', 'BIT', 'Finance', 'RC'],
    relatedRiskIds: [],
    triggers: ['Lark ADL anomaly', 'ADL partial / false trigger'],
    triggersZh: ['Lark ADL异常', 'ADL部分执行/误触发'],
    steps: stepsFromTable([
      {
        id: "1", titleZh: "异常类型", titleEn: "Anomaly type",
        detailZh: "误触发核条件；漏触发核规则；执行失败核残余。", detailEn: "False→conditions; miss→rules; fail→residual.",
      },
      {
        id: "2", titleZh: "ADL历史数量", titleEn: "ADL history qty",
        detailZh: "目标=执行继续；未完成BIT原因。", detailEn: "Target=exec→continue; incomplete→BIT.",
      },
      {
        id: "3", titleZh: "强平接仓保险基金", titleEn: "Liq/takeover/insurance",
        detailZh: "符合流程继续；顺序条件异→状态机。", detailEn: "Process OK→continue; order/cond odd→FSM.",
      },
      {
        id: "4", titleZh: "仓位资金", titleEn: "Pos & funds",
        detailZh: "一致继续；不一Finance/BIT授权修。", detailEn: "Match→continue; mismatch→Finance/BIT.",
      },
      {
        id: "5", titleZh: "BIT触发排序错误码", titleEn: "BIT trigger/order/codes",
        detailZh: "错误触发修+RC影响；执行失败修链路；正常说明依据。", detailEn: "False→fix+RC; exec fail→path; normal→justify.",
      },
      {
        id: "6", titleZh: "残余风险", titleEn: "Residual risk",
        detailZh: "重大→RC；已吸收→账务验收。", detailEn: "Major→RC; absorbed→ledger accept.",
      },
      {
        id: "7", titleZh: "授权纠错", titleEn: "Authorized fix",
        detailZh: "补偿/调仓RC/Finance；系统BIT；L1不执行ADL。", detailEn: "Comp/adjust→RC/Finance; sys→BIT; L1 never runs ADL.",
      },
      {
        id: "8", titleZh: "验收", titleEn: "Accept",
        detailZh: "数量仓位资金正常结束/归档；差异升级。", detailEn: "Qty/pos/funds OK→end/archive; gap→escalate.",
      },
    ]),
    evidence: ['ADL history', 'Target vs filled', 'Insurance fund', 'RC approval'],
    evidenceZh: ['ADL历史', '目标vs执行', '保险基金', 'RC审批'],
    tags: ['v-exchange-perp', 'runbook-v18', 'skill', 'l1-24', 'adl', 'part3'],
  },
  {
    id: "ve-sk-l1-25-user-recon",
    slug: "ve-l1-25-user-snapshot-recon",
    title: "L1-25 User snapshot vs ledger recon fail",
    titleZh: "L1-25｜用户快照与流水勾稽失败",
    summary: "Cutoff first; opening+net≠closing; never edit balances for report-only gaps.",
    summaryZh: "先截止时间；期初+净≠期末；仅报表差不擅改余额。",
    severity: "P1",
    owners: ['L1', 'Finance', 'BIT', 'RC'],
    relatedRiskIds: [],
    triggers: ['Lark user snapshot recon fail', 'opening+net ≠ closing'],
    triggersZh: ['Lark 用户快照流水勾稽失败', '期初+净变动≠期末'],
    steps: stepsFromTable([
      {
        id: "1", titleZh: "截止与真实余额", titleEn: "Cutoff & real bal",
        detailZh: "未截止观察；已过查流水；涉可用余额→Finance/RC。", detailEn: "Pre-cutoff watch; past→ledger; real bal→Finance/RC.",
      },
      {
        id: "2", titleZh: "快照时点", titleEn: "Snapshot timestamp",
        detailZh: "时点不一重算；一致仍不平逐项流水。", detailEn: "Misaligned→recalc; aligned still gap→flows.",
      },
      {
        id: "3", titleZh: "分类重算", titleEn: "Category recalc",
        detailZh: "划转/PNL/Funding/费/调整；平衡仍告警→对账任务。", detailEn: "Transfer/PNL/Funding/fee/adj; balanced but alert→job.",
      },
      {
        id: "4", titleZh: "缺失/重复/方向", titleEn: "Missing/dup/sign",
        detailZh: "缺→生产消费；重→幂等；方向错Finance确认后BIT。", detailEn: "Miss→prod/cons; dup→idem; sign→Finance then BIT.",
      },
      {
        id: "5", titleZh: "账本事件修复", titleEn: "Ledger event fix",
        detailZh: "漏记重复授权重处理；分类错Finance映射。", detailEn: "Miss/dup→authorized replay; class→Finance map.",
      },
      {
        id: "6", titleZh: "真实资金保护", titleEn: "Real funds protect",
        detailZh: "真实错误→RC/Finance；仅报表差不改余额。", detailEn: "Real error→RC/Finance; report-only no bal edit.",
      },
      {
        id: "7", titleZh: "Finance验收", titleEn: "Finance accept",
        detailZh: "差额零归档；仍不平跟踪；误报结束。", detailEn: "Zero→archive; gap→track; false→end.",
      },
    ]),
    evidence: ['Cutoff time', 'Opening/closing', 'Flow categories', 'Available balance'],
    evidenceZh: ['截止时间', '期初期末', '流水分类', '可用余额'],
    tags: ['v-exchange-perp', 'runbook-v18', 'skill', 'l1-25', 'finance', 'recon', 'part3'],
  },
  {
    id: "ve-sk-l1-26-broker-recon",
    slug: "ve-l1-26-broker-snapshot-recon",
    title: "L1-26 Broker sum vs user snapshot recon",
    titleZh: "L1-26｜Broker汇总与用户快照勾稽失败",
    summary: "Same cutoff; UID mapping; real funds vs stats-only.",
    summaryZh: "同一截止；UID映射；真实资金vs仅统计。",
    severity: "P1",
    owners: ['L1', 'Finance', 'BIT', 'Broker Ops', 'RC'],
    relatedRiskIds: [],
    triggers: ['Lark Broker vs user snapshot gap', 'Broker sum ≠ UID sum'],
    triggersZh: ['Lark Broker汇总勾稽失败', 'Broker合计≠UID合计'],
    steps: stepsFromTable([
      {
        id: "1", titleZh: "统一截止", titleEn: "Unify cutoff",
        detailZh: "同时点有差继续；批次不一先重算。", detailEn: "Same cutoff gap→continue; else unify recalc.",
      },
      {
        id: "2", titleZh: "报表完成态", titleEn: "Report status",
        detailZh: "未完成核截止；完成不平查归属流水。", detailEn: "Incomplete→cutoff; done uneven→ownership/flows.",
      },
      {
        id: "3", titleZh: "漏计流水", titleEn: "Missing flow class",
        detailZh: "某类未计入→Finance定位BIT修；齐全查UID映射。", detailEn: "Class missing→Finance+BIT; complete→UID map.",
      },
      {
        id: "4", titleZh: "Broker-UID映射", titleEn: "Broker-UID map",
        detailZh: "单Broker→Ops变更；多Broker→公共汇总任务。", detailEn: "One Broker→Ops; many→shared job.",
      },
      {
        id: "5", titleZh: "ETL/归属", titleEn: "ETL/ownership",
        detailZh: "ETL错重算；映射错Ops/Finance确认。", detailEn: "ETL→fix+recalc; map→Ops/Finance.",
      },
      {
        id: "6", titleZh: "真实资金?", titleEn: "Real funds?",
        detailZh: "真实缺口→RC/Finance；仅口径修报表。", detailEn: "Real gap→RC/Finance; stats-only→report fix.",
      },
      {
        id: "7", titleZh: "验收", titleEn: "Accept",
        detailZh: "合计一致结束；风险归档；仍差跟踪。", detailEn: "Match→end; risk→archive; gap→track.",
      },
    ]),
    evidence: ['Broker ID & cutoff', 'UID mapping', 'Sum vs total', 'Real funds flag'],
    evidenceZh: ['Broker与截止', 'UID映射', '汇总vs合计', '真实资金标记'],
    tags: ['v-exchange-perp', 'runbook-v18', 'skill', 'l1-26', 'finance', 'broker', 'part3'],
  },
  {
    id: "ve-sk-l1-27-snapshot-missing",
    slug: "ve-l1-27-snapshot-missing",
    title: "L1-27 User/Broker snapshot missing",
    titleZh: "L1-27｜用户 / Broker快照缺失",
    summary: "Batch vs partial miss; idempotent regenerate; stop on duplicate.",
    summaryZh: "整批vs部分缺失；幂等补跑；发现重复立刻停。",
    severity: "P1",
    owners: ['L1', 'Finance', 'BIT', 'RC'],
    relatedRiskIds: [],
    triggers: ['Lark snapshot missing', 'batch timeout'],
    triggersZh: ['Lark 快照缺失', '批次超时'],
    steps: stepsFromTable([
      {
        id: "1", titleZh: "预期时间", titleEn: "Expected time",
        detailZh: "未截止观察；已超时确认范围。", detailEn: "Pre-cutoff watch; timed out→scope.",
      },
      {
        id: "2", titleZh: "任务状态行数", titleEn: "Job status/rows",
        detailZh: "整批→调度依赖；部分→过滤账户范围。", detailEn: "Full miss→scheduler; partial→filters.",
      },
      {
        id: "3", titleZh: "同期对账告警", titleEn: "Concurrent recon alerts",
        detailZh: "同时对账失败统一排查；否则查延迟。", detailEn: "Also recon fail→joint; else delay?",
      },
      {
        id: "4", titleZh: "失败原因重试", titleEn: "Fail reason/retry",
        detailZh: "失败授权补跑；过滤漏修范围；上游不完整先修账本。", detailEn: "Fail→authorized rerun; filter→scope; upstream→ledger first.",
      },
      {
        id: "5", titleZh: "账本vs仅快照", titleEn: "Ledger vs snapshot-only",
        detailZh: "账本异→RC/Finance；仅快照缺按批补跑。", detailEn: "Ledger bad→RC/Finance; snapshot-only→rerun.",
      },
      {
        id: "6", titleZh: "幂等补跑", titleEn: "Idempotent regen",
        detailZh: "成功Finance核；失败继续；重复快照停止。", detailEn: "OK→Finance check; fail→BIT; dup→stop.",
      },
      {
        id: "7", titleZh: "验收", titleEn: "Accept",
        detailZh: "记录数金额对账一致结束/归档；仍缺跟踪。", detailEn: "Rows/amounts OK→end/archive; still miss→track.",
      },
    ]),
    evidence: ['Batch id', 'Expected vs actual rows', 'Retry log', 'Uniqueness'],
    evidenceZh: ['批次ID', '预期vs实际行数', '重试记录', '唯一性'],
    tags: ['v-exchange-perp', 'runbook-v18', 'skill', 'l1-27', 'finance', 'snapshot', 'part3'],
  },
  {
    id: "ve-sk-l1-28-flow-unmapped",
    slug: "ve-l1-28-flow-type-unmapped",
    title: "L1-28 Ledger type unmapped",
    titleZh: "L1-28｜资金流水类型未匹配",
    summary: "Never dump to 'other'; map new types via Finance; idempotent replay.",
    summaryZh: "不得直接归入“其他”；新类型Finance映射；重处理幂等。",
    severity: "P1",
    owners: ['L1', 'Finance', 'BIT', 'RC'],
    relatedRiskIds: [],
    triggers: ['Lark unmapped ledger type', 'batch unknown flow types'],
    triggersZh: ['Lark 流水类型未匹配', '批量未知类型'],
    steps: stepsFromTable([
      {
        id: "1", titleZh: "单笔vs批量", titleEn: "Single vs batch",
        detailZh: "单笔核来源；批量查映射/上游变更。", detailEn: "Single→source; batch→map/upstream.",
      },
      {
        id: "2", titleZh: "流水与事件ID", titleEn: "Flow & event id",
        detailZh: "找到→映射；找不到→事件产消。", detailEn: "Found→map; missing→event prod/cons.",
      },
      {
        id: "3", titleZh: "划转/成交/Funding溯源", titleEn: "Transfer/trade/Funding source",
        detailZh: "分别核对；均无→BIT原始消息。", detailEn: "Check each; none→BIT raw msg.",
      },
      {
        id: "4", titleZh: "映射表版本", titleEn: "Mapping table version",
        detailZh: "新合法类型Finance新增；匹配失败BIT；来源不明不归其他。", detailEn: "New legal→Finance add; match fail→BIT; unknown≠other.",
      },
      {
        id: "5", titleZh: "消息格式幂等", titleEn: "Msg format/idempotency",
        detailZh: "格式变适配；重复消费核幂等；分类错Finance。", detailEn: "Format→adapt; dup→idem; class→Finance.",
      },
      {
        id: "6", titleZh: "漏记/分类", titleEn: "Miss/class",
        detailZh: "漏记重复→Finance/RC纠错；仅分类错修分类。", detailEn: "Miss/dup→Finance/RC; class-only→reclass.",
      },
      {
        id: "7", titleZh: "重处理", titleEn: "Replay",
        detailZh: "成功复核；重复入账立刻停；仍无法映射追查。", detailEn: "OK→review; dup post→stop; unmapped→trace.",
      },
      {
        id: "8", titleZh: "验收", titleEn: "Accept",
        detailZh: "未匹配笔数归零结束/归档；差异继续。", detailEn: "Unmapped=0→end/archive; gap→continue.",
      },
    ]),
    evidence: ['Unmapped type', 'Raw event id', 'Mapping version', 'Idempotent replay'],
    evidenceZh: ['未匹配类型', '原始事件ID', '映射版本', '幂等重处理'],
    tags: ['v-exchange-perp', 'runbook-v18', 'skill', 'l1-28', 'finance', 'mapping', 'part3'],
  },
  {
    id: "ve-sk-l2-a-source-pricing",
    slug: "ve-l2-a-source-to-pricing",
    title: "L2-A Source switch → pricing fault",
    titleZh: "L2-A｜指数源切换 → 内部定价异常",
    summary: "13 + 07/08/10; Index-first vs Mark-first; may escalate L2-D.",
    summaryZh: "13+07/08/10；Index先 vs Mark先；可升级L2-D。",
    severity: "P0",
    owners: ['L1', 'BIT', 'Pricing', 'RC'],
    relatedRiskIds: [],
    triggers: ['Lark 13 with 07/08/10 same contract', 'source switch + price deviation'],
    triggersZh: ['同合约13与07/08/10', '切源+价格偏差'],
    steps: stepsFromTable([
      {
        id: "1", titleZh: "时间关联", titleEn: "Time correlate",
        detailZh: "切源期间/紧邻偏差→L2-A；无关联分别L1。", detailEn: "Near switch→L2-A; else separate L1.",
      },
      {
        id: "2", titleZh: "切源前后三价", titleEn: "Prices around switch",
        detailZh: "Index先→源/过渡；Index稳Mark异→Mark算法。", detailEn: "Index first→source/ramp; Mark alone→algo.",
      },
      {
        id: "3", titleZh: "【可选】源配置", titleEn: "[Optional] source cfg",
        detailZh: "配置异BIT/Pricing；正常查行情。", detailEn: "Cfg→BIT/Pricing; else live quotes.",
      },
      {
        id: "4", titleZh: "友商与Mark状态", titleEn: "Peers & Mark status",
        detailZh: "友商一致本所Index偏→Index；Index正常Mark偏→候选价。", detailEn: "Peers OK we Index off→Index; Index OK Mark off→candidates.",
      },
      {
        id: "5", titleZh: "BIT原始与状态机", titleEn: "BIT raw & FSM",
        detailZh: "采集/计算修；真实离群Pricing策略。", detailEn: "Ingest/calc fix; real outlier→Pricing policy.",
      },
      {
        id: "6", titleZh: "强平成交影响", titleEn: "Liq/trade impact",
        detailZh: "错误强平→RC+L2-D；无影响验收。", detailEn: "Bad liq→RC+L2-D; else accept.",
      },
      {
        id: "7", titleZh: "验收", titleEn: "Accept",
        detailZh: "无风险结束；处置归档；仍异跟踪。", detailEn: "No risk→end; disposed→archive; still→track.",
      },
    ]),
    evidence: ['Switch timeline', 'Index vs Mark order', 'Source weights', 'Liq overlap'],
    evidenceZh: ['切源时间线', 'Index/Mark先后', '源权重', '强平重叠'],
    tags: ['v-exchange-perp', 'runbook-v18', 'skill', 'l2-a', 'pricing', 'index', 'part3'],
  },
  {
    id: "ve-sk-l2-b-price-funding",
    slug: "ve-l2-b-price-to-funding",
    title: "L2-B Price disconnect → Funding drift",
    titleZh: "L2-B｜市场价格脱节 → Funding偏差",
    summary: "07/08 + 16 same Funding cycle; Premium samples; settle protect.",
    summaryZh: "07/08+16同Funding周期；Premium采样；结算保护。",
    severity: "P0",
    owners: ['L1', 'BIT', 'Pricing', 'Finance', 'RC'],
    relatedRiskIds: [],
    triggers: ['Lark price deviation + Funding same cycle', '07/08 with 16'],
    triggersZh: ['同周期价格偏差+Funding', '07/08与16'],
    steps: stepsFromTable([
      {
        id: "1", titleZh: "周期关联", titleEn: "Cycle correlate",
        detailZh: "同计算周期且价格证据→L2-B；否则分别L1。", detailEn: "Same cycle+evidence→L2-B; else L1s.",
      },
      {
        id: "2", titleZh: "校正口径", titleEn: "Align Funding basis",
        detailZh: "周期/预测结算不一先校正。", detailEn: "Cycle/pred/settle mismatch→align.",
      },
      {
        id: "3", titleZh: "价格先因", titleEn: "Price cause first",
        detailZh: "Index先→源；Mark→Mark；价格正常→Funding公式。", detailEn: "Index→sources; Mark→Mark; prices OK→Funding formula.",
      },
      {
        id: "4", titleZh: "Premium解释力", titleEn: "Premium explains?",
        detailZh: "可解释→BIT确认；不可→逐笔采样。", detailEn: "Explains→BIT confirm; else tick samples.",
      },
      {
        id: "5", titleZh: "上游切源/降级", titleEn: "Upstream switch/degrade",
        detailZh: "有上游先定位并评估Funding；无→计算或外部数据。", detailEn: "Upstream→fix then Funding impact; else calc/external.",
      },
      {
        id: "6", titleZh: "BIT采样Impact", titleEn: "BIT samples/Impact",
        detailZh: "采样/公式/限幅修；真实差异Pricing。", detailEn: "Sample/formula/cap fix; real→Pricing.",
      },
      {
        id: "7", titleZh: "结算流水", titleEn: "Settle ledger",
        detailZh: "错误结算Finance纠；临近→RC/BIT；无影响监控。", detailEn: "Bad settle→Finance; near→RC/BIT; else watch.",
      },
      {
        id: "8", titleZh: "验收", titleEn: "Accept",
        detailZh: "价格Funding流水正常结束/归档；仍异跟踪。", detailEn: "Price/Funding/ledger OK→end/archive; else track.",
      },
    ]),
    evidence: ['Funding cycle', 'Premium samples', 'Impact Price', 'Settle rows'],
    evidenceZh: ['Funding周期', 'Premium采样', 'Impact Price', '结算流水'],
    tags: ['v-exchange-perp', 'runbook-v18', 'skill', 'l2-b', 'funding', 'pricing', 'part3'],
  },
];

