import { strategyMessageKey } from "../format";
import type { GapPoint, IdeaMatch, MatchBreakdown, MatchPoint, StartupIdea, UserProfile } from "../types";
import type { LocaleCode } from "./locales";
import { localizeCountry } from "./localize-source";
import type { MessageKey } from "./messages";

const MATCH_THRESHOLD = 0.55;

export type MatchDimension =
  | "skills"
  | "major"
  | "currentBusiness"
  | "interestedDomains"
  | "preferredMarkets";

const DIMENSIONS: MatchDimension[] = [
  "skills",
  "major",
  "currentBusiness",
  "interestedDomains",
  "preferredMarkets",
];

type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

/** Stable English labels used in stored matches / tests. */
export const MATCH_DIMENSION_LABELS: Record<MatchDimension, string> = {
  skills: "Skills",
  major: "Major / background",
  currentBusiness: "Current business",
  interestedDomains: "Interested domains",
  preferredMarkets: "Preferred markets",
};

const DIMENSION_MESSAGE: Record<MatchDimension, MessageKey> = {
  skills: "match.dim.skills",
  major: "match.dim.major",
  currentBusiness: "match.dim.currentBusiness",
  interestedDomains: "match.dim.interestedDomains",
  preferredMarkets: "match.dim.preferredMarkets",
};

/** Map stored English dimension labels (or keys) → MatchDimension. */
export function resolveMatchDimension(dimension: string): MatchDimension | null {
  const lower = dimension.toLowerCase();
  if (lower === "skills" || dimension === MATCH_DIMENSION_LABELS.skills) return "skills";
  if (lower === "major" || dimension === MATCH_DIMENSION_LABELS.major) return "major";
  if (
    lower === "currentbusiness" ||
    lower === "current_business" ||
    dimension === MATCH_DIMENSION_LABELS.currentBusiness
  ) {
    return "currentBusiness";
  }
  if (
    lower === "interesteddomains" ||
    lower === "interested_domains" ||
    dimension === MATCH_DIMENSION_LABELS.interestedDomains
  ) {
    return "interestedDomains";
  }
  if (
    lower === "preferredmarkets" ||
    lower === "preferred_markets" ||
    dimension === MATCH_DIMENSION_LABELS.preferredMarkets
  ) {
    return "preferredMarkets";
  }
  return null;
}

/**
 * Rebuild match / gap copy for the active locale using the numeric breakdown
 * (so Today / Collection UI never shows English templates).
 */
export function presentMatch(
  match: IdeaMatch,
  idea: StartupIdea,
  profile: UserProfile,
  t: Translate,
  locale: LocaleCode = "en",
): IdeaMatch {
  const matched: MatchPoint[] = [];
  const gaps: GapPoint[] = [];
  const strategy = t(strategyMessageKey(idea.goForward.strategy));

  for (const dim of DIMENSIONS) {
    const score = match.breakdown[dim as keyof MatchBreakdown];
    const label = t(DIMENSION_MESSAGE[dim]);
    const expl = explanationFor(dim, idea, profile, strategy, t, locale);
    if (score >= MATCH_THRESHOLD) {
      matched.push({ dimension: label, detail: expl.hit });
    } else {
      gaps.push({ dimension: label, detail: expl.gap, closeGap: expl.close });
    }
  }

  return { ...match, matched, gaps };
}

function explanationFor(
  dim: MatchDimension,
  idea: StartupIdea,
  profile: UserProfile,
  strategy: string,
  t: Translate,
  locale: LocaleCode,
): { hit: string; gap: string; close: string } {
  const skills = profile.skills.join(", ");
  const domains = profile.interestedDomains.join(", ");
  const markets = (profile.preferredMarkets ?? [])
    .map((m) => localizeCountry(m, locale))
    .join(", ");
  const market0 = profile.preferredMarkets?.[0]
    ? localizeCountry(profile.preferredMarkets[0], locale)
    : "";
  const country = localizeCountry(idea.teamCountry, locale);

  switch (dim) {
    case "skills":
      return profile.skills.length
        ? {
            hit: t("match.explain.skills.hit", { skills, name: idea.name }),
            gap: t("match.explain.skills.gap", {
              industry: idea.industry,
              sector: idea.sector,
            }),
            close: t("match.explain.skills.close", { sector: idea.sector }),
          }
        : {
            hit: t("match.explain.skills.hitEmpty"),
            gap: t("match.explain.skills.gapEmpty"),
            close: t("match.explain.skills.closeEmpty"),
          };
    case "major":
      return profile.major
        ? {
            hit: t("match.explain.major.hit", {
              major: profile.major,
              industry: idea.industry,
            }),
            gap: t("match.explain.major.gap", {
              major: profile.major,
              industry: idea.industry,
            }),
            close: t("match.explain.major.close", {
              major: profile.major,
              sector: idea.sector,
            }),
          }
        : {
            hit: t("match.explain.major.hitEmpty"),
            gap: t("match.explain.major.gapEmpty"),
            close: t("match.explain.major.closeEmpty"),
          };
    case "currentBusiness":
      return profile.currentBusiness
        ? {
            hit: t("match.explain.business.hit", {
              business: profile.currentBusiness,
            }),
            gap: t("match.explain.business.gap", {
              business: profile.currentBusiness,
              name: idea.name,
            }),
            close: t("match.explain.business.close", {
              strategy,
              summary: idea.goForward.summary,
            }),
          }
        : {
            hit: t("match.explain.business.hitEmpty"),
            gap: t("match.explain.business.gapEmpty"),
            close: t("match.explain.business.closeEmpty"),
          };
    case "interestedDomains":
      return profile.interestedDomains.length
        ? {
            hit: t("match.explain.domains.hit", {
              domains,
              sector: idea.sector,
            }),
            gap: t("match.explain.domains.gap", {
              domains,
              industry: idea.industry,
              sector: idea.sector,
            }),
            close: t("match.explain.domains.close", {
              sector: idea.sector,
              industry: idea.industry,
            }),
          }
        : {
            hit: t("match.explain.domains.hitEmpty"),
            gap: t("match.explain.domains.gapEmpty"),
            close: t("match.explain.domains.closeEmpty"),
          };
    case "preferredMarkets":
      return (profile.preferredMarkets ?? []).length
        ? {
            hit: t("match.explain.markets.hit", {
              markets,
              country,
            }),
            gap: t("match.explain.markets.gap", {
              markets,
              country,
            }),
            close: t("match.explain.markets.close", {
              market: market0,
              strategy,
            }),
          }
        : {
            hit: t("match.explain.markets.hitEmpty"),
            gap: t("match.explain.markets.gapEmpty"),
            close: t("match.explain.markets.closeEmpty"),
          };
  }
}
