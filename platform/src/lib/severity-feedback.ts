import type Database from "better-sqlite3";
import { getDb, writeAudit } from "@/lib/db";
import {
  DEFAULT_ESCALATION_COEFFICIENTS,
  DEFAULT_ROUTE_CODE,
  parseCoefficients,
  type EscalationCoefficients,
} from "@/lib/escalation/match";

/** Monitor / incident severity as P0 (most severe) … P3 (watch). */
export type SeverityP = 0 | 1 | 2 | 3;

export const SEVERITY_P_LEVELS: Array<{
  p: SeverityP;
  ops: "CRITICAL" | "BREACH" | "WARN" | "INFO";
  en: string;
  zh: string;
  tone: string;
}> = [
  {
    p: 0,
    ops: "CRITICAL",
    en: "P0 · Firm-critical",
    zh: "P0 · 公司級危急",
    tone: "border-rose-300 bg-rose-50 text-rose-950",
  },
  {
    p: 1,
    ops: "BREACH",
    en: "P1 · Primary desk",
    zh: "P1 · 一線台",
    tone: "border-orange-300 bg-orange-50 text-orange-950",
  },
  {
    p: 2,
    ops: "WARN",
    en: "P2 · Secondary",
    zh: "P2 · 次級",
    tone: "border-amber-300 bg-amber-50 text-amber-950",
  },
  {
    p: 3,
    ops: "INFO",
    en: "P3 · Watch",
    zh: "P3 · 觀察",
    tone: "border-slate-300 bg-slate-50 text-slate-800",
  },
];

const OPS_TO_P: Record<string, SeverityP> = {
  CRITICAL: 0,
  BREACH: 1,
  WARN: 2,
  INFO: 3,
  HEALTHY: 3,
};

export function opsSeverityToP(severity: string | null | undefined): SeverityP {
  const key = String(severity || "WARN").toUpperCase();
  return OPS_TO_P[key] ?? 2;
}

export function pToOpsSeverity(p: SeverityP): string {
  return SEVERITY_P_LEVELS.find((x) => x.p === p)?.ops || "WARN";
}

export function ensureSeverityFeedbackSchema(db: Database.Database = getDb()) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS severity_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feedback_id TEXT NOT NULL UNIQUE,
      thread_id INTEGER,
      thread_code TEXT,
      analysis_id INTEGER,
      alert_id INTEGER,
      ai_severity TEXT NOT NULL,
      ai_p INTEGER NOT NULL,
      recommended_p INTEGER NOT NULL,
      recommended_ops TEXT NOT NULL,
      reason TEXT NOT NULL,
      rated_by INTEGER,
      rated_by_name TEXT,
      month_key TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_severity_feedback_month ON severity_feedback(month_key);
    CREATE INDEX IF NOT EXISTS idx_severity_feedback_created ON severity_feedback(created_at);
  `);
  // Extended columns for formula loop (reason checkboxes + weekly pack).
  const cols = db.prepare(`PRAGMA table_info(severity_feedback)`).all() as Array<{ name: string }>;
  const names = new Set(cols.map((c) => c.name));
  if (!names.has("reason_codes_json")) db.exec(`ALTER TABLE severity_feedback ADD COLUMN reason_codes_json TEXT`);
  if (!names.has("week_key")) db.exec(`ALTER TABLE severity_feedback ADD COLUMN week_key TEXT`);
  if (!names.has("formula_version")) db.exec(`ALTER TABLE severity_feedback ADD COLUMN formula_version TEXT`);
  if (!names.has("formula_p")) db.exec(`ALTER TABLE severity_feedback ADD COLUMN formula_p INTEGER`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_severity_feedback_week ON severity_feedback(week_key)`);
}

