/** Curated demo rows for Human Intervention — used when DB queue is empty (e.g. static export). */

export type InterventionSample = {
  id: number;
  action_code: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requested_at: string;
  decided_at: string | null;
  decision_note: string | null;
  analysis_code: string;
  indicator_monitor_id: string;
  mode: string;
  summary: string;
  skill_detail: string;
  step_index: number;
  decided_by_name: string | null;
  decided_by_email: string | null;
  alert_title: string;
  alert_severity: string;
  product_hint: string;
  analysis_id: number;
  alert_id: string;
  ticket_id: string;
};

export const INTERVENTION_DEMO_SAMPLES: InterventionSample[] = [
  {
    id: 9001,
    action_code: "flag_for_human_review",
    status: "PENDING",
    requested_at: "2026-10-05 08:12:00",
    decided_at: null,
    decision_note: null,
    analysis_code: "AIA-SAMPLE-MRG",
    indicator_monitor_id: "M2-MRG-014",
    mode: "SKILL_MATCH",
    summary: "Margin utilisation spike — Risk Owner must accept RCA before live controls.",
    skill_detail: JSON.stringify({
      description: "Approve or reject leverage / close-only controls after margin cascade RCA.",
      params: { accounts: 128, threshold: "90%" },
      mock: true,
    }),
    step_index: 1,
    decided_by_name: null,
    decided_by_email: null,
    alert_title: "Accounts >90% Margin Utilisation",
    alert_severity: "BREACH",
    product_hint: "CFD",
    analysis_id: 9001,
    alert_id: "ALT-SAMPLE-1001",
    ticket_id: "TKT-SAMPLE-1001",
  },
  {
    id: 9002,
    action_code: "pause_new_copies",
    status: "PENDING",
    requested_at: "2026-10-05 09:05:00",
    decided_at: null,
    decision_note: null,
    analysis_code: "AIA-SAMPLE-COPY",
    indicator_monitor_id: "M2-COPY-009",
    mode: "SKILL_MATCH",
    summary: "Copy concentration BREACH — pause new copiers pending Risk Owner gate.",
    skill_detail: JSON.stringify({
      description: "Pause new copy joins on the top signal provider until concentration falls below warn.",
      params: { provider_share: "33%" },
      mock: true,
    }),
    step_index: 2,
    decided_by_name: null,
    decided_by_email: null,
    alert_title: "Copy provider concentration breach",
    alert_severity: "CRITICAL",
    product_hint: "CFD",
    analysis_id: 9002,
    alert_id: "ALT-SAMPLE-1002",
    ticket_id: "TKT-SAMPLE-1002",
  },
  {
    id: 9003,
    action_code: "suggest_leverage_cut",
    status: "APPROVED",
    requested_at: "2026-10-04 14:20:00",
    decided_at: "2026-10-04 14:48:00",
    decision_note: "Approved after confirming LP reject rate was healthy; cut max leverage on stressed cohort.",
    analysis_code: "AIA-SAMPLE-LEV",
    indicator_monitor_id: "M2-MRG-014",
    mode: "SKILL_MATCH",
    summary: "Leverage cut executed after human approval.",
    skill_detail: JSON.stringify({
      description: "Cut max leverage for accounts above 90% utilisation on XAUUSD / majors.",
      mock: true,
    }),
    step_index: 2,
    decided_by_name: "Alex Chen",
    decided_by_email: "risk.owner@vantagemarkets.com",
    alert_title: "Margin utilisation spike",
    alert_severity: "BREACH",
    product_hint: "CFD",
    analysis_id: 9003,
    alert_id: "ALT-SAMPLE-1003",
    ticket_id: "TKT-SAMPLE-1003",
  },
  {
    id: 9004,
    action_code: "suggest_symbol_halt",
    status: "REJECTED",
    requested_at: "2026-10-03 16:10:00",
    decided_at: "2026-10-03 16:35:00",
    decision_note: "Rejected — stale quote print on M2-FEED-003, not book risk. Keep symbol open.",
    analysis_code: "AIA-SAMPLE-FEED",
    indicator_monitor_id: "M2-FEED-003",
    mode: "RAG_REASONING",
    summary: "Symbol halt rejected after feed-quality check.",
    skill_detail: JSON.stringify({
      description: "Halt new exposure on symbol until feed integrity restored.",
      mock: true,
    }),
    step_index: 1,
    decided_by_name: "Jordan Lee",
    decided_by_email: "risk.analyst@vantagemarkets.com",
    alert_title: "Stale / crossed quotes",
    alert_severity: "WARN",
    product_hint: "CFD",
    analysis_id: 9004,
    alert_id: "ALT-SAMPLE-1004",
    ticket_id: "TKT-SAMPLE-1004",
  },
  {
    id: 9005,
    action_code: "disable_lp_route",
    status: "APPROVED",
    requested_at: "2026-10-02 11:00:00",
    decided_at: "2026-10-02 11:22:00",
    decision_note: "Approved temporary LP disable after oneZero reject spike; System on-call notified.",
    analysis_code: "AIA-SAMPLE-LP",
    indicator_monitor_id: "M2-LP-022",
    mode: "SKILL_MATCH",
    summary: "LP route disabled after dual-control approval.",
    skill_detail: JSON.stringify({
      description: "Disable stressed LP route and fail over hedge capacity.",
      mock: true,
    }),
    step_index: 3,
    decided_by_name: "Alex Chen",
    decided_by_email: "risk.owner@vantagemarkets.com",
    alert_title: "LP reject rate breach",
    alert_severity: "CRITICAL",
    product_hint: "CFD",
    analysis_id: 9005,
    alert_id: "ALT-SAMPLE-1005",
    ticket_id: "TKT-SAMPLE-1005",
  },
];
