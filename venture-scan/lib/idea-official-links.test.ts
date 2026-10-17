import { describe, expect, it } from "vitest";
import { catalogIdeas } from "./catalog";
import {
  OFFICIAL_WEBSITE_HOST_BY_SLUG,
  assertOfficialWebsite,
  websiteHost,
} from "./idea-official-links";

describe("catalog official website links", () => {
  const ideas = catalogIdeas();

  it("covers every catalog slug in the official-host lockfile", () => {
    const slugs = new Set(ideas.map((i) => i.slug));
    for (const slug of slugs) {
      expect(OFFICIAL_WEBSITE_HOST_BY_SLUG[slug], `missing host lock for ${slug}`).toBeTruthy();
    }
    for (const slug of Object.keys(OFFICIAL_WEBSITE_HOST_BY_SLUG)) {
      expect(slugs.has(slug), `stale host lock for removed slug ${slug}`).toBe(true);
    }
  });

  it("uses the locked real https company host for every idea", () => {
    for (const idea of ideas) {
      const err = assertOfficialWebsite(idea.slug, idea.website);
      expect(err, err ?? idea.slug).toBeNull();
    }
  });

  it("never uses TikTok consumer feed as a primary company website", () => {
    for (const idea of ideas) {
      expect(websiteHost(idea.website), idea.slug).not.toBe("tiktok.com");
    }
    const bytedance = ideas.find((i) => i.slug === "bytedance-creator-os");
    expect(bytedance?.website).toBe("https://www.bytedance.com/");
  });

  it("ships deep social profile URLs (not placeholders)", () => {
    for (const idea of ideas) {
      expect(idea.social.length, idea.slug).toBeGreaterThan(0);
      for (const s of idea.social) {
        expect(s.url, `${idea.slug}:${s.platform}`).toMatch(/^https:\/\//);
        expect(s.url.toLowerCase(), `${idea.slug}:${s.platform}`).not.toContain("example.com");
        const path = new URL(s.url).pathname.replace(/\/+$/, "");
        expect(path.length, s.url).toBeGreaterThan(1);
        expect(s.handle.trim().length, `${idea.slug}:${s.platform}`).toBeGreaterThan(0);
      }
    }
  });
});
