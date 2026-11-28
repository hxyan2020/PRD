/**
 * V Exchange full-platform risk scenario inventory V2.0 — 138 scenarios.
 * Source: internal catalog (original 98 + Trading Risk 40). No merge/dedupe.
 */
import catalogJson from "./ve-risk-catalog-138.json";
import type { VeDoc } from "./vexchange";

export type VeRiskScenario = {
  id: string;
  domain: string;
  titleZh: string;
  coverage: string;
  severity: string;
  frequency: string;
  monitorZh: string;
  remediateZh: string;
};

type DomainMeta = [string, string, number, "part1" | "part2"];

const DOMAINS = catalogJson.domains as unknown as Record<string, DomainMeta>;
export const VE_RISK_SCENARIOS = catalogJson.scenarios as VeRiskScenario[];

export const VE_RISK_CATALOG_META = {
  version: "V2.0",
  titleZh: "V Exchange 全平台风险场景清单",
  titleEn: "V Exchange full-platform risk scenario inventory",
  scopeZh:
    "XAUUSD USD-Margined Perpetual MVP，覆盖开户、资金、定价、撮合、流动性、做市商、保证金、强平、DB、财务、系统及治理。",
  scopeEn:
    "XAUUSD USD-margined perpetual MVP across onboarding, funds, pricing, matching, liquidity, MM, margin, liquidation, DB, finance, systems, and governance.",
  total: 138,
  original: 98,
  trading: 40,
};

function coverageNoteZh(): string {
  return `## 覆盖标记

| 标记 | 含义 |
| --- | --- |
| 🟢 已有 | 已有对应 L1 告警或 Runbook，可直接或间接发现风险 |
| 🟡 增强 | 已有相关告警，但不足以独立发现或完整识别风险 |
| 🔴 新增 | 现有 28 项 L1 中未发现对应的专门监控 |

> 「已有」以历史告警和 Runbook 为依据，不代表已经核实生产启用状态。

## 严重度

| 级别 | 定义 |
| --- | --- |
| P0 Critical | 系统性损失、客户资产错误、大规模错误强平、平台无法控制风险 |
| P1 High | 重大交易、定价、保证金、资金或对冲风险 |
| P2 Medium | 局部业务异常、风险缓冲下降、持续性问题 |
| P3 Low | 预警、趋势异常、尚未造成实际影响 |

频率中的高/中/低为预计发生概率，不是历史实测。实时、1秒、1分钟等为建议检测频率。`;
}

function coverageNoteEn(): string {
  return `## Coverage markers

| Mark | Meaning |
| --- | --- |
| 🟢 Existing | Matching L1 alarm or runbook can detect the risk directly/indirectly |
| 🟡 Enhance | Related alarm exists but is not enough alone |
| 🔴 New | No dedicated monitor among the current 28 L1 items |

> “Existing” is based on historical alarms/runbooks — not verified prod enablement.

Severity P0–P3 and frequency bands are design estimates, not measured history.`;
}

function tableZh(rows: VeRiskScenario[]): string {
  const header =
    "| # | 风险场景 | 覆盖 | 严重度 | 频率 | 如何监控 | 预防 / 修复 |\n| --- | --- | --- | --- | --- | --- | --- |";
  const body = rows
    .map(
      (r) =>
        `| ${r.id} | ${r.titleZh} | ${r.coverage} | ${r.severity} | ${r.frequency} | ${r.monitorZh} | ${r.remediateZh} |`,
    )
    .join("\n");
  return `${header}\n${body}`;
}

function tableEn(rows: VeRiskScenario[]): string {
  const header =
    "| # | Scenario (ZH title kept) | Coverage | Severity | Freq | Monitor | Prevent / remediate |\n| --- | --- | --- | --- | --- | --- | --- |";
  const body = rows
    .map(
      (r) =>
        `| ${r.id} | ${r.titleZh} | ${r.coverage} | ${r.severity} | ${r.frequency} | ${r.monitorZh} | ${r.remediateZh} |`,
    )
    .join("\n");
  return `${header}\n${body}`;
}

