import { randomBytes } from "crypto";
import type Database from "better-sqlite3";
import { getDb, writeAudit } from "@/lib/db";
import { logSpineEvent } from "@/lib/ai/spine";
import { matchEscalationRoute } from "@/lib/escalation/match";
import type { UiLocale } from "@/lib/i18n";
import { markLarkCardsForThread, postLarkCard } from "@/lib/lark/cards";

export type MessengerAction =
  | "show_evidence"
  | "chat"
  | "escalate"
  | "dismiss"
  | "close"
  | "recommend"
  | "confirm_action"
  | "cancel_action"
  | "checker_approve";

export type ActionPriority = "critical" | "control" | "soft";

export const RECOMMENDED_ACTIONS = [
  {
    code: "BLOCK_ACCOUNT",
    label: "Block user account",
    description: "Freeze login and new orders for flagged account(s).",
    admin_path: "/admin/interventions",
    needs_checker: true,
    priority: "critical" as const,
    /** Permission required to see/run this action in messenger. */
    permission: "intervene.operate",
  },
  {
    code: "HALT_SYMBOL",
    label: "Halt trading (symbol)",
    description: "Temporarily disable new exposure on the stressed symbol.",
    admin_path: "/admin/monitor-2",
    needs_checker: true,
    priority: "critical" as const,
    permission: "intervene.operate",
  },
  {
    code: "CUT_LEVERAGE",
    label: "Cut max leverage",
    description: "Reduce leverage for affected cohort / instrument.",
    admin_path: "/admin/interventions",
    needs_checker: true,
    priority: "control" as const,
    permission: "intervene.operate",
  },
  {
    code: "PAUSE_COPY",
    label: "Pause copy joining",
    description: "Stop new copiers joining the concentrated provider.",
    admin_path: "/admin/skills",
    needs_checker: true,
    priority: "control" as const,
    permission: "intervene.operate",
  },
  {
    code: "WIDEN_SPREAD",
    label: "Pre-widen spreads",
    description: "Widen LP quotes ahead of expected volatility.",
    admin_path: "/admin/market-intel",
    needs_checker: false,
    priority: "soft" as const,
    permission: "monitor.operate",
  },
] as const;

export type MessengerPoc = {
  step: number;
  team: string;
  poc_name: string | null;
  poc_email: string | null;
  poc_role: string | null;
};

export type MessengerPocWindow = MessengerPoc & {
  status: "relayed" | "active" | "waiting";
  messages: unknown[];
};

