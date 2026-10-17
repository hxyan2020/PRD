import { isStaticMode } from "./base-path";
import { catalogIdeas, catalogMeta } from "./catalog";
import { distinctValues, getIdeaBySlug, listIdeas } from "./db";
import { ensureSeeded } from "./scanner";
import type { StartupIdea } from "./types";

export type IdeasPageData = {
  ideas: StartupIdea[];
  meta: {
    industries: string[];
    sectors: string[];
    countries: string[];
  };
};

/** Load all sourced ideas from SQLite (Node) or the compiled catalog (static). */
export function loadIdeasForPage(): IdeasPageData {
  if (isStaticMode()) {
    return { ideas: catalogIdeas(), meta: catalogMeta() };
  }
  try {
    ensureSeeded();
    return {
      ideas: listIdeas(),
      meta: {
        industries: distinctValues("industry"),
        sectors: distinctValues("sector"),
        countries: distinctValues("team_country"),
      },
    };
  } catch {
    return { ideas: catalogIdeas(), meta: catalogMeta() };
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
