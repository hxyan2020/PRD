import type { Entity, NewsItem, SourceKind, SourceStatus } from "./types";

const HIGH_IMPACT =
  /\b(enforcement|consent order|fine|penalty|sanction|ban|suspend|license|authoris|listing|lists|delist|launch(?:es|ed|ing)?|custody|capital rule|rulemaking|mica|clarity act|genius act|etf|stablecoin|usdc|usdt|perpetual|prime brokerage|order type|tokeni[sz]|aml|kyc|surveillance|hack|outage|exploit|acquisition|merger|volume|onboard|go-live|mainnet)\b/i;

const DESK_TOPIC =
  /\b(bank|broker|exchange|crypto|digital asset|trading|clearing|custody|listing|regulation|sec\b|cftc|fca|esma|mas|sfc|etf|stablecoin|perpetual|margin|surveillance|risk tool|compliance)\b/i;

const NOISE =
  /\b(e-?mail alert|daybook|newsletter|morning minute|anonymous \(not verified\)|meet analyst|investor day)\b/i;

const OFF_DESK =
  /\b(tesla|\btsla\b|humanoid|robotics|corn\b|hog\b|wheat\b|cotton\b|soybean|cattle|pork belly|ginkgo|tunelab|semiconductor bull|chip sector)\b/i;

const MARKET_CHATTER =
  /\b(price target|stock is|stocks settle|outflow alert|upside potential|reiterated by|moves to the front of|opinions on market outlook)\b/i;

const MAJOR_JURISDICTIONS = new Set([
  "United States",
  "European Union",
  "United Kingdom",
  "China",
  "Hong Kong",
  "Singapore",
  "Japan",
]);

const KIND_SCORE: Record<SourceKind, number> = {
  regulator: 16,
  official_entity: 14,
  vendor: 10,
  industry_news: 8,
  aggregator: 2,
};

export interface RankContext {
  entities?: Entity[];
  sources?: Array<Pick<SourceStatus, "id" | "kind">>;
}

function storyText(item: NewsItem): string {
  return `${item.caption} ${item.keyPoints.join(" ")}`;
}

function entityScore(item: NewsItem, entities: Entity[] | undefined): number {
  if (!entities?.length) {
    return item.entities.length ? 12 + Math.min(item.entities.length, 3) * 6 : -18;
  }
  const byId = new Map(entities.map((entity) => [entity.id, entity]));
  let score = 0;
  for (const id of item.entities) {
    const entity = byId.get(id);
    if (!entity) {
      score += 8;
      continue;
    }
    score += Math.max(4, 36 - entity.rank);
    if (entity.rank <= 10) score += 12;
    if (entity.rank <= 5) score += 8;
  }
  if (item.entities.length === 0) score -= 18;
  if (item.entities.length >= 2) score += 10;
  return score;
}

function sourceScore(item: NewsItem, sources: RankContext["sources"]): number {
  if (!item.sources.length) return 0;
  let score = Math.min(item.sources.length - 1, 5) * 8;
  if (!sources?.length) {
    if (item.sources.length >= 3) score += 12;
    return score;
  }
  const kinds = new Map(sources.map((source) => [source.id, source.kind]));
  let best = 0;
  for (const source of item.sources) {
    const kind = kinds.get(source.sourceId);
    if (kind) best = Math.max(best, KIND_SCORE[kind]);
  }
  return score + best;
}

export function storyDeskScore(item: NewsItem, context: RankContext = {}): number {
  const text = storyText(item);
  let score = entityScore(item, context.entities);
  score += sourceScore(item, context.sources);

  if (item.sectors.length >= 2) score += 8;
  if (item.sectors.length >= 3) score += 6;
  if (item.impact?.assets.length) score += 10 + Math.min(item.impact.assets.length, 3) * 4;
  else if (item.impact && HIGH_IMPACT.test(text)) score += 8;
  score += item.riskTools.length * 12;
  score += item.jurisdictions.filter((name) => MAJOR_JURISDICTIONS.has(name)).length * 3;

  if (HIGH_IMPACT.test(text)) score += 22;
  if (DESK_TOPIC.test(text)) score += 8;
  if (NOISE.test(text)) score -= 36;
  if (OFF_DESK.test(text)) score -= 40;
  if (MARKET_CHATTER.test(text)) score -= 24;
  if (!item.entities.length && !HIGH_IMPACT.test(text) && !item.riskTools.length) score -= 10;

  return score;
}

export function rankDeskNews(items: NewsItem[], context: RankContext = {}): NewsItem[] {
  return [...items].sort((left, right) => {
    const diff = storyDeskScore(right, context) - storyDeskScore(left, context);
    if (diff !== 0) return diff;
    return +new Date(right.publishedAt) - +new Date(left.publishedAt);
  });
}
