import { getDb } from "@/lib/db";
import { getImprovementForAnalysis, type ImprovementReview } from "@/lib/ai/improvement";
import { matchEscalationRoute } from "@/lib/escalation/match";

export type TrackerPerson = { name: string; role: string; email?: string | null; team?: string | null };

export type TrackerGate = {
  code: "OPEN" | "CLOSED" | "PENDING_ADMIN" | "PENDING_RO";
  label: string;
  detail: string;
};

export type TrackerAnalysis = {
  id: number;
  analysis_id: string;
  summary: string;
  mode: string;
  confidence: number;
  status: string;
  needs_human: boolean;
  challenged: boolean;
  challenge_verdict: string | null;
  href: string;
};

export type TrackerEscalation = {
  route_code?: string;
  route_name: string;
  sla_minutes: number;
  primary_team: string;
  secondary_team: string | null;
  lark_channel: string | null;
  auto_actions: string[];
  requires_human: boolean;
  match_kind?: "exact" | "domain_wild" | "default";
  is_default?: boolean;
};

export type TrackerEvent = {
  at: string;
  kind: "raised" | "ack" | "ticket" | "rca" | "intervention" | "decided" | "spine" | "audit" | "ai_action";
  title: string;
  actor: string | null;
};

export type TrackerSolution = {
  text: string;
  mandated_by: string;
  source: "intervention" | "impact" | "analysis";
};

export type AlertTrackerPack = {
  id: number;
  alert_id: string;
  title: string;
  message: string;
  severity: string;
  alert_status: string;
  observed_value: number | null;
  created_at: string;
  acknowledged_at: string | null;
  product: string;
  domain_code: string;
  indicator_name: string;
  monitor_id: string;
  ticket_id: string | null;
  ticket_status: string | null;
  ticket_department: string | null;
  href: string;
  poc: TrackerPerson | null;
  ro: TrackerPerson | null;
  gate: TrackerGate;
  analysis: TrackerAnalysis | null;
  escalation: TrackerEscalation | null;
  timeline: TrackerEvent[];
  outcome: string | null;
  final_solution: TrackerSolution | null;
  improvement: ImprovementReview | null;
};

type AlertRow = {
  id: number;
  alert_id: string;
  severity: string;
  title: string;
  message: string;
  observed_value: number | null;
  status: string;
  monitor20_ticket_id: string | null;
  created_at: string;
  acknowledged_at: string | null;
  indicator_name: string;
  monitor_id: string;
  domain_code: string;
  product: string;
};

