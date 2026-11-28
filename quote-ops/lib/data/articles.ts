export type Article = {
  id: string;
  slug: string;
  title: string;
  titleZh: string;
  summary: string;
  summaryZh: string;
  body: string;
  bodyZh: string;
  tags: string[];
};

export const ARTICLES: Article[] = [
  {
    id: "art-principles",
    slug: "judgment-principles",
    title: "Judgment Principles: H / T / A / M",
    titleZh: "判断原则：H / T / A / M",
    summary: "Broker loss is not proof of client abuse. Classify with evidence.",
    summaryZh: "Broker 亏损不是客户违规的证据。分类必须有证据。",
    body: `Core principle: Broker 亏钱 ≠ 客户违规. Clients may profit through legitimate trading; the broker manages loss via correct quoting, hedging, and risk — not by labelling profitable clients as malicious.

Classes:
- H Healthy — lawful profitable trading even if the broker loses. Execute normally; manage exposure/hedge.
- T Toxic / Review — adverse selection risk, not necessarily a rule breach. Monitor, investigate, improve quote/exec.
- A Abusive — confirmed use of system defects or breach of applicable rules/contracts. Preserve evidence, fix defects, compliance review.
- M Malicious / Fraud — fraud, unauthorised ops, or technical attacks. Security response, risk containment, lawful investigation.

Frequency F4–F1 and severity P0–P3 in the catalog are industry-experience estimates, not Vantage incident rates.

Fair execution: account opening and execution rules must be fair and transparent. Do not retrospectively alter trade outcomes solely because markout was adverse to the broker. FCA CFD supervision emphasises fair execution, client interests, and market-abuse monitoring.`,
    bodyZh: `核心原则：Broker 亏钱 ≠ 客户违规。客户可通过正常交易持续盈利；Broker 应通过正确报价、对冲和风险管理控制自身损失，而不是因为客户盈利就认定其恶意。

分类：
- H Healthy — 正常合法盈利，即使 Broker 亏损。正常执行，管理敞口及对冲。
- T Toxic / Review — 不利选择风险，未必违规。监控、调查、改善报价和执行。
- A Abusive — 利用已确认系统缺陷，或违反适用规则/合同。保留证据、修复漏洞、合规复核。
- M Malicious / Fraud — 欺诈、未经授权操作或恶意技术攻击。安全响应、限制风险、调查及依法处置。

目录中的频率 F4–F1 与严重度 P0–P3 为行业经验估计，不是 Vantage 实际事件数据。

公平执行：开户与执行规则必须公平透明；不能仅因 Markout 对 Broker 不利就追溯改变交易结果。FCA 对 CFD 强调公平执行、客户利益及市场滥用监控。`,
    tags: ["principles", "classification", "fca"],
  },
  {
    id: "art-priority",
    slug: "detection-priorities",
    title: "What to Detect First",
    titleZh: "优先检测什么",
    summary: "Prioritise systemic loss and market abuse — not merely who made the broker lose money.",
    summaryZh: "优先系统性损失与市场滥用，而不是单纯谁让 Broker 亏钱。",
    body: `P0 focus:
- Stale price / bad tick fills — Pricing + Trading — Quote Age, Quote Version, abnormal fills
- Abnormal price penetration / exploitability — Pricing + Dealing — Price Deviation, Markout, Hedge Loss
- Margin / stop-out holes — Trading + Admin — independent margin, positions, stop-out state
- Unauthorised fund ops & ATO — Security + Finance — login risk, fund changes, abnormal withdrawals
- Linked accounts bypassing limits into large exposure — Dealing + Compliance — UBO exposure, concentration
- Market manipulation, ML, insider dealing — Compliance — behaviour + linkage + fund flows

P1 focus:
- Latency arb candidates — Pricing + RO — Quote Age + positive markout + defect evidence
- Bonus / IB / swap abuse — Fraud + Finance
- Cross-server / failover arb — Pricing + R&D
- API / EA malicious traffic — R&D + Security`,
    bodyZh: `P0 重点：
- 旧价 / Bad Tick 成交 — Pricing + Trading — Quote Age、Quote Version、异常成交
- 异常价格穿透及可利用性 — Pricing + Dealing — Price Deviation、Markout、Hedge Loss
- Margin / Stop-Out 漏洞 — Trading + Admin — 保证金独立校验、持仓及强平状态
- 未授权资金操作及账户接管 — Security + Finance — 登录风险、资金变更、异常出金
- 关联账户规避限额造成重大敞口 — Dealing + Compliance — UBO 敞口、集中度
- 市场操纵、洗钱、内幕交易 — Compliance — 交易行为与关联账户、异常资金流

P1 重点：
- 延迟套利候选 — Pricing + RO — Quote Age + 正向 Markout + 价格缺陷证据
- Bonus / IB / Swap 滥用 — Fraud + Finance
- Cross-Server / Failover 套利 — Pricing + R&D
- API / EA 恶意流量 — R&D + Security`,
    tags: ["priority", "p0", "monitor"],
  },
  {
    id: "art-framework",
    slug: "six-module-framework",
    title: "Unified Six-Module Detection Framework",
    titleZh: "统一六模块检测框架",
    summary: "Do not build 86 siloed detectors. Share underlying features across six modules.",
    summaryZh: "不要开发 86 套独立检测。六大模块共享底层特征。",
    body: `Inputs: client orders/fills/funds/logins + quote/exec evidence (LP, PE, MT, Quote ID).

Modules:
1. Trading Behaviour
2. Account Linkage
3. Payment & Fraud
4. Security & API Abuse
5. Pricing Exploitation
6. Exposure & Economic Impact

All modules feed unified risk candidate events → disposition:
- Insufficient evidence → healthy / keep monitoring
- Partial evidence → human investigation
- Sufficient evidence → compliance review & authorised action

Top features: short-horizon markout; quote age + price deviation; account linkage; hedge slippage + broker PnL; order/API behaviour.

Abuse adjudication should keep four evidence types: behaviour pattern; system defect or clear rule basis; economic impact; human/compliance conclusion. Loss is not required for every case, but facts are.`,
    bodyZh: `输入：客户订单/成交/资金/登录 + 报价及执行证据（LP、PE、MT、Quote ID）。

模块：
1. 交易行为 Trading Behaviour
2. 账户关联 Account Linkage
3. 支付与欺诈 Payment & Fraud
4. 安全与 API 滥用 Security & API Abuse
5. 报价利用 Pricing Exploitation
6. 敞口与经济影响 Exposure & Economic Impact

统一风险候选事件 → 处置：
- 证据不足 → 正常交易 / 继续监控
- 证据部分 → 人工调查
- 证据充分 → 合规审核及授权处置

最有用特征：短窗口 Markout；Quote Age + 价格偏离；账户关联；对冲滑点 + Broker PnL；订单/API 行为。

滥用判定建议保留四类证据：行为模式；系统缺陷或明确规则依据；实际经济影响；人工/合规结论。不是每个案件都必须造成实际损失，但不能缺少事实基础。`,
    tags: ["framework", "monitor-2.0"],
  },
  {
    id: "art-healthy-vs-abusive",
    slug: "healthy-vs-abusive-example",
    title: "Healthy vs Abusive: XAUUSD Markout Example",
    titleZh: "Healthy vs Abusive：XAUUSD Markout 例",
    summary: "Same positive markout, three different dispositions.",
    summaryZh: "同样正向 Markout，三种不同结论。",
    body: `Two (or three) clients show continuous positive markout on XAUUSD:

Client A — follows trend; quotes fresh at fill; LP quotes reasonable. Even if +$100k profit → Healthy.

Client B — fills concentrate in windows where MT quotes are clearly stale; external reliable mid already moved; repeatedly correlates with a publisher fault → Potential Pricing Exploitation → human investigation, not automatic fraud.

Client C — independent evidence of illegal control of other accounts or unauthorised request tampering → Malicious/Fraud → security + compliance process.

Key: confirm whether the broker erred first, then whether the client breached rules.`,
    bodyZh: `多名客户在 XAUUSD 连续正向 Markout：

客户 A — 正常跟随趋势，成交时价格新鲜，LP 报价合理。即使赚 10 万美元 → Healthy。

客户 B — 大量交易集中在 MT 报价明显过期窗口，外部可靠参考价已变，且反复与某 Publisher 故障相关 → Potential Pricing Exploitation → 人工调查，而非直接认定欺诈。

客户 C — 有独立证据证明非法控制其他账户或未经授权篡改交易请求 → Malicious/Fraud → 安全及合规流程。

关键：先确认 Broker 自己有没有错误，再判断客户有没有违规。`,
    tags: ["example", "markout", "disposition"],
  },
  {
    id: "art-evidence-chains",
    slug: "three-evidence-chains",
    title: "Three Cross-Team Evidence Chains",
    titleZh: "三条跨部门证据链",
    summary: "Reusable chains for Monitor 2.0 and pricing backstop work.",
    summaryZh: "可供 Monitor 2.0 与报价兜底复用的证据链。",
    body: `1) Pricing → Trading → Dealing
quote anomaly → abnormal fill → markout → hedge impact → RCA
Best fit for pricing backstop projects.

2) Account → Trading → Finance
linked accounts → reverse positions/rewards → rebate & funding impact → Fraud Review
Needs Fraud, Finance, Compliance owners.

3) Trading/API → Infrastructure → Security
abnormal trade requests → system load → exec or funding anomalies → Security Review
Needs R&D + Security.

The 86 scenarios are a broad discovery checklist — not proof that all occurred at Vantage, nor that all are legal breaches. Production rules should merge overlapping mechanisms to avoid alert duplication.

Management principle: Healthy profitable clients are normal business risk; Abusive behaviour needs evidence; Malicious activity needs security and compliance response.`,
    bodyZh: `1) Pricing → Trading → Dealing
报价异常 → 异常成交 → Markout → 对冲影响 → RCA
最适合结合报价兜底项目。

2) Account → Trading → Finance
关联账户 → 反向仓位/奖励 → 返佣及资金影响 → Fraud Review
需要 Fraud、Finance、Compliance Owner。

3) Trading/API → Infrastructure → Security
异常交易请求 → 系统负载 → 执行或资金异常 → Security Review
需要 R&D 与 Security。

86 项是广覆盖初始清单，不表示均已在 Vantage 发生，也不表示全部属于违规。正式规则库应按场景归并，避免重复告警。

管理原则：Healthy 盈利客户是正常经营风险；Abusive 需要证据；Malicious 需要安全与合规响应。`,
    tags: ["evidence", "monitor-2.0", "org"],
  },
];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug || a.id === slug);
}
