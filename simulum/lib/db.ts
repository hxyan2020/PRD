import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import { CATEGORIES } from "@/lib/data/categories";
import type {
  CatalogueStats,
  Category,
  Evidence,
  EvidenceSource,
  ScanResult,
} from "@/lib/types";

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
let pool: pg.Pool | undefined;
let local: Promise<PGlite> | undefined;

export async function sql<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  if (databaseUrl !== "") {
    pool ??= new pg.Pool({ connectionString: databaseUrl, max: 5 });
    return (await pool.query(text, params)).rows as T[];
  }
  local ??= startLocal().catch((error: unknown) => {
    local = undefined;
    throw error;
  });
  return (await (await local).query<T>(text, params)).rows;
}

async function startLocal(): Promise<PGlite> {
  const db = new PGlite();
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
  return {
    id,
    slug: String(row.slug),
    title: String(row.title),
    summary: String(row.summary),
    detail: String(row.detail ?? ""),
    fingerprint: String(row.fingerprint),
    language: String(row.language ?? "en"),
    languages: parseJson(row.languages, ["en"]),
    sourceCount: Number(row.source_count ?? 1),
    firstSeenAt: toIso(row.first_seen_at),
    lastSeenAt: toIso(row.last_seen_at),
    status: String(row.status ?? "published") as Evidence["status"],
    categories: await categoriesForEvidence(id),
    sources: await sourcesForEvidence(id),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
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
  return Promise.all(rows.map(hydrateEvidence));
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
  let slug =
    ascii.length >= 4
      ? ascii
      : `evidence-${input.language || "xx"}-${id.slice(0, 10)}`;
  const clash = await sql(`select 1 from evidence where slug = $1 limit 1`, [slug]);
  if (clash.length) slug = `${slug}-${id.slice(0, 6)}`;

  const now = new Date().toISOString();
  await sql(
    `insert into evidence (
      id, slug, title, summary, detail, fingerprint, language, languages,
      source_count, first_seen_at, last_seen_at, status, created_at, updated_at
    ) values (
      $1,$2,$3,$4,$5,$6,$7,$8::jsonb,1,$9,$9,'published',$9,$9
    )`,
    [
      id,
      slug,
      input.title,
      input.summary,
      input.detail,
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
      id, evidence_id, url, title, snippet, language, publisher, fetched_at
    ) values ($1,$2,$3,$4,$5,$6,$7,$8)
    on conflict (evidence_id, url) do nothing`,
    [
      randomUUID(),
      id,
      input.source.url,
      input.source.title,
      input.source.snippet,
      input.source.language,
      input.source.publisher,
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
  };
  detailAppend?: string;
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

  await sql(
    `update evidence set
      languages = $2::jsonb,
      source_count = source_count + 1,
      last_seen_at = $3,
      detail = $4,
      updated_at = $3
     where id = $1`,
    [input.evidenceId, JSON.stringify([...languages]), now, detail],
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
      id, evidence_id, url, title, snippet, language, publisher, fetched_at
    ) values ($1,$2,$3,$4,$5,$6,$7,$8)
    on conflict (evidence_id, url) do update set
      title = excluded.title,
      snippet = excluded.snippet,
      fetched_at = excluded.fetched_at`,
    [
      randomUUID(),
      input.evidenceId,
      input.source.url,
      input.source.title,
      input.source.snippet,
      input.source.language,
      input.source.publisher,
      now,
    ],
  );

  const slug = String(existing.slug);
  return getEvidenceBySlug(slug);
}

export async function recordScanRun(result: Omit<ScanResult, "uniqueTotal">): Promise<void> {
  await sql(
    `insert into scan_runs (
      id, started_at, finished_at, candidates, merged, inserted, source, notes
    ) values ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      result.runId,
      result.startedAt,
      result.finishedAt,
      result.candidates,
      result.merged,
      result.inserted,
      result.source,
      result.notes,
    ],
  );
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
    `select finished_at, inserted, merged from scan_runs order by finished_at desc limit 1`,
  );
  return {
    uniqueEvidence,
    categoryCount: Number(catRows[0]?.count ?? 0),
    sourceCount: Number(sourceRows[0]?.count ?? 0),
    languageCount: langSet.size,
    lastScanAt: scanRows[0] ? toIso(scanRows[0].finished_at) : null,
    lastScanInserted: scanRows[0] ? Number(scanRows[0].inserted) : 0,
    lastScanMerged: scanRows[0] ? Number(scanRows[0].merged) : 0,
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
