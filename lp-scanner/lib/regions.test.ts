import { describe, expect, it } from "vitest";
import { LP_OPTIMAL_REGIONS, formatOptimalRegions, resolveOptimalRegions } from "@/lib/regions";
import { SEED_LPS } from "@/lib/data/seed-lps";

describe("optimal regions", () => {
  it("covers every seeded LP", () => {
    for (const lp of SEED_LPS) {
      expect(LP_OPTIMAL_REGIONS[lp.slug]?.length).toBeGreaterThan(0);
      expect(lp.optimalRegions?.length).toBeGreaterThan(0);
      expect(resolveOptimalRegions(lp.slug)).toEqual(LP_OPTIMAL_REGIONS[lp.slug]);
    }
  });

  it("formats bilingual flags", () => {
    expect(formatOptimalRegions(["UK", "SG"], "en")).toContain("🇬🇧");
    expect(formatOptimalRegions(["UK", "SG"], "zh-CN")).toContain("新加坡");
  });
});
