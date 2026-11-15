import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb, writeAudit } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "lark.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const channels = getDb().prepare(`SELECT * FROM lark_channels ORDER BY name`).all();
  const settings = getDb()
    .prepare(`SELECT key, value, description FROM platform_settings WHERE key LIKE 'lark.%'`)
    .all();
  return NextResponse.json({ channels, settings });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "lark.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();

  if (body.action === "test_notify") {
    writeAudit(user, "LARK_TEST_NOTIFY", "lark_channel", String(body.channel_id), {
      message: body.message || "CRMP test notification",
    });
    return NextResponse.json({
      ok: true,
      delivered: true,
      mock: true,
      note: "Prototype: message logged to audit; wire Lark webhook in production.",
    });
  }

  if (body.action === "toggle_channel") {
    getDb().prepare(`UPDATE lark_channels SET enabled = ? WHERE id = ?`).run(body.enabled ? 1 : 0, body.channel_id);
    writeAudit(user, "TOGGLE_LARK_CHANNEL", "lark_channel", String(body.channel_id), {
      enabled: body.enabled,
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "create_channel") {
    const info = getDb()
      .prepare(
        `INSERT INTO lark_channels (name, chat_id, purpose, department_code, severity_min, enabled, webhook_url)
         VALUES (?, ?, ?, ?, ?, 1, ?)`
      )
      .run(
        body.name,
        body.chat_id,
        body.purpose,
        body.department_code || null,
        body.severity_min || "WARN",
        body.webhook_url || null
      );
    writeAudit(user, "CREATE_LARK_CHANNEL", "lark_channel", String(info.lastInsertRowid), body);
    return NextResponse.json({ ok: true, id: info.lastInsertRowid });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
