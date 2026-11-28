import { isZh } from "@/lib/i18n/locale";
import type { ScoreBand } from "@/lib/quality-research";
import type { Locale, LpRecord } from "@/lib/types";

export type QuotingMode = "aggregation" | "fv";

export type QuotingLeg = {
  rank: number;
  name: string;
  slug: string;
  logoUrl?: string;
  weightPct: number;
  role: "primary" | "secondary" | "backup" | "aggregator";
  score: number;
  band: ScoreBand;
  usedByVantage: boolean;
};

export type QuotingStrategy = {
  mode: QuotingMode;
  modeLabel: string;
  rationale: string;
  product: string;
  legs: QuotingLeg[];
  howToApply: string[];
  dataNote: string;
};

export type StrategySubject = {
  name: string;
  slug: string;
  logoUrl?: string;
  score: number;
  band: ScoreBand;
  usedByVantage: boolean;
  offersProduct: boolean;
};

function normalizeWeights(scores: number[]): number[] {
  const floored = scores.map((s) => Math.max(s, 1));
  const sum = floored.reduce((a, b) => a + b, 0);
  if (sum <= 0) return scores.map(() => Math.round(100 / Math.max(scores.length, 1)));
  const raw = floored.map((s) => (100 * s) / sum);
  const rounded = raw.map((x) => Math.round(x));
  const drift = 100 - rounded.reduce((a, b) => a + b, 0);
  if (rounded.length) rounded[0] += drift;
  return rounded;
}

/**
 * Recommend product-level quoting: weighted price aggregation vs FV failover ladder.
 * Uses repository LP capability scores (real LP profile fields), not synthetic fills.
 */