function domainRows(letter: string): VeRiskScenario[] {
  return VE_RISK_SCENARIOS.filter((r) => r.domain === letter);
}

function domainSectionZh(letter: string): string {
  const [zh, , n] = DOMAINS[letter]!;
  const rows = domainRows(letter);
  return `## ${letter}. ${zh}（${n}项）\n\n${tableZh(rows)}`;
}

function domainSectionEn(letter: string): string {
  const [, en, n] = DOMAINS[letter]!;
  const rows = domainRows(letter);
  return `## ${letter}. ${en} (${n})\n\n${tableEn(rows)}`;
}

/** KB articles for the 138-risk catalog (seeded under folder-v-exchange). */
export function buildVeRiskCatalogDocs(): VeDoc[] {
  const part1 = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const part2 = ["I", "J", "K", "L", "M"];

  const overview: VeDoc = {
    id: "ve-doc-risk-138-overview",
    slug: "ve-risk-scenarios-138",
    titleZh: "14. 全平台风险场景清单 V2.0（138）",
    titleEn: "14. Full-platform risk inventory V2.0 (138)",
    summaryZh: "原始98 + Trading扩展40；保留原始编号与分类，不合并去重。",
    summaryEn: "Original 98 + Trading 40; original IDs kept, no merge/dedupe.",
    tags: ["risk-catalog", "138", "trading-risk", "l1", "inventory"],
    sortOrder: 140,
    bodyZh: `# ${VE_RISK_CATALOG_META.titleZh} ${VE_RISK_CATALOG_META.version}

范围：${VE_RISK_CATALOG_META.scopeZh}

${coverageNoteZh()}

## 数量统计

| 风险域 | 数量 |
| --- | --- |
${Object.entries(DOMAINS)
  .map(([k, [zh, , n]]) => `| ${k}. ${zh} | ${n} |`)
  .join("\n")}
| **合计** | **${VE_RISK_CATALOG_META.total}** |

- 原始场景：${VE_RISK_CATALOG_META.original}
- Trading 扩展：${VE_RISK_CATALOG_META.trading}

> 这是完整的风险场景库存，不等于 138 条独立告警；正式开发前仍需对已有告警做生产核验和指标复用分析。

相关文档：
- \`/kb/ve-risk-scenarios-part1\` — 原始 98（A–H）
- \`/kb/ve-risk-scenarios-part2\` — Trading 40（I–M / T01–T40）
- \`/kb/ve-risk-scenarios-metrics\` — 监控指标与开发优先级`,
    bodyEn: `# ${VE_RISK_CATALOG_META.titleEn} ${VE_RISK_CATALOG_META.version}

Scope: ${VE_RISK_CATALOG_META.scopeEn}

${coverageNoteEn()}

Total **${VE_RISK_CATALOG_META.total}** scenarios (${VE_RISK_CATALOG_META.original} original + ${VE_RISK_CATALOG_META.trading} trading). Inventory ≠ 138 independent alarms — verify prod monitors before build-out.

See part1 / part2 / metrics sibling pages.`,
  };

  const notesPart1Zh = `
### 重点备注
- **A07 / A10 / A12 / A14**：严重度高于普通价格偏差告警，不能只检查最终输出值，还需保留完整计算链路。
- **D01–D05、D11–D12**：历史资料有阈值/截图，但不等于 28 个 L1 Runbook 已有独立场景；需逐项核实生产接入。V Exchange 须区分 DB 报价账户、接仓账户和 K 线账户，不能混合计算资金及敞口。
`;

  const notesPart2Zh = `
### 治理重点
- 不能只看 MM 是否挂单，还应评价是否提供真实、稳定、可成交、符合约定的流动性。
- DB 报价账户 / 接仓账户 / K 线账户必须分账核算。
`;

  const part1Doc: VeDoc = {
    id: "ve-doc-risk-138-part1",
    slug: "ve-risk-scenarios-part1",
    titleZh: "14a. 原始98个风险场景（A–H）",
    titleEn: "14a. Original 98 risk scenarios (A–H)",
    summaryZh: "行情定价、撮合、强平、DB、财务、账户滥用、系统与治理。",
    summaryEn: "Pricing, matching, liq, DB, finance, abuse, systems, governance.",
    tags: ["risk-catalog", "part1", "A-H", "98"],
    sortOrder: 141,
    bodyZh: `# 第一部分｜原始 98 个风险场景\n\n${part1.map(domainSectionZh).join("\n\n")}\n${notesPart1Zh}`,
    bodyEn: `# Part 1 — Original 98\n\n${part1.map(domainSectionEn).join("\n\n")}`,
  };

  const part2Doc: VeDoc = {
    id: "ve-doc-risk-138-part2",
    slug: "ve-risk-scenarios-part2",
    titleZh: "14b. Trading Risk 新增40场景（I–M / T01–T40）",
    titleEn: "14b. Trading Risk +40 (I–M / T01–T40)",
    summaryZh: "流动性、做市商治理、执行质量、操纵、平台敞口。",
    summaryEn: "Liquidity, MM governance, execution, manipulation, exposure.",
    tags: ["risk-catalog", "part2", "trading-risk", "T01-T40"],
    sortOrder: 142,
    bodyZh: `# 第二部分｜新增 40 个 Trading Risk 场景\n\n${part2.map(domainSectionZh).join("\n\n")}\n${notesPart2Zh}`,
    bodyEn: `# Part 2 — Trading Risk +40\n\n${part2.map(domainSectionEn).join("\n\n")}`,
  };

  const metricsDoc: VeDoc = {
    id: "ve-doc-risk-138-metrics",
    slug: "ve-risk-scenarios-metrics",
    titleZh: "14c. Trading Risk 指标与开发优先级",
    titleEn: "14c. Trading Risk metrics & build priority",
    summaryZh: "12项建议指标、原始98优先15项、Trading优先级与分阶段落地。",
    summaryEn: "12 metrics, top-15 from original 98, trading priorities, roadmap.",
    tags: ["risk-catalog", "metrics", "priority", "roadmap"],
    sortOrder: 143,
    bodyZh: `# 第三部分｜Trading Risk 新增监控指标

| 指标 | 主要覆盖 | 建议频率 | 优先级 |
| --- | --- | --- | --- |
| Executable Depth / Impact Price | T02/04/08/10 | 1–5秒 | P0 |
| Depth Imbalance Ratio | T01/03/07 | 1–5秒 | P1 |
| Liquidity Recovery Time | T03/05/14 | 事件型 | P1 |
| MM Quoting Uptime & SLA | T11/12/14/16 | 5–10秒 | P1 |
| MM Depth Contribution | T12/17 | 5–10秒 | P1 |
| MM Cancel-to-Trade Ratio | T13/31/32 | 10秒+日终 | P2 |
| MM Hedge Coverage Ratio | T19/39 | 5–10秒 | P0 |
| Order Execution Quality | T23/25/26/29 | 实时+日终 | P1 |
| Liquidation Execution Capacity | T08/30/39 | 1–5秒 | P0 |
| OI Concentration & Stress | T10/37/38/40 | 10秒 | P0 |
| Mark-out / Adverse Selection | T20/26/36 | 事件+滚动窗口 | P2 |
| MM Compliance & Permission Audit | T21/22 | 事件+每日 | P1 |

以上频率与 P 级为设计建议，需按生产吞吐与风险偏好校准。若当前仅单一内部 DB 做市商，MM 贡献度/集中度可先建基线。

# 第四部分｜开发优先级

## 原始 98 项中优先开发的 15 项

| 优先级 | 监控能力 | 对应场景 | 建议技术方案 |
| --- | --- | --- | --- |
| 1 | 风控引擎健康及绕过检查 | G02 | Risk Check ACK + Fail-closed |
| 2 | 强平触发与实际执行完整性 | C02–C05 | 状态机 + 事件勾稽 |
| 3 | 平台总资产与负债一致性 | E09 | 总账 + 钱包 + 用户负债 |
| 4 | 入金/提现安全与幂等 | E05–E06 | Transaction ID + 状态机 |
| 5 | DB 真实净敞口 | D04–D06 | 内部仓位 + 外部 Hedge |
| 6 | 保证金计算及冻结释放正确性 | C06–C09 | 规则重算 + 事件检查 |
| 7 | 稳定币脱锚风险 | E07 | USDT/USDC 价格 + 负债敞口 |
| 8 | 保险基金与穿仓损失 | C05/C12 | Loss + Fund Balance |
| 9 | 订单生命周期完整性 | B07–B09 | Order/Trade 事件链 |
| 10 | 全平台集中仓位与连锁强平 | C13/H06/H08 | OI + MMR + 深度 + DB 容量 |
| 11 | 价格源到 Mark 的端到端时延 | A13–A14 | Timestamp + Trace |
| 12 | 告警投递与 ACK 监控 | G08–G09 | Synthetic Alert + ACK |
| 13 | 生产参数变更审计 | G10 | Config Diff + Audit Log |
| 14 | 条件单/止损止盈执行完整性 | B13 | Trigger→Order→Trade |
| 15 | 自成交、操纵和异常套利 | F05–F08 | 规则引擎 + 异步异常检测 |

## Trading Risk 优先级

1. **第一优先**：平台能否承受大额订单及强平 — Executable Depth、Liquidation Capacity、MM Hedge Coverage、全平台 Net Delta。
2. **第二优先**：做市商是否真正履行报价义务 — Quoting Uptime、Spread/Depth SLA、撤单行为、恢复时间 Scorecard。
3. **第三优先**：执行质量及异常行为 — Slippage、Fill Rate、Mark-out、Spoofing、Wash Trading（实时规则 + 异步分析）。

## 分阶段落地

| 阶段 | 核心交付 |
| --- | --- |
| Q4 | 保留已有 28 项 L1；补齐强平完整性、真实净敞口、订单状态一致性、资产负债勾稽、风控引擎健康 |
| Q1 | 价格→订单→仓位→强平→DB→账本跨系统关联；MM SLA、流动性压力、执行质量 |
| Q2 | 集中持仓压力测试、连锁强平预测、操纵识别、异常套利与 AI 未知风险发现 |

## 统一监控与处置架构

\`\`\`
生产数据 → L1 确定性规则 → L2 关联聚合 → Lark / Risk Ops
  → 只读 SQL/MCP/Admin → SOP 排查 → Pricing/DB/BIT/Finance
  → RC 审批重大动作 → 后端确定性执行 → 恢复验收/对账/归档
生产数据 → 异步 AI 分析 → Risk Owner 审核 → 回写规则
\`\`\`

职责：L1 实时检测；L2 关联；Risk Ops 排查升级；各域执行修复；RC 决策。AI 只读分析与建议，不直接执行资金/交易/生产配置。`,
    bodyEn: `# Metrics (12) + build priorities

See ZH body for full tables: Executable Depth, MM SLA/Hedge Coverage, Liquidation Capacity, OI stress, Mark-out, etc.

Top-15 original-98 priorities start with G02 risk-engine fail-closed, C02–C05 liquidation integrity, E09 assets vs liabilities, E05–E06 deposit/withdraw idempotency, D04–D06 true DB net exposure.

Trading priorities: (1) depth/liq capacity/net delta (2) MM SLA scorecard (3) execution quality & abuse.

Roadmap Q4→Q1→Q2 as in ZH. AI is read-only analysis only.`,
  };

  return [overview, part1Doc, part2Doc, metricsDoc];
}

export function findVeRiskById(id: string): VeRiskScenario | undefined {
  return VE_RISK_SCENARIOS.find((r) => r.id === id);
}
