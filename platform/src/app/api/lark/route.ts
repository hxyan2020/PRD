import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb, writeAudit } from "@/lib/db";
import { getUiLocale } from "@/lib/i18n-server";
import { applyLarkCardAction, type LarkCardAction } from "@/lib/lark/actions";
import { listLarkCards, syncLarkCardsFromThreads } from "@/lib/lark/cards";
import { syncNewAlertsToMessenger } from "@/lib/messenger/demo";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "lark.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const channels = getDb().prepare(`SELECT * FROM lark_channels ORDER BY name`).all();
  const settings = getDb()
    .prepare(`SELECT key, value, description FROM platform_settings WHERE key LIKE 'lark.%'`)
    .all();
  try {
    syncNewAlertsToMessenger(10);
    syncLarkCardsFromThreads();
  } catch {
    /* empty snapshot */
  }
  const cards = listLarkCards();
  return NextResponse.json({ channels, settings, cards });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "lark.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();

  if (body.action === "card_ack" || body.action === "card_escalate" || body.action === "card_dismiss" || body.action === "card_close") {
    const canAct =
      hasPermission(user.role_code, "lark.manage") ||
      hasPermission(user.role_code, "escalation.manage") ||
      hasPermission(user.role_code, "risk.intervene") ||
      hasPermission(user.role_code, "intervene.operate") ||
      hasPermission(user.role_code, "ai.operate") ||
      hasPermission(user.role_code, "*");
    if (!canAct && !hasPermission(user.role_code, "lark.read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const map: Record<string, LarkCardAction> = {
      card_ack: "ack",
      card_escalate: "escalate",
      card_dismiss: "dismiss",
      card_close: "close",
    };
    const locale = await getUiLocale();
    try {
      const result = applyLarkCardAction({
        card_id: Number(body.card_id),
        action: map[body.action],
        user_name: user.name,
        locale,
      });
      return NextResponse.json({ ...result, cards: listLarkCards() });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (!hasPermission(user.role_code, "lark.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
    const db = getDb();
    const prev = db
      .prepare(`SELECT id, enabled FROM lark_channels WHERE id = ?`)
      .get(body.channel_id) as { id: number; enabled: number } | undefined;
    if (!prev) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const enabled = body.enabled ? 1 : 0;
    db.prepare(`UPDATE lark_channels SET enabled = ? WHERE id = ?`).run(enabled, body.channel_id);
    writeAudit(user, "TOGGLE_LARK_CHANNEL", "lark_channel", String(body.channel_id), {
      before: { enabled: prev.enabled },
      after: { enabled },
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
