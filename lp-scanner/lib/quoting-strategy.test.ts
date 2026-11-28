import { describe, expect, it } from "vitest";
import { SEED_LPS } from "@/lib/data/seed-lps";
import { buildQuotingStrategy } from "@/lib/quoting-strategy";
import { computeLpProductScore, scoreBand } from "@/lib/quality-research";
import { rankLpsForProduct } from "@/lib/rank";

describe("buildQuotingStrategy", () => {
  it("returns aggregation or FV with weights summing sensibly for XAUUSD", () => {
    const ranked = rankLpsForProduct(SEED_LPS, "XAUUSD", "en");
    const offered = ranked.rankings.filter((r) => r.offersProduct);
    const subjects = offered.map((r) => {
      const score = computeLpProductScore(r.lp, {
        scoreKey: "gold",
        session: "24/5",
        symbol: "XAUUSD",
        assetClass: "metals",
      });
      return {
        name: r.lp.name,
        slug: r.lp.slug,
        logoUrl: r.lp.logoUrl,
        score,
        band: scoreBand(score),
        usedByVantage: r.lp.usedByVantage,
        offersProduct: r.offersProduct,
      };
    });
    const strategy = buildQuotingStrategy({
      locale: "zh-CN",
      product: "XAUUSD",
      subjects,
      lps: offered.map((r) => r.lp),
    });
    expect(["aggregation", "fv"]).toContain(strategy.mode);
    expect(strategy.legs.length).toBeGreaterThan(1);
    const weightSum = strategy.legs.reduce((a, b) => a + b.weightPct, 0);
    expect(weightSum).toBeGreaterThanOrEqual(90);
    expect(weightSum).toBeLessThanOrEqual(110);
    expect(strategy.modeLabel).toMatch(/聚合|阶梯|FV|Aggregation|Fail-over/);
  });
});
