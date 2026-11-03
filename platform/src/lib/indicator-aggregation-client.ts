/**
 * Client-safe indicator aggregation mutations (no DB / Node).
 * Used on GitHub Pages where /api/indicator-aggregation is unavailable.
 */
import {
  POST_L2_FLOW_STAGES,
  computeL2Severity,
  type AggregateDefinition,
  type AggregationSession,
  type AggregationStepId,
} from "@/lib/indicator-aggregation-shared";

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function pushEvent(session: AggregationSession, step: AggregationStepId, en: string, zh: string) {
  session.events.push({ at: nowIso(), step, en, zh });
  session.step = step;
  session.updated_at = nowIso();
}

function severityWeightFromOps(ops?: string | null): number {
  const s = String(ops || "BREACH").toUpperCase();
  if (s === "CRITICAL") return 1.35;
  if (s === "BREACH") return 1.2;
  if (s === "WARN") return 1.05;
  return 1.0;
}

function applyL2Severity(session: AggregationSession, def: AggregateDefinition | null) {
  const l1 = { ...(session.l1_severities || {}) };
  if (!l1[session.trigger_monitor] && session.trigger_severity) {
    l1[session.trigger_monitor] = session.trigger_severity;
  }
  session.l1_severities = l1;
  const weight = severityWeightFromOps(def?.severity || session.trigger_severity);
  const calc = computeL2Severity({ l1_severities: l1, severity_weight: weight });
  session.l2_severity = calc.final;
  session.l2_severity_calc = calc;
  pushEvent(
    session,
    "RO_AGGREGATE",
    `L2 severity: ${calc.formula_en}`,
    `L2 嚴重度：${calc.formula_zh}`
  );
}

function findAggregatesForMonitor(monitorId: string, defs: AggregateDefinition[]) {
  const id = String(monitorId || "").toUpperCase();
  return defs.filter((d) => d.member_monitors.some((m) => m.toUpperCase() === id));
}

function skillForMonitor(monitorId: string, def: AggregateDefinition | null): string | null {
  if (def?.linked_skills?.length) return def.linked_skills[0];
  return null;
}

function ragHint(monitorId: string, inAggregate: boolean): string | null {
  if (inAggregate) return `RAG: correlated monitors for ${monitorId} (chain membership)`;
  return `RAG: standalone playbook for ${monitorId}`;
}

function cloneSessions(sessions: AggregationSession[]): AggregationSession[] {
  return sessions.map((s) => ({
    ...s,
    member_monitors: [...s.member_monitors],
    related_seen: [...s.related_seen],
    events: s.events.map((e) => ({ ...e })),
    post_flow: s.post_flow ? [...s.post_flow] : [],
    missing_l1_at_force: s.missing_l1_at_force ? [...s.missing_l1_at_force] : [],
    l1_severities: s.l1_severities ? { ...s.l1_severities } : {},
    l2_severity_calc: s.l2_severity_calc ? { ...s.l2_severity_calc } : null,
  }));
}

export type ClientAggResult = {
  session: AggregationSession;
  sessions: AggregationSession[];
  message: string;
  message_zh: string;
};

export function clientStartAggregation(
  sessions: AggregationSession[],
  definitions: AggregateDefinition[],
  input: { trigger_monitor?: string; trigger_severity?: string }
): ClientAggResult {
  const monitor = String(input.trigger_monitor || "M2-COPY-009").toUpperCase();
  const severity = String(input.trigger_severity || "BREACH").toUpperCase();
  const matches = findAggregatesForMonitor(monitor, definitions);
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
    l1_severities: { [monitor]: severity },
    l2_severity: null,
    l2_severity_calc: null,
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
      `Correlation flagged. Wait ${primary.window_minutes}m for related monitors: ${
        primary.member_monitors.filter((m) => m !== monitor).join(", ") || "(none)"
      }`,
      `已標記可能關聯。開啟 ${primary.window_minutes} 分鐘視窗等待關聯指標：${
        primary.member_monitors.filter((m) => m !== monitor).join("、") || "（無）"
      }`
    );
    pushEvent(
      session,
      "CORRELATED_WAIT",
      "Single-indicator RCA continues in parallel while the wait window is open",
      "等待視窗開啟期間，單一指標 RCA 流程並行繼續"
    );
  }

  const next = [session, ...cloneSessions(sessions)].slice(0, 40);
  return {
    session,
    sessions: next,
    message: "Aggregation session started (local demo)",
    message_zh: "已開始聚合工作階段（本機示範）",
  };
}

