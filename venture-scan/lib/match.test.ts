import { describe, expect, it } from "vitest";
import { rankIdeasForProfile, scoreIdeaAgainstProfile } from "./match";
import { SEED_IDEAS } from "./seed-ideas";
import type { UserProfile } from "./types";

function profile(partial: Partial<UserProfile>): UserProfile {
  return {
    id: "test",
    displayName: "Tester",
    skills: [],
    major: "",
    currentBusiness: "",
    interestedDomains: [],
    preferredMarkets: [],
    notes: "",
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}

describe("scoreIdeaAgainstProfile", () => {
  it("scores climate/agri profile higher on FarmStack than CueCraft", () => {
    const p = profile({
      skills: ["agriculture", "solar", "logistics"],
      major: "Agricultural engineering",
      currentBusiness: "produce aggregation cooperative",
      interestedDomains: ["agritech", "cold chain", "climate"],
      preferredMarkets: ["Kenya", "Africa"],
    });

    const farm = scoreIdeaAgainstProfile(
      SEED_IDEAS.find((i) => i.slug === "farmstack-coldchain")!,
      p,
    );
    const ads = scoreIdeaAgainstProfile(
      SEED_IDEAS.find((i) => i.slug === "cuecraft-ads")!,
      p,
    );

    expect(farm.score).toBeGreaterThan(ads.score);
    expect(farm.score).toBeGreaterThan(40);
    expect(farm.matched.length).toBeGreaterThan(0);
  });

  it("ranks ideas with interested domain health near the top", () => {
    const p = profile({
      skills: ["nursing", "product management", "AI"],
      major: "Public health",
      currentBusiness: "hospital consulting",
      interestedDomains: ["health tech", "aging care"],
      preferredMarkets: ["Japan", "Asia"],
    });

    const ranked = rankIdeasForProfile(SEED_IDEAS, p);
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
    const topSlugs = ranked.slice(0, 3).map((r) => r.slug);
    expect(
      topSlugs.some((s) => s === "nightshift-nursing-ai" || s === "elderloop-companion"),
    ).toBe(true);
  });

  it("returns low score and gaps when profile is empty", () => {
    const match = scoreIdeaAgainstProfile(SEED_IDEAS[0], profile({}));
    expect(match.score).toBe(0);
    expect(match.gaps.length).toBeGreaterThan(0);
  });
});
