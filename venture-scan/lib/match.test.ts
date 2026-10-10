import { describe, expect, it } from "vitest";
import {
  buildDailyRecommendation,
  dayKey,
  rankIdeasForProfile,
  scoreIdeaAgainstProfile,
} from "./match";
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
    expect(farm.matched[0]).toHaveProperty("dimension");
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

  it("returns low score and actionable gaps when profile is empty", () => {
    const match = scoreIdeaAgainstProfile(SEED_IDEAS[0], profile({}));
    expect(match.score).toBe(0);
    expect(match.gaps.length).toBeGreaterThan(0);
    expect(match.gaps[0].closeGap.length).toBeGreaterThan(10);
  });
});

describe("buildDailyRecommendation", () => {
  it("returns the most matched idea with matches and close-gap actions", () => {
    const p = profile({
      skills: ["agriculture", "solar", "logistics"],
      major: "Agricultural engineering",
      currentBusiness: "produce aggregation cooperative",
      interestedDomains: ["agritech", "cold chain", "climate"],
      preferredMarkets: ["Kenya", "Africa"],
    });

    const daily = buildDailyRecommendation(SEED_IDEAS, p, dayKey());
    expect(daily).not.toBeNull();
    expect(daily!.idea.slug).toBe("farmstack-coldchain");
    expect(daily!.match.score).toBeGreaterThan(50);
    expect(daily!.match.matched.some((m) => m.dimension === "Skills")).toBe(true);
    for (const gap of daily!.match.gaps) {
      expect(gap.closeGap).toBeTruthy();
      expect(gap.detail).toBeTruthy();
    }
  });

  it("is stable for the same day", () => {
    const p = profile({
      skills: ["AI", "product"],
      major: "CS",
      currentBusiness: "SaaS",
      interestedDomains: ["martech", "ads"],
      preferredMarkets: ["Canada"],
    });
    const a = buildDailyRecommendation(SEED_IDEAS, p, "2026-10-09");
    const b = buildDailyRecommendation(SEED_IDEAS, p, "2026-10-09");
    expect(a?.idea.slug).toBe(b?.idea.slug);
    expect(a?.match.score).toBe(b?.match.score);
  });
});
