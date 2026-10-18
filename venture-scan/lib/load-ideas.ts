import { isStaticMode } from "./base-path";
import { catalogIdeas, catalogMeta } from "./catalog";
import { distinctValues, getIdeaBySlug, listIdeas } from "./db";
import { collectFundingStages } from "./funding-stages";
import { ensureSeeded } from "./scanner";
import type { StartupIdea } from "./types";

export type IdeasPageData = {
  ideas: StartupIdea[];
  meta: {
    industries: string[];
    sectors: string[];
    countries: string[];
    fundingRounds: string[];
  };
};

/** Load all sourced ideas from SQLite (Node) or the compiled catalog (static). */
export function loadIdeasForPage(): IdeasPageData {
  if (isStaticMode()) {
    return { ideas: catalogIdeas(), meta: catalogMeta({ includeArchived: true }) };
  }
  try {
    ensureSeeded();
    const ideas = listIdeas();
    return {
      ideas,
      meta: {
        industries: distinctValues("industry"),
        sectors: distinctValues("sector"),
        countries: distinctValues("team_country"),
        fundingRounds: collectFundingStages(ideas),
      },
    };
  } catch {
    return { ideas: catalogIdeas(), meta: catalogMeta({ includeArchived: true }) };
  }
}

export function loadIdeaForPage(slug: string): StartupIdea | undefined {
  if (isStaticMode()) {
    return catalogIdeas().find((i) => i.slug === slug);
  }
  try {
    ensureSeeded();
    return getIdeaBySlug(slug) ?? catalogIdeas().find((i) => i.slug === slug);
  } catch {
    return catalogIdeas().find((i) => i.slug === slug);
  }
}
