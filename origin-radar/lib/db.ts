import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { SourcedProduct } from "./storefront-types";

const DEFAULT_DB = path.join(process.cwd(), "data", "storefront.sqlite");

let instance: DatabaseSync | null = null;
let instancePath = "";

export function dbPath(): string {
  return process.env.ORIGIN_RADAR_DB ?? DEFAULT_DB;
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