function parseJsonArray(raw: string | null | undefined): string[] {
  try {
    const v = JSON.parse(raw || "[]");
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function riskOwner(db: ReturnType<typeof getDb>): TrackerPerson | null {
  const row = db
    .prepare(
      `SELECT u.name, u.role_code, u.email, t.name AS team_name FROM users u
       LEFT JOIN teams t ON t.id = u.team_id
       WHERE u.role_code = 'RISK_OWNER' AND u.status = 'ACTIVE'
       ORDER BY u.id LIMIT 1`
    )
    .get() as { name: string; role_code: string; email: string; team_name: string | null } | undefined;
  if (!row) return null;
  return { name: row.name, role: row.role_code, email: row.email, team: row.team_name };
}

function gateFor(input: {
  alertStatus: string;
  ticketStatus: string | null;
  analysis: TrackerAnalysis | null;
  interventionStatus: string | null;
  ro: TrackerPerson | null;
}): TrackerGate {
  const ticketClosed = input.ticketStatus === "RESOLVED" || input.ticketStatus === "CLOSED";
  const alertClosed = input.alertStatus === "CLOSED" || input.alertStatus === "RESOLVED";
  if (ticketClosed || alertClosed) {
    return { code: "CLOSED", label: "Closed", detail: "Ticket/alert is closed. Residual risk should already be signed." };
  }
  if (input.interventionStatus === "PENDING" || input.interventionStatus === "AWAITING_CHECKER") {
    return {
      code: "PENDING_ADMIN",
      label: "Pending admin change",
      detail: "A control action is queued for maker/checker (settings, detector, or config) before it can execute.",
    };
  }
  if (input.analysis?.needs_human || input.interventionStatus === "AWAITING_HUMAN") {
    const roName = input.ro?.name || "Risk Owner";
    return {
      code: "PENDING_RO",
      label: "Pending RO approval",
      detail: `Human gate is open. ${roName} (${input.ro?.role || "RISK_OWNER"}) must approve or reject before halt / leverage / LP / withdrawal actions run.`,
    };
  }
  if (input.alertStatus === "ACKNOWLEDGED") {
    return { code: "OPEN", label: "Open · acknowledged", detail: "Desk has seen the alarm. Ticket still open." };
  }
  return { code: "OPEN", label: "Open", detail: "Raised and not yet closed." };
}

const CLOSED_TICKET_EXISTS = `EXISTS (
  SELECT 1 FROM monitor_tickets t
  WHERE (t.alert_id = a.id OR (a.monitor20_ticket_id IS NOT NULL AND t.ticket_id = a.monitor20_ticket_id))
    AND t.status IN ('RESOLVED','CLOSED')
)`;

function statusWhereSql(status: "open" | "closed" | "all"): string {
  if (status === "open") {
    return `WHERE a.status NOT IN ('CLOSED','RESOLVED') AND NOT ${CLOSED_TICKET_EXISTS}`;
  }
  if (status === "closed") {
    return `WHERE a.status IN ('CLOSED','RESOLVED') OR ${CLOSED_TICKET_EXISTS}`;
  }
  return "";
}

function parseJsonObject(raw: string | null | undefined): Record<string, unknown> {
  try {
    const v = JSON.parse(raw || "{}");
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function listAlertTrackerPacks(
  limitOrOpts: number | { limit?: number; order?: "severity" | "recent"; status?: "open" | "closed" | "all" } = 80
): AlertTrackerPack[] {
  const opts = typeof limitOrOpts === "number" ? { limit: limitOrOpts } : limitOrOpts;
  const limit = opts.limit ?? 80;
  const order = opts.order === "recent" ? "recent" : "severity";
  const status = opts.status ?? "all";
  const db = getDb();
  const orderSql =
    order === "recent"
      ? `a.created_at DESC`
      : `CASE a.severity WHEN 'CRITICAL' THEN 1 WHEN 'BREACH' THEN 2 WHEN 'WARN' THEN 3 ELSE 4 END, a.created_at DESC`;
  const alerts = db
    .prepare(
      `SELECT a.id, a.alert_id, a.severity, a.title, a.message, a.observed_value, a.status,
              a.monitor20_ticket_id, a.created_at, a.acknowledged_at,
              i.name AS indicator_name, i.monitor_id, i.domain_code, i.product
       FROM monitor_alerts a
       JOIN monitor_indicators i ON i.id = a.indicator_id
       ${statusWhereSql(status)}
       ORDER BY ${orderSql}
       LIMIT ?`
    )
    .all(limit) as AlertRow[];

  const ro = riskOwner(db);

  return alerts.map((a) => {
    const ticket = db
      .prepare(
        `SELECT t.ticket_id, t.status, t.assignee_user_id, t.department_code, t.created_at, t.updated_at,
                u.name AS assignee_name, u.role_code AS assignee_role, u.email AS assignee_email,
                tm.name AS team_name
         FROM monitor_tickets t
         LEFT JOIN users u ON u.id = t.assignee_user_id
         LEFT JOIN teams tm ON tm.id = u.team_id
         WHERE t.alert_id = ? OR t.ticket_id = ?
         ORDER BY t.id DESC LIMIT 1`
      )
      .get(a.id, a.monitor20_ticket_id || "") as
      | {
          ticket_id: string;
          status: string;
          assignee_name: string | null;
          assignee_role: string | null;
          assignee_email: string | null;
          team_name: string | null;
          department_code: string | null;
          created_at: string;
          updated_at: string;
        }
      | undefined;

    const analysisRows = db
      .prepare(
        `SELECT a.id, a.analysis_id, a.summary, a.mode, a.confidence, a.status, a.needs_human,
                a.challenged, a.challenge_verdict, a.created_at, a.actions_taken_json
         FROM ai_analyses a
         WHERE a.alert_id = ?
         ORDER BY a.id ASC`
      )
      .all(a.id) as Array<{
      id: number;
      analysis_id: string;
      summary: string;
      mode: string;
      confidence: number;
      status: string;
      needs_human: number;
      challenged: number | null;
      challenge_verdict: string | null;
      created_at: string;
      actions_taken_json: string | null;
    }>;
    const analysisRow = analysisRows.length ? analysisRows[analysisRows.length - 1] : undefined;

    const analysis: TrackerAnalysis | null = analysisRow
      ? {
          id: analysisRow.id,
          analysis_id: analysisRow.analysis_id,
          summary: analysisRow.summary,
          mode: analysisRow.mode,
          confidence: analysisRow.confidence,
          status: analysisRow.status,
          needs_human: Boolean(analysisRow.needs_human),
          challenged: Boolean(analysisRow.challenged),
          challenge_verdict: analysisRow.challenge_verdict,
          href: `/admin/ai-analyses/${analysisRow.id}`,
        }
      : null;
    const improvement = analysisRow
      ? (() => {
          try {
            return getImprovementForAnalysis(analysisRow.id);
          } catch {
            return null;
          }
        })()
      : null;

    const interventionRows = analysisRows.length
      ? (db
          .prepare(
            `SELECT i.status, i.action_code, i.requested_at, i.decided_at, i.decision_note, u.name AS decided_by_name
             FROM interventions i
             LEFT JOIN users u ON u.id = i.decided_by
             WHERE i.analysis_id IN (${analysisRows.map(() => "?").join(",")})
             ORDER BY i.id ASC`
          )
          .all(...analysisRows.map((r) => r.id)) as Array<{
          status: string;
          action_code: string;
          requested_at: string;
          decided_at: string | null;
          decision_note: string | null;
          decided_by_name: string | null;
        }>)
      : [];
    const intervention = interventionRows.length ? interventionRows[interventionRows.length - 1] : undefined;

    let impact: { outcome: string | null; notes: string | null } | undefined;
    try {
      impact = db
        .prepare(`SELECT outcome, notes FROM alert_impacts WHERE alert_id = ?`)
        .get(a.id) as { outcome: string | null; notes: string | null } | undefined;
    } catch {
      impact = undefined;
    }

    // Match order: exact domain+severity → domain wild → default catch-all (every alert gets a path).
    const matched = matchEscalationRoute(db, a.domain_code, a.severity);
    const esc = matched
      ? {
          route_code: matched.route_code,
          route_name: matched.name,
          sla_minutes: matched.sla_minutes,
          auto_actions_json: matched.auto_actions_json,
          requires_human: matched.requires_human,
          primary_team: matched.primary_team,
          secondary_team: matched.secondary_team,
          lark_channel: matched.lark_channel,
          match_kind: matched.match_kind,
          is_default: Boolean(matched.is_default) || matched.match_kind === "default",
        }
      : undefined;

    let poc: TrackerPerson | null = ticket?.assignee_name
      ? {
          name: ticket.assignee_name,
          role: ticket.assignee_role || "ASSIGNEE",
          email: ticket.assignee_email,
          team: ticket.team_name,
        }
      : null;
    if (!poc && esc?.primary_team) {
      const desk = db
        .prepare(
          `SELECT u.name, u.role_code, u.email, tm.name AS team_name
           FROM users u JOIN teams tm ON tm.id = u.team_id
           WHERE tm.name = ? AND u.status = 'ACTIVE'
           ORDER BY u.id LIMIT 1`
        )
        .get(esc.primary_team) as
        | { name: string; role_code: string; email: string; team_name: string | null }
        | undefined;
      if (desk) {
        poc = { name: desk.name, role: desk.role_code, email: desk.email, team: desk.team_name };
      }
    }

    const gate = gateFor({
      alertStatus: a.status,
      ticketStatus: ticket?.status ?? null,
      analysis,
      interventionStatus: intervention?.status ?? null,
      ro,
    });

    const decidedNote = [...interventionRows].reverse().find((row) => row.decision_note?.trim());
    let final_solution: TrackerSolution | null = null;
    if (decidedNote?.decision_note) {
      final_solution = {
        text: decidedNote.decision_note,
        mandated_by: decidedNote.decided_by_name || ro?.name || "Risk Owner",
        source: "intervention",
      };
    } else if (impact?.notes?.trim()) {
      final_solution = {
        text: impact.notes,
        mandated_by: poc?.name || poc?.team || "Business unit POC",
        source: "impact",
      };
    } else if (analysis?.summary) {
      final_solution = {
        text: analysis.summary,
        mandated_by: "AI",
        source: "analysis",
      };
    }

    const timeline: TrackerEvent[] = [];
    timeline.push({ at: a.created_at, kind: "raised", title: a.severity, actor: "Monitor 2.0" });
    if (a.acknowledged_at) timeline.push({ at: a.acknowledged_at, kind: "ack", title: "acknowledged", actor: poc?.name || null });
    if (ticket) {
      timeline.push({
        at: ticket.created_at,
        kind: "ticket",
        title: `${ticket.ticket_id} · ${ticket.status}`,
        actor: poc?.name || ticket.department_code || null,
      });
    }
    for (const row of analysisRows) {
      timeline.push({
        at: row.created_at,
        kind: "rca",
        title: `${row.analysis_id} · ${row.mode}`,
        actor: "AI",
      });
      for (const action of parseJsonArrayObjects(row.actions_taken_json)) {
        const code = String(action.action || action.code || "action");
        const st = String(action.status || "");
        const desc = String(action.description || "");
        timeline.push({
          at: row.created_at,
          kind: "ai_action",
          title: desc ? `${code}${st ? ` · ${st}` : ""} — ${desc}` : `${code}${st ? ` · ${st}` : ""}`,
          actor: "AI",
        });
      }
    }
    for (const row of interventionRows) {
      timeline.push({
        at: row.requested_at,
        kind: "intervention",
        title: `${row.action_code} · ${row.status}`,
        actor: ro?.name || "Risk Owner",
      });
      if (row.decided_at) {
        timeline.push({
          at: row.decided_at,
          kind: "decided",
          title: row.decision_note || `${row.action_code} decided`,
          actor: row.decided_by_name || ro?.name || null,
        });
      }
    }
    const entityIds = [a.alert_id, String(a.id), ticket?.ticket_id || a.monitor20_ticket_id || "", ...analysisRows.map((r) => r.analysis_id)].filter(
      Boolean
    );
    try {
      const spineIds = entityIds.length ? entityIds : [a.alert_id];
      const spine = db
        .prepare(
          `SELECT created_at, title, actor FROM spine_events
           WHERE ref_id IN (${spineIds.map(() => "?").join(",")})
           ORDER BY created_at ASC LIMIT 24`
        )
        .all(...spineIds) as Array<{
        created_at: string;
        title: string;
        actor: string | null;
      }>;
      for (const s of spine) timeline.push({ at: s.created_at, kind: "spine", title: s.title, actor: s.actor });
    } catch {
      /* spine table may be empty */
    }
    try {
      const auditIds = entityIds.length ? entityIds : [a.alert_id];
      const audits = db
        .prepare(
          `SELECT created_at, actor_name, action, entity_type, details_json
           FROM audit_logs
           WHERE entity_id IN (${auditIds.map(() => "?").join(",")})
           ORDER BY created_at ASC LIMIT 40`
        )
        .all(...auditIds) as Array<{
        created_at: string;
        actor_name: string | null;
        action: string;
        entity_type: string;
        details_json: string | null;
      }>;
      for (const log of audits) {
        const details = parseJsonObject(log.details_json);
        const note = String(details.note || details.notes || details.message || "").trim();
        const dept = String(details.department || details.department_code || "").trim();
        const title = note ? `${log.action} — ${note}` : log.action;
        const actorBits = [log.actor_name, dept].filter(Boolean);
        timeline.push({
          at: log.created_at,
          kind: "audit",
          title,
          actor: actorBits.length ? actorBits.join(" · ") : log.entity_type,
        });
      }
    } catch {
      /* audit table may be empty */
    }
    timeline.sort((x, y) => String(x.at).localeCompare(String(y.at)));

    const closed = gate.code === "CLOSED";
    return {
      id: a.id,
      alert_id: a.alert_id,
      title: a.title,
      message: a.message,
      severity: a.severity,
      alert_status: a.status,
      observed_value: a.observed_value,
      created_at: a.created_at,
      acknowledged_at: a.acknowledged_at,
      product: a.product,
      domain_code: a.domain_code,
      indicator_name: a.indicator_name,
      monitor_id: a.monitor_id,
      ticket_id: ticket?.ticket_id || a.monitor20_ticket_id,
      ticket_status: ticket?.status || null,
      ticket_department: ticket?.department_code || null,
      href: closed ? `/admin/risk-log#${a.alert_id}` : `/admin/alerts#${a.alert_id}`,
      poc,
      ro,
      gate,
      analysis,
      escalation: esc
        ? {
            route_code: esc.route_code,
            route_name: esc.route_name,
            sla_minutes: esc.sla_minutes,
            primary_team: esc.primary_team,
            secondary_team: esc.secondary_team,
            lark_channel: esc.lark_channel,
            auto_actions: parseJsonArray(esc.auto_actions_json),
            requires_human: Boolean(esc.requires_human),
            match_kind: esc.match_kind,
            is_default: esc.is_default,
          }
        : null,
      timeline,
      outcome: impact?.outcome || null,
      final_solution,
      improvement,
    };
  });
}

function parseJsonArrayObjects(raw: string | null | undefined): Array<Record<string, unknown>> {
  try {
    const v = JSON.parse(raw || "[]");
    return Array.isArray(v) ? v.filter((x) => x && typeof x === "object" && !Array.isArray(x)) : [];
  } catch {
    return [];
  }
}