function parseMsgMeta(raw: string | null | undefined): Record<string, unknown> {
  try {
    return JSON.parse(raw || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
}

function lookupPocPerson(db: Database.Database, teamName: string) {
  const name = (teamName || "").trim();
  if (!name) return null;
  const special =
    /exec/i.test(name) ? "SUPER_ADMIN" : /risk owner/i.test(name) ? "RISK_OWNER" : null;
  if (special) {
    const row = db
      .prepare(
        `SELECT name, email, role_code FROM users WHERE role_code = ? AND status = 'ACTIVE' ORDER BY id LIMIT 1`
      )
      .get(special) as { name: string; email: string; role_code: string } | undefined;
    return row || null;
  }
  const row = db
    .prepare(
      `SELECT u.name, u.email, u.role_code
       FROM users u JOIN teams t ON t.id = u.team_id
       WHERE t.name = ? AND u.status = 'ACTIVE'
       ORDER BY CASE u.role_code
         WHEN 'RISK_OWNER' THEN 0 WHEN 'RISK_ANALYST' THEN 1 WHEN 'OPS_LEAD' THEN 2
         ELSE 3 END, u.id
       LIMIT 1`
    )
    .get(name) as { name: string; email: string; role_code: string } | undefined;
  return row || null;
}

function uniquePathTeams(primary: string | null | undefined, secondary: string | null | undefined) {
  const raw = [primary || "Primary on-call", secondary || "Secondary / Risk Desk", "Risk Owner", "Exec Risk Bridge"];
  const out: string[] = [];
  for (const team of raw) {
    if (team && !out.includes(team)) out.push(team);
  }
  if (out.length < 2) out.push("Risk Owner");
  return out;
}

export function getEscalationPocs(
  severity: string,
  domainCode?: string | null
): {
  steps: MessengerPoc[];
  sla_minutes: number;
  channel: string;
  chat_id: string;
  route_code: string;
  match_kind: string;
  route_name: string;
} {
  const db = getDb();
  const route = matchEscalationRoute(db, domainCode || "UNKNOWN", severity);
  const teams = uniquePathTeams(route.primary_team, route.secondary_team);
  const steps: MessengerPoc[] = teams.map((team, step) => {
    const person = lookupPocPerson(db, team);
    return {
      step,
      team,
      poc_name: person?.name || null,
      poc_email: person?.email || null,
      poc_role: person?.role_code || null,
    };
  });
  return {
    steps,
    sla_minutes: route.sla_minutes,
    channel: route.lark_channel || "Risk Desk",
    chat_id: route.lark_chat_id || "oc_risk_control_desk",
    route_code: route.route_code,
    match_kind: route.match_kind,
    route_name: route.name,
  };
}

export function buildPocWindows(
  messages: Array<{ kind: string; meta_json?: string | null }>,
  pocs: MessengerPoc[],
  currentStep: number
): MessengerPocWindow[] {
  const windows: MessengerPocWindow[] = pocs.map((p, i) => ({
    ...p,
    status: i < currentStep ? "relayed" : i === currentStep ? "active" : "waiting",
    messages: [],
  }));
  if (!windows.length) return windows;

  let hop = 0;
  for (const m of messages) {
    const meta = parseMsgMeta(m.meta_json);
    const tagged = typeof meta.poc_step === "number" ? Number(meta.poc_step) : null;
    const dest = typeof meta.step === "number" ? Number(meta.step) : null;

    if (tagged != null && windows[tagged]) {
      hop = tagged;
      windows[tagged].messages.push(m);
      continue;
    }

    if (m.kind === "ESCALATION" && dest != null) {
      const src = Math.max(0, dest > 0 ? dest - 1 : 0);
      if (windows[src]) windows[src].messages.push(m);
      if (dest !== src && windows[dest]) windows[dest].messages.push(m);
      hop = Math.min(Math.max(dest, 0), windows.length - 1);
      continue;
    }

    if (!windows[hop]) hop = 0;
    windows[hop].messages.push(m);
  }
  return windows;
}

function alertDomainForThread(db: Database.Database, alertId: number | null | undefined): string | null {
  if (!alertId) return null;
  const alert = db
    .prepare(
      `SELECT mi.domain_code AS domain_code
       FROM monitor_alerts a
       LEFT JOIN monitor_indicators mi ON mi.id = a.indicator_id
       WHERE a.id = ?`
    )
    .get(alertId) as { domain_code: string | null } | undefined;
  return alert?.domain_code || null;
}

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
  const cols = db.prepare(`PRAGMA table_info(messenger_threads)`).all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === "cs_request_id")) {
    db.exec(`ALTER TABLE messenger_threads ADD COLUMN cs_request_id TEXT`);
  }
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
  const merged = { poc_step: 0, ...meta };
  if (typeof merged.poc_step !== "number" || Number.isNaN(merged.poc_step)) merged.poc_step = 0;
  db.prepare(
    `INSERT INTO messenger_messages (thread_id, msg_id, kind, sender, body, meta_json)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(threadDbId, msgId, kind, sender, body, JSON.stringify(merged));
  db.prepare(`UPDATE messenger_threads SET updated_at = datetime('now') WHERE id = ?`).run(threadDbId);
  return msgId;
}

export function seedMessengerIfEmpty(db: Database.Database = getDb()) {
  ensureMessengerSchema(db);
  const count = (db.prepare(`SELECT COUNT(*) AS c FROM messenger_threads`).get() as { c: number }).c;
  if (count > 0) return;

  const alerts = (() => {
    try {
      return db
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
    } catch (error) {
      console.warn("[messenger] seed alerts query failed", error);
      return [];
    }
  })();

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

    addDemoAiReport(db, tid, a);
    addDemoEscalation(db, tid, a.severity);
  }

  if (!alerts.length) {
    seedSyntheticMessengerThread(db);
  }
}

function lookupAnalysis(
  db: Database.Database,
  alertDbId?: number | null
): {
  id: number;
  analysis_id: string;
  summary: string | null;
  mode: string | null;
  challenge_verdict: string | null;
} | undefined {
  if (alertDbId) {
    const hit = db
      .prepare(
        `SELECT id, analysis_id, summary, mode, challenge_verdict FROM ai_analyses WHERE alert_id = ? ORDER BY id DESC LIMIT 1`
      )
      .get(alertDbId) as
      | {
          id: number;
          analysis_id: string;
          summary: string | null;
          mode: string | null;
          challenge_verdict: string | null;
        }
      | undefined;
    if (hit) return hit;
  }
  return db
    .prepare(`SELECT id, analysis_id, summary, mode, challenge_verdict FROM ai_analyses ORDER BY id LIMIT 1`)
    .get() as
    | {
        id: number;
        analysis_id: string;
        summary: string | null;
        mode: string | null;
        challenge_verdict: string | null;
      }
    | undefined;
}

function addDemoAiReport(
  db: Database.Database,
  tid: number,
  a: {
    title: string;
    analysis_db_id: number | null;
    analysis_id: string | null;
    summary: string | null;
    mode: string | null;
    challenge_verdict: string | null;
    id?: number;
  }
) {
  const linked =
    a.analysis_db_id && a.summary
      ? {
          id: a.analysis_db_id,
          analysis_id: a.analysis_id || `AIA-${a.analysis_db_id}`,
          summary: a.summary,
          mode: a.mode,
          challenge_verdict: a.challenge_verdict,
        }
      : lookupAnalysis(db, a.id ?? null);
  if (linked) {
    addMessage(
      db,
      tid,
      "AI_REPORT",
      "CRMP AI",
      `🤖 AI Report ${linked.analysis_id}\nMode: ${linked.mode || "RAG"}\n${linked.summary || a.title}${
        linked.challenge_verdict ? `\nSecond AI: ${linked.challenge_verdict}` : ""
      }`,
      {
        analysis_db_id: linked.id,
        analysis_id: linked.analysis_id,
        mode: linked.mode,
        challenge_verdict: linked.challenge_verdict,
        admin_url: `/admin/ai-analyses/${linked.id}`,
      }
    );
    db.prepare(`UPDATE messenger_threads SET analysis_id = ? WHERE id = ?`).run(linked.id, tid);
    return;
  }
  addMessage(
    db,
    tid,
    "AI_REPORT",
    "CRMP AI",
    `🤖 AI Report AIA-DEMO\nMode: RAG\nPrimary RCA: ${a.title} matches a Credit & Client Risk pattern (session-open utilisation / concentration).\nRecommended: page Risk Desk, attach evidence, hold irreversible controls for checker.\nSecond AI: AGREE`,
    { analysis_id: "AIA-DEMO", admin_url: "/admin/ai-analyses" }
  );
}

function addDemoEscalation(db: Database.Database, tid: number, severity: string) {
  const path = getEscalationPocs(severity, null);
  const from = path.steps[0];
  addMessage(
    db,
    tid,
    "ESCALATION",
    "Escalation Engine",
    `⬆️ Path posted to ${from?.team || "primary desk"} Lark (step 1/${path.steps.length})\nChannel: ${path.channel} · SLA ${path.sla_minutes}m\nPath: ${path.steps.map((s) => s.team).join(" → ")}\nPOC: ${from?.poc_name || from?.team || "on-call"}`,
    {
      target: from?.team,
      step: 0,
      poc_step: 0,
      path: path.steps.map((s) => s.team),
      route_code: path.route_code,
      mock: true,
    }
  );
}

function seedSyntheticMessengerThread(db: Database.Database) {
  const threadId = newId("THR");
  const info = db
    .prepare(
      `INSERT INTO messenger_threads
        (thread_id, channel_name, title, severity, status, alert_id, analysis_id, escalation_step)
       VALUES (?, ?, ?, ?, 'OPEN', NULL, NULL, 1)`
    )
    .run(threadId, "Risk Critical Bridge", "Margin utilisation spike", "BREACH");
  const tid = Number(info.lastInsertRowid);
  addMessage(
    db,
    tid,
    "ALERT",
    "Monitor 2.0",
    "🚨 BREACH · Accounts >90% Margin Utilisation (M2-MRG-014)\n128 accounts above 90% margin utilisation during US open.\nAlert: ALT-1001",
    { alert_id: "ALT-1001", monitor_id: "M2-MRG-014" }
  );
  addDemoAiReport(db, tid, {
    title: "Margin utilisation spike",
    analysis_db_id: null,
    analysis_id: null,
    summary: null,
    mode: null,
    challenge_verdict: null,
  });
  addDemoEscalation(db, tid, "BREACH");
}

function threadKinds(db: Database.Database, threadDbId: number) {
  return (
    db.prepare(`SELECT DISTINCT kind FROM messenger_messages WHERE thread_id = ?`).all(threadDbId) as Array<{
      kind: string;
    }>
  ).map((row) => row.kind);
}

/** Guarantee every thread shows Alert + AI report + Escalation for the Lark demo. */
export function ensureMessengerDemoMessages(db: Database.Database = getDb()) {
  ensureMessengerSchema(db);
  seedMessengerIfEmpty(db);
  const threads = db
    .prepare(`SELECT id, title, severity FROM messenger_threads`)
    .all() as Array<{ id: number; title: string; severity: string }>;
  if (!threads.length) {
    seedSyntheticMessengerThread(db);
    return;
  }
  for (const thread of threads) {
    const kinds = threadKinds(db, thread.id);
    if (!kinds.includes("ALERT")) {
      addMessage(
        db,
        thread.id,
        "ALERT",
        "Monitor 2.0",
        `🚨 ${thread.severity} · ${thread.title}\nSynced from Monitor 2.0 into the Lark-style demo inbox.`,
        { mock: true }
      );
    }
    if (!kinds.includes("AI_REPORT")) {
      addDemoAiReport(db, thread.id, {
        title: thread.title,
        analysis_db_id: null,
        analysis_id: null,
        summary: null,
        mode: null,
        challenge_verdict: null,
      });
    }
    if (!kinds.includes("ESCALATION")) {
      addDemoEscalation(db, thread.id, thread.severity);
    }
  }
  relinkMessengerToAnalyses(db);
}

function relinkMessengerToAnalyses(db: Database.Database) {
  const analyses = db
    .prepare(`SELECT id, analysis_id, alert_id, summary, mode, challenge_verdict FROM ai_analyses ORDER BY id`)
    .all() as Array<{
    id: number;
    analysis_id: string;
    alert_id: number;
    summary: string | null;
    mode: string | null;
    challenge_verdict: string | null;
  }>;
  if (!analyses.length) return;
  const byAlert = new Map(analyses.map((row) => [row.alert_id, row]));
  const threads = db
    .prepare(`SELECT id, alert_id FROM messenger_threads`)
    .all() as Array<{ id: number; alert_id: number | null }>;
  for (const thread of threads) {
    const linked = (thread.alert_id != null ? byAlert.get(thread.alert_id) : undefined) || analyses[0];
    db.prepare(`UPDATE messenger_threads SET analysis_id = ? WHERE id = ?`).run(linked.id, thread.id);
    const msgs = db
      .prepare(`SELECT id, meta_json FROM messenger_messages WHERE thread_id = ? AND kind = 'AI_REPORT'`)
      .all(thread.id) as Array<{ id: number; meta_json: string }>;
    for (const msg of msgs) {
      let meta: Record<string, unknown> = {};
      try {
        meta = JSON.parse(msg.meta_json || "{}") as Record<string, unknown>;
      } catch {
        meta = {};
      }
      meta.admin_url = `/admin/ai-analyses/${linked.id}`;
      meta.analysis_db_id = linked.id;
      meta.analysis_id = linked.analysis_id;
      db.prepare(`UPDATE messenger_messages SET meta_json = ? WHERE id = ?`).run(JSON.stringify(meta), msg.id);
    }
  }
}

export type MessengerInboxPack = {
  messages: unknown[];
  pending: unknown[];
  recommended_actions: typeof RECOMMENDED_ACTIONS;
  poc_windows?: MessengerPocWindow[];
  escalation_path?: ReturnType<typeof getEscalationPocs>;
  current_step?: number;
};

export function listMessengerInbox() {
  ensureMessengerSchema();
  seedMessengerIfEmpty();
  ensureMessengerDemoMessages();
  const threads = listMessengerThreads() as Array<{ id: number }>;
  const catalog: Record<number, MessengerInboxPack> = {};
  for (const thread of threads) {
    const full = getMessengerThread(thread.id);
    if (!full) continue;
    catalog[thread.id] = {
      messages: full.messages,
      pending: full.pending,
      recommended_actions: full.recommended_actions,
      poc_windows: full.poc_windows,
      escalation_path: full.escalation_path,
      current_step: full.current_step,
    };
  }
  return { threads, catalog };
}

export function listMessengerThreads() {
  ensureMessengerSchema();
  seedMessengerIfEmpty();
  ensureMessengerDemoMessages();
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
  const thread = db.prepare(`SELECT * FROM messenger_threads WHERE id = ?`).get(threadDbId) as
    | {
        id: number;
        thread_id: string;
        title: string;
        severity: string;
        status: string;
        analysis_id: number | null;
        alert_id: number | null;
        escalation_step: number;
        channel_name: string;
      }
    | undefined;
  if (!thread) return null;
  const messages = db
    .prepare(`SELECT * FROM messenger_messages WHERE thread_id = ? ORDER BY id`)
    .all(threadDbId);
  const pending = db
    .prepare(
      `SELECT * FROM messenger_pending_actions WHERE thread_id = ? AND status IN ('AWAITING_CONFIRM','AWAITING_CHECKER') ORDER BY id DESC`
    )
    .all(threadDbId);
  const domainCode = alertDomainForThread(db, thread.alert_id);
  const path = getEscalationPocs(thread.severity, domainCode);
  const current_step = Math.min(Math.max(Number(thread.escalation_step) || 0, 0), Math.max(path.steps.length - 1, 0));
  const poc_windows = buildPocWindows(
    messages as Array<{ kind: string; meta_json?: string | null }>,
    path.steps,
    current_step
  );
  return {
    thread,
    messages,
    pending,
    recommended_actions: RECOMMENDED_ACTIONS,
    escalation_path: path,
    current_step,
    poc_windows,
  };
}

function getEscalationPath(severity: string, domainCode?: string | null) {
  const path = getEscalationPocs(severity, domainCode);
  return {
    steps: path.steps.map((s) => s.team),
    pocs: path.steps,
    sla_minutes: path.sla_minutes,
    channel: path.channel,
    chat_id: path.chat_id,
    route_code: path.route_code,
    match_kind: path.match_kind,
    route_name: path.route_name,
  };
}

function postThreadAlertCard(input: {
  threadDbId: number;
  title: string;
  severity: string;
  body: string;
  chatId: string;
  alertDbId?: number | null;
  csRequestId?: string | null;
  routeCode?: string | null;
}) {
  try {
    postLarkCard({
      chat_id: input.chatId,
      kind: "ALERT",
      title: input.title,
      body: input.body,
      severity: input.severity,
      thread_db_id: input.threadDbId,
      alert_db_id: input.alertDbId ?? null,
      cs_request_id: input.csRequestId ?? null,
      route_code: input.routeCode ?? null,
      actor: "Monitor 2.0",
    });
  } catch {
    /* Lark cards optional in unit tests without schema */
  }
}

function postThreadEscalationCard(input: {
  threadDbId: number;
  title: string;
  severity: string;
  body: string;
  chatId: string;
  alertDbId?: number | null;
  csRequestId?: string | null;
  routeCode?: string | null;
  actor?: string;
}) {
  try {
    postLarkCard({
      chat_id: input.chatId,
      kind: "ESCALATION",
      title: `Escalate · ${input.title}`,
      body: input.body,
      severity: input.severity,
      thread_db_id: input.threadDbId,
      alert_db_id: input.alertDbId ?? null,
      cs_request_id: input.csRequestId ?? null,
      route_code: input.routeCode ?? null,
      actor: input.actor || "Escalation Engine",
      dedupe: false,
    });
    markLarkCardsForThread(input.threadDbId, "ESCALATED");
  } catch {
    /* optional */
  }
}

export function messengerAction(input: {
  thread_id: number;
  action: MessengerAction;
  user_name: string;
  text?: string;
  action_code?: string;
  pending_id?: number;
  locale?: UiLocale;
}) {
  ensureMessengerSchema();
  const db = getDb();
  const zh = input.locale === "zh-Hant";
  const actorEvidence = zh ? "證據庫" : "Evidence Vault";
  const actorEscalation = zh ? "升級引擎" : "Escalation Engine";
  const actorAdvisor = zh ? "動作顧問" : "Action Advisor";
  const actorBot = zh ? "CRMP 聊天機器人" : "CRMP Chatbot";
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
  const hop = Number(thread.escalation_step) || 0;

  if (input.action === "show_evidence") {
    if (!thread.analysis_id) {
      addMessage(
        db,
        thread.id,
        "SYSTEM",
        "Messenger",
        zh ? "尚未連結 AI 分析 — 請開啟 Realtime Alert & Tracker 調查。" : "No AI analysis linked — open Realtime Alert & Tracker to investigate.",
        { poc_step: hop }
      );
      return getMessengerThread(thread.id);
    }
    const evidence = db
      .prepare(
        `SELECT evidence_type, title, excerpt, score FROM ai_analysis_evidence
         WHERE analysis_id = ? ORDER BY score DESC, id LIMIT 6`
      )
      .all(thread.analysis_id) as Array<{
      evidence_type: string;
      title: string;
      excerpt: string;
      score: number;
    }>;
    const challenge = db
      .prepare(`SELECT verdict, summary FROM ai_analysis_challenges WHERE analysis_id = ?`)
      .get(thread.analysis_id) as { verdict: string; summary: string } | undefined;
    const lines = evidence.map(
      (e) => `• [${e.evidence_type}] ${e.title} (score ${Number(e.score).toFixed(2)})\n  ${String(e.excerpt || "").slice(0, 160)}`
    );
    addMessage(
      db,
      thread.id,
      "EVIDENCE",
      actorEvidence,
      zh
        ? `📎 分析 #${thread.analysis_id} 證據包\n${lines.join("\n")}${
            challenge?.verdict ? `\n\n第二 AI（${challenge.verdict}）：${challenge.summary}` : ""
          }`
        : `📎 Evidence pack for analysis #${thread.analysis_id}\n${lines.join("\n")}${
            challenge?.verdict ? `\n\nSecond AI (${challenge.verdict}): ${challenge.summary}` : ""
          }`,
      { analysis_id: thread.analysis_id, admin_url: `/admin/ai-analyses/${thread.analysis_id}`, poc_step: hop }
    );
    writeAudit({ name: input.user_name }, "MESSENGER_SHOW_EVIDENCE", "messenger_thread", thread.thread_id, {});
    return getMessengerThread(thread.id);
  }

  if (input.action === "chat") {
    const text = (input.text || "").trim();
    if (!text) throw new Error("Message required");
    addMessage(db, thread.id, "USER", input.user_name, text, { poc_step: hop });
    const lower = text.toLowerCase();
    let reply = zh
      ? "已記錄。已將您的備註附加至案件，風險台覆核 AI 報告時可使用。"
      : "Noted. I've attached your note to the case. Risk Desk can use this when reviewing the AI report.";
    if (/disagree|wrong|challenge|incorrect|false|不同意|挑戰|錯誤/.test(lower) || /不同意|挑戰|錯誤/.test(text)) {
      reply = zh
        ? "已記錄挑戰。已標記 AI 分析需人工覆核，並要求在不可逆控制前考慮第二挑戰者路徑。"
        : "Challenge recorded. I've flagged the AI analysis for human review and asked the second challenger path to be considered before any irreversible control.";
      if (thread.analysis_id) {
        db.prepare(`UPDATE ai_analyses SET needs_human = 1 WHERE id = ?`).run(thread.analysis_id);
      }
    } else if (/more info|context|add|update|補充|更多|更新/.test(lower) || /補充|更多資訊|更新/.test(text)) {
      reply = zh
        ? "已將額外脈絡存入執行緒。下次風險負責人覆核包會連同主 RCA 與挑戰者一併呈現。"
        : "Additional context saved on the thread. It will appear in the next Risk Owner review pack alongside primary + challenger RCA.";
    }
    addMessage(db, thread.id, "CHATBOT", actorBot, `💬 ${reply}`, { in_reply_to: text, poc_step: hop });
    writeAudit({ name: input.user_name }, "MESSENGER_CHAT", "messenger_thread", thread.thread_id, { text });
    return getMessengerThread(thread.id);
  }

  if (input.action === "escalate") {
    const domainCode = alertDomainForThread(db, thread.alert_id);
    const path = getEscalationPath(thread.severity, domainCode);
    const fromStep = Math.min(Math.max(thread.escalation_step || 0, 0), Math.max(path.steps.length - 1, 0));
    const nextStep = Math.min(fromStep + 1, path.steps.length - 1);
    const fromTeam = path.steps[fromStep];
    const target = path.steps[nextStep];
    const fromPoc = path.pocs[fromStep];
    const toPoc = path.pocs[nextStep];
    db.prepare(`UPDATE messenger_threads SET escalation_step = ?, updated_at = datetime('now') WHERE id = ?`).run(
      nextStep,
      thread.id
    );
    const defaultNote = zh
      ? path.match_kind === "default"
        ? `\n路徑：${path.route_code}（預設兜底 — 異常／未匹配）`
        : `\n路徑：${path.route_code}（${path.match_kind}）`
      : path.match_kind === "default"
        ? `\nRoute: ${path.route_code} (DEFAULT catch-all — exotic / unmatched)`
        : `\nRoute: ${path.route_code} (${path.match_kind})`;
    const chain = path.steps.join(" → ");
    addMessage(
      db,
      thread.id,
      "ESCALATION",
      actorEscalation,
      zh
        ? `⬆️ 已從 ${fromTeam} 轉交至 ${target}（步驟 ${nextStep + 1}/${path.steps.length}）\n承辦：${fromPoc?.poc_name || fromTeam} → ${toPoc?.poc_name || target}\n頻道：${path.channel} · SLA ${path.sla_minutes} 分鐘${defaultNote}\n升級鏈：${chain}`
        : `⬆️ Relayed from ${fromTeam} to ${target} (step ${nextStep + 1}/${path.steps.length})\nPOC: ${fromPoc?.poc_name || fromTeam} → ${toPoc?.poc_name || target}\nChannel: ${path.channel} · SLA ${path.sla_minutes}m${defaultNote}\nPath: ${chain}`,
      {
        target,
        step: nextStep,
        poc_step: fromStep,
        handoff: "out",
        path: path.steps,
        route_code: path.route_code,
        match_kind: path.match_kind,
        route_name: path.route_name,
        from_poc: fromPoc?.poc_name,
        to_poc: toPoc?.poc_name,
      }
    );
    if (nextStep !== fromStep) {
      addMessage(
        db,
        thread.id,
        "ESCALATION",
        actorEscalation,
        zh
          ? `⬇️ ${target} 已接收（承辦 ${toPoc?.poc_name || target}）\n來自：${fromTeam}${fromPoc?.poc_name ? `（${fromPoc.poc_name}）` : ""}\n請在此窗繼續覆核；升級鏈：${chain}`
          : `⬇️ ${target} received (POC ${toPoc?.poc_name || target})\nFrom: ${fromTeam}${fromPoc?.poc_name ? ` (${fromPoc.poc_name})` : ""}\nContinue the case in this window. Path: ${chain}`,
        {
          target,
          step: nextStep,
          poc_step: nextStep,
          handoff: "in",
          path: path.steps,
          route_code: path.route_code,
          from_poc: fromPoc?.poc_name,
          to_poc: toPoc?.poc_name,
        }
      );
    }
    logSpineEvent({
      stage: "ESCALATION",
      title: `Messenger escalate → ${target}`,
      product: "CFD+CRYPTO",
      ref_type: "messenger_thread",
      ref_id: thread.thread_id,
      severity: thread.severity,
      detail: { step: nextStep, target, route_code: path.route_code, match_kind: path.match_kind, from: fromTeam },
      actor: input.user_name,
    });
    writeAudit({ name: input.user_name }, "MESSENGER_ESCALATE", "messenger_thread", thread.thread_id, {
      target,
      step: nextStep,
      route_code: path.route_code,
      match_kind: path.match_kind,
      from: fromTeam,
    });
    postThreadEscalationCard({
      threadDbId: thread.id,
      title: thread.title,
      severity: thread.severity,
      body: zh
        ? `⬆️ 已從 ${fromTeam} 轉交至 ${target}（步驟 ${nextStep + 1}/${path.steps.length}）\n頻道：${path.channel}`
        : `⬆️ Relayed from ${fromTeam} to ${target} (step ${nextStep + 1}/${path.steps.length})\nChannel: ${path.channel}`,
      chatId: path.chat_id || path.channel,
      alertDbId: thread.alert_id,
      routeCode: path.route_code,
      actor: input.user_name,
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
      zh
        ? "❎ 已排除為誤報。警報已關閉。未再套用控制。"
        : "❎ Dismissed as false alarm. Alert closed. No further controls applied.",
        { poc_step: hop }
    );
    writeAudit({ name: input.user_name }, "MESSENGER_DISMISS", "messenger_thread", thread.thread_id, {});
    try {
      markLarkCardsForThread(thread.id, "DISMISSED");
    } catch {
      /* optional */
    }
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
      zh
        ? "✅ 已結案 — 接受 AI 分析。工單已關閉；雙 AI 包保留於證據庫。"
        : "✅ Closed — AI analysis accepted. Ticket closed; dual-AI pack retained in evidence vault.",
        { poc_step: hop }
    );
    writeAudit({ name: input.user_name }, "MESSENGER_CLOSE", "messenger_thread", thread.thread_id, {});
    try {
      markLarkCardsForThread(thread.id, "CLOSED");
    } catch {
      /* optional */
    }
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
      actorAdvisor,
      zh
        ? `⚙️ 建議：${action.label}\n${action.description}\n送至 Vantage Markets 管理後台前請雙重確認。`
        : `⚙️ Proposed: ${action.label}\n${action.description}\nPlease double-confirm before sending to Vantage Markets admin.`,
      { pending_id: Number(info.lastInsertRowid), action, poc_step: hop }
    );
    return getMessengerThread(thread.id);
  }

  if (input.action === "cancel_action") {
    if (!input.pending_id) throw new Error("pending_id required");
    db.prepare(
      `UPDATE messenger_pending_actions SET status = 'CANCELLED', updated_at = datetime('now') WHERE id = ? AND thread_id = ?`
    ).run(input.pending_id, thread.id);
    addMessage(
      db,
      thread.id,
      "SYSTEM",
      input.user_name,
      zh ? "已取消待確認控制動作。" : "Cancelled pending control action.",
      { poc_step: hop }
    );
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
        poc_step: hop,
      }
    );

    if (nextStatus === "AWAITING_CHECKER") {
      addMessage(
        db,
        thread.id,
        "SYSTEM",
        "Maker-Checker",
        `Next step: Checker must approve ${adminRef} in this chat (or open ${action.admin_path}). Control is not live until Checker signs off.`,
        { poc_step: hop }
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

  if (input.action === "checker_approve") {
    if (!input.pending_id) throw new Error("pending_id required");
    const pending = db
      .prepare(`SELECT * FROM messenger_pending_actions WHERE id = ? AND thread_id = ?`)
      .get(input.pending_id, thread.id) as
      | {
          id: number;
          action_code: string;
          status: string;
          admin_ref: string | null;
          confirmed_by: string | null;
          detail_json: string;
        }
      | undefined;
    if (!pending || pending.status !== "AWAITING_CHECKER") {
      throw new Error("Nothing awaiting checker approval");
    }
    if (pending.confirmed_by && pending.confirmed_by === input.user_name) {
      throw new Error("Checker must be a different user than the maker who confirmed");
    }
    const action = JSON.parse(pending.detail_json) as (typeof RECOMMENDED_ACTIONS)[number] & {
      checker?: string;
    };
    const detailNext = { ...action, checker: input.user_name };
    db.prepare(
      `UPDATE messenger_pending_actions
       SET status = 'DONE', detail_json = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(JSON.stringify(detailNext), pending.id);

    addMessage(
      db,
      thread.id,
      "ACTION_RESULT",
      "Vantage Markets Admin",
      `✅ Checker ${input.user_name} approved ${action.label}.\nControl is live under admin ref ${pending.admin_ref}.\nOpen admin: ${action.admin_path}`,
      {
        admin_ref: pending.admin_ref,
        admin_url: action.admin_path,
        needs_checker: false,
        status: "DONE",
        checker: input.user_name,
        poc_step: hop,
      }
    );
    logSpineEvent({
      stage: "INTERVENTION",
      title: `Checker approved ${action.label}`,
      product: "CFD+CRYPTO",
      ref_type: "messenger_thread",
      ref_id: thread.thread_id,
      severity: thread.severity,
      detail: { admin_ref: pending.admin_ref, action: action.code, checker: input.user_name },
      actor: input.user_name,
    });
    writeAudit({ name: input.user_name }, "MESSENGER_CHECKER_APPROVE", "messenger_thread", thread.thread_id, {
      action: action.code,
      admin_ref: pending.admin_ref,
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
    const path = getEscalationPocs(a.severity, null);
    const threadId = newId("THR");
    const info = db
      .prepare(
        `INSERT INTO messenger_threads
          (thread_id, channel_name, title, severity, status, alert_id, analysis_id, escalation_step)
         VALUES (?, ?, ?, ?, 'OPEN', ?, ?, 0)`
      )
      .run(threadId, path.channel, a.title, a.severity, a.id, a.analysis_db_id);
    const tid = Number(info.lastInsertRowid);
    const alertBody = `🚨 ${a.severity} · ${a.indicator_name} (${a.monitor_id})\n${a.message}\nAlert: ${a.alert_id}`;
    addMessage(db, tid, "ALERT", "Monitor 2.0", alertBody, { alert_id: a.alert_id, monitor_id: a.monitor_id });
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
    postThreadAlertCard({
      threadDbId: tid,
      title: a.title,
      severity: a.severity,
      body: a.summary ? `${alertBody}\n\n${a.summary}` : alertBody,
      chatId: path.chat_id,
      alertDbId: a.id,
      routeCode: path.route_code,
    });
  }
  return rows.length;
}

