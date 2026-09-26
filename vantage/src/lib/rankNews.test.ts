import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rankDeskNews, storyDeskScore } from "./rankNews";
import type { Entity, NewsItem } from "./types";

const entities: Entity[] = [
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
  {
    id: "db",
    rank: 24,
    name: "Deutsche Bank",
    aliases: ["Deutsche Bank"],
    sector: "banks",
    hq: "Frankfurt",
    country: "Germany",
    website: "https://www.db.com",
  },
  {
    id: "gs",
    rank: 22,
    name: "Goldman Sachs",
    aliases: ["Goldman Sachs"],
    sector: "banks",
    hq: "New York",
    country: "United States",
    website: "https://www.goldmansachs.com",
  },
];

function story(partial: Partial<NewsItem> & Pick<NewsItem, "id" | "caption">): NewsItem {
  return {
    captionZh: "",
    category: "product",
    sectors: ["banks"],
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

describe("rankDeskNews", () => {
  it("puts impactful desk stories ahead of alerts and chatter in the same category", () => {
    const custody = story({
      id: "custody",
      caption: "Deutsche Bank prepares for go-live of digital asset custody",
      category: "product",
      entities: ["db"],
      sectors: ["banks", "crypto"],
    });
    const alert = story({
      id: "alert",
      caption: "EBA E-mail alert 16 September, 2026",
      category: "regulation",
      impact: { sectors: ["banks"], assets: [], summary: "Potential impact on banks.", summaryZh: "" },
    });
    const corn = story({
      id: "corn",
      caption: "Corn Fading Back to Start Wednesday Trade",
      category: "product",
      sectors: ["brokers"],
    });
    const tsla = story({
      id: "tsla",
      caption: "TSLA Reiterated by Goldman Sachs -- Price Target Maintained at $360",
      category: "product",
      entities: ["gs"],
    });

    const ranked = rankDeskNews([alert, corn, tsla, custody], { entities });
    assert.equal(ranked[0].id, "custody");
    assert.ok(storyDeskScore(custody, { entities }) > storyDeskScore(alert, { entities }));
    assert.ok(storyDeskScore(custody, { entities }) > storyDeskScore(corn, { entities }));
    assert.ok(storyDeskScore(custody, { entities }) > storyDeskScore(tsla, { entities }));
  });

  it("ranks multi-source launches above a lone calendar item", () => {
    const circle = story({
      id: "circle",
      caption: "Circle launches Arc mainnet with USDC as native gas token",
      category: "product",
      sectors: ["crypto", "banks", "brokers"],
      sources: [
        { name: "Decrypt", url: "https://example.com/a", sourceId: "decrypt" },
        { name: "CoinDesk", url: "https://example.com/b", sourceId: "coindesk" },
        { name: "The Block", url: "https://example.com/c", sourceId: "theblock" },
      ],
    });
    const meeting = story({
      id: "meet",
      caption: "IndusInd Bank To Meet Analyst And Investor Goldman Sachs On September 21",
      category: "product",
      entities: ["gs"],
    });

    const ranked = rankDeskNews([meeting, circle], { entities });
    assert.equal(ranked[0].id, "circle");
  });

  it("keeps the stronger regulation story first inside that category", () => {
    const rulemaking = story({
      id: "clarity",
      caption: "Bernstein expects aggressive rulemaking from SEC and CFTC after the CLARITY Act failure",
      category: "regulation",
      sectors: ["crypto", "brokers"],
      impact: { sectors: ["crypto", "brokers"], assets: ["crypto perpetuals"], summary: "Potential impact.", summaryZh: "" },
    });
    const appointment = story({
      id: "appoint",
      caption: "Chancellor announces Bank of England appointments",
      category: "regulation",
      impact: { sectors: ["banks"], assets: [], summary: "Potential impact on banks.", summaryZh: "" },
    });

    const ranked = rankDeskNews([appointment, rulemaking], { entities });
    assert.equal(ranked[0].id, "clarity");
  });

  it("uses publish time only when scores match", () => {
    const older = story({
      id: "older",
      caption: "OKX lists a new perpetual",
      category: "listing",
      publishedAt: "2026-09-16T10:00:00.000Z",
    });
    const newer = story({
      id: "newer",
      caption: "OKX lists a new perpetual",
      category: "listing",
      publishedAt: "2026-09-16T14:00:00.000Z",
    });
    const ranked = rankDeskNews([older, newer], { entities });
    assert.equal(ranked[0].id, "newer");
  });
});
