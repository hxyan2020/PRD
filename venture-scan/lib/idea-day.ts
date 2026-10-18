import { isActiveIdea, isArchivedIdea, partitionIdeas } from "./archived-ideas";
import { rankByFundingSecured } from "./rank-ideas";
import type { StartupIdea } from "./types";

/** Live scan ideas shown as "today" on the homepage and ideas ledger. */
export function todaysIdeas(ideas: StartupIdea[]): StartupIdea[] {
  return rankByFundingSecured(ideas.filter(isActiveIdea));
}

/**
 * Historical / prior-day catalog — archived entries retained for search.
 * Anchored as `#yesterday` on the ideas page.
 */
export function yesterdaysIdeas(ideas: StartupIdea[]): StartupIdea[] {
  return rankByFundingSecured(ideas.filter(isArchivedIdea));
}

export function splitIdeasByDay(ideas: StartupIdea[]): {
  today: StartupIdea[];
  yesterday: StartupIdea[];
} {
  const { active, archived } = partitionIdeas(ideas);
  return {
    today: rankByFundingSecured(active),
    yesterday: rankByFundingSecured(archived),
  };
}

/** Ideas-page hash for the historical list. */
export const YESTERDAY_HASH = "yesterday";
export const TODAY_HASH = "todays-ideas";
