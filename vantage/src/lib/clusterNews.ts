import { buildImpact } from "./classify";
import { finishPoint, isIncompletePoint } from "./extract";
import { detectSourceLang } from "./i18n/detectLang";
import type { NewsCategory, NewsItem, Sector } from "./types";

const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "into",
  "after",
  "over",
  "near",
  "says",
  "said",
  "will",
  "have",
  "has",
  "are",
  "was",
  "were",
  "been",
  "its",
  "than",
  "amid",
  "week",
  "news",
  "update",
  "live",
  "updates",
  "morning",
  "minute",
  "here",
  "what",
  "happened",
  "today",
  "about",
  "onto",
  "into",
  "as",
  "on",
  "in",
  "to",
  "of",
  "by",
  "okx",
  "list",
  "delist",
  "perpetual",
  "futures",
  "contract",
  "contracts",
  "launch",
  "launches",
  "announces",
  "crypto",
  "token",
  "exchange",
]);

type EventRule = {
  id: string;
  test: (text: string) => boolean;
};

const EVENT_RULES: EventRule[] = [
  {
    id: "clarity-act",
    test: (text) =>
      /clarity act|\bclari(?:ty)?\b/.test(text) &&
      /senate|vote|fail|collapse|stall|reject|odds|etf|outflow|stock|bitcoin|crypto/.test(text),
  },
  {
    id: "deutsche-bank-custody",
    test: (text) => /deutsche bank/.test(text) && /custod|digital asset/.test(text),
  },
  {
    id: "circle-arc",
    test: (text) => /\bcircle\b/.test(text) && /\barc\b|mainnet/.test(text),
  },
  {
    id: "coinex-close",
    test: (text) => /coinex/.test(text) && /close|shut|anniversary/.test(text),
  },
  {
    id: "robinhood-engineers",
    test: (text) => /robinhood/.test(text) && /engineer|front-run|insider|charg/.test(text),
  },
  {
    id: "digital-euro",
    test: (text) => /digital euro/.test(text),
  },
  {
    id: "candeal-boc",
    test: (text) => /candeal/.test(text),
  },
  {
    id: "pboc-loan-growth",
    test: (text) =>
      /pboc|pan gongsheng|people'?s bank|中国人民银行/.test(text) &&
      /loan|credit growth|slower/.test(text),
  },
  {
    id: "zcash-blocks",
    test: (text) => /zcash|\bzec\b/.test(text) && /block|halv|nu7|25-second|25 second/.test(text),
  },
  {
    id: "two-prime-vault",
    test: (text) => /two prime/.test(text),
  },
  {
    id: "binance-etf-wealth",
    test: (text) => /binance/.test(text) && /etf/.test(text) && /wealth/.test(text),
  },
  {
    id: "enova-grasshopper",
    test: (text) => /enova/.test(text) && /grasshopper/.test(text),
  },
  {
    id: "kamino-weisz",
    test: (text) => /kamino/.test(text) && /weisz/.test(text),
  },
  {
    id: "mev-rseth",
    test: (text) => /mev|rseth|kelp/.test(text) && /exploit|front-run/.test(text),
  },
  {
    id: "sc-arbitrum",
    test: (text) => /arbitrum/.test(text) && /standard chartered/.test(text),
  },
];

function haystack(item: NewsItem): string {
  return `${item.caption} ${item.keyPoints.join(" ")}`.toLowerCase();
}

export function eventKey(item: NewsItem): string | null {
  const text = haystack(item);
  return EVENT_RULES.find((rule) => rule.test(text))?.id ?? null;
}

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !STOP.has(word) && !/^\d+$/.test(word)),
  );
}

function jaccard(left: Set<string>, right: Set<string>): number {
  let overlap = 0;
  for (const word of left) {
    if (right.has(word)) overlap += 1;
  }
  const union = left.size + right.size - overlap;
  return union ? overlap / union : 0;
}

function similarItems(left: NewsItem, right: NewsItem): boolean {
  const a = tokens(`${left.caption} ${left.keyPoints.join(" ")}`);
  const b = tokens(`${right.caption} ${right.keyPoints.join(" ")}`);
  const overlap = [...a].filter((word) => b.has(word)).length;
  const score = jaccard(a, b);
  const contained = overlap >= 3 && (overlap / Math.min(a.size, b.size) >= 0.72);
  return (score >= 0.42 && overlap >= 4) || contained;
}

