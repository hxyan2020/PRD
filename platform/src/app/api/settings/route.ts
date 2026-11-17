import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb, writeAudit } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "settings.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const settings = getDb().prepare(`SELECT * FROM platform_settings ORDER BY key`).all();
  return NextResponse.json({ settings });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "settings.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  if (!body.key || body.value === undefined) {
    return NextResponse.json({ error: "key and value required" }, { status: 400 });
  }
  const db = getDb();
  const prev = db
    .prepare(`SELECT key, value, description FROM platform_settings WHERE key = ?`)
    .get(body.key) as { key: string; value: string; description: string | null } | undefined;
  db.prepare(
    `UPDATE platform_settings
     SET value = ?, updated_at = datetime('now'), updated_by = ?
     WHERE key = ?`
  ).run(String(body.value), user.id, body.key);
  writeAudit(user, "UPDATE_SETTING", "platform_settings", body.key, {
    before: prev ? { value: prev.value } : null,
    after: { value: String(body.value) },
    value: body.value,
  });
  return NextResponse.json({ ok: true });
}
