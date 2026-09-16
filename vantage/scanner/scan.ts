import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import Parser from "rss-parser";
import {
  classifyCategory,
  inferImpact,
  inferJurisdictions,
  inferSectors,
  matchEntities,
  matchRiskTools,
} from "../src/lib/classify";
import { keyPoints, normalizeTitle, storyKey, stripHtml } from "../src/lib/extract";
import type {
  Briefing,
  DataSource,
  Entity,
  NewsItem,
  RiskTool,
  SourceHealth,
  SourceStatus,
} from "../src/lib/types";
import { parseLooseDate } from "../src/lib/dates";
import {
  looksLikeHtml,
  parseFeedItemDate,
  sanitizeFeedXml,
} from "../src/lib/feedParse";
import { computeScanWindow, inWindow, previousFridayScan } from "../src/lib/window";
import { clusterNewsItems } from "../src/lib/clusterNews";
import { repairNewsItems } from "../src/lib/repairNews";
import { attachChinese } from "./localize";

const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data");
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 VantageMarketIntelligence/1.0";
const ACCEPT =
  "application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.1";
const CONCURRENCY = 8;
const TIMEOUT_MS = 25_000;

const parser = new Parser({
  timeout: TIMEOUT_MS,
  headers: {
    "User-Agent": USER_AGENT,
    Accept: ACCEPT,
    "Accept-Language": "en-US,en;q=0.9",
  },
  customFields: {
    item: [
      ["dc:date", "dcDate"],
      ["updated", "updated"],
      ["published", "published"],
      ["date", "date"],
    ],
    feed: [["lastBuildDate", "lastBuildDate"]],
  },
});

interface RawItem {
  source: DataSource;
  title: string;
  link: string;
  summary: string;
  publishedAt: Date;
  fromFallback?: boolean;
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(path.join(DATA, file), "utf8")) as T;
}

async function loadPreviousBriefing(): Promise<Briefing | null> {
  try {
    return JSON.parse(await readFile(path.join(DATA, "latest.json"), "utf8")) as Briefing;
  } catch {
    return null;
  }
}

function parseDate(
  item: {
    isoDate?: string;
    pubDate?: string;
    dcDate?: string;
    updated?: string;
    published?: string;
    date?: string;
    link?: string;
    guid?: string;
    content?: string;
    contentSnippet?: string;
    summary?: string;
    title?: string;
  },
  lastBuildDate: Date | null,
): Date | null {
  return parseFeedItemDate(item, lastBuildDate);
}