export function monthKey(d = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function isoWeekKey(d = new Date()): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function feedbackId() {
  return `SFB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export type SeverityFeedbackRow = {
  id: number;
  feedback_id: string;
  thread_id: number | null;
  thread_code: string | null;
  analysis_id: number | null;
  alert_id: number | null;
  ai_severity: string;
  ai_p: number;
  recommended_p: number;
  recommended_ops: string;
  reason: string;
  reason_codes_json?: string | null;
  rated_by: number | null;
  rated_by_name: string | null;
  month_key: string;
  week_key?: string | null;
  formula_version?: string | null;
  formula_p?: number | null;
  created_at: string;
};

export function submitSeverityRecommendation(input: {
  thread_id?: number | null;
  thread_code?: string | null;
  analysis_id?: number | null;
  alert_id?: number | null;
  ai_severity: string;
  recommended_p: SeverityP;
  reason: string;
  reason_codes?: string[];
  formula_version?: string | null;
  formula_p?: number | null;
  actor: { id?: number | null; name: string };
}): SeverityFeedbackRow {
  ensureSeverityFeedbackSchema();
  const db = getDb();
  const codes = Array.isArray(input.reason_codes)
    ? input.reason_codes.map((c) => String(c)).filter(Boolean)
    : [];
  const reason = input.reason.trim() || codes.join(", ");
  if ((!reason || reason.length < 3) && codes.length === 0) {
    throw new Error("Reason or reason codes required");
  }
  if (reason.length > 0 && reason.length < 3 && codes.length === 0) {
    throw new Error("Reason required (min 3 chars)");
  }
  if (![0, 1, 2, 3].includes(input.recommended_p)) throw new Error("recommended_p must be 0–3");

  const ai_p = opsSeverityToP(input.ai_severity);
  const recommended_ops = pToOpsSeverity(input.recommended_p);
  const id = feedbackId();
  const mk = monthKey();
  const wk = isoWeekKey();
  const reasonText =
    reason.length >= 3
      ? reason
      : codes.length
        ? `Reason codes: ${codes.join(", ")}`
        : reason;

  const info = db
    .prepare(
      `INSERT INTO severity_feedback
        (feedback_id, thread_id, thread_code, analysis_id, alert_id, ai_severity, ai_p,
         recommended_p, recommended_ops, reason, reason_codes_json, rated_by, rated_by_name,
         month_key, week_key, formula_version, formula_p)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      input.thread_id ?? null,
      input.thread_code ?? null,
      input.analysis_id ?? null,
      input.alert_id ?? null,
      String(input.ai_severity || "WARN").toUpperCase(),
      ai_p,
      input.recommended_p,
      recommended_ops,
      reasonText,
      codes.length ? JSON.stringify(codes) : null,
      input.actor.id ?? null,
      input.actor.name,
      mk,
      wk,
      input.formula_version ?? null,
      input.formula_p ?? null
    );

  writeAudit(input.actor, "SEVERITY_RECOMMEND", "severity_feedback", id, {
    ai_severity: input.ai_severity,
    ai_p,
    recommended_p: input.recommended_p,
    recommended_ops,
    reason: reasonText,
    reason_codes: codes,
    week_key: wk,
    thread_id: input.thread_id,
  });

  return db
    .prepare(`SELECT * FROM severity_feedback WHERE id = ?`)
    .get(Number(info.lastInsertRowid)) as SeverityFeedbackRow;
}

export function listSeverityFeedback(limit = 40, month?: string): SeverityFeedbackRow[] {
  ensureSeverityFeedbackSchema();
  const db = getDb();
  if (month) {
    return db
      .prepare(
        `SELECT * FROM severity_feedback WHERE month_key = ? ORDER BY id DESC LIMIT ?`
      )
      .all(month, limit) as SeverityFeedbackRow[];
  }
  return db
    .prepare(`SELECT * FROM severity_feedback ORDER BY id DESC LIMIT ?`)
    .all(limit) as SeverityFeedbackRow[];
}