export function clientInjectRelated(
  sessions: AggregationSession[],
  definitions: AggregateDefinition[],
  input: { session_id: string; related_monitor: string; severity?: string }
): ClientAggResult {
  const next = cloneSessions(sessions);
  const idx = next.findIndex((s) => s.session_id === input.session_id);
  if (idx < 0) throw new Error("Aggregation session not found");
  const session = next[idx];
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
  const relatedSev = String(input.severity || "BREACH").toUpperCase();
  session.l1_severities = {
    ...(session.l1_severities || { [session.trigger_monitor]: session.trigger_severity }),
    [related]: relatedSev,
  };

  pushEvent(
    session,
    "AGGREGATE_READY",
    `Related alert ${related} (${relatedSev}) inside window — aggregating in UI`,
    `視窗內出現關聯告警 ${related}（${relatedSev}）— 界面內聚合`
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
  const def = definitions.find((d) => d.code === session.aggregate_code) || null;
  applyL2Severity(session, def);
  next[idx] = session;
  return {
    session,
    sessions: next,
    message: "Related alert aggregated — ready for RO as aggregate",
    message_zh: "已匯入關聯告警並聚合 — 可供 RO 按聚合指標處理",
  };
}

export function clientCloseWindow(
  sessions: AggregationSession[],
  input: { session_id: string }
): ClientAggResult {
  const next = cloneSessions(sessions);
  const idx = next.findIndex((s) => s.session_id === input.session_id);
  if (idx < 0) throw new Error("Aggregation session not found");
  const session = next[idx];
  if (session.outcome !== "PENDING") {
    throw new Error(`Session already closed (${session.outcome})`);
  }
  pushEvent(
    session,
    "RO_SINGLE",
    `Wait window ended with no related alerts — update status for RO as single indicator (${session.trigger_monitor})`,
    `等待視窗結束且無其他關聯告警 — 更新狀態，風險負責人按單一指標處理（${session.trigger_monitor}）`
  );
  session.outcome = "SINGLE_WINDOW_TIMEOUT";
  next[idx] = session;
  return {
    session,
    sessions: next,
    message: "Wait window closed — RO handles as single indicator",
    message_zh: "等待視窗已結束 — RO 按單一指標處理",
  };
}

export function clientForceAggregate(
  sessions: AggregationSession[],
  definitions: AggregateDefinition[],
  input: { session_id: string; reason?: string }
): ClientAggResult {
  const next = cloneSessions(sessions);
  const idx = next.findIndex((s) => s.session_id === input.session_id);
  if (idx < 0) throw new Error("Aggregation session not found");
  const session = next[idx];
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
  session.l1_severities = {
    ...(session.l1_severities || { [session.trigger_monitor]: session.trigger_severity }),
  };
  const def = definitions.find((d) => d.code === session.aggregate_code) || null;
  applyL2Severity(session, def);
  next[idx] = session;
  return {
    session,
    sessions: next,
    message: "RO force-aggregated L2 while L1 incomplete — post-flow unlocked",
    message_zh: "RO 已在 L1 未齊時強制聚合 L2 — 後續流程已解鎖",
  };
}

export function clientContinuePostFlow(
  sessions: AggregationSession[],
  input: { session_id: string }
): ClientAggResult {
  const next = cloneSessions(sessions);
  const idx = next.findIndex((s) => s.session_id === input.session_id);
  if (idx < 0) throw new Error("Aggregation session not found");
  const session = next[idx];
  if (session.outcome !== "AGGREGATED" && session.outcome !== "FORCE_AGGREGATED") {
    throw new Error("Post-L2 flow only after L2 aggregate is ready");
  }
  session.post_flow = POST_L2_FLOW_STAGES.map((s) => s.id);
  pushEvent(
    session,
    "RO_AGGREGATE",
    `Continue after L2: ${POST_L2_FLOW_STAGES.map((s) => s.id).join(" → ")}`,
    `L2 之後繼續：${POST_L2_FLOW_STAGES.map((s) => s.zh).join(" → ")}`
  );
  next[idx] = session;
  return {
    session,
    sessions: next,
    message: "Post-L2 flow continued (RCA → messenger → human gate)",
    message_zh: "已繼續 L2 之後流程（RCA → Messenger → 人工關卡）",
  };
}

export function runClientAggregationAction(
  action: string,
  sessions: AggregationSession[],
  definitions: AggregateDefinition[],
  body: Record<string, unknown>
): ClientAggResult {
  if (action === "start") {
    return clientStartAggregation(sessions, definitions, {
      trigger_monitor: String(body.trigger_monitor || ""),
      trigger_severity: String(body.trigger_severity || "BREACH"),
    });
  }
  if (action === "inject_related") {
    return clientInjectRelated(sessions, definitions, {
      session_id: String(body.session_id || ""),
      related_monitor: String(body.related_monitor || ""),
      severity: body.severity ? String(body.severity) : undefined,
    });
  }
  if (action === "close_window") {
    return clientCloseWindow(sessions, { session_id: String(body.session_id || "") });
  }
  if (action === "force_aggregate") {
    return clientForceAggregate(sessions, definitions, {
      session_id: String(body.session_id || ""),
      reason: body.reason ? String(body.reason) : undefined,
    });
  }
  if (action === "continue_post_flow") {
    return clientContinuePostFlow(sessions, { session_id: String(body.session_id || "") });
  }
  throw new Error("Unknown action");
}
