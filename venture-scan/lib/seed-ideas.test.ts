import { describe, expect, it } from "vitest";
import { SEED_IDEAS } from "./seed-ideas";

describe("seed idea contact links", () => {
  it("uses real https websites — never example.com placeholders", () => {
    for (const idea of SEED_IDEAS) {
      expect(idea.website, idea.slug).toMatch(/^https:\/\//);
      expect(idea.website.toLowerCase(), idea.slug).not.toContain("example.com");
      const host = new URL(idea.website).hostname;
      expect(host.includes("."), idea.slug).toBe(true);
    }
  });

  it("ships at least one deep social profile URL per idea", () => {
    for (const idea of SEED_IDEAS) {
      expect(idea.social.length, idea.slug).toBeGreaterThan(0);
      for (const s of idea.social) {
        expect(s.url, `${idea.slug}:${s.platform}`).toMatch(/^https:\/\//);
        expect(s.url, `${idea.slug}:${s.platform}`).not.toContain("example.com");
        // Generic explore landing pages are not company profiles.
        expect(s.url, `${idea.slug}:${s.platform}`).not.toMatch(
          /xiaohongshu\.com\/explore\/?$/i,
        );
        const path = new URL(s.url).pathname.replace(/\/+$/, "");
        expect(path.length, s.url).toBeGreaterThan(1);
        expect(s.handle.trim().length, `${idea.slug}:${s.platform}`).toBeGreaterThan(0);
      }
    }
  });
});
