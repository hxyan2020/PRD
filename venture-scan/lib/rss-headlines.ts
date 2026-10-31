/**
 * Pull funding / startup headlines from registered desk RSS feeds and match
 * them to catalog ideas. Used by the daily scan so "refresh" is more than a
 * timestamp bump on a frozen catalog.
 */
import type { StartupIdea } from "./types";

export type RssFeed = { sourceId: string; feed: string };

export type DailyHeadline = {
  id: string;
  sourceId: string;
  title: string;
  url: string;
  excerpt: string;
  publishedAt: string | null;
  matchedSlugs: string[];
};

/** Core fundraising / startup wires with public RSS. */
export const DAILY_SIGNAL_FEEDS: RssFeed[] = [
  { sourceId: "techcrunch", feed: "https://techcrunch.com/feed/" },
  { sourceId: "crunchbase-news", feed: "https://news.crunchbase.com/feed/" },
  { sourceId: "sifted", feed: "https://sifted.eu/feed" },
  { sourceId: "eu-startups", feed: "https://www.eu-startups.com/feed/" },
  { sourceId: "techinasia", feed: "https://www.techinasia.com/feed" },
  { sourceId: "yourstory", feed: "https://yourstory.com/feed" },
  { sourceId: "inc42", feed: "https://inc42.com/feed/" },
  { sourceId: "venturebeat", feed: "https://venturebeat.com/feed/" },
];

const UA =
  "Mozilla/5.0 (compatible; VentureScanDailyBot/1.0; +https://hxyan2020.github.io/PRD/venture-scan/)";

const FUNDING_HINT =
  /\b(fund|funding|raises?|raised|series\s+[a-g]|seed|pre-seed|venture|startup|start-up|fintech|saas|round|invests?|investment|acquires?|acquisition|ipo|valuation)\b/i;

export async function fetchFeedXml(url: string): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "user-agent": UA,
        accept: "application/rss+xml,application/atom+xml,application/xml,text/xml,*/*",
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function decodeXml(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tagValue(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(re);
  return m ? decodeXml(m[1]) : "";
}

function linkValue(block: string): string {
  const tagged = tagValue(block, "link");
  if (tagged.startsWith("http")) return tagged;
  const href = block.match(/<link[^>]+href=["']([^"']+)["']/i);
  return href?.[1]?.trim() ?? tagged;
}

/** Parse RSS / Atom items from a feed document. */
export function parseFeedItems(
  xml: string,
  sourceId: string,
): Omit<DailyHeadline, "id" | "matchedSlugs">[] {
  const chunks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ??
    xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) ??
    [];
  const out: Omit<DailyHeadline, "id" | "matchedSlugs">[] = [];
  for (const chunk of chunks) {
    const title = tagValue(chunk, "title");
    const url = linkValue(chunk);
    if (!title || !url.startsWith("http")) continue;
    const excerpt =
      tagValue(chunk, "description") ||
      tagValue(chunk, "summary") ||
      tagValue(chunk, "content") ||
      "";
    const publishedAt =
      tagValue(chunk, "pubDate") ||
      tagValue(chunk, "published") ||
      tagValue(chunk, "updated") ||
      null;
    out.push({
      sourceId,
      title,
      url,
      excerpt: excerpt.slice(0, 280),
      publishedAt,
    });
  }
  return out;
}

const COMMON_NAME_TOKENS = new Set([
  "stack",
  "finance",
  "credit",
  "health",
  "energy",
  "carbon",
  "cloud",
  "data",
  "platform",
  "global",
  "group",
  "labs",
  "systems",
  "software",
  "security",
  "payments",
  "banking",
  "capital",
  "ventures",
  "startup",
  "startups",
  "company",
  "companies",
  "product",
  "analytics",
  "graph",
  "market",
  "marketplace",
  "shift",
  "os",
  "crm",
  "ai",
]);

function hasToken(hay: string, token: string): boolean {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, "i").test(hay);
}

/**
 * Match a headline to catalog ideas.
 * Uses the full display name or the brand-like slug prefix (e.g. brex-finance → brex),
 * never generic product-description tokens like "startup" / "climate" / "battery".
 */
export function matchHeadlineToIdeas(
  title: string,
  excerpt: string,
  ideas: StartupIdea[],
): string[] {
  const hay = `${title} ${excerpt}`.toLowerCase();
  const hits: string[] = [];
  for (const idea of ideas) {
    const name = idea.name.trim().toLowerCase();
    if (name.length >= 4 && hasToken(hay, name)) {
      hits.push(idea.slug);
      continue;
    }
    const brand = idea.slug.split("-")[0]?.toLowerCase() ?? "";
    if (brand.length >= 4 && !COMMON_NAME_TOKENS.has(brand) && hasToken(hay, brand)) {
      hits.push(idea.slug);
    }
  }
  return hits;
}

export async function collectDailyHeadlines(
  ideas: StartupIdea[],
  feeds: RssFeed[] = DAILY_SIGNAL_FEEDS,
  limit = 40,
): Promise<{ headlines: DailyHeadline[]; feedsOk: number; feedsTotal: number }> {
  const active = ideas.filter((i) => (i.status ?? "active") === "active");
  const seen = new Set<string>();
  const headlines: DailyHeadline[] = [];
  let feedsOk = 0;

  for (const feed of feeds) {
    const xml = await fetchFeedXml(feed.feed);
    if (!xml) continue;
    feedsOk += 1;
    const items = parseFeedItems(xml, feed.sourceId);
    for (const item of items) {
      if (!FUNDING_HINT.test(`${item.title} ${item.excerpt}`)) continue;
      const key = item.url.replace(/\/$/, "").toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const matchedSlugs = matchHeadlineToIdeas(item.title, item.excerpt, active);
      headlines.push({
        id: `${feed.sourceId}-${headlines.length}`,
        ...item,
        matchedSlugs,
      });
      if (headlines.length >= limit) {
        return { headlines, feedsOk, feedsTotal: feeds.length };
      }
    }
  }

  return { headlines, feedsOk, feedsTotal: feeds.length };
}
