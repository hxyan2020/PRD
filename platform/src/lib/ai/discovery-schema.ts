import type Database from "better-sqlite3";

export function ensureDiscoverySchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS risk_discovery_candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id TEXT NOT NULL UNIQUE,
      method TEXT NOT NULL,
      scenario TEXT NOT NULL,
      proposed_indicator TEXT NOT NULL,
      proposed_dimension TEXT NOT NULL,
      proposed_monitor_id TEXT,
      proposed_skill_code TEXT,
      score REAL NOT NULL DEFAULT 0,
      relative_score REAL NOT NULL DEFAULT 0,
      severity TEXT NOT NULL DEFAULT 'WARN',
      product TEXT NOT NULL DEFAULT 'CFD',
      evidence_json TEXT NOT NULL DEFAULT '{}',
      window_start TEXT,
      window_end TEXT,
      fingerprint TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING_RO',
      change_request_id TEXT,
      skill_code TEXT,
      monitor_id TEXT,
      review_note TEXT,
      reviewed_by INTEGER,
      reviewed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS risk_discovery_scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scan_id TEXT NOT NULL UNIQUE,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      candidates_new INTEGER NOT NULL DEFAULT 0,
      candidates_total INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'RUNNING',
      trigger_mode TEXT NOT NULL DEFAULT 'PARALLEL',
      detail_json TEXT NOT NULL DEFAULT '{}',
      actor TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS risk_discovery_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id TEXT NOT NULL,
      action TEXT NOT NULL,
      reviewer_user_id INTEGER,
      reviewer_name TEXT NOT NULL,
      comment TEXT,
      candidate_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (reviewer_user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_rd_cand_status ON risk_discovery_candidates(status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_rd_cand_fp ON risk_discovery_candidates(fingerprint);
    CREATE INDEX IF NOT EXISTS idx_rd_scans_started ON risk_discovery_scans(started_at DESC);
  `);

  const upsert = db.prepare(
    `INSERT INTO platform_settings (key, value, description) VALUES (?, ?, ?)
     ON CONFLICT(key) DO NOTHING`
  );
  upsert.run(
    "discovery.enabled",
    "true",
    "Run unknown-risk discovery in parallel with detector spine (PENDING_RO → RO approve → skill + monitor)"
  );
  upsert.run(
    "discovery.auto_on_detectors",
    "true",
    "When true, POST run_detectors also runs discovery in parallel"
  );
}
