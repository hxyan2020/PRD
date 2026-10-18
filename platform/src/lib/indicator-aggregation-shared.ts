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
  /** Fired L1 monitor → ops severity (CRITICAL|BREACH|WARN|INFO). */
  l1_severities?: Record<string, string>;
  /** Final L2 ops severity after max(L1) + severity weight. */
  l2_severity?: string | null;
  /** Explainable L2 severity calculation pack for UI. */
  l2_severity_calc?: L2SeverityCalc | null;
  events: AggregationEvent[];
  created_at: string;
  updated_at: string;
};

/** Ops severity rank — higher = more severe. */
export const OPS_SEVERITY_RANK: Record<string, number> = {
  CRITICAL: 3,
  BREACH: 2,
  WARN: 1,
  INFO: 0,
  HEALTHY: 0,
};

export const OPS_SEVERITY_FROM_RANK: Record<number, string> = {
  3: "CRITICAL",
  2: "BREACH",
  1: "WARN",
  0: "INFO",
};

export type L2SeverityCalc = {
  /** max(L1) ops severity — hard floor */
  base: string;
  base_rank: number;
  /** Escalation severity coefficient (weight) */
  severity_weight: number;
  /** Count of fired L1 members used in the calc */
  member_count: number;
  /** Each fired L1 contribution */
  l1: Array<{ monitor_id: string; severity: string; rank: number }>;
  /** Weighted score before band mapping */
  weighted_score: number;
  /** True when weight / multi-L1 pushed a band above the floor */
  upgraded: boolean;
  /** Final L2 ops severity (≥ base) */
  final: string;
  final_rank: number;
  formula_en: string;
  formula_zh: string;
  steps_en: string[];
  steps_zh: string[];
};

/**
 * L2 severity = max(fired L1) as floor, then × severity weight (+ multi-L1 nudge)
 * so the pack is never softer than its worst L1 and can upgrade when weight demands it.
 */
export function computeL2Severity(input: {
  l1_severities: Record<string, string>;
  severity_weight?: number;
}): L2SeverityCalc {
  const weight = Number.isFinite(Number(input.severity_weight))
    ? Math.max(0.5, Number(input.severity_weight))
    : 1.0;
  const l1 = Object.entries(input.l1_severities || {})
    .map(([monitor_id, severity]) => {
      const sev = String(severity || "WARN").toUpperCase();
      const rank = OPS_SEVERITY_RANK[sev] ?? 1;
      return { monitor_id, severity: sev, rank };
    })
    .sort((a, b) => b.rank - a.rank);
  const member_count = l1.length;
  const base_rank = l1.reduce((m, x) => Math.max(m, x.rank), 0);
  const base = OPS_SEVERITY_FROM_RANK[base_rank] || "WARN";
  // Multi-L1 at/near the max adds pressure; weight scales both floor and nudge.
  const multiNudge = Math.max(0, member_count - 1) * 0.4;
  const weighted_score = base_rank * weight + multiNudge * weight;
  // Upgrade at most one band when weight pushes past the next integer threshold.
  let final_rank = base_rank;
  if (weighted_score >= base_rank + 0.85 && base_rank < 3) {
    final_rank = Math.min(3, base_rank + 1);
  }
  // Never below max(L1)
  final_rank = Math.max(final_rank, base_rank);
  const final = OPS_SEVERITY_FROM_RANK[final_rank] || base;
  const upgraded = final_rank > base_rank;
  const l1List = l1.map((x) => `${x.monitor_id}=${x.severity}`).join(", ");
  const steps_en = [
    `Collect fired L1 severities: ${l1List || "(none)"}`,
    `Base = max(L1) → ${base} (rank ${base_rank})`,
    `Apply severity weight ${weight.toFixed(2)} and multi-L1 nudge (${member_count} members) → score ${weighted_score.toFixed(2)}`,
    upgraded
      ? `Weight justifies upgrade → L2 = ${final} (still ≥ max L1)`
      : `No upgrade — L2 = ${final} (= max L1; sufficient severity held)`,
  ];
  const steps_zh = [
    `收集已觸發 L1 嚴重度：${l1List || "（無）"}`,
    `底線 = max(L1) → ${base}（等級 ${base_rank}）`,
    `套用嚴重度權重 ${weight.toFixed(2)} 與多 L1 推力（${member_count} 個成員）→ 分數 ${weighted_score.toFixed(2)}`,
    upgraded
      ? `權重足以升一檔 → L2 = ${final}（仍 ≥ max L1）`
      : `不升級 — L2 = ${final}（= max L1；已保有足夠嚴重度）`,
  ];
  return {
    base,
    base_rank,
    severity_weight: weight,
    member_count,
    l1,
    weighted_score: Number(weighted_score.toFixed(3)),
    upgraded,
    final,
    final_rank,
    formula_en: `L2 = max(L1)=${base}; score=${base_rank}×${weight.toFixed(2)}+nudge → ${final}`,
    formula_zh: `L2 = max(L1)=${base}；分數=${base_rank}×${weight.toFixed(2)}＋推力 → ${final}`,
    steps_en,
    steps_zh,
  };
}

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
  { id: "L2_SEVERITY", en: "L2 severity = max(L1) × weight", zh: "L2 嚴重度 = max(L1) × 權重" },
  { id: "AI_RCA", en: "AI RCA on L2 pack", zh: "對 L2 包做 AI 根因" },
  { id: "MESSENGER", en: "Lark / Messenger card", zh: "Lark／Messenger 卡片" },
  { id: "HUMAN_GATE", en: "Human gate (maker/checker)", zh: "人工關卡（Maker／Checker）" },
  { id: "CONTROL", en: "Control suggestion (mock)", zh: "控制建議（模擬）" },
];
