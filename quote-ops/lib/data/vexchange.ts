/**
 * V Exchange perpetual risk KB — kept separate from CFD Broker Pricing corpus.
 * Source: internal draft + risk inventory V2.0 · XAUUSD perp MVP
 */

import { buildVeRiskCatalogDocs } from "./ve-risk-catalog";
import { buildVeRunbookV18Docs } from "./ve-runbook-v18";

export type VeDoc = {
  id: string;
  slug: string;
  titleZh: string;
  titleEn: string;
  summaryZh: string;
  summaryEn: string;
  bodyZh: string;
  bodyEn: string;
  tags: string[];
  sortOrder: number;
  /** KB node kind; defaults to article when omitted. */
  kind?: "article" | "skill";
};

export const VE_META = {
  version: "V2.2",
  date: "2026-11-24",
  contract: "XAUUSD",
  status: "内部知识草案 + 138风险场景 + Runbook V18 Part1–2 skills",
};

const VE_CORE_DOCS: VeDoc[] = [
  {
    id: "ve-doc-principles",
    slug: "ve-principles",
    titleZh: "0. 知识库使用原则",
    titleEn: "0. Knowledge base principles",
    summaryZh: "适用部门、AI 四项职责、证据分级、只读限制。",
    summaryEn: "Audience, AI duties, evidence grades, read-only limits.",
    tags: ["principles", "evidence", "ai-limits"],
    sortOrder: 10,
    bodyZh: `适用部门：Risk Ops、RC 管理层、Pricing、BIT、DB 做市商、Finance、客服、产品团队。

## AI Bot 四项职责
- 告警排查：根据告警识别关联风险、查询数据、推断根因。
- SOP 辅助：告诉值班人员先查什么、找谁、何时升级、如何验收。
- 业务问答：回答内部部门和交易用户有关永续合约的问题。
- 知识沉淀：记录已确认的事故根因、解决方案及历史案例。

## 证据分级
| 标记 | 定义 |
| --- | --- |
| [OBS] | 历史生产配置截图或实际告警截图可见 |
| [DESIGN] | 历史设计方案、Runbook 或建议规则 |
| [PUBLIC] | 交易所公开资料或行业常见做法 |
| [TBC] | 尚未确认，必须保留占位符 |
| [INCIDENT] | 具体事件的实际观测数据 |

## 重要限制
AI **不允许**直接修改生产参数、切换价格源、停盘、注资、执行强平、强制成交或修改账本。只能提供只读分析和操作建议。

> 产品线：V Exchange 永续合约（与 CFD Broker Pricing 分离）。`,
    bodyEn: `Audience: Risk Ops, RC leadership, Pricing, BIT, DB market maker, Finance, CS, Product.

## AI bot duties
- Alert investigation
- SOP assistance
- Business Q&A for perp contracts
- Knowledge capture of confirmed RCAs

## Evidence grades
[OBS] / [DESIGN] / [PUBLIC] / [TBC] / [INCIDENT]

## Hard limit
AI must NOT change production params, switch price sources, halt markets, inject funds, liquidate, force trades, or edit ledgers. Read-only analysis only.

> Product line: V Exchange perpetual (separate from CFD Broker Pricing).`,
  },
  {
    id: "ve-doc-product",
    slug: "ve-product-architecture",
    titleZh: "1. 产品与业务架构",
    titleEn: "1. Product & business architecture",
    summaryZh: "XAUUSD 永续基础信息、交易风控链路、DB 三类账户。",
    summaryEn: "XAUUSD perp basics, risk flow, three DB accounts.",
    tags: ["product", "architecture", "db-accounts"],
    sortOrder: 20,
    bodyZh: `## 1.1 产品基础信息
| 项目 | 内容 |
| --- | --- |
| 交易产品 | XAUUSD 永续合约 |
| 结算币种 | USD |
| 入金 | USDT / USDC 按 1:1 记账 USD |
| 资金费率结算周期 | 当前截图为每 4 小时 [OBS/DESIGN] |
| Index 主价格源 | Kraken（历史设计）[DESIGN] |
| 备用价格源 | Binance、Bybit、OKX（历史设计）[DESIGN] |
| Mark Price | 三个候选价格的中位数及降级逻辑 |
| 做市商 | DB |
| 正式上线 | 2026年11月2日 |
| 合约乘数 / 最小下单 / 最大杠杆 / 保证金档位 | [TBC] |

## 1.2 交易与风控链路
用户注册 / KYC / 开立永续账户 → 入金 / 权益 / 可用保证金 → 订单 / 撮合 / DB 做市报价 → 持仓 / Index / Mark / Funding / 保证金监控 → 强平 / DB 接仓 / ADL / 风险处置 → 清算结算 / 流水 / 对账 / 提现。

具体执行顺序以生产状态机为准 [TBC]。

## 1.3 DB 三类账户
| 账户 | 功能 | 主要风险 |
| --- | --- | --- |
| 01 做市账户 | 挂单、提供买卖盘流动性 | 报价中断、深度不足、库存风险 |
| 02 接仓账户 | 承接强平后的风险头寸 | 接仓失败、处置超时、保证金不足 |
| 03 K 线账户 | 执行 K 线相关交易策略 | 余额不足、持仓过大、策略异常 |

三个账户必须通过真实 \`account_id\` 区分，不能把做市账户和接仓账户混为一谈。`,
    bodyEn: `## Product basics
XAUUSD perpetual, USD settlement, USDT/USDC 1:1, funding cycle ~4h [OBS/DESIGN], Index primary Kraken [DESIGN], backups Binance/Bybit/OKX [DESIGN], Mark = median of three candidates, MM = DB, live since 2026-11-02. Multiplier/lot/leverage/tiers [TBC].

## Flow
KYC → deposit/equity → orders/matching/DB quotes → position/Index/Mark/Funding/margin → liquidation/DB takeover/ADL → settlement/ledger/withdraw.

## DB accounts
01 MM · 02 takeover · 03 K-line — must use distinct account_id.`,
  },
  {
    id: "ve-doc-alarms",
    slug: "ve-alarm-catalog",
    titleZh: "2. 告警、阈值与频率",
    titleEn: "2. Alarms, thresholds & cadence",
    summaryZh: "Funding / 价偏 / 盘口 / Index·Mark / 强平 ADL / DB 账户监控目录。",
    summaryEn: "Funding, price drift, book, Index/Mark, liq/ADL, DB account monitors.",
    tags: ["alarms", "thresholds", "funding", "mark", "index"],
    sortOrder: 30,
    bodyZh: `> 历史截图配置 ≠ 当前生产全量配置。冲突值必须由 BIT 提供变更记录。

## 2.1 资金费率
| 告警 | 阈值 | 检测频率 | 状态 |
| --- | --- | --- | --- |
| XAUUSD 外部 Funding 偏差 | 0.1% | 历史每10分钟 | 已见生产告警 [OBS] |
| XAUUSD 内部 Funding 上限 | +0.45% | 每10分钟 | 历史配置 [DESIGN] |
| XAUUSD 内部 Funding 下限 | -0.45% | 每10分钟 | 历史配置 [DESIGN] |
| BTCUSD 外部/内部 Funding | 0.1% / ±0.25% | 每10分钟 | 历史停用 |

待确认：差异口径、预测 vs 已结算、同周期换算、重复推送/恢复、周末规则 [TBC]。

## 2.2 价格偏离
历史配置多为 1%/5min；**2026-11-22 生产告警 Mark vs Index ≥0.1%/1min** —— 配置冲突，不可自行认定长期有效 [INCIDENT/OBS]。

其他：Last/Mid/Ask1/Bid1 vs Index 1%；Bid1 vs Ask1 0.1%。

## 2.3 盘口与深度
0.1% 范围深度 ≤300 USD；有效档位 ≤25；空簿/无成交/尖刺等多项 [TBC]。Bid1/Ask1 异常参考 5 分钟规则。

## 2.4 Index / Mark
主源异常、单源失效、有效源<2、全部失效、Fallback、观察期、平滑、Mark 降级 —— 阈值多为 [TBC]。Mark/Index 偏离：当前事件 0.1% / 1 分钟 [INCIDENT]。

## 2.5 强平与 ADL
大额爆仓预警：名义 ≥$100,000 且 MMR 95%（历史配置，口径待确认）；失败/重试/接仓超时多为事件型 [TBC]。

## 2.6 DB 做市账户（9 项，P0/P1 为历史等级）
可用余额、保证金占用、权益/注资、单方向净仓、聚合净仓、实际杠杆、聚合浮盈、24h 已实现盈亏等 —— 详见原文表；正负号口径待核实。

## 2.7 K 线策略账户
净持仓 >2 / >5 XAU；权益与可用余额多档 P2/P1/P0。注意：检测频率 ≠ 群通知频率。`,
    bodyEn: `Historical screenshot configs ≠ full prod. BIT must confirm conflicts.

Funding external drift 0.1% (seen in prod). Internal ±0.45%. BTCUSD historically disabled.

Price drift: historic 1%; **2026-11-22 prod Mark vs Index ≥0.1%/1m** — conflict [INCIDENT].

Book depth ≤300 USD in 0.1% band; ≤25 levels; many fields [TBC].

Liq warning: notional ≥$100k & MMR 95% historic. DB MM / K-line account tables as in ZH body.`,
  },
  {
    id: "ve-doc-pricing",
    slug: "ve-pricing-engine",
    titleZh: "3. Index / Premium / Funding / Mark",
    titleEn: "3. Index / Premium / Funding / Mark",
    summaryZh: "指数、溢价、资金费率、标记价格计算与风险因果链。",
    summaryEn: "Index, premium, funding, mark formulas and risk chain.",
    tags: ["pricing", "index", "premium", "funding", "mark"],
    sortOrder: 40,
    bodyZh: `## 3.1 Index
多源参考价。历史设计：Kraken 主源；Binance/Bybit/OKX 备用；含异常、回退、观察期、恢复 [DESIGN]。权重/TTL/周末规则生产值 [TBC]。

## 3.2 Premium（行业参考 [PUBLIC]）
\`P = (max(0,B-I) - max(0,I-A)) / I\`，再平均/加权得 Average Premium。V Exchange 实际公式 [TBC]。

## 3.3 Funding
样本（高正溢价）：Funding ≈ AveragePremium − 0.05%。Clamp/Cap/Floor/舍入/周期参数 [TBC]。

## 3.4 Mark
三候选：资金费率调整公允价、市场移动平均基差公允价、最新成交价；有效数 3→中位数，2→平均，1→按类型（仅 Last 则 EMA），0→缓存或 Index 并告警。

\`P_fund = Index × (1 + FundingRate × 距下次结算小时 / Funding周期)\` [DESIGN/BRD]。其余候选与 EMA [TBC]。

## 3.5 风险因果（可能链路）
外部价格源 + DB 订单簿 → Index/Premium → Funding → P_fund → Mark → 保证金/强平。Mark 还受基差与 Last 影响，非单向依赖。`,
    bodyEn: `Index multi-source with Kraken primary [DESIGN]. Premium industry ref Binance-style impact formula [PUBLIC]; VE formula [TBC]. Funding ≈ AvgPremium−0.05% in samples. Mark = median of three candidates with degradation. Risk chain as in ZH.`,
  },
  {
    id: "ve-doc-admin",
    slug: "ve-admin-guide",
    titleZh: "4. 后台 Admin 与权限",
    titleEn: "4. Admin console & permissions",
    summaryZh: "定价/风险/订单/财务/ADL 页面用途与 RBAC；数据缺口清单。",
    summaryEn: "Pricing/risk/order/finance/ADL pages, RBAC, data gaps.",
    tags: ["admin", "rbac", "console"],
    sortOrder: 50,
    bodyZh: `原型约 56 页，部分为空/占位——**有按钮 ≠ 生产已实现**。

模块含：Index Price、Market Source、Fair Price、Spread/NoTrade/Depth Monitor、Active Order/History/Deal、Position、Liquidate History、Trigger/Stop、Financial Account、FinanceFlow、Transfer、User Info、Admin ADL、Close Position（高危）。

## 4.1 权限原则
| 角色 | 允许 | 禁止 |
| --- | --- | --- |
| Risk Ops L1 | 查询告警/价格/订单/风险 | 改定价/资金/仓位 |
| Risk Ops L2 | 深度排查、升级、协调验收 | 未授权生产执行 |
| RC 管理层 | 审批风险保护建议 | 绕过正式授权 |
| Pricing / BIT | 授权后技术修复 | 擅自改业务风险规则 |
| Finance | 核实资金、授权资金操作 | 未授权调账本 |
| AI Bot | 只读查询、报告、建议 | 所有生产写操作 |

## 4.2 数据缺口
订单/UID/仓位/强平 ID 查询、原始价格源、Index/Premium/Funding/Mark 重放、DB 账户实时、流水批次、完整审计 —— 未验证统一标 \`[待确认:生产数据可用性、查询字段、权限、URL]\`。`,
    bodyEn: `~56 prototype pages; buttons ≠ prod. RBAC: AI bot read-only. Data gaps must be marked [TBC] until verified.`,
  },
  {
    id: "ve-doc-sop",
    slug: "ve-alert-sop",
    titleZh: "5–6. 告警排查 SOP 与专项路径",
    titleEn: "5–6. Alert SOP & playbooks",
    summaryZh: "通用七步工作流、标准记录格式、八类专项排查。",
    summaryEn: "Seven-step workflow, record format, eight playbooks.",
    tags: ["sop", "runbook", "investigation"],
    sortOrder: 60,
    bodyZh: `## 5.1 标准工作流
1. T0 接收告警并保存 ID/合约/时间/阈值/实际值/链接  
2. 确认数据真实性（空值、重复、规则版本）  
3. 定位业务系统与影响范围  
4. 识别客户与平台风险  
5. 升级 Owner（Pricing/BIT/DB/Finance/RC）  
6. 授权修复（审批人、执行人、回滚）  
7. 恢复验收（技术/交易/资金仓位/残余风险）

## 5.2 标准记录字段
Alert ID、Alarm Code、Contract、Severity、Trigger/Receive Time、Observed/Threshold、Impacted Accounts、Primary/Escalation Owner、Root Cause、Corrective Action、Recovery Evidence、Close Approval。

## 6. 专项路径（摘要）
- **外部 Funding>0.1%**：友商口径 → 原始 API → Premium → Impact → 重算 Funding → 是否已结算。  
- **Mark vs Index**：同秒对齐 → 三候选 → 有效性 → 强平/保证金影响。  
- **Index vs 友商**：同秒对比 → 标的口径 → 四源原始报价 → 权重/Fallback/TTL → 周末流动性 → DB 锚点。  
- **空簿/单边/深度不足**：一档与多档 → DB 连接 → 做市账户 → Price Band 拒单码。  
- **接仓失败/ADL**：事件 ID → 是否到账 → 权限映射 → 失败原因 → 部分成功 → 幂等。  
- **接仓未对冲**：真实对冲订单（非仅 WS）→ 持仓时长 → 是否升级 RC；强制成交只转移账户敞口。  
- **接仓资金不足**：自动注资 → 额度 → 流水一致性。  
- **强平财务对账**：Mark→保证金→强平→成交→接仓/ADL→PnL→费/Funding→流水批次。`,
    bodyEn: `Seven-step SOP + eight playbooks covering funding drift, mark/index, index vs peers, empty book, takeover/ADL, unhedged takeover, underfunded takeover, liq↔finance recon.`,
  },
  {
    id: "ve-doc-data",
    slug: "ve-data-contracts",
    titleZh: "7. 数据库 / API / MCP 契约",
    titleEn: "7. DB / API / MCP contracts",
    summaryZh: "只读连接占位、逻辑实体、MCP 工具、L0–L3 安全层级。",
    summaryEn: "Read-only placeholders, logical entities, MCP tools, L0–L3.",
    tags: ["database", "mcp", "security"],
    sortOrder: 70,
    bodyZh: `## 7.1 连接配置
Environment/Host/Port/DB/Schema/只读用户/Vault/网络/MCP/SQL Gateway 等全部 [TBC]。**密码与 Token 不得写入知识库。**

## 7.2 逻辑实体（非真实表名）
\`alert_event\`、\`price_source_tick\`、\`index_trace\`、\`orderbook_snapshot\`、\`premium_funding_trace\`、\`mark_trace\`、\`order_execution\`、\`position_margin\`、\`liquidation_adl\`、\`mm_hedge\`、\`ledger_recon\`。

## 7.3 建议 MCP
\`get_alert_context\`、\`get_price_trace\`、\`get_orderbook_trace\`、\`get_account_risk\`、\`get_liquidation_trace\`、\`get_reconciliation\`、\`get_admin_page_catalog\` —— 契约建议，不代表已开发。

## 7.4 安全
L0 SOP；L1 授权只读风险数据；L2 PII 默认拒绝；L3 生产动作人工审批后由确定性系统执行，AI 不直接操作。`,
    bodyEn: `All connection fields [TBC]. No secrets in KB. Logical entities + suggested MCP tools. L0–L3 security ladder; AI never executes L3.`,
  },
  {
    id: "ve-doc-faq",
    slug: "ve-faq",
    titleZh: "8. 跨部门与交易用户 FAQ",
    titleEn: "8. Internal & trader FAQ",
    summaryZh: "Funding/Premium/Mark/接仓等标准答法；用户回答不得泄密。",
    summaryEn: "Standard answers; trader replies must not leak internals.",
    tags: ["faq", "funding", "mark"],
    sortOrder: 80,
    bodyZh: `资金费率为正：通常多头付空头；为负：空头付多头。单期 0.1%/4h 按持仓名义与实际费率计；可展示年化但不可预测全年。

友商 Funding=0 而我们不是：核对合约/时间/周期/公式/溢价/价格源。Premium 多为冲击挂单口径 [PUBLIC]，VE 公式 [TBC]。Mark ≠ Index：因三候选价。无报价时限价/市价取决于状态与 Price Band。

DB 接仓：接仓账户承接强平风险头寸。强制成交：历史 SOP 中接仓账户与指定做市账户按 Mark 匹配——可能只转移敞口。

**面向交易用户**：通俗解释已确认事实；不得泄露 DB 库存、内部阈值、价格源敏感配置、其他客户信息或未确认根因。`,
    bodyEn: `FAQ on funding sign, annualization, peer funding=0, premium, mark vs index, rejects, DB takeover, forced trade. Trader-facing answers must not leak inventory, internal thresholds, or unconfirmed RCAs.`,
  },
  {
    id: "ve-doc-skill",
    slug: "ve-skill-rules",
    titleZh: "9. AI Skill 核心指令",
    titleEn: "9. AI Skill core rules",
    summaryZh: "V Exchange 风控排查 Skill：角色、十条规则、排查流程与标准输出。",
    summaryEn: "VE risk investigation skill: role, 10 rules, flow, output schema.",
    tags: ["skill", "ai", "rules"],
    sortOrder: 90,
    bodyZh: `你是 **V Exchange 永续合约风控排查助手**（只读）。职责：识别风险、定位异常、检索 SOP、建议修复、辅助验收、回答业务问题。不是生产执行系统。

## 工作规则（摘要）
1. 优先当前生产配置与已签署 SOP  
2. 历史/行业资料必须标注来源  
3. 不得把建议阈值说成已上线  
4. 不得编造字段/API/订单/告警  
5. 缺失标 [待确认] / DATA NOT VERIFIED  
6. 优先授权只读查询  
7. 时间标注 UTC + 新加坡时间  
8. 区分已证实 / 假设 / 未排除  
9. 影响强平/资金/连续交易/账本时建议升级  
10. 禁止停盘、改价、切源、强平、ADL、强制成交、注资、改账本

## 标准输出
事件摘要 · 已核实证据 · 根因分析 · 排查路径 · 建议处置 · 恢复验收 · 待确认事项 ·（如需）面向交易用户的回答。`,
    bodyEn: `Read-only V Exchange perp risk investigation skill. Ten hard rules + standard output sections. Never execute production actions.`,
  },
  {
    id: "ve-doc-incident",
    slug: "ve-incident-20261122",
    titleZh: "11. 案例 VE-INC-20261122-FUNDING-INDEX",
    titleEn: "11. Case VE-INC-20261122-FUNDING-INDEX",
    summaryZh: "2026-11-22 周末 Funding/Index 异常：观测、假设、所需数据。",
    summaryEn: "2026-11-22 weekend Funding/Index anomaly: obs, hypotheses, data needs.",
    tags: ["incident", "funding", "index", "2026-11-22"],
    sortOrder: 100,
    bodyZh: `## 已观察 [INCIDENT]
| 指标 | 实际情况 |
| --- | --- |
| XAUUSD Funding | 0.1019%～0.1202% |
| Average Premium | 0.152%～0.170% |
| Mark/Index 偏差 | 约 +0.13%～+0.17% |
| 外部友商 Funding | 告警显示多家为 0% |
| Index | 持续变化，非完全停更 |
| DB | 报价正常，认为 VE Index 偏低 |

## 假设
- A：VE Index 相对外部偏低 → 正溢价抬升 Funding  
- B：DB 盘口导致 Premium 偏高（需 Impact 验证）  
- C：Mark 候选持续偏高  

**当前结论：根因未确认。** 需同秒外部 Index、四源原始报价、DB 盘口、Premium/Mark 明细、Funding 结算与客户影响。`,
    bodyEn: `Weekend anomaly: elevated funding/premium and Mark/Index drift while peers show 0% funding. Hypotheses A/B/C; root cause not confirmed pending raw traces.`,
  },
  {
    id: "ve-doc-checklist",
    slug: "ve-go-live-checklist",
    titleZh: "12–13. 上线补齐清单与参考",
    titleEn: "12–13. Go-live checklist & references",
    summaryZh: "11 项生产资料补齐；内部/公开参考；首批上线建议。",
    summaryEn: "11-item data checklist; references; first-wave deploy advice.",
    tags: ["checklist", "references", "go-live"],
    sortOrder: 110,
    bodyZh: `## 生产资料补齐（0/11）
全量告警配置 · 后台生产菜单 · Index 规则 · Premium/Funding 公式 · Mark 细节 · 订单撮合状态机 · 强平/接仓状态机 · DB 账户配置 · 财务对账 · DB/API/MCP · SOP 治理。

## 参考
内部：28 Runbooks（2026-10-18）、L1/L2 监控整合（2026-11-01）、生产告警与 Mark BRD 截图。  
公开：告警清单、SOP、Binance Funding/Mark 参考 —— 仅行业参考，非 VE 生产规则 [PUBLIC]。

## 部署建议
首批上线：Alarm Catalog + Admin Guide + Runbooks + Database Contracts，先保证“什么告警、查哪里、谁负责、如何处理”，再开放生产只读查询。`,
    bodyEn: `11-item go-live checklist. References are design/public unless verified. First wave: alarms + admin + runbooks + data contracts.`,
  },
];

/** Core articles + 138-risk inventory + Runbook V18 skills (parts append via buildVeRunbookV18Docs). */
export const VE_DOCS: VeDoc[] = [
  ...VE_CORE_DOCS,
  ...buildVeRiskCatalogDocs(),
  ...buildVeRunbookV18Docs(),
];
