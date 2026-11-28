import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import { CATEGORIES } from "@/lib/data/categories";
import { filterHdRelevantImages } from "@/lib/images";
import { rateEvidence, rateFromEvidence } from "@/lib/ratings";
import type {
  CatalogueStats,
  Category,
  Evidence,
  EvidenceBody,
  EvidenceImage,
  EvidenceLocalePack,
  EvidenceRatings,
  EvidenceSource,
  ScanResult,
} from "@/lib/types";

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
let pool: pg.Pool | undefined;

type GlobalDb = typeof globalThis & {
  __simulumPglite?: Promise<PGlite>;
};

export async function sql<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  if (databaseUrl !== "") {
    pool ??= new pg.Pool({ connectionString: databaseUrl, max: 5 });
    return (await pool.query(text, params)).rows as T[];
  }
  const g = globalThis as GlobalDb;
  g.__simulumPglite ??= startLocal().catch((error: unknown) => {
    g.__simulumPglite = undefined;
    throw error;
  });
  return (await (await g.__simulumPglite).query<T>(text, params)).rows;
}

async function startLocal(): Promise<PGlite> {
  // Persist on disk so cron writes and page reads share one catalogue in local/dev.
  const dataDir = path.join(process.cwd(), ".data", "pglite");
  await mkdir(dataDir, { recursive: true });
  const db = new PGlite(dataDir);
  const dir = path.join(process.cwd(), "migrations");
  const files = (await readdir(dir).catch(() => [])).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    await db.exec(await readFile(path.join(dir, file), "utf8"));
  }
  return db;
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

function emptyBody(): EvidenceBody {
  return { what: "", where: "", when: "", how: "", why: "" };
}

function emptyRatings(): EvidenceRatings {
  return rateEvidence({
    sourceCount: 0,
    languages: [],
    sources: [],
    categorySlugs: [],
    lastSeenAt: new Date().toISOString(),
    firstSeenAt: new Date().toISOString(),
    hasArxiv: false,
    hasWikipedia: false,
    imageCount: 0,
  });
}

function rowToCategory(row: Record<string, unknown>): Category {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description ?? ""),
    sortOrder: Number(row.sort_order ?? 0),
    evidenceCount:
      row.evidence_count != null ? Number(row.evidence_count) : undefined,
  };
}

function rowToSource(row: Record<string, unknown>): EvidenceSource {
  return {
    id: String(row.id),
    evidenceId: String(row.evidence_id),
    url: String(row.url),
    title: String(row.title ?? ""),
    snippet: String(row.snippet ?? ""),
    language: String(row.language ?? "en"),
    publisher: String(row.publisher ?? ""),
    imageUrl: String(row.image_url ?? ""),
    fetchedAt: toIso(row.fetched_at),
  };
}

export async function ensureCategories(): Promise<void> {
  for (const cat of CATEGORIES) {
    await sql(
      `insert into categories (id, slug, name, description, sort_order)
       values ($1, $2, $3, $4, $5)
       on conflict (id) do update set
         slug = excluded.slug,
         name = excluded.name,
         description = excluded.description,
         sort_order = excluded.sort_order`,
      [cat.id, cat.slug, cat.name, cat.description, cat.sortOrder],
    );
  }
}

export async function listCategories(): Promise<Category[]> {
  await ensureCategories();
  const rows = await sql(
    `select c.*,
      (select count(*)::int from evidence_categories ec
        join evidence e on e.id = ec.evidence_id
        where ec.category_id = c.id and e.status = 'published') as evidence_count
     from categories c
     order by c.sort_order asc, c.name asc`,
  );
  return rows.map(rowToCategory);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const rows = await sql(
    `select c.*,
      (select count(*)::int from evidence_categories ec
        join evidence e on e.id = ec.evidence_id
        where ec.category_id = c.id and e.status = 'published') as evidence_count
     from categories c where c.slug = $1 limit 1`,
    [slug],
  );
  return rows[0] ? rowToCategory(rows[0]) : null;
}

async function categoriesForEvidence(evidenceId: string): Promise<Category[]> {
  const rows = await sql(
    `select c.* from categories c
     join evidence_categories ec on ec.category_id = c.id
     where ec.evidence_id = $1
     order by c.sort_order asc`,
    [evidenceId],
  );
  return rows.map(rowToCategory);
}

async function sourcesForEvidence(evidenceId: string): Promise<EvidenceSource[]> {
  const rows = await sql(
    `select * from evidence_sources where evidence_id = $1 order by fetched_at desc`,
    [evidenceId],
  );
  return rows.map(rowToSource);
}

