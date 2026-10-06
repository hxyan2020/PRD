import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getUiLocale } from "@/lib/i18n-server";
import {
  CS_INTAKE_DEMO_TOKEN,
  CS_INTAKE_TOKEN_HEADER,
  ingestOrContinue,
  intakeConnectorCatalog,
  lookupPublicCsStatus,
  parseIntakePayload,
} from "@/lib/cs/intake";
import { getCsIntakeToken } from "@/lib/cs/ops-data";

function intakeAllowed(req: Request, body: Record<string, unknown>, user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (user && (hasPermission(user.role_code, "cs.operate") || hasPermission(user.role_code, "*"))) return true;
  if (body.mock_webhook === true || body.portal === true) return true;
  if (req.headers.get(CS_INTAKE_TOKEN_HEADER) === getCsIntakeToken()) return true;
  return false;
}

/** Public connector catalog + optional ticket status (`?request_id=CSR-XXXX`). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const requestId = url.searchParams.get("request_id") || url.searchParams.get("id");
  if (requestId) {
    const status = lookupPublicCsStatus(requestId);
    if (!status) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, mock: true, ...status });
  }
  return NextResponse.json(intakeConnectorCatalog());
}

/**
 * Realtime webhook for C1 live chat, the website form, and official mailboxes.
 * Prototype auth: session with cs.operate, body.mock_webhook / portal, or header x-cs-intake-token: demo-c1.
 * Inbound replies match request_id / in_reply_to / channel_ref / CSR-XXXX in the subject and close WAITING auto-mail.
 */
export async function POST(req: Request) {
  const locale = await getUiLocale();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const user = await getCurrentUser();
  if (!intakeAllowed(req, body, user)) {
    return NextResponse.json({ error: "Forbidden — use session or x-cs-intake-token: demo-c1" }, { status: 403 });
  }
  try {
    const parsed = parseIntakePayload(body, req.headers, (body.locale as "en" | "zh-Hant") || locale);
    if (user?.name && !body.actor) parsed.actor = user.name;
    const packed = ingestOrContinue(parsed);
    const waiting = (packed.followups || []).find((f) => f.status === "WAITING") || null;
    return NextResponse.json({
      ok: true,
      mock: true,
      mode: packed.mode,
      continued: packed.continued,
      closed_wait: packed.closed_wait,
      auto_email: waiting
        ? { to: waiting.email_to, subject: waiting.subject, reason: waiting.reason, status: waiting.status }
        : null,
      request: packed.request,
      messages: packed.messages,
      followups: packed.followups,
      public: packed.request
        ? {
            request_id: packed.request.request_id,
            status: packed.request.status,
            ai_clarity: packed.request.ai_clarity,
            skill_code: packed.request.skill_code,
            channel: packed.request.channel,
            channel_ref: packed.request.channel_ref,
          }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
