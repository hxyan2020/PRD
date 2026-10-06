/** Audit plane classification, reversibility, and rollback helpers. */

export type AuditPlane = "crmp" | "vantage";

export type AuditLogRow = {
  id: number;
  actor_user_id?: number | null;
  actor_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details_json: string;
  created_at: string;
};

/**
 * Vantage Markets Admin plane — changes outside the CRMP control-plane ops surface:
 * identity/rights, platform settings, data pulls, Lark notifications, org, RAG human edits, login.
 */
const VANTAGE_ENTITY = new Set([
  "user",
  "role",
  "platform_settings",
  "platform",
  "data_source",
  "lark_channel",
  "team",
  "department",
  "rag_document",
  "rag",
  "admin_doc",
  "transaction",
  "vantage_admin",
]);

const VANTAGE_ACTION = new Set([
  "LOGIN",
  "LOGOUT",
  "SEED_DATABASE",
  "UPDATE_SETTING",
  "ROLLBACK_SETTING",
  "CREATE_USER",
  "UPDATE_USER",
  "ROLLBACK_USER",
  "UPDATE_ROLE",
  "ROLLBACK_ROLE",
  "CREATE_DATA_SOURCE",
  "UPDATE_DATA_SOURCE",
  "ROLLBACK_DATA_SOURCE",
  "LARK_TEST_NOTIFY",
  "MARKET_INTEL_LARK_PUSH",
  "TOGGLE_LARK_CHANNEL",
  "CREATE_LARK_CHANNEL",
  "ROLLBACK_LARK_TOGGLE",
  "UPDATE_TEAM",
  "ROLLBACK_TEAM",
  "RAG_REINDEX",
  "RAG_CREATE",
  "RAG_UPDATE",
  "ROLLBACK_RAG",
  "DOC_UPDATE",
  "DOC_RESET",
  "MESSENGER_CONFIRM_ACTION",
  "MESSENGER_CHECKER_APPROVE",
  "PULL_TRANSACTION_DATA",
  "RESTRICT_USER_RIGHTS",
  "BU_POC_INCIDENT_RESPONSE",
]);

/** CRMP plane — ops inside this CRMP admin (alerts, AI, skills, escalation, interventions, messenger triage). */
const CRMP_ACTION_HINT = new Set([
  "ALARM_RAISED",
  "DUMMY_SPINE_RUN",
  "ACK_ALERT",
  "AI_ANALYSIS_SKILL",
  "AI_SECOND_OPINION",
  "MARKET_INTEL_SCAN",
  "TOGGLE_ESCALATION_ROUTE",
  "UPDATE_ESCALATION_ROUTE",
  "CREATE_ESCALATION_ROUTE",
  "MESSENGER_ESCALATE",
  "MESSENGER_DISMISS",
  "MESSENGER_CLOSE",
  "MESSENGER_CHAT",
  "MESSENGER_SHOW_EVIDENCE",
  "INTERVENTION_DECIDE",
  "UPDATE_THRESHOLDS",
  "PAUSE_INDICATOR",
  "RESUME_INDICATOR",
  "CS_INTAKE",
  "CS_INTAKE_CONTINUE",
  "CS_FOLLOWUP_EMAIL",
  "CS_CLIENT_REPLY",
  "CS_AGENT_REPLY",
  "CS_ASSIGN_TR",
  "CS_ESCALATE_RISK",
  "CS_RESOLVE",
  "LARK_CARD_POST",
  "LARK_CARD_ACK",
  "LARK_CARD_ESCALATE",
  "LARK_CARD_DISMISS",
  "LARK_CARD_CLOSE",
]);

const REVERSIBLE_ACTIONS = new Set([
  "UPDATE_SETTING",
  "TOGGLE_ESCALATION_ROUTE",
  "UPDATE_ESCALATION_ROUTE",
  "UPDATE_USER",
  "UPDATE_ROLE",
  "UPDATE_THRESHOLDS",
  "PAUSE_INDICATOR",
  "RESUME_INDICATOR",
  "TOGGLE_LARK_CHANNEL",
  "UPDATE_DATA_SOURCE",
  "UPDATE_TEAM",
  "RAG_UPDATE",
]);

export function classifyAuditPlane(action: string, entityType: string): AuditPlane {
  if (CRMP_ACTION_HINT.has(action)) return "crmp";
  if (VANTAGE_ENTITY.has(entityType) || VANTAGE_ACTION.has(action)) return "vantage";
  // Entity hints for CRMP ops
  if (
    [
      "monitor_alert",
      "alert",
      "ai_analysis",
      "intervention",
      "escalation_route",
      "skill",
      "messenger_thread",
      "cs_request",
    ].includes(entityType)
  ) {
    return "crmp";
  }
  return "crmp";
}

export function parseAuditDetails(raw: string | null | undefined): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw || "{}") as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    /* ignore */
  }
  return {};
}

export function planeOfAudit(row: Pick<AuditLogRow, "action" | "entity_type" | "details_json">): AuditPlane {
  const details = parseAuditDetails(row.details_json);
  if (details.plane === "crmp" || details.plane === "vantage") return details.plane;
  return classifyAuditPlane(row.action, row.entity_type);
}

export function auditBeforeState(details: Record<string, unknown>): Record<string, unknown> | null {
  const before = details.before;
  if (before && typeof before === "object" && !Array.isArray(before)) {
    return before as Record<string, unknown>;
  }
  return null;
}

export function canRollbackAudit(action: string, details: Record<string, unknown>): boolean {
  if (!REVERSIBLE_ACTIONS.has(action)) return false;
  return !!auditBeforeState(details);
}

