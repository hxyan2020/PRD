import { describe, expect, it } from "vitest";
import { SEED_LPS } from "@/lib/data/seed-lps";
import { buildPrintableHtml, buildQualityReport } from "@/lib/quality-research";
import { rankLpsForProduct } from "@/lib/rank";

describe("buildQualityReport", () => {
  it("builds product report with 10 steps and printable html", () => {
    const ranked = rankLpsForProduct(SEED_LPS, "XAUUSD", "en");
    const report = buildQualityReport({
      mode: "product",
      locale: "en",
      product: ranked.product,
      lps: ranked.rankings.map((r) => r.lp),
      rankings: ranked.rankings,
    });
    expect(report.steps).toHaveLength(10);
    expect(report.overallScore).toBeGreaterThan(50);
    expect(report.summaryPros.length).toBeGreaterThan(0);
    const html = buildPrintableHtml(report);
    expect(html).toContain("Liquidity Quality Research Report");
    expect(html).toContain(report.subject);
  });

  it("builds zh-CN printable report", () => {
    const report = buildQualityReport({
      mode: "lp",
      locale: "zh-CN",
      lps: SEED_LPS.filter((l) => l.slug === "isprime"),
    });
    const html = buildPrintableHtml(report);
    expect(html).toContain("流动性质量研究报告");
    expect(html).toContain("优势");
  });
});
