import { ARCHIVED_IDEAS, isActiveIdea } from "./archived-ideas";
import { collectFundingStages } from "./funding-stages";
import { SEED_IDEAS } from "./seed-ideas";
import type { StartupIdea } from "./types";

/** Active (live scan) ideas only. */
export function catalogActiveIdeas(): StartupIdea[] {
  return SEED_IDEAS.map((idea) => ({ ...idea, status: idea.status ?? "active" }));
}

/** Historical ideas retained for search and dossier deep-links. */
export function catalogArchivedIdeas(): StartupIdea[] {
  return ARCHIVED_IDEAS.map((idea) => ({ ...idea }));
}

/** Full catalog: active first, then archived. Used for static export + DB seed. */
export function catalogIdeas(): StartupIdea[] {
  return [...catalogActiveIdeas(), ...catalogArchivedIdeas()];
}

export function catalogBySlug(slug: string): StartupIdea | undefined {
  return catalogIdeas().find((i) => i.slug === slug);
}

export function catalogMeta(options: { includeArchived?: boolean } = {}): {
  industries: string[];
  sectors: string[];
  countries: string[];
  fundingRounds: string[];
} {
  const ideas = options.includeArchived
    ? catalogIdeas()
    : catalogIdeas().filter(isActiveIdea);
  const uniq = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b));
  return {
    industries: uniq(ideas.map((i) => i.industry)),
    sectors: uniq(ideas.map((i) => i.sector)),
    countries: uniq(ideas.map((i) => i.teamCountry)),
    fundingRounds: collectFundingStages(ideas),
  };
}
