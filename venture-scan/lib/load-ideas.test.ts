import { describe, expect, it } from "vitest";
import { isActiveIdea, isArchivedIdea } from "./archived-ideas";
import { catalogIdeas } from "./catalog";
import { SEED_IDEAS } from "./seed-ideas";
import { loadIdeasForPage } from "./load-ideas";

describe("loadIdeasForPage", () => {
  it("returns the full sourced catalog in static mode", () => {
    process.env.NEXT_PUBLIC_STATIC = "1";
    const { ideas, meta } = loadIdeasForPage();
    expect(ideas.length).toBe(catalogIdeas().length);
    expect(ideas.filter(isActiveIdea).length).toBe(SEED_IDEAS.length);
    expect(ideas.some((i) => i.slug === "resend-email-api" && isActiveIdea(i))).toBe(true);
    expect(ideas.some((i) => i.slug === "spotify-audio-graph" && isArchivedIdea(i))).toBe(true);
    expect(ideas.filter(isActiveIdea).some((i) => /spotify/i.test(i.website))).toBe(false);
    expect(meta.industries.length).toBeGreaterThan(5);
    expect(meta.countries.length).toBeGreaterThan(5);
    delete process.env.NEXT_PUBLIC_STATIC;
  });
});
