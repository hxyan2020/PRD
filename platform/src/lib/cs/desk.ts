import { randomBytes } from "crypto";
import type Database from "better-sqlite3";
import { getDb, writeAudit } from "@/lib/db";
import type { UiLocale } from "@/lib/i18n";
import { CS_SKILL_CODES, csSkillName, skillCodeForTriage } from "@/lib/cs/skills";

export const CS_CHANNELS = [
  {
    code: "C1_LIVE_CHAT",
    name: "C1 live chat",
    kind: "live_chat",
    description: "Platform 24/7 live chat (C1) — questions and complaints in real time.",
    endpoint: "/api/cs/intake",
  },
  {
    code: "WEB_FORM",
    name: "Submission form",
    kind: "form",
    description: "Website / app contact form posts into the CS/TR desk.",
    endpoint: "/api/cs/intake",
  },
  {
    code: "OFFICIAL_EMAIL",
    name: "Official email",
    kind: "email",
    description: "Official support mailboxes (support@, complaints@) ingested as requests.",
    endpoint: "/api/cs/intake",
  },
] as const;

export type CsChannelCode = (typeof CS_CHANNELS)[number]["code"];
export type CsDesk = "CS" | "TR";
export type CsClarity = "clear" | "unclear" | "need_id";

export type CsRequest = {
  id: number;
  request_id: string;
  channel: string;
  channel_ref: string | null;
  desk: string;
  category: string;
  client_name: string;
  client_email: string;
  client_uid: string | null;
  subject: string;
  body: string;
  status: string;
  ai_clarity: string;
  followup_count: number;
  assigned_to: string | null;
  skill_code: string | null;
  created_at: string;
  updated_at: string;
};

export type CsMessage = {
  id: number;
  request_db_id: number;
  msg_id: string;
  kind: string;
  sender: string;
  body: string;
  meta_json: string;
  created_at: string;
};

export type CsFollowup = {
  id: number;
  request_db_id: number;
  email_to: string;
  subject: string;
  body: string;
  reason: string;
  status: string;
  sent_at: string;
  replied_at: string | null;
};

function newId(prefix: string) {
  return `${prefix}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export function ensureCsSchema(db: Database.Database = getDb()) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cs_channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      description TEXT,
      endpoint TEXT,
      enabled INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS cs_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id TEXT NOT NULL UNIQUE,
      channel TEXT NOT NULL,
      channel_ref TEXT,
      desk TEXT NOT NULL DEFAULT 'CS',
      category TEXT NOT NULL DEFAULT 'question',
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL,
      client_uid TEXT,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      ai_clarity TEXT NOT NULL DEFAULT 'clear',
      followup_count INTEGER NOT NULL DEFAULT 0,
      assigned_to TEXT,
      skill_code TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS cs_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_db_id INTEGER NOT NULL,
      msg_id TEXT NOT NULL UNIQUE,
      kind TEXT NOT NULL,
      sender TEXT NOT NULL,
      body TEXT NOT NULL,
      meta_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (request_db_id) REFERENCES cs_requests(id)
    );
    CREATE TABLE IF NOT EXISTS cs_followups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_db_id INTEGER NOT NULL,
      email_to TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'WAITING',
      sent_at TEXT NOT NULL DEFAULT (datetime('now')),
      replied_at TEXT,
      FOREIGN KEY (request_db_id) REFERENCES cs_requests(id)
    );
  `);
  const insert = db.prepare(
    `INSERT INTO cs_channels (code, name, kind, description, endpoint, enabled)
     VALUES (?, ?, ?, ?, ?, 1)
     ON CONFLICT(code) DO UPDATE SET name = excluded.name, description = excluded.description, endpoint = excluded.endpoint`
  );
  for (const ch of CS_CHANNELS) {
    insert.run(ch.code, ch.name, ch.kind, ch.description, ch.endpoint);
  }
  const cols = db.prepare(`PRAGMA table_info(cs_requests)`).all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === "skill_code")) {
    db.exec(`ALTER TABLE cs_requests ADD COLUMN skill_code TEXT`);
  }
  db.prepare(
    `UPDATE cs_requests SET skill_code = CASE
       WHEN skill_code IS NOT NULL AND skill_code != '' THEN skill_code
       WHEN status = 'ESCALATED_RISK' THEN 'SKILL-CS-ESCALATE-RISK'
       WHEN ai_clarity = 'need_id' THEN 'SKILL-CS-ID-VERIFY'
       WHEN ai_clarity = 'unclear' THEN 'SKILL-CS-CLARIFY'
       WHEN desk = 'TR' OR category = 'trading' THEN 'SKILL-TR-EXECUTION'
       ELSE 'SKILL-CS-ACCOUNT-FAQ'
     END
     WHERE skill_code IS NULL OR skill_code = ''`
  ).run();
}