async function hydrateEvidence(row: Record<string, unknown>): Promise<Evidence> {
  const id = String(row.id);
  const categories = await categoriesForEvidence(id);
  const sources = await sourcesForEvidence(id);
  const body: EvidenceBody = {
    what: String(row.body_what ?? ""),
    where: String(row.body_where ?? ""),
    when: String(row.body_when ?? ""),
    how: String(row.body_how ?? ""),
    why: String(row.body_why ?? ""),
  };
  const title = String(row.title);
  const images = filterHdRelevantImages(parseJson<EvidenceImage[]>(row.images, []), {
    topicHint: title,
  });
  const draft: Evidence = {
    id,
    slug: String(row.slug),
    title,
    caption: String(row.caption || row.summary || row.title),
    summary: String(row.summary),
    detail: String(row.detail ?? ""),
    body: body.what ? body : { ...emptyBody(), what: String(row.summary ?? "") },
    images,
    ratings: emptyRatings(),
    translations: parseJson(row.translations, {}),
    fingerprint: String(row.fingerprint),
    language: String(row.language ?? "en"),
    languages: parseJson(row.languages, ["en"]),
    sourceCount: Number(row.source_count ?? 1),
    firstSeenAt: toIso(row.first_seen_at),
    lastSeenAt: toIso(row.last_seen_at),
    status: String(row.status ?? "published") as Evidence["status"],
    categories,
    sources,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
  // Always recompute from live sources/categories — never surface a made-up or stale score.
  draft.ratings = rateFromEvidence(draft);
  return draft;
}

export async function countUniqueEvidence(): Promise<number> {
  const rows = await sql<{ count: string }>(
    `select count(*)::text as count from evidence where status = 'published'`,
  );
  return Number(rows[0]?.count ?? 0);
}

export async function listEvidence(options?: {
  categorySlug?: string;
  limit?: number;
  offset?: number;
  locale?: string;
}): Promise<Evidence[]> {
  const limit = Math.min(Math.max(options?.limit ?? 48, 1), 200);
  const offset = Math.max(options?.offset ?? 0, 0);
  let rows: Record<string, unknown>[];
  if (options?.categorySlug) {
    rows = await sql(
      `select e.* from evidence e
       join evidence_categories ec on ec.evidence_id = e.id
       join categories c on c.id = ec.category_id
       where e.status = 'published' and c.slug = $1
       order by e.last_seen_at desc
       limit $2 offset $3`,
      [options.categorySlug, limit, offset],
    );
  } else {
    rows = await sql(
      `select * from evidence where status = 'published'
       order by last_seen_at desc
       limit $1 offset $2`,
      [limit, offset],
    );
  }
  const all = await Promise.all(rows.map(hydrateEvidence));
  if (!options?.locale) return all;
  return all.filter((e) => evidenceAvailableInLocale(e, options.locale!));
}

export function evidenceAvailableInLocale(evidence: Evidence, locale: string): boolean {
  if (locale === "en") return true;
  if (evidence.language === locale) return true;
  if (evidence.translations[locale]?.caption) return true;
  return evidence.languages.includes(locale);
}

export async function getEvidenceBySlug(slug: string): Promise<Evidence | null> {
  const rows = await sql(`select * from evidence where slug = $1 limit 1`, [slug]);
  return rows[0] ? hydrateEvidence(rows[0]) : null;
}

export async function listPublishedLite(): Promise<
  Array<{ id: string; title: string; summary: string; fingerprint: string; slug: string }>
> {
  const rows = await sql(
    `select id, title, summary, fingerprint, slug from evidence where status = 'published'`,
  );
  return rows.map((r) => ({
    id: String(r.id),
    title: String(r.title),
    summary: String(r.summary),
    fingerprint: String(r.fingerprint),
    slug: String(r.slug),
  }));
}

export async function insertEvidence(input: {
  title: string;
  summary: string;
  detail: string;
  caption: string;
  body: EvidenceBody;
  images: EvidenceImage[];
  ratings: EvidenceRatings;
  translations: Record<string, EvidenceLocalePack>;
  fingerprint: string;
  language: string;
  languages: string[];
  categoryIds: string[];
  source: {
    url: string;
    title: string;
    snippet: string;
    language: string;
    publisher: string;
    imageUrl?: string;
  };
}): Promise<Evidence> {
  const id = randomUUID();
  const ascii = input.title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const idCompact = id.replace(/-/g, "");
  let slug =
    ascii.length >= 4
      ? ascii
      : `evidence-${input.language || "xx"}-${idCompact.slice(0, 10)}`;
  const clash = await sql(`select 1 from evidence where slug = $1 limit 1`, [slug]);
  if (clash.length) slug = `${slug}-${idCompact.slice(0, 6)}`;

  const now = new Date().toISOString();
  await sql(
    `insert into evidence (
      id, slug, title, summary, detail, caption,
      body_what, body_where, body_when, body_how, body_why,
      images, ratings, translations,
      fingerprint, language, languages,
      source_count, first_seen_at, last_seen_at, status, created_at, updated_at
    ) values (
      $1,$2,$3,$4,$5,$6,
      $7,$8,$9,$10,$11,
      $12::jsonb,$13::jsonb,$14::jsonb,
      $15,$16,$17::jsonb,
      1,$18,$18,'published',$18,$18
    )`,
    [
      id,
      slug,
      input.title,
      input.summary,
      input.detail,
      input.caption,
      input.body.what,
      input.body.where,
      input.body.when,
      input.body.how,
      input.body.why,
      JSON.stringify(input.images),
      JSON.stringify(input.ratings),
      JSON.stringify(input.translations),
      input.fingerprint,
      input.language,
      JSON.stringify(input.languages),
      now,
    ],
  );

  for (const categoryId of input.categoryIds) {
    await sql(
      `insert into evidence_categories (evidence_id, category_id)
       values ($1, $2) on conflict do nothing`,
      [id, categoryId],
    );
  }

  await sql(
    `insert into evidence_sources (
      id, evidence_id, url, title, snippet, language, publisher, image_url, fetched_at
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    on conflict (evidence_id, url) do nothing`,
    [
      randomUUID(),
      id,
      input.source.url,
      input.source.title,
      input.source.snippet,
      input.source.language,
      input.source.publisher,
      input.source.imageUrl ?? "",
      now,
    ],
  );

  const created = await getEvidenceBySlug(slug);
  if (!created) throw new Error("Failed to load inserted evidence");
  return created;
}

export async function mergeIntoEvidence(input: {
  evidenceId: string;
  language?: string;
  categoryIds: string[];
  source: {
    url: string;
    title: string;
    snippet: string;
    language: string;
    publisher: string;
    imageUrl?: string;
  };
  detailAppend?: string;
  images?: EvidenceImage[];
  translation?: { locale: string; pack: EvidenceLocalePack };
}): Promise<Evidence | null> {
  const rows = await sql(`select * from evidence where id = $1 limit 1`, [
    input.evidenceId,
  ]);
  if (!rows[0]) return null;
  const existing = rows[0];
  const languages = new Set(parseJson<string[]>(existing.languages, ["en"]));
  if (input.language) languages.add(input.language);
  if (input.source.language) languages.add(input.source.language);

  const now = new Date().toISOString();
  let detail = String(existing.detail ?? "");
  if (input.detailAppend && !detail.includes(input.detailAppend.slice(0, 80))) {
    detail = detail ? `${detail}\n\n${input.detailAppend}` : input.detailAppend;
  }

  const images = filterHdRelevantImages(
    [
      ...parseJson<EvidenceImage[]>(existing.images, []),
      ...(input.images ?? []),
    ],
    { topicHint: String(existing.title ?? existing.caption ?? "") },
  );

  const translations = parseJson<Record<string, EvidenceLocalePack>>(
    existing.translations,
    {},
  );
  if (input.translation) {
    translations[input.translation.locale] = input.translation.pack;
  }

  const sourceCount = Number(existing.source_count ?? 1) + 1;
  const categories = await categoriesForEvidence(input.evidenceId);
  const ratings = rateEvidence({
    sourceCount,
    languages: [...languages],
    sources: [
      ...(await sourcesForEvidence(input.evidenceId)).map((s) => ({
        publisher: s.publisher,
        url: s.url,
        language: s.language,
      })),
      {
        publisher: input.source.publisher,
        url: input.source.url,
        language: input.source.language,
      },
    ],
    categorySlugs: [
      ...new Set([
        ...categories.map((c) => c.slug),
        // category ids already linked; slugs from existing cats only
      ]),
    ],
    lastSeenAt: now,
    firstSeenAt: toIso(existing.first_seen_at),
    hasArxiv:
      input.source.url.includes("arxiv.org") ||
      String(existing.detail ?? "").includes("arxiv"),
    hasWikipedia:
      input.source.url.includes("wikipedia.org") ||
      images.some((i) => i.credit.includes("Wikipedia")),
    imageCount: images.length,
  });

  await sql(
    `update evidence set
      languages = $2::jsonb,
      source_count = $3,
      last_seen_at = $4,
      detail = $5,
      images = $6::jsonb,
      ratings = $7::jsonb,
      translations = $8::jsonb,
      updated_at = $4
     where id = $1`,
    [
      input.evidenceId,
      JSON.stringify([...languages]),
      sourceCount,
      now,
      detail,
      JSON.stringify(images),
      JSON.stringify(ratings),
      JSON.stringify(translations),
    ],
  );

  for (const categoryId of input.categoryIds) {
    await sql(
      `insert into evidence_categories (evidence_id, category_id)
       values ($1, $2) on conflict do nothing`,
      [input.evidenceId, categoryId],
    );
  }

  await sql(
    `insert into evidence_sources (
      id, evidence_id, url, title, snippet, language, publisher, image_url, fetched_at
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    on conflict (evidence_id, url) do update set
      title = excluded.title,
      snippet = excluded.snippet,
      image_url = excluded.image_url,
      fetched_at = excluded.fetched_at`,
    [
      randomUUID(),
      input.evidenceId,
      input.source.url,
      input.source.title,
      input.source.snippet,
      input.source.language,
      input.source.publisher,
      input.source.imageUrl ?? "",
      now,
    ],
  );

  return getEvidenceBySlug(String(existing.slug));
}

export async function recordScanRun(
  result: Omit<ScanResult, "uniqueTotal">,
): Promise<void> {
  await sql(
    `insert into scan_runs (
      id, started_at, finished_at, candidates, merged, inserted, source, notes,
      sources_scanned, relevant_sourced, schedule_label
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      result.runId,
      result.startedAt,
      result.finishedAt,
      result.candidates,
      result.merged,
      result.inserted,
      result.source,
      result.notes,
      result.sourcesScanned ?? result.candidates,
      result.relevantSourced ?? result.inserted + result.merged,
      result.scheduleLabel ?? "",
    ],
  );
}

export async function listScanRuns(limit = 60): Promise<
  Array<{
    id: string;
    startedAt: string;
    finishedAt: string;
    candidates: number;
    merged: number;
    inserted: number;
    sourcesScanned: number;
    relevantSourced: number;
    source: string;
    notes: string;
    scheduleLabel: string;
  }>
> {
  const rows = await sql(
    `select * from scan_runs order by finished_at desc limit $1`,
    [limit],
  );
  return rows.map((r) => ({
    id: String(r.id),
    startedAt: toIso(r.started_at),
    finishedAt: toIso(r.finished_at),
    candidates: Number(r.candidates ?? 0),
    merged: Number(r.merged ?? 0),
    inserted: Number(r.inserted ?? 0),
    sourcesScanned: Number(r.sources_scanned ?? r.candidates ?? 0),
    relevantSourced: Number(r.relevant_sourced ?? 0),
    source: String(r.source ?? ""),
    notes: String(r.notes ?? ""),
    scheduleLabel: String(r.schedule_label ?? ""),
  }));
}

export async function getCatalogueStats(): Promise<CatalogueStats> {
  const uniqueEvidence = await countUniqueEvidence();
  const catRows = await sql<{ count: string }>(
    `select count(*)::text as count from categories`,
  );
  const sourceRows = await sql<{ count: string }>(
    `select count(*)::text as count from evidence_sources`,
  );
  const langRaw = await sql<{ languages: unknown }>(
    `select languages from evidence where status = 'published'`,
  );
  const langSet = new Set<string>();
  for (const row of langRaw) {
    for (const lang of parseJson<string[]>(row.languages, [])) langSet.add(lang);
  }
  const scanRows = await sql(
    `select finished_at, inserted, merged, sources_scanned, relevant_sourced
     from scan_runs order by finished_at desc limit 1`,
  );
  return {
    uniqueEvidence,
    categoryCount: Number(catRows[0]?.count ?? 0),
    sourceCount: Number(sourceRows[0]?.count ?? 0),
    languageCount: langSet.size,
    lastScanAt: scanRows[0] ? toIso(scanRows[0].finished_at) : null,
    lastScanInserted: scanRows[0] ? Number(scanRows[0].inserted) : 0,
    lastScanMerged: scanRows[0] ? Number(scanRows[0].merged) : 0,
    lastSourcesScanned: scanRows[0] ? Number(scanRows[0].sources_scanned ?? 0) : 0,
    lastRelevantSourced: scanRows[0] ? Number(scanRows[0].relevant_sourced ?? 0) : 0,
  };
}

export async function categoryIdsBySlugs(slugs: string[]): Promise<string[]> {
  await ensureCategories();
  const ids: string[] = [];
  for (const slug of slugs) {
    const rows = await sql<{ id: string }>(
      `select id from categories where slug = $1 limit 1`,
      [slug],
    );
    if (rows[0]) ids.push(rows[0].id);
  }
  return ids;
}

export { emptyBody, emptyRatings };
