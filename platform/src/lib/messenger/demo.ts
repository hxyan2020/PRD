import { randomBytes } from "crypto";
import type Database from "better-sqlite3";
import { getDb, writeAudit } from "@/lib/db";
import { logSpineEvent } from "@/lib/ai/spine";
import { getAnalysisBundle } from "@/lib/ai/analyze";

export type MessengerAction =
  | "show_evidence"
  | "chat"
  | "escalate"
  | "dismiss"
  | "close"
  | "recommend"
  | "confirm_action"
  | "cancel_action";

const RECOMMENDED_ACTIONS = [
  {
    code: "BLOCK_ACCOUNT",
    label: "Block user account",
    description: "Freeze login and new orders for flagged account(s).",
    admin_path: "/admin/interventions",
    needs_checker: true,
  },
  {
    code: "HALT_SYMBOL",
    label: "Halt trading (symbol)",
    description: "Temporarily disable new exposure on the stressed symbol.",
    admin_path: "/admin/monitor-2",
    needs_checker: true,
  },
  {
    code: "CUT_LEVERAGE",
    label: "Cut max leverage",
    description: "Reduce leverage for affected cohort / instrument.",
    admin_path: "/admin/interventions",
    needs_checker: true,
  },
  {
    code: "WIDEN_SPREAD",
    label: "Pre-widen spreads",
    description: "Widen LP quotes ahead of expected volatility.",
    admin_path: "/admin/market-intel",
    needs_checker: false,
  },
  {
    code: "PAUSE_COPY",
    label: "Pause copy joining",
    description: "Stop new copiers joining the concentrated provider.",
    admin_path: "/admin/skills",
    needs_checker: true,
  },
] as const;

