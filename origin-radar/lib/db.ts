import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { DeskActionKind } from "./desk";
import type { SourcedProduct } from "./storefront-types";

export type { DeskActionKind } from "./desk";

const DEFAULT_DB = path.join(process.cwd(), "data", "storefront.sqlite");

let instance: DatabaseSync | null = null;
let instancePath = "";

export function dbPath(): string {
  if (process.env.ORIGIN_RADAR_DB) return process.env.ORIGIN_RADAR_DB;
  if (process.env.VERCEL) return "/tmp/origin-radar-storefront.sqlite";
  return DEFAULT_DB;
}

export function getDb(file = dbPath()): DatabaseSync {
  if (instance && instancePath === file) return instance;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  instance = new DatabaseSync(file);
  instancePath = file;
  instance.exec(`
    CREATE TABLE IF NOT EXISTS sourced_products (
      id TEXT PRIMARY KEY,
      signal_slug TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,
      payload TEXT NOT NULL,
      generated_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sourced_slug ON sourced_products(signal_slug);
    CREATE TABLE IF NOT EXISTS desk_state (
      slug TEXT NOT NULL,
      action TEXT NOT NULL,
      day TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (slug, action)
    );
    CREATE TABLE IF NOT EXISTS hx_viewership (
      path TEXT PRIMARY KEY,
      hits INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  return instance;
}

export function resetDbForTests(): void {
  instance?.close();
  instance = null;
  instancePath = "";
}

export function upsertSourced(product: SourcedProduct): SourcedProduct {
  const db = getDb();
  const now = new Date().toISOString();
  const existing = db
    .prepare("SELECT id FROM sourced_products WHERE signal_slug = ?")
    .get(product.signalSlug) as { id: string } | undefined;
  const id = existing?.id ?? product.id;
  const saved: SourcedProduct = { ...product, id, updatedAt: now, generatedAt: product.generatedAt || now };
  db.prepare(
    `INSERT INTO sourced_products (id, signal_slug, status, payload, generated_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(signal_slug) DO UPDATE SET
       status=excluded.status,
       payload=excluded.payload,
       updated_at=excluded.updated_at`,
  ).run(id, saved.signalSlug, saved.status, JSON.stringify(saved), saved.generatedAt, saved.updatedAt);
  return saved;
}

export function listSourced(): SourcedProduct[] {
  const rows = getDb()
    .prepare("SELECT payload FROM sourced_products ORDER BY updated_at DESC")
    .all() as { payload: string }[];
  return rows.map((r) => JSON.parse(r.payload) as SourcedProduct);
}

export function getSourced(id: string): SourcedProduct | undefined {
  const row = getDb()
    .prepare("SELECT payload FROM sourced_products WHERE id = ?")
    .get(id) as { payload: string } | undefined;
  return row ? (JSON.parse(row.payload) as SourcedProduct) : undefined;
}

export function getSourcedBySlug(slug: string): SourcedProduct | undefined {
  const row = getDb()
    .prepare("SELECT payload FROM sourced_products WHERE signal_slug = ?")
    .get(slug) as { payload: string } | undefined;
  return row ? (JSON.parse(row.payload) as SourcedProduct) : undefined;
}

export function sourcedSlugMap(): Record<string, string> {
  const rows = getDb()
    .prepare("SELECT signal_slug, id FROM sourced_products")
    .all() as { signal_slug: string; id: string }[];
  return Object.fromEntries(rows.map((r) => [r.signal_slug, r.id]));
}

export function getDeskSnapshot(day: string): { collected: string[]; discarded: string[] } {
  const rows = getDb()
    .prepare("SELECT slug, action, day FROM desk_state")
    .all() as { slug: string; action: string; day: string }[];
  return {
    collected: rows.filter((r) => r.action === "collect").map((r) => r.slug),
    discarded: rows.filter((r) => r.action === "discard" && r.day === day).map((r) => r.slug),
  };
}

export function setDeskAction(slug: string, action: DeskActionKind, day: string): { collected: string[]; discarded: string[] } {
  const db = getDb();
  const now = new Date().toISOString();
  if (action === "collect") {
    db.prepare(
      `INSERT INTO desk_state (slug, action, day, updated_at) VALUES (?, 'collect', '*', ?)
       ON CONFLICT(slug, action) DO UPDATE SET updated_at=excluded.updated_at`,
    ).run(slug, now);
    db.prepare("DELETE FROM desk_state WHERE slug = ? AND action = 'discard'").run(slug);
  } else if (action === "uncollect") {
    db.prepare("DELETE FROM desk_state WHERE slug = ? AND action = 'collect'").run(slug);
  } else if (action === "discard") {
    db.prepare(
      `INSERT INTO desk_state (slug, action, day, updated_at) VALUES (?, 'discard', ?, ?)
       ON CONFLICT(slug, action) DO UPDATE SET day=excluded.day, updated_at=excluded.updated_at`,
    ).run(slug, day, now);
  } else if (action === "restore") {
    db.prepare("DELETE FROM desk_state WHERE slug = ? AND action = 'discard'").run(slug);
  }
  return getDeskSnapshot(day);
}

export function recordView(pathName: string): { path: string; hits: number } {
  const db = getDb();
  const now = new Date().toISOString();
  const clean = pathName.startsWith("/") ? pathName.slice(0, 200) : `/${pathName}`.slice(0, 200);
  db.prepare(
    `INSERT INTO hx_viewership (path, hits, updated_at) VALUES (?, 1, ?)
     ON CONFLICT(path) DO UPDATE SET hits = hits + 1, updated_at = excluded.updated_at`,
  ).run(clean, now);
  const row = db.prepare("SELECT path, hits FROM hx_viewership WHERE path = ?").get(clean) as {
    path: string;
    hits: number;
  };
  return row;
}

export function viewershipSummary(): { total: number; paths: { path: string; hits: number }[] } {
  const rows = getDb()
    .prepare("SELECT path, hits FROM hx_viewership ORDER BY hits DESC")
    .all() as { path: string; hits: number }[];
  return { total: rows.reduce((n, r) => n + r.hits, 0), paths: rows };
}
