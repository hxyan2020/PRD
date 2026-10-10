import { DATA_SOURCES, type DataSource } from "./data-sources";
import type { StartupIdea } from "./types";

export type RelatedSourceIntent =
  | "funding"
  | "team"
  | "location"
  | "sources"
  | "overview"
  | "model"
  | "industry"
  | "go_forward"
  | "links";

/**
 * Score and return the data sources most relevant to an idea (by market,
 * ingest tag, and optional intent). Used by the dossier media gallery and Q&A citations.
 */
export function relatedSourcesForIdea(
  idea: StartupIdea,
  intent: RelatedSourceIntent = "overview",
  limit = 6,
): DataSource[] {
  const preferredKind: DataSource["kind"][] =
    intent === "funding"
      ? ["fundraising", "news", "aggregator"]
      : intent === "team" || intent === "location"
        ? ["news", "registry", "community"]
        : intent === "sources"
          ? ["news", "fundraising", "aggregator", "government"]
          : ["news", "fundraising", "aggregator", "community"];

  const scored = DATA_SOURCES.map((source) => {
    let score = 0;
    if (source.countries.includes(idea.teamCountry)) score += 5;
    if (preferredKind.includes(source.kind)) score += 3;
    if (source.region.toLowerCase().includes("global")) score += 1;

    const tag = idea.source.toLowerCase();
    if (tag.includes("africa") && /africa|west africa/i.test(source.region)) score += 2;
    if (tag.includes("eu") && /europe|dach|nordic/i.test(source.region)) score += 2;
    if (tag.includes("india") && /india|south asia/i.test(source.region)) score += 2;
    if (tag.includes("latam") && /latin|southern cone|brazil/i.test(source.region)) score += 2;
    if (tag.includes("mena") && /mena/i.test(source.region)) score += 2;
    if (tag.includes("jp") && /asia|korea|japan/i.test(source.region)) score += 2;
    if (tag.includes("kr") && /korea/i.test(source.region)) score += 2;
    if (tag.includes("sea") && /asia|vietnam|oceania/i.test(source.region)) score += 2;
    if (tag.includes("oceania") && /oceania/i.test(source.region)) score += 2;
    if (tag.includes("nordic") && /nordic/i.test(source.region)) score += 2;
    if (tag.includes("fr") && /francophone|europe/i.test(source.region)) score += 2;
    if (tag.includes("mx") && /latin/i.test(source.region)) score += 2;
    if (tag.includes("za") && /africa/i.test(source.region)) score += 2;
    if (tag.includes("vn") && /vietnam|asia/i.test(source.region)) score += 2;
    if (tag.includes("il") && /israel/i.test(source.region)) score += 2;
    if (tag.includes("apac") && /asia|global/i.test(source.region)) score += 2;
    if (tag.includes("na") && /north america|global/i.test(source.region)) score += 2;
    if (tag.includes("uk") && /europe|global/i.test(source.region)) score += 2;
    if (tag.includes("us") && /north america|global/i.test(source.region)) score += 2;

    return { source, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || b.source.lastSourcedAt.localeCompare(a.source.lastSourcedAt),
    )
    .slice(0, limit)
    .map((s) => s.source);
}
