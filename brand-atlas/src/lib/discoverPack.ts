/**
 * Resource-pack discovery: builds interest-aware web queries, searches Wikipedia,
 * extracts brand/species candidates, and enriches them with summaries + thumbnails.
 */
import {
  interestSpecFor,
  optionLabel,
  type CategoryInterestSpec,
} from "./interestTraits";
import {
  existingNames,
  slugify,
  type InterestSelection,
  type PackCandidate,
} from "./resourcePacks";
import type { Catalog } from "../types/catalog";

const WIKI = "https://en.wikipedia.org/w/api.php";

async function wikiJson<T>(params: Record<string, string>): Promise<T> {
  const url = new URL(WIKI);
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Wikipedia request failed (${res.status})`);
  return (await res.json()) as T;
}

function selectedLabels(
  spec: CategoryInterestSpec,
  interests: InterestSelection,
): { fieldId: string; labels: string[] }[] {
  return spec.fields
    .map((field) => ({
      fieldId: field.id,
      labels: (interests.traits[field.id] ?? []).map((id) =>
        optionLabel(field, id),
      ),
    }))
    .filter((x) => x.labels.length > 0);
}

/** Build several web search queries from the user's interest characteristics. */
export function buildSearchQueries(
  spec: CategoryInterestSpec,
  interests: InterestSelection,
): string[] {
  const picked = selectedLabels(spec, interests);
  const origin =
    picked.find((p) => p.fieldId === "origin" || p.fieldId === "prefecture" || p.fieldId === "region" || p.fieldId === "climate")
      ?.labels[0] ?? "";
  const secondary = picked
    .filter((p) => p.fieldId !== "origin" && p.fieldId !== "prefecture")
    .flatMap((p) => p.labels)
    .slice(0, 3);

  const queries: string[] = [];
  if (origin) {
    queries.push(`List of ${origin} ${spec.listQuery}`);
    queries.push(`${origin} ${spec.listQuery}`);
    queries.push(`${origin} ${spec.subject}`);
  } else {
    queries.push(`List of ${spec.listQuery}`);
  }
  for (const s of secondary) {
    queries.push(
      origin
        ? `${origin} ${s} ${spec.listQuery}`
        : `List of ${s} ${spec.listQuery}`,
    );
  }
  if (interests.note?.trim()) {
    queries.push(`${interests.note.trim()} ${spec.listQuery}`);
  }
  // de-dupe
  return [...new Set(queries.map((q) => q.replace(/\s+/g, " ").trim()))];
}

interface OpenSearchResult {
  titles: string[];
  urls: string[];
}

async function openSearch(query: string, limit = 6): Promise<OpenSearchResult> {
  const data = await wikiJson<[string, string[], string[], string[]]>({
    action: "opensearch",
    search: query,
    limit: String(limit),
  });
  return { titles: data[1] ?? [], urls: data[3] ?? [] };
}

async function fetchWikitext(title: string): Promise<string | null> {
  try {
    const data = await wikiJson<{
      parse?: { wikitext?: { ["*"]: string }; title?: string };
      error?: { info: string };
    }>({
      action: "parse",
      page: title,
      prop: "wikitext",
      redirects: "1",
    });
    if (data.error) return null;
    return data.parse?.wikitext?.["*"] ?? null;
  } catch {
    return null;
  }
}

const SKIP_TITLE =
  /^(list of|category:|file:|template:|wikipedia:|help:|portal:|draft:)/i;

function cleanWikiTitle(raw: string): string | null {
  let name = raw.trim();
  if (!name || SKIP_TITLE.test(name)) return null;
  // Drop disambiguator noise when helpful but keep marque clarity
  name = name.replace(
    /\s+\((automobile|marque|company|brand|car|tree|flower|plant|species|brewery|distillery|automobiles)\)$/i,
    "",
  );
  if (name.length < 2 || name.length > 56) return null;
  if (/^[a-z]/.test(name)) return null;
  if (/^\d+$/.test(name)) return null;
  // Skip geographic / bureaucracy / generic fillers
  if (
    /^(china|japan|united states|europe|asia|africa|india|germany|france|italy|uk|usa|south korea|hong kong|macau)$/i.test(
      name,
    )
  ) {
    return null;
  }
  if (
    /state-owned|administration|commission|civil service|automotive industry|reform and opening|ministry of|government of/i.test(
      name,
    )
  ) {
    return null;
  }
  return name;
}

function extractNamesFromWikitext(wikitext: string): string[] {
  const names: string[] = [];
  const linkRe = /\[\[([^\]|#]+)(?:\|[^\]]+)?\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(wikitext))) {
    const cleaned = cleanWikiTitle(m[1]);
    if (cleaned) names.push(cleaned);
  }
  // Also catch plain bullet bold names: * '''Brand'''
  const boldRe = /^\*\s*'''([^']+)'''/gm;
  while ((m = boldRe.exec(wikitext))) {
    const cleaned = cleanWikiTitle(m[1]);
    if (cleaned) names.push(cleaned);
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const n of names) {
    const k = n.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(n);
  }
  return out;
}

interface PageEnrichment {
  title: string;
  summary: string;
  coverUrl: string | null;
  pageUrl: string;
}

async function enrichPages(titles: string[]): Promise<Map<string, PageEnrichment>> {
  const map = new Map<string, PageEnrichment>();
  const chunkSize = 20;
  for (let i = 0; i < titles.length; i += chunkSize) {
    const chunk = titles.slice(i, i + chunkSize);
    try {
      const data = await wikiJson<{
        query?: {
          pages?: Record<
            string,
            {
              title: string;
              extract?: string;
              thumbnail?: { source: string };
              missing?: string;
            }
          >;
        };
      }>({
        action: "query",
        prop: "extracts|pageimages",
        exintro: "1",
        explaintext: "1",
        pithumbsize: "640",
        redirects: "1",
        titles: chunk.join("|"),
      });
      const pages = data.query?.pages ?? {};
      for (const page of Object.values(pages)) {
        if (!page || page.missing != null) continue;
        map.set(page.title.toLowerCase(), {
          title: page.title,
          summary: (page.extract ?? "").slice(0, 280),
          coverUrl: page.thumbnail?.source ?? null,
          pageUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
        });
      }
    } catch {
      // continue with remaining chunks
    }
  }
  return map;
}

function originFromInterests(
  spec: CategoryInterestSpec,
  interests: InterestSelection,
): string | null {
  for (const field of spec.fields) {
    if (
      field.id === "origin" ||
      field.id === "prefecture" ||
      field.id === "region" ||
      field.id === "climate"
    ) {
      const ids = interests.traits[field.id] ?? [];
      if (ids[0]) return optionLabel(field, ids[0]);
    }
  }
  return null;
}

function tagsFromInterests(
  spec: CategoryInterestSpec,
  interests: InterestSelection,
): string[] {
  const tags: string[] = [];
  for (const field of spec.fields) {
    for (const id of interests.traits[field.id] ?? []) {
      tags.push(id);
      tags.push(optionLabel(field, id).toLowerCase());
    }
  }
  return [...new Set(tags.map((t) => t.toLowerCase().replace(/\s+/g, "-")))];
}

function scoreName(
  name: string,
  summary: string,
  interests: InterestSelection,
  spec: CategoryInterestSpec,
): number {
  let score = 1;
  const hay = `${name} ${summary}`.toLowerCase();
  for (const field of spec.fields) {
    for (const id of interests.traits[field.id] ?? []) {
      const label = optionLabel(field, id).toLowerCase();
      if (hay.includes(label) || hay.includes(id.replace(/-/g, " "))) score += 2;
    }
  }
  if (interests.note?.trim()) {
    const noteToks = interests.note.toLowerCase().split(/\W+/).filter((t) => t.length > 3);
    for (const t of noteToks) {
      if (hay.includes(t)) score += 1.5;
    }
  }
  // Prefer shorter proper names over long institutional titles
  if (name.split(/\s+/).length <= 4) score += 0.5;
  if (/group|corporation|company|limited|holdings/i.test(name)) score -= 0.8;
  return score;
}

export interface DiscoverResult {
  queries: string[];
  pagesSearched: string[];
  candidates: PackCandidate[];
  message: string;
}

/**
 * Search the web (Wikipedia) for items matching the user's interest characteristics,
 * then return catalogue-ready candidates that are not already on the shelf.
 */
export async function discoverResourcePack(input: {
  categoryId: string;
  interests: InterestSelection;
  catalog: Catalog;
  limit?: number;
}): Promise<DiscoverResult> {
  const spec = interestSpecFor(input.categoryId);
  if (!spec) {
    throw new Error("This category does not support resource packs yet.");
  }
  const limit = input.limit ?? 12;
  const queries = buildSearchQueries(spec, input.interests);
  if (!queries.length) {
    throw new Error("Pick at least one interest characteristic first.");
  }

  const pagesSearched: string[] = [];
  const rawNames: string[] = [];

  for (const query of queries.slice(0, 5)) {
    const found = await openSearch(query, 5);
    // Prefer list pages
    const ordered = [...found.titles].sort((a, b) => {
      const as = /^list of/i.test(a) ? 0 : 1;
      const bs = /^list of/i.test(b) ? 0 : 1;
      return as - bs;
    });
    for (const title of ordered.slice(0, 2)) {
      if (pagesSearched.includes(title)) continue;
      pagesSearched.push(title);
      const wt = await fetchWikitext(title);
      if (!wt) continue;
      // Follow single redirect manually if needed (parse usually resolves)
      rawNames.push(...extractNamesFromWikitext(wt));
    }
  }

  // If list pages were thin, also treat opensearch hits themselves as candidates
  if (rawNames.length < 8) {
    for (const query of queries.slice(0, 3)) {
      const found = await openSearch(`${query} brand`, 8);
      for (const title of found.titles) {
        const cleaned = cleanWikiTitle(title);
        if (cleaned && !/^list of/i.test(cleaned)) rawNames.push(cleaned);
      }
    }
  }

  const existing = existingNames(input.catalog, input.categoryId);
  function alreadyCovered(name: string): boolean {
    const lower = name.toLowerCase();
    const slug = slugify(name);
    if (existing.has(lower) || existing.has(slug)) return true;
    // Treat "BYD Auto" / "Geely Auto" as covered when BYD / Geely already exist
    for (const ex of existing) {
      if (ex.length < 3) continue;
      if (lower === ex) return true;
      if (lower.startsWith(`${ex} `) || lower.startsWith(`${ex}-`)) return true;
      if (ex.startsWith(`${lower} `) || ex.startsWith(`${lower}-`)) return true;
    }
    return false;
  }
  const unique = [...new Set(rawNames.map((n) => n.trim()))].filter(
    (n) => !alreadyCovered(n),
  );

  // Enrich top pool
  const enrichMap = await enrichPages(unique.slice(0, 40));
  const origin = originFromInterests(spec, input.interests);
  const tags = tagsFromInterests(spec, input.interests);

  const ranked: PackCandidate[] = unique
    .map((name) => {
      const info =
        enrichMap.get(name.toLowerCase()) ||
        [...enrichMap.values()].find(
          (e) => e.title.toLowerCase() === name.toLowerCase(),
        );
      const summary = info?.summary ?? "";
      return {
        candidate: {
          name: info?.title ?? name,
          slug: slugify(info?.title ?? name),
          origin,
          tags,
          summary:
            summary ||
            `${info?.title ?? name} — discovered for your ${spec.subject} interests.`,
          sourceUrl: info?.pageUrl,
          coverUrl: info?.coverUrl ?? null,
          aliases: info && info.title !== name ? [name] : [],
        } satisfies PackCandidate,
        score: scoreName(info?.title ?? name, summary, input.interests, spec),
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.candidate);

  // Drop near-duplicates by slug
  const seenSlug = new Set<string>();
  const candidates: PackCandidate[] = [];
  for (const c of ranked) {
    if (seenSlug.has(c.slug)) continue;
    seenSlug.add(c.slug);
    candidates.push(c);
    if (candidates.length >= limit) break;
  }

  const traitBits = selectedLabels(spec, input.interests)
    .flatMap((x) => x.labels)
    .join(", ");

  return {
    queries,
    pagesSearched,
    candidates,
    message: candidates.length
      ? `Found ${candidates.length} new ${spec.subject}${candidates.length === 1 ? "" : "s"} for ${traitBits || "your interests"} via web search.`
      : `No new ${spec.subject}s found for those interests — try different characteristics.`,
  };
}

export function packTitle(
  categoryLabel: string,
  interests: InterestSelection,
  spec: CategoryInterestSpec,
): string {
  const bits = selectedLabels(spec, interests)
    .flatMap((x) => x.labels)
    .slice(0, 3);
  const focus = bits.length ? bits.join(" · ") : "Custom";
  return `${categoryLabel} pack — ${focus}`;
}
