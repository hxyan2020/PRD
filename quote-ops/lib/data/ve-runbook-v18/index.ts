/**
 * V Exchange 风控 Runbook V18 — ingested in four parts into the skill library.
 * Part 1: overview + admin page field baseline + L1-01..L1-06 (book/trading).
 * Part 2: L1-07..L1-15 pricing / Mark / index sources.
 * Part 3: L1-16..L1-28 + L2-A/B (Funding / DB / Finance / L2).
 * Part 4: L2-C..F + L1→L2 linkage + escalation/close-out (complete 34 scenarios).
 */

import type { Skill, SkillStep } from "@/lib/types";
import type { VeDoc } from "@/lib/data/vexchange";
import {
  RUNBOOK_V18_L1_BOOK_EN,
  RUNBOOK_V18_L1_BOOK_ZH,
  RUNBOOK_V18_OVERVIEW_EN,
  RUNBOOK_V18_OVERVIEW_ZH,
  RUNBOOK_V18_PART,
  RUNBOOK_V18_VERSION,
} from "./part1";
import {
  RUNBOOK_V18_L1_PRICING_EN,
  RUNBOOK_V18_L1_PRICING_ZH,
  RUNBOOK_V18_PART2,
} from "./part2";
import { VE_RUNBOOK_PART2_SKILLS } from "./part2-skills";
import {
  RUNBOOK_V18_L1_OPS_EN,
  RUNBOOK_V18_L1_OPS_ZH,
  RUNBOOK_V18_L2_AB_EN,
  RUNBOOK_V18_L2_AB_ZH,
  RUNBOOK_V18_PART3,
} from "./part3";
import { VE_RUNBOOK_PART3_SKILLS } from "./part3-skills";
import {
  RUNBOOK_V18_L2_CF_EN,
  RUNBOOK_V18_L2_CF_ZH,
  RUNBOOK_V18_META_EN,
  RUNBOOK_V18_META_ZH,
  RUNBOOK_V18_PART4,
} from "./part4";
import { VE_RUNBOOK_PART4_SKILLS } from "./part4-skills";

export {
  RUNBOOK_V18_PART,
  RUNBOOK_V18_VERSION,
  RUNBOOK_V18_PART2,
  RUNBOOK_V18_PART3,
  RUNBOOK_V18_PART4,
};

/** All four parts ingested — 28 L1 + 6 L2 = 34 scenarios. */
export const RUNBOOK_V18_INGESTED_PARTS = [1, 2, 3, 4] as const;
export const RUNBOOK_V18_PENDING_PARTS = [] as const;

function stepsFromTable(
  rows: Array<{
    id: string;
    titleZh: string;
    titleEn: string;
    detailZh: string;
    detailEn: string;
  }>,
): SkillStep[] {
  return rows.map((r) => ({
    id: r.id,
    title: r.titleEn,
    titleZh: r.titleZh,
    detail: r.detailEn,
    detailZh: r.detailZh,
  }));
}

