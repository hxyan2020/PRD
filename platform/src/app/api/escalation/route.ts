import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb, writeAudit } from "@/lib/db";
import {
  DEFAULT_ESCALATION_COEFFICIENTS,
  DEFAULT_ROUTE_CODE,
  matchEscalationRoute,
} from "@/lib/escalation/match";

function isDefaultRoute(row: {
  is_default?: number | null;
  route_code?: string | null;
  domain_code?: string | null;
}) {
  return (
    Boolean(row.is_default) ||
    row.route_code === DEFAULT_ROUTE_CODE ||
    row.domain_code === "*" ||
    row.domain_code === "DEFAULT"
  );
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "escalation.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const db = getDb();
  const url = new URL(req.url);
  if (url.searchParams.get("match") === "1") {
    const domain = url.searchParams.get("domain") || "EXOTIC";
    const severity = url.searchParams.get("severity") || "WARN";
    const matched = matchEscalationRoute(db, domain, severity);
    return NextResponse.json({ matched });
  }
  const routes = db
    .prepare(
      `SELECT r.*,
              pt.name AS primary_team,
              st.name AS secondary_team,
              lc.name AS lark_channel
       FROM escalation_routes r
       JOIN teams pt ON pt.id = r.primary_team_id
       LEFT JOIN teams st ON st.id = r.secondary_team_id
       LEFT JOIN lark_channels lc ON lc.id = r.lark_channel_id
       ORDER BY CASE WHEN r.is_default = 1 THEN 0 ELSE 1 END, r.severity DESC, r.name`
    )
    .all();
  return NextResponse.json({ routes });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "escalation.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const db = getDb();

  if (body.action === "toggle") {
    const prev = db
      .prepare(`SELECT id, enabled, is_default, route_code, domain_code FROM escalation_routes WHERE id = ?`)
      .get(body.id) as
      | {
          id: number;
          enabled: number;
          is_default: number;
          route_code: string | null;
          domain_code: string;
        }
      | undefined;
    if (!prev) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (isDefaultRoute(prev) && !body.enabled) {
      return NextResponse.json(
        { error: "Cannot disable ESC-DEFAULT — every event must have an escalation path." },
        { status: 400 }
      );
    }
    const enabled = body.enabled ? 1 : 0;
    db.prepare(`UPDATE escalation_routes SET enabled = ? WHERE id = ?`).run(enabled, body.id);
    writeAudit(user, "TOGGLE_ESCALATION_ROUTE", "escalation_route", String(body.id), {
      before: { enabled: prev.enabled },
      after: { enabled },
      id: body.id,
      enabled: !!body.enabled,
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "update") {
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const prev = db
      .prepare(
        `SELECT id, coefficients_json, risk_scenario, involved_teams_json, pending_minutes_threshold
         FROM escalation_routes WHERE id = ?`
      )
      .get(body.id) as
      | {
          id: number;
          coefficients_json: string;
          risk_scenario: string | null;
          involved_teams_json: string | null;
          pending_minutes_threshold: number | null;
        }
      | undefined;
    if (!prev) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const coeffs = body.coefficients || DEFAULT_ESCALATION_COEFFICIENTS;
    db.prepare(
      `UPDATE escalation_routes
       SET coefficients_json = ?,
           risk_scenario = COALESCE(?, risk_scenario),
           involved_teams_json = COALESCE(?, involved_teams_json),
           pending_minutes_threshold = COALESCE(?, pending_minutes_threshold)
       WHERE id = ?`
    ).run(
      JSON.stringify(coeffs),
      body.risk_scenario ?? null,
      body.involved_teams ? JSON.stringify(body.involved_teams) : null,
      body.pending_minutes_threshold ?? null,
      body.id
    );
    writeAudit(user, "UPDATE_ESCALATION_ROUTE", "escalation_route", String(body.id), {
      before: {
        coefficients_json: prev.coefficients_json,
        risk_scenario: prev.risk_scenario,
        involved_teams_json: prev.involved_teams_json,
        pending_minutes_threshold: prev.pending_minutes_threshold,
      },
      after: {
        coefficients: coeffs,
        risk_scenario: body.risk_scenario ?? prev.risk_scenario,
        involved_teams: body.involved_teams ?? null,
        pending_minutes_threshold: body.pending_minutes_threshold ?? prev.pending_minutes_threshold,
      },
      ...body,
    });
    return NextResponse.json({ ok: true });
  }

  const defaultSlaRow = db
    .prepare(`SELECT value FROM platform_settings WHERE key = 'escalation.default_sla_minutes'`)
    .get() as { value: string } | undefined;
  const defaultSla = Number(defaultSlaRow?.value) || 30;

  const wantDefault = Boolean(body.is_default) || body.domain_code === "*" || body.route_code === DEFAULT_ROUTE_CODE;
  if (wantDefault) {
    db.prepare(`UPDATE escalation_routes SET is_default = 0`).run();
  }
  const info = db
    .prepare(
      `INSERT INTO escalation_routes
        (name, domain_code, severity, primary_team_id, secondary_team_id, lark_channel_id, sla_minutes,
         auto_actions_json, requires_human, enabled, route_code, is_default, coefficients_json, risk_scenario, involved_teams_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`
    )
    .run(
      body.name,
      body.domain_code,
      body.severity,
      body.primary_team_id,
      body.secondary_team_id || null,
      body.lark_channel_id || null,
      body.sla_minutes || defaultSla,
      JSON.stringify(body.auto_actions || ["create_ticket", "lark_notify"]),
      body.requires_human === false ? 0 : 1,
      body.route_code || (wantDefault ? DEFAULT_ROUTE_CODE : null),
      wantDefault ? 1 : 0,
      JSON.stringify(body.coefficients || DEFAULT_ESCALATION_COEFFICIENTS),
      body.risk_scenario || (wantDefault ? "exotic_or_unmatched" : null),
      JSON.stringify(body.involved_teams || [])
    );
  writeAudit(user, "CREATE_ESCALATION_ROUTE", "escalation_route", String(info.lastInsertRowid), {
    after: body,
  });
  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}
