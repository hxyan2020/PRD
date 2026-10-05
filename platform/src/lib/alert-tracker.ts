import { getDb } from "@/lib/db";

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
  route_name: string;
  sla_minutes: number;
  primary_team: string;
  secondary_team: string | null;
  lark_channel: string | null;
  auto_actions: string[];
  requires_human: boolean;
};

export type TrackerEvent = {
  at: string;
  kind: "raised" | "ack" | "ticket" | "rca" | "intervention" | "decided" | "spine";
  title: string;
  actor: string | null;
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

export function listAlertTrackerPacks(
  limitOrOpts: number | { limit?: number; order?: "severity" | "recent" } = 80
): AlertTrackerPack[] {
  const opts = typeof limitOrOpts === "number" ? { limit: limitOrOpts } : limitOrOpts;
  const limit = opts.limit ?? 80;
  const order = opts.order === "recent" ? "recent" : "severity";
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

    const analysisRow = db
      .prepare(
        `SELECT a.id, a.analysis_id, a.summary, a.mode, a.confidence, a.status, a.needs_human,
                a.challenged, a.challenge_verdict, a.created_at
         FROM ai_analyses a
         WHERE a.alert_id = ?
         ORDER BY a.id DESC LIMIT 1`
      )
      .get(a.id) as
      | {
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
        }
      | undefined;

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

    const intervention = analysis
      ? (db
          .prepare(
            `SELECT status, requested_at, decided_at, decision_note
             FROM interventions WHERE analysis_id = ? ORDER BY id DESC LIMIT 1`
          )
          .get(analysis.id) as { status: string; requested_at: string; decided_at: string | null; decision_note: string | null } | undefined)
      : undefined;

    const esc = db
      .prepare(
        `SELECT r.name AS route_name, r.sla_minutes, r.auto_actions_json, r.requires_human,
                t1.name AS primary_team, t2.name AS secondary_team, c.name AS lark_channel
         FROM escalation_routes r
         JOIN teams t1 ON t1.id = r.primary_team_id
         LEFT JOIN teams t2 ON t2.id = r.secondary_team_id
         LEFT JOIN lark_channels c ON c.id = r.lark_channel_id
         WHERE r.enabled = 1 AND r.domain_code = ?
         ORDER BY CASE r.severity
           WHEN ? THEN 0 WHEN 'CRITICAL' THEN 1 WHEN 'BREACH' THEN 2 ELSE 3 END
         LIMIT 1`
      )
      .get(a.domain_code, a.severity) as
      | {
          route_name: string;
          sla_minutes: number;
          auto_actions_json: string;
          requires_human: number;
          primary_team: string;
          secondary_team: string | null;
          lark_channel: string | null;
        }
      | undefined;

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

    const timeline: TrackerEvent[] = [];
    timeline.push({ at: a.created_at, kind: "raised", title: a.severity, actor: "Monitor 2.0" });
    if (a.acknowledged_at) timeline.push({ at: a.acknowledged_at, kind: "ack", title: "acknowledged", actor: poc?.name || null });
    if (ticket) {
      timeline.push({
        at: ticket.created_at,
        kind: "ticket",
        title: `${ticket.ticket_id} · ${ticket.status}`,
        actor: poc?.name || null,
      });
    }
    if (analysisRow) {
      timeline.push({
        at: analysisRow.created_at,
        kind: "rca",
        title: `${analysisRow.analysis_id} · ${analysisRow.mode}`,
        actor: "AI",
      });
    }
    if (intervention) {
      timeline.push({
        at: intervention.requested_at,
        kind: "intervention",
        title: intervention.status,
        actor: ro?.name || "Risk Owner",
      });
      if (intervention.decided_at) {
        timeline.push({
          at: intervention.decided_at,
          kind: "decided",
          title: intervention.decision_note || "decided",
          actor: ro?.name || null,
        });
      }
    }
    try {
      const spine = db
        .prepare(
          `SELECT created_at, title, actor FROM spine_events
           WHERE ref_id IN (?, ?, ?)
           ORDER BY created_at ASC LIMIT 12`
        )
        .all(a.alert_id, String(a.id), analysisRow?.analysis_id || "") as Array<{
        created_at: string;
        title: string;
        actor: string | null;
      }>;
      for (const s of spine) timeline.push({ at: s.created_at, kind: "spine", title: s.title, actor: s.actor });
    } catch {
      /* spine table may be empty */
    }
    timeline.sort((x, y) => String(x.at).localeCompare(String(y.at)));

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
      href: `/admin/alerts#${a.alert_id}`,
      poc,
      ro,
      gate,
      analysis,
      escalation: esc
        ? {
            route_name: esc.route_name,
            sla_minutes: esc.sla_minutes,
            primary_team: esc.primary_team,
            secondary_team: esc.secondary_team,
            lark_channel: esc.lark_channel,
            auto_actions: parseJsonArray(esc.auto_actions_json),
            requires_human: Boolean(esc.requires_human),
          }
        : null,
      timeline,
    };
  });
}
