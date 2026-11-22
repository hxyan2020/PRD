import { METRICS, SCORECARD_HINTS } from "@/lib/data/lp-quality-testing";
import { isZh } from "@/lib/i18n/locale";
import type { ScoreBand } from "@/lib/quality-research";
import type { Locale, LpRecord } from "@/lib/types";

export type MetricStatus = "proxy" | "unavailable";

export type MetricLpValue = {
  name: string;
  slug: string;
  score?: number;
  note: string;
};

export type MetricAssessment = {
  id: string;
  name: string;
  what: string;
  how: string;
  target: string;
  status: MetricStatus;
  /** 0–100 when a repository/heuristic proxy exists. */
  score?: number;
  band?: ScoreBand;
  valueLabel: string;
  evidence: string;
  howToGet?: string;
  perLp: MetricLpValue[];
};

export type ScorecardDimension = {
  id: string;
  name: string;
  weightPct: number;
  score: number;
  band: ScoreBand;
  note: string;
};

export type QualityMetricsScorecard = {
  title: string;
  subtitle: string;
  metrics: MetricAssessment[];
  dimensions: ScorecardDimension[];
  weightedScore: number;
  weightedBand: ScoreBand;
  measuredCount: number;
  unavailableCount: number;
};

const LATENCY: Record<string, number> = {
  "ultra-low": 92,
  low: 74,
  medium: 48,
};

const COST: Record<string, number> = {
  low: 88,
  medium: 70,
  high: 45,
  negotiated: 78,
};

