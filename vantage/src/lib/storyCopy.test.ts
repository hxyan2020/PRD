import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { repairNewsItem } from "./repairNews";
import { rewriteCaption, shapeStoryCopy } from "./storyCopy";
import type { NewsItem } from "./types";

function story(partial: Partial<NewsItem> & Pick<NewsItem, "caption">): NewsItem {
  return {
    id: partial.id ?? "x",
    captionZh: "",
    category: "product",
    sectors: ["banks"],
    keyPoints: [],
    keyPointsZh: [],
    sources: [{ name: "Yahoo Finance", url: "https://example.com/x", sourceId: "jpm-ir" }],
    publishedAt: "2026-09-16T15:13:00.000Z",
    entities: [],
    jurisdictions: ["United States"],
    impact: null,
    riskTools: [],
    ...partial,
  };
}

describe("rewriteCaption", () => {
  it("turns a vs-which headline into a comparison statement", () => {
    assert.equal(
      rewriteCaption(
        "JPMorgan vs. Wells Fargo: Which Bank Stock Has More Upside Potential? - Yahoo Finance",
        ["JPMorgan Chase", "Wells Fargo"],
      ),
      "JPMorgan Chase and Wells Fargo compared on bank stock upside potential",
    );
  });

  it("drops why and keeps the fact", () => {
    assert.equal(
      rewriteCaption("Why Cipher Digital Stock Is Skyrocketing Today"),
      "Cipher Digital Stock Is Skyrocketing Today",
    );
  });

  it("uses the declarative clause after a rhetorical question", () => {
    assert.equal(
      rewriteCaption("Would you let AI spend your money? The trust issue facing agentic payments"),
      "The trust issue facing agentic payments",
    );
  });

  it("drops how and how-to framing", () => {
    assert.equal(
      rewriteCaption("How MSCI Shifted From Objective Benchmark To Defacto Market Regulator - Bitcoin Magazine"),
      "MSCI Shifted From Objective Benchmark To Defacto Market Regulator",
    );
    assert.equal(
      rewriteCaption("How to Deploy Secure KYC/KYB Without Destroying Onboarding Conversion"),
      "Deploying Secure KYC/KYB Without Destroying Onboarding Conversion",
    );
  });

  it("rewrites a which-matters headline and strips a trailing publisher question", () => {
    assert.equal(
      rewriteCaption("Which Vanguard MSCI Index International Shares ETF Global Angle Matters Now? - Kalkine Media"),
      "Vanguard MSCI Index International Shares ETF Global Angle in focus",
    );
    assert.equal(
      rewriteCaption("Goldman Sachs (NYSE:GS) Moves to the Front of Today's financial stocks Story? - Kalkine Media"),
      "Goldman Sachs (NYSE:GS) Moves to the Front of Today's financial stocks Story",
    );
  });

  it("leaves a factual caption alone", () => {
    assert.equal(
      rewriteCaption("Monzo launches auto-invest cashback card"),
      "Monzo launches auto-invest cashback card",
    );
  });
});

describe("shapeStoryCopy", () => {
  it("replaces a question caption and restated bullet with a comparison summary", () => {
    const shaped = shapeStoryCopy(
      story({
        caption: "JPMorgan vs. Wells Fargo: Which Bank Stock Has More Upside Potential? - Yahoo Finance",
        keyPoints: ["JPMorgan vs. Wells Fargo: Which Bank Stock Has More Upside Potential?"],
        entities: ["jpm", "wfc"],
        sources: [{ name: "JPMorgan Chase News", url: "https://example.com/jpm", sourceId: "jpm-ir" }],
      }),
      { jpm: "JPMorgan Chase", wfc: "Wells Fargo" },
    );

    assert.equal(
      shaped.caption,
      "JPMorgan Chase and Wells Fargo compared on bank stock upside potential",
    );
    assert.equal(shaped.caption.includes("?"), false);
    assert.ok(shaped.keyPoints.length >= 2);
    assert.ok(shaped.keyPoints.every((point) => !point.includes("?")));
    assert.match(shaped.keyPoints.join(" "), /JPMorgan Chase and Wells Fargo are compared/);
    assert.match(shaped.keyPoints.join(" "), /product\/feature/);
    assert.match(shaped.keyPoints.join(" "), /United States/);
  });

  it("keeps a real RSS summary and only rewrites a why-caption", () => {
    const shaped = shapeStoryCopy(
      story({
        caption: "Why Cipher Digital Stock Is Skyrocketing Today",
        keyPoints: [
          "Key PointsAI stocks are seeing some recovery momentum today, and Cipher Digital is benefiting from the trend.",
        ],
        sectors: ["crypto"],
      }),
    );
    assert.equal(shaped.caption, "Cipher Digital Stock Is Skyrocketing Today");
    assert.equal(shaped.keyPoints.length, 1);
    assert.match(shaped.keyPoints[0], /AI stocks are seeing some recovery/);
  });

  it("is idempotent after the first rewrite", () => {
    const first = shapeStoryCopy(
      story({
        caption: "JPMorgan vs. Wells Fargo: Which Bank Stock Has More Upside Potential?",
        keyPoints: ["JPMorgan vs. Wells Fargo: Which Bank Stock Has More Upside Potential?"],
        entities: ["jpm", "wfc"],
      }),
      { jpm: "JPMorgan Chase", wfc: "Wells Fargo" },
    );
    const second = shapeStoryCopy(first, { jpm: "JPMorgan Chase", wfc: "Wells Fargo" });
    assert.deepEqual(second.caption, first.caption);
    assert.deepEqual(second.keyPoints, first.keyPoints);
  });
});

describe("repairNewsItem story copy", () => {
  it("repairs the Yahoo Finance bank-stock question card", () => {
    const repaired = repairNewsItem(
      story({
        caption: "JPMorgan vs. Wells Fargo: Which Bank Stock Has More Upside Potential? - Yahoo Finance",
        captionZh: "摩根大通与富国银行：哪家银行的股票更具上行潜力？ -雅虎财经",
        keyPoints: ["JPMorgan vs. Wells Fargo: Which Bank Stock Has More Upside Potential?"],
        keyPointsZh: ["摩根大通与富国银行：哪家银行的股票具有更大的上行潜力？"],
        entities: ["jpm", "wfc"],
      }),
      { jpm: "JPMorgan Chase", wfc: "Wells Fargo" },
    );
    assert.match(repaired.caption, /compared on bank stock upside/);
    assert.equal(repaired.captionZh, "");
    assert.ok(!repaired.keyPoints.some((point) => /\?/.test(point)));
    assert.ok(repaired.keyPoints.join(" ").includes("JPMorgan Chase"));
  });
});
