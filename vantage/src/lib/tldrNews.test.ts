import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDailyTldr, pickTldrStories, storyAnchorId, tldrStoryScore } from "./tldrNews";
import type { Entity, NewsItem } from "./types";

const entities: Entity[] = [
  {
    id: "binance",
    rank: 1,
    name: "Binance",
    aliases: ["Binance"],
    sector: "crypto",
    hq: "Global",
    country: "Global",
    website: "https://www.binance.com",
  },
  {
    id: "jpm",
    rank: 5,
    name: "JPMorgan Chase",
    aliases: ["JPMorgan"],
    sector: "banks",
    hq: "New York",
    country: "United States",
    website: "https://www.jpmorganchase.com",
  },
];

function story(partial: Partial<NewsItem> & Pick<NewsItem, "id" | "caption">): NewsItem {
  return {
    captionZh: "",
    category: "listing",
    sectors: ["crypto"],
    keyPoints: [partial.caption],
    keyPointsZh: [],
    sources: [{ name: "Desk", url: `https://example.com/${partial.id}`, sourceId: "desk" }],
    publishedAt: "2026-09-16T12:00:00.000Z",
    entities: [],
    jurisdictions: ["United States"],
    impact: null,
    riskTools: [],
    ...partial,
  };
}

describe("pickTldrStories", () => {
  it("keeps the three most impactful, most-reported stories in one domain and category", () => {
    const listed = story({
      id: "etf",
      caption: "Binance adds 11 US-listed ETFs to wealth management offering",
      captionZh: "币安在财富管理产品中新增11只美国上市ETF",
      category: "listing",
      sectors: ["crypto", "brokers"],
      entities: ["binance"],
      sources: [
        { name: "CoinDesk", url: "https://example.com/a", sourceId: "coindesk" },
        { name: "The Block", url: "https://example.com/b", sourceId: "theblock" },
        { name: "Decrypt", url: "https://example.com/c", sourceId: "decrypt" },
      ],
    });
    const second = story({
      id: "perp",
      caption: "OKX lists a new BTC perpetual",
      category: "listing",
      sectors: ["crypto"],
      sources: [
        { name: "CoinDesk", url: "https://example.com/d", sourceId: "coindesk" },
        { name: "Decrypt", url: "https://example.com/e", sourceId: "decrypt" },
      ],
    });
    const third = story({
      id: "spot",
      caption: "Kraken lists a new ETH pair",
      category: "listing",
      sectors: ["crypto"],
    });
    const corn = story({
      id: "corn",
      caption: "Corn Fading Back to Start Wednesday Trade",
      category: "listing",
      sectors: ["crypto", "banks"],
      sources: [
        { name: "Alert", url: "https://example.com/f", sourceId: "alert" },
        { name: "Alert2", url: "https://example.com/g", sourceId: "alert2" },
      ],
    });
    const bankOnly = story({
      id: "loan",
      caption: "JPMorgan lists a new structured note",
      category: "listing",
      sectors: ["banks"],
      entities: ["jpm"],
    });
    const feature = story({
      id: "app",
      caption: "Binance launches a new order type",
      category: "product",
      sectors: ["crypto"],
      entities: ["binance"],
    });

    const picked = pickTldrStories(
      [corn, third, feature, bankOnly, listed, second],
      "crypto",
      "listing",
      { entities },
    );
    assert.deepEqual(
      picked.map((item) => item.id),
      ["etf", "perp", "spot"],
    );
    assert.equal(picked[0].captionZh, "币安在财富管理产品中新增11只美国上市ETF");
    assert.ok(tldrStoryScore(listed, { entities }) > tldrStoryScore(corn, { entities }));
  });

  it("returns fewer than three when the window is thin", () => {
    const only = story({
      id: "kyc",
      caption: "Deploying Secure KYC without destroying onboarding conversion",
      category: "risk_tools",
      sectors: ["banks"],
    });
    assert.equal(pickTldrStories([only], "banks", "risk_tools").length, 1);
    assert.equal(pickTldrStories([only], "crypto", "risk_tools").length, 0);
  });

  it("prefers a domain-named firm over a cross-tagged exchange story", () => {
    const exchange = story({
      id: "bybit",
      caption: "Delisting of ICXUSDT Perpetual Contract - Bybit",
      category: "listing",
      sectors: ["banks", "crypto"],
    });
    const bank = story({
      id: "note",
      caption: "JPMorgan lists a new structured note",
      category: "listing",
      sectors: ["banks"],
      entities: ["jpm"],
    });
    const picked = pickTldrStories([exchange, bank], "banks", "listing", { entities });
    assert.equal(picked[0].id, "note");
  });
});

describe("buildDailyTldr", () => {
  it("fills each domain and category independently", () => {
    const listing = story({
      id: "list",
      caption: "Binance lists a new ETF",
      category: "listing",
      sectors: ["crypto", "brokers"],
      entities: ["binance"],
    });
    const reg = story({
      id: "reg",
      caption: "SEC and CFTC start CLARITY Act rulemaking",
      category: "regulation",
      sectors: ["banks", "brokers", "crypto"],
    });
    const grid = buildDailyTldr([listing, reg], { entities });
    assert.equal(grid.crypto.listing[0]?.id, "list");
    assert.equal(grid.brokers.listing[0]?.id, "list");
    assert.equal(grid.banks.listing.length, 0);
    assert.equal(grid.banks.regulation[0]?.id, "reg");
    assert.equal(grid.crypto.regulation[0]?.id, "reg");
    assert.equal(storyAnchorId("reg"), "story-reg");
  });
});