export type MonthlyWeightSuggestion = {
  month_key: string;
  sample_count: number;
  upgrades: number;
  downgrades: number;
  same: number;
  p_histogram: Record<"P0" | "P1" | "P2" | "P3", number>;
  current_coefficients: EscalationCoefficients;
  suggested_coefficients: EscalationCoefficients;
  delta: EscalationCoefficients;
  rationale_en: string;
  rationale_zh: string;
  applied: boolean;
  applied_at: string | null;
};

function clampCoeff(n: number): number {
  return Math.round(Math.min(2.5, Math.max(0.4, n)) * 100) / 100;
}

export function getMonthlyWeightSuggestion(month?: string): MonthlyWeightSuggestion {
  ensureSeverityFeedbackSchema();
  const db = getDb();
  const mk = month || monthKey();
  const rows = db
    .prepare(`SELECT * FROM severity_feedback WHERE month_key = ? ORDER BY id DESC`)
    .all(mk) as SeverityFeedbackRow[];

  let current = { ...DEFAULT_ESCALATION_COEFFICIENTS };
  try {
    const route = db
      .prepare(
        `SELECT coefficients_json FROM escalation_routes
         WHERE route_code = ? OR is_default = 1
         ORDER BY is_default DESC LIMIT 1`
      )
      .get(DEFAULT_ROUTE_CODE) as { coefficients_json: string } | undefined;
    if (route) current = parseCoefficients(route.coefficients_json);
  } catch {
    /* cold start */
  }

  const hist = { P0: 0, P1: 0, P2: 0, P3: 0 };
  let upgrades = 0;
  let downgrades = 0;
  let same = 0;
  let severityDelta = 0;
  let humanDelta = 0;

  for (const r of rows) {
    const key = `P${r.recommended_p}` as keyof typeof hist;
    if (key in hist) hist[key] += 1;
    const diff = r.ai_p - r.recommended_p; // positive => human wants more severe
    if (diff > 0) {
      upgrades += 1;
      severityDelta += 0.08 * diff;
      if (r.recommended_p <= 1) humanDelta += 0.05;
    } else if (diff < 0) {
      downgrades += 1;
      severityDelta -= 0.06 * Math.abs(diff);
    } else {
      same += 1;
    }
  }

  const suggested: EscalationCoefficients = {
    severity: clampCoeff(current.severity + severityDelta),
    involved_teams: clampCoeff(current.involved_teams + (upgrades > downgrades ? 0.03 : 0)),
    risk_scenario: clampCoeff(current.risk_scenario + (hist.P0 + hist.P1 > hist.P2 + hist.P3 ? 0.04 : 0)),
    pending_time: clampCoeff(current.pending_time),
    need_human_intervention: clampCoeff(current.need_human_intervention + humanDelta),
  };

  const appliedRow = db
    .prepare(`SELECT value FROM platform_settings WHERE key = ?`)
    .get(`severity.weights.applied.${mk}`) as { value: string } | undefined;

  const rationale_en =
    rows.length === 0
      ? `No P0–P3 severity re-recommendations this month (${mk}). Coefficients stay at the current ESC-DEFAULT pack.`
      : `From ${rows.length} Lark AI-report severity re-recommendations in ${mk}: ${upgrades} upgrade(s), ${downgrades} downgrade(s), ${same} confirm(s). Suggested severity weight ${current.severity} → ${suggested.severity}; need-human ${current.need_human_intervention} → ${suggested.need_human_intervention}.`;

  const rationale_zh =
    rows.length === 0
      ? `本月（${mk}）尚無 P0–P3 嚴重度重推薦。係數維持目前 ESC-DEFAULT 組合。`
      : `本月（${mk}）自 Lark AI 事故報告收集 ${rows.length} 則嚴重度重推薦：升級 ${upgrades}、降級 ${downgrades}、維持 ${same}。建議嚴重度權重 ${current.severity} → ${suggested.severity}；需人工干預 ${current.need_human_intervention} → ${suggested.need_human_intervention}。`;

  return {
    month_key: mk,
    sample_count: rows.length,
    upgrades,
    downgrades,
    same,
    p_histogram: hist,
    current_coefficients: current,
    suggested_coefficients: suggested,
    delta: {
      severity: clampCoeff(suggested.severity - current.severity + 1) - 1,
      involved_teams: clampCoeff(suggested.involved_teams - current.involved_teams + 1) - 1,
      risk_scenario: clampCoeff(suggested.risk_scenario - current.risk_scenario + 1) - 1,
      pending_time: 0,
      need_human_intervention:
        clampCoeff(suggested.need_human_intervention - current.need_human_intervention + 1) - 1,
    },
    rationale_en,
    rationale_zh,
    applied: Boolean(appliedRow?.value),
    applied_at: appliedRow?.value || null,
  };
}

