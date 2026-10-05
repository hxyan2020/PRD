import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb, writeAudit } from "@/lib/db";
import { DEFAULT_ESCALATION_COEFFICIENTS } from "@/lib/escalation/match";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "escalation.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const routes = getDb()
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
    db.prepare(`UPDATE escalation_routes SET enabled = ? WHERE id = ?`).run(body.enabled ? 1 : 0, body.id);
    writeAudit(user, "TOGGLE_ESCALATION_ROUTE", "escalation_route", String(body.id), body);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "update") {
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
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
    writeAudit(user, "UPDATE_ESCALATION_ROUTE", "escalation_route", String(body.id), body);
    return NextResponse.json({ ok: true });
  }

  const defaultSlaRow = db
    .prepare(`SELECT value FROM platform_settings WHERE key = 'escalation.default_sla_minutes'`)
    .get() as { value: string } | undefined;
  const defaultSla = Number(defaultSlaRow?.value) || 30;

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
      body.route_code || null,
      body.is_default ? 1 : 0,
      JSON.stringify(body.coefficients || DEFAULT_ESCALATION_COEFFICIENTS),
      body.risk_scenario || null,
      JSON.stringify(body.involved_teams || [])
    );
  writeAudit(user, "CREATE_ESCALATION_ROUTE", "escalation_route", String(info.lastInsertRowid), body);
  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}
