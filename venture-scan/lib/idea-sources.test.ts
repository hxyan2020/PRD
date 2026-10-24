import { describe, expect, it } from "vitest";
import { SEED_IDEAS } from "./seed-ideas";
import { relatedSourcesForIdea } from "./idea-sources";
import { attachMediaToSources, sourceMediaManifestSize } from "./source-media";

describe("relatedSourcesForIdea", () => {
  it("still resolves market-matched desks for ingest provenance", () => {
    expect(sourceMediaManifestSize()).toBeGreaterThanOrEqual(20);

    for (const idea of SEED_IDEAS) {
      const sources = relatedSourcesForIdea(idea, "overview", 6);
      expect(sources.length).toBeGreaterThan(0);
      const withMedia = attachMediaToSources(sources);
      expect(withMedia).toHaveLength(sources.length);
    }
  });

  it("prefers fundraising desks for funding intent", () => {
    const idea = SEED_IDEAS.find((i) => i.teamCountry === "India") ?? SEED_IDEAS[0];
    const sources = relatedSourcesForIdea(idea, "funding", 4);
    expect(sources.length).toBeGreaterThan(0);
    expect(sources.some((s) => s.kind === "fundraising" || s.kind === "news")).toBe(true);
  });
});
