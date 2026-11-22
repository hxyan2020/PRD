import { describe, expect, it } from "vitest";
import { SEED_LPS } from "@/lib/data/seed-lps";
import { buildPrintableHtml, buildQualityReport } from "@/lib/quality-research";
import { rankLpsForProduct } from "@/lib/rank";

describe("buildQualityReport", () => {
  it("builds product report with 11 steps and printable html", () => {
    const ranked = rankLpsForProduct(SEED_LPS, "XAUUSD", "en");
    const report = buildQualityReport({
      mode: "product",
      locale: "en",
      product: ranked.product,
      lps: ranked.rankings.map((r) => r.lp),
      rankings: ranked.rankings,
    });
    expect(report.steps).toHaveLength(11);
    expect(report.overallScore).toBeGreaterThan(50);
    expect(report.summaryPros.length).toBeGreaterThan(0);
    expect(report.dataBottleneck.hit).toBe(true);
    expect(report.dataBottleneck.message).toMatch(/data availability is the bottleneck/i);
    expect(report.verdict).toMatch(/data availability is the bottleneck/i);
    expect(report.steps.some((s) => s.id === "data")).toBe(true);
    const html = buildPrintableHtml(report);
    expect(html).toContain("Liquidity Quality Research Report");
    expect(html).toContain(report.subject);
    expect(html).toContain("Data availability is the bottleneck");
  });

  it("builds zh-CN printable report and names the bottleneck", () => {
    const report = buildQualityReport({
      mode: "lp",
      locale: "zh-CN",
      lps: SEED_LPS.filter((l) => l.slug === "isprime"),
    });
    expect(report.dataBottleneck.hit).toBe(true);
    expect(report.verdict).toContain("数据可得性是瓶颈");
    const html = buildPrintableHtml(report);
    expect(html).toContain("流动性质量研究报告");
    expect(html).toContain("优势");
    expect(html).toContain("数据可得性是瓶颈");
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
    expect(report.summaryCons[0]).toMatch(/data availability is the bottleneck/i);
  });
});