/** Part 1 interactive skills (overview + L1-01..06). */
const VE_RUNBOOK_PART1_SKILLS: Skill[] = [
  {
    id: "ve-sk-runbook-v18-overview",
    slug: "ve-runbook-v18-overview",
    title: "Runbook V18 · Overview & Admin Pages",
    titleZh: "Runbook V18｜总则与后管页面基准",
    summary:
      "Lark-first alerts, Chinese admin names, optional static config, required dynamic data, branch→action mapping.",
    summaryZh:
      "Lark告警入口、中文后管、静态配置可选、动态业务必查、分支对应行动；含后管页面字段基准表。",
    severity: "P1",
    owners: ["L1", "RC", "BIT", "DB", "Pricing", "Finance"],
    relatedRiskIds: [],
    triggers: ["Start of shift / new alert unfamiliar", "Need admin page field map"],
    triggersZh: ["开班或告警不熟", "需要后管页面/字段对照"],
    steps: stepsFromTable([
      {
        id: "o1",
        titleZh: "从 Lark 读告警",
        titleEn: "Read alert from Lark",
        detailZh: "值班L1不需要进入后管查询告警；不使用后管监控页代替Lark入口。",
        detailEn: "L1 reads alerts from Lark only; do not use admin monitors as the alert entry.",
      },
      {
        id: "o2",
        titleZh: "区分可选配置 vs 必查动态数据",
        titleEn: "Optional config vs required dynamic data",
        detailZh:
          "静态配置（阈值/开关/算法/源权重/交易限制）均为【可选】；订单、成交、仓位、强平、资金、权益、流水仍需核查。",
        detailEn:
          "Static config checks are optional; orders/trades/positions/liqs/funds/equity/ledger remain required.",
      },
      {
        id: "o3",
        titleZh: "按后管中文页面取数",
        titleEn: "Use Chinese admin page map",
        detailZh:
          "对照总则中的「后管页面与字段」表；未核实字段标 [待确认]；敏感动作须审批。",
        detailEn: "Use the admin page/field baseline table; mark unverified fields [TBC]; sensitive actions need approval.",
      },
      {
        id: "o4",
        titleZh: "无实际风险不建档；有风险则验收后归档",
        titleEn: "Archive only after real risk + recovery",
        detailZh: "无实际风险不创建额外事件档案；确认风险并完成处置与恢复验收后由L1统一归档。",
        detailEn: "No extra incident file without real risk; L1 archives after dispose + recovery acceptance.",
      },
    ]),
    evidence: ["Lark alert payload", "Admin page field baseline", "Branch→action mapping"],
    evidenceZh: ["Lark告警载荷", "后管页面字段基准表", "分支→行动映射"],
    tags: ["v-exchange-perp", "runbook-v18", "skill", "overview", "admin"],
  },
  {
    id: "ve-sk-l1-01-no-trade",
    slug: "ve-l1-01-no-trade",
    title: "L1-01 No-trade monitor",
    titleZh: "L1-01｜无交易监控",
    summary: "40s no-trade alert; >60s escalate through book/orders/DB/BIT; link L2-C when depth+orders blocked.",
    summaryZh: "连续40秒无交易；>60秒走盘口/订单/DB/BIT；深度不足+订单受阻跳转L2-C。",
    severity: "P1",
    owners: ["L1", "DB", "BIT", "RC"],
    relatedRiskIds: [],
    triggers: ["Lark 无交易监控", "continuous no trade ≥40s"],
    triggersZh: ["Lark 无交易监控", "连续无成交≥40秒"],
    steps: stepsFromTable([
      {
        id: "1",
        titleZh: "读Lark告警",
        titleEn: "Read Lark alert",
        detailZh: "合约、最后成交时间、无成交持续秒数、触发时间。≤60秒且盘口正常观察；>60秒继续；已恢复仍查订单受阻。",
        detailEn: "Contract, last trade, duration, time. ≤60s+book OK → watch; >60s continue; recovered → still check blocked orders.",
      },
      {
        id: "2",
        titleZh: "前端成交与K线",
        titleEn: "Front-end trades & candles",
        detailZh: "K线/成交持续更新→告警延迟；无成交→查盘口与订单需求。",
        detailEn: "Updating candles → alert lag; still no trade → book & order demand.",
      },
      {
        id: "3",
        titleZh: "盘口 Bid1/Ask1/深度/Spread",
        titleEn: "Book Bid1/Ask1/depth/spread",
        detailZh: "盘口正常→订单需求；单边/双边缺失→DB报价，必要时BIT盘口更新。",
        detailEn: "Book OK → demand; missing side(s) → DB quotes, BIT book update if needed.",
      },
      {
        id: "4",
        titleZh: "联动02/07告警",
        titleEn: "Correlate 02/07 alerts",
        detailZh: "深度不足+无交易>60秒且订单受阻→L2-C；否则单点排查。",
        detailEn: "Depth+no-trade>60s+blocked orders → L2-C; else single-point.",
      },
      {
        id: "5",
        titleZh: "后管→当前委托",
        titleEn: "Admin → open orders",
        detailZh: "无新增且盘口正常→需求不足观察；限价未成交查价格条件；应成交未成→订单ID交BIT。",
        detailEn: "No new+book OK → demand; check limit prices; should-fill not filled → BIT with order IDs.",
      },
      {
        id: "6",
        titleZh: "【可选】合约/交易限制/Price Band",
        titleEn: "[Optional] contract / limits / price band",
        detailZh: "合法限制说明；合法订单异常拒绝→BIT；疑似错配→RC/产品审批修正。",
        detailEn: "Legal reject OK; legal order wrongly rejected → BIT; bad config → RC/product approve fix.",
      },
      {
        id: "7",
        titleZh: "DB报价 / BIT撮合",
        titleEn: "DB quotes / BIT matching",
        detailZh: "DB未报价恢复挂单；撮合异常BIT修复验证；双方正常按需求判断。",
        detailEn: "DB restore quotes; BIT fix matching; both OK → demand judgment.",
      },
      {
        id: "8",
        titleZh: "恢复验收 / 归档",
        titleEn: "Recovery / archive",
        detailZh: "恢复无影响结束；合法订单仍无法成交跟踪BIT并通知RC；实际风险已解决→归档。",
        detailEn: "Recovered no impact → end; still blocked → BIT+RC; real risk resolved → archive.",
      },
    ]),
    evidence: ["Lark alert", "Open orders", "Book/depth", "Order IDs for BIT"],
    evidenceZh: ["Lark告警", "当前委托", "盘口深度", "交BIT的订单ID"],
    tags: ["v-exchange-perp", "runbook-v18", "skill", "l1-01", "no-trade", "book"],
  },
  {
    id: "ve-sk-l1-02-depth",
    slug: "ve-l1-02-depth-shortfall",
    title: "L1-02 Order-book depth shortfall",
    titleZh: "L1-02｜订单簿档位深度不足",
    summary: "BUY/SELL depth ≤2.5M USD; DB/BIT path; L2-C / L2-F linkage.",
    summaryZh: "BUY/SELL深度≤2,500,000 USD；DB/BIT路径；联动L2-C/L2-F。",
    severity: "P1",
    owners: ["L1", "DB", "BIT", "RC", "Finance", "Pricing"],
    relatedRiskIds: [],
    triggers: ["Lark depth shortfall", "BUY/SELL depth ≤ 2,500,000 USD"],
    triggersZh: ["Lark 深度不足", "BUY/SELL 深度≤2,500,000 USD"],
    steps: stepsFromTable([
      {
        id: "1",
        titleZh: "读Lark方向与金额",
        titleEn: "Read side & amount",
        detailZh: "单边查该侧；双边查DB整体；短暂低于阈值观察实际影响。",
        detailEn: "One side → that side; both → DB overall; brief breach → watch impact.",
      },
      {
        id: "2",
        titleZh: "前端逐档挂单",
        titleEn: "Front-end ladder",
        detailZh: "一侧缺失/双侧稀薄→DB；深度恢复仍查订单或强平影响。",
        detailEn: "Missing/thin → DB; recovered → still check order/liq impact.",
      },
      {
        id: "3",
        titleZh: "对比行情与Index/Mark",
        titleEn: "Compare market vs Index/Mark",
        detailZh: "剧烈波动查DB保护；平稳深度下降优先DB/系统。",
        detailEn: "Volatile → DB protect; calm drop → DB/system first.",
      },
      {
        id: "4",
        titleZh: "后管→当前委托",
        titleEn: "Admin → open orders",
        detailZh: "大量撤/拒→BIT+DB；订单正常盘口不显示→BIT订单簿同步。",
        detailEn: "Mass cancel/reject → BIT+DB; orders OK not shown → BIT book sync.",
      },
      {
        id: "5",
        titleZh: "联动01/07/23/20",
        titleEn: "Correlate 01/07/23/20",
        detailZh: "深度+无交易订单受阻→L2-C；强平/接仓受影响→L2-F。",
        detailEn: "Depth+no-trade blocked → L2-C; liq/takeover hit → L2-F.",
      },
      {
        id: "6",
        titleZh: "【可选】Price Band/限制",
        titleEn: "[Optional] price band / limits",
        detailZh: "保护正常不直接取消；误拦合法报价→BIT复核，RC/Pricing审批。",
        detailEn: "Do not drop valid protection; false block → BIT + RC/Pricing approve.",
      },
      {
        id: "7",
        titleZh: "DB接入与资金策略",
        titleEn: "DB access & funding strategy",
        detailZh: "资金不足补足；策略暂停确认恢复；已提交未展示→BIT。",
        detailEn: "Fund shortfall top-up; paused strategy restore; submitted not shown → BIT.",
      },
      {
        id: "8",
        titleZh: "BIT挂单/拒单/撮合",
        titleEn: "BIT submit/reject/match",
        detailZh: "网关撮合故障修复；价格保护生效→DB合法报价；无技术异常→DB评策略。",
        detailEn: "Gateway/match fix; protection OK → DB legal quotes; no tech fault → DB strategy.",
      },
      {
        id: "9",
        titleZh: "历史成交/强平历史",
        titleEn: "Trades / liq history",
        detailZh: "成交或强平异常→RC + L1-23/L2-F；无客户影响→验收。",
        detailEn: "Abnormal trade/liq → RC + L1-23/L2-F; no client impact → accept.",
      },
      {
        id: "10",
        titleZh: "恢复验收 / 归档",
        titleEn: "Recovery / archive",
        detailZh: "双边深度/Spread/订单成交恢复；仍低于阈值影响交易→升级；处置完成归档。",
        detailEn: "Depth/spread/orders OK → end; still impacting → escalate; done → archive.",
      },
    ]),
    evidence: ["Depth USD by side", "Open orders", "MM access config", "Trade/liq history"],
    evidenceZh: ["分侧深度金额", "当前委托", "做市商接入配置", "成交/强平历史"],
    tags: ["v-exchange-perp", "runbook-v18", "skill", "l1-02", "depth", "book"],
  },
  {
    id: "ve-sk-l1-03-spread",
    slug: "ve-l1-03-spread-alert",
    title: "L1-03 Spread alert",
    titleZh: "L1-03｜盘口价差预警",
    summary: "Persistent Bid/Ask spread widen; DB quote vs BIT book sync.",
    summaryZh: "持续扩价或一档缺失；DB报价 vs BIT盘口同步。",
    severity: "P2",
    owners: ["L1", "DB", "BIT", "RC"],
    relatedRiskIds: [],
    triggers: ["Lark spread alert", "Bid1/Ask1 spread vs threshold"],
    triggersZh: ["Lark 价差预警", "Bid1/Ask1 Spread 超阈值"],
    steps: stepsFromTable([
      {
        id: "1",
        titleZh: "读Spread与阈值",
        titleEn: "Read spread vs threshold",
        detailZh: "瞬时扩价观察；持续或一档缺失立即查盘口/DB。",
        detailEn: "Spike → watch; persistent/missing level → book/DB now.",
      },
      {
        id: "2",
        titleZh: "前端盘口变化",
        titleEn: "Front-end book change",
        detailZh: "已恢复核对期间异常成交；仍异常继续。",
        detailEn: "Recovered → check interim odd fills; else continue.",
      },
      {
        id: "3",
        titleZh: "对照Index/Mark/深度",
        titleEn: "vs Index/Mark/depth",
        detailZh: "深度下降→DB撤单规模；Index跳变→指数源；三价稳盘口扩→DB。",
        detailEn: "Depth drop → DB; Index jump → index sources; prices stable widen → DB.",
      },
      {
        id: "4",
        titleZh: "当前委托/历史成交",
        titleEn: "Open orders / trades",
        detailZh: "异常成交记订单ID通知RC；大量拒单→BIT；无异常继续报价核查。",
        detailEn: "Odd fills → order IDs + RC; mass reject → BIT; else quote check.",
      },
      {
        id: "5",
        titleZh: "DB策略【可选接入配置】",
        titleEn: "DB strategy [optional access cfg]",
        detailZh: "主动扩价说明恢复条件；未主动→BIT盘口订单簿。",
        detailEn: "Intentional widen → restore conditions; else BIT book.",
      },
      {
        id: "6",
        titleZh: "BIT订单簿同步",
        titleEn: "BIT book sync",
        detailZh: "不同步修复；正常→DB调报价策略。",
        detailEn: "Desync → fix; OK → DB adjust quotes.",
      },
      {
        id: "7",
        titleZh: "验收 / 归档",
        titleEn: "Accept / archive",
        detailZh: "Spread/深度/成交恢复无风险结束；持续影响通知RC；处置完成归档。",
        detailEn: "Recovered → end; lasting impact → RC; done → archive.",
      },
    ]),
    evidence: ["Bid1/Ask1/Spread", "Order IDs", "Depth alerts"],
    evidenceZh: ["Bid1/Ask1/Spread", "订单ID", "深度告警"],
    tags: ["v-exchange-perp", "runbook-v18", "skill", "l1-03", "spread", "book"],
  },
  {
    id: "ve-sk-l1-04-deviation",
    slug: "ve-l1-04-book-deviation",
    title: "L1-04 Book vs Index deviation",
    titleZh: "L1-04｜盘口偏离",
    summary: "Bid/Ask/Mid vs Index; index path vs DB quote basis; L2-D on client impact.",
    summaryZh: "Bid/Ask/Mid相对Index；指数源 vs DB报价基准；客户影响进L2-D。",
    severity: "P1",
    owners: ["L1", "DB", "BIT", "Pricing", "RC"],
    relatedRiskIds: [],
    triggers: ["Lark book deviation", "Mid vs Index"],
    triggersZh: ["Lark 盘口偏离", "Mid相对Index偏差"],
    steps: stepsFromTable([
      {
        id: "1",
        titleZh: "读偏差方向",
        titleEn: "Read deviation side",
        detailZh: "单侧查对应报价；双侧同向查基准与Index；短暂恢复仍查成交。",
        detailEn: "One side → that quote; both same way → basis+Index; brief recover → still check fills.",
      },
      {
        id: "2",
        titleZh: "前端四价对比",
        titleEn: "Front-end four prices",
        detailZh: "Index先异常→指数源；Index正常盘口偏离→DB基准。",
        detailEn: "Index first bad → sources; Index OK book off → DB basis.",
      },
      {
        id: "3",
        titleZh: "当前委托",
        titleEn: "Open orders",
        detailZh: "未进盘口→BIT网关/撮合；进盘口但偏离→DB策略。",
        detailEn: "Not in book → BIT; in book but off → DB strategy.",
      },
      {
        id: "4",
        titleZh: "【可选】指数/Price Band",
        titleEn: "[Optional] index / price band",
        detailZh: "配置疑似异常→BIT/Pricing审批调整；正常继续DB报价。",
        detailEn: "Suspect config → BIT/Pricing approve; else DB quotes.",
      },
      {
        id: "5",
        titleZh: "DB基准与保护",
        titleEn: "DB basis & protect",
        detailZh: "策略导致偏离→恢复合理报价；无异常→BIT订单簿传递。",
        detailEn: "Strategy cause → restore; else BIT book path.",
      },
      {
        id: "6",
        titleZh: "成交/强平影响",
        titleEn: "Trade/liq impact",
        detailZh: "客户异常成交或强平→RC，必要时L2-D。",
        detailEn: "Client odd fill/liq → RC, L2-D if needed.",
      },
      {
        id: "7",
        titleZh: "偏差回落验收",
        titleEn: "Deviation recovery",
        detailZh: "恢复按有无实际风险归档；未恢复DB/BIT继续。",
        detailEn: "Recovered → archive by real risk; else DB/BIT continue.",
      },
    ]),
    evidence: ["Bid/Ask/Mid vs Index", "Index sources", "Trade/liq history"],
    evidenceZh: ["Bid/Ask/Mid vs Index", "行情源", "成交/强平历史"],
    tags: ["v-exchange-perp", "runbook-v18", "skill", "l1-04", "deviation", "book"],
  },
  {
    id: "ve-sk-l1-05-spike",
    slug: "ve-l1-05-book-spike",
    title: "L1-05 Book spike / wick",
    titleZh: "L1-05｜盘口插针",
    summary: "Outlier prints vs Index/Mark; BIT match rebuild; compliance if manipulation suspected.",
    summaryZh: "离群成交 vs Index/Mark；BIT重建撮合；疑似操纵交合规。",
    severity: "P0",
    owners: ["L1", "BIT", "DB", "Pricing", "RC", "Compliance"],
    relatedRiskIds: [],
    triggers: ["Lark spike / wick", "outlier trade vs Index/Mark"],
    triggersZh: ["Lark 盘口插针", "成交价相对Index/Mark离群"],
    steps: stepsFromTable([
      {
        id: "1",
        titleZh: "对照三价K线",
        titleEn: "Three-price candles",
        detailZh: "仅成交价插针→订单簿/成交；Index/Mark同步→上游定价；行情正常→单笔异常。",
        detailEn: "Print-only → book/trades; Index/Mark sync → upstream; calm market → single odd fill.",
      },
      {
        id: "2",
        titleZh: "历史成交离群",
        titleEn: "Outlier trades",
        detailZh: "少量→订单ID交BIT重建；大量同向→同时通知RC。",
        detailEn: "Few → BIT rebuild; many same way → RC too.",
      },
      {
        id: "3",
        titleZh: "异常时段深度",
        titleEn: "Depth in window",
        detailZh: "薄盘口→DB撤单报价；盘口正常价离群→BIT撮合/订单类型。",
        detailEn: "Thin → DB; book OK outlier → BIT match/order type.",
      },
      {
        id: "4",
        titleZh: "止损/条件/强平",
        titleEn: "SL / conditional / liq",
        detailZh: "异常触发→RC+BIT触发价；未触发下游继续查成交原因。字段[待确认]。",
        detailEn: "Odd trigger → RC+BIT; no downstream → keep investigating. Fields [TBC].",
      },
      {
        id: "5",
        titleZh: "BIT重建撮合",
        titleEn: "BIT match rebuild",
        detailZh: "撮合错误修复；薄盘合法成交→DB流动性；异常行为→合规。",
        detailEn: "Match bug → fix; thin legal → DB liquidity; abuse → compliance.",
      },
      {
        id: "6",
        titleZh: "Mark算法 / 报价撤单",
        titleEn: "Mark algo / quote cancels",
        detailZh: "Mark异常→Pricing/BIT；报价异常→DB。",
        detailEn: "Mark bad → Pricing/BIT; quote bad → DB.",
      },
      {
        id: "7",
        titleZh: "账户关联（按需合规）",
        titleEn: "Account links (compliance)",
        detailZh: "疑似操纵移交合规；证据不足保留事实不定性。",
        detailEn: "Suspect manip → compliance; weak evidence → facts only, no label.",
      },
      {
        id: "8",
        titleZh: "影响验收 / 归档",
        titleEn: "Impact / archive",
        detailZh: "无实际风险结束；确认风险待责任部门处置、RC验收后归档。",
        detailEn: "No real risk → end; real risk → owners dispose, RC accept, archive.",
      },
    ]),
    evidence: ["Outlier order IDs", "Match rebuild", "SL/liq triggers", "Account links"],
    evidenceZh: ["离群订单ID", "撮合重建", "止损/强平触发", "账户关联"],
    tags: ["v-exchange-perp", "runbook-v18", "skill", "l1-05", "spike", "book"],
  },
  {
    id: "ve-sk-l1-06-limit",
    slug: "ve-l1-06-limit-anomaly",
    title: "L1-06 Limit / price-band anomaly",
    titleZh: "L1-06｜限价异常",
    summary: "Mass legal rejects vs normal rule rejects; Price Band / Reduce-Only; BIT+Pricing.",
    summaryZh: "大量合法拒单 vs 正常规则拒绝；Price Band / Reduce-Only；BIT+Pricing。",
    severity: "P1",
    owners: ["L1", "BIT", "Pricing", "RC"],
    relatedRiskIds: [],
    triggers: ["Lark limit anomaly", "mass legal order rejects"],
    triggersZh: ["Lark 限价异常", "大量合法订单被拒"],
    steps: stepsFromTable([
      {
        id: "1",
        titleZh: "按订单ID查当前委托",
        titleEn: "Open order by ID",
        detailZh: "个别违规拒绝结束；大量合法被拒继续。",
        detailEn: "Single illegal reject → end; mass legal rejects → continue.",
      },
      {
        id: "2",
        titleZh: "【可选】精度/Price Band/数量限制",
        titleEn: "[Optional] tick / band / size limits",
        detailZh: "不满足规则=正常拒绝；满足仍拒→BIT网关校验。字段[待确认]。",
        detailEn: "Rule fail = OK reject; rule OK still reject → BIT gateway. Fields [TBC].",
      },
      {
        id: "3",
        titleZh: "Index/Mark与合理价格管理",
        titleEn: "Index/Mark & mark admin",
        detailZh: "参考价异常→Pricing/BIT；正常继续订单规则。",
        detailEn: "Ref price bad → Pricing/BIT; else order rules.",
      },
      {
        id: "4",
        titleZh: "同窗其他订单",
        titleEn: "Peer orders in window",
        detailZh: "多笔合法受阻→BIT紧急；单笔查账户参数。",
        detailEn: "Many legal blocked → BIT urgent; single → account params.",
      },
      {
        id: "5",
        titleZh: "Reduce-Only标识",
        titleEn: "Reduce-Only flag",
        detailZh: "合法减仓被拒→RC+BIT；不符规则说明正常拒绝。[待确认]",
        detailEn: "Legal RO reject → RC+BIT; invalid RO → explain OK reject. [TBC]",
      },
      {
        id: "6",
        titleZh: "BIT拒单码 / Pricing参数",
        titleEn: "BIT reject codes / Pricing params",
        detailZh: "系统错误BIT修复；配置不合理Pricing审批调整。",
        detailEn: "System bug → BIT; bad params → Pricing approve.",
      },
      {
        id: "7",
        titleZh: "合法通 / 违规仍拦",
        titleEn: "Legal pass / illegal still blocked",
        detailZh: "通过结束或按风险归档；失败跟踪BIT，重大影响通知RC。",
        detailEn: "Pass → end/archive; fail → BIT track, major → RC.",
      },
    ]),
    evidence: ["Reject codes", "Price Band params", "Reduce-Only flags", "Peer order sample"],
    evidenceZh: ["拒单码", "Price Band参数", "只减仓标识", "同窗订单样本"],
    tags: ["v-exchange-perp", "runbook-v18", "skill", "l1-06", "limit", "price-band"],
  },
];