export function ensureMessengerSchema(db: Database.Database = getDb()) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS messenger_threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id TEXT NOT NULL UNIQUE,
      channel_name TEXT NOT NULL,
      title TEXT NOT NULL,
      severity TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      alert_id INTEGER,
      analysis_id INTEGER,
      escalation_step INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS messenger_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL,
      msg_id TEXT NOT NULL UNIQUE,
      kind TEXT NOT NULL,
      sender TEXT NOT NULL,
      body TEXT NOT NULL,
      meta_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (thread_id) REFERENCES messenger_threads(id)
    );
    CREATE TABLE IF NOT EXISTS messenger_pending_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL,
      action_code TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'AWAITING_CONFIRM',
      requested_by TEXT,
      confirmed_by TEXT,
      admin_ref TEXT,
      detail_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (thread_id) REFERENCES messenger_threads(id)
    );
  `);
}

function newId(prefix: string) {
  return `${prefix}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function addMessage(
  db: Database.Database,
  threadDbId: number,
  kind: string,
  sender: string,
  body: string,
  meta: Record<string, unknown> = {}
) {
  const msgId = newId("MSG");
  db.prepare(
    `INSERT INTO messenger_messages (thread_id, msg_id, kind, sender, body, meta_json)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(threadDbId, msgId, kind, sender, body, JSON.stringify(meta));
  db.prepare(`UPDATE messenger_threads SET updated_at = datetime('now') WHERE id = ?`).run(threadDbId);
  return msgId;
}

export function seedMessengerIfEmpty(db: Database.Database = getDb()) {
  ensureMessengerSchema(db);
  const count = (db.prepare(`SELECT COUNT(*) AS c FROM messenger_threads`).get() as { c: number }).c;
  if (count > 0) return;

  const alerts = db
    .prepare(
      `SELECT a.id, a.alert_id, a.severity, a.title, a.message, a.status, i.monitor_id, i.name AS indicator_name,
              an.id AS analysis_db_id, an.analysis_id, an.summary, an.mode, an.challenge_verdict
       FROM monitor_alerts a
       JOIN monitor_indicators i ON i.id = a.indicator_id
       LEFT JOIN ai_analyses an ON an.alert_id = a.id
       WHERE a.severity IN ('WARN','BREACH','CRITICAL')
       ORDER BY a.id DESC
       LIMIT 8`
    )
    .all() as Array<{
    id: number;
    alert_id: string;
    severity: string;
    title: string;
    message: string;
    status: string;
    monitor_id: string;
    indicator_name: string;
    analysis_db_id: number | null;
    analysis_id: string | null;
    summary: string | null;
    mode: string | null;
    challenge_verdict: string | null;
  }>;

  for (const a of alerts) {
    const threadId = newId("THR");
    const info = db
      .prepare(
        `INSERT INTO messenger_threads
          (thread_id, channel_name, title, severity, status, alert_id, analysis_id, escalation_step)
         VALUES (?, ?, ?, ?, 'OPEN', ?, ?, 0)`
      )
      .run(
        threadId,
        a.severity === "CRITICAL" ? "Risk Critical Bridge" : a.severity === "BREACH" ? "Risk Desk" : "Ops Watch",
        a.title,
        a.severity,
        a.id,
        a.analysis_db_id
      );
    const tid = Number(info.lastInsertRowid);

    addMessage(
      db,
      tid,
      "ALERT",
      "Monitor 2.0",
      `🚨 ${a.severity} · ${a.indicator_name} (${a.monitor_id})\n${a.message}\nAlert: ${a.alert_id}`,
      { alert_id: a.alert_id, monitor_id: a.monitor_id }
    );

    if (a.analysis_db_id && a.summary) {
      addMessage(
        db,
        tid,
        "AI_REPORT",
        "CRMP AI",
        `🤖 AI Report ${a.analysis_id}\nMode: ${a.mode}\n${a.summary}${
          a.challenge_verdict ? `\nSecond AI: ${a.challenge_verdict}` : ""
        }`,
        {
          analysis_db_id: a.analysis_db_id,
          analysis_id: a.analysis_id,
          mode: a.mode,
          challenge_verdict: a.challenge_verdict,
          admin_url: `/admin/ai-analyses/${a.analysis_db_id}`,
        }
      );
    }
  }
}

export function listMessengerThreads() {
  ensureMessengerSchema();
  seedMessengerIfEmpty();
  return getDb()
    .prepare(
      `SELECT t.*,
              (SELECT COUNT(*) FROM messenger_messages m WHERE m.thread_id = t.id) AS message_count,
              (SELECT body FROM messenger_messages m WHERE m.thread_id = t.id ORDER BY m.id DESC LIMIT 1) AS last_body
       FROM messenger_threads t
       ORDER BY t.updated_at DESC, t.id DESC`
    )
    .all();
}

export function getMessengerThread(threadDbId: number) {
  ensureMessengerSchema();
  const db = getDb();
  const thread = db.prepare(`SELECT * FROM messenger_threads WHERE id = ?`).get(threadDbId);
  if (!thread) return null;
  const messages = db
    .prepare(`SELECT * FROM messenger_messages WHERE thread_id = ? ORDER BY id`)
    .all(threadDbId);
  const pending = db
    .prepare(
      `SELECT * FROM messenger_pending_actions WHERE thread_id = ? AND status IN ('AWAITING_CONFIRM','AWAITING_CHECKER') ORDER BY id DESC`
    )
    .all(threadDbId);
  return { thread, messages, pending, recommended_actions: RECOMMENDED_ACTIONS };
}

function getEscalationPath(severity: string) {
  const db = getDb();
  const route = db
    .prepare(
      `SELECT er.*, t1.name AS primary_team, t2.name AS secondary_team, lc.name AS channel_name
       FROM escalation_routes er
       LEFT JOIN teams t1 ON t1.id = er.primary_team_id
       LEFT JOIN teams t2 ON t2.id = er.secondary_team_id
       LEFT JOIN lark_channels lc ON lc.id = er.lark_channel_id
       WHERE er.enabled = 1 AND er.severity = ?
       ORDER BY er.id LIMIT 1`
    )
    .get(severity) as
    | {
        primary_team: string | null;
        secondary_team: string | null;
        channel_name: string | null;
        sla_minutes: number;
      }
    | undefined;

  const steps = [
    route?.primary_team || "Primary on-call",
    route?.secondary_team || "Secondary / Risk Desk",
    "Risk Owner",
    "Exec Risk Bridge",
  ];
  return { steps, sla_minutes: route?.sla_minutes ?? 30, channel: route?.channel_name || "Risk Desk" };
}

export function messengerAction(input: {
  thread_id: number;
  action: MessengerAction;
  user_name: string;
  text?: string;
  action_code?: string;
  pending_id?: number;
}) {
  ensureMessengerSchema();
  const db = getDb();
  const thread = db.prepare(`SELECT * FROM messenger_threads WHERE id = ?`).get(input.thread_id) as
    | {
        id: number;
        thread_id: string;
        title: string;
        severity: string;
        status: string;
        analysis_id: number | null;
        alert_id: number | null;
        escalation_step: number;
      }
    | undefined;
  if (!thread) throw new Error("Thread not found");

  if (input.action === "show_evidence") {
    if (!thread.analysis_id) {
      addMessage(db, thread.id, "SYSTEM", "Messenger", "No AI analysis linked — open Live Alerts to investigate.");
      return getMessengerThread(thread.id);
    }
    const bundle = getAnalysisBundle(thread.analysis_id);
    const evidence = (bundle.evidence || []) as Array<{
      evidence_type: string;
      title: string;
      excerpt: string;
      score: number;
    }>;
    const challenge = bundle.challenge as { verdict?: string; summary?: string } | null;
    const lines = evidence
      .slice(0, 6)
      .map((e) => `• [${e.evidence_type}] ${e.title} (score ${Number(e.score).toFixed(2)})\n  ${e.excerpt.slice(0, 160)}`);
    addMessage(
      db,
      thread.id,
      "EVIDENCE",
      "Evidence Vault",
      `📎 Evidence pack for analysis #${thread.analysis_id}\n${lines.join("\n")}${
        challenge?.verdict ? `\n\nSecond AI (${challenge.verdict}): ${challenge.summary}` : ""
      }`,
      { analysis_id: thread.analysis_id, admin_url: `/admin/ai-analyses/${thread.analysis_id}` }
    );
    writeAudit({ name: input.user_name }, "MESSENGER_SHOW_EVIDENCE", "messenger_thread", thread.thread_id, {});
    return getMessengerThread(thread.id);
  }

  if (input.action === "chat") {
    const text = (input.text || "").trim();
    if (!text) throw new Error("Message required");
    addMessage(db, thread.id, "USER", input.user_name, text);
    const lower = text.toLowerCase();
    let reply =
      "Noted. I've attached your note to the case. Risk Desk can use this when reviewing the AI report.";
    if (/disagree|wrong|challenge|incorrect|false/.test(lower)) {
      reply =
        "Challenge recorded. I've flagged the AI analysis for human review and asked the second challenger path to be considered before any irreversible control.";
      if (thread.analysis_id) {
        db.prepare(`UPDATE ai_analyses SET needs_human = 1 WHERE id = ?`).run(thread.analysis_id);
      }
    } else if (/more info|context|add|update/.test(lower)) {
      reply =
        "Additional context saved on the thread. It will appear in the next Risk Owner review pack alongside primary + challenger RCA.";
    }
    addMessage(db, thread.id, "CHATBOT", "CRMP Chatbot", `💬 ${reply}`, { in_reply_to: text });
    writeAudit({ name: input.user_name }, "MESSENGER_CHAT", "messenger_thread", thread.thread_id, { text });
    return getMessengerThread(thread.id);
  }

  if (input.action === "escalate") {
    const path = getEscalationPath(thread.severity);
    const nextStep = Math.min(thread.escalation_step + 1, path.steps.length - 1);
    const target = path.steps[nextStep];
    db.prepare(`UPDATE messenger_threads SET escalation_step = ?, updated_at = datetime('now') WHERE id = ?`).run(
      nextStep,
      thread.id
    );
    addMessage(
      db,
      thread.id,
      "ESCALATION",
      "Escalation Engine",
      `⬆️ Escalated to ${target} (step ${nextStep + 1}/${path.steps.length})\nChannel: ${path.channel} · SLA ${path.sla_minutes}m\nPath: ${path.steps.join(" → ")}`,
      { target, step: nextStep, path: path.steps }
    );
    logSpineEvent({
      stage: "ESCALATION",
      title: `Messenger escalate → ${target}`,
      product: "CFD+CRYPTO",
      ref_type: "messenger_thread",
      ref_id: thread.thread_id,
      severity: thread.severity,
      detail: { step: nextStep, target },
      actor: input.user_name,
    });
    writeAudit({ name: input.user_name }, "MESSENGER_ESCALATE", "messenger_thread", thread.thread_id, {
      target,
      step: nextStep,
    });
    return getMessengerThread(thread.id);
  }

  if (input.action === "dismiss") {
    db.prepare(`UPDATE messenger_threads SET status = 'DISMISSED', updated_at = datetime('now') WHERE id = ?`).run(
      thread.id
    );
    if (thread.alert_id) {
      db.prepare(`UPDATE monitor_alerts SET status = 'CLOSED' WHERE id = ?`).run(thread.alert_id);
    }
    addMessage(
      db,
      thread.id,
      "SYSTEM",
      input.user_name,
      "❎ Dismissed as false alarm. Alert closed. No further controls applied."
    );
    writeAudit({ name: input.user_name }, "MESSENGER_DISMISS", "messenger_thread", thread.thread_id, {});
    return getMessengerThread(thread.id);
  }

  if (input.action === "close") {
    db.prepare(`UPDATE messenger_threads SET status = 'CLOSED', updated_at = datetime('now') WHERE id = ?`).run(
      thread.id
    );
    if (thread.alert_id) {
      db.prepare(`UPDATE monitor_alerts SET status = 'CLOSED' WHERE id = ?`).run(thread.alert_id);
    }
    addMessage(
      db,
      thread.id,
      "SYSTEM",
      input.user_name,
      "✅ Closed — AI analysis accepted. Ticket closed; dual-AI pack retained in evidence vault."
    );
    writeAudit({ name: input.user_name }, "MESSENGER_CLOSE", "messenger_thread", thread.thread_id, {});
    return getMessengerThread(thread.id);
  }

  if (input.action === "recommend") {
    const code = input.action_code;
    const action = RECOMMENDED_ACTIONS.find((a) => a.code === code);
    if (!action) throw new Error("Unknown recommended action");
    const info = db
      .prepare(
        `INSERT INTO messenger_pending_actions (thread_id, action_code, status, requested_by, detail_json)
         VALUES (?, ?, 'AWAITING_CONFIRM', ?, ?)`
      )
      .run(thread.id, action.code, input.user_name, JSON.stringify(action));
    addMessage(
      db,
      thread.id,
      "ACTION_PROPOSAL",
      "Action Advisor",
      `⚙️ Proposed: ${action.label}\n${action.description}\nPlease double-confirm before sending to Vantage Markets admin.`,
      { pending_id: Number(info.lastInsertRowid), action }
    );
    return getMessengerThread(thread.id);
  }

  if (input.action === "cancel_action") {
    if (!input.pending_id) throw new Error("pending_id required");
    db.prepare(
      `UPDATE messenger_pending_actions SET status = 'CANCELLED', updated_at = datetime('now') WHERE id = ? AND thread_id = ?`
    ).run(input.pending_id, thread.id);
    addMessage(db, thread.id, "SYSTEM", input.user_name, "Cancelled pending control action.");
    return getMessengerThread(thread.id);
  }

  if (input.action === "confirm_action") {
    if (!input.pending_id) throw new Error("pending_id required");
    const pending = db
      .prepare(`SELECT * FROM messenger_pending_actions WHERE id = ? AND thread_id = ?`)
      .get(input.pending_id, thread.id) as
      | {
          id: number;
          action_code: string;
          status: string;
          detail_json: string;
        }
      | undefined;
    if (!pending || pending.status !== "AWAITING_CONFIRM") throw new Error("Nothing to confirm");

    const action = JSON.parse(pending.detail_json) as (typeof RECOMMENDED_ACTIONS)[number];
    const adminRef = `ADM-${randomBytes(2).toString("hex").toUpperCase()}`;
    const nextStatus = action.needs_checker ? "AWAITING_CHECKER" : "DONE";
    db.prepare(
      `UPDATE messenger_pending_actions
       SET status = ?, confirmed_by = ?, admin_ref = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(nextStatus, input.user_name, adminRef, pending.id);

    addMessage(
      db,
      thread.id,
      "ACTION_RESULT",
      "Vantage Markets Admin",
      nextStatus === "AWAITING_CHECKER"
        ? `🛠️ Maker confirmed ${action.label}.\nAdmin ref ${adminRef} created at ${action.admin_path}.\n⏳ Checker approval still required before the control goes live.`
        : `🛠️ Action completed: ${action.label}.\nAdmin ref ${adminRef} · ${action.admin_path}`,
      {
        admin_ref: adminRef,
        admin_url: action.admin_path,
        needs_checker: action.needs_checker,
        status: nextStatus,
      }
    );

    if (nextStatus === "AWAITING_CHECKER") {
      addMessage(
        db,
        thread.id,
        "SYSTEM",
        "Maker-Checker",
        `Next step for Checker: open ${action.admin_path} and approve intervention ${adminRef}.`
      );
    }

    logSpineEvent({
      stage: "INTERVENTION",
      title: `${action.label} via messenger (${nextStatus})`,
      product: "CFD+CRYPTO",
      ref_type: "messenger_thread",
      ref_id: thread.thread_id,
      severity: thread.severity,
      detail: { admin_ref: adminRef, action: action.code },
      actor: input.user_name,
    });
    writeAudit({ name: input.user_name }, "MESSENGER_CONFIRM_ACTION", "messenger_thread", thread.thread_id, {
      action: action.code,
      admin_ref: adminRef,
      status: nextStatus,
    });
    return getMessengerThread(thread.id);
  }

  throw new Error(`Unknown action ${input.action}`);
}