export function openCsRiskOnMessenger(input: {
  request_id: string;
  subject: string;
  body: string;
  client_name: string;
  user_name: string;
  locale?: UiLocale;
}): { thread_db_id: number; thread_id: string } {
  ensureMessengerSchema();
  const db = getDb();
  const existing = db
    .prepare(`SELECT id, thread_id FROM messenger_threads WHERE cs_request_id = ? ORDER BY id DESC LIMIT 1`)
    .get(input.request_id) as { id: number; thread_id: string } | undefined;
  if (existing) return { thread_db_id: existing.id, thread_id: existing.thread_id };

  const zh = input.locale === "zh-Hant";
  const path = getEscalationPocs("CRITICAL", "CREDIT_CLIENT");
  const threadId = newId("THR");
  const title = `CS ${input.request_id}: ${input.subject}`;
  const info = db
    .prepare(
      `INSERT INTO messenger_threads
        (thread_id, channel_name, title, severity, status, alert_id, analysis_id, escalation_step, cs_request_id)
       VALUES (?, ?, ?, 'CRITICAL', 'OPEN', NULL, NULL, 0, ?)`
    )
    .run(threadId, path.channel, title, input.request_id);
  const tid = Number(info.lastInsertRowid);
  const alertBody = zh
    ? `🚨 CS／TR 已升級風控\n案件 ${input.request_id} · ${input.client_name}\n${input.subject}\n${input.body.slice(0, 400)}`
    : `🚨 CS/TR escalated to Risk\nTicket ${input.request_id} · ${input.client_name}\n${input.subject}\n${input.body.slice(0, 400)}`;
  addMessage(db, tid, "ALERT", "CS / TR Desk", alertBody, { cs_request_id: input.request_id });
  postThreadAlertCard({
    threadDbId: tid,
    title,
    severity: "CRITICAL",
    body: alertBody,
    chatId: path.chat_id,
    csRequestId: input.request_id,
    routeCode: path.route_code,
  });
  messengerAction({
    thread_id: tid,
    action: "escalate",
    user_name: input.user_name,
    locale: input.locale,
  });
  return { thread_db_id: tid, thread_id: threadId };
}
