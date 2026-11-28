import type { Skill, SkillStep } from "@/lib/types";

function stepsFromTable(
  rows: Array<{ id: string; titleZh: string; titleEn: string; detailZh: string; detailEn: string }>,
): SkillStep[] {
  return rows.map((r) => ({
    id: r.id, title: r.titleEn, titleZh: r.titleZh, detail: r.detailEn, detailZh: r.detailZh,
  }));
}

/** Interactive checklists for L2-C..F + linkage/escalation (tables in part4 markdown). */
export const VE_RUNBOOK_PART4_SKILLS: Skill[] = [
  {
    id: "ve-sk-l2-c-depth-notrade",
    slug: "ve-l2-c-depth-to-no-trade",
    title: "L2-C Depth shortfall → no-trade",
    titleZh: "L2-C｜盘口流动性下降 → 无交易",
    summary: "L1-02+L1-01; >60s is investigate trigger not match fault proof; L1-07 auxiliary.",
    summaryZh: "L1-02+L1-01；>60秒是排查条件非撮合故障证明；L1-07辅助证据。",
    severity: "P0",
    owners: ['L1', 'DB', 'BIT', 'RC', 'Finance', 'Pricing'],
    relatedRiskIds: [],
    triggers: ['Lark depth + no-trade same contract', 'no-trade >60s with depth shortfall'],
    triggersZh: ['同合约深度不足+无交易', '无交易>60秒且深度不足'],
    steps: stepsFromTable([
      {
        id: "1", titleZh: "匹配告警与时长", titleEn: "Match alerts & duration",
        detailZh: "≤60秒盘口正常观察；>60秒+深度不足继续；时间无关分别L1。", detailEn: "≤60s book OK→watch; >60s+depth→continue; unrelated→separate L1.",
      },
      {
        id: "2", titleZh: "双边盘口", titleEn: "Two-sided book",
        detailZh: "正常→订单需求；单边/双边缺失→DB/BIT。", detailEn: "OK→order demand; missing side(s)→DB/BIT.",
      },
      {
        id: "3", titleZh: "当前委托", titleEn: "Open orders",
        detailZh: "无新增需求不足；限价未到价非撮合异；应成未成→订单ID交BIT。", detailEn: "No new→demand; limit not marketable≠match bug; should-fill→BIT.",
      },
      {
        id: "4", titleZh: "Spread/Index/Mark", titleEn: "Spread/Index/Mark",
        detailZh: "Spread扩→DB；Index/Mark异→L1-07；价正常无法成交→撮合。", detailEn: "Spread wide→DB; Index/Mark odd→L1-07; price OK no fill→match.",
      },
      {
        id: "5", titleZh: "DB报价状态", titleEn: "DB quote state",
        detailZh: "暂停确认恢复；资金不足方案；已提交未展示→BIT。", detailEn: "Paused→restore; short funds→plan; submitted not shown→BIT.",
      },
      {
        id: "6", titleZh: "BIT拒单/订单簿", titleEn: "BIT reject/book",
        detailZh: "规则拒绝说明；合法异拒修复；不同步修同步。", detailEn: "Rule reject→explain; illegal reject→fix; desync→sync.",
      },
      {
        id: "7", titleZh: "【可选】Price Band", titleEn: "[Optional] Price Band",
        detailZh: "保护生效维持；配置疑错审批调整。", detailEn: "Protect OK keep; bad cfg→approve adjust.",
      },
      {
        id: "8", titleZh: "RC交易保护", titleEn: "RC trade protect",
        detailZh: "重大风险审批；可控DB/BIT；无风险不操作。", detailEn: "Major→RC; controllable→DB/BIT; no risk→no prod action.",
      },
      {
        id: "9", titleZh: "验收", titleEn: "Accept",
        detailZh: "盘口订单恢复结束/归档；仍无法成交升级。", detailEn: "Book/orders OK→end/archive; still blocked→escalate.",
      },
    ]),
    evidence: ['Depth USD', 'Last trade age', 'Order IDs', 'Spread'],
    evidenceZh: ['深度金额', '无成交秒数', '订单ID', 'Spread'],
    tags: ['v-exchange-perp', 'runbook-v18', 'skill', 'l2-c', 'book', 'depth', 'no-trade', 'part4'],
  },
  {
    id: "ve-sk-l2-d-pricing-liq",
    slug: "ve-l2-d-pricing-to-liquidation",
    title: "L2-D Pricing fault → large liq risk",
    titleZh: "L2-D｜定价异常 → 大额强平风险",
    summary: "L1-07/08/10 + L1-23; distinguish input vs trigger calc vs exec errors.",
    summaryZh: "L1-07/08/10+L1-23；区分价格输入、触发计算与执行异常。",
    severity: "P0",
    owners: ['L1', 'BIT', 'Pricing', 'RC', 'Finance', 'DB'],
    relatedRiskIds: [],
    triggers: ['pricing anomaly window + large liq', 'Mark observe with liq'],
    triggersZh: ['定价异常窗口内大额强平', 'Mark观察期伴随强平'],
    steps: stepsFromTable([
      {
        id: "1", titleZh: "时间窗口关联", titleEn: "Time-window link",
        detailZh: "同合约异常窗内强平→L2-D；无关分别SOP；不明以强平记录核实。", detailEn: "Same contract in window→L2-D; else L1s; unclear→liq records.",
      },
      {
        id: "2", titleZh: "触发条件", titleEn: "Trigger conditions",
        detailZh: "疑似不满足→RC+BIT Mark/MMR；符合→执行；不足→触发快照。", detailEn: "Suspect unmet→RC+BIT; met→exec; thin data→snapshot.",
      },
      {
        id: "3", titleZh: "三价与友商", titleEn: "Three prices vs peers",
        detailZh: "Index先→源/L2-A；Mark单独→算法；同步一致→正常波动下强平计算。", detailEn: "Index first→source/L2-A; Mark alone→algo; sync→normal-mkt liq calc.",
      },
      {
        id: "4", titleZh: "合理价格管理", titleEn: "Mark admin",
        detailZh: "降级异→三候选；正常→强平时Mark；配置疑→Pricing/BIT。", detailEn: "Degrade→3 candidates; OK→Mark at liq; cfg→Pricing/BIT.",
      },
      {
        id: "5", titleZh: "执行完整性", titleEn: "Exec completeness",
        detailZh: "完成→账务；部分→残余接仓；失败→BIT/RC剩余风险。", detailEn: "Done→ledger; partial→residual/takeover; fail→BIT/RC.",
      },
      {
        id: "6", titleZh: "BIT触发快照", titleEn: "BIT trigger snapshot",
        detailZh: "Mark错→价链路+RC纠错；MMR错修风控；撮合错修执行；均对记依据。", detailEn: "Bad Mark→price+RC; MMR→risk eng; match→exec; all OK→justify.",
      },
      {
        id: "7", titleZh: "账务与接仓", titleEn: "Ledger & takeover",
        detailZh: "账不一Finance；接仓积压→L2-E；一致验收。", detailEn: "Ledger gap→Finance; backlog→L2-E; match→accept.",
      },
      {
        id: "8", titleZh: "RC错误强平处置", titleEn: "RC bad-liq dispose",
        detailZh: "错误强平审批恢复/补偿；正常不强补；风险未解除继续保护。", detailEn: "Bad liq→approve restore/comp; normal no comp; open risk→protect.",
      },
      {
        id: "9", titleZh: "验收", titleEn: "Accept",
        detailZh: "全正常结束；处置归档；仍错仓/账升级。", detailEn: "All OK→end; disposed→archive; residual→escalate.",
      },
    ]),
    evidence: ['Liq window vs price alerts', 'Mark/MMR snapshot', 'Fill vs liq qty', 'PNL ledger'],
    evidenceZh: ['强平窗vs定价告警', 'Mark/MMR快照', '成交vs强平量', 'PNL流水'],
    tags: ['v-exchange-perp', 'runbook-v18', 'skill', 'l2-d', 'pricing', 'liquidation', 'part4'],
  },
  {
    id: "ve-sk-l2-e-liq-takeover",
    slug: "ve-l2-e-liq-to-db-backlog",
    title: "L2-E Large liq → DB takeover backlog",
    titleZh: "L2-E｜大额强平 → DB接仓积压",
    summary: "L1-23+L1-20; near-time alerts alone ≠ same event; hedge before force close.",
    summaryZh: "L1-23+L1-20；仅时间接近≠同一事件；已对冲不自动强平。",
    severity: "P0",
    owners: ['L1', 'DB', 'BIT', 'Finance', 'RC'],
    relatedRiskIds: [],
    triggers: ['large liq with DB position timeout', 'takeover qty after liq'],
    triggersZh: ['大额强平伴随DB持仓超时', '强平后接仓数量'],
    steps: stepsFromTable([
      {
        id: "1", titleZh: "匹配强平与接仓", titleEn: "Match liq & takeover",
        detailZh: "同合约时间相关继续；无对应分别L1。", detailEn: "Related→continue; else separate L1-23/20.",
      },
      {
        id: "2", titleZh: "是否产生接仓", titleEn: "Takeover created?",
        detailZh: "未产生按强平单点；已产生继续；记录不一BIT。", detailEn: "None→liq-only; yes→continue; mismatch→BIT.",
      },
      {
        id: "3", titleZh: "数量映射", titleEn: "Qty mapping",
        detailZh: "匹配核时长；不匹配分批/残余；重复→BIT/RC。", detailEn: "Match→duration; mismatch→batches; dup→BIT/RC.",
      },
      {
        id: "4", titleZh: "超时/大额", titleEn: "Timeout / size",
        detailZh: ">10m超时；未超时大额按敞口；已清零核对对冲收口。", detailEn: ">10m timeout; large open→exposure; cleared→hedge close.",
      },
      {
        id: "5", titleZh: "资金权益", titleEn: "Funds/equity",
        detailZh: "不足Finance/DB/RC；权益降L1-19；充足查对冲。", detailEn: "Short→Finance/DB/RC; equity↓→L1-19; OK→hedge.",
      },
      {
        id: "6", titleZh: "DB对冲结果", titleEn: "DB hedge result",
        detailZh: "充分/部分/失败分支；失败立即RC。", detailEn: "Full/partial/fail; fail→RC now.",
      },
      {
        id: "7", titleZh: "仓位资金记录", titleEn: "Pos/fund records",
        detailZh: "状态错BIT；资金不一Finance；一致按真实风险。", detailEn: "State→BIT; funds→Finance; match→real risk.",
      },
      {
        id: "8", titleZh: "RC授权", titleEn: "RC authorize",
        detailZh: "超容忍紧急减险；可控按策略；已对冲超时不自动强平。", detailEn: "Beyond→RC; controllable→plan; hedged timeout≠auto close.",
      },
      {
        id: "9", titleZh: "验收", titleEn: "Accept",
        detailZh: "敞口解除归档；已对冲无风险结束；未对冲升级。", detailEn: "Cleared→archive; hedged OK→end; unhedged→escalate.",
      },
    ]),
    evidence: ['Liq↔takeover IDs', 'Hold duration', 'Hedge fills', 'Net exposure'],
    evidenceZh: ['强平↔接仓ID', '持仓时长', '对冲成交', '净敞口'],
    tags: ['v-exchange-perp', 'runbook-v18', 'skill', 'l2-e', 'liquidation', 'db', 'takeover', 'part4'],
  },
  {
    id: "ve-sk-l2-f-depth-liq",
    slug: "ve-l2-f-depth-to-liq-disposal",
    title: "L2-F Depth shortfall → liq disposal risk",
    titleZh: "L2-F｜流动性下降 → 强平处置风险",
    summary: "L1-02+23+20; side-aware depth; do not disable Price Band lightly.",
    summaryZh: "L1-02+23+20；分侧深度；不轻易关闭Price Band。",
    severity: "P0",
    owners: ['L1', 'DB', 'BIT', 'RC', 'Finance', 'Pricing'],
    relatedRiskIds: [],
    triggers: ['depth shortfall during liq', 'depth + liq + DB position'],
    triggersZh: ['强平期间深度不足', '深度+强平+DB持仓'],
    steps: stepsFromTable([
      {
        id: "1", titleZh: "同一处置链路", titleEn: "Same disposal chain",
        detailZh: "同一强平/接仓链路→L2-F；仅同时告警分别L1；不明BIT事件ID。", detailEn: "Same chain→L2-F; coincident only→L1s; unclear→BIT IDs.",
      },
      {
        id: "2", titleZh: "分侧深度", titleEn: "Side-aware depth",
        detailZh: "多头看买盘/空头看卖盘；对应侧薄→滑点接仓；盘口正常→撮合；价异→L2-D。", detailEn: "Long→bid / short→ask; thin→slip/takeover; book OK→match; price odd→L2-D.",
      },
      {
        id: "3", titleZh: "强平执行", titleEn: "Liq execution",
        detailZh: "完成→滑点接仓；部分→剩余量；失败→RC/BIT暴露风险。", detailEn: "Done→slip/takeover; partial→remain; fail→RC/BIT.",
      },
      {
        id: "4", titleZh: "滑点核对", titleEn: "Slippage check",
        detailZh: "合规则继续；明显异→BIT重建+RC；不确定要执行规则明细。", detailEn: "In-rule→continue; odd→BIT rebuild+RC; unclear→rules/details.",
      },
      {
        id: "5", titleZh: "接仓资金", titleEn: "Takeover funds",
        detailZh: "超时敞口扩→DB/RC；资金不足Finance/RC；已清理核对对冲。", detailEn: "Timeout grow→DB/RC; short→Finance/RC; cleared→hedge.",
      },
      {
        id: "6", titleZh: "外部对冲", titleEn: "External hedge",
        detailZh: "流动性不足分批方案；技术拒单BIT；已充分核对残余。", detailEn: "Illiquid→batch plan; tech reject→BIT; full→residual.",
      },
      {
        id: "7", titleZh: "Price Band/接口", titleEn: "Price Band/API",
        detailZh: "撮合接口错修；Band正常不直接关；配置疑错审批。", detailEn: "Match/API fix; Band OK keep; bad cfg approve.",
      },
      {
        id: "8", titleZh: "RC保护减险", titleEn: "RC protect/de-risk",
        detailZh: "重大未对冲立即审批；可控授权执行；短暂稀薄不敏感动作。", detailEn: "Major unhedged→RC now; controllable→auth; brief thin→no sensitive.",
      },
      {
        id: "9", titleZh: "验收", titleEn: "Accept",
        detailZh: "全恢复归档；无实际风险结束；任一项异升级。", detailEn: "All recover→archive; no risk→end; any fail→escalate.",
      },
    ]),
    evidence: ['Side depth at liq', 'Slippage vs Mark', 'Takeover & hedge', 'Price Band params'],
    evidenceZh: ['强平时分侧深度', '滑点vs Mark', '接仓与对冲', 'Price Band参数'],
    tags: ['v-exchange-perp', 'runbook-v18', 'skill', 'l2-f', 'depth', 'liquidation', 'db', 'part4'],
  },
  {
    id: "ve-sk-runbook-v18-linkage",
    slug: "ve-runbook-v18-l1-l2-linkage",
    title: "Runbook V18 · L1→L2 linkage & close-out",
    titleZh: "Runbook V18｜L1→L2联动入口与收口标准",
    summary: "9 L1 entry points into L2; no duplicate incidents; escalation matrix; 28+6=34 complete.",
    summaryZh: "9个L1联动入口；多L2不重复建档；升级收口矩阵；28+6=34完整。",
    severity: "P1",
    owners: ['L1', 'RC', 'BIT', 'DB', 'Pricing', 'Finance'],
    relatedRiskIds: [],
    triggers: ['Need which L2 to enter', 'Multiple L2 hits same chain', 'Escalation / close-out criteria'],
    triggersZh: ['需判断进入哪条L2', '多条L2同时命中', '升级与收口标准'],
    steps: stepsFromTable([
      {
        id: "1", titleZh: "查9入口表", titleEn: "Use 9-entry table",
        detailZh: "按L1事件查必查Lark关联告警与进入条件。", detailEn: "From L1, read required Lark correlates & L2 entry conditions.",
      },
      {
        id: "2", titleZh: "多L2串联", titleEn: "Chain multi-L2",
        detailZh: "不重复建档；主事件串联；优先错误强平/未对冲敞口再追上游。", detailEn: "No duplicate files; one master chain; fix bad liq/unhedged first.",
      },
      {
        id: "3", titleZh: "证据包", titleEn: "Evidence pack",
        detailZh: "按第五部分提供Lark、订单/仓位ID、K线、流水等。", detailEn: "Per escalation matrix: Lark, IDs, candles, ledger.",
      },
      {
        id: "4", titleZh: "L1不擅动生产", titleEn: "L1 no prod actions",
        detailZh: "配置/资金/交易动作只提建议，RC授权执行。", detailEn: "Config/funds/trade actions: advise only; RC authorizes.",
      },
      {
        id: "5", titleZh: "收口验收", titleEn: "Close-out",
        detailZh: "对照收口条件：价格/盘口/订单/强平/敞口/Funding/对账一致后再结束或归档。", detailEn: "Meet close-out criteria before end/archive.",
      },
    ]),
    evidence: ['Linkage table row', 'Master incident id', 'Escalation evidence pack', 'Close-out checklist'],
    evidenceZh: ['联动入口行', '主事件ID', '升级证据包', '收口清单'],
    tags: ['v-exchange-perp', 'runbook-v18', 'skill', 'linkage', 'escalation', 'close-out', 'part4', 'overview'],
  },
];

