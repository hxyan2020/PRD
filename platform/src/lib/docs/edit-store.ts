import type Database from "better-sqlite3";

export type AdminDocKey =
  | "TSD"
  | "PRD"
  | "USER_GUIDE"
  | "ECOSYSTEM"
  | "UAT"
  | "ROADMAP"
  | "URLS"
  | "OPEN_ISSUES"
  | "PROGRESS";

const KEYS = new Set<AdminDocKey>([
  "TSD",
  "PRD",
  "USER_GUIDE",
  "ECOSYSTEM",
  "UAT",
  "ROADMAP",
  "URLS",
  "OPEN_ISSUES",
  "PROGRESS",
]);

export function isAdminDocKey(raw: string): raw is AdminDocKey {
  return KEYS.has(raw as AdminDocKey);
}

export function ensureDocEditsSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_doc_edits (
      doc_key TEXT NOT NULL,
      locale TEXT NOT NULL,
      content TEXT NOT NULL,
      updated_by TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (doc_key, locale)
    );
  `);
}

export function getDocEdit(
  db: Database.Database,
  docKey: string,
  locale: string
): { content: string; updated_at: string; updated_by: string | null } | null {
  ensureDocEditsSchema(db);
  const row = db
    .prepare(`SELECT content, updated_at, updated_by FROM admin_doc_edits WHERE doc_key = ? AND locale = ?`)
    .get(docKey, locale) as { content: string; updated_at: string; updated_by: string | null } | undefined;
  return row ?? null;
}

export function upsertDocEdit(
  db: Database.Database,
  docKey: string,
  locale: string,
  content: string,
  updatedBy: string | null
) {
  ensureDocEditsSchema(db);
  db.prepare(
    `INSERT INTO admin_doc_edits (doc_key, locale, content, updated_by, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(doc_key, locale) DO UPDATE SET
       content = excluded.content,
       updated_by = excluded.updated_by,
       updated_at = datetime('now')`
  ).run(docKey, locale, content, updatedBy);
}

export function deleteDocEdit(db: Database.Database, docKey: string, locale: string) {
  ensureDocEditsSchema(db);
  db.prepare(`DELETE FROM admin_doc_edits WHERE doc_key = ? AND locale = ?`).run(docKey, locale);
}
