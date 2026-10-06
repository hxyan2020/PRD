/** Client-safe CS/TR analytics types and constants (no SQLite). */

export const CS_AUDIT_ACTIONS = [
  "CS_INTAKE",
  "CS_INTAKE_CONTINUE",
  "CS_FOLLOWUP_EMAIL",
  "CS_CLIENT_REPLY",
  "CS_AGENT_REPLY",
  "CS_ASSIGN_TR",
  "CS_ESCALATE_RISK",
  "CS_AI_ANALYZE",
  "CS_AI_REPLY",
  "CS_POC_REVIEW",
  "CS_POC_RELEASE",
  "CS_RESOLVE",
] as const;

export type CsAuditAction = (typeof CS_AUDIT_ACTIONS)[number];

export type CsCountBucket = { key: string; count: number };

export type CsDashRow = {
  id: number;
  request_id: string;
  channel: string;
  desk: string;
  status: string;
  skill_code: string | null;
  ai_clarity: string;
  followup_count: number;
  waiting: boolean;
  subject: string;
  client_name: string;
  updated_at: string;
};

export type CsDashboard = {
  generated_at: string;
  summary: {
    total: number;
    open: number;
    resolved: number;
    waiting: number;
    awaiting_client: number;
    id_verify: number;
    assigned_tr: number;
    escalated_risk: number;
    poc_review: number;
    ai_replied: number;
    cap3: number;
    cs_desk: number;
    tr_desk: number;
  };
  by_channel: CsCountBucket[];
  by_status: CsCountBucket[];
  by_skill: CsCountBucket[];
  by_desk: CsCountBucket[];
  by_clarity: CsCountBucket[];
  by_severity: CsCountBucket[];
  waiting: CsDashRow[];
  recent: CsDashRow[];
};

export type CsLogEvent = {
  id: number;
  at: string;
  action: string;
  actor: string;
  request_id: string;
  details: Record<string, unknown>;
};

export type CsResolvedPack = {
  id: number;
  request_id: string;
  subject: string;
  desk: string;
  channel: string;
  skill_code: string | null;
  status: string;
  resolved_at: string;
  followup_count: number;
  client_name: string;
};

export type CsLog = {
  generated_at: string;
  events: CsLogEvent[];
  resolved: CsResolvedPack[];
};
