import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import type { InvestigationCase, Severity } from "@/lib/types";

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

function parseRiskIds(v: unknown): number[] {
  if (Array.isArray(v)) return v.map(Number).filter((n) => !Number.isNaN(n));
  if (typeof v === "string") {
    try {
      return parseRiskIds(JSON.parse(v));
    } catch {
      return [];
    }
  }
  return [];
}

function rowToCase(row: Record<string, unknown>): InvestigationCase {
  return {
    id: String(row.id),
    title: String(row.title),
    symbol: String(row.symbol ?? ""),
    status: row.status as InvestigationCase["status"],
    severity: row.severity as Severity,
    notes: String(row.notes ?? ""),
    skillId: row.skill_id ? String(row.skill_id) : undefined,
    riskIds: parseRiskIds(row.risk_ids),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function toIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

export async function listCases(): Promise<InvestigationCase[]> {
  const rows = await sql("select * from investigation_cases order by updated_at desc");
  return rows.map((r) => rowToCase(r));
}

export async function createCase(input: {
  title: string;
  symbol?: string;
  severity?: Severity;
  notes?: string;
  skillId?: string;
  riskIds?: number[];
}): Promise<InvestigationCase> {
  const id = `case_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  await sql(
    `insert into investigation_cases
      (id, title, symbol, status, severity, notes, skill_id, risk_ids, created_at, updated_at)
     values ($1,$2,$3,'open',$4,$5,$6,$7::jsonb,$8,$8)`,
    [
      id,
      input.title,
      input.symbol ?? "",
      input.severity ?? "P1",
      input.notes ?? "",
      input.skillId ?? null,
      JSON.stringify(input.riskIds ?? []),
      now,
    ],
  );
  const rows = await sql("select * from investigation_cases where id = $1", [id]);
  return rowToCase(rows[0]!);
}

export async function updateCaseStatus(
  id: string,
  status: InvestigationCase["status"],
  notes?: string,
): Promise<InvestigationCase | null> {
  const now = new Date().toISOString();
  if (notes != null) {
    await sql(
      "update investigation_cases set status = $2, notes = $3, updated_at = $4 where id = $1",
      [id, status, notes, now],
    );
  } else {
    await sql("update investigation_cases set status = $2, updated_at = $3 where id = $1", [
      id,
      status,
      now,
    ]);
  }
  const rows = await sql("select * from investigation_cases where id = $1", [id]);
  return rows[0] ? rowToCase(rows[0]) : null;
}

export async function logRagQuery(question: string, locale: string, hitIds: string[]): Promise<void> {
  const id = `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  await sql(
    "insert into rag_queries (id, question, locale, hit_ids) values ($1,$2,$3,$4::jsonb)",
    [id, question, locale, JSON.stringify(hitIds)],
  );
}
