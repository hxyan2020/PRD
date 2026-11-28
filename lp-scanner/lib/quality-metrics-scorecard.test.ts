import { describe, expect, it } from "vitest";
import { SEED_LPS } from "@/lib/data/seed-lps";
import { buildQualityMetricsScorecard } from "@/lib/quality-metrics-scorecard";

describe("buildQualityMetricsScorecard", () => {
  it("covers all 8 execution metrics and marks live-only gaps", () => {
    const lps = SEED_LPS.filter((l) =>
      ["isprime", "finalto", "cmc-markets", "lmax"].includes(l.slug),
    );
    const card = buildQualityMetricsScorecard({
      locale: "zh-CN",
      product: "XAUUSD",
      session: "24/5",
      scoreKey: "gold",
      lps,
      offersBySlug: Object.fromEntries(lps.map((l) => [l.slug, true])),
    });
    expect(card.metrics).toHaveLength(8);
    expect(card.metrics.filter((m) => m.status === "unavailable").map((m) => m.id)).toEqual(
      expect.arrayContaining(["fill-ratio", "reject-rate", "slippage"]),
    );
    expect(card.metrics.find((m) => m.id === "latency")?.score).toBeGreaterThan(50);
    expect(card.dimensions.some((d) => d.weightPct > 0)).toBe(true);
    expect(card.weightedScore).toBeGreaterThan(0);
    expect(card.weightedScore).toBeLessThanOrEqual(100);
  });
});
