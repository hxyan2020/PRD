import { describe, expect, it } from "vitest";
import { SEED_IDEAS } from "./seed-ideas";
import { relatedSourcesForIdea } from "./idea-sources";
import { attachMediaToSources, sourceMediaManifestSize, sourceMediaPublicPath } from "./source-media";

describe("relatedSourcesForIdea", () => {
  it("returns market-matched sources with media for every seed idea", () => {
    expect(sourceMediaManifestSize()).toBeGreaterThanOrEqual(20);

    for (const idea of SEED_IDEAS) {
      const sources = relatedSourcesForIdea(idea, "overview", 6);
      expect(sources.length).toBeGreaterThan(0);
      expect(sources.some((s) => s.countries.includes(idea.teamCountry) || /global/i.test(s.region))).toBe(
        true,
      );

      const withMedia = attachMediaToSources(sources);
      expect(withMedia).toHaveLength(sources.length);
      for (const item of withMedia) {
        expect(item.mediaPath).toMatch(/^\/source-media\//);
        expect(sourceMediaPublicPath(item.source.id)).toBeTruthy();
      }
    }
  });

  it("prefers fundraising desks for funding intent", () => {
    const idea = SEED_IDEAS.find((i) => i.teamCountry === "India") ?? SEED_IDEAS[0];
    const sources = relatedSourcesForIdea(idea, "funding", 4);
    expect(sources.length).toBeGreaterThan(0);
    expect(sources.some((s) => s.kind === "fundraising" || s.kind === "news")).toBe(true);
  });
});
