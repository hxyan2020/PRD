import { getDb } from "@/lib/db";
import { listCsInbox, type CsRequest } from "@/lib/cs/desk";
import { getCsFollowupCap } from "@/lib/cs/ops-data";

export {
  CS_AUDIT_ACTIONS,
  type CsAuditAction,
  type CsCountBucket,
  type CsDashRow,
  type CsDashboard,
  type CsLogEvent,
  type CsResolvedPack,
  type CsLog,
} from "@/lib/cs/analytics-shared";
import { CS_AUDIT_ACTIONS, type CsCountBucket, type CsDashboard, type CsDashRow, type CsLog, type CsLogEvent } from "@/lib/cs/analytics-shared";

function buckets(rows: CsRequest[], keyFn: (r: CsRequest) => string): CsCountBucket[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const key = keyFn(r) || "—";
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key, count]) => ({ key, count }));
}

function toRow(r: CsRequest, waiting: boolean): CsDashRow {
  return {
    id: r.id,
    request_id: r.request_id,
    channel: r.channel,
    desk: r.desk,
    status: r.status,
    skill_code: r.skill_code,
    ai_clarity: r.ai_clarity,
    followup_count: r.followup_count,
    waiting,
    subject: r.subject,
    client_name: r.client_name,
    updated_at: r.updated_at,
  };
}

function waitingSet(inbox: ReturnType<typeof listCsInbox>) {
  const ids = new Set<number>();
  for (const r of inbox.requests) {
    const followups = inbox.catalog[r.id]?.followups || [];
    if (followups.some((f) => f.status === "WAITING")) ids.add(r.id);
  }
  return ids;
}

/** CS/TR KPIs from `cs_*` — not Daily Performance and not Risk Log. */
export function getCsDashboard(): CsDashboard {
  const inbox = listCsInbox();
  const waitingIds = waitingSet(inbox);
  const requests = inbox.requests;
  const openRows = requests.filter((r) => r.status !== "RESOLVED" && r.status !== "CLOSED");
  const summary = {
    total: requests.length,
    open: openRows.length,
    resolved: requests.filter((r) => r.status === "RESOLVED").length,
    waiting: waitingIds.size,
    awaiting_client: requests.filter((r) => r.status === "AWAITING_CLIENT").length,
    id_verify: requests.filter((r) => r.status === "ID_VERIFY").length,
    assigned_tr: requests.filter((r) => r.status === "ASSIGNED_TR" || r.desk === "TR").length,
    escalated_risk: requests.filter((r) => r.status === "ESCALATED_RISK").length,
    poc_review: requests.filter((r) => r.status === "POC_REVIEW" || r.sensitivity === "poc").length,
    ai_replied: requests.filter((r) => r.status === "AI_REPLIED").length,
    cap3: requests.filter((r) => r.followup_count >= getCsFollowupCap()).length,
    cs_desk: requests.filter((r) => r.desk === "CS").length,
    tr_desk: requests.filter((r) => r.desk === "TR").length,
  };
  const waiting = requests.filter((r) => waitingIds.has(r.id)).map((r) => toRow(r, true));
  const recent = [...requests]
    .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)) || b.id - a.id)
    .slice(0, 12)
    .map((r) => toRow(r, waitingIds.has(r.id)));
  return {
    generated_at: new Date().toISOString(),
    summary,
    by_channel: buckets(requests, (r) => r.channel),
    by_status: buckets(requests, (r) => r.status),
    by_skill: buckets(requests, (r) => r.skill_code || "—"),
    by_desk: buckets(requests, (r) => r.desk),
    by_clarity: buckets(requests, (r) => r.ai_clarity),
    by_severity: buckets(requests, (r) => r.severity || "—"),
    waiting,
    recent,
  };
}

function parseDetails(raw: string | null | undefined): Record<string, unknown> {
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

/** CS_* audit timeline + resolved packs — not the Risk Log. */
export function getCsLog(limit = 200): CsLog {
  const inbox = listCsInbox();
  const db = getDb();
  let events: CsLogEvent[] = [];
  try {
    const placeholders = CS_AUDIT_ACTIONS.map(() => "?").join(",");
    const rows = db
      .prepare(
        `SELECT id, created_at, actor_name, action, entity_id, details_json
         FROM audit_logs
         WHERE entity_type = 'cs_request' OR action IN (${placeholders})
         ORDER BY id DESC
         LIMIT ?`
      )
      .all(...CS_AUDIT_ACTIONS, limit) as Array<{
      id: number;
      created_at: string;
      actor_name: string | null;
      action: string;
      entity_id: string | null;
      details_json: string;
    }>;
    events = rows.map((row) => ({
      id: row.id,
      at: row.created_at,
      action: row.action,
      actor: row.actor_name || "—",
      request_id: row.entity_id || "—",
      details: parseDetails(row.details_json),
    }));
  } catch {
    events = [];
  }
  const resolved = inbox.requests
    .filter((r) => r.status === "RESOLVED")
    .map((r) => ({
      id: r.id,
      request_id: r.request_id,
      subject: r.subject,
      desk: r.desk,
      channel: r.channel,
      skill_code: r.skill_code,
      status: r.status,
      resolved_at: r.updated_at,
      followup_count: r.followup_count,
      client_name: r.client_name,
    }));
  return { generated_at: new Date().toISOString(), events, resolved };
}