function addMessage(
  db: Database.Database,
  requestDbId: number,
  kind: string,
  sender: string,
  body: string,
  meta: Record<string, unknown> = {}
) {
  const msgId = newId("CSM");
  db.prepare(
    `INSERT INTO cs_messages (request_db_id, msg_id, kind, sender, body, meta_json)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(requestDbId, msgId, kind, sender, body, JSON.stringify(meta));
  db.prepare(`UPDATE cs_requests SET updated_at = datetime('now') WHERE id = ?`).run(requestDbId);
  return msgId;
}

const ID_RE = /passport|id card|id document|\bkyc\b|verify.*(identity|account)|proof of (id|identity)|身分|證件|核身|身份證明/i;
const UNCLEAR_RE = /\b(not sure|idk|dunno|\?\?\?|whatever|something wrong|help me|不清楚|不知道|隨便|有問題)\b/i;
const TRADING_RE = /\b(order|fill|slippage|stop-?out|mt4|mt5|execution|deal|spread|requote|倉位|成交|點差|槓桿|停損|掛單)\b/i;
const COMPLAINT_RE = /\b(complaint|angry|refund|chargeback|scam|lawsuit|投訴|退款|詐騙|投訴信)\b/i;

export function triageText(subject: string, body: string): {
  clarity: CsClarity;
  desk: CsDesk;
  category: string;
} {
  const blob = `${subject}\n${body}`;
  const trading = TRADING_RE.test(blob);
  const complaint = COMPLAINT_RE.test(blob);
  const needId = ID_RE.test(blob) || /verify my account|cannot login|帳戶驗證|登不進去/i.test(blob);
  const tooThin = blob.replace(/\s+/g, " ").trim().length < 48;
  const unclear = tooThin || UNCLEAR_RE.test(blob);
  let clarity: CsClarity = "clear";
  if (needId) clarity = "need_id";
  else if (unclear) clarity = "unclear";
  const desk: CsDesk = trading ? "TR" : "CS";
  const category = needId ? "kyc" : trading ? "trading" : complaint ? "complaint" : "question";
  return { clarity, desk, category };
}

function followupCopy(
  req: { request_id: string; client_name: string; clarity: CsClarity },
  zh: boolean
) {
  if (req.clarity === "need_id") {
    return {
      subject: zh
        ? `請完成身分驗證 — 案件 ${req.request_id}`
        : `Please verify your identity — request ${req.request_id}`,
      body: zh
        ? `${req.client_name} 您好，\n\n為繼續處理 ${req.request_id}，我們需要您回覆：\n1) 證件（護照或身分證）清晰照片\n2) 帳戶 UID 後四碼\n3) 與帳戶持有人一致的自拍\n\n請直接回覆此信。在您回覆前案件會保持「待客戶／身分驗證」。\n\nVantage CS 24/7`
        : `${req.client_name},\n\nTo continue request ${req.request_id} we need you to reply with:\n1) A clear photo of your passport or ID card\n2) The last four digits of your account UID\n3) A selfie that matches the account holder\n\nPlease reply to this email. The case stays in ID verification until you do.\n\nVantage CS 24/7`,
    };
  }
  return {
    subject: zh
      ? `請補充說明 — 案件 ${req.request_id}`
      : `We need a bit more detail — request ${req.request_id}`,
    body: zh
      ? `${req.client_name} 您好，\n\nAI 目前無法判斷 ${req.request_id} 的具體需求。請回覆：\n• 發生什麼事、何時（時區）\n• 帳戶 UID\n• 商品／訂單號／截圖\n• 您希望我們做什麼\n\n收到回覆後我們會立刻續辦。\n\nVantage CS／TR`
      : `${req.client_name},\n\nOur AI could not tell what you need on ${req.request_id}. Please reply with:\n• What happened, and when (timezone)\n• Account UID\n• Symbol / order number / screenshot\n• What you would like us to do\n\nWe will continue as soon as you reply.\n\nVantage CS / TR`,
  };
}

export function getCsRequest(id: number) {
  ensureCsSchema();
  const db = getDb();
  const request = db.prepare(`SELECT * FROM cs_requests WHERE id = ?`).get(id) as CsRequest | undefined;
  if (!request) return null;
  const messages = db
    .prepare(`SELECT * FROM cs_messages WHERE request_db_id = ? ORDER BY id`)
    .all(id) as CsMessage[];
  const followups = db
    .prepare(`SELECT * FROM cs_followups WHERE request_db_id = ? ORDER BY id DESC`)
    .all(id) as CsFollowup[];
  return { request, messages, followups };
}

/** Public ticket token used in auto-email subjects, e.g. CSR-A1B2C3. */
export const CS_PUBLIC_ID_RE = /\bCSR-[0-9A-F]{6}\b/i;

export function extractCsPublicId(text: string | null | undefined): string | null {
  const m = String(text || "")
    .toUpperCase()
    .match(/\bCSR-[0-9A-F]{6}\b/);
  return m ? m[0] : null;
}

/**
 * Match an inbound C1/form/mailbox payload onto an open request so replies
 * close the auto-email wait loop instead of opening a duplicate ticket.
 */
export function findCsRequestMatch(
  input: {
    request_id?: string | null;
    channel?: string | null;
    channel_ref?: string | null;
    in_reply_to?: string | null;
    subject?: string | null;
  },
  db: Database.Database = getDb()
): CsRequest | undefined {
  ensureCsSchema(db);
  const publicId =
    extractCsPublicId(input.request_id) ||
    extractCsPublicId(input.in_reply_to) ||
    extractCsPublicId(input.subject);
  if (publicId) {
    const row = db
      .prepare(`SELECT * FROM cs_requests WHERE upper(request_id) = ?`)
      .get(publicId) as CsRequest | undefined;
    if (row) return row;
  }
  const reply = String(input.in_reply_to || "").trim();
  if (reply) {
    const byMsg = db
      .prepare(
        `SELECT r.* FROM cs_requests r
         JOIN cs_messages m ON m.request_db_id = r.id
         WHERE m.msg_id = ? OR r.channel_ref = ?
         ORDER BY r.id DESC LIMIT 1`
      )
      .get(reply, reply) as CsRequest | undefined;
    if (byMsg) return byMsg;
  }
  const ref = String(input.channel_ref || "").trim();
  if (ref) {
    const row = (
      input.channel
        ? db
            .prepare(
              `SELECT * FROM cs_requests WHERE channel_ref = ? AND channel = ? AND status != 'RESOLVED' ORDER BY id DESC LIMIT 1`
            )
            .get(ref, input.channel)
        : db
            .prepare(
              `SELECT * FROM cs_requests WHERE channel_ref = ? AND status != 'RESOLVED' ORDER BY id DESC LIMIT 1`
            )
            .get(ref)
    ) as CsRequest | undefined;
    if (row) return row;
  }
  return undefined;
}

export function publicCsStatus(row: CsRequest, db: Database.Database = getDb()) {
  const waiting = (
    db
      .prepare(`SELECT COUNT(*) AS c FROM cs_followups WHERE request_db_id = ? AND status = 'WAITING'`)
      .get(row.id) as { c: number }
  ).c;
  return {
    request_id: row.request_id,
    status: row.status,
    ai_clarity: row.ai_clarity,
    skill_code: row.skill_code,
    channel: row.channel,
    desk: row.desk,
    waiting: waiting > 0,
    followup_count: row.followup_count,
  };
}

/** Append an inbound client message; close WAITING follow-ups when present. */
export function continueCsRequest(
  input: {
    request_id: number;
    text: string;
    locale?: UiLocale;
    actor?: string;
    kind?: string;
    client_uid?: string | null;
  },
  db: Database.Database = getDb()
) {
  const row = db.prepare(`SELECT * FROM cs_requests WHERE id = ?`).get(input.request_id) as CsRequest | undefined;
  if (!row) throw new Error("Request not found");
  if (input.client_uid && !row.client_uid) {
    db.prepare(`UPDATE cs_requests SET client_uid = ?, updated_at = datetime('now') WHERE id = ?`).run(
      input.client_uid,
      row.id
    );
  }
  const waiting = (
    db
      .prepare(`SELECT COUNT(*) AS c FROM cs_followups WHERE request_db_id = ? AND status = 'WAITING'`)
      .get(row.id) as { c: number }
  ).c;
  if (waiting > 0) {
    const packed = recordClientReply(
      {
        request_id: row.id,
        text: input.text,
        locale: input.locale,
        actor: input.actor,
        kind: input.kind,
      },
      db
    );
    return { ...packed, continued: true as const, closed_wait: true as const };
  }
  const kind = input.kind || (row.channel === "OFFICIAL_EMAIL" ? "EMAIL_IN" : row.channel === "WEB_FORM" ? "FORM" : "CLIENT");
  addMessage(db, row.id, kind, row.client_name, input.text, { continued: true });
  db.prepare(`UPDATE cs_requests SET body = body || char(10) || ?, updated_at = datetime('now') WHERE id = ?`).run(
    input.text,
    row.id
  );
  writeAudit({ name: input.actor || row.client_name }, "CS_INTAKE_CONTINUE", "cs_request", row.request_id, {
    channel: row.channel,
  });
  const packed = applyTriage(row.id, input.locale || "en", db);
  return { ...packed, continued: true as const, closed_wait: false as const };
}

export function sendFollowupEmail(
  requestDbId: number,
  reason: CsClarity,
  locale: UiLocale = "en",
  db: Database.Database = getDb()
) {
  const zh = locale === "zh-Hant";
  const row = db.prepare(`SELECT * FROM cs_requests WHERE id = ?`).get(requestDbId) as CsRequest | undefined;
  if (!row) throw new Error("Request not found");
  if (row.followup_count >= 3) {
    addMessage(
      db,
      row.id,
      "SYSTEM",
      "CS AI",
      zh
        ? "已達 3 封自動追問信上限。請 CS Lead 人工跟進，勿再自動寄信。"
        : "Reached the 3-mail automatic follow-up cap. CS Lead must follow up in person — no more auto-mail."
    );
    return getCsRequest(row.id);
  }
  const copy = followupCopy({ request_id: row.request_id, client_name: row.client_name, clarity: reason }, zh);
  db.prepare(
    `INSERT INTO cs_followups (request_db_id, email_to, subject, body, reason, status)
     VALUES (?, ?, ?, ?, ?, 'WAITING')`
  ).run(row.id, row.client_email, copy.subject, copy.body, reason);
  db.prepare(
    `UPDATE cs_requests
     SET followup_count = followup_count + 1,
         status = ?,
         ai_clarity = ?,
         updated_at = datetime('now')
     WHERE id = ?`
  ).run(reason === "need_id" ? "ID_VERIFY" : "AWAITING_CLIENT", reason, row.id);
  addMessage(db, row.id, "EMAIL_OUT", zh ? "官方信箱（自動）" : "Official mailbox (auto)", copy.body, {
    to: row.client_email,
    subject: copy.subject,
    reason,
    mock: true,
  });
  writeAudit({ name: "CS AI" }, "CS_FOLLOWUP_EMAIL", "cs_request", row.request_id, {
    to: row.client_email,
    reason,
    mock: true,
  });
  return getCsRequest(row.id);
}

export function applyTriage(
  requestDbId: number,
  locale: UiLocale = "en",
  db: Database.Database = getDb()
) {
  const row = db.prepare(`SELECT * FROM cs_requests WHERE id = ?`).get(requestDbId) as CsRequest | undefined;
  if (!row) throw new Error("Request not found");
  const zh = locale === "zh-Hant";
  const messages = db
    .prepare(`SELECT body FROM cs_messages WHERE request_db_id = ? AND kind IN ('CLIENT','EMAIL_IN','FORM') ORDER BY id`)
    .all(requestDbId) as Array<{ body: string }>;
  const latest = messages[messages.length - 1]?.body || row.body;
  const joined = [row.body, ...messages.map((m) => m.body)].join("\n");
  // After a client reply, score the latest inbound — do not keep the original “help me ???” forever.
  const again = messages.length > 1 ? triageText("client follow-up", latest) : triageText(row.subject, joined);
  const { clarity, desk, category } = again;
  const skillCode = skillCodeForTriage({
    clarity,
    desk,
    category,
    subject: row.subject,
    body: latest,
  });
  const skillTitle = csSkillName(skillCode, locale);
  db.prepare(
    `UPDATE cs_requests SET desk = ?, category = ?, ai_clarity = ?, skill_code = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(desk, category, clarity, skillCode, row.id);
  addMessage(
    db,
    row.id,
    "AI",
    zh ? "CS／TR AI" : "CS/TR AI",
    zh
      ? `分流：${desk} · 類別 ${category} · 清晰度 ${clarity === "clear" ? "清楚" : clarity === "need_id" ? "需身分驗證" : "不清楚"} · 技能 ${skillCode}（${skillTitle}）`
      : `Routed to ${desk} · category ${category} · clarity ${clarity} · skill ${skillCode} (${skillTitle})`,
    { desk, category, clarity, skill_code: skillCode }
  );
  if (desk === "TR") {
    db.prepare(
      `UPDATE cs_requests SET status = CASE WHEN status IN ('AWAITING_CLIENT','ID_VERIFY') THEN status ELSE 'ASSIGNED_TR' END, assigned_to = 'TR Dealing Support', updated_at = datetime('now') WHERE id = ?`
    ).run(row.id);
  }
  if (clarity === "unclear" || clarity === "need_id") {
    return sendFollowupEmail(row.id, clarity, locale, db);
  }
  const fresh = db.prepare(`SELECT status FROM cs_requests WHERE id = ?`).get(row.id) as { status: string };
  if (fresh.status === "AWAITING_CLIENT" || fresh.status === "ID_VERIFY") {
    db.prepare(`UPDATE cs_requests SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(
      desk === "TR" ? "ASSIGNED_TR" : "OPEN",
      row.id
    );
  }
  return getCsRequest(row.id);
}

export function ingestCsRequest(
  input: {
    channel: CsChannelCode | string;
    client_name: string;
    client_email: string;
    client_uid?: string | null;
    subject: string;
    body: string;
    channel_ref?: string | null;
    locale?: UiLocale;
    actor?: string;
  },
  db: Database.Database = getDb()
) {
  ensureCsSchema(db);
  const channel = CS_CHANNELS.some((c) => c.code === input.channel) ? input.channel : "C1_LIVE_CHAT";
  const t = triageText(input.subject, input.body);
  const requestId = newId("CSR");
  const ref = input.channel_ref || newId(channel === "C1_LIVE_CHAT" ? "C1" : channel === "WEB_FORM" ? "FRM" : "EML");
  const info = db
    .prepare(
      `INSERT INTO cs_requests
        (request_id, channel, channel_ref, desk, category, client_name, client_email, client_uid, subject, body, status, ai_clarity)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?)`
    )
    .run(
      requestId,
      channel,
      ref,
      t.desk,
      t.category,
      input.client_name,
      input.client_email,
      input.client_uid || null,
      input.subject,
      input.body,
      t.clarity
    );
  const id = Number(info.lastInsertRowid);
  const senderKind = channel === "OFFICIAL_EMAIL" ? "EMAIL_IN" : channel === "WEB_FORM" ? "FORM" : "CLIENT";
  addMessage(db, id, senderKind, input.client_name, input.body, { channel, channel_ref: ref });
  writeAudit({ name: input.actor || "CS intake" }, "CS_INTAKE", "cs_request", requestId, {
    channel,
    desk: t.desk,
    clarity: t.clarity,
  });
  return applyTriage(id, input.locale || "en", db);
}

export function recordClientReply(
  input: {
    request_id: number;
    text: string;
    locale?: UiLocale;
    actor?: string;
    kind?: string;
  },
  db: Database.Database = getDb()
) {
  ensureCsSchema(db);
  const row = db.prepare(`SELECT * FROM cs_requests WHERE id = ?`).get(input.request_id) as CsRequest | undefined;
  if (!row) throw new Error("Request not found");
  const zh = input.locale === "zh-Hant";
  const kind = input.kind || "EMAIL_IN";
  addMessage(db, row.id, kind, row.client_name, input.text, { in_reply_to: "followup" });
  db.prepare(
    `UPDATE cs_followups SET status = 'REPLIED', replied_at = datetime('now')
     WHERE request_db_id = ? AND status = 'WAITING'`
  ).run(row.id);
  db.prepare(`UPDATE cs_requests SET body = body || char(10) || ?, updated_at = datetime('now') WHERE id = ?`).run(
    input.text,
    row.id
  );
  writeAudit({ name: input.actor || row.client_name }, "CS_CLIENT_REPLY", "cs_request", row.request_id, {});
  addMessage(
    db,
    row.id,
    "SYSTEM",
    zh ? "進件閘道" : "Intake gateway",
    zh ? "已收到客戶回覆。AI 將重新分流。" : "Client reply received. AI will re-triage."
  );
  return applyTriage(row.id, input.locale || "en", db);
}

export function agentReply(input: { request_id: number; text: string; user_name: string }) {
  ensureCsSchema();
  const db = getDb();
  const row = db.prepare(`SELECT * FROM cs_requests WHERE id = ?`).get(input.request_id) as CsRequest | undefined;
  if (!row) throw new Error("Request not found");
  addMessage(db, row.id, "AGENT", input.user_name, input.text);
  writeAudit({ name: input.user_name }, "CS_AGENT_REPLY", "cs_request", row.request_id, {});
  return getCsRequest(row.id);
}

export function assignToTr(requestDbId: number, userName: string, locale: UiLocale = "en") {
  const db = getDb();
  const zh = locale === "zh-Hant";
  const row = db.prepare(`SELECT * FROM cs_requests WHERE id = ?`).get(requestDbId) as CsRequest | undefined;
  if (!row) throw new Error("Request not found");
  db.prepare(
    `UPDATE cs_requests SET desk = 'TR', status = 'ASSIGNED_TR', assigned_to = 'TR Dealing Support', category = 'trading', skill_code = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(CS_SKILL_CODES.execution, row.id);
  addMessage(
    db,
    row.id,
    "SYSTEM",
    userName,
    zh
      ? `已指派至 TR 成交支援。技能 ${CS_SKILL_CODES.execution}。`
      : `Handed to TR Dealing Support. Skill ${CS_SKILL_CODES.execution}.`
  );
  writeAudit({ name: userName }, "CS_ASSIGN_TR", "cs_request", row.request_id, {});
  return getCsRequest(row.id);
}

