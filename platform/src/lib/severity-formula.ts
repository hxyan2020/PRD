/**
 * Severity formula loop (FR-39 extension):
 * live weighted formula → P0–P3 → ops feedback with reason codes →
 * weekly AI recommendation (add/remove factors, retune weights) → RO approve via ai_change_requests.
 */
import type Database from "better-sqlite3";
import { getDb, writeAudit } from "@/lib/db";
import { proposeChange } from "@/lib/ai/admin";
import {
  ensureSeverityFeedbackSchema,
  opsSeverityToP,
  pToOpsSeverity,
  type SeverityP,
} from "@/lib/severity-feedback";
import {
  DEFAULT_SEVERITY_FORMULA,
  DEMO_ALERT_OBSERVATIONS,
  SEVERITY_REASON_CODES,
  type FormulaObservations,
  type SeverityFactorDef,
  type SeverityFactorId,
  type SeverityFormula,
  type SeverityReasonCode,
  type WeeklyFormulaSuggestion,
} from "@/lib/severity-formula-shared";
import { scoreSeverityFormula } from "@/lib/severity-formula-score";

export type {
  FormulaObservations,
  SeverityFactorDef,
  SeverityFactorId,
  SeverityFormula,
  SeverityReasonCode,
  WeeklyFormulaSuggestion,
};
export { DEFAULT_SEVERITY_FORMULA, DEMO_ALERT_OBSERVATIONS, SEVERITY_REASON_CODES };
export { scoreSeverityFormula };

const LIVE_KEY = "severity.formula.live";
const WEEKLY_CR_KEY = "severity.formula.weekly_cr";

export function weekKey(d = new Date()): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function clampWeight(n: number): number {
  return Math.round(Math.min(2.5, Math.max(0, n)) * 100) / 100;
}

export function ensureSeverityFormulaSchema(db: Database.Database = getDb()) {
  ensureSeverityFeedbackSchema(db);
  const cols = db.prepare(`PRAGMA table_info(severity_feedback)`).all() as Array<{ name: string }>;
  const names = new Set(cols.map((c) => c.name));
  if (!names.has("reason_codes_json")) {
    db.exec(`ALTER TABLE severity_feedback ADD COLUMN reason_codes_json TEXT`);
  }
  if (!names.has("week_key")) {
    db.exec(`ALTER TABLE severity_feedback ADD COLUMN week_key TEXT`);
  }
  if (!names.has("formula_version")) {
    db.exec(`ALTER TABLE severity_feedback ADD COLUMN formula_version TEXT`);
  }
  if (!names.has("formula_p")) {
    db.exec(`ALTER TABLE severity_feedback ADD COLUMN formula_p INTEGER`);
  }
  db.exec(`CREATE INDEX IF NOT EXISTS idx_severity_feedback_week ON severity_feedback(week_key)`);

  const live = db.prepare(`SELECT value FROM platform_settings WHERE key = ?`).get(LIVE_KEY) as
    | { value: string }
    | undefined;
  if (!live) {
    db.prepare(
      `INSERT INTO platform_settings (key, value, description) VALUES (?, ?, ?)`
    ).run(LIVE_KEY, JSON.stringify(DEFAULT_SEVERITY_FORMULA), "Live P0–P3 severity scoring formula");
  }
}

export function getLiveSeverityFormula(db: Database.Database = getDb()): SeverityFormula {
  ensureSeverityFormulaSchema(db);
  const row = db.prepare(`SELECT value FROM platform_settings WHERE key = ?`).get(LIVE_KEY) as
    | { value: string }
    | undefined;
  if (!row?.value) return { ...DEFAULT_SEVERITY_FORMULA, factors: DEFAULT_SEVERITY_FORMULA.factors.map((f) => ({ ...f })) };
  try {
    const parsed = JSON.parse(row.value) as SeverityFormula;
    if (!parsed?.factors?.length) throw new Error("empty");
    return parsed;
  } catch {
    return { ...DEFAULT_SEVERITY_FORMULA, factors: DEFAULT_SEVERITY_FORMULA.factors.map((f) => ({ ...f })) };
  }
}

