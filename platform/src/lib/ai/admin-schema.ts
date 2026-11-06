import type Database from "better-sqlite3";

export function ensureAiAdminSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_change_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id TEXT NOT NULL UNIQUE,
      entity_type TEXT NOT NULL,
      action TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      payload_json TEXT NOT NULL DEFAULT '{}',
      before_json TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      proposed_by INTEGER NOT NULL,
      proposed_at TEXT NOT NULL DEFAULT (datetime('now')),
      decided_by INTEGER,
      decided_at TEXT,
      decision_note TEXT,
      FOREIGN KEY (proposed_by) REFERENCES users(id),
      FOREIGN KEY (decided_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS ai_training_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      model_name TEXT NOT NULL,
      dataset_label TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'QUEUED',
      accuracy REAL,
      precision_score REAL,
      recall_score REAL,
      f1_score REAL,
      samples INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      started_at TEXT,
      completed_at TEXT,
      created_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS ai_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      analysis_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      note TEXT,
      rated_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (analysis_id) REFERENCES ai_analyses(id),
      FOREIGN KEY (rated_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS ai_accuracy_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_date TEXT NOT NULL,
      skill_match_rate REAL NOT NULL,
      human_agree_rate REAL NOT NULL,
      feedback_correct_rate REAL NOT NULL,
      analyses_total INTEGER NOT NULL,
      interventions_approved INTEGER NOT NULL,
      interventions_rejected INTEGER NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(snapshot_date)
    );
  `);
}
