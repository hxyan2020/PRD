export type CorrectionAction = {
  action: string;
  bu: "RISK_CONTROL" | "OPERATIONS" | "AI" | "SYSTEM" | "EXEC";
  description: string;
  requires_human?: boolean;
};

export type EscalationHop = {
  after_minutes: number;
  team: string;
  channel: string;
  action: string;
};

export type PastCase = {
  case_id: string;
  date: string;
  alert_id?: string;
  analysis_href?: string;
  outcome: string;
  summary: string;
};

export type IndicatorSpec = {
  monitor_id: string;
  name: string;
  product: "CFD" | "Crypto" | "CFD+Crypto";
  domain: string;
  warn: number;
  breach: number;
  unit: string;
  comparator: "gte" | "lte";
  why: string;
};

export type SkillScenario = {
  code: string;
  name: string;
  description: string;
  indicator: IndicatorSpec;
  /** Additional related monitors that often co-move */
  related_indicators: string[];
  conditions: {
    severity_in?: string[];
    min_observed?: number;
    max_observed?: number;
  };
  fault_areas: string[];
  escalation: {
    sla_minutes: number;
    path: EscalationHop[];
  };
  corrections: CorrectionAction[];
  past_cases: PastCase[];
  steps: Array<{
    action: string;
    description: string;
    params?: Record<string, unknown>;
    requires_human?: boolean;
    bu?: string;
  }>;
  owner_department: string;
  auto_execute?: boolean;
};

export type TimelineEvent = {
  t_minutes: number;
  monitor_id: string;
  severity: "WARN" | "BREACH" | "CRITICAL";
  signal: string;
};

export type LinkedScenario = {
  code: string;
  name: string;
  description: string;
  product: "CFD" | "Crypto" | "CFD+Crypto";
  domain: string;
  sequence: TimelineEvent[];
  causes: string[];
  escalation_plan: EscalationHop[];
  corrections: CorrectionAction[];
  linked_skills: string[];
  past_cases: PastCase[];
  severity: "WARN" | "BREACH" | "CRITICAL";
};
