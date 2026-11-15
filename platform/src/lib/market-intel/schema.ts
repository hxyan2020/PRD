import type Database from "better-sqlite3";

export function ensureMarketIntelSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS market_intel_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_key TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      channel_type TEXT NOT NULL,
      asset_classes_json TEXT NOT NULL DEFAULT '[]',
      url TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      last_scraped_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS market_intel_findings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      finding_id TEXT NOT NULL UNIQUE,
      event_title TEXT NOT NULL,
      event_summary TEXT NOT NULL,
      geography TEXT NOT NULL,
      severity TEXT NOT NULL,
      products_json TEXT NOT NULL,
      directions_json TEXT NOT NULL,
      sources_json TEXT NOT NULL,
      asset_classes_json TEXT NOT NULL DEFAULT '[]',
      fingerprint TEXT NOT NULL,
      scanned_at TEXT NOT NULL DEFAULT (datetime('now')),
      pushed_to_lark INTEGER NOT NULL DEFAULT 0,
      lark_message_id TEXT,
      alert_id INTEGER,
      status TEXT NOT NULL DEFAULT 'NEW',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS market_intel_scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scan_id TEXT NOT NULL UNIQUE,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      sources_checked INTEGER NOT NULL DEFAULT 0,
      findings_new INTEGER NOT NULL DEFAULT 0,
      findings_pushed INTEGER NOT NULL DEFAULT 0,
      high_impact_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'RUNNING',
      detail_json TEXT NOT NULL DEFAULT '{}',
      trigger_mode TEXT NOT NULL DEFAULT 'SCHEDULE'
    );

    CREATE TABLE IF NOT EXISTS market_intel_lark_outbox (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      finding_id TEXT NOT NULL,
      channel_chat_id TEXT NOT NULL,
      formatted_message TEXT NOT NULL,
      delivered INTEGER NOT NULL DEFAULT 0,
      mock INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      delivered_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_mi_findings_scanned ON market_intel_findings(scanned_at DESC);
    CREATE INDEX IF NOT EXISTS idx_mi_findings_fingerprint ON market_intel_findings(fingerprint);
  `);
}
