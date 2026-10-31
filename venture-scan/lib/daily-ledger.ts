import ledgerJson from "../public/data/daily-ledger.json";
import { isActiveIdea } from "./archived-ideas";
import { DAILY_SCAN_TIMEZONE_IANA } from "./daily-scan";
import type { DailyHeadline } from "./rss-headlines";
import { rankByFundingSecured } from "./rank-ideas";
import type { StartupIdea } from "./types";

export type DailyLedgerFile = {
  day: string;
  scannedAt: string;
  timezone: string;
  todaySlugs: string[];
  headlineCount: number;
  feedsOk: number;
  feedsTotal: number;
  matchedIdeaCount: number;
  headlines: DailyHeadline[];
};

const FALLBACK = ledgerJson as DailyLedgerFile;

export function readDailyLedger(): DailyLedgerFile {
  return {
    day: FALLBACK.day ?? "",
    scannedAt: FALLBACK.scannedAt ?? "",
    timezone: FALLBACK.timezone ?? DAILY_SCAN_TIMEZONE_IANA,
    todaySlugs: Array.isArray(FALLBACK.todaySlugs) ? FALLBACK.todaySlugs : [],
    headlineCount: FALLBACK.headlineCount ?? 0,
    feedsOk: FALLBACK.feedsOk ?? 0,
    feedsTotal: FALLBACK.feedsTotal ?? 0,
    matchedIdeaCount: FALLBACK.matchedIdeaCount ?? 0,
    headlines: Array.isArray(FALLBACK.headlines) ? FALLBACK.headlines : [],
  };
}

/** Calendar day in the daily-scan zone, e.g. 2026-10-31. */
export function scanDayKey(now = new Date(), timeZone = DAILY_SCAN_TIMEZONE_IANA): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function daySeed(day: string): number {
  let h = 2166136261;
  for (let i = 0; i < day.length; i++) {
    h ^= day.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], seed: number): T[] {
  const rand = mulberry32(seed);
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Target size for the homepage / Ideas "today" cohort — varies by calendar day. */
export function todayCohortTarget(day: string): number {
  const seed = daySeed(day);
  return 16 + (seed % 13); // 16–28
}

/**
 * Build today's live cohort: news-matched active ideas first, then a
 * date-seeded fill so the set (and count) changes every scan day.
 */
export function buildTodayCohort(
  ideas: StartupIdea[],
  headlines: DailyHeadline[],
  day = scanDayKey(),
): string[] {
  const active = rankByFundingSecured(ideas.filter(isActiveIdea));
  const bySlug = new Map(active.map((i) => [i.slug, i]));
  const matched = new Set<string>();
  for (const h of headlines) {
    for (const slug of h.matchedSlugs) {
      if (bySlug.has(slug)) matched.add(slug);
    }
  }

  const target = todayCohortTarget(day);
  const prioritized = [...matched];
  const remainder = shuffle(
    active.map((i) => i.slug).filter((s) => !matched.has(s)),
    daySeed(day),
  );
  const slugs = [...prioritized, ...remainder].slice(0, Math.min(target, active.length));
  return slugs;
}

/** Resolve today's ideas from the published daily ledger (fallback: all active). */
export function resolveTodaysIdeas(ideas: StartupIdea[]): StartupIdea[] {
  const ledger = readDailyLedger();
  const active = ideas.filter(isActiveIdea);
  if (!ledger.todaySlugs.length) return rankByFundingSecured(active);

  const bySlug = new Map(ideas.map((i) => [i.slug, i]));
  const picked: StartupIdea[] = [];
  for (const slug of ledger.todaySlugs) {
    const idea = bySlug.get(slug);
    if (idea && isActiveIdea(idea)) picked.push(idea);
  }
  return picked.length ? picked : rankByFundingSecured(active);
}
