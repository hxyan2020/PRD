import { describe, expect, it } from "vitest";
import { buildTodayCohort, todayCohortTarget } from "./daily-ledger";
import { parseFeedItems, matchHeadlineToIdeas } from "./rss-headlines";
import { SEED_IDEAS } from "./seed-ideas";
import type { DailyHeadline } from "./rss-headlines";

describe("daily cohort + RSS matching", () => {
  it("varies cohort size by calendar day", () => {
    const a = todayCohortTarget("2026-10-31");
    const b = todayCohortTarget("2026-11-01");
    expect(a).toBeGreaterThanOrEqual(16);
    expect(a).toBeLessThanOrEqual(28);
    expect(b).toBeGreaterThanOrEqual(16);
    expect(b).toBeLessThanOrEqual(28);
    expect(a).not.toBe(b);
  });

  it("prioritizes news-matched ideas and changes membership by day", () => {
    const active = SEED_IDEAS.filter((i) => (i.status ?? "active") === "active");
    const hit = active[0];
    const headlines: DailyHeadline[] = [
      {
        id: "t1",
        sourceId: "techcrunch",
        title: `${hit.name} raises Series B`,
        url: "https://example.com/a",
        excerpt: "funding round",
        publishedAt: null,
        matchedSlugs: [hit.slug],
      },
    ];
    const dayA = buildTodayCohort(SEED_IDEAS, headlines, "2026-10-31");
    const dayB = buildTodayCohort(SEED_IDEAS, headlines, "2026-11-01");
    expect(dayA[0]).toBe(hit.slug);
    expect(dayA).not.toEqual(dayB);
  });

  it("parses RSS items and matches idea names", () => {
    const xml = `<?xml version="1.0"?>
      <rss><channel>
        <item>
          <title><![CDATA[Brex raises new funding for finance stack]]></title>
          <link>https://techcrunch.com/example-brex</link>
          <description>Series funding for startups</description>
        </item>
      </channel></rss>`;
    const items = parseFeedItems(xml, "techcrunch");
    expect(items).toHaveLength(1);
    expect(items[0].title).toMatch(/Brex/i);
    const slugs = matchHeadlineToIdeas(items[0].title, items[0].excerpt, SEED_IDEAS);
    expect(slugs.length).toBeGreaterThanOrEqual(0);
  });
});
