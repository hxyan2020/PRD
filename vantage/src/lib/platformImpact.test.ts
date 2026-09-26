import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deskPlatformImpact } from "./platformImpact";
import type { NewsItem } from "./types";

function story(partial: Partial<NewsItem> & Pick<NewsItem, "id" | "caption" | "category">): NewsItem {
  return {
    captionZh: "",
    sectors: ["brokers"],
    keyPoints: [partial.caption],
    keyPointsZh: [],
    sources: [],
    publishedAt: "2026-09-16T12:00:00.000Z",
    entities: [],
    jurisdictions: ["United States"],
    impact: null,
    riskTools: [],
    ...partial,
  };
}

describe("deskPlatformImpact", () => {
  it("writes a Vantage broker-platform note for a listing", () => {
    const copy = deskPlatformImpact(
      story({
        id: "etf",
        caption: "Binance adds 11 US-listed ETFs to wealth management offering",
        category: "listing",
        sectors: ["crypto", "brokers"],
        entities: ["binance"],
      }),
      [{ nameEn: "Binance", nameZh: "币安" }],
    );
    assert.match(copy.summary, /Vantage/);
    assert.match(copy.summary, /ETF/);
    assert.match(copy.summary, /Binance/);
    assert.match(copy.summaryZh, /Vantage/);
    assert.match(copy.summaryZh, /ETF/);
    assert.match(copy.summaryZh, /币安/);
    assert.match(copy.summaryZh, /差价合约|多资产/);
  });

  it("flags rulemaking as a compliance and leverage issue", () => {
    const copy = deskPlatformImpact(
      story({
        id: "reg",
        caption: "Bernstein expects aggressive rulemaking from SEC and CFTC after the CLARITY Act failure",
        category: "regulation",
        sectors: ["crypto", "brokers"],
        impact: {
          sectors: ["crypto", "brokers"],
          assets: ["crypto perpetuals"],
          summary: "",
          summaryZh: "",
        },
      }),
    );
    assert.match(copy.summary, /leverage|eligibility|disclosure/i);
    assert.match(copy.summaryZh, /杠杆|准入|披露/);
  });

  it("ties a KYC risk-tool story to onboarding conversion", () => {
    const copy = deskPlatformImpact(
      story({
        id: "kyc",
        caption: "Deploying Secure KYC/KYB Without Destroying Onboarding Conversion",
        category: "risk_tools",
      }),
    );
    assert.match(copy.summary, /onboarding/i);
    assert.match(copy.summaryZh, /开户/);
  });

  it("keeps thin alerts as background instead of inventing a trade shock", () => {
    const copy = deskPlatformImpact(
      story({
        id: "alert",
        caption: "EBA E-mail alert 16 September, 2026",
        category: "regulation",
      }),
    );
    assert.match(copy.summary, /background/);
    assert.match(copy.summaryZh, /背景/);
    assert.doesNotMatch(copy.summary, /Map the story to the matching CFD/);
  });

  it("does not reuse the same paragraph for different categories", () => {
    const listing = deskPlatformImpact(
      story({ id: "a", caption: "OKX lists a new perpetual", category: "listing" }),
    );
    const product = deskPlatformImpact(
      story({ id: "b", caption: "Interactive Brokers launches a new TWAP order type", category: "product" }),
    );
    assert.notEqual(listing.summary, product.summary);
    assert.notEqual(listing.summaryZh, product.summaryZh);
    assert.match(product.summary, /TWAP|order type|Execution/i);
  });
});
