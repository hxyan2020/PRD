import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getUiLocale } from "@/lib/i18n-server";
import { getCsDashboard, getCsLog } from "@/lib/cs/analytics";
import {
  agentReply,
  applyTriage,
  assignToTr,
  escalateToRisk,
  getCsRequest,
  ingestCsRequest,
  listCsInbox,
  recordClientReply,
  resolveRequest,
  sendFollowupEmail,
  type CsClarity,
} from "@/lib/cs/desk";

function canRead(role: string) {
  return (
    hasPermission(role, "cs.read") ||
    hasPermission(role, "cs.operate") ||
    hasPermission(role, "lark.read") ||
    hasPermission(role, "*")
  );
}

function canOperate(role: string) {
  return hasPermission(role, "cs.operate") || hasPermission(role, "*") || hasPermission(role, "lark.manage");
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !canRead(user.role_code)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const view = url.searchParams.get("view");
  if (id) {
    const detail = getCsRequest(Number(id));
    if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(detail);
  }
  if (view === "dashboard") return NextResponse.json(getCsDashboard());
  if (view === "log") return NextResponse.json(getCsLog());
  return NextResponse.json(listCsInbox());
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !canOperate(user.role_code)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const locale = await getUiLocale();
  const body = await req.json();
  const action = String(body.action || "");
  const requestId = Number(body.request_id || 0);
  const actor = user.name;

  try {
    if (action === "list") return NextResponse.json(listCsInbox());

    if (action === "ingest" || action === "simulate_c1" || action === "simulate_form" || action === "simulate_email") {
      const channel =
        action === "simulate_form"
          ? "WEB_FORM"
          : action === "simulate_email"
            ? "OFFICIAL_EMAIL"
            : body.channel || "C1_LIVE_CHAT";
      const packed = ingestCsRequest({
        channel,
        client_name: body.client_name || "Demo client",
        client_email: body.client_email || "demo.client@client.example",
        client_uid: body.client_uid || "900001",
        subject: body.subject || (channel === "C1_LIVE_CHAT" ? "C1 live chat" : "Client request"),
        body: body.body || body.text || "Hello, I need help with my account.",
        locale,
        actor,
      });
      return NextResponse.json({ ok: true, ...packed, inbox: listCsInbox() });
    }

    if (!requestId) return NextResponse.json({ error: "request_id required" }, { status: 400 });

    if (action === "triage") {
      return NextResponse.json({ ok: true, ...applyTriage(requestId, locale) });
    }
    if (action === "followup") {
      const reason = (body.reason === "need_id" ? "need_id" : "unclear") as CsClarity;
      return NextResponse.json({ ok: true, ...sendFollowupEmail(requestId, reason, locale) });
    }
    if (action === "client_reply") {
      const text = String(body.text || "").trim();
      if (!text) return NextResponse.json({ error: "Reply text required" }, { status: 400 });
      return NextResponse.json({ ok: true, ...recordClientReply({ request_id: requestId, text, locale, actor }) });
    }
    if (action === "reply") {
      const text = String(body.text || "").trim();
      if (!text) return NextResponse.json({ error: "Message required" }, { status: 400 });
      return NextResponse.json({ ok: true, ...agentReply({ request_id: requestId, text, user_name: actor }) });
    }
    if (action === "assign_tr") {
      return NextResponse.json({ ok: true, ...assignToTr(requestId, actor, locale) });
    }
    if (action === "escalate_risk") {
      return NextResponse.json({ ok: true, ...escalateToRisk(requestId, actor, locale) });
    }
    if (action === "resolve") {
      return NextResponse.json({ ok: true, ...resolveRequest(requestId, actor, locale) });
    }
    return NextResponse.json({ error: `Unknown action ${action}` }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
