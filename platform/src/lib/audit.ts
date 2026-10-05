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

const VANTAGE_ENTITY = new Set([
  "user",
  "platform_settings",
  "platform",
  "data_source",
  "lark_channel",
  "team",
  "rag_document",
  "rag",
  "admin_doc",
]);

const VANTAGE_ACTION = new Set([
  "LOGIN",
  "LOGOUT",
  "SEED_DATABASE",
  "UPDATE_SETTING",
  "CREATE_USER",
  "UPDATE_USER",
  "CREATE_DATA_SOURCE",
  "UPDATE_DATA_SOURCE",
  "LARK_TEST_NOTIFY",
  "TOGGLE_LARK_CHANNEL",
  "CREATE_LARK_CHANNEL",
  "UPDATE_TEAM",
  "RAG_REINDEX",
  "RAG_CREATE",
  "RAG_UPDATE",
  "DOC_UPDATE",
  "DOC_RESET",
]);

const REVERSIBLE_ACTIONS = new Set([
  "UPDATE_SETTING",
  "TOGGLE_ESCALATION_ROUTE",
  "UPDATE_ESCALATION_ROUTE",
  "UPDATE_USER",
  "UPDATE_THRESHOLDS",
  "PAUSE_INDICATOR",
  "RESUME_INDICATOR",
  "TOGGLE_LARK_CHANNEL",
  "UPDATE_DATA_SOURCE",
  "UPDATE_TEAM",
  "RAG_UPDATE",
]);

export function classifyAuditPlane(action: string, entityType: string): AuditPlane {
  if (VANTAGE_ENTITY.has(entityType) || VANTAGE_ACTION.has(action)) return "vantage";
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