export function syncNewAlertsToMessenger(limit = 5) {
  ensureMessengerSchema();
  seedMessengerIfEmpty();
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT a.id, a.alert_id, a.severity, a.title, a.message, i.monitor_id, i.name AS indicator_name,
              an.id AS analysis_db_id, an.analysis_id, an.summary, an.mode, an.challenge_verdict
       FROM monitor_alerts a
       JOIN monitor_indicators i ON i.id = a.indicator_id
       LEFT JOIN ai_analyses an ON an.alert_id = a.id
       LEFT JOIN messenger_threads t ON t.alert_id = a.id
       WHERE t.id IS NULL AND a.severity IN ('WARN','BREACH','CRITICAL')
       ORDER BY a.id DESC
       LIMIT ?`
    )
    .all(limit) as Array<{
    id: number;
    alert_id: string;
    severity: string;
    title: string;
    message: string;
    monitor_id: string;
    indicator_name: string;
    analysis_db_id: number | null;
    analysis_id: string | null;
    summary: string | null;
    mode: string | null;
    challenge_verdict: string | null;
  }>;

  for (const a of rows) {
    const threadId = newId("THR");
    const info = db
      .prepare(
        `INSERT INTO messenger_threads
          (thread_id, channel_name, title, severity, status, alert_id, analysis_id, escalation_step)
         VALUES (?, ?, ?, ?, 'OPEN', ?, ?, 0)`
      )
      .run(
        threadId,
        a.severity === "CRITICAL" ? "Risk Critical Bridge" : a.severity === "BREACH" ? "Risk Desk" : "Ops Watch",
        a.title,
        a.severity,
        a.id,
        a.analysis_db_id
      );
    const tid = Number(info.lastInsertRowid);
    addMessage(
      db,
      tid,
      "ALERT",
      "Monitor 2.0",
      `🚨 ${a.severity} · ${a.indicator_name} (${a.monitor_id})\n${a.message}\nAlert: ${a.alert_id}`,
      { alert_id: a.alert_id, monitor_id: a.monitor_id }
    );
    if (a.analysis_db_id && a.summary) {
      addMessage(
        db,
        tid,
        "AI_REPORT",
        "CRMP AI",
        `🤖 AI Report ${a.analysis_id}\nMode: ${a.mode}\n${a.summary}${
          a.challenge_verdict ? `\nSecond AI: ${a.challenge_verdict}` : ""
        }`,
        {
          analysis_db_id: a.analysis_db_id,
          analysis_id: a.analysis_id,
          admin_url: `/admin/ai-analyses/${a.analysis_db_id}`,
        }
      );
    }
  }
  return rows.length;
}
