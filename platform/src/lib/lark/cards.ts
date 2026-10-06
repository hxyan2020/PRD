/**
 * Prototype Lark interactive cards. Mock-delivered onto /admin/lark so Ack /
 * Escalate / Dismiss / Close happen in the company messenger, not only Demo Messenger.
 * Production webhooks stay FR-17 / RM-01.
 */
import { randomBytes } from "crypto";
import type Database from "better-sqlite3";
import { getDb, writeAudit } from "@/lib/db";

export type LarkCardKind = "ALERT" | "AI_REPORT" | "ESCALATION" | "CS_ESCALATION";
export type LarkCardStatus = "OPEN" | "ACKED" | "ESCALATED" | "DISMISSED" | "CLOSED";

export type LarkCard = {
  id: number;
  card_id: string;
  chat_id: string;
  channel_name: string;
  kind: LarkCardKind;
  status: LarkCardStatus;
  title: string;
  body: string;
  severity: string;
  thread_db_id: number | null;
  alert_db_id: number | null;
  cs_request_id: string | null;
  route_code: string | null;
  mock: number;
  created_at: string;
  updated_at: string;
};

export function ensureLarkCardsSchema(db: Database.Database = getDb()) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS lark_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id TEXT NOT NULL UNIQUE,
      chat_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'WARN',
      thread_db_id INTEGER,
      alert_db_id INTEGER,
      cs_request_id TEXT,
      route_code TEXT,
      mock INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_lark_cards_chat ON lark_cards(chat_id, id DESC);
    CREATE INDEX IF NOT EXISTS idx_lark_cards_thread ON lark_cards(thread_db_id);
  `);
}

export function resolveLarkChannel(
  db: Database.Database,
  chatOrName: string | null | undefined
): { chat_id: string; name: string } {
  const needle = (chatOrName || "").trim();
  if (needle) {
    const row = db
      .prepare(`SELECT chat_id, name FROM lark_channels WHERE chat_id = ? OR name = ? LIMIT 1`)
      .get(needle, needle) as { chat_id: string; name: string } | undefined;
    if (row) return row;
  }
  const fallback = db
    .prepare(
      `SELECT chat_id, name FROM lark_channels WHERE chat_id = 'oc_risk_control_desk' OR enabled = 1 ORDER BY CASE WHEN chat_id = 'oc_risk_control_desk' THEN 0 ELSE 1 END, id LIMIT 1`
    )
    .get() as { chat_id: string; name: string } | undefined;
  return fallback || { chat_id: "oc_risk_control_desk", name: "Risk Control Desk" };
}

function newCardId() {
  return `LC-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function hydrate(row: Omit<LarkCard, "channel_name"> & { channel_name?: string | null }): LarkCard {
  return {
    ...row,
    channel_name: row.channel_name || row.chat_id,
  };
}

export function postLarkCard(input: {
  chat_id: string;
  kind: LarkCardKind;
  title: string;
  body: string;
  severity?: string;
  thread_db_id?: number | null;
  alert_db_id?: number | null;
  cs_request_id?: string | null;
  route_code?: string | null;
  actor?: string;
  dedupe?: boolean;
}): LarkCard {
  const db = getDb();
  ensureLarkCardsSchema(db);
  const ch = resolveLarkChannel(db, input.chat_id);
  const dedupe = input.dedupe !== false && input.kind !== "ESCALATION" && input.kind !== "CS_ESCALATION";
  if (dedupe && (input.thread_db_id || input.alert_db_id || input.cs_request_id)) {
    const existing = db
      .prepare(
        `SELECT c.*, ch.name AS channel_name
         FROM lark_cards c
         LEFT JOIN lark_channels ch ON ch.chat_id = c.chat_id
         WHERE c.kind = ? AND c.chat_id = ? AND c.status IN ('OPEN','ACKED','ESCALATED')
           AND (
             (? IS NOT NULL AND c.thread_db_id = ?)
             OR (? IS NOT NULL AND c.alert_db_id = ?)
             OR (? IS NOT NULL AND c.cs_request_id = ?)
           )
         ORDER BY c.id DESC LIMIT 1`
      )
      .get(
        input.kind,
        ch.chat_id,
        input.thread_db_id ?? null,
        input.thread_db_id ?? null,
        input.alert_db_id ?? null,
        input.alert_db_id ?? null,
        input.cs_request_id ?? null,
        input.cs_request_id ?? null
      ) as (Omit<LarkCard, "channel_name"> & { channel_name: string | null }) | undefined;
    if (existing) {
      db.prepare(
        `UPDATE lark_cards SET title = ?, body = ?, severity = ?, route_code = COALESCE(?, route_code), updated_at = datetime('now') WHERE id = ?`
      ).run(input.title, input.body, input.severity || existing.severity, input.route_code ?? null, existing.id);
      return hydrate({ ...existing, title: input.title, body: input.body, severity: input.severity || existing.severity });
    }
  }

  const info = db
    .prepare(
      `INSERT INTO lark_cards
        (card_id, chat_id, kind, status, title, body, severity, thread_db_id, alert_db_id, cs_request_id, route_code, mock)
       VALUES (?, ?, ?, 'OPEN', ?, ?, ?, ?, ?, ?, ?, 1)`
    )
    .run(
      newCardId(),
      ch.chat_id,
      input.kind,
      input.title,
      input.body,
      input.severity || "WARN",
      input.thread_db_id ?? null,
      input.alert_db_id ?? null,
      input.cs_request_id ?? null,
      input.route_code ?? null
    );
  writeAudit({ name: input.actor || "Lark bot" }, "LARK_CARD_POST", "lark_card", String(info.lastInsertRowid), {
    kind: input.kind,
    chat_id: ch.chat_id,
    thread_db_id: input.thread_db_id ?? null,
    mock: true,
  });
  const row = db
    .prepare(
      `SELECT c.*, ch.name AS channel_name FROM lark_cards c LEFT JOIN lark_channels ch ON ch.chat_id = c.chat_id WHERE c.id = ?`
    )
    .get(info.lastInsertRowid) as Omit<LarkCard, "channel_name"> & { channel_name: string | null };
  return hydrate(row);
}

