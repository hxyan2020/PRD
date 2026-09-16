import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { countNews, itemMatchesFilters } from "./filters";
import type { NewsItem } from "./types";

function story(partial: Partial<NewsItem> & Pick<NewsItem, "id" | "category" | "sectors">): NewsItem {
  return {
    caption: partial.caption ?? partial.id,
    captionZh: "",
    keyPoints: [],
    keyPointsZh: [],
    sources: [],
    publishedAt: "2026-09-16T12:00:00.000Z",
    entities: [],
    jurisdictions: [],
    impact: { sectors: partial.sectors, assets: [], summary: "", summaryZh: "" },
    riskTools: [],
    ...partial,
  };
}

describe("countNews", () => {
  const items = [
    story({ id: "a", category: "listing", sectors: ["crypto"] }),
    story({ id: "b", category: "listing", sectors: ["banks"] }),
    story({ id: "c", category: "regulation", sectors: ["banks", "brokers"] }),
    story({ id: "d", category: "product", sectors: ["crypto"] }),
  ];

  it("counts every story for the all category", () => {
    assert.equal(countNews(items, "all", "all"), 4);
  });

  it("counts one news category", () => {
    assert.equal(countNews(items, "listing", "all"), 2);
    assert.equal(countNews(items, "regulation", "all"), 1);
  });

  it("counts a category inside the active sector", () => {
    assert.equal(countNews(items, "listing", "banks"), 1);
    assert.equal(countNews(items, "all", "crypto"), 2);
  });

  it("matches captions when a search query is set", () => {
    const named = [
      story({ id: "x", caption: "SEC listing", category: "listing", sectors: ["crypto"] }),
    ];
    assert.equal(itemMatchesFilters(named[0], "all", "all", "sec"), true);
    assert.equal(countNews(named, "all", "all", "cftc"), 0);
  });
});
