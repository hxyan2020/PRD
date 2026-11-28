import { SEED_EVIDENCE } from "@/lib/data/seed-evidence";
import { ingestCandidates } from "@/lib/catalogue";
import { countUniqueEvidence, getCatalogueStats, sql } from "@/lib/db";
import { fetchWikipediaHdImage } from "@/lib/images";
import type { EvidenceCandidate, ScanResult } from "@/lib/types";

async function enrichSeedWithImages(
  seeds: EvidenceCandidate[],
): Promise<EvidenceCandidate[]> {
  const out: EvidenceCandidate[] = [];
  for (const seed of seeds) {
    const url = seed.source.url;
    const match = url.match(/https?:\/\/([a-z]+)\.wikipedia\.org\/wiki\/([^?#]+)/i);
    if (!match || (seed.images && seed.images.length > 0)) {
      out.push(seed);
      continue;
    }
    const lang = match[1];
    const title = decodeURIComponent(match[2].replace(/_/g, " "));
    const image = await fetchWikipediaHdImage(lang, title, url);
    out.push(
      image
        ? {
            ...seed,
            images: [image],
            source: { ...seed.source, imageUrl: image.url },
          }
        : seed,
    );
  }
  return out;
}

/** Daily scan clock: 07:00 Asia/Singapore (23:00 UTC previous day). */
export const DAILY_SCAN_LOCAL_TIME = "07:00";
export const DAILY_SCAN_TIMEZONE = "Asia/Singapore";
export const DAILY_SCAN_CRON_UTC = "0 23 * * *";
export const DAILY_SCAN_LABEL = `daily ${DAILY_SCAN_LOCAL_TIME} ${DAILY_SCAN_TIMEZONE}`;

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
  { lang: "en", query: "simulation hypothesis universe", categories: ["philosophy-metaphysics", "public-discourse"] },
  { lang: "en", query: "digital physics simulated reality", categories: ["computation-information", "physics-cosmology"] },
  { lang: "zh", query: "模拟宇宙 假设", categories: ["philosophy-metaphysics", "public-discourse"] },
  { lang: "fr", query: "hypothèse de la simulation", categories: ["philosophy-metaphysics", "public-discourse"] },
  { lang: "es", query: "hipótesis de simulación", categories: ["philosophy-metaphysics", "public-discourse"] },
  { lang: "de", query: "Simulationstheorie Universum", categories: ["philosophy-metaphysics", "public-discourse"] },
  { lang: "ru", query: "гипотеза симуляции", categories: ["philosophy-metaphysics", "public-discourse"] },
  { lang: "ja", query: "シミュレーション仮説", categories: ["philosophy-metaphysics", "public-discourse"] },
  { lang: "pt", query: "hipótese da simulação", categories: ["philosophy-metaphysics", "public-discourse"] },
  { lang: "ar", query: "فرضية المحاكاة", categories: ["philosophy-metaphysics", "public-discourse"] },
  { lang: "ko", query: "시뮬레이션 가설", categories: ["philosophy-metaphysics", "public-discourse"] },
  { lang: "it", query: "ipotesi della simulazione", categories: ["philosophy-metaphysics", "public-discourse"] },
  { lang: "hi", query: "सिमुलेशन परिकल्पना", categories: ["philosophy-metaphysics", "public-discourse"] },
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

async function fetchWikiSearch(lang: string, query: string): Promise<WikiSearchItem[]> {
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
      headers: { Accept: "application/json", "User-Agent": "SimulumCatalogue/0.2" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { query?: { search?: WikiSearchItem[] } };
    return data.query?.search ?? [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

const RELEVANCE =
  /simul|simulation|模拟|模擬|hypothèse de la simulation|hip[oó]tesis de simul|simulationstheorie|симуляц|シミュレーション|시물레이션|فرضیة المحاكاة|ipotesi della simul|digital physics|matrix|ancestor|holograph|it from bit|cellular automaton|calculating space/i;

function isRelevantWikiHit(title: string, snippet: string): boolean {
  return RELEVANCE.test(`${title} ${snippet}`);
}

async function wikiItemToCandidate(
  lang: string,
  item: WikiSearchItem,
  categories: string[],
): Promise<EvidenceCandidate | null> {
  const url = allowedWikiUrl(lang, item.title);
  if (!url) return null;
  const snippet = stripHtml(item.snippet || "");
  if (!snippet && !item.title) return null;
  if (!isRelevantWikiHit(item.title, snippet)) return null;
  const image = await fetchWikipediaHdImage(lang, item.title, url);
  return {
    title: item.title,
    summary: snippet || `Wikipedia discussion of ${item.title} related to simulated reality.`,
    language: lang,
    categorySlugs: categories,
    images: image ? [image] : [],
    source: {
      url,
      title: `${item.title} — Wikipedia`,
      snippet,
      language: lang,
      publisher: "Wikipedia",
      imageUrl: image?.url,
    },
  };
}

/** Live multilingual Wikipedia scan (host allowlisted). Falls back silently on network errors. */
export async function fetchWebCandidates(): Promise<{
  candidates: EvidenceCandidate[];
  sourcesScanned: number;
}> {
  const out: EvidenceCandidate[] = [];
  const seenUrls = new Set<string>();
  let sourcesScanned = 0;

  for (const q of SEARCH_QUERIES) {
    const items = await fetchWikiSearch(q.lang, q.query);
    sourcesScanned += items.length;
    for (const item of items) {
      const candidate = await wikiItemToCandidate(q.lang, item, q.categories);
      if (!candidate) continue;
      if (seenUrls.has(candidate.source.url)) continue;
      seenUrls.add(candidate.source.url);
      out.push(candidate);
    }
  }

  return { candidates: out, sourcesScanned };
}

let seedPromise: Promise<void> | null = null;
let scanLock: Promise<ScanResult | null> | null = null;

export async function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const count = await countUniqueEvidence();
      if (count === 0) {
        const seeds = await enrichSeedWithImages(SEED_EVIDENCE);
        await ingestCandidates(seeds, "bootstrap-seed", {
          sourcesScanned: seeds.length,
          scheduleLabel: "bootstrap",
        });
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
  scheduleLabel?: string;
}): Promise<ScanResult | null> {
  await ensureSeeded();

  if (!options?.force) {
    const stats = await getCatalogueStats();
    if (stats.lastScanAt) {
      const age = Date.now() - new Date(stats.lastScanAt).getTime();
      if (age < SCAN_COOLDOWN_MS && stats.lastScanAt) {
        const runs = await sql<{ count: string }>(
          `select count(*)::text as count from scan_runs`,
        );
        if (Number(runs[0]?.count ?? 0) > 1) return null;
      }
    }
  }

  if (scanLock) return scanLock;

  scanLock = (async () => {
    const { candidates: web, sourcesScanned } = await fetchWebCandidates();
    const seeds = await enrichSeedWithImages(SEED_EVIDENCE);
    const candidates = [...seeds, ...web];
    return ingestCandidates(candidates, options?.source ?? "worldwide-web-scan", {
      sourcesScanned: seeds.length + sourcesScanned,
      scheduleLabel: options?.scheduleLabel ?? "",
    });
  })().finally(() => {
    scanLock = null;
  });

  return scanLock;
}

export async function runDailyScan(): Promise<ScanResult | null> {
  return runWorldwideScan({
    force: true,
    source: "daily-scheduled-scan",
    scheduleLabel: DAILY_SCAN_LABEL,
  });
}

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
