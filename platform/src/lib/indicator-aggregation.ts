/**
 * Indicator aggregation flow (linear):
 * single alert → skill/RAG lookup → aggregate membership check →
 *   (no) continue as single |
 *   (yes) mark correlation + wait window →
 *     timeout → RO as single |
 *     related alerts → aggregate UI → RO as aggregate |
 *     RO force-aggregate while L1 incomplete → L2 + post-flow
 */
import type Database from "better-sqlite3";
import { getDb, writeAudit } from "@/lib/db";
import { LINKED_SCENARIOS } from "@/lib/ai/risk-scenarios-catalog";
import { listLinkedScenarios, seedSkillsIfEmpty } from "@/lib/ai/skills";
import type { LinkedScenario, TimelineEvent } from "@/lib/ai/scenario-types";
import {
  LINEAR_AGGREGATION_STEPS,
  POST_L2_FLOW_STAGES,
  type AggregateDefinition,
  type AggregationEvent,
  type AggregationOutcome,
  type AggregationSession,
  type AggregationStepId,
} from "@/lib/indicator-aggregation-shared";

export type {
  AggregateDefinition,
  AggregationEvent,
  AggregationOutcome,
  AggregationSession,
  AggregationStepId,
};
export { LINEAR_AGGREGATION_STEPS, POST_L2_FLOW_STAGES };

export type AggregationBoardPack = {
  definitions: AggregateDefinition[];
  sessions: AggregationSession[];
  linear_steps: Array<{ id: AggregationStepId; en: string; zh: string }>;
};

const SESSIONS_KEY = "indicator.aggregation.sessions";

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function parseSequence(raw: string | TimelineEvent[] | null | undefined): TimelineEvent[] {
  if (Array.isArray(raw)) return raw;
  if (!raw) return [];
  try {
    return JSON.parse(raw) as TimelineEvent[];
  } catch {
    return [];
  }
}

function zhChainName(code: string, fallback: string): string {
  const map: Record<string, string> = {
    "CHAIN-CREDIT-CASCADE": "跟單集中 → 保證金尖峰 → 權益回撤",
    "CHAIN-LP-HEDGE-GAP": "LP 拒單風暴 → 對沖覆蓋缺口 → 權益壓力",
    "CHAIN-FEED-LIQUIDATION-ERROR": "陳舊行情 → 假保證金壓力 → 權益雜訊",
  };
  return map[code] || fallback;
}

function zhChainDesc(code: string, fallback: string): string {
  const map: Record<string, string> = {
    "CHAIN-CREDIT-CASCADE": "經典 CFD 信用傳染：單一提供者主導、跟單者觸及保證金、公司權益下滑。",
    "CHAIN-LP-HEDGE-GAP": "流動性失效使帳簿在波動中未對沖。",
    "CHAIN-FEED-LIQUIDATION-ERROR": "錯誤價格造成人為保證金使用率與錯誤強平。",
  };
  return map[code] || fallback;
}

export function definitionsFromLinked(chains: LinkedScenario[]): AggregateDefinition[] {
  return chains.map((c) => {
    const seq = c.sequence || [];
    const monitors = Array.from(new Set(seq.map((s) => s.monitor_id).filter(Boolean)));
    const maxT = seq.reduce((m, s) => Math.max(m, Number(s.t_minutes) || 0), 0);
    const window_minutes = Math.max(15, Math.min(120, maxT || 45));
    return {
      code: c.code,
      name: c.name,
      name_zh: zhChainName(c.code, c.name),
      description: c.description,
      description_zh: zhChainDesc(c.code, c.description),
      domain: c.domain,
      product: c.product,
      severity: c.severity,
      member_monitors: monitors,
      window_minutes,
      linked_skills: c.linked_skills || [],
      sequence: seq,
    };
  });
}

