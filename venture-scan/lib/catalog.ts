import { SEED_IDEAS } from "./seed-ideas";
import type { StartupIdea } from "./types";

/** Catalog used for static export and as a DB-free fallback. */
export function catalogIdeas(): StartupIdea[] {
  return SEED_IDEAS.map((idea) => ({ ...idea }));
}

export function catalogBySlug(slug: string): StartupIdea | undefined {
  return catalogIdeas().find((i) => i.slug === slug);
}

export function catalogMeta(): {
  industries: string[];
  sectors: string[];
  countries: string[];
} {
  const ideas = catalogIdeas();
  const uniq = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b));
  return {
    industries: uniq(ideas.map((i) => i.industry)),
    sectors: uniq(ideas.map((i) => i.sector)),
    countries: uniq(ideas.map((i) => i.teamCountry)),
  };
}