export function saveLiveSeverityFormula(
  formula: SeverityFormula,
  actor: { id?: number | null; name: string },
  db: Database.Database = getDb()
) {
  ensureSeverityFormulaSchema(db);
  const next = {
    ...formula,
    version: formula.version || `SF-${Date.now().toString(36).toUpperCase()}`,
    updated_at: new Date().toISOString(),
  };
  db.prepare(
    `INSERT INTO platform_settings (key, value, description) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
  ).run(LIVE_KEY, JSON.stringify(next), "Live P0–P3 severity scoring formula");
  writeAudit(actor, "SEVERITY_FORMULA_APPLY", "severity_formula", next.version, {
    factors: next.factors,
    thresholds: next.thresholds,
  });
  return next;
}

function cloneFormula(f: SeverityFormula): SeverityFormula {
  return {
    version: f.version,
    thresholds: { ...f.thresholds },
    updated_at: f.updated_at,
    factors: f.factors.map((x) => ({ ...x })),
  };
}

export function getWeeklyFormulaSuggestion(week?: string, db: Database.Database = getDb()): WeeklyFormulaSuggestion {
  ensureSeverityFormulaSchema(db);
  const wk = week || weekKey();
  const current = getLiveSeverityFormula(db);
  let used = db
    .prepare(`SELECT * FROM severity_feedback WHERE week_key = ? ORDER BY id DESC`)
    .all(wk) as Array<{
    ai_p: number;
    recommended_p: number;
    reason_codes_json: string | null;
    reason: string;
    month_key: string;
  }>;

  // Demo continuity: if this ISO week has no rows yet, use latest feedback window.
  if (!used.length) {
    used = db
      .prepare(`SELECT * FROM severity_feedback ORDER BY id DESC LIMIT 40`)
      .all() as typeof used;
  }

  let upgrades = 0;
  let downgrades = 0;
  let same = 0;
  const reason_histogram: Record<string, number> = {};
  for (const r of used) {
    const diff = r.ai_p - r.recommended_p;
    if (diff > 0) upgrades += 1;
    else if (diff < 0) downgrades += 1;
    else same += 1;
    try {
      const codes = JSON.parse(r.reason_codes_json || "[]") as string[];
      for (const c of codes) reason_histogram[c] = (reason_histogram[c] || 0) + 1;
    } catch {
      /* ignore */
    }
  }

  const suggested = cloneFormula(current);
  suggested.version = `SF-${wk.replace("-", "")}`;

  const bump = (id: SeverityFactorId, delta: number) => {
    const f = suggested.factors.find((x) => x.id === id);
    if (f) f.weight = clampWeight(f.weight + delta);
  };
  const setEnabled = (id: SeverityFactorId, enabled: boolean) => {
    const f = suggested.factors.find((x) => x.id === id);
    if (f) f.enabled = enabled;
  };

  if ((reason_histogram.one_off_spike || 0) >= 1 || downgrades > upgrades) {
    bump("breach_magnitude", -0.2);
    bump("duration_minutes", -0.1);
  }
  if ((reason_histogram.missed_contagion || 0) >= 1 || upgrades > downgrades) {
    bump("book_contagion", 0.25);
    setEnabled("recurrence", true);
    bump("recurrence", 0.15);
  }
  if ((reason_histogram.missing_factor || 0) >= 1 || (reason_histogram.stale_threshold || 0) >= 1) {
    setEnabled("overnight_gap", true);
    bump("overnight_gap", 0.2);
  }
  if ((reason_histogram.overweight_magnitude || 0) >= 1) {
    bump("breach_magnitude", -0.25);
  }
  if ((reason_histogram.wrong_book_scope || 0) >= 1) {
    bump("client_impact", -0.15);
    bump("book_contagion", 0.1);
  }
  if (upgrades >= 2) {
    suggested.thresholds = {
      p0: Math.round((suggested.thresholds.p0 - 0.15) * 100) / 100,
      p1: Math.round((suggested.thresholds.p1 - 0.1) * 100) / 100,
      p2: suggested.thresholds.p2,
    };
  } else if (downgrades >= 2) {
    suggested.thresholds = {
      p0: Math.round((suggested.thresholds.p0 + 0.1) * 100) / 100,
      p1: Math.round((suggested.thresholds.p1 + 0.1) * 100) / 100,
      p2: Math.round((suggested.thresholds.p2 + 0.05) * 100) / 100,
    };
  }

  const factor_changes = suggested.factors.map((f) => {
    const cur = current.factors.find((x) => x.id === f.id)!;
    let change: WeeklyFormulaSuggestion["factor_changes"][number]["change"] = "unchanged";
    if (!cur.enabled && f.enabled) change = "enable";
    else if (cur.enabled && !f.enabled) change = "disable";
    else if (f.weight > cur.weight + 0.01) change = "weight_up";
    else if (f.weight < cur.weight - 0.01) change = "weight_down";
    return {
      id: f.id,
      change,
      from_weight: cur.weight,
      to_weight: f.weight,
      from_enabled: cur.enabled,
      to_enabled: f.enabled,
      en: f.en,
      zh: f.zh,
    };
  });

  const enabledDelta =
    suggested.factors.filter((f) => f.enabled).length - current.factors.filter((f) => f.enabled).length;
  const rationale_en =
    used.length === 0
      ? `No severity feedback this week (${wk}). Live formula ${current.version} unchanged.`
      : `From ${used.length} ops severity overrides in ${wk}: ${upgrades} upgrade(s), ${downgrades} downgrade(s). AI suggests ${enabledDelta >= 0 ? `+${enabledDelta}` : enabledDelta} factor(s), retune weights, and P bands ${current.thresholds.p1}→${suggested.thresholds.p1} (P1). Pending Risk Owner approval.`;
  const rationale_zh =
    used.length === 0
      ? `本週（${wk}）尚無嚴重度回饋。線上公式 ${current.version} 不變。`
      : `本週（${wk}）彙總 ${used.length} 則值班嚴重度覆寫：升級 ${upgrades}、降級 ${downgrades}。AI 建議因子 ${enabledDelta >= 0 ? `+${enabledDelta}` : enabledDelta} 個、調整權重，P1 分帶 ${current.thresholds.p1}→${suggested.thresholds.p1}。待風險負責人核准。`;

  const crMeta = db.prepare(`SELECT value FROM platform_settings WHERE key = ?`).get(`${WEEKLY_CR_KEY}.${wk}`) as
    | { value: string }
    | undefined;
  let pending_cr_id: number | null = null;
  let pending_request_id: string | null = null;
  let pending_status: string | null = null;
  let applied = false;
  if (crMeta?.value) {
    try {
      const meta = JSON.parse(crMeta.value) as { id?: number; request_id?: string };
      if (meta.id) {
        const row = db
          .prepare(`SELECT id, request_id, status FROM ai_change_requests WHERE id = ?`)
          .get(meta.id) as { id: number; request_id: string; status: string } | undefined;
        if (row) {
          pending_cr_id = row.id;
          pending_request_id = row.request_id;
          pending_status = row.status;
          applied = row.status === "APPROVED";
        }
      }
    } catch {
      /* ignore */
    }
  }

  return {
    week_key: wk,
    sample_count: used.length,
    upgrades,
    downgrades,
    same,
    reason_histogram,
    current,
    suggested,
    factor_changes,
    rationale_en,
    rationale_zh,
    pending_cr_id,
    pending_request_id,
    pending_status,
    applied,
  };
}

/** Propose weekly formula CR as AI Engineer (maker). RO / checker approves separately. */
export function proposeWeeklyFormulaChange(input?: {
  week?: string;
  actor?: { id: number; name: string };
}): WeeklyFormulaSuggestion {
  const db = getDb();
  ensureSeverityFormulaSchema(db);
  const suggestion = getWeeklyFormulaSuggestion(input?.week, db);
  if (suggestion.sample_count === 0) {
    throw new Error("No severity feedback this week — nothing to propose");
  }
  if (suggestion.pending_status === "PENDING") {
    return suggestion;
  }
  if (suggestion.pending_status === "APPROVED" && suggestion.applied) {
    return suggestion;
  }

  let actor = input?.actor as { id: number; name: string; role_code?: string } | undefined;
  if (!actor) {
    const ai = db
      .prepare(`SELECT id, name, role_code FROM users WHERE role_code = 'AI_ENGINEER' ORDER BY id LIMIT 1`)
      .get() as { id: number; name: string; role_code: string } | undefined;
    actor = ai || { id: 0, name: "CRMP AI", role_code: "AI_ENGINEER" };
  }

  const proposed = proposeChange({
    actor: { id: actor.id, name: actor.name, role_code: actor.role_code || "AI_ENGINEER" },
    entity_type: "SEVERITY_FORMULA",
    action: "UPDATE",
    title: `Weekly severity formula ${suggestion.week_key}`,
    summary: suggestion.rationale_en,
    payload: {
      week_key: suggestion.week_key,
      formula: suggestion.suggested,
      factor_changes: suggestion.factor_changes,
      rationale_en: suggestion.rationale_en,
      rationale_zh: suggestion.rationale_zh,
    },
    before: suggestion.current as unknown as Record<string, unknown>,
  });

  db.prepare(
    `INSERT INTO platform_settings (key, value, description) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
  ).run(
    `${WEEKLY_CR_KEY}.${suggestion.week_key}`,
    JSON.stringify({ id: proposed.id, request_id: proposed.request_id }),
    "Pending weekly severity formula change request id"
  );

  return getWeeklyFormulaSuggestion(suggestion.week_key, db);
}

