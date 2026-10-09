import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { StartupIdea } from "./types";

const DEFAULT_DB = path.join(process.cwd(), "data", "ventures.sqlite");

let instance: DatabaseSync | null = null;
let instancePath = "";

export function dbPath(): string {
  if (process.env.VENTURE_SCAN_DB) return process.env.VENTURE_SCAN_DB;
  if (process.env.VERCEL) return "/tmp/venture-scan.sqlite";
  return DEFAULT_DB;
}

export function getDb(file = dbPath()): DatabaseSync {
  if (instance && instancePath === file) return instance;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  instance = new DatabaseSync(file);
  instancePath = file;
  instance.exec(`
    CREATE TABLE IF NOT EXISTS startup_ideas (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      industry TEXT NOT NULL,
      sector TEXT NOT NULL,
      team_country TEXT NOT NULL,
      fundraising_secured INTEGER NOT NULL,
      payload TEXT NOT NULL,
      scanned_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ideas_industry ON startup_ideas(industry);
    CREATE INDEX IF NOT EXISTS idx_ideas_sector ON startup_ideas(sector);
    CREATE INDEX IF NOT EXISTS idx_ideas_country ON startup_ideas(team_country);
    CREATE INDEX IF NOT EXISTS idx_ideas_funding ON startup_ideas(fundraising_secured);
    CREATE TABLE IF NOT EXISTS scan_runs (
      id TEXT PRIMARY KEY,
      started_at TEXT NOT NULL,
      finished_at TEXT NOT NULL,
      inserted INTEGER NOT NULL,
      updated INTEGER NOT NULL,
      source TEXT NOT NULL
    );
  `);
  return instance;
}

export function resetDbForTests(): void {
  instance?.close();
  instance = null;
  instancePath = "";
}

export function upsertIdea(idea: StartupIdea): { inserted: boolean } {
  const db = getDb();
  const now = new Date().toISOString();
  const existing = db
    .prepare("SELECT id FROM startup_ideas WHERE slug = ?")
    .get(idea.slug) as { id: string } | undefined;

  db.prepare(
    `INSERT INTO startup_ideas
      (id, slug, name, industry, sector, team_country, fundraising_secured, payload, scanned_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(slug) DO UPDATE SET
       name=excluded.name,
       industry=excluded.industry,
       sector=excluded.sector,
       team_country=excluded.team_country,
       fundraising_secured=excluded.fundraising_secured,
       payload=excluded.payload,
       scanned_at=excluded.scanned_at,
       updated_at=excluded.updated_at`,
  ).run(
    existing?.id ?? idea.id,
    idea.slug,
    idea.name,
    idea.industry,
    idea.sector,
    idea.teamCountry,
    idea.fundraisingSecured ? 1 : 0,
    JSON.stringify(idea),
    idea.scannedAt,
    now,
  );

  return { inserted: !existing };
}

export function listIdeas(filters: {
  q?: string;
  industry?: string;
  sector?: string;
  country?: string;
  fundraising?: "yes" | "no" | "all";
} = {}): StartupIdea[] {
  const rows = getDb()
    .prepare("SELECT payload FROM startup_ideas ORDER BY scanned_at DESC")
    .all() as { payload: string }[];

  let ideas = rows.map((r) => JSON.parse(r.payload) as StartupIdea);

  if (filters.q) {
    const q = filters.q.toLowerCase();
    ideas = ideas.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.industry.toLowerCase().includes(q) ||
        i.sector.toLowerCase().includes(q) ||
        i.teamCountry.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }
  if (filters.industry) {
    ideas = ideas.filter((i) => i.industry === filters.industry);
  }
  if (filters.sector) {
    ideas = ideas.filter((i) => i.sector === filters.sector);
  }
  if (filters.country) {
    ideas = ideas.filter((i) => i.teamCountry === filters.country);
  }
  if (filters.fundraising === "yes") {
    ideas = ideas.filter((i) => i.fundraisingSecured);
  } else if (filters.fundraising === "no") {
    ideas = ideas.filter((i) => !i.fundraisingSecured);
  }

  return ideas;
}

export function getIdeaBySlug(slug: string): StartupIdea | undefined {
  const row = getDb()
    .prepare("SELECT payload FROM startup_ideas WHERE slug = ?")
    .get(slug) as { payload: string } | undefined;
  return row ? (JSON.parse(row.payload) as StartupIdea) : undefined;
}

export function countIdeas(): number {
  const row = getDb().prepare("SELECT COUNT(*) AS c FROM startup_ideas").get() as {
    c: number;
  };
  return row.c;
}

export function distinctValues(field: "industry" | "sector" | "team_country"): string[] {
  const col =
    field === "team_country" ? "team_country" : field === "industry" ? "industry" : "sector";
  const rows = getDb()
    .prepare(`SELECT DISTINCT ${col} AS v FROM startup_ideas ORDER BY v ASC`)
    .all() as { v: string }[];
  return rows.map((r) => r.v);
}

export function recordScanRun(input: {
  id: string;
  startedAt: string;
  finishedAt: string;
  inserted: number;
  updated: number;
  source: string;
}): void {
  getDb()
    .prepare(
      `INSERT INTO scan_runs (id, started_at, finished_at, inserted, updated, source)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.id,
      input.startedAt,
      input.finishedAt,
      input.inserted,
      input.updated,
      input.source,
    );
}

export function latestScanRun():
  | {
      id: string;
      started_at: string;
      finished_at: string;
      inserted: number;
      updated: number;
      source: string;
    }
  | undefined {
  return getDb()
    .prepare("SELECT * FROM scan_runs ORDER BY finished_at DESC LIMIT 1")
    .get() as
    | {
        id: string;
        started_at: string;
        finished_at: string;
        inserted: number;
        updated: number;
        source: string;
      }
    | undefined;
}
