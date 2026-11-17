import type Database from "better-sqlite3";

/** Extend AI schema with detectors, spine events, interventions, daily metrics. */
export function ensureSpineSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS detectors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      product TEXT NOT NULL,
      domain_code TEXT NOT NULL,
      monitor_id TEXT NOT NULL,
      warn_threshold REAL,
      breach_threshold REAL,
      comparator TEXT NOT NULL DEFAULT 'gte',
      enabled INTEGER NOT NULL DEFAULT 1,
      last_run_at TEXT,
      last_status TEXT NOT NULL DEFAULT 'IDLE',
      last_value REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS detector_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      detector_id INTEGER NOT NULL,
      observed_value REAL,
      status TEXT NOT NULL,
      severity TEXT,
      alert_id INTEGER,
      analysis_id INTEGER,
      detail_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (detector_id) REFERENCES detectors(id)
    );

    CREATE TABLE IF NOT EXISTS spine_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id TEXT NOT NULL UNIQUE,
      stage TEXT NOT NULL,
      product TEXT,
      ref_type TEXT,
      ref_id TEXT,
      severity TEXT,
      title TEXT NOT NULL,
      detail_json TEXT NOT NULL DEFAULT '{}',
      actor TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS interventions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skill_run_id INTEGER NOT NULL UNIQUE,
      analysis_id INTEGER NOT NULL,
      action_code TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      requested_at TEXT NOT NULL DEFAULT (datetime('now')),
      decided_at TEXT,
      decided_by INTEGER,
      decision_note TEXT,
      FOREIGN KEY (skill_run_id) REFERENCES ai_skill_runs(id),
      FOREIGN KEY (analysis_id) REFERENCES ai_analyses(id)
    );

    CREATE TABLE IF NOT EXISTS daily_performance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_date TEXT NOT NULL,
      product TEXT NOT NULL,
      metric_key TEXT NOT NULL,
      metric_label TEXT NOT NULL,
      value REAL NOT NULL,
      unit TEXT,
      target REAL,
      status TEXT NOT NULL DEFAULT 'OK',
      notes TEXT,
      UNIQUE(report_date, product, metric_key)
    );

    CREATE INDEX IF NOT EXISTS idx_spine_events_stage ON spine_events(stage, created_at);
    CREATE INDEX IF NOT EXISTS idx_daily_perf_date ON daily_performance(report_date, product);
  `);

  // Ensure skill_runs can be updated for intervention decisions
  try {
    db.exec(`ALTER TABLE ai_skill_runs ADD COLUMN decided_by INTEGER`);
  } catch {
    /* column may exist */
  }
  try {
    db.exec(`ALTER TABLE ai_skill_runs ADD COLUMN decided_at TEXT`);
  } catch {
    /* column may exist */
  }
  try {
    db.exec(`ALTER TABLE ai_skill_runs ADD COLUMN decision_note TEXT`);
  } catch {
    /* column may exist */
  }
}