function band(score: number): ScoreBand {
  if (score >= 85) return "green";
  if (score >= 65) return "yellow";
  return "red";
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function hoursFit(hours: LpRecord["hours"], session: string): number {
  if (session === "24/7") return hours === "24/7" || hours === "mixed" ? 100 : 28;
  if (session === "24/5") return hours === "24/5" || hours === "mixed" ? 100 : hours === "24/7" ? 70 : 40;
  return 75;
}

function costProxy(lp: LpRecord): number {
  return Math.round(COST[lp.costTier] * 0.45 + lp.pricingQuality * 20 * 0.55);
}

function depthProxy(lp: LpRecord, hint: number, offers: boolean): number {
  const cover = offers ? 20 : 0;
  return Math.min(100, Math.round(hint * 0.55 + lp.pricingQuality * 8 + cover));
}

function latencyProxy(lp: LpRecord): number {
  return LATENCY[lp.latencyProfile] ?? 50;
}

function integrityProxy(lp: LpRecord, session: string): number {
  const sess = hoursFit(lp.hours, session);
  const tech = lp.category === "technology" ? 8 : 0;
  return Math.min(100, Math.round(sess * 0.55 + lp.pricingQuality * 8 + tech));
}

function uptimeProxy(lp: LpRecord): number {
  let s = 55;
  if (lp.usedByVantage) s += 20;
  if (lp.category === "technology") s += 12;
  if (lp.latencyProfile === "ultra-low") s += 8;
  else if (lp.latencyProfile === "low") s += 4;
  if (lp.regulation.some((r) => /unverified/i.test(r))) s -= 20;
  return Math.max(15, Math.min(100, s));
}

function creditProxy(lp: LpRecord): number {
  if (lp.regulation.some((r) => /unverified/i.test(r))) return 30;
  if (!lp.regulation.length) return 40;
  let s = 70 + Math.min(20, lp.regulation.length * 5);
  if (lp.usedByVantage) s += 8;
  return Math.min(100, s);
}

/**
 * Build the final-report quantitative scorecard from LP Testing METRICS + SCORECARD_HINTS.
 * Live-only metrics stay unavailable with how-to-get; others use LP repository proxies.
 */
export function buildQualityMetricsScorecard(args: {
  locale: Locale;
  product?: string;
  session: string;
  scoreKey: keyof LpRecord["scoreHints"];
  lps: LpRecord[];
  offersBySlug?: Record<string, boolean>;
}): QualityMetricsScorecard {
  const { locale, product, session, scoreKey, lps, offersBySlug = {} } = args;
  const zh = isZh(locale);
  const tw = locale === "zh-TW";
  const pool = lps.slice(0, 8);

  const metricDefs = METRICS.map((m, i) => {
    const id = [
      "effective-cost",
      "depth",
      "fill-ratio",
      "reject-rate",
      "slippage",
      "latency",
      "quote-integrity",
      "uptime",
    ][i]!;
    return {
      id,
      name: tw || zh ? m.metricZh : m.metricEn,
      what: tw || zh ? m.whatZh : m.whatEn,
      how: tw || zh ? m.howZh : m.howEn,
      target: tw || zh ? m.targetZh : m.targetEn,
    };
  });

  const metrics: MetricAssessment[] = metricDefs.map((def) => {
    if (def.id === "fill-ratio" || def.id === "reject-rate" || def.id === "slippage") {
      const howToGet =
        def.id === "fill-ratio"
          ? tw
            ? "與 LP 做小額實盤 PoC：按品種/規模/時段/波動分桶統計完全成交占比。"
            : zh
              ? "与 LP 做小额实盘 PoC：按品种/规模/时段/波动分桶统计完全成交占比。"
              : "Run a small live PoC with the LP; stratify full-fill % by symbol/size/session/volatility."
          : def.id === "reject-rate"
            ? tw
              ? "開啟 drop copy，分類 FIX 拒單碼（價格/規模/last look/技術），含壓力窗。"
              : zh
                ? "开启 drop copy，分类 FIX 拒单码（价格/规模/last look/技术），含压力窗。"
                : "Enable drop-copy; classify FIX reject codes (price/size/last-look/tech), including stress windows."
            : tw
              ? "匯出成交做 TCA：按訂單類型統計正負滑點對稱性。"
              : zh
                ? "汇出成交做 TCA：按订单类型统计正负滑点对称性。"
                : "Export fills for TCA; measure positive vs negative slippage by order type.";
      return {
        ...def,
        status: "unavailable" as const,
        valueLabel: tw ? "無實盤樣本" : zh ? "无实盘样本" : "No live sample",
        evidence: tw
          ? "需實盤成交/拒單遙測；倉庫無法提供真實數值。"
          : zh
            ? "需实盘成交/拒单遥测；仓库无法提供真实数值。"
            : "Needs live fills/reject telemetry — repository cannot supply a real value.",
        howToGet,
        perLp: pool.map((lp) => ({
          name: lp.name,
          slug: lp.slug,
          note: tw ? "待 PoC" : zh ? "待 PoC" : "Pending PoC",
        })),
      };
    }

    const perLp: MetricLpValue[] = pool.map((lp) => {
      const hint = lp.scoreHints[scoreKey] ?? 50;
      const offers = offersBySlug[lp.slug] ?? lp.products.length > 0;
      let score = 50;
      let note = "";
      if (def.id === "effective-cost") {
        score = costProxy(lp);
        note = `${lp.costTier} · ${lp.pricingQuality}/5`;
      } else if (def.id === "depth") {
        score = depthProxy(lp, hint, offers);
        note = tw
          ? `能力 ${hint} · 覆蓋 ${offers ? "是" : "弱"}`
          : zh
            ? `能力 ${hint} · 覆盖 ${offers ? "是" : "弱"}`
            : `hint ${hint} · cover ${offers ? "yes" : "weak"}`;
      } else if (def.id === "latency") {
        score = latencyProxy(lp);
        note = lp.latencyProfile;
      } else if (def.id === "quote-integrity") {
        score = integrityProxy(lp, session);
        note = `${lp.hours} vs ${session}`;
      } else if (def.id === "uptime") {
        score = uptimeProxy(lp);
        note = lp.usedByVantage
          ? tw
            ? "Vantage 在用"
            : zh
              ? "Vantage 在用"
              : "Vantage-used"
          : tw
            ? "未在用"
            : zh
              ? "未在用"
              : "not in use";
      }
      return { name: lp.name, slug: lp.slug, score, note };
    });

    const score = avg(perLp.map((p) => p.score ?? 0));
    const b = band(score);
    return {
      ...def,
      status: "proxy" as const,
      score,
      band: b,
      valueLabel: `${score}/100`,
      evidence: tw
        ? `倉庫代理（${product ?? "標的"}）：取前 ${pool.length} 家均值。非正式 TCA/盤口。`
        : zh
          ? `仓库代理（${product ?? "标的"}）：取前 ${pool.length} 家均值。非正式 TCA/盘口。`
          : `Repository proxy for ${product ?? "product"}: mean of top ${pool.length} LPs — not live TCA/book.`,
      perLp,
    };
  });

  const costScores = pool.map(costProxy);
  const depthScores = pool.map((lp) =>
    depthProxy(lp, lp.scoreHints[scoreKey] ?? 50, offersBySlug[lp.slug] ?? true),
  );
  const latencyScores = pool.map(latencyProxy);
  const integrityScores = pool.map((lp) => integrityProxy(lp, session));
  const uptimeScores = pool.map(uptimeProxy);
  const creditScores = pool.map(creditProxy);
  const coverageScores = pool.map((lp) => {
    const offers = offersBySlug[lp.slug] ?? true;
    return Math.min(
      100,
      Math.round((lp.scoreHints[scoreKey] ?? 50) * 0.7 + hoursFit(lp.hours, session) * 0.3 + (offers ? 10 : 0)),
    );
  });
  // Stress / fill-reject stay conservative when live samples missing
  const stressScore = Math.round(avg(integrityScores) * 0.55 + avg(latencyScores) * 0.25 + 20);
  const fillRejectScore = 35; // unavailable live → red/yellow floor
  const tcoScore = avg(costScores);

  const dimDefs: { id: string; weightPct: number; score: number; nameEn: string; nameZh: string; nameTw: string; noteEn: string; noteZh: string; noteTw: string }[] = [
    {
      id: "exec-cost",
      weightPct: 30,
      score: avg([...costScores, ...depthScores]),
      nameEn: "Executable cost at ticket size",
      nameZh: "客户真实单量下的可成交成本",
      nameTw: "客戶真實單量下的可成交成本",
      noteEn: "Proxy from pricing quality + cost tier + depth hint",
      noteZh: "代理：定价质量 + 成本档 + 深度提示",
      noteTw: "代理：定價質量 + 成本檔 + 深度提示",
    },
    {
      id: "stress",
      weightPct: 20,
      score: stressScore,
      nameEn: "Stress / news behaviour",
      nameZh: "压力 / 新闻表现",
      nameTw: "壓力 / 新聞表現",
      noteEn: "No stress fills yet — conservative proxy from integrity/latency",
      noteZh: "尚无压力窗成交 — 用完整性/延迟作保守代理",
      noteTw: "尚無壓力窗成交 — 用完整性/延遲作保守代理",
    },
    {
      id: "fill-reject",
      weightPct: 18,
      score: fillRejectScore,
      nameEn: "Fill & reject quality (last look)",
      nameZh: "成交与拒单质量（含 last look）",
      nameTw: "成交與拒單質量（含 last look）",
      noteEn: "Live fill/reject samples missing — scored as data gap",
      noteZh: "缺少实盘成交/拒单样本 — 按数据缺口计分",
      noteTw: "缺少實盤成交/拒單樣本 — 按資料缺口計分",
    },
    {
      id: "latency",
      weightPct: 12,
      score: avg(latencyScores),
      nameEn: "Latency & tech resilience",
      nameZh: "延迟与技术韧性",
      nameTw: "延遲與技術韌性",
      noteEn: "From LP latency tier + uptime proxy",
      noteZh: "来自延迟档 + 可用性代理",
      noteTw: "來自延遲檔 + 可用性代理",
    },
    {
      id: "credit",
      weightPct: 12,
      score: avg(creditScores),
      nameEn: "Credit / legal / safeguarding",
      nameZh: "授信 / 法律 / 资金安全",
      nameTw: "授信 / 法律 / 資金安全",
      noteEn: "From regulation tags + Vantage-used path",
      noteZh: "来自监管标签 + Vantage 在用路径",
      noteTw: "來自監管標籤 + Vantage 在用路徑",
    },
    {
      id: "coverage",
      weightPct: 10,
      score: avg(coverageScores),
      nameEn: "Coverage fit (symbols / sessions)",
      nameZh: "覆盖契合度（品种、时段）",
      nameTw: "覆蓋契合度（品種、時段）",
      noteEn: "Product list + session hours + family hint",
      noteZh: "产品表 + 时段 + 家族能力提示",
      noteTw: "產品表 + 時段 + 家族能力提示",
    },
    {
      id: "tco",
      weightPct: 8,
      score: tcoScore,
      nameEn: "Commercial total cost of ownership",
      nameZh: "商业综合持有成本",
      nameTw: "商業綜合持有成本",
      noteEn: "Aligned with cost-tier / pricing proxy",
      noteZh: "与成本档/定价代理对齐",
      noteTw: "與成本檔/定價代理對齊",
    },
  ];
  // renormalize weights to 100 (30+20+18+12+12+10+8 = 110) → scale
  const rawW = dimDefs.reduce((a, d) => a + d.weightPct, 0);
  const dimensions: ScorecardDimension[] = dimDefs.map((d) => {
    const weightPct = Math.round((100 * d.weightPct) / rawW);
    return {
      id: d.id,
      name: tw ? d.nameTw : zh ? d.nameZh : d.nameEn,
      weightPct,
      score: d.score,
      band: band(d.score),
      note: tw ? d.noteTw : zh ? d.noteZh : d.noteEn,
    };
  });
  // fix rounding drift on first weight
  const drift = 100 - dimensions.reduce((a, d) => a + d.weightPct, 0);
  if (dimensions[0]) dimensions[0].weightPct += drift;

  const weightedScore = Math.round(
    dimensions.reduce((a, d) => a + (d.score * d.weightPct) / 100, 0),
  );

  return {
    title: tw
      ? "實務評分卡（按你的賬本加權）"
      : zh
        ? SCORECARD_HINTS.titleZh
        : SCORECARD_HINTS.titleEn,
    subtitle: tw
      ? `相對 ${product ?? "標的"} 的量化指標總覽：可代理項給分，缺實盤項標明獲取方式。`
      : zh
        ? `相对 ${product ?? "标的"} 的量化指标总览：可代理项给分，缺实盘项标明获取方式。`
        : `Quantitative metrics for ${product ?? "this product"}: proxy scores where possible; live-only gaps with how to get.`,
    metrics,
    dimensions,
    weightedScore,
    weightedBand: band(weightedScore),
    measuredCount: metrics.filter((m) => m.status === "proxy").length,
    unavailableCount: metrics.filter((m) => m.status === "unavailable").length,
  };
}
