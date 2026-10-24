import { describe, expect, it } from "vitest";
import { catalogActiveIdeas } from "./catalog";
import { SEED_IDEAS } from "./seed-ideas";
import {
  isEligibleStartupIdea,
  startupEligibilityIssues,
} from "./startup-eligibility";

describe("startup eligibility", () => {
  it("keeps every active catalog idea within early/mid-stage startup bounds", () => {
    const ideas = catalogActiveIdeas();
    expect(ideas.length).toBe(SEED_IDEAS.length);
    for (const idea of ideas) {
      expect(startupEligibilityIssues(idea), idea.slug).toEqual([]);
      expect(isEligibleStartupIdea(idea), idea.slug).toBe(true);
      expect(idea.teamSize, idea.slug).toBeLessThanOrEqual(250);
      expect(idea.fundingStage, idea.slug).not.toMatch(/^(Public|Acquired|Series [EF]|Series I)/);
    }
  });

  it("rejects public megacorp wrappers like Spotify", () => {
    const fake = {
      ...SEED_IDEAS[0],
      slug: "spotify-audio-graph",
      website: "https://www.spotify.com/",
      teamSize: 9000,
      fundingStage: "Public",
      fundingAmountUsd: 2_500_000_000,
    };
    const issues = startupEligibilityIssues(fake);
    expect(issues.some((i) => i.includes("spotify"))).toBe(true);
    expect(isEligibleStartupIdea(fake)).toBe(false);
  });
});
