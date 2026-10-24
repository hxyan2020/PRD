import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb, writeAudit } from "@/lib/db";
import { analyzeOpenAlerts } from "@/lib/ai/analyze";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "monitor.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const db = getDb();
  const indicators = db.prepare(`SELECT * FROM monitor_indicators ORDER BY status DESC, name`).all();
  const alerts = db
    .prepare(
      `SELECT a.*, i.name AS indicator_name, i.monitor_id
       FROM monitor_alerts a
       JOIN monitor_indicators i ON i.id = a.indicator_id
       ORDER BY a.created_at DESC`
    )
    .all();
  const tickets = db
    .prepare(
      `SELECT t.*, u.name AS assignee_name
       FROM monitor_tickets t
       LEFT JOIN users u ON u.id = t.assignee_user_id
       ORDER BY t.updated_at DESC`
    )
    .all();
  return NextResponse.json({ indicators, alerts, tickets });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "monitor.operate")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const action = body.action as string;

  if (action === "ack_alert") {
    getDb()
      .prepare(
        `UPDATE monitor_alerts
         SET status = 'ACKNOWLEDGED', acknowledged_at = datetime('now'), acknowledged_by = ?
         WHERE id = ?`
      )
      .run(user.id, body.alert_id);
    writeAudit(user, "ACK_ALERT", "monitor_alert", String(body.alert_id));
    return NextResponse.json({ ok: true });
  }

  if (action === "update_ticket") {
    getDb()
      .prepare(
        `UPDATE monitor_tickets
         SET status = COALESCE(?, status),
             assignee_user_id = COALESCE(?, assignee_user_id),
             updated_at = datetime('now'),
             resolved_at = CASE WHEN ? IN ('RESOLVED','CLOSED') THEN datetime('now') ELSE resolved_at END
         WHERE id = ?`
      )
      .run(body.status ?? null, body.assignee_user_id ?? null, body.status ?? "", body.ticket_id);
    writeAudit(user, "UPDATE_TICKET", "monitor_ticket", String(body.ticket_id), body);
    return NextResponse.json({ ok: true });
  }

  if (action === "sync_monitor2") {
    writeAudit(user, "SYNC_MONITOR2", "integration", "monitor2", {
      pulled_alerts: 5,
      pushed_acks: 1,
    });
    // Auto-trigger AI analysis for open alarms (idempotent unless force)
    const auto =
      (
        getDb().prepare(`SELECT value FROM platform_settings WHERE key = 'ai.auto_on_alarm'`).get() as
          | { value: string }
          | undefined
      )?.value !== "false";
    let aiCount = 0;
    if (auto) {
      const results = analyzeOpenAlerts({ force: false });
      aiCount = results.length;
    }
    return NextResponse.json({
      ok: true,
      message: `Prototype sync with Monitor 2.0 completed; AI analyses ensured for ${aiCount} open alarm(s)`,
      pulled_alerts: 5,
      pushed_acks: 1,
      ai_analyses: aiCount,
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