export function buildQuotingStrategy(args: {
  locale: Locale;
  product: string;
  subjects: StrategySubject[];
  lps: LpRecord[];
}): QuotingStrategy {
  const { locale, product, subjects, lps } = args;
  const zh = isZh(locale);
  const tw = locale === "zh-TW";
  const bySlug = new Map(lps.map((l) => [l.slug, l]));

  const eligible = [...subjects]
    .filter((s) => s.offersProduct || s.band !== "red")
    .sort((a, b) => b.score - a.score);

  const pool = (eligible.length ? eligible : [...subjects].sort((a, b) => b.score - a.score)).slice(
    0,
    8,
  );

  const green = pool.filter((s) => s.band === "green");
  const top = pool[0];
  const third = pool[2];
  const spread = top && third ? top.score - third.score : top && pool[1] ? top.score - pool[1].score : 0;
  const hasTechAgg = pool.some((s) => bySlug.get(s.slug)?.category === "technology");
  const pricingTight =
    pool.slice(0, 4).every((s) => (bySlug.get(s.slug)?.pricingQuality ?? 0) >= 4) &&
    green.length >= 3;

  const preferAggregation =
    (green.length >= 3 && spread <= 12) ||
    (hasTechAgg && green.length >= 2) ||
    (pricingTight && spread <= 15 && pool.length >= 3);

  const mode: QuotingMode = preferAggregation ? "aggregation" : "fv";
  const modeLabel =
    mode === "aggregation"
      ? tw
        ? "權重聚合（Price Aggregation）"
        : zh
          ? "权重聚合（Price Aggregation）"
          : "Weighted price aggregation"
      : tw
        ? "階梯備援 FV（Fail-over）"
        : zh
          ? "阶梯备援 FV（Fail-over）"
          : "FV fail-over ladder";

  const weights = normalizeWeights(pool.map((s) => s.score));
  const fvWeights = pool.map((_, i) => (i === 0 ? 70 : i === 1 ? 20 : i === 2 ? 10 : 0));

  const legs: QuotingLeg[] = pool.map((s, i) => {
    const lp = bySlug.get(s.slug);
    let role: QuotingLeg["role"] = "backup";
    if (lp?.category === "technology") role = "aggregator";
    else if (i === 0) role = "primary";
    else if (i === 1) role = "secondary";
    else if (i === 2) role = "backup";
    return {
      rank: i + 1,
      name: s.name,
      slug: s.slug,
      logoUrl: s.logoUrl,
      weightPct: mode === "aggregation" ? weights[i] : fvWeights[i],
      role,
      score: s.score,
      band: s.band,
      usedByVantage: s.usedByVantage,
    };
  });

  const rationale =
    mode === "aggregation"
      ? tw
        ? `${product} 有 ${green.length} 家綠色高適配且分數接近（前三差 ${Math.round(spread)} 分）${hasTechAgg ? "，並含技術聚合層" : ""}。建議按權重同時取價聚合成交，降低單源拒單/斷流風險。`
        : zh
          ? `${product} 有 ${green.length} 家绿色高适配且分数接近（前三差 ${Math.round(spread)} 分）${hasTechAgg ? "，并含技术聚合层" : ""}。建议按权重同时取价聚合成交，降低单源拒单/断流风险。`
          : `${product}: ${green.length} green peers with a tight spread (${Math.round(spread)} pts across top names)${hasTechAgg ? " plus a tech aggregation layer" : ""}. Prefer weighted simultaneous quotes to cut single-venue reject/gap risk.`
      : tw
        ? `${product} 頭部 LP 優勢更明顯（分數落差 ${Math.round(spread)} 分，綠色 ${green.length} 家）。建議 FV 階梯：主源報價 → 失敗/超時再切次源 → 再備援，避免弱源同時參與污染最優價。`
        : zh
          ? `${product} 头部 LP 优势更明显（分数落差 ${Math.round(spread)} 分，绿色 ${green.length} 家）。建议 FV 阶梯：主源报价 → 失败/超时再切次源 → 再备援，避免弱源同时参与污染最优价。`
          : `${product}: clearer leader gap (${Math.round(spread)} pts; ${green.length} green). Prefer an FV ladder — primary quote, then secondary on fail/timeout, then backup — so weaker books do not pollute best price.`;

  const howToApply =
    mode === "aggregation"
      ? tw
        ? [
            "在 SOR/聚合層為各 LP 設定上表權重（可按成交成功率每月再平衡）。",
            "同一客戶請求並行詢價，按權重合成深度或選最佳可成交檔。",
            "任一家斷流/拒單率升破閾值時，臨時把其權重降為 0 並重分配。",
            "壓力窗改用更保守權重或切到 FV，避免聚合在跳價時放大滑點。",
          ]
        : zh
          ? [
              "在 SOR/聚合层为各 LP 设定上表权重（可按成交成功率每月再平衡）。",
              "同一客户请求并行询价，按权重合成深度或选最佳可成交档。",
              "任一家断流/拒单率升破阈值时，临时把其权重降为 0 并重分配。",
              "压力窗改用更保守权重或切到 FV，避免聚合在跳价时放大滑点。",
            ]
          : [
              "Configure SOR/aggregation weights from the table (rebalance monthly on fill success).",
              "Quote in parallel per client request; blend depth by weight or pick best executable level.",
              "If a venue gaps or rejects above threshold, set its weight to 0 and redistribute.",
              "In stress windows, tighten weights or flip to FV so aggregation does not amplify jumps.",
            ]
      : tw
        ? [
            `主源 ${legs[0]?.name ?? "—"} 優先報價；超時/拒單/無深度時升級到次源。`,
            `次源 ${legs[1]?.name ?? "—"}、備援 ${legs[2]?.name ?? "—"} 僅在前序失敗時啟用。`,
            "記錄每次切換原因碼，供 TCA 與 last-look 覆盤。",
            "若後續多源分數拉近，可再評估改為權重聚合。",
          ]
        : zh
          ? [
              `主源 ${legs[0]?.name ?? "—"} 优先报价；超时/拒单/无深度时升级到次源。`,
              `次源 ${legs[1]?.name ?? "—"}、备援 ${legs[2]?.name ?? "—"} 仅在前序失败时启用。`,
              "记录每次切换原因码，供 TCA 与 last-look 复盘。",
              "若后续多源分数拉近，可再评估改为权重聚合。",
            ]
          : [
              `Primary ${legs[0]?.name ?? "—"} quotes first; escalate on timeout/reject/empty book.`,
              `Secondary ${legs[1]?.name ?? "—"} and backup ${legs[2]?.name ?? "—"} only after prior failure.`,
              "Log switch reason codes for TCA / last-look review.",
              "If peer scores tighten later, re-evaluate weighted aggregation.",
            ];

  const peek = pool
    .slice(0, 3)
    .map((s) => `${s.name} ${s.score}`)
    .join(zh ? " · " : " · ");

  const dataNote = tw
    ? `權重與階梯依據各 LP 倉庫實檔（產品表、定價、成本、延遲、時段、監管）與公開檢索；分數為相對 ${product} 的適配代理（${peek}…）。非實盤 FIX 檔位。`
    : zh
      ? `权重与阶梯依据各 LP 仓库实档（产品表、定价、成本、延迟、时段、监管）与公开检索；分数为相对 ${product} 的适配代理（${peek}…）。非实盘 FIX 档位。`
      : `Weights/ladder use each LP’s repository profile (products, pricing, cost, latency, hours, regulation) plus public research; scores are ${product}-relative proxies (${peek}…). Not live FIX levels.`;

  return {
    mode,
    modeLabel,
    rationale,
    product,
    legs,
    howToApply,
    dataNote,
  };
}
