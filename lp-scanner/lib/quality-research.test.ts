import { describe, expect, it } from "vitest";
import { SEED_LPS } from "@/lib/data/seed-lps";
import {
  buildPrintableHtml,
  buildQualityReport,
  computeLpProductScore,
  scoreBand,
} from "@/lib/quality-research";
import { rankLpsForProduct } from "@/lib/rank";

describe("product-relative quality scores", () => {
  it("clamps scores 0–100 and maps traffic lights", () => {
    expect(scoreBand(90)).toBe("green");
    expect(scoreBand(70)).toBe("yellow");
    expect(scoreBand(40)).toBe("red");
    const isprime = SEED_LPS.find((l) => l.slug === "isprime")!;
    const gold = computeLpProductScore(isprime, {
      scoreKey: "gold",
      session: "24/5",
      symbol: "XAUUSD",
      assetClass: "metals",
    });
    expect(gold).toBeGreaterThanOrEqual(85);
    expect(gold).toBeLessThanOrEqual(100);
    const crypto = computeLpProductScore(isprime, {
      scoreKey: "crypto",
      session: "24/7",
      symbol: "BTCUSD",
      assetClass: "crypto",
    });
    expect(crypto).toBeLessThan(gold);
  });

  it("builds product report with RYG bands and printable html", () => {
    const ranked = rankLpsForProduct(SEED_LPS, "XAUUSD", "en");
    const report = buildQualityReport({
      mode: "product",
      locale: "en",
      product: ranked.product,
      lps: ranked.rankings.map((r) => r.lp),
      rankings: ranked.rankings,
      liveFindings: ["KB note: iSPrime frequently tops metals venue shares"],
    });
    expect(report.steps).toHaveLength(11);
    expect(report.overallScore).toBeGreaterThan(50);
    expect(report.overallScore).toBeLessThanOrEqual(100);
    expect(report.overallBand).toBe(scoreBand(report.overallScore));
    expect(report.subjects.length).toBeGreaterThan(5);
    expect(report.subjects.every((s) => s.score <= 100 && s.band)).toBe(true);
    expect(report.subjects[0].band).toBe("green");
    expect(report.lpCards.length).toBe(report.subjects.length);
    expect(report.lpCards[0].realData.some((d) => d.fromLp)).toBe(true);
    expect(report.quotingStrategy).toBeTruthy();
    expect(["aggregation", "fv"]).toContain(report.quotingStrategy!.mode);
    expect(report.quotingStrategy!.legs.length).toBeGreaterThan(0);
    expect(report.metricsScorecard.metrics).toHaveLength(8);
    expect(report.metricsScorecard.dimensions.length).toBeGreaterThanOrEqual(6);
    expect(report.metricsScorecard.unavailableCount).toBeGreaterThanOrEqual(3);
    expect(report.metricsScorecard.measuredCount).toBeGreaterThanOrEqual(4);
    expect(report.metricsScorecard.metrics.some((m) => m.name.match(/fill|成交/i))).toBe(true);
    expect(report.metricsScorecard.metrics.some((m) => m.name.match(/latency|延迟|延遲/i))).toBe(
      true,
    );
    expect(report.liveFindings.length).toBeGreaterThan(0);
    expect(report.dataBottleneck.hit).toBe(true);
    expect(report.verdict).toMatch(/data availability is the bottleneck/i);
    expect(report.verdict).toMatch(/green|yellow|red|aggregation|fail-over|FV/i);
    expect(report.steps.every((s) => (s.analysis?.length ?? 0) > 0)).toBe(true);
    expect(report.steps.every((s) => (s.dataSources?.length ?? 0) > 0)).toBe(true);
    expect(report.steps.every((s) => (s.charts?.length ?? 0) > 0)).toBe(true);
    const dataStep = report.steps.find((s) => s.id === "data")!;
    expect(dataStep.dataSources!.some((d) => d.available)).toBe(true);
    expect(dataStep.dataSources!.some((d) => !d.available && d.howToGet)).toBe(true);
    const html = buildPrintableHtml(report);
    expect(html).toContain("Liquidity Quality Research Report");
    expect(html).toContain(`score ${report.overallBand}`);
    expect(html).toContain("chip");
    expect(html).toContain("Data availability is the bottleneck");
    expect(html).toContain("Data sources");
    expect(html).toContain("How to get");
    expect(html).toContain("bar-fill");
    expect(html).toContain("Analysis");
    expect(html).toContain("Quoting strategy");
    expect(html).toContain("Per-LP quality reports");
    expect(html).toContain("Quantitative metrics");
    expect(html).toContain("Effective spread");
    expect(html).toContain("Fill ratio");
    expect(html).toContain("Needs live");
  });

  it("scores crypto LP green on BTC and weaker on XAU context", () => {
    const binance = SEED_LPS.find((l) => l.slug === "binance")!;
    const btcReport = buildQualityReport({
      mode: "lp",
      locale: "en",
      product: "BTCUSD",
      lps: [binance],
    });
    expect(btcReport.product).toBe("BTCUSD");
    expect(btcReport.overallBand).toBe("green");
    expect(btcReport.overallScore).toBeGreaterThanOrEqual(85);

    const xauReport = buildQualityReport({
      mode: "lp",
      locale: "en",
      product: "XAUUSD",
      lps: [binance],
    });
    expect(xauReport.overallScore).toBeLessThan(btcReport.overallScore);
    expect(xauReport.overallBand).not.toBe("green");
  });

  it("infers crypto score family for Binance when product omitted", () => {
    const report = buildQualityReport({
      mode: "lp",
      locale: "en",
      lps: SEED_LPS.filter((l) => l.slug === "binance"),
    });
    expect(report.product).toBe("BTCUSD");
    expect(report.overallScore).toBeGreaterThan(70);
  });

  it("builds zh-CN printable report with bands", () => {
    const report = buildQualityReport({
      mode: "lp",
      locale: "zh-CN",
      product: "XAUUSD",
      lps: SEED_LPS.filter((l) => l.slug === "isprime"),
    });
    expect(report.dataBottleneck.hit).toBe(true);
    expect(report.verdict).toContain("数据可得性是瓶颈");
    expect(report.overallBand).toBe("green");
    const html = buildPrintableHtml(report);
    expect(html).toContain("流动性质量研究报告");
    expect(html).toContain("绿");
  });

  it("flags sparse LP profiles with subject-specific gaps", () => {
    const thin = {
      ...SEED_LPS[0],
      id: "thin-lp",
      slug: "thin-lp",
      name: "ThinLP",
      products: [],
      assetClasses: [] as typeof SEED_LPS[0]["assetClasses"],
      weaknesses: [],
      regulation: ["Unverified"],
      kbBodyEn: "",
      kbBodyZh: "",
      notes: "",
      scoreHints: { gold: 40, fxMajors: 40, indices: 40, oil: 40, crypto: 40, asia: 40 },
    };
    const report = buildQualityReport({
      mode: "lp",
      locale: "en",
      product: "XAUUSD",
      lps: [thin],
    });
    expect(report.dataBottleneck.hit).toBe(true);
    expect(report.dataBottleneck.gaps.length).toBeGreaterThan(3);
    expect(report.overallBand).toBe("red");
    expect(report.summaryCons[0]).toMatch(/data availability is the bottleneck/i);
  });
});
