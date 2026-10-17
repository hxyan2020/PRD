/** Canonical early → late order for fundraising round filters. */
export const FUNDING_STAGE_ORDER = [
  "Pre-seed",
  "Seed",
  "Series A",
  "Series A+",
  "Series B",
  "Series C",
  "Series D",
  "Series E",
  "Series F",
  "Series I",
  "Series I+",
  "Late stage",
  "Public",
  "Acquired",
  "Bootstrapped",
] as const;

export type KnownFundingStage = (typeof FUNDING_STAGE_ORDER)[number];

const ORDER_INDEX = new Map<string, number>(
  FUNDING_STAGE_ORDER.map((stage, i) => [stage, i]),
);

export function sortFundingStages(stages: string[]): string[] {
  return [...stages].sort((a, b) => {
    const ai = ORDER_INDEX.get(a);
    const bi = ORDER_INDEX.get(b);
    if (ai != null && bi != null) return ai - bi;
    if (ai != null) return -1;
    if (bi != null) return 1;
    return a.localeCompare(b);
  });
}

export function collectFundingStages(
  ideas: Array<{ fundingStage?: string | null }>,
): string[] {
  const set = new Set<string>();
  for (const idea of ideas) {
    if (idea.fundingStage) set.add(idea.fundingStage);
  }
  return sortFundingStages([...set]);
}

export type FundingStageIconId =
  | "all"
  | "preseed"
  | "seed"
  | "series"
  | "late"
  | "public"
  | "acquired"
  | "bootstrapped"
  | "generic";

export function fundingStageIconId(stage: string): FundingStageIconId {
  if (!stage) return "all";
  if (stage === "Pre-seed") return "preseed";
  if (stage === "Seed") return "seed";
  if (stage === "Late stage") return "late";
  if (stage === "Public") return "public";
  if (stage === "Acquired") return "acquired";
  if (stage === "Bootstrapped") return "bootstrapped";
  if (/^Series\b/i.test(stage)) return "series";
  return "generic";
}
