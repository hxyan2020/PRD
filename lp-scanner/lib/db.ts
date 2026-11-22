import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import { SEED_LPS } from "@/lib/data/seed-lps";
import type { LpRecord } from "@/lib/types";

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
let pool: pg.Pool | undefined;
let local: Promise<PGlite> | undefined;
let seeded = false;

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

function rowToLp(row: Record<string, unknown>): LpRecord {
  const parse = <T,>(v: unknown, fallback: T): T => {
    if (v == null) return fallback;
    if (typeof v === "string") {
      try {
        return JSON.parse(v) as T;
      } catch {
        return fallback;
      }
    }
    return v as T;
  };

  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    aliases: parse(row.aliases, [] as string[]),
    category: row.category as LpRecord["category"],
    usedByVantage: Boolean(row.used_by_vantage),
    regions: parse(row.regions, [] as string[]),
    hours: row.hours as LpRecord["hours"],
    assetClasses: parse(row.asset_classes, [] as LpRecord["assetClasses"]),
    products: parse(row.products, [] as string[]),
    costTier: row.cost_tier as LpRecord["costTier"],
    pricingQuality: Number(row.pricing_quality) as LpRecord["pricingQuality"],
    latencyProfile: row.latency_profile as LpRecord["latencyProfile"],
    regulation: parse(row.regulation, [] as string[]),
    strengths: parse(row.strengths, [] as string[]),
    weaknesses: parse(row.weaknesses, [] as string[]),
    bestFor: parse(row.best_for, [] as string[]),
    website: row.website ? String(row.website) : undefined,
    notes: String(row.notes ?? ""),
    kbBodyEn: String(row.kb_body_en ?? ""),
    kbBodyZh: String(row.kb_body_zh ?? ""),
    scoreHints: parse(row.score_hints, {
      gold: 50,
      fxMajors: 50,
      indices: 50,
      oil: 50,
      crypto: 50,
      asia: 50,
    }),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

async function ensureSeeded(): Promise<void> {
  if (seeded) return;
  const rows = await sql<{ count: string }>("select count(*)::text as count from lps");
  const count = Number(rows[0]?.count ?? 0);
  if (count === 0) {
    for (const lp of SEED_LPS) {
      await insertLp(lp);
    }
  }
  seeded = true;
}

export async function listLps(): Promise<LpRecord[]> {
  await ensureSeeded();
  const rows = await sql("select * from lps order by used_by_vantage desc, name asc");
  return rows.map((r) => rowToLp(r));
}

export async function getLp(id: string): Promise<LpRecord | null> {
  await ensureSeeded();
  const rows = await sql("select * from lps where id = $1 or slug = $1 limit 1", [id]);
  return rows[0] ? rowToLp(rows[0]) : null;
}

export async function insertLp(lp: LpRecord): Promise<LpRecord> {
  await sql(
    `insert into lps (
      id, slug, name, aliases, category, used_by_vantage, regions, hours,
      asset_classes, products, cost_tier, pricing_quality, latency_profile,
      regulation, strengths, weaknesses, best_for, website, notes,
      kb_body_en, kb_body_zh, score_hints, updated_at
    ) values (
      $1,$2,$3,$4::jsonb,$5,$6,$7::jsonb,$8,
      $9::jsonb,$10::jsonb,$11,$12,$13,
      $14::jsonb,$15::jsonb,$16::jsonb,$17::jsonb,$18,$19,
      $20,$21,$22::jsonb,$23
    )
    on conflict (id) do update set
      slug = excluded.slug,
      name = excluded.name,
      aliases = excluded.aliases,
      category = excluded.category,
      used_by_vantage = excluded.used_by_vantage,
      regions = excluded.regions,
      hours = excluded.hours,
      asset_classes = excluded.asset_classes,
      products = excluded.products,
      cost_tier = excluded.cost_tier,
      pricing_quality = excluded.pricing_quality,
      latency_profile = excluded.latency_profile,
      regulation = excluded.regulation,
      strengths = excluded.strengths,
      weaknesses = excluded.weaknesses,
      best_for = excluded.best_for,
      website = excluded.website,
      notes = excluded.notes,
      kb_body_en = excluded.kb_body_en,
      kb_body_zh = excluded.kb_body_zh,
      score_hints = excluded.score_hints,
      updated_at = excluded.updated_at
    `,
    [
      lp.id,
      lp.slug,
      lp.name,
      JSON.stringify(lp.aliases),
      lp.category,
      lp.usedByVantage,
      JSON.stringify(lp.regions),
      lp.hours,
      JSON.stringify(lp.assetClasses),
      JSON.stringify(lp.products),
      lp.costTier,
      lp.pricingQuality,
      lp.latencyProfile,
      JSON.stringify(lp.regulation),
      JSON.stringify(lp.strengths),
      JSON.stringify(lp.weaknesses),
      JSON.stringify(lp.bestFor),
      lp.website ?? null,
      lp.notes,
      lp.kbBodyEn,
      lp.kbBodyZh,
      JSON.stringify(lp.scoreHints),
      lp.updatedAt,
    ],
  );
  return lp;
}

export async function updateLp(id: string, patch: Partial<LpRecord>): Promise<LpRecord | null> {
  const existing = await getLp(id);
  if (!existing) return null;
  const next: LpRecord = {
    ...existing,
    ...patch,
    id: existing.id,
    updatedAt: new Date().toISOString(),
  };
  await insertLp(next);
  return next;
}

export async function deleteLp(id: string): Promise<boolean> {
  await ensureSeeded();
  await sql("delete from lps where id = $1", [id]);
  return true;
}
