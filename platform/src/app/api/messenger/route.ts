import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getUiLocale } from "@/lib/i18n-server";
import {
  getMessengerThread,
  listMessengerThreads,
  messengerAction,
  syncNewAlertsToMessenger,
  type MessengerAction,
} from "@/lib/messenger/demo";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "lark.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (id) {
    const detail = getMessengerThread(Number(id));
    if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(detail);
  }
  syncNewAlertsToMessenger(10);
  return NextResponse.json({ threads: listMessengerThreads() });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "lark.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  if (body.action === "sync") {
    const n = syncNewAlertsToMessenger(Number(body.limit ?? 10));
    return NextResponse.json({ ok: true, synced: n, threads: listMessengerThreads() });
  }

  if (body.action === "list") {
    return NextResponse.json({ ok: true, threads: listMessengerThreads() });
  }

  const locale = await getUiLocale();
  const detail = messengerAction({
    thread_id: Number(body.thread_id),
    action: body.action as MessengerAction,
    user_name: user.name,
    text: body.text,
    action_code: body.action_code,
    pending_id: body.pending_id ? Number(body.pending_id) : undefined,
    locale,
  });
  return NextResponse.json({ ok: true, ...detail });
}