function captionScore(item: NewsItem): number {
  const title = item.caption;
  let score = 0;
  if (!/^(live updates|morning minute|here.?s what happened|weekly outlook)/i.test(title)) {
    score += 8;
  }
  if (/[A-Za-z]/.test(title) && !/\b(kiest|wahlt|wählt|herbeoordeling)\b/i.test(title)) {
    score += 4;
  }
  if (title.length >= 36 && title.length <= 140) score += 3;
  if (item.keyPoints.length) score += 1;
  if (item.sources.some((source) => ["coindesk", "cointelegraph", "finextra"].includes(source.sourceId))) {
    score += 2;
  }
  return score;
}

function normalizePoint(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u3400-\u9fff\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniquePoints(points: string[], caption: string, max = 8): string[] {
  const captionNorm = normalizePoint(caption);
  const kept: string[] = [];
  for (const point of points) {
    const cleaned = finishPoint(point);
    if (!cleaned || isIncompletePoint(cleaned)) continue;
    const norm = normalizePoint(cleaned);
    if (!norm || norm === captionNorm) continue;
    const pointTokens = tokens(cleaned);
    if (kept.some((existing) => jaccard(tokens(existing), pointTokens) > 0.7)) continue;
    kept.push(cleaned);
    if (kept.length >= max) break;
  }
  if (kept.length === 0 && caption) kept.push(finishPoint(caption));
  return kept;
}

function stripKicker(title: string): string {
  return title.replace(/^(live updates|morning minute)\s*:\s*/i, "").trim();
}

function pointValue(point: string): number {
  let score = 0;
  if (/\d/.test(point)) score += 3;
  if (/\$|%/.test(point)) score += 2;
  if (point.length > 70 && point.length < 280) score += 1;
  if (/^(live updates|morning minute)/i.test(point)) score -= 4;
  return score;
}

function mergeCluster(items: NewsItem[]): NewsItem {
  const ranked = [...items].sort((a, b) => captionScore(b) - captionScore(a));
  const primary = ranked[0];
  const candidates: string[] = [];
  const primaryLang = detectSourceLang(primary.caption);
  for (const item of ranked) {
    for (const point of item.keyPoints) {
      const pointLang = detectSourceLang(point);
      if (primaryLang === "en" && pointLang !== "en" && pointLang !== "zh") continue;
      candidates.push(point);
    }
    const extra = stripKicker(item.caption);
    if (
      item !== primary &&
      extra &&
      !(primaryLang === "en" && detectSourceLang(extra) !== "en")
    ) {
      candidates.push(extra);
    }
  }
  candidates.sort((left, right) => pointValue(right) - pointValue(left));
  const points = uniquePoints(candidates, primary.caption, 10);
  const previousZh = new Map<string, string>();
  for (const item of items) {
    item.keyPoints.forEach((point, index) => {
      if (item.keyPointsZh[index]) previousZh.set(point, item.keyPointsZh[index]);
    });
  }
  const sources = [
    ...new Map(items.flatMap((item) => item.sources).map((source) => [source.url, source])).values(),
  ];
  const sectors = [...new Set(items.flatMap((item) => item.sectors))] as Sector[];
  const assets = [
    ...new Set(items.flatMap((item) => item.impact?.assets ?? [])),
  ];
  const category =
    items.find((item) => item.category === "regulation")?.category ?? primary.category;
  const publishedAt = items
    .map((item) => item.publishedAt)
    .sort((a, b) => +new Date(b) - +new Date(a))[0];

  return {
    ...primary,
    category: category as NewsCategory,
    captionZh: primary.captionZh,
    keyPoints: points,
    keyPointsZh: points.map((point) => previousZh.get(point) ?? ""),
    sources,
    publishedAt,
    entities: [...new Set(items.flatMap((item) => item.entities))],
    jurisdictions: [...new Set(items.flatMap((item) => item.jurisdictions))],
    sectors,
    impact: items.some((item) => item.impact) ? buildImpact(sectors, assets) : primary.impact,
    riskTools: [...new Set(items.flatMap((item) => item.riskTools))],
  };
}

export function clusterNewsItems(items: NewsItem[]): NewsItem[] {
  const parent = items.map((_, index) => index);
  const find = (index: number): number => {
    if (parent[index] !== index) parent[index] = find(parent[index]);
    return parent[index];
  };
  const union = (a: number, b: number) => {
    parent[find(a)] = find(b);
  };

  const keys = items.map((item) => eventKey(item));
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      if (keys[i] && keys[i] === keys[j]) {
        union(i, j);
        continue;
      }
      if (!keys[i] && !keys[j] && similarItems(items[i], items[j])) {
        union(i, j);
      }
    }
  }

  const groups = new Map<number, NewsItem[]>();
  items.forEach((item, index) => {
    const root = find(index);
    const list = groups.get(root) ?? [];
    list.push(item);
    groups.set(root, list);
  });

  return [...groups.values()]
    .map((group) => (group.length === 1 ? group[0] : mergeCluster(group)))
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
}