export function listLarkCards(limit = 80): LarkCard[] {
  const db = getDb();
  ensureLarkCardsSchema(db);
  return (
    db
      .prepare(
        `SELECT c.*, ch.name AS channel_name
         FROM lark_cards c
         LEFT JOIN lark_channels ch ON ch.chat_id = c.chat_id
         ORDER BY c.id DESC
         LIMIT ?`
      )
      .all(limit) as Array<Omit<LarkCard, "channel_name"> & { channel_name: string | null }>
  ).map(hydrate);
}

export function getLarkCard(id: number): LarkCard | undefined {
  const db = getDb();
  ensureLarkCardsSchema(db);
  const row = db
    .prepare(
      `SELECT c.*, ch.name AS channel_name FROM lark_cards c LEFT JOIN lark_channels ch ON ch.chat_id = c.chat_id WHERE c.id = ?`
    )
    .get(id) as (Omit<LarkCard, "channel_name"> & { channel_name: string | null }) | undefined;
  return row ? hydrate(row) : undefined;
}

export function setLarkCardStatus(id: number, status: LarkCardStatus) {
  const db = getDb();
  db.prepare(`UPDATE lark_cards SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, id);
}

export function markLarkCardsForThread(threadDbId: number, status: LarkCardStatus) {
  const db = getDb();
  db.prepare(
    `UPDATE lark_cards SET status = ?, updated_at = datetime('now')
     WHERE thread_db_id = ? AND status IN ('OPEN','ACKED','ESCALATED')`
  ).run(status, threadDbId);
}

export function markLarkCardsForAlert(alertDbId: number, status: LarkCardStatus) {
  const db = getDb();
  try {
    db.prepare(
      `UPDATE lark_cards SET status = ?, updated_at = datetime('now')
       WHERE alert_db_id = ? AND status IN ('OPEN','ACKED','ESCALATED')`
    ).run(status, alertDbId);
  } catch {
    /* schema not ready */
  }
}

/** Mirror open messenger threads (and CS risk notes) onto Lark channels. */
export function syncLarkCardsFromThreads() {
  const db = getDb();
  ensureLarkCardsSchema(db);
  let n = 0;
  try {
    const threads = db
      .prepare(
        `SELECT t.id, t.title, t.severity, t.status, t.alert_id, t.channel_name,
                (SELECT body FROM messenger_messages WHERE thread_id = t.id AND kind = 'ALERT' ORDER BY id LIMIT 1) AS alert_body,
                (SELECT body FROM messenger_messages WHERE thread_id = t.id AND kind = 'ESCALATION' ORDER BY id DESC LIMIT 1) AS esc_body,
                (SELECT COUNT(*) FROM messenger_messages WHERE thread_id = t.id AND kind = 'ESCALATION') AS esc_n
         FROM messenger_threads t
         WHERE t.status IN ('OPEN','ESCALATED')
         ORDER BY t.id DESC
         LIMIT 40`
      )
      .all() as Array<{
      id: number;
      title: string;
      severity: string;
      status: string;
      alert_id: number | null;
      channel_name: string;
      alert_body: string | null;
      esc_body: string | null;
      esc_n: number;
    }>;
    for (const t of threads) {
      postLarkCard({
        chat_id: t.channel_name,
        kind: "ALERT",
        title: t.title,
        body: t.alert_body || `🚨 ${t.severity} · ${t.title}`,
        severity: t.severity,
        thread_db_id: t.id,
        alert_db_id: t.alert_id,
        actor: "Monitor 2.0",
      });
      n += 1;
      if (t.esc_n > 0 && t.esc_body) {
        const hasEsc = db
          .prepare(`SELECT id FROM lark_cards WHERE thread_db_id = ? AND kind = 'ESCALATION' LIMIT 1`)
          .get(t.id) as { id: number } | undefined;
        if (!hasEsc) {
          postLarkCard({
            chat_id: t.channel_name,
            kind: "ESCALATION",
            title: `Escalate · ${t.title}`,
            body: t.esc_body,
            severity: t.severity,
            thread_db_id: t.id,
            alert_db_id: t.alert_id,
            actor: "Escalation Engine",
            dedupe: false,
          });
        }
      }
    }
  } catch {
    /* messenger schema missing in a fresh test */
  }
  return n;
}