export function applyMonthlyWeightSuggestion(input: {
  actor: { id?: number | null; name: string };
  month?: string;
}): MonthlyWeightSuggestion {
  ensureSeverityFeedbackSchema();
  const db = getDb();
  const suggestion = getMonthlyWeightSuggestion(input.month);
  if (suggestion.sample_count === 0) {
    throw new Error("No severity feedback this month — nothing to apply");
  }

  const coeffsJson = JSON.stringify(suggestion.suggested_coefficients);
  db.prepare(
    `UPDATE escalation_routes
     SET coefficients_json = ?
     WHERE route_code = ? OR is_default = 1`
  ).run(coeffsJson, DEFAULT_ROUTE_CODE);

  const appliedAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO platform_settings (key, value, description) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
  ).run(
    `severity.weights.applied.${suggestion.month_key}`,
    appliedAt,
    "Timestamp when monthly P0–P3 severity weight suggestion was applied to ESC-DEFAULT"
  );

  writeAudit(input.actor, "SEVERITY_WEIGHTS_APPLY", "escalation_routes", DEFAULT_ROUTE_CODE, {
    month_key: suggestion.month_key,
    sample_count: suggestion.sample_count,
    suggested: suggestion.suggested_coefficients,
  });

  return getMonthlyWeightSuggestion(suggestion.month_key);
}

/** Demo seed so Admin boards are not empty on first open. */
export function seedSeverityFeedbackIfEmpty(db: Database.Database = getDb()) {
  ensureSeverityFeedbackSchema(db);
  const n = db.prepare(`SELECT COUNT(*) AS c FROM severity_feedback`).get() as { c: number };
  if (n.c > 0) return;
  const mk = monthKey();
  const samples: Array<[string, number, number, string]> = [
    ["CRITICAL", 0, 0, "Confirm P0 — equity drawdown with LP stale quotes needs firm war-room."],
    ["BREACH", 1, 0, "Upgrade to P0 — copy-book contagion risk underestimated by AI."],
    ["WARN", 2, 1, "Should be P1 — margin cohort already breached soft limits overnight."],
    ["BREACH", 1, 2, "Downgrade to P2 — one-off tick spike, book recovered within 3 minutes."],
    ["INFO", 3, 2, "Raise to P2 — recurring pattern on this symbol this week."],
  ];
  const stmt = db.prepare(
    `INSERT INTO severity_feedback
      (feedback_id, thread_id, thread_code, analysis_id, alert_id, ai_severity, ai_p,
       recommended_p, recommended_ops, reason, rated_by, rated_by_name, month_key)
     VALUES (?, NULL, ?, NULL, NULL, ?, ?, ?, ?, ?, 1, 'Alex Chen', ?)`
  );
  for (const [ai, aiP, recP, reason] of samples) {
    stmt.run(
      feedbackId(),
      `SEED-${ai}-P${recP}`,
      ai,
      aiP,
      recP,
      pToOpsSeverity(recP as SeverityP),
      reason,
      mk
    );
  }
}
