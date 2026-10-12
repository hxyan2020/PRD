import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb, writeAudit } from "@/lib/db";

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
       ORDER BY r.severity DESC, r.name`
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
  if (body.action === "toggle") {
    getDb().prepare(`UPDATE escalation_routes SET enabled = ? WHERE id = ?`).run(body.enabled ? 1 : 0, body.id);
    writeAudit(user, "TOGGLE_ESCALATION_ROUTE", "escalation_route", String(body.id), body);
    return NextResponse.json({ ok: true });
  }
  const info = getDb()
    .prepare(
      `INSERT INTO escalation_routes
        (name, domain_code, severity, primary_team_id, secondary_team_id, lark_channel_id, sla_minutes, auto_actions_json, requires_human, enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
    )
    .run(
      body.name,
      body.domain_code,
      body.severity,
      body.primary_team_id,
      body.secondary_team_id || null,
      body.lark_channel_id || null,
      body.sla_minutes || 30,
      JSON.stringify(body.auto_actions || ["create_ticket", "lark_notify"]),
      body.requires_human === false ? 0 : 1
    );
  writeAudit(user, "CREATE_ESCALATION_ROUTE", "escalation_route", String(info.lastInsertRowid), body);
  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}
