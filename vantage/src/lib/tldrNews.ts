import { storyDeskScore, type RankContext } from "./rankNews";
import type { NewsCategory, NewsItem, Sector } from "./types";

export const TLDR_SECTORS: Sector[] = ["banks", "brokers", "crypto"];
export const TLDR_CATEGORIES: NewsCategory[] = [
  "listing",
  "product",
  "regulation",
  "risk_tools",
];

export type TldrGrid = Record<Sector, Record<NewsCategory, NewsItem[]>>;

export function storyAnchorId(id: string): string {
  return `story-${id}`;
}

export function tldrStoryScore(item: NewsItem, context: RankContext = {}): number {
  const reports = item.sources.length;
  return storyDeskScore(item, context) + Math.min(reports, 8) * 12;
}

function domainAffinity(
  item: NewsItem,
  sector: Sector,
  entities: RankContext["entities"],
): number {
  let score = item.sectors.length === 1 ? 8 : 0;
  if (!entities?.length) return score;
  const byId = new Map(entities.map((entity) => [entity.id, entity]));
  let matched = 0;
  for (const id of item.entities) {
    if (byId.get(id)?.sector === sector) matched += 1;
  }
  if (matched) score += 22 + matched * 8;
  return score;
}

export function tldrCellScore(
  item: NewsItem,
  sector: Sector,
  context: RankContext = {},
): number {
  return tldrStoryScore(item, context) + domainAffinity(item, sector, context.entities);
}

export function pickTldrStories(
  items: NewsItem[],
  sector: Sector,
  category: NewsCategory,
  context: RankContext = {},
  limit = 3,
): NewsItem[] {
  return items
    .filter((item) => item.category === category && item.sectors.includes(sector))
    .sort((left, right) => {
      const diff = tldrCellScore(right, sector, context) - tldrCellScore(left, sector, context);
      if (diff !== 0) return diff;
      if (right.sources.length !== left.sources.length) {
        return right.sources.length - left.sources.length;
      }
      return +new Date(right.publishedAt) - +new Date(left.publishedAt);
    })
    .slice(0, limit);
}

export function buildDailyTldr(items: NewsItem[], context: RankContext = {}): TldrGrid {
  const grid = {} as TldrGrid;
  for (const sector of TLDR_SECTORS) {
    grid[sector] = {
      listing: [],
      product: [],
      regulation: [],
      risk_tools: [],
    };
    for (const category of TLDR_CATEGORIES) {
      grid[sector][category] = pickTldrStories(items, sector, category, context);
    }
  }
  return grid;
}
