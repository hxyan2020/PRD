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
  | "AGGREGATED"
  /** RO / human forced L2 while not all L1 members had fired. */
  | "FORCE_AGGREGATED";

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
  /** True when RO forced L2 before every L1 member arrived. */
  force_aggregated?: boolean;
  /** Missing L1 monitors at force time (empty when natural aggregate). */
  missing_l1_at_force?: string[];
  /** Subsequent spine-style stages after L2 is ready (demo / audit trail). */
  post_flow?: string[];
  events: AggregationEvent[];
  created_at: string;
  updated_at: string;
};

export const LINEAR_AGGREGATION_STEPS: Array<{ id: AggregationStepId; en: string; zh: string }> = [
  { id: "SINGLE_ALERT", en: "1. L1 single-indicator alert", zh: "1. L1 單點指標告警" },
  { id: "SKILL_RAG_LOOKUP", en: "2. Skill / RAG lookup", zh: "2. Skill／RAG 檢索" },
  { id: "AGGREGATE_CHECK", en: "3. L2 aggregate membership?", zh: "3. 是否屬 L2 聚合指標？" },
  { id: "SINGLE_CONTINUE", en: "4a. Continue as L1 single", zh: "4a. 按 L1 單一指標繼續" },
  { id: "CORRELATED_WAIT", en: "4b. Mark correlation + wait window", zh: "4b. 標記關聯並等待時間視窗" },
  { id: "RO_SINGLE", en: "5a. RO handles as L1 single", zh: "5a. RO 按 L1 單一指標處理" },
  { id: "AGGREGATE_READY", en: "5b. L2 aggregate ready in UI", zh: "5b. 界面內就緒 L2 聚合" },
  { id: "RO_AGGREGATE", en: "6. RO handles as L2 aggregate", zh: "6. RO 按 L2 聚合指標處理" },
];

/** Homepage / board labels for L1 vs L2. */
export const L1_L2_LABELS = {
  l1_en: "L1 single-point indicator",
  l1_zh: "L1 單點指標",
  l2_en: "L2 aggregate indicator",
  l2_zh: "L2 聚合指標",
  force_en: "Force-aggregate L2 (RO approve while L1 incomplete)",
  force_zh: "強制聚合 L2（L1 未齊時 RO 核准）",
  wait_en: "Wait window for correlated L1 alerts",
  wait_zh: "等待關聯 L1 告警的時間視窗",
  continue_en: "Continue post-L2 flow (RCA → messenger → human gate)",
  continue_zh: "繼續 L2 之後流程（RCA → Messenger → 人工關卡）",
} as const;

export const POST_L2_FLOW_STAGES: Array<{ id: string; en: string; zh: string }> = [
  { id: "AI_RCA", en: "AI RCA on L2 pack", zh: "對 L2 包做 AI 根因" },
  { id: "MESSENGER", en: "Lark / Messenger card", zh: "Lark／Messenger 卡片" },
  { id: "HUMAN_GATE", en: "Human gate (maker/checker)", zh: "人工關卡（Maker／Checker）" },
  { id: "CONTROL", en: "Control suggestion (mock)", zh: "控制建議（模擬）" },
];
