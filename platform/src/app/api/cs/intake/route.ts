import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getUiLocale } from "@/lib/i18n-server";
import { ingestCsRequest } from "@/lib/cs/desk";

/**
 * Public-ish webhook for C1 live chat, the website form, and official mailboxes.
 * Prototype: session with cs.operate OR body.mock_webhook=true (demo connector).
 */
export async function POST(req: Request) {
  const locale = await getUiLocale();
  const body = await req.json().catch(() => ({}));
  const user = await getCurrentUser();
  const allowed =
    (user && (hasPermission(user.role_code, "cs.operate") || hasPermission(user.role_code, "*"))) ||
    body.mock_webhook === true ||
    req.headers.get("x-cs-intake-token") === "demo-c1";
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden — use session or x-cs-intake-token: demo-c1" }, { status: 403 });
  }
  const packed = ingestCsRequest({
    channel: body.channel || "C1_LIVE_CHAT",
    client_name: body.client_name || body.from_name || "Unknown client",
    client_email: body.client_email || body.from_email || "unknown@client.example",
    client_uid: body.client_uid || body.uid || null,
    subject: body.subject || body.title || "Inbound request",
    body: body.body || body.text || body.message || "",
    channel_ref: body.channel_ref || body.c1_id || body.message_id || null,
    locale: body.locale || locale,
    actor: user?.name || `webhook:${body.channel || "C1_LIVE_CHAT"}`,
  });
  return NextResponse.json({ ok: true, mock: true, ...packed });
}