export function escalateToRisk(requestDbId: number, userName: string, locale: UiLocale = "en") {
  const db = getDb();
  const zh = locale === "zh-Hant";
  const row = db.prepare(`SELECT * FROM cs_requests WHERE id = ?`).get(requestDbId) as CsRequest | undefined;
  if (!row) throw new Error("Request not found");
  db.prepare(
    `UPDATE cs_requests SET status = 'ESCALATED_RISK', skill_code = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(CS_SKILL_CODES.escalateRisk, row.id);
  addMessage(
    db,
    row.id,
    "SYSTEM",
    userName,
    zh
      ? `已升級至風險控管脊柱（示範 Messenger／人工干預）。技能 ${CS_SKILL_CODES.escalateRisk}。CS／TR 不再單獨處理。`
      : `Escalated onto the Risk Control spine (Demo Messenger / Human Intervention). Skill ${CS_SKILL_CODES.escalateRisk}. CS/TR no longer handles this alone.`
  );
  writeAudit({ name: userName }, "CS_ESCALATE_RISK", "cs_request", row.request_id, {});
  return getCsRequest(row.id);
}

export function resolveRequest(requestDbId: number, userName: string, locale: UiLocale = "en") {
  const db = getDb();
  const zh = locale === "zh-Hant";
  const row = db.prepare(`SELECT * FROM cs_requests WHERE id = ?`).get(requestDbId) as CsRequest | undefined;
  if (!row) throw new Error("Request not found");
  if (row.status === "ID_VERIFY" || row.status === "AWAITING_CLIENT") {
    const waiting = db
      .prepare(`SELECT COUNT(*) AS c FROM cs_followups WHERE request_db_id = ? AND status = 'WAITING'`)
      .get(row.id) as { c: number };
    if (waiting.c > 0) {
      throw new Error(
        zh
          ? "尚有未回覆的自動追問信 — 請等待客戶回覆或由 CS Lead 註記豁免。"
          : "An automatic follow-up is still waiting for the client — wait for a reply or have CS Lead waive."
      );
    }
  }
  db.prepare(`UPDATE cs_requests SET status = 'RESOLVED', updated_at = datetime('now') WHERE id = ?`).run(row.id);
  addMessage(db, row.id, "SYSTEM", userName, zh ? "案件已結。" : "Request resolved.");
  writeAudit({ name: userName }, "CS_RESOLVE", "cs_request", row.request_id, {});
  return getCsRequest(row.id);
}

export function listCsInbox() {
  const db = getDb();
  ensureCsSchema(db);
  seedCsIfEmpty(db);
  const requests = db
    .prepare(`SELECT * FROM cs_requests ORDER BY updated_at DESC, id DESC`)
    .all() as CsRequest[];
  const channels = db.prepare(`SELECT * FROM cs_channels ORDER BY id`).all();
  const catalog: Record<number, { messages: CsMessage[]; followups: CsFollowup[] }> = {};
  for (const r of requests) {
    catalog[r.id] = {
      messages: db
        .prepare(`SELECT * FROM cs_messages WHERE request_db_id = ? ORDER BY id`)
        .all(r.id) as CsMessage[],
      followups: db
        .prepare(`SELECT * FROM cs_followups WHERE request_db_id = ? ORDER BY id DESC`)
        .all(r.id) as CsFollowup[],
    };
  }
  const open = requests.filter((r) => r.status !== "RESOLVED").length;
  return { requests, channels, catalog, open };
}

export function seedCsIfEmpty(db: Database.Database = getDb()) {
  ensureCsSchema(db);
  const n = (db.prepare(`SELECT COUNT(*) AS c FROM cs_requests`).get() as { c: number }).c;
  if (n > 0) return;
  ingestCsRequest(
    {
      channel: "C1_LIVE_CHAT",
      client_name: "Liam Okafor",
      client_email: "liam.okafor@client.example",
      client_uid: "880214",
      subject: "Swap on XAUUSD overnight",
      body: "Hi CS, I held XAUUSD overnight on UID 880214. Can you confirm the swap rate that was charged on 5 Oct and whether weekends are triple? Thanks.",
      locale: "en",
      actor: "C1 webhook",
    },
    db
  );
  ingestCsRequest(
    {
      channel: "C1_LIVE_CHAT",
      client_name: "Sofia Mendes",
      client_email: "sofia.mendes@client.example",
      client_uid: "771902",
      subject: "Something wrong with my account",
      body: "help me something wrong ???",
      locale: "en",
      actor: "C1 webhook",
    },
    db
  );
  ingestCsRequest(
    {
      channel: "WEB_FORM",
      client_name: "Chen Wei",
      client_email: "chen.wei@client.example",
      client_uid: "665441",
      subject: "Slippage on EURUSD market order",
      body: "EURUSD market order on MT5 ticket 849201 filled 2.1 pips worse than the button. Please check LP fill vs our execution. Time 14:03 UTC 6 Oct.",
      locale: "en",
      actor: "Web form",
    },
    db
  );
  ingestCsRequest(
    {
      channel: "OFFICIAL_EMAIL",
      client_name: "Priya Shah",
      client_email: "priya.shah@client.example",
      client_uid: "120088",
      subject: "Please verify my account — cannot withdraw",
      body: "I need you to verify my identity so I can withdraw. Passport scan to follow if you tell me where.",
      locale: "en",
      actor: "Mailbox gateway",
    },
    db
  );
}