export function applySeverityFormulaPayload(
  payload: Record<string, unknown>,
  actor: { id?: number | null; name: string }
) {
  const formula = payload.formula as SeverityFormula | undefined;
  if (!formula?.factors?.length) throw new Error("SEVERITY_FORMULA payload.formula required");
  return saveLiveSeverityFormula(formula, actor);
}

/** Seed feedback with reason codes + optional pending weekly CR for RO. */
export function seedSeverityFormulaLoop(db: Database.Database = getDb()) {
  ensureSeverityFormulaSchema(db);
  const wk = weekKey();
  const withCodes = db
    .prepare(`SELECT COUNT(*) AS c FROM severity_feedback WHERE reason_codes_json IS NOT NULL AND reason_codes_json != ''`)
    .get() as { c: number };
  if (withCodes.c === 0) {
    const live = getLiveSeverityFormula(db);
    const samples: Array<{
      ai: string;
      aiP: number;
      recP: number;
      reason: string;
      codes: string[];
    }> = [
      {
        ai: "BREACH",
        aiP: 1,
        recP: 2,
        reason: "Ops 24/7: one-off spike, book recovered — formula P1 too hot.",
        codes: ["one_off_spike", "overweight_magnitude", "should_downgrade"],
      },
      {
        ai: "BREACH",
        aiP: 1,
        recP: 0,
        reason: "Copy contagion underestimated — should be P0.",
        codes: ["missed_contagion", "should_upgrade", "missing_factor"],
      },
      {
        ai: "WARN",
        aiP: 2,
        recP: 1,
        reason: "Overnight soft-limit breach missed by formula.",
        codes: ["missing_factor", "stale_threshold", "should_upgrade"],
      },
      {
        ai: "BREACH",
        aiP: 1,
        recP: 2,
        reason: "Wrong cohort scope — B-book only, not firm-wide.",
        codes: ["wrong_book_scope", "should_downgrade"],
      },
      {
        ai: "INFO",
        aiP: 3,
        recP: 2,
        reason: "Recurring pattern this week — raise to P2.",
        codes: ["missing_factor", "should_upgrade"],
      },
    ];
    const stmt = db.prepare(
      `INSERT INTO severity_feedback
        (feedback_id, thread_id, thread_code, analysis_id, alert_id, ai_severity, ai_p,
         recommended_p, recommended_ops, reason, reason_codes_json, rated_by, rated_by_name,
         month_key, week_key, formula_version, formula_p)
       VALUES (?, NULL, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, 3, 'Marcus Lee (Ops 24/7)', ?, ?, ?, ?)`
    );
    const mk = `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}`;
    for (const s of samples) {
      const scored = scoreSeverityFormula(live, DEMO_ALERT_OBSERVATIONS);
      stmt.run(
        `SFB-WK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        `OPS-${s.ai}-P${s.recP}`,
        s.ai,
        s.aiP,
        s.recP,
        pToOpsSeverity(s.recP as SeverityP),
        s.reason,
        JSON.stringify(s.codes),
        mk,
        wk,
        live.version,
        scored.p
      );
    }
  }

  const pending = getWeeklyFormulaSuggestion(wk, db);
  if (!pending.pending_cr_id && pending.sample_count > 0) {
    try {
      proposeWeeklyFormulaChange({ week: wk });
    } catch {
      /* ignore if CR path cold */
    }
  }
}

export function reasonCodeLabel(id: string, locale: "en" | "zh-Hant"): string {
  const hit = SEVERITY_REASON_CODES.find((c) => c.id === id);
  if (!hit) return id;
  return locale === "zh-Hant" ? hit.zh : hit.en;
}

export function formulaFactorLabel(id: string, locale: "en" | "zh-Hant"): string {
  const hit =
    DEFAULT_SEVERITY_FORMULA.factors.find((f) => f.id === id) ||
    getLiveSeverityFormula().factors.find((f) => f.id === id);
  if (!hit) return id;
  return locale === "zh-Hant" ? hit.zh : hit.en;
}

export { opsSeverityToP, pToOpsSeverity };
