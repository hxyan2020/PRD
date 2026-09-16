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
import { computeScanWindow, inWindow, previousFridayScan } from "../src/lib/window";
import { clusterNewsItems } from "../src/lib/clusterNews";
import { repairNewsItems } from "../src/lib/repairNews";
import { attachChinese } from "./localize";

const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data");
const USER_AGENT =
  "VantageMarketIntelligence/1.0 (research desk; hxyan.2015@gmail.com)";
const CONCURRENCY = 8;
const TIMEOUT_MS = 18_000;

const parser = new Parser({
  timeout: TIMEOUT_MS,
  headers: {
    "User-Agent": USER_AGENT,
    Accept:
      "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
  },
  customFields: {
    item: [["dc:date", "dcDate"], ["updated", "updated"]],
  },
});

interface RawItem {
  source: DataSource;
  title: string;
  link: string;
  summary: string;
  publishedAt: Date;
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

function parseDate(item: {
  isoDate?: string;
  pubDate?: string;
  dcDate?: string;
  updated?: string;
}): Date | null {
  for (const value of [item.isoDate, item.pubDate, item.dcDate, item.updated]) {
    if (!value) continue;
    const date = parseLooseDate(value);
    if (date) return date;
  }
  return null;
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
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const response = await fetch(source.url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timer);

    const latencyMs = Date.now() - started;
    const body = await response.text();
    baseStatus.httpStatus = response.status;
    baseStatus.latencyMs = latencyMs;
    baseStatus.lastSourced = new Date().toISOString();

    if (!response.ok) {
      return {
        status: {
          ...baseStatus,
          status: "down",
          error: `HTTP ${response.status}`,
        },
        items: [],
      };
    }

    const feed = await parser.parseString(body);
    const items: RawItem[] = [];
    for (const entry of feed.items ?? []) {
      const publishedAt = parseDate(entry);
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

    let status: SourceHealth = "healthy";
    if (items.length === 0) status = "degraded";

    return {
      status: {
        ...baseStatus,
        status,
        itemsFetched: items.length,
        error: items.length === 0 ? "Feed parsed but contained no dated items" : null,
      },
      items,
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
      .slice(0, 25),
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
