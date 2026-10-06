import type { UiLocale } from "@/lib/i18n";
import {
  CS_CHANNELS,
  continueCsRequest,
  extractCsPublicId,
  findCsRequestMatch,
  ingestCsRequest,
  publicCsStatus,
  type CsChannelCode,
  type CsFollowup,
  type CsMessage,
  type CsRequest,
} from "@/lib/cs/desk";
import { getDb } from "@/lib/db";

export const CS_INTAKE_TOKEN_HEADER = "x-cs-intake-token";
export const CS_INTAKE_DEMO_TOKEN = "demo-c1";

export type ParsedIntake = {
  channel: CsChannelCode;
  client_name: string;
  client_email: string;
  client_uid: string | null;
  subject: string;
  body: string;
  channel_ref: string | null;
  request_id: string | null;
  in_reply_to: string | null;
  locale: UiLocale;
  actor: string;
  portal: boolean;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function str(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function pick(body: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = str(body[key]);
    if (v) return v;
  }
  return "";
}

export function inferIntakeChannel(body: Record<string, unknown>): CsChannelCode {
  const raw = pick(body, ["channel", "source", "connector", "kind"]).toUpperCase().replace(/[\s-]+/g, "_");
  if (raw === "C1_LIVE_CHAT" || raw === "C1" || raw === "LIVE_CHAT" || raw === "CHAT") return "C1_LIVE_CHAT";
  if (raw === "WEB_FORM" || raw === "FORM" || raw === "SUBMISSION_FORM" || raw === "CONTACT_FORM") return "WEB_FORM";
  if (raw === "OFFICIAL_EMAIL" || raw === "EMAIL" || raw === "MAILBOX" || raw === "MAIL") return "OFFICIAL_EMAIL";
  if (body.c1_id || body.session_id || body.chat_id || body.visitor_id) return "C1_LIVE_CHAT";
  if (body.form_id || body.page_url || body.form_name) return "WEB_FORM";
  if (body.from_email || body.in_reply_to || body.mailbox || body.message_id) return "OFFICIAL_EMAIL";
  return "C1_LIVE_CHAT";
}

function headerValue(headers: Headers | undefined, name: string): string {
  if (!headers) return "";
  return str(headers.get(name) || headers.get(name.toLowerCase()));
}

/**
 * Normalise C1 webhook, website form, and mailbox-gateway payloads onto one shape.
 */
export function parseIntakePayload(
  raw: unknown,
  headers?: Headers,
  locale: UiLocale = "en"
): ParsedIntake {
  const body = asRecord(raw);
  const nested = asRecord(body.data || body.payload || body.message);
  const merged: Record<string, unknown> = { ...nested, ...body };
  const headerBag = asRecord(merged.headers);
  const channel = inferIntakeChannel(merged);
  const inReplyTo =
    pick(merged, ["in_reply_to", "inReplyTo", "reply_to_id"]) ||
    str(headerBag["in-reply-to"] || headerBag["In-Reply-To"]) ||
    headerValue(headers, "in-reply-to");
  const requestId =
    extractCsPublicId(pick(merged, ["request_id", "continue_request_id", "ticket_id", "case_id"])) ||
    extractCsPublicId(inReplyTo) ||
    extractCsPublicId(pick(merged, ["subject", "title", "re_subject"]));
  const channelRef =
    pick(merged, ["channel_ref", "c1_id", "session_id", "chat_id", "form_id", "message_id", "thread_id"]) || null;
  const clientName =
    pick(merged, ["client_name", "from_name", "name", "full_name", "visitor_name"]) || "Unknown client";
  const clientEmail =
    pick(merged, ["client_email", "from_email", "email", "reply_to"]) || "unknown@client.example";
  const subject =
    pick(merged, ["subject", "title", "re_subject"]) ||
    (channel === "C1_LIVE_CHAT" ? "C1 live chat" : channel === "WEB_FORM" ? "Web form" : "Official email");
  const text =
    pick(merged, ["body", "text", "message", "content", "comment", "html_text"]) || "";
  const portal = merged.portal === true || pick(merged, ["via"]) === "portal";
  const actor =
    pick(merged, ["actor"]) ||
    (portal ? `portal:${channel}` : `webhook:${channel}`);
  return {
    channel,
    client_name: clientName,
    client_email: clientEmail,
    client_uid: pick(merged, ["client_uid", "uid", "account_uid"]) || null,
    subject,
    body: text,
    channel_ref: channelRef,
    request_id: requestId,
    in_reply_to: inReplyTo || null,
    locale: locale === "zh-Hant" ? "zh-Hant" : "en",
    actor,
    portal,
  };
}

export type IntakeResult = {
  mode: "new" | "continue";
  continued: boolean;
  closed_wait: boolean;
  request: CsRequest | undefined;
  messages?: CsMessage[];
  followups?: CsFollowup[];
};

export function ingestOrContinue(parsed: ParsedIntake): IntakeResult {
  if (!parsed.body) {
    throw new Error("Message body is required");
  }
  const existing = findCsRequestMatch({
    request_id: parsed.request_id,
    channel: parsed.channel,
    channel_ref: parsed.channel_ref,
    in_reply_to: parsed.in_reply_to,
    subject: parsed.subject,
  });
  const inboundKind =
    parsed.channel === "OFFICIAL_EMAIL" ? "EMAIL_IN" : parsed.channel === "WEB_FORM" ? "FORM" : "CLIENT";
  if (existing) {
    const packed = continueCsRequest({
      request_id: existing.id,
      text: parsed.body,
      locale: parsed.locale,
      actor: parsed.actor,
      kind: inboundKind,
      client_uid: parsed.client_uid,
    });
    return {
      mode: "continue",
      continued: true,
      closed_wait: packed.closed_wait,
      request: packed.request,
      messages: packed.messages,
      followups: packed.followups,
    };
  }
  const packed = ingestCsRequest({
    channel: parsed.channel,
    client_name: parsed.client_name,
    client_email: parsed.client_email,
    client_uid: parsed.client_uid,
    subject: parsed.subject,
    body: parsed.body,
    channel_ref: parsed.channel_ref,
    locale: parsed.locale,
    actor: parsed.actor,
  });
  return {
    mode: "new",
    continued: false,
    closed_wait: false,
    request: packed?.request,
    messages: packed?.messages,
    followups: packed?.followups,
  };
}

export function intakeConnectorCatalog() {
  return {
    ok: true,
    mock: true,
    portal: "/cs",
    endpoint: "/api/cs/intake",
    token_header: CS_INTAKE_TOKEN_HEADER,
    demo_token: CS_INTAKE_DEMO_TOKEN,
    connectors: CS_CHANNELS.map((ch) => ({
      code: ch.code,
      name: ch.name,
      kind: ch.kind,
      description: ch.description,
      endpoint: ch.endpoint,
    })),
    match: [
      { field: "request_id", how: "CSR-XXXX public ticket id" },
      { field: "in_reply_to", how: "message id, channel_ref, or CSR-XXXX" },
      { field: "channel_ref", how: "same C1 session / form / mailbox thread" },
      { field: "subject", how: "CSR-[0-9A-F]{6} in the email subject" },
    ],
    followup: {
      when: ["unclear", "need_id"],
      cap: 3,
      until: "client replies on any connected channel",
    },
  };
}

export function lookupPublicCsStatus(requestId: string) {
  const publicId = extractCsPublicId(requestId);
  if (!publicId) return null;
  const db = getDb();
  const row = findCsRequestMatch({ request_id: publicId }, db);
  if (!row) return null;
  return publicCsStatus(row, db);
}
