import { SEED_EVIDENCE } from "@/lib/data/seed-evidence";
import { ingestCandidates } from "@/lib/catalogue";
import { countUniqueEvidence, getCatalogueStats, sql } from "@/lib/db";
import type { EvidenceCandidate, ScanResult } from "@/lib/types";

const WIKI_HOSTS = new Set([
  "en.wikipedia.org",
  "zh.wikipedia.org",
  "fr.wikipedia.org",
  "es.wikipedia.org",
  "de.wikipedia.org",
  "ru.wikipedia.org",
  "ja.wikipedia.org",
  "pt.wikipedia.org",
  "ar.wikipedia.org",
  "ko.wikipedia.org",
  "it.wikipedia.org",
  "hi.wikipedia.org",
]);

const SEARCH_QUERIES: Array<{ lang: string; query: string; categories: string[] }> = [
  {
    lang: "en",
    query: "simulation hypothesis universe",
    categories: ["philosophy-metaphysics", "public-discourse"],
  },
  {
    lang: "en",
    query: "digital physics simulated reality",
    categories: ["computation-information", "physics-cosmology"],
  },
  {
    lang: "zh",
    query: "模拟宇宙 假设",
    categories: ["philosophy-metaphysics", "public-discourse"],
  },
  {
    lang: "fr",
    query: "hypothèse de la simulation",
    categories: ["philosophy-metaphysics", "public-discourse"],
  },
  {
    lang: "es",
    query: "hipótesis de simulación",
    categories: ["philosophy-metaphysics", "public-discourse"],
  },
  {
    lang: "de",
    query: "Simulationstheorie Universum",
    categories: ["philosophy-metaphysics", "public-discourse"],
  },
  {
    lang: "ru",
    query: "гипотеза симуляции",
    categories: ["philosophy-metaphysics", "public-discourse"],
  },
  {
    lang: "ja",
    query: "シミュレーション仮説",
    categories: ["philosophy-metaphysics", "public-discourse"],
  },
  {
    lang: "pt",
    query: "hipótese da simulação",
    categories: ["philosophy-metaphysics", "public-discourse"],
  },
  {
    lang: "ar",
    query: "فرضية المحاكاة",
    categories: ["philosophy-metaphysics", "public-discourse"],
  },
];

type WikiSearchItem = {
  title: string;
  snippet: string;
  pageid?: number;
};

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function allowedWikiUrl(lang: string, title: string): string | null {
  const host = `${lang}.wikipedia.org`;
  if (!WIKI_HOSTS.has(host)) return null;
  return `https://${host}/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
}

async function fetchWikiSearch(
  lang: string,
  query: string,
): Promise<WikiSearchItem[]> {
  const host = `${lang}.wikipedia.org`;
  if (!WIKI_HOSTS.has(host)) return [];
  const url = new URL(`https://${host}/w/api.php`);
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", query);
  url.searchParams.set("srlimit", "5");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: "application/json", "User-Agent": "SimulumCatalogue/0.1" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      query?: { search?: WikiSearchItem[] };
    };
    return data.query?.search ?? [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function wikiItemToCandidate(
  lang: string,
  item: WikiSearchItem,
  categories: string[],
): EvidenceCandidate | null {
  const url = allowedWikiUrl(lang, item.title);
  if (!url) return null;
  const snippet = stripHtml(item.snippet || "");
  if (!snippet && !item.title) return null;
  return {
    title: item.title,
    summary: snippet || `Wikipedia discussion of ${item.title} related to simulated reality.`,
    language: lang,
    categorySlugs: categories,
    source: {
      url,
      title: `${item.title} — Wikipedia`,
      snippet,
      language: lang,
      publisher: "Wikipedia",
    },
  };
}

/** Live multilingual Wikipedia scan (host allowlisted). Falls back silently on network errors. */
export async function fetchWebCandidates(): Promise<EvidenceCandidate[]> {
  const out: EvidenceCandidate[] = [];
  const seenUrls = new Set<string>();

  for (const q of SEARCH_QUERIES) {
    const items = await fetchWikiSearch(q.lang, q.query);
    for (const item of items) {
      const candidate = wikiItemToCandidate(q.lang, item, q.categories);
      if (!candidate) continue;
      if (seenUrls.has(candidate.source.url)) continue;
      seenUrls.add(candidate.source.url);
      out.push(candidate);
    }
  }

  return out;
}

let seedPromise: Promise<void> | null = null;
let scanLock: Promise<ScanResult | null> | null = null;

export async function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const count = await countUniqueEvidence();
      if (count === 0) {
        await ingestCandidates(SEED_EVIDENCE, "bootstrap-seed");
      }
    })().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  await seedPromise;
}

const SCAN_COOLDOWN_MS = 6 * 60 * 60 * 1000;

export async function runWorldwideScan(options?: {
  force?: boolean;
  source?: string;
}): Promise<ScanResult | null> {
  await ensureSeeded();

  if (!options?.force) {
    const stats = await getCatalogueStats();
    if (stats.lastScanAt) {
      const age = Date.now() - new Date(stats.lastScanAt).getTime();
      if (age < SCAN_COOLDOWN_MS && stats.lastScanAt) {
        // Allow first seed-only scan to be followed by web scan once
        const runs = await sql<{ count: string }>(
          `select count(*)::text as count from scan_runs`,
        );
        if (Number(runs[0]?.count ?? 0) > 1) return null;
      }
    }
  }

  if (scanLock) return scanLock;

  scanLock = (async () => {
    const web = await fetchWebCandidates();
    const candidates = [...SEED_EVIDENCE, ...web];
    return ingestCandidates(
      candidates,
      options?.source ?? "worldwide-web-scan",
    );
  })().finally(() => {
    scanLock = null;
  });

  return scanLock;
}

/**
 * Call from RSC pages: always seed when empty.
 * Optionally runs a throttled worldwide scan when SIMULUM_AUTO_SCAN=1
 * (local demos). Published apps should refresh via POST /api/scan + SCAN_SECRET.
 */
export async function ensureCatalogueFresh(): Promise<{
  uniqueEvidence: number;
  scan: ScanResult | null;
}> {
  await ensureSeeded();
  let scan: ScanResult | null = null;
  if (process.env.SIMULUM_AUTO_SCAN === "1") {
    try {
      scan = await runWorldwideScan({ source: "page-refresh-scan" });
    } catch {
      scan = null;
    }
  }
  const uniqueEvidence = await countUniqueEvidence();
  return { uniqueEvidence, scan };
}
