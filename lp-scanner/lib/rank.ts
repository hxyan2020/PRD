import { resolveProduct } from "@/lib/products";
import type { Locale, LpRecord, RankedLp } from "@/lib/types";

function offersProduct(lp: LpRecord, symbol: string, assetClass: string): boolean {
  const s = symbol.toUpperCase();
  if (lp.products.some((p) => p.toUpperCase().replace(/[\/\s-_]/g, "") === s.replace(/[\/\s-_]/g, ""))) {
    return true;
  }
  if (lp.assetClasses.includes(assetClass as LpRecord["assetClasses"][number])) return true;
  if (assetClass === "metals" && lp.scoreHints.gold >= 70) return true;
  if (assetClass === "crypto" && lp.category === "crypto") return true;
  return false;
}

function hoursFit(lp: LpRecord, session: string): number {
  if (session === "24/7") return lp.hours === "24/7" || lp.hours === "mixed" ? 12 : -25;
  if (session === "24/5") return lp.hours === "24/5" || lp.hours === "mixed" ? 8 : lp.hours === "24/7" ? -5 : 0;
  return 4;
}

export function rankLpsForProduct(
  lps: LpRecord[],
  productQuery: string,
  locale: Locale = "en",
): { product: string; assetClass: string; rankings: RankedLp[]; researchedAt: string } {
  const profile = resolveProduct(productQuery);
  const symbol = profile?.symbol ?? productQuery.toUpperCase();
  const assetClass = profile?.assetClass ?? "fx";
  const session = profile?.session ?? "mixed";
  const scoreKey = profile?.scoreKey ?? "fxMajors";

  const scored = lps
    .map((lp) => {
      const offers = offersProduct(lp, symbol, assetClass);
      let score = 0;
      const reasons: string[] = [];
      const liveNotes: string[] = [];

      const hint = lp.scoreHints[scoreKey] ?? 50;
      score += hint * 0.7;
      reasons.push(
        locale === "zh-CN"
          ? `知识库对该品种相关能力评分 ${hint}/100`
          : `KB capability score for this product family: ${hint}/100`,
      );

      if (offers) {
        score += 18;
        reasons.push(
          locale === "zh-CN"
            ? `仓库明确覆盖 ${symbol} 或同类资产（${assetClass}）`
            : `Repository coverage includes ${symbol} or asset class ${assetClass}`,
        );
      } else {
        score -= 40;
        reasons.push(
          locale === "zh-CN"
            ? `仓库未显示可靠的 ${symbol} 报价覆盖`
            : `No reliable ${symbol} coverage flagged in repository`,
        );
      }

      score += lp.pricingQuality * 4;
      reasons.push(
        locale === "zh-CN"
          ? `定价质量评级 ${lp.pricingQuality}/5`
          : `Pricing quality rated ${lp.pricingQuality}/5`,
      );

      const costBoost = { low: 8, medium: 4, high: 0, negotiated: 5 }[lp.costTier];
      score += costBoost;
      reasons.push(
        locale === "zh-CN" ? `成本档位：${lp.costTier}` : `Cost tier: ${lp.costTier}`,
      );

      score += hoursFit(lp, session);
      reasons.push(
        locale === "zh-CN"
          ? `交易时段 ${lp.hours}（品种需求 ${session}）`
          : `Hours ${lp.hours} vs product session ${session}`,
      );

      if (lp.usedByVantage) {
        score += 10;
        reasons.push(
          locale === "zh-CN"
            ? "已标记为 Vantage 在用 LP，集成与信用风险已知"
            : "Marked as currently used by Vantage — known integration/credit path",
        );
      } else {
        liveNotes.push(
          locale === "zh-CN"
            ? "尚未被 Vantage 标记使用 — 可作为扩展候选"
            : "Not yet marked as used by Vantage — expansion candidate",
        );
      }

      if (lp.latencyProfile === "ultra-low") score += 6;
      else if (lp.latencyProfile === "low") score += 3;

      if (assetClass === "crypto" && lp.category === "crypto") {
        liveNotes.push(
          locale === "zh-CN"
            ? "实时研究：加密对冲应优先交易所原生深度，而非传统 CFD 簿记"
            : "Live research note: prefer exchange-native depth for crypto hedges over traditional CFD books",
        );
      }
      if (symbol === "XAUUSD" && (lp.slug === "isprime" || lp.slug === "finalto")) {
        liveNotes.push(
          locale === "zh-CN"
            ? "实时研究：机构披露中 Finalto/iSPrime 常居贵金属/外汇执行前列"
            : "Live research note: Finalto/iSPrime frequently top metals/FX venue shares in institutional disclosures",
        );
      }
      if (lp.slug === "cfh" && symbol) {
        liveNotes.push(
          locale === "zh-CN"
            ? "注意：CFH 与 Finalto 品牌演进重叠，避免重复计算容量"
            : "Note: CFH overlaps Finalto brand evolution — avoid double-counting capacity",
        );
      }

      liveNotes.push(
        locale === "zh-CN"
          ? `最佳场景：${lp.bestFor.slice(0, 3).join("、")}`
          : `Best-fit use cases: ${lp.bestFor.slice(0, 3).join(", ")}`,
      );

      return { lp, score, offers, reasons, liveNotes };
    })
    .filter((row) => row.offers || row.score > 35)
    .sort((a, b) => b.score - a.score);

  const rankings: RankedLp[] = scored.map((row, i) => ({
    lp: row.lp,
    rank: i + 1,
    score: Math.round(row.score * 10) / 10,
    offersProduct: row.offers,
    reasons: row.reasons,
    liveNotes: row.liveNotes,
    columns: {
      name: row.lp.name,
      usedByVantage: row.lp.usedByVantage,
      category: row.lp.category,
      hours: row.lp.hours,
      costTier: row.lp.costTier,
      pricingQuality: row.lp.pricingQuality,
      regions: row.lp.regions.join(", "),
      latency: row.lp.latencyProfile,
      score: Math.round(row.score * 10) / 10,
    },
  }));

  return {
    product: symbol,
    assetClass,
    rankings,
    researchedAt: new Date().toISOString(),
  };
}
