import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clusterNewsItems, eventKey } from "./clusterNews";
import type { NewsItem } from "./types";

function item(partial: Partial<NewsItem> & Pick<NewsItem, "id" | "caption">): NewsItem {
  return {
    captionZh: "",
    category: "regulation",
    sectors: ["crypto"],
    keyPoints: [],
    keyPointsZh: [],
    sources: [{ name: "CoinDesk", url: `https://example.com/${partial.id}`, sourceId: "coindesk" }],
    publishedAt: "2026-09-16T10:00:00.000Z",
    entities: [],
    jurisdictions: ["United States"],
    impact: null,
    riskTools: [],
    ...partial,
  };
}

describe("clusterNewsItems", () => {
  it("combines same-event Clarity Act cards and keeps distinct facts as bullets", () => {
    const clustered = clusterNewsItems([
      item({
        id: "etf",
        caption: "Bitcoin ETFs shed $450 million as Clarity Act fails",
        keyPoints: [
          "U.S. spot bitcoin ETFs shed $450 million, the most since June, as the Senate's failure to advance the Clarity Act sent regulatory-sensitive tokens sharply lower.",
        ],
        publishedAt: "2026-09-16T10:48:44.000Z",
      }),
      item({
        id: "live",
        caption:
          "Live updates: Bitcoin holds near $76,000 as spot ETFs outflows surged alongside Clarity Act failure",
        keyPoints: [
          "Privacy token zcash, meanwhile, is up 130% over 30 days and trades near its all-time highs from 2016.",
        ],
        publishedAt: "2026-09-16T10:37:46.000Z",
      }),
    ]);

    assert.equal(clustered.length, 1);
    assert.match(clustered[0].caption, /ETFs shed \$450 million/);
    assert.equal(clustered[0].sources.length, 2);
    const joined = clustered[0].keyPoints.join(" ");
    assert.match(joined, /450 million/);
    assert.match(joined, /zcash/i);
    assert.match(joined, /76,000/);
  });

  it("merges language variants of the same CanDeal announcement", () => {
    const clustered = clusterNewsItems([
      item({
        id: "en",
        caption: "Bank of Canada Selects the CanDeal Data & Analytics DNA Reference Pricing Service",
        category: "product",
        sectors: ["banks"],
        keyPoints: ["CanDeal announced a multi-year agreement with the Bank of Canada."],
      }),
      item({
        id: "nl",
        caption: "Bank of Canada kiest de CanDeal Data & Analytics Reference Pricing Service",
        category: "product",
        sectors: ["banks"],
        keyPoints: ["CanDeal kondigt een meerjarige overeenkomst aan met de Bank of Canada."],
      }),
    ]);
    assert.equal(clustered.length, 1);
    assert.equal(eventKey(clustered[0]), "candeal-boc");
  });

  it("does not merge different OKX listing products", () => {
    const clustered = clusterNewsItems([
      item({
        id: "lg",
        caption: "OKX to list perpetual futures for LGELECTRONICS, NAVER and HANMI equities - OKX",
        category: "listing",
        keyPoints: ["OKX will list equity perpetuals for three Korean names."],
      }),
      item({
        id: "ake",
        caption: "OKX to list perpetual futures for AKE crypto - OKX",
        category: "listing",
        keyPoints: ["OKX will list AKE-USDT perpetual futures."],
      }),
    ]);
    assert.equal(clustered.length, 2);
  });

  it("does not merge unrelated stories", () => {
    const clustered = clusterNewsItems([
      item({
        id: "monzo",
        caption: "Monzo launches auto-invest cashback card",
        category: "product",
        sectors: ["banks"],
        keyPoints: ["Monzo has launched a metal credit card that auto-invests cashback."],
      }),
      item({
        id: "etf",
        caption: "Bitcoin ETFs shed $450 million as Clarity Act fails",
        keyPoints: ["U.S. spot bitcoin ETFs shed $450 million after the Senate vote."],
      }),
    ]);
    assert.equal(clustered.length, 2);
  });
});
