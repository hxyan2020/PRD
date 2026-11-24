import { describe, expect, it } from "vitest";
import { VE_DOCS, VE_META } from "@/lib/data/vexchange";
import {
  VE_RISK_CATALOG_META,
  VE_RISK_SCENARIOS,
  buildVeRiskCatalogDocs,
  findVeRiskById,
} from "@/lib/data/ve-risk-catalog";

describe("VE 138 risk catalog", () => {
  it("keeps all 138 scenarios with original domains", () => {
    expect(VE_RISK_SCENARIOS).toHaveLength(138);
    expect(VE_RISK_CATALOG_META.original + VE_RISK_CATALOG_META.trading).toBe(138);
    expect(findVeRiskById("A07")?.titleZh).toContain("Mark算法错误");
    expect(findVeRiskById("T40")?.domain).toBe("M");
    expect(findVeRiskById("H10")?.coverage).toContain("🔴");
  });

  it("builds four KB docs included in VE_DOCS", () => {
    const docs = buildVeRiskCatalogDocs();
    expect(docs).toHaveLength(4);
    expect(docs.find((d) => d.id === "ve-doc-risk-138-overview")?.bodyZh).toContain("138");
    expect(docs.find((d) => d.id === "ve-doc-risk-138-part1")?.bodyZh).toContain("| A01 |");
    expect(docs.find((d) => d.id === "ve-doc-risk-138-part2")?.bodyZh).toContain("| T01 |");
    expect(docs.find((d) => d.id === "ve-doc-risk-138-metrics")?.bodyZh).toContain("Executable Depth");
    expect(VE_DOCS.some((d) => d.id === "ve-doc-risk-138-overview")).toBe(true);
    expect(VE_META.version).toBe("V2.2");
  });
});