export function listAggregateDefinitions(db: Database.Database = getDb()): AggregateDefinition[] {
  seedSkillsIfEmpty(db);
  const rows = listLinkedScenarios(db);
  if (rows.length) {
    const mapped = rows.map((r) => {
      const sequence = parseSequence(r.sequence_json);
      let linked_skills: string[] = [];
      try {
        linked_skills = JSON.parse(r.linked_skills_json || "[]") as string[];
      } catch {
        linked_skills = [];
      }
      const monitors = Array.from(new Set(sequence.map((s) => s.monitor_id).filter(Boolean)));
      const maxT = sequence.reduce((m, s) => Math.max(m, Number(s.t_minutes) || 0), 0);
      return {
        code: r.code,
        name: r.name,
        name_zh: zhChainName(r.code, r.name),
        description: r.description,
        description_zh: zhChainDesc(r.code, r.description),
        domain: r.domain,
        product: r.product,
        severity: r.severity,
        member_monitors: monitors,
        window_minutes: Math.max(15, Math.min(120, maxT || 45)),
        linked_skills,
        sequence,
      } satisfies AggregateDefinition;
    });
    if (mapped.length) return mapped;
  }
  return definitionsFromLinked(LINKED_SCENARIOS);
}

export function findAggregatesForMonitor(
  monitorId: string,
  defs: AggregateDefinition[] = listAggregateDefinitions()
): AggregateDefinition[] {
  const id = String(monitorId || "").toUpperCase();
  return defs.filter((d) => d.member_monitors.some((m) => m.toUpperCase() === id));
}

function pushEvent(session: AggregationSession, step: AggregationStepId, en: string, zh: string) {
  session.events.push({ at: nowIso(), step, en, zh });
  session.step = step;
  session.updated_at = nowIso();
}

function skillForMonitor(monitorId: string, def: AggregateDefinition | null): string | null {
  if (def?.linked_skills?.length) return def.linked_skills[0];
  const hit = LINKED_SCENARIOS.find((c) =>
    c.sequence.some((s) => s.monitor_id.toUpperCase() === monitorId.toUpperCase())
  );
  return hit?.linked_skills?.[0] || null;
}

function ragHint(monitorId: string, inAggregate: boolean): string | null {
  if (inAggregate) return `RAG: correlated monitors for ${monitorId} (chain membership)`;
  return `RAG: standalone playbook for ${monitorId}`;
}

export function ensureAggregationSchema(db: Database.Database = getDb()) {
  const row = db.prepare(`SELECT value FROM platform_settings WHERE key = ?`).get(SESSIONS_KEY) as
    | { value: string }
    | undefined;
  if (!row) {
    db.prepare(
      `INSERT INTO platform_settings (key, value, description) VALUES (?, ?, ?)`
    ).run(SESSIONS_KEY, "[]", "Indicator aggregation flow demo sessions");
  }
}

