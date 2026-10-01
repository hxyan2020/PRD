import type Database from "better-sqlite3";

export function ensureAiSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rag_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_key TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      product_scope TEXT NOT NULL DEFAULT 'CFD+CRYPTO',
      content TEXT NOT NULL,
      source_ref TEXT,
      tags_json TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ai_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      indicator_patterns_json TEXT NOT NULL,
      conditions_json TEXT NOT NULL,
      certainty_required INTEGER NOT NULL DEFAULT 1,
      steps_json TEXT NOT NULL,
      auto_execute INTEGER NOT NULL DEFAULT 1,
      owner_department TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS external_macro_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      event_time TEXT NOT NULL,
      impact TEXT NOT NULL,
      currencies_json TEXT NOT NULL DEFAULT '[]',
      instruments_json TEXT NOT NULL DEFAULT '[]',
      description TEXT NOT NULL,
      source_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ai_analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      analysis_id TEXT NOT NULL UNIQUE,
      alert_id INTEGER NOT NULL,
      indicator_monitor_id TEXT NOT NULL,
      mode TEXT NOT NULL,
      confidence REAL NOT NULL,
      skill_id INTEGER,
      summary TEXT NOT NULL,
      explanations_json TEXT NOT NULL DEFAULT '[]',
      actions_taken_json TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'COMPLETED',
      needs_human INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (alert_id) REFERENCES monitor_alerts(id),
      FOREIGN KEY (skill_id) REFERENCES ai_skills(id)
    );

    CREATE TABLE IF NOT EXISTS ai_analysis_evidence (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      analysis_id INTEGER NOT NULL,
      evidence_type TEXT NOT NULL,
      ref_id TEXT,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      url TEXT,
      score REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (analysis_id) REFERENCES ai_analyses(id)
    );

    CREATE TABLE IF NOT EXISTS ai_skill_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      analysis_id INTEGER NOT NULL,
      skill_id INTEGER NOT NULL,
      step_index INTEGER NOT NULL,
      action_code TEXT NOT NULL,
      status TEXT NOT NULL,
      detail_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (analysis_id) REFERENCES ai_analyses(id),
      FOREIGN KEY (skill_id) REFERENCES ai_skills(id)
    );
  `);

  // FTS index — rebuild safely
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS rag_fts USING fts5(
      title,
      content,
      tags,
      tokenize = 'porter'
    );
  `);
}
