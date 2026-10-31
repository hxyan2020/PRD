export const SQL_MAX_ROWS = 500;
export const SQL_STATEMENT_MAX_CHARS = 8_000;

/** Internal FTS shadow tables — still queryable, but hidden from the default catalog. */
export const HIDDEN_TABLE_PREFIXES = ["rag_fts_", "sqlite_"];

export type SqlColumn = {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
};

export type SqlTableInfo = {
  name: string;
  type: "table" | "view";
  rowCount: number;
  columns: SqlColumn[];
  createSql: string | null;
};

export type SqlQueryResult = {
  columns: string[];
  rows: Array<Record<string, unknown>>;
  rowCount: number;
  truncated: boolean;
  ms: number;
  sql: string;
};

const WRITE_RE =
  /\b(INSERT|UPDATE|DELETE|REPLACE|DROP|ALTER|CREATE|ATTACH|DETACH|VACUUM|REINDEX|ANALYZE|TRUNCATE|GRANT|REVOKE|INTO|PRAGMA\s+(?!table_info|table_list|index_list|index_info|database_list)\w+)\b/i;

export function stripSqlComments(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function assertReadOnlySql(raw: string): string {
  const sql = String(raw || "").trim();
  if (!sql) throw new Error("Empty SQL");
  if (sql.length > SQL_STATEMENT_MAX_CHARS) throw new Error(`SQL exceeds ${SQL_STATEMENT_MAX_CHARS} characters`);
  const cleaned = stripSqlComments(sql);
  if (!cleaned) throw new Error("Empty SQL");
  const withoutTrailing = cleaned.replace(/;+\s*$/, "");
  if (withoutTrailing.includes(";")) throw new Error("Only a single SQL statement is allowed");
  const first = (withoutTrailing.match(/^\s*([A-Za-z]+)/) || [])[1]?.toUpperCase() || "";
  if (!["SELECT", "WITH", "EXPLAIN", "PRAGMA"].includes(first)) {
    throw new Error("Only SELECT / WITH / EXPLAIN / PRAGMA (table_info|index_*) are allowed");
  }
  if (WRITE_RE.test(withoutTrailing)) {
    throw new Error("Write or mutating statements are blocked on the simulated-data explorer");
  }
  return withoutTrailing;
}

export function maskSensitiveRows(columns: string[], rows: Array<Record<string, unknown>>) {
  const sensitive = new Set(columns.filter((c) => /password|secret|token|webhook|api[_-]?key/i.test(c)));
  if (!sensitive.size) return rows;
  return rows.map((row) => {
    const next = { ...row };
    for (const key of sensitive) {
      if (next[key] != null && next[key] !== "") next[key] = "***";
    }
    return next;
  });
}

export const SAMPLE_QUERIES: Array<{ id: string; en: string; "zh-Hant": string; sql: string }> = [
  {
    id: "monitors",
    en: "Monitor 2.0 indicators",
    "zh-Hant": "Monitor 2.0 指標",
    sql: `SELECT monitor_id, name, domain_code, product, status, last_value,
       threshold_warn, threshold_breach, paused
FROM monitor_indicators
ORDER BY domain_code, monitor_id
LIMIT 50;`,
  },
  {
    id: "open-alerts",
    en: "Open alerts + tickets",
    "zh-Hant": "未結警報與工單",
    sql: `SELECT a.alert_id, a.severity, a.title, a.status AS alert_status,
       t.ticket_id, t.status AS ticket_status, t.assignee_user_id, t.department_code
FROM monitor_alerts a
LEFT JOIN monitor_tickets t ON t.alert_id = a.id
WHERE a.status NOT IN ('RESOLVED','CLOSED','DISMISSED')
ORDER BY a.created_at DESC;`,
  },
  {
    id: "ai-analyses",
    en: "AI RCA analyses",
    "zh-Hant": "AI 根因分析",
    sql: `SELECT analysis_id, alert_id, indicator_monitor_id, status, confidence,
       challenged, challenge_verdict, summary, created_at
FROM ai_analyses
ORDER BY created_at DESC;`,
  },
  {
    id: "skills",
    en: "Skill playbooks",
    "zh-Hant": "技能劇本",
    sql: `SELECT code, name, owner_department, status, auto_execute, certainty_required
FROM ai_skills
ORDER BY owner_department, code
LIMIT 80;`,
  },
  {
    id: "messenger",
    en: "Messenger threads",
    "zh-Hant": "Messenger 執行緒",
    sql: `SELECT thread_id, channel_name, title, status, severity, alert_id, updated_at
FROM messenger_threads
ORDER BY updated_at DESC;`,
  },
  {
    id: "discovery",
    en: "Unknown-risk discovery candidates",
    "zh-Hant": "未知風險探索候選",
    sql: `SELECT candidate_id, method, scenario, severity, product, status,
       proposed_monitor_id, score, created_at
FROM risk_discovery_candidates
ORDER BY created_at DESC;`,
  },
  {
    id: "detector-runs",
    en: "Detector run history (Discovery spine)",
    "zh-Hant": "偵測器執行歷史（探索脊柱）",
    sql: `SELECT d.code, d.monitor_id, r.observed_value, r.status, r.severity, r.created_at
FROM detector_runs r
JOIN detectors d ON d.id = r.detector_id
ORDER BY r.id DESC
LIMIT 80;`,
  },
  {
    id: "l2-chains",
    en: "L2 scenario chains (aggregation)",
    "zh-Hant": "L2 情境鏈（聚合）",
    sql: `SELECT code, name, product, domain, severity, status, sequence_json, linked_skills_json
FROM risk_scenario_chains
ORDER BY code
LIMIT 40;`,
  },
  {
    id: "inc-1028",
    en: "INC-1028 pack (alert + RCA + thread)",
    "zh-Hant": "INC-1028 組合（警報＋RCA＋執行緒）",
    sql: `SELECT a.alert_id, a.title, a.status AS alert_status,
       an.analysis_id, an.confidence, an.status AS rca_status,
       t.thread_id, t.title AS thread_title
FROM monitor_alerts a
LEFT JOIN ai_analyses an ON an.alert_id = a.id
LEFT JOIN messenger_threads t ON t.alert_id = a.id
WHERE a.alert_id = 'ALT-INC-1028'
   OR an.analysis_id = 'AIA-INC-1028'
   OR t.thread_id = 'THR-INC-1028';`,
  },
  {
    id: "risk-log",
    en: "90-day risk log daily",
    "zh-Hant": "90 日風險日誌彙總",
    sql: `SELECT report_date, alerts_raised, breaches, warns, open_eod,
       loss_usd, prevented_usd, avg_resolve_minutes
FROM risk_log_daily
ORDER BY report_date DESC
LIMIT 30;`,
  },
  {
    id: "schema-users",
    en: "Schema: users (passwords masked)",
    "zh-Hant": "結構：users（密碼已遮罩）",
    sql: `SELECT id, email, name, role_code, department_code, team_id, status, password, created_at
FROM users
ORDER BY id;`,
  },
];