async function fetchFeedUrl(
  url: string,
  timeoutMs: number,
): Promise<{ httpStatus: number; body: string; latencyMs: number }> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: ACCEPT,
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    const body = await response.text();
    return {
      httpStatus: response.status,
      body,
      latencyMs: Date.now() - started,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFeedUrlRetry(url: string) {
  try {
    return await fetchFeedUrl(url, TIMEOUT_MS);
  } catch (error) {
    const aborted =
      error instanceof Error && /abort/i.test(error.message || error.name);
    if (aborted) return fetchFeedUrl(url, TIMEOUT_MS + 12_000);
    throw error;
  }
}

async function parseFeedItems(
  source: DataSource,
  body: string,
): Promise<{ items: RawItem[]; error: string | null }> {
  if (looksLikeHtml(body)) {
    return { items: [], error: "Response was HTML, not RSS" };
  }

  const xml = sanitizeFeedXml(body);
  const feed = await parser.parseString(xml);
  const lastBuildDate =
    parseLooseDate(
      (feed as { lastBuildDate?: string }).lastBuildDate || feed.pubDate || "",
    ) ?? null;
  const items: RawItem[] = [];
  for (const entry of feed.items ?? []) {
    const publishedAt = parseDate(entry, lastBuildDate);
    if (!publishedAt) continue;
    const title = normalizeTitle(entry.title ?? "");
    const link = (entry.link || entry.guid || source.homepage).trim();
    if (!title || !link) continue;
    items.push({
      source,
      title,
      link,
      summary: stripHtml(entry.contentSnippet || entry.content || entry.summary || ""),
      publishedAt,
    });
  }

  return {
    items,
    error: items.length === 0 ? "Feed parsed but contained no dated items" : null,
  };
}

const RELEVANT =
  /\b(bank|broker|exchange|crypto|bitcoin|ethereum|sec\b|cftc|fca|esma|eba|ecb|mica|mifid|listing|listed|perpetual|etf|surveillance|aml|kyc|order type|trading|securities|stablecoin|finra|mas\b|sfc\b|hkma|csrc|pboc|jfsa|fintech|capital markets)\b/i;

const TRUSTED_NEWS = new Set([
  "coindesk",
  "cointelegraph",
  "theblock",
  "decrypt",
  "thedefiant",
  "finextra",
  "bankingdive",
]);

function isRelevant(
  raw: RawItem,
  entityIds: string[],
  category: NewsItem["category"],
): boolean {
  if (raw.fromFallback) {
    return entityIds.length > 0 || RELEVANT.test(`${raw.title} ${raw.summary}`);
  }
  if (
    raw.source.kind === "regulator" ||
    raw.source.kind === "official_entity" ||
    raw.source.kind === "vendor"
  ) {
    return true;
  }
  if (TRUSTED_NEWS.has(raw.source.id)) return true;
  if (entityIds.length) return true;
  if (category === "regulation" || category === "listing" || category === "risk_tools") {
    return RELEVANT.test(`${raw.title} ${raw.summary}`);
  }
  return RELEVANT.test(`${raw.title} ${raw.summary}`);
}

async function tryFeed(
  source: DataSource,
  url: string,
): Promise<{
  items: RawItem[];
  httpStatus: number | null;
  latencyMs: number;
  error: string | null;
  usedUrl: string;
}> {
  try {
    const fetched = await fetchFeedUrlRetry(url);
    if (fetched.httpStatus < 200 || fetched.httpStatus >= 300) {
      return {
        items: [],
        httpStatus: fetched.httpStatus,
        latencyMs: fetched.latencyMs,
        error: `HTTP ${fetched.httpStatus}`,
        usedUrl: url,
      };
    }
    const parsed = await parseFeedItems(source, fetched.body);
    return {
      items: parsed.items,
      httpStatus: fetched.httpStatus,
      latencyMs: fetched.latencyMs,
      error: parsed.error,
      usedUrl: url,
    };
  } catch (error) {
    return {
      items: [],
      httpStatus: null,
      latencyMs: 0,
      error: error instanceof Error ? error.message : String(error),
      usedUrl: url,
    };
  }
}

async function fetchSource(
  source: DataSource,
): Promise<{ status: SourceStatus; items: RawItem[] }> {
  const started = Date.now();
  const baseStatus: SourceStatus = {
    id: source.id,
    name: source.name,
    kind: source.kind,
    url: source.url,
    homepage: source.homepage,
    jurisdictions: source.jurisdictions,
    lastSourced: null,
    status: "down",
    httpStatus: null,
    latencyMs: null,
    itemsInWindow: 0,
    itemsFetched: 0,
    error: null,
  };

  try {
    let result = await tryFeed(source, source.url);
    let usedFallback = false;
    if (result.items.length === 0 && source.fallbackUrl) {
      const fallback = await tryFeed(source, source.fallbackUrl);
      if (fallback.items.length > 0) {
        result = fallback;
        usedFallback = true;
      } else {
        result = {
          ...result,
          error: `${result.error ?? "Primary feed failed"}; fallback: ${fallback.error}`,
        };
      }
    }
    if (usedFallback) {
      for (const item of result.items) item.fromFallback = true;
    }

    const health: SourceHealth =
      result.items.length > 0 ? "healthy" : result.httpStatus && result.httpStatus < 400
        ? "degraded"
        : "down";

    return {
      status: {
        ...baseStatus,
        url: result.usedUrl,
        lastSourced: new Date().toISOString(),
        status: health,
        httpStatus: result.httpStatus,
        latencyMs: result.latencyMs || Date.now() - started,
        itemsFetched: result.items.length,
        error: result.items.length === 0 ? result.error : null,
      },
      items: result.items,
    };
  } catch (error) {
    return {
      status: {
        ...baseStatus,
        lastSourced: new Date().toISOString(),
        latencyMs: Date.now() - started,
        status: "down",
        error: error instanceof Error ? error.message : String(error),
      },
      items: [],
    };
  }
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;
  async function run() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await worker(items[current]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

function toNewsItem(
  raw: RawItem,
  entities: Entity[],
  tools: RiskTool[],
): NewsItem {
  const text = `${raw.title} ${raw.summary}`;
  let category = classifyCategory(text, raw.source.categories);
  const entityIds = matchEntities(text, entities);
  const riskToolIds = matchRiskTools(text, tools);
  if (riskToolIds.length && category !== "regulation") {
    category = "risk_tools";
  }
  const sectors = inferSectors(text, entityIds, entities, raw.source.sectors);
  const jurisdictions = inferJurisdictions(text, raw.source.jurisdictions);

  return {
    id: createHash("sha1").update(`${raw.link}|${raw.title}`).digest("hex").slice(0, 16),
    caption: raw.title,
    captionZh: "",
    category,
    sectors,
    keyPoints: keyPoints(raw.title, raw.summary),
    keyPointsZh: [],
    sources: [
      { name: raw.source.name, url: raw.link, sourceId: raw.source.id },
    ],
    publishedAt: raw.publishedAt.toISOString(),
    entities: entityIds,
    jurisdictions,
    impact: inferImpact(text, category, sectors),
    riskTools: riskToolIds,
  };
}

function mergeItems(items: NewsItem[]): NewsItem[] {
  const byTitle = new Map<string, NewsItem>();
  for (const item of items) {
    const key = storyKey(item.caption, item.sources[0]?.url ?? item.id);
    const existing = byTitle.get(key);
    if (!existing) {
      byTitle.set(key, item);
      continue;
    }
    const sourceUrls = new Set(existing.sources.map((source) => source.url));
    for (const source of item.sources) {
      if (!sourceUrls.has(source.url)) existing.sources.push(source);
    }
    existing.entities = [...new Set([...existing.entities, ...item.entities])];
    existing.jurisdictions = [
      ...new Set([...existing.jurisdictions, ...item.jurisdictions]),
    ];
    existing.riskTools = [...new Set([...existing.riskTools, ...item.riskTools])];
    if (item.keyPoints.length > existing.keyPoints.length) {
      existing.keyPoints = item.keyPoints;
      existing.keyPointsZh = item.keyPointsZh;
    }
    if (!existing.captionZh && item.captionZh) existing.captionZh = item.captionZh;
  }
  return [...byTitle.values()].sort(
    (a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt),
  );
}

export async function runScan(now = new Date()): Promise<Briefing> {
  const [banks, brokers, exchanges, tools, sources] = await Promise.all([
    readJson<Entity[]>("banks.json"),
    readJson<Entity[]>("brokers.json"),
    readJson<Entity[]>("exchanges.json"),
    readJson<RiskTool[]>("risk-tools.json"),
    readJson<DataSource[]>("sources.json"),
  ]);
  const entities = [...banks, ...brokers, ...exchanges];
  const previous = await loadPreviousBriefing();
  const lastFriday =
    previousFridayScan(previous?.meta.generatedAt) ??
    (previous?.meta.windowKind === "weekend" ? previous.meta.windowStart : null);
  const window = computeScanWindow(now, lastFriday);

  const results = await mapPool(sources, CONCURRENCY, fetchSource);
  const statuses = results.map((result) => {
    const inScope = result.items.filter((item) => inWindow(item.publishedAt, window));
    return { ...result.status, itemsInWindow: inScope.length };
  });

  const rawItems = results.flatMap((result) =>
    result.items
      .filter((item) => inWindow(item.publishedAt, window))
      .sort((a, b) => +b.publishedAt - +a.publishedAt)
      .slice(0, result.items.some((item) => item.fromFallback) ? 8 : 25),
  );

  const items = mergeItems(
    rawItems
      .map((item) => toNewsItem(item, entities, tools))
      .filter((item, index) =>
        isRelevant(rawItems[index], item.entities, item.category),
      ),
  );
  const repaired = repairNewsItems(clusterNewsItems(items));
  await attachChinese(repaired, previous);

  const briefing: Briefing = {
    meta: {
      generatedAt: now.toISOString(),
      windowKind: window.kind,
      windowLabel: window.label,
      windowStart: window.start.toISOString(),
      windowEnd: window.end.toISOString(),
      itemCount: repaired.length,
      sourceStats: {
        total: statuses.length,
        healthy: statuses.filter((status) => status.status === "healthy").length,
        degraded: statuses.filter((status) => status.status === "degraded").length,
        down: statuses.filter((status) => status.status === "down").length,
      },
    },
    items: repaired,
    sources: statuses.sort((a, b) => a.name.localeCompare(b.name)),
  };

  await mkdir(DATA, { recursive: true });
  await writeFile(path.join(DATA, "latest.json"), JSON.stringify(briefing, null, 2));
  return briefing;
}
