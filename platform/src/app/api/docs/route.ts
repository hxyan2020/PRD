import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb, writeAudit } from "@/lib/db";
import { deleteDocEdit, getDocEdit, isAdminDocKey, upsertDocEdit } from "@/lib/docs/edit-store";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "admin.access")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const url = new URL(req.url);
  const key = String(url.searchParams.get("key") || "");
  const locale = String(url.searchParams.get("locale") || "en");
  if (!isAdminDocKey(key)) return NextResponse.json({ error: "Unknown doc" }, { status: 400 });
  const row = getDocEdit(getDb(), key, locale);
  return NextResponse.json({
    key,
    locale,
    content: row?.content ?? null,
    updated_at: row?.updated_at ?? null,
    updated_by: row?.updated_by ?? null,
  });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "admin.access")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let body: { key?: string; locale?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const key = String(body.key || "");
  const locale = String(body.locale || "en").slice(0, 16);
  const content = String(body.content ?? "");
  if (!isAdminDocKey(key)) return NextResponse.json({ error: "Unknown doc" }, { status: 400 });
  if (content.length > 800_000) return NextResponse.json({ error: "Document too large" }, { status: 413 });
  upsertDocEdit(getDb(), key, locale, content, user.email);
  writeAudit(user, "DOC_UPDATE", "admin_doc", key, { locale, bytes: content.length });
  return NextResponse.json({ ok: true, key, locale, localOnly: false });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "admin.access")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const url = new URL(req.url);
  const key = String(url.searchParams.get("key") || "");
  const locale = String(url.searchParams.get("locale") || "en");
  if (!isAdminDocKey(key)) return NextResponse.json({ error: "Unknown doc" }, { status: 400 });
  deleteDocEdit(getDb(), key, locale);
  writeAudit(user, "DOC_RESET", "admin_doc", key, { locale });
  return NextResponse.json({ ok: true });
}
