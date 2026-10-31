import { describe, expect, it } from "vitest";
import { ARCHIVED_IDEAS } from "./archived-ideas";
import { catalogIdeas } from "./catalog";
import { SEED_IDEAS } from "./seed-ideas";
import { TODAY_HASH, YESTERDAY_HASH, splitIdeasByDay, todaysIdeas, yesterdaysIdeas } from "./idea-day";

describe("idea day split", () => {
  it("puts live cohort in today and archived in yesterday", () => {
    const all = catalogIdeas();
    const { today, yesterday } = splitIdeasByDay(all);
    // Empty ledger → all active; after daily scan → RSS/date cohort (16–28).
    expect(today.length).toBeGreaterThanOrEqual(1);
    expect(today.length).toBeLessThanOrEqual(SEED_IDEAS.length);
    expect(yesterday.length).toBe(ARCHIVED_IDEAS.length);
    expect(todaysIdeas(all).every((i) => (i.status ?? "active") === "active")).toBe(true);
    expect(yesterdaysIdeas(all).every((i) => i.status === "archived")).toBe(true);
  });

  it("exposes stable homepage / ideas anchors", () => {
    expect(TODAY_HASH).toBe("todays-ideas");
    expect(YESTERDAY_HASH).toBe("yesterday");
  });
});
