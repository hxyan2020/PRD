import { describe, expect, it } from "vitest";
import { FEATURED_SEED_IDEAS, SEED_IDEAS } from "./seed-ideas";
import { rankByFundingSecured, rankByMatchScore } from "./rank-ideas";
import type { IdeaMatch } from "./types";

describe("rank ideas", () => {
  it("exposes a scan catalog far larger than the featured 20 dossiers", () => {
    expect(FEATURED_SEED_IDEAS).toHaveLength(20);
    expect(SEED_IDEAS.length).toBeGreaterThan(60);
  });

  it("ranks by fundraising secured then amount when no profile", () => {
    const ranked = rankByFundingSecured(SEED_IDEAS);
    expect(ranked[0].fundraisingSecured).toBe(true);
    for (let i = 1; i < ranked.length; i++) {
      const prev = ranked[i - 1];
      const cur = ranked[i];
      if (prev.fundraisingSecured === cur.fundraisingSecured) {
        expect(prev.fundingAmountUsd ?? -1).toBeGreaterThanOrEqual(cur.fundingAmountUsd ?? -1);
      } else {
        expect(Number(prev.fundraisingSecured)).toBeGreaterThanOrEqual(
          Number(cur.fundraisingSecured),
        );
      }
    }
  });

  it("ranks by match score when profile matches exist", () => {
    const ideas = FEATURED_SEED_IDEAS.slice(0, 3);
    const emptyBreakdown = {
      skills: 0,
      major: 0,
      currentBusiness: 0,
      interestedDomains: 0,
      preferredMarkets: 0,
    };
    const matches: Record<string, IdeaMatch> = {
      [ideas[0].slug]: {
        ideaId: ideas[0].id,
        slug: ideas[0].slug,
        score: 40,
        breakdown: emptyBreakdown,
        matched: [],
        gaps: [],
      },
      [ideas[1].slug]: {
        ideaId: ideas[1].id,
        slug: ideas[1].slug,
        score: 90,
        breakdown: emptyBreakdown,
        matched: [],
        gaps: [],
      },
      [ideas[2].slug]: {
        ideaId: ideas[2].id,
        slug: ideas[2].slug,
        score: 70,
        breakdown: emptyBreakdown,
        matched: [],
        gaps: [],
      },
    };
    const ranked = rankByMatchScore(ideas, matches);
    expect(ranked.map((i) => i.slug)).toEqual([
      ideas[1].slug,
      ideas[2].slug,
      ideas[0].slug,
    ]);
  });
});
