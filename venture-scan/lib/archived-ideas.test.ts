import { describe, expect, it } from "vitest";
import {
  ARCHIVED_IDEAS,
  isActiveIdea,
  isArchivedIdea,
  partitionIdeas,
} from "./archived-ideas";
import { catalogActiveIdeas, catalogIdeas } from "./catalog";
import { SEED_IDEAS } from "./seed-ideas";

describe("archived historical ideas", () => {
  it("retains the pre-cull historical catalog as archived", () => {
    expect(ARCHIVED_IDEAS.length).toBeGreaterThan(50);
    expect(ARCHIVED_IDEAS.every(isArchivedIdea)).toBe(true);
    expect(ARCHIVED_IDEAS.some((i) => i.slug === "spotify-audio-graph")).toBe(true);
    expect(ARCHIVED_IDEAS.some((i) => i.slug === "notion-ops-stack")).toBe(true);
  });

  it("keeps active and archived disjoint in the full catalog", () => {
    const all = catalogIdeas();
    const { active, archived } = partitionIdeas(all);
    expect(active.length).toBe(SEED_IDEAS.length);
    expect(archived.length).toBe(ARCHIVED_IDEAS.length);
    expect(all.length).toBe(active.length + archived.length);

    const activeSlugs = new Set(active.map((i) => i.slug));
    for (const idea of archived) {
      expect(activeSlugs.has(idea.slug)).toBe(false);
    }
  });

  it("marks live seed ideas as active", () => {
    expect(catalogActiveIdeas().every(isActiveIdea)).toBe(true);
  });
});