function loadSessions(db: Database.Database = getDb()): AggregationSession[] {
  ensureAggregationSchema(db);
  const row = db.prepare(`SELECT value FROM platform_settings WHERE key = ?`).get(SESSIONS_KEY) as
    | { value: string }
    | undefined;
  if (!row?.value) return [];
  try {
    const parsed = JSON.parse(row.value) as AggregationSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: AggregationSession[], db: Database.Database = getDb()) {
  ensureAggregationSchema(db);
  db.prepare(
    `INSERT INTO platform_settings (key, value, description) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
  ).run(SESSIONS_KEY, JSON.stringify(sessions), "Indicator aggregation flow demo sessions");
}

export function startAggregationSession(input: {
  trigger_monitor: string;
  trigger_severity?: string;
  actor?: { id?: number | null; name: string };
  db?: Database.Database;
}): AggregationSession {
  const db = input.db || getDb();
  const defs = listAggregateDefinitions(db);
  const monitor = String(input.trigger_monitor || "M2-COPY-009").toUpperCase();
  const severity = String(input.trigger_severity || "BREACH").toUpperCase();
  const matches = findAggregatesForMonitor(monitor, defs);
  const primary = matches[0] || null;

  const session: AggregationSession = {
    session_id: newId("AGG"),
    trigger_monitor: monitor,
    trigger_severity: severity,
    trigger_alert_id: newId("ALT"),
    skill_hit: null,
    rag_hit: null,
    aggregate_code: primary?.code || null,
    aggregate_name: primary?.name || null,
    member_monitors: primary?.member_monitors || [monitor],
    related_seen: [],
    window_minutes: primary?.window_minutes || 0,
    window_opened_at: null,
    window_closes_at: null,
    step: "SINGLE_ALERT",
    outcome: "PENDING",
    correlation_marked: false,
    force_aggregated: false,
    missing_l1_at_force: [],
    post_flow: [],
    events: [],
    created_at: nowIso(),
    updated_at: nowIso(),
  };

  pushEvent(
    session,
    "SINGLE_ALERT",
    `Alert ${session.trigger_alert_id}: ${monitor} = ${severity}`,
    `告警 ${session.trigger_alert_id}：${monitor} = ${severity}`
  );

  const skill = skillForMonitor(monitor, primary);
  session.skill_hit = skill;
  session.rag_hit = ragHint(monitor, !!primary);
  pushEvent(
    session,
    "SKILL_RAG_LOOKUP",
    skill
      ? `Skill match ${skill}; RAG also scanned for chain membership`
      : `No skill match — RAG reasoning for ${monitor}`,
    skill
      ? `命中技能 ${skill}；並以 RAG 檢索鏈成員資格`
      : `無技能命中 — 對 ${monitor} 做 RAG 推理`
  );

  pushEvent(
    session,
    "AGGREGATE_CHECK",
    primary
      ? `Defined in aggregate ${primary.code} (${primary.member_monitors.join(", ")})`
      : `Not a member of any aggregate — treat as single indicator`,
    primary
      ? `屬於聚合指標 ${primary.code}（成員：${primary.member_monitors.join("、")}）`
      : `不屬於任何聚合指標 — 按單一指標處理`
  );

  if (!primary) {
    pushEvent(
      session,
      "SINGLE_CONTINUE",
      "Continue remaining single-indicator flow (RCA → messenger → RO)",
      "繼續單一指標剩餘流程（RCA → Messenger → RO）"
    );
    pushEvent(
      session,
      "RO_SINGLE",
      "Status ready for Risk Owner as a single-indicator case",
      "狀態已更新：風險負責人按單一指標處理"
    );
    session.outcome = "SINGLE_NO_MEMBERSHIP";
  } else {
    session.correlation_marked = true;
    const opened = new Date();
    const closes = new Date(opened.getTime() + primary.window_minutes * 60_000);
    session.window_opened_at = opened.toISOString();
    session.window_closes_at = closes.toISOString();
    pushEvent(
      session,
      "CORRELATED_WAIT",
      `Correlation flagged. Wait ${primary.window_minutes}m for related monitors: ${primary.member_monitors
        .filter((m) => m !== monitor)
        .join(", ") || "(none)"}`,
      `已標記可能關聯。開啟 ${primary.window_minutes} 分鐘視窗等待關聯指標：${
        primary.member_monitors.filter((m) => m !== monitor).join("、") || "（無）"
      }`
    );
    // Keep single-indicator RCA running in parallel (noted in event trail).
    pushEvent(
      session,
      "CORRELATED_WAIT",
      "Single-indicator RCA continues in parallel while the wait window is open",
      "等待視窗開啟期間，單一指標 RCA 流程並行繼續"
    );
  }

  const sessions = loadSessions(db);
  sessions.unshift(session);
  saveSessions(sessions.slice(0, 40), db);
  writeAudit(input.actor || { id: null, name: "system" }, "INDICATOR_AGG_START", "indicator_aggregation", session.session_id, {
    monitor,
    aggregate: session.aggregate_code,
    step: session.step,
  });
  return session;
}

export function injectRelatedAlert(input: {
  session_id: string;
  related_monitor: string;
  severity?: string;
  actor?: { id?: number | null; name: string };
  db?: Database.Database;
}): AggregationSession {
  const db = input.db || getDb();
  const sessions = loadSessions(db);
  const idx = sessions.findIndex((s) => s.session_id === input.session_id);
  if (idx < 0) throw new Error("Aggregation session not found");
  const session = sessions[idx];
  if (session.outcome !== "PENDING" && session.step !== "CORRELATED_WAIT") {
    throw new Error(`Session already closed (${session.outcome})`);
  }
  const related = String(input.related_monitor || "").toUpperCase();
  if (!session.member_monitors.map((m) => m.toUpperCase()).includes(related)) {
    throw new Error(`${related} is not a member of ${session.aggregate_code}`);
  }
  if (related === session.trigger_monitor) {
    throw new Error("Related monitor must differ from the trigger");
  }
  if (!session.related_seen.includes(related)) session.related_seen.push(related);

  pushEvent(
    session,
    "AGGREGATE_READY",
    `Related alert ${related} (${input.severity || "BREACH"}) inside window — aggregating in UI`,
    `視窗內出現關聯告警 ${related}（${input.severity || "BREACH"}）— 界面內聚合`
  );
  pushEvent(
    session,
    "RO_AGGREGATE",
    `Pack ${session.aggregate_code} ready for Risk Owner as an aggregated case (trigger ${session.trigger_monitor} + ${session.related_seen.join(", ")})`,
    `聚合包 ${session.aggregate_code} 已就緒，供風險負責人按聚合指標處理（觸發 ${session.trigger_monitor}＋${session.related_seen.join("、")}）`
  );
  session.outcome = "AGGREGATED";
  session.force_aggregated = false;
  session.post_flow = POST_L2_FLOW_STAGES.map((s) => s.id);
  sessions[idx] = session;
  saveSessions(sessions, db);
  writeAudit(input.actor || { id: null, name: "system" }, "INDICATOR_AGG_RELATED", "indicator_aggregation", session.session_id, {
    related,
    outcome: session.outcome,
  });
  return session;
}

export function closeWaitWindowAsSingle(input: {
  session_id: string;
  actor?: { id?: number | null; name: string };
  db?: Database.Database;
}): AggregationSession {
  const db = input.db || getDb();
  const sessions = loadSessions(db);
  const idx = sessions.findIndex((s) => s.session_id === input.session_id);
  if (idx < 0) throw new Error("Aggregation session not found");
  const session = sessions[idx];
  if (session.step !== "CORRELATED_WAIT" && session.outcome === "PENDING") {
    /* allow */
  } else if (session.outcome !== "PENDING") {
    throw new Error(`Session already closed (${session.outcome})`);
  }
  pushEvent(
    session,
    "RO_SINGLE",
    `Wait window ended with no related alerts — update status for RO as single indicator (${session.trigger_monitor})`,
    `等待視窗結束且無其他關聯告警 — 更新狀態，風險負責人按單一指標處理（${session.trigger_monitor}）`
  );
  session.outcome = "SINGLE_WINDOW_TIMEOUT";
  sessions[idx] = session;
  saveSessions(sessions, db);
  writeAudit(input.actor || { id: null, name: "system" }, "INDICATOR_AGG_TIMEOUT", "indicator_aggregation", session.session_id, {
    outcome: session.outcome,
  });
  return session;
}

/**
 * Risk Owner / human force-aggregates L2 while not all L1 members have fired.
 * Remaining members are recorded as missing_l1_at_force; post_flow continues the spine.
 */
export function forceAggregateIncomplete(input: {
  session_id: string;
  reason?: string;
  actor?: { id?: number | null; name: string };
  db?: Database.Database;
}): AggregationSession {
  const db = input.db || getDb();
  const sessions = loadSessions(db);
  const idx = sessions.findIndex((s) => s.session_id === input.session_id);
  if (idx < 0) throw new Error("Aggregation session not found");
  const session = sessions[idx];
  if (session.outcome !== "PENDING" || session.step !== "CORRELATED_WAIT") {
    throw new Error(`Force-aggregate only while waiting (got ${session.step}/${session.outcome})`);
  }
  if (!session.aggregate_code) {
    throw new Error("Session has no L2 aggregate definition");
  }
  const seen = new Set(
    [session.trigger_monitor, ...session.related_seen].map((m) => m.toUpperCase())
  );
  const missing = session.member_monitors.filter((m) => !seen.has(m.toUpperCase()));
  if (missing.length === 0) {
    throw new Error("All L1 members already present — use natural aggregate path");
  }
  const reason = String(input.reason || "RO approved incomplete L1 set").trim();
  session.force_aggregated = true;
  session.missing_l1_at_force = missing;
  pushEvent(
    session,
    "AGGREGATE_READY",
    `Human force-aggregate L2 ${session.aggregate_code}: L1 incomplete (missing ${missing.join(", ")}). Reason: ${reason}`,
    `人工強制聚合 L2 ${session.aggregate_code}：L1 未齊（缺 ${missing.join("、")}）。理由：${reason}`
  );
  pushEvent(
    session,
    "RO_AGGREGATE",
    `L2 pack ready for RO after force-approve (L1 fired: ${[session.trigger_monitor, ...session.related_seen].join(", ")})`,
    `強制核准後 L2 包就緒供 RO（已到 L1：${[session.trigger_monitor, ...session.related_seen].join("、")}）`
  );
  session.outcome = "FORCE_AGGREGATED";
  session.post_flow = POST_L2_FLOW_STAGES.map((s) => s.id);
  sessions[idx] = session;
  saveSessions(sessions, db);
  writeAudit(
    input.actor || { id: null, name: "system" },
    "INDICATOR_AGG_FORCE",
    "indicator_aggregation",
    session.session_id,
    { missing, reason, outcome: session.outcome, post_flow: session.post_flow }
  );
  return session;
}

/** Mark post-L2 spine stages as continuing (demo / audit). Idempotent. */
export function continuePostL2Flow(input: {
  session_id: string;
  actor?: { id?: number | null; name: string };
  db?: Database.Database;
}): AggregationSession {
  const db = input.db || getDb();
  const sessions = loadSessions(db);
  const idx = sessions.findIndex((s) => s.session_id === input.session_id);
  if (idx < 0) throw new Error("Aggregation session not found");
  const session = sessions[idx];
  if (session.outcome !== "AGGREGATED" && session.outcome !== "FORCE_AGGREGATED") {
    throw new Error("Post-L2 flow only after L2 aggregate is ready");
  }
  session.post_flow = POST_L2_FLOW_STAGES.map((s) => s.id);
  const stages = POST_L2_FLOW_STAGES.map((s) => s.id).join(" → ");
  pushEvent(
    session,
    "RO_AGGREGATE",
    `Continue after L2: ${stages}`,
    `L2 之後繼續：${POST_L2_FLOW_STAGES.map((s) => s.zh).join(" → ")}`
  );
  sessions[idx] = session;
  saveSessions(sessions, db);
  writeAudit(
    input.actor || { id: null, name: "system" },
    "INDICATOR_AGG_POST_FLOW",
    "indicator_aggregation",
    session.session_id,
    { post_flow: session.post_flow }
  );
  return session;
}

export function listAggregationSessions(db: Database.Database = getDb()): AggregationSession[] {
  return loadSessions(db);
}

export function getAggregationBoardPack(db: Database.Database = getDb()): AggregationBoardPack {
  seedAggregationDemosIfEmpty(db);
  return {
    definitions: listAggregateDefinitions(db),
    sessions: listAggregationSessions(db),
    linear_steps: LINEAR_AGGREGATION_STEPS,
  };
}

/** Seed three demo paths: no-membership single, wait→timeout single, wait→aggregate. */
export function seedAggregationDemosIfEmpty(db: Database.Database = getDb()) {
  ensureAggregationSchema(db);
  const existing = loadSessions(db);
  if (existing.length > 0) return existing;

  const defs = listAggregateDefinitions(db);
  const chain = defs.find((d) => d.member_monitors.length >= 2) || defs[0];
  const orphanMonitor = "M2-ORPHAN-999";

  // Path A: not in any aggregate
  const a = startAggregationSession({
    trigger_monitor: orphanMonitor,
    trigger_severity: "WARN",
    actor: { id: null, name: "seed" },
    db,
  });

  // Path B: in aggregate, window times out
  const b = startAggregationSession({
    trigger_monitor: chain?.member_monitors[0] || "M2-COPY-009",
    trigger_severity: "BREACH",
    actor: { id: null, name: "seed" },
    db,
  });
  if (b.step === "CORRELATED_WAIT") {
    closeWaitWindowAsSingle({ session_id: b.session_id, actor: { id: null, name: "seed" }, db });
  }

  // Path C: in aggregate, related fires → RO aggregate
  const c = startAggregationSession({
    trigger_monitor: chain?.member_monitors[0] || "M2-COPY-009",
    trigger_severity: "BREACH",
    actor: { id: null, name: "seed" },
    db,
  });
  const related =
    chain?.member_monitors.find((m) => m !== c.trigger_monitor) || chain?.member_monitors[1];
  if (c.step === "CORRELATED_WAIT" && related) {
    injectRelatedAlert({
      session_id: c.session_id,
      related_monitor: related,
      severity: "BREACH",
      actor: { id: null, name: "seed" },
      db,
    });
  }

  // Keep newest first; label seed order in memory by reloading
  void a;
  return loadSessions(db);
}
