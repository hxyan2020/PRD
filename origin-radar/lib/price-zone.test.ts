import { describe, expect, it } from "vitest";
import { charmPrice, priceZoneForMarket, priceZonesFor } from "./price-zone";
import type { ProductInput, RegionalMarket } from "./types";
import { dailyQueue } from "./desk";
import { toScoredProduct } from "./scoring";

function market(partial: Partial<RegionalMarket> & Pick<RegionalMarket, "region" | "status" | "exists">): RegionalMarket {
  return {
    listings: 0,
    sellerCount: 0,
    avgRetailUsd: 0,
    lowRetailUsd: 0,
    projectedRetailUsd: 129,
    platforms: [],
    landedCostUsd: 46,
    marginPct: null,
    notes: "",
    ...partial,
  };
}

describe("price zones", () => {
  it("snaps charm prices", () => {
    expect(charmPrice(127)).toBe(125);
    expect(charmPrice(12.4)).toBe(12.5);
  });

  it("recommends projected retail on whitespace above the landed floor", () => {
    const z = priceZoneForMarket(28.4, market({ region: "na", exists: false, status: "whitespace" }));
    expect(z.recommendedUsd).toBeGreaterThanOrEqual(z.floorUsd);
    expect(z.recommendedUsd).toBe(130);
    expect(z.tight).toBe(false);
    expect(z.grossMarginPct).toBeGreaterThan(50);
  });

  it("flags a tight zone when landed cost eats the market average", () => {
    const z = priceZoneForMarket(
      28,
      market({
        region: "sea",
        exists: true,
        status: "competitive",
        avgRetailUsd: 52,
        projectedRetailUsd: 52,
        landedCostUsd: 34,
        marginPct: 35,
      }),
    );
    expect(z.tight).toBe(true);
  });

  it("builds three regional zones from a product", () => {
    const product = {
      factory: [{ unitPriceUsd: 28.4 }],
      markets: [
        market({ region: "na", exists: false, status: "whitespace" }),
        market({ region: "sea", exists: true, status: "competitive", avgRetailUsd: 52, landedCostUsd: 34 }),
        market({ region: "eu", exists: false, status: "whitespace", projectedRetailUsd: 139, landedCostUsd: 51 }),
      ],
    } as ProductInput;
    expect(priceZonesFor(product)).toHaveLength(3);
  });
});

describe("daily queue", () => {
  it("returns up to eight products and skips discards", () => {
    const scored = [
      toScoredProduct({
        slug: "a",
        name: "A",
        nameZh: "",
        category: "x",
        summary: "",
        whyNow: "",
        image: "",
        imageAlt: "",
        tags: [],
        factory: [
          {
            platform: "1688",
            listingCount: 100,
            supplierCount: 10,
            verifiedFactories: 4,
            unitPriceUsd: 10,
            unitPriceCny: 70,
            moq: 2,
            cluster: "Yiwu",
            orders30d: 1000,
            velocityWoW: 5,
            searchUrl: "",
          },
        ],
        social: [],
        search: { keyword: "", related: [], globalIndex: 40, risingPct: 10, sparkline: [1, 2], byCountry: { US: 40 } },
        markets: [market({ region: "na", exists: false, status: "whitespace" })],
      }),
    ];
    const many = Array.from({ length: 12 }, (_, i) => ({ ...scored[0], slug: `p${i}`, name: `P${i}` }));
    const q = dailyQueue(many, new Set(["p0"]), 8, "2026-09-05");
    expect(q).toHaveLength(8);
    expect(q.some((p) => p.slug === "p0")).toBe(false);
  });
});
