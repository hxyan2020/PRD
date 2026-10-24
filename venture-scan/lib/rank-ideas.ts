import type { IdeaMatch, StartupIdea } from "./types";

/** Rank by profile match score (highest first). */
export function rankByMatchScore(
  ideas: StartupIdea[],
  matches: Record<string, IdeaMatch>,
): StartupIdea[] {
  return [...ideas].sort(
    (a, b) => (matches[b.slug]?.score ?? -1) - (matches[a.slug]?.score ?? -1),
  );
}

/**
 * Rank by fundraising secured: funded first, then highest amount,
 * then name for stable ordering.
 */
export function rankByFundingSecured(ideas: StartupIdea[]): StartupIdea[] {
  return [...ideas].sort((a, b) => {
    const funded = Number(b.fundraisingSecured) - Number(a.fundraisingSecured);
    if (funded !== 0) return funded;
    const amount = (b.fundingAmountUsd ?? -1) - (a.fundingAmountUsd ?? -1);
    if (amount !== 0) return amount;
    return a.name.localeCompare(b.name);
  });
}
