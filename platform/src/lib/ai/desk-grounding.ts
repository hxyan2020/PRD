import { PLATFORM_URLS } from "../docs/urls";
import { EVENT_TEMPLATES, MARKET_INTEL_SOURCES } from "../market-intel/sources";
import { retrieveDeskCorpus, SEED_RAG_DOCS, type DeskCorpusHit } from "./rag-corpus";

export type GroundedSource = { title: string; href: string; external?: boolean };

export type DeskGrounding = {
  corpus: DeskCorpusHit[];
  adminPages: GroundedSource[];
  externalProduct: GroundedSource[];
  marketIntel: Array<{
    title: string;
    summary: string;
    severity: string;
    sources: GroundedSource[];
  }>;
  intelChannels: GroundedSource[];
};

function tokens(query: string): string[] {
  const lower = query.toLowerCase();
  const latin = lower
    .replace(/[^a-z0-9%\-\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
  const cjk = [...lower.matchAll(/[\u4e00-\u9fff]{2,}/g)].map((m) => m[0]);
  return [...new Set([...latin, ...cjk])];
}

function scoreHay(hay: string, toks: string[], q: string): number {
  let hits = 0;
  for (const t of toks) {
    if (hay.includes(t)) hits += t.length > 8 ? 2 : 1;
  }
  // Whole-phrase boost for short admin titles in the query.
  if (q.length >= 4 && hay.includes(q.slice(0, Math.min(q.length, 40)))) hits += 2;
  return hits;
}

/** Match admin URL catalogue entries (internal pages + public snapshot URLs). */
export function matchAdminUrls(query: string, limit = 3): GroundedSource[] {
  const toks = tokens(query);
  if (!toks.length) return [];
  const q = query.toLowerCase();
  return PLATFORM_URLS.map((u) => {
    const hay = `${u.title} ${u.description} ${u.path} ${u.category}`.toLowerCase();
    return { u, hits: scoreHay(hay, toks, q) };
  })
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, limit)
    .map((x) => ({ title: x.u.title, href: x.u.path }));
}

/** Match rotating market-intel event templates + official channel homepages. */
export function matchMarketIntel(
  query: string,
  limit = 2
): DeskGrounding["marketIntel"] {
  const toks = tokens(query);
  if (!toks.length) return [];
  const q = query.toLowerCase();
  const macroCue =
    /(macro|calendar|nfp|fomc|cpi|ecb|fed|opec|eia|cftc|hawkish|rate cut|inventory|oil|gold|xau|eurusd|usd|bitcoin|btc|etf|sanction|geopol|宏觀|聯準會|歐央|原油|黃金)/i.test(
      q
    );
  return EVENT_TEMPLATES.map((ev) => {
    const products = ev.products.map((p) => p.product).join(" ");
    const hay = `${ev.event_title} ${ev.event_summary} ${ev.geography} ${products} ${ev.source_keys.join(" ")}`.toLowerCase();
    let hits = scoreHay(hay, toks, q);
    if (macroCue && hits > 0) hits += 1;
    return { ev, hits };
  })
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, limit)
    .map((x) => ({
      title: x.ev.event_title,
      summary: x.ev.event_summary,
      severity: x.ev.severity,
      sources: x.ev.source_urls.slice(0, 3).map((s) => ({
        title: s.name,
        href: s.url,
        external: true as const,
      })),
    }));
}

export function matchIntelChannels(query: string, limit = 3): GroundedSource[] {
  const toks = tokens(query);
  if (!toks.length) return [];
  const q = query.toLowerCase();
  return MARKET_INTEL_SOURCES.map((s) => {
    const hay = `${s.name} ${s.source_key} ${s.channel_type} ${s.asset_classes.join(" ")}`.toLowerCase();
    return { s, hits: scoreHay(hay, toks, q) };
  })
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, limit)
    .map((x) => ({ title: x.s.name, href: x.s.url, external: true }));
}

/** Resolve corpus hits from server RAG snippets (title match) or local seed search. */
export function resolveCorpusHits(
  query: string,
  ragSnippets: Array<{ title: string; content: string; source_ref?: string }> | undefined,
  limit = 5
): DeskCorpusHit[] {
  if (ragSnippets?.length) {
    return ragSnippets.slice(0, limit).map((s) => {
      const seed = SEED_RAG_DOCS.find((d) => d.title === s.title || d.doc_key === s.title);
      const source_ref = s.source_ref || seed?.source_ref || "internal://crmp/rag";
      return {
        title: s.title,
        content: s.content,
        doc_key: seed?.doc_key || s.title,
        category: seed?.category || "OPS",
        source_ref,
        external: source_ref.startsWith("http"),
      };
    });
  }
  return retrieveDeskCorpus(query, limit);
}

/** Full grounding pack: admin corpus + URL catalogue + external product/news. */
export function groundDeskQuery(
  query: string,
  ragSnippets?: Array<{ title: string; content: string; source_ref?: string }>
): DeskGrounding {
  const corpus = resolveCorpusHits(query, ragSnippets, 5);
  const adminPages = matchAdminUrls(query, 3);
  const externalProduct = corpus
    .filter((h) => h.external)
    .map((h) => ({ title: h.title, href: h.source_ref, external: true as const }));
  const marketIntel = matchMarketIntel(query, 2);
  const intelChannels = matchIntelChannels(query, 3);
  return { corpus, adminPages, externalProduct, marketIntel, intelChannels };
}
