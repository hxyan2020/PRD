import { describe, expect, it } from "vitest";
import { gapStatusScore, scoreProduct, toScoredProduct } from "./scoring";
import type { ProductInput, RegionalMarket } from "./types";

function market(partial: Partial<RegionalMarket> & Pick<RegionalMarket, "region" | "status" | "exists">): RegionalMarket {
  return {
    listings: 0,
    sellerCount: 0,
    avgRetailUsd: 0,
    lowRetailUsd: 0,
    projectedRetailUsd: 80,
    platforms: [],
    landedCostUsd: 20,
    marginPct: null,
    notes: "",
    ...partial,
  };
}

const sample: ProductInput = {
  slug: "test",
  name: "Test",
  nameZh: "测试",
  category: "Home",
  summary: "",
  whyNow: "",
  image: "",
  imageAlt: "",
  tags: [],
  factory: [
    {
      platform: "1688",
      listingCount: 12000,
      supplierCount: 420,
      verifiedFactories: 180,
      unitPriceUsd: 12,
      unitPriceCny: 86,
      moq: 2,
      cluster: "Yiwu",
      orders30d: 48000,
      velocityWoW: 18,
      searchUrl: "https://s.1688.com",
    },
  ],
  social: [
    {
      platform: "tiktok",
      mentions7d: 12000,
      views7d: 8_000_000,
      engagementRate: 4.2,
      hashtags: ["#test"],
      trend: "rising",
      samplePosts: [],
    },
    {
      platform: "xiaohongshu",
      mentions7d: 6400,
      views7d: 1_200_000,
      engagementRate: 5.1,
      hashtags: [],
      trend: "rising",
      samplePosts: [],
    },
  ],
  search: {
    keyword: "test product",
    related: [],
    globalIndex: 62,
    risingPct: 140,
    sparkline: [20, 24, 28, 33, 40, 48, 55, 58, 61, 64, 70, 74],
    byCountry: { US: 40, SG: 70, DE: 30 },
  },
  markets: [
    market({ region: "na", exists: false, status: "whitespace" }),
    market({
      region: "sea",
      exists: true,
      status: "competitive",
      listings: 800,
      sellerCount: 220,
      avgRetailUsd: 45,
      lowRetailUsd: 29,
      marginPct: 38,
    }),
    market({
      region: "eu",
      exists: true,
      status: "thin",
      listings: 18,
      sellerCount: 7,
      avgRetailUsd: 69,
      marginPct: 58,
    }),
  ],
};

describe("scoring", () => {
  it("gives whitespace markets a perfect gap score", () => {
    expect(gapStatusScore(sample.markets[0])).toBe(100);
  });

  it("ranks thin high-margin markets above saturated low-margin ones", () => {
    const thin = gapStatusScore(sample.markets[2]);
    const saturated = gapStatusScore(
      market({
        region: "na",
        exists: true,
        status: "saturated",
        marginPct: 18,
      }),
    );
    expect(thin).toBeGreaterThan(saturated);
  });

  it("produces a 0-100 composite and flags whitespace regions", () => {
    const scored = toScoredProduct(sample);
    expect(scored.score.total).toBeGreaterThan(50);
    expect(scored.score.total).toBeLessThanOrEqual(100);
    expect(scored.whitespaceRegions).toEqual(["na"]);
    expect(scored.bestRegion).toBe("na");
  });

  it("rewards factory velocity and low MOQ", () => {
    const slow = scoreProduct({
      ...sample,
      factory: [{ ...sample.factory[0], orders30d: 200, velocityWoW: -20, moq: 200, supplierCount: 8 }],
    });
    const fast = scoreProduct(sample);
    expect(fast.factoryTrend).toBeGreaterThan(slow.factoryTrend);
    expect(fast.supplyEase).toBeGreaterThan(slow.supplyEase);
  });
});
