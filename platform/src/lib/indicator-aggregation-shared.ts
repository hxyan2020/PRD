/** Client-safe indicator aggregation types + labels (no DB / Node imports). */

export type AggregationStepId =
  | "SINGLE_ALERT"
  | "SKILL_RAG_LOOKUP"
  | "AGGREGATE_CHECK"
  | "SINGLE_CONTINUE"
  | "CORRELATED_WAIT"
  | "RO_SINGLE"
  | "AGGREGATE_READY"
  | "RO_AGGREGATE";

export type AggregationOutcome =
  | "PENDING"
  | "SINGLE_NO_MEMBERSHIP"
  | "SINGLE_WINDOW_TIMEOUT"
  | "AGGREGATED";

export type AggregateTimelineEvent = {
  t_minutes: number;
  monitor_id: string;
  severity: string;
  signal: string;
};

export type AggregateDefinition = {
  code: string;
  name: string;
  name_zh: string;
  description: string;
  description_zh: string;
  domain: string;
  product: string;
  severity: string;
  member_monitors: string[];
  window_minutes: number;
  linked_skills: string[];
  sequence: AggregateTimelineEvent[];
};

export type AggregationEvent = {
  at: string;
  step: AggregationStepId;
  en: string;
  zh: string;
};

export type AggregationSession = {
  session_id: string;
  trigger_monitor: string;
  trigger_severity: string;
  trigger_alert_id: string;
  skill_hit: string | null;
  rag_hit: string | null;
  aggregate_code: string | null;
  aggregate_name: string | null;
  member_monitors: string[];
  related_seen: string[];
  window_minutes: number;
  window_opened_at: string | null;
  window_closes_at: string | null;
  step: AggregationStepId;
  outcome: AggregationOutcome;
  correlation_marked: boolean;
  events: AggregationEvent[];
  created_at: string;
  updated_at: string;
};

export const LINEAR_AGGREGATION_STEPS: Array<{ id: AggregationStepId; en: string; zh: string }> = [
  { id: "SINGLE_ALERT", en: "1. Single indicator alert", zh: "1. 單一指標告警" },
  { id: "SKILL_RAG_LOOKUP", en: "2. Skill / RAG lookup", zh: "2. Skill／RAG 檢索" },
  { id: "AGGREGATE_CHECK", en: "3. Aggregate membership?", zh: "3. 是否屬聚合指標？" },
  { id: "SINGLE_CONTINUE", en: "4a. Continue as single", zh: "4a. 按單一指標繼續" },
  { id: "CORRELATED_WAIT", en: "4b. Mark correlation + wait", zh: "4b. 標記關聯並等待" },
  { id: "RO_SINGLE", en: "5a. RO handles as single", zh: "5a. RO 按單一指標處理" },
  { id: "AGGREGATE_READY", en: "5b. Aggregate in UI", zh: "5b. 界面內聚合" },
  { id: "RO_AGGREGATE", en: "6. RO handles as aggregate", zh: "6. RO 按聚合指標處理" },
];