/** Interactive checklist skills (source of truth for branch tables remains bodyZh markdown). */
export const VE_RUNBOOK_SKILLS: Skill[] = [
  ...VE_RUNBOOK_PART1_SKILLS,
  ...VE_RUNBOOK_PART2_SKILLS,
  ...VE_RUNBOOK_PART3_SKILLS,
  ...VE_RUNBOOK_PART4_SKILLS,
];

function perL1DocsFromBook(
  skills: Skill[],
  bookBodyZh: string,
  part: number,
  bookSlug: string,
  sortBase: number,
  partTag: string,
): VeDoc[] {
  return skills
    .filter((s) => s.id.startsWith("ve-sk-l1-"))
    .map((s, i) => {
      const marker = s.titleZh.split("｜")[0] ?? s.titleZh;
      const sections = bookBodyZh.split(/^## /m).filter(Boolean);
      const match = sections.find((sec) => sec.startsWith(marker));
      const bodyZh = match
        ? `# ${s.titleZh}\n\n> Runbook ${RUNBOOK_V18_VERSION} · Part ${part}/4\n\n## ${match}`
        : `# ${s.titleZh}\n\n见姊妹页完整表：/kb/${bookSlug}`;
      return {
        id: s.id.replace("ve-sk-", "ve-skill-"),
        slug: s.slug,
        titleZh: `Skill · ${s.titleZh}`,
        titleEn: `Skill · ${s.title}`,
        summaryZh: s.summaryZh,
        summaryEn: s.summary,
        tags: [...s.tags.filter((t) => t !== "v-exchange-perp"), partTag],
        sortOrder: sortBase + i * 10,
        kind: "skill" as const,
        bodyZh,
        bodyEn: `# ${s.title}\n\nFull ZH branch tables are source of truth. Interactive checklist: /skills/${s.slug}`,
      };
    });
}

/** Full markdown bodies (tables preserved) for KB/RAG seed. */
export function buildVeRunbookV18Docs(): VeDoc[] {
  const overview: VeDoc = {
    id: "ve-skill-runbook-v18-overview",
    slug: "ve-runbook-v18-overview",
    titleZh: "Skill · Runbook V18｜总则与后管页面基准",
    titleEn: "Skill · Runbook V18 Overview & Admin Pages",
    summaryZh: `V18 第${RUNBOOK_V18_PART}/4册起：Lark告警、中文后管、可选静态配置、分支处置；含后管字段基准表。`,
    summaryEn: `From V18 part ${RUNBOOK_V18_PART}/4: Lark alerts, Chinese admin, optional static config, branch actions; admin field baseline.`,
    tags: ["skill", "runbook-v18", "overview", "admin", "lark", "part1"],
    sortOrder: 200,
    kind: "skill",
    bodyZh: RUNBOOK_V18_OVERVIEW_ZH,
    bodyEn: RUNBOOK_V18_OVERVIEW_EN,
  };

  const book: VeDoc = {
    id: "ve-skill-runbook-v18-l1-01-06",
    slug: "ve-runbook-v18-l1-01-06",
    titleZh: "Skill · Runbook V18｜L1-01～L1-06 盘口与交易",
    titleEn: "Skill · Runbook V18 L1-01..06 Book & Trading",
    summaryZh: "无交易、深度不足、价差、偏离、插针、限价异常 — 完整步骤/执行人/分支处置表。",
    summaryEn: "No-trade, depth, spread, deviation, spike, limit — full step/owner/branch tables.",
    tags: ["skill", "runbook-v18", "l1", "book", "trading", "part1", "l1-01", "l1-02", "l1-03", "l1-04", "l1-05", "l1-06"],
    sortOrder: 210,
    kind: "skill",
    bodyZh: RUNBOOK_V18_L1_BOOK_ZH,
    bodyEn: RUNBOOK_V18_L1_BOOK_EN,
  };

  const pricing: VeDoc = {
    id: "ve-skill-runbook-v18-l1-07-15",
    slug: "ve-runbook-v18-l1-07-15",
    titleZh: "Skill · Runbook V18｜L1-07～L1-15 定价/Mark/指数源",
    titleEn: "Skill · Runbook V18 L1-07..15 Pricing / Mark / Index",
    summaryZh: "内部偏差、友商价差、Mark降级/观察期、线性过渡、源超时/切源、汇率失败、单源 — 完整分支表。",
    summaryEn: "Internal/peer deviation, Mark degrade/observe, ramp, source timeout/switch, FX fail, single source — full tables.",
    tags: [
      "skill",
      "runbook-v18",
      "l1",
      "pricing",
      "mark",
      "index",
      "part2",
      "l1-07",
      "l1-08",
      "l1-09",
      "l1-10",
      "l1-11",
      "l1-12",
      "l1-13",
      "l1-14",
      "l1-15",
    ],
    sortOrder: 300,
    kind: "skill",
    bodyZh: RUNBOOK_V18_L1_PRICING_ZH,
    bodyEn: RUNBOOK_V18_L1_PRICING_EN,
  };

  const perL1Part1 = perL1DocsFromBook(
    VE_RUNBOOK_PART1_SKILLS,
    RUNBOOK_V18_L1_BOOK_ZH,
    RUNBOOK_V18_PART,
    "ve-runbook-v18-l1-01-06",
    220,
    "part1",
  );
  const perL1Part2 = perL1DocsFromBook(
    VE_RUNBOOK_PART2_SKILLS,
    RUNBOOK_V18_L1_PRICING_ZH,
    RUNBOOK_V18_PART2,
    "ve-runbook-v18-l1-07-15",
    310,
    "part2",
  );

  const ops: VeDoc = {
    id: "ve-skill-runbook-v18-l1-16-28",
    slug: "ve-runbook-v18-l1-16-28",
    titleZh: "Skill · Runbook V18｜L1-16～L1-28 Funding/DB/对账",
    titleEn: "Skill · Runbook V18 L1-16..28 Funding / DB / Finance",
    summaryZh: "外部/内部Funding、DB资金权益接仓心跳、大额强平、ADL、快照对账与流水映射 — 完整分支表。",
    summaryEn: "Funding, DB funds/equity/takeover/heartbeat, large liq, ADL, snapshot recon & flow mapping — full tables.",
    tags: [
      "skill",
      "runbook-v18",
      "l1",
      "funding",
      "db",
      "liquidation",
      "adl",
      "finance",
      "part3",
      "l1-16",
      "l1-23",
      "l1-28",
    ],
    sortOrder: 400,
    kind: "skill",
    bodyZh: RUNBOOK_V18_L1_OPS_ZH,
    bodyEn: RUNBOOK_V18_L1_OPS_EN,
  };

  const l2ab: VeDoc = {
    id: "ve-skill-runbook-v18-l2-a-b",
    slug: "ve-runbook-v18-l2-a-b",
    titleZh: "Skill · Runbook V18｜L2-A / L2-B 关联链路",
    titleEn: "Skill · Runbook V18 L2-A / L2-B Chains",
    summaryZh: "L2-A 切源→定价异常（含 flowchart）；L2-B 价格脱节→Funding偏差。",
    summaryEn: "L2-A source switch→pricing (with flowchart); L2-B price disconnect→Funding.",
    tags: ["skill", "runbook-v18", "l2", "l2-a", "l2-b", "part3"],
    sortOrder: 500,
    kind: "skill",
    bodyZh: RUNBOOK_V18_L2_AB_ZH,
    bodyEn: RUNBOOK_V18_L2_AB_EN,
  };

  const part3L1Skills = VE_RUNBOOK_PART3_SKILLS.filter((s) => s.id.startsWith("ve-sk-l1-"));
  const part3L2Skills = VE_RUNBOOK_PART3_SKILLS.filter((s) => s.id.startsWith("ve-sk-l2-"));

  const perL1Part3 = perL1DocsFromBook(
    part3L1Skills,
    RUNBOOK_V18_L1_OPS_ZH,
    RUNBOOK_V18_PART3,
    "ve-runbook-v18-l1-16-28",
    410,
    "part3",
  );

  const perL2 = part3L2Skills.map((s, i) => {
    const marker = s.titleZh.split("｜")[0] ?? s.titleZh;
    const sections = RUNBOOK_V18_L2_AB_ZH.split(/^## /m).filter(Boolean);
    const match = sections.find((sec) => sec.startsWith(marker));
    const bodyZh = match
      ? `# ${s.titleZh}\n\n> Runbook ${RUNBOOK_V18_VERSION} · Part ${RUNBOOK_V18_PART3}/4\n\n## ${match}`
      : `# ${s.titleZh}\n\n见姊妹页：/kb/ve-runbook-v18-l2-a-b`;
    return {
      id: s.id.replace("ve-sk-", "ve-skill-"),
      slug: s.slug,
      titleZh: `Skill · ${s.titleZh}`,
      titleEn: `Skill · ${s.title}`,
      summaryZh: s.summaryZh,
      summaryEn: s.summary,
      tags: [...s.tags.filter((t) => t !== "v-exchange-perp"), "part3"],
      sortOrder: 510 + i * 10,
      kind: "skill" as const,
      bodyZh,
      bodyEn: `# ${s.title}\n\nFull ZH tables are source of truth. Interactive checklist: /skills/${s.slug}`,
    };
  });

  const l2cf: VeDoc = {
    id: "ve-skill-runbook-v18-l2-c-f",
    slug: "ve-runbook-v18-l2-c-f",
    titleZh: "Skill · Runbook V18｜L2-C～L2-F 关联链路",
    titleEn: "Skill · Runbook V18 L2-C..F Chains",
    summaryZh: "L2-C 流动性→无交易；L2-D 定价→强平；L2-E 强平→接仓积压；L2-F 深度→强平处置（含 flowchart）。",
    summaryEn: "L2-C depth→no-trade; L2-D pricing→liq; L2-E liq→takeover backlog; L2-F depth→liq disposal (flowcharts).",
    tags: ["skill", "runbook-v18", "l2", "l2-c", "l2-d", "l2-e", "l2-f", "part4"],
    sortOrder: 600,
    kind: "skill",
    bodyZh: RUNBOOK_V18_L2_CF_ZH,
    bodyEn: RUNBOOK_V18_L2_CF_EN,
  };

  const metaDoc: VeDoc = {
    id: "ve-skill-runbook-v18-linkage",
    slug: "ve-runbook-v18-l1-l2-linkage",
    titleZh: "Skill · Runbook V18｜L1→L2联动入口与收口标准",
    titleEn: "Skill · Runbook V18 L1→L2 Linkage & Close-out",
    summaryZh: "9个L1联动入口表 + 升级/权限/收口矩阵；V18完整性：28 L1 + 6 L2 = 34。",
    summaryEn: "9 L1→L2 entry table + escalation/close-out matrix; completeness 28 L1 + 6 L2 = 34.",
    tags: ["skill", "runbook-v18", "linkage", "escalation", "part4"],
    sortOrder: 700,
    kind: "skill",
    bodyZh: RUNBOOK_V18_META_ZH,
    bodyEn: RUNBOOK_V18_META_EN,
  };

  const part4L2Skills = VE_RUNBOOK_PART4_SKILLS.filter((s) => s.id.startsWith("ve-sk-l2-"));
  const perL2Part4 = part4L2Skills.map((s, i) => {
    const marker = s.titleZh.split("｜")[0] ?? s.titleZh;
    const sections = RUNBOOK_V18_L2_CF_ZH.split(/^## /m).filter(Boolean);
    const match = sections.find((sec) => sec.startsWith(marker));
    const bodyZh = match
      ? `# ${s.titleZh}\n\n> Runbook ${RUNBOOK_V18_VERSION} · Part ${RUNBOOK_V18_PART4}/4\n\n## ${match}`
      : `# ${s.titleZh}\n\n见姊妹页：/kb/ve-runbook-v18-l2-c-f`;
    return {
      id: s.id.replace("ve-sk-", "ve-skill-"),
      slug: s.slug,
      titleZh: `Skill · ${s.titleZh}`,
      titleEn: `Skill · ${s.title}`,
      summaryZh: s.summaryZh,
      summaryEn: s.summary,
      tags: [...s.tags.filter((t) => t !== "v-exchange-perp"), "part4"],
      sortOrder: 610 + i * 10,
      kind: "skill" as const,
      bodyZh,
      bodyEn: `# ${s.title}\n\nFull ZH tables are source of truth. Interactive checklist: /skills/${s.slug}`,
    };
  });

  // Linkage skill already has dedicated metaDoc with same slug — skip duplicate from skills list.
  return [
    overview,
    book,
    ...perL1Part1,
    pricing,
    ...perL1Part2,
    ops,
    ...perL1Part3,
    l2ab,
    ...perL2,
    l2cf,
    ...perL2Part4,
    metaDoc,
  ];
}