export function rollbackUnavailableReason(
  action: string,
  details: Record<string, unknown>,
  locale: "en" | "zh-Hant"
): string {
  if (!REVERSIBLE_ACTIONS.has(action)) {
    return locale === "zh-Hant"
      ? "此動作類型無法回滾（非可逆設定變更）。"
      : "This action type cannot be rolled back (not a reversible config change).";
  }
  if (!auditBeforeState(details)) {
    return locale === "zh-Hant"
      ? "歷史紀錄缺少變更前快照，無法回滾。"
      : "Historical row has no before-state snapshot; rollback disabled.";
  }
  return locale === "zh-Hant" ? "無法回滾" : "Cannot roll back";
}

/** Ensure each tab has representative rows with rollable before-snapshots for UAT. */
export function ensureAuditDemoSamples(db: {
  prepare: (sql: string) => {
    get: (...args: unknown[]) => unknown;
    run: (...args: unknown[]) => unknown;
  };
  exec?: (sql: string) => unknown;
  transaction?: (fn: () => void) => () => void;
}) {
  const runSeed = () => {
  const marker = db
    .prepare(`SELECT id FROM audit_logs WHERE action = ? AND entity_id = ? LIMIT 1`)
    .get("UPDATE_SETTING", "audit.demo.crmp_flag") as { id: number } | undefined;
  if (marker) return;

  const insert = db.prepare(
    `INSERT INTO audit_logs (actor_user_id, actor_name, action, entity_type, entity_id, details_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  // CRMP — escalation toggle with before snapshot (rollable)
  insert.run(
    null,
    "Risk Owner",
    "TOGGLE_ESCALATION_ROUTE",
    "escalation_route",
    "1",
    JSON.stringify({
      plane: "crmp",
      before: { enabled: 1 },
      after: { enabled: 0 },
      note: "Demo CRMP: temporarily disabled margin path for tabletop drill",
    }),
    "2026-10-05 12:10:00"
  );

  // CRMP — intervention decision (not rollable — show button disabled reason)
  insert.run(
    null,
    "Risk Analyst",
    "INTERVENTION_DECIDE",
    "intervention",
    "42",
    JSON.stringify({
      plane: "crmp",
      status: "APPROVED",
      ticket: "TKT-1001",
      note: "Demo CRMP: human gate on halt proposal",
    }),
    "2026-10-05 12:12:00"
  );

  // Vantage — restrict user rights (rollable)
  insert.run(
    null,
    "Platform Admin",
    "UPDATE_USER",
    "user",
    "3",
    JSON.stringify({
      plane: "vantage",
      before: { status: "ACTIVE", role_code: "RISK_ANALYST", team_id: 2, department_code: "RISK_CONTROL" },
      after: { status: "DISABLED", role_code: "VIEWER", team_id: 2, department_code: "RISK_CONTROL" },
      note: "Demo Vantage Admin: restrict user rights after phishing report",
    }),
    "2026-10-05 12:15:00"
  );

  // Vantage — role permission change (rollable)
  insert.run(
    null,
    "Platform Admin",
    "UPDATE_ROLE",
    "role",
    "VIEWER",
    JSON.stringify({
      plane: "vantage",
      before: {
        name: "Viewer",
        description: "Read-only across CRMP surfaces",
        department_code: null,
        permissions: ["audit.read", "docs.read"],
      },
      after: {
        name: "Viewer",
        description: "Read-only across CRMP surfaces",
        department_code: null,
        permissions: ["audit.read"],
      },
      note: "Demo Vantage Admin: tighten Viewer role permissions",
    }),
    "2026-10-05 12:15:30"
  );

  // Vantage — Lark notify (not rollable)
  insert.run(
    null,
    "Ops Lead",
    "LARK_TEST_NOTIFY",
    "lark_channel",
    "1",
    JSON.stringify({
      plane: "vantage",
      channel: "Risk Control Desk",
      message: "Demo: triggered Lark message for BREACH drill",
    }),
    "2026-10-05 12:16:00"
  );

  // Vantage — BU POC incident response
  insert.run(
    null,
    "Ops Analyst",
    "BU_POC_INCIDENT_RESPONSE",
    "vantage_admin",
    "ALT-1003",
    JSON.stringify({
      plane: "vantage",
      bu: "OPERATIONS",
      response: "Acknowledged; funding exception queue cleared",
      note: "Demo Vantage Admin: received risk incident response by BU POC",
    }),
    "2026-10-05 12:18:00"
  );

  // Vantage — pull transaction data
  insert.run(
    null,
    "System Admin",
    "PULL_TRANSACTION_DATA",
    "transaction",
    "TX-BATCH-20261005",
    JSON.stringify({
      plane: "vantage",
      rows: 1284,
      source: "Vantage Web Trading Ledger",
      note: "Demo Vantage Admin: pulling transaction data with details",
    }),
    "2026-10-05 12:20:00"
  );

  // Vantage — settings change (rollable) — also acts as marker
  insert.run(
    null,
    "Platform Admin",
    "UPDATE_SETTING",
    "platform_settings",
    "audit.demo.crmp_flag",
    JSON.stringify({
      plane: "vantage",
      before: { value: "0" },
      after: { value: "1" },
      note: "Demo Vantage Admin: platform setting toggle",
    }),
    "2026-10-05 12:22:00"
  );
  };

  try {
    if (typeof db.transaction === "function") {
      db.transaction(runSeed)();
    } else {
      runSeed();
    }
  } catch {
    // Parallel static-export workers may race on first boot; safe to skip.
  }
}
