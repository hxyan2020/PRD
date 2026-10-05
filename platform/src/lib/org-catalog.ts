/** Source of truth for BU (department) and role responsibility charters. */

export type DepartmentCode = "RISK_CONTROL" | "OPERATIONS" | "AI" | "SYSTEM";

export type RoleCode =
  | "SUPER_ADMIN"
  | "RISK_OWNER"
  | "RISK_ANALYST"
  | "OPS_LEAD"
  | "OPS_ANALYST"
  | "AI_ENGINEER"
  | "SYSTEM_ADMIN"
  | "VIEWER";

export type DepartmentCharter = {
  code: DepartmentCode;
  name: string;
  mandate: string;
  owns: string[];
  accountable: string[];
  collaborates: string[];
  outOfScope: string[];
  escalatesTo: string[];
};

export type RoleCharter = {
  code: RoleCode;
  name: string;
  department: DepartmentCode | null;
  intro: string;
  owns: string[];
  does: string[];
  doesNot: string[];
  escalatesTo: string[];
};

export const DEPARTMENT_CHARTERS: Record<DepartmentCode, DepartmentCharter> = {
  RISK_CONTROL: {
    code: "RISK_CONTROL",
    name: "Risk Control",
    mandate:
      "Book owner for Vantage forex CFD (MT4/MT5 via oneZero) and the crypto-exchange stack. Sets limit policy, chairs war-rooms, and is the human gate for halt, close-only, leverage cut, LP disable and withdrawal pause. AI may recommend; this BU decides.",
    owns: [
      "Limit policy, entity-aware exposure caps, and the breach-authority matrix (CFD + crypto)",
      "Market, credit, liquidity and LP-hedge risk on the live CFD book (A-book / B-book)",
      "Crypto exchange: wallet-float policy, liquidation backlog, oracle lag, insurance-fund drawdown, OI concentration",
      "Human approval of halt / close-only / group leverage cut / LP disable / large-withdrawal pause",
      "Daily risk dashboard, risk-domain RACI, and residual-risk sign-off after incidents",
      "Copy-trade cascade, toxic-flow, NBP and concentration interventions",
      "Escalation routes into Risk Control Desk and Crypto Exchange Risk",
    ],
    accountable: [
      "War-room decisions on BREACH/CRITICAL until residual risk is accepted in writing",
      "Policy changes that alter client trading conditions (leverage, spreads, product groups, entity packs)",
      "Named owner on every risk domain tagged RISK_CONTROL",
      "Post-incident risk memo and lessons fed into RAG",
    ],
    collaborates: [
      "Operations — funding exceptions and withdrawal pauses that have credit, AML or fraud impact",
      "AI — detector promotion (Risk is checker), RCA challenge, skill-playbook certainty",
      "System — kill-switches, feed health, LP/bridge failover, wallet infrastructure",
      "Crypto Exchange Risk team — matching-engine, oracle and hot-wallet incidents",
    ],
    outOfScope: [
      "Day-to-day deposit/withdrawal case work and EOD recon (Operations)",
      "Training detectors or promoting shadow → live as maker (AI Engineer; Risk is checker)",
      "Patching trading servers, bridges or wallets (System)",
      "Changing platform feature flags that are not risk thresholds this BU owns",
    ],
    escalatesTo: [
      "SUPER_ADMIN / demo platform owner on multi-entity or capital-threshold events",
      "Legal/compliance (outside CRMP) when entity segregation or licence limits are at risk",
    ],
  },
  OPERATIONS: {
    code: "OPERATIONS",
    name: "Operations",
    mandate:
      "Runs the client-money and case spine: funding exceptions, EOD reconciliation, ticket triage, promo/bonus execution and client contact. Executes risk decisions; does not set limit policy or arm halt/leverage controls.",
    owns: [
      "Deposit and withdrawal exception queues, including crypto on-chain rails",
      "EOD reconciliations, Nostro/Vostro breaks, and bonus-wallet mismatches",
      "Ticket triage, client contact, and case notes that the spine can audit",
      "Promo / bonus ops execution and clawback after Risk or Fraud flags",
      "Operational runbooks for funding freezes that Risk has already approved",
      "Client-facing status on halted symbols or paused withdrawals (after a Risk decision)",
    ],
    accountable: [
      "Completeness of recon before the daily dashboard is published",
      "SLA on funding tickets that sit on escalation routes",
      "Accurate client communication that does not pre-empt a Risk decision",
    ],
    collaborates: [
      "Risk Control — when a withdrawal pause or credit freeze is proposed",
      "System — payment-rail, wallet-ops and banking-file incidents",
      "AI — fraud/bonus detectors that need case evidence",
      "Credit & Client Risk team — NBP clusters tied to funding delays",
    ],
    outOfScope: [
      "Setting leverage, halt, LP or wallet-float policy (Risk Control)",
      "Approving high-severity interventions (Risk Owner / dual control)",
      "Changing detectors, skills or the RAG corpus (AI)",
      "Admin privilege and audit-store configuration (System)",
    ],
    escalatesTo: [
      "OPS_LEAD → RISK_OWNER when a funding case becomes credit, fraud or market risk",
      "SYSTEM_ADMIN when payment rails or wallets are down",
    ],
  },
  AI: {
    code: "AI",
    name: "AI",
    mandate:
      "Builds and maintains the detection, RCA and evidence layer: detectors, skill playbooks, RAG, challenger packs and alert-quality monitoring. Recommends only — never executes halt, close-only, leverage cut, LP disable or withdrawal pause.",
    owns: [
      "Anomaly, toxic-flow, copy-cascade and crypto-liquidation detector catalogue",
      "AI RCA narratives with evidence links into RAG and the spine",
      "Alert quality, false-positive rate, and model-drift monitoring",
      "Shadow → live detector promotion as maker (Risk Owner is checker on live)",
      "Skill playbooks (SKILL.md), Knowledge Tree mapping, and RAG document hygiene",
      "Second-AI challenger configuration (in-repo heuristic today; independent vendor is RM-04)",
      "Human-only AI access blocklist recommendations (AI Access Security)",
    ],
    accountable: [
      "Explainability of every auto-triggered analysis on the spine",
      "Maker/checker dual control on AI Admin settings, training runs and skill edits",
      "That the AI service role never receives halt / close-only / secret permissions",
    ],
    collaborates: [
      "Risk Control — checker on live detector promotion and intervention recommendations",
      "Operations — case evidence that trains fraud/bonus skills",
      "System — data-source health that feeds detectors and RAG",
      "All BUs — when a skill certainty gate fails and RCA falls back to RAG",
    ],
    outOfScope: [
      "Final intervention authority (Risk / Ops / System per domain RACI)",
      "Changing production Monitor 2.0 upstream thresholds (owner BU + System)",
      "User directory, SSO and break-glass admin (System / Super Admin)",
      "Client contact or funding-ticket ownership (Operations)",
    ],
    escalatesTo: [
      "RISK_OWNER when a detector should go live or a recommendation needs a human gate",
      "AI Engineer on-call → SYSTEM_ADMIN on pipeline or source outages",
    ],
  },
  SYSTEM: {
    code: "SYSTEM",
    name: "System",
    mandate:
      "Owns control-plane plumbing: trading servers, oneZero bridges, LP endpoints, wallets, config change-control, kill-switches, data pipelines, evidence vault, admin privileges and the audit store. Executes switches Risk has armed; does not set book-risk policy.",
    owns: [
      "Trading server / oneZero bridge / LP endpoint health and failover",
      "Config change control, non-risk feature flags, and platform kill-switches",
      "Data pipelines into Monitor, detectors, RAG and the evidence vault",
      "Admin privileges, session store, and immutable audit logging",
      "Data-source registry (internal + external) and connector credentials",
      "Crypto wallet infrastructure (hot / warm / cold) — not float policy (Risk)",
    ],
    accountable: [
      "Availability of CRMP, Monitor sync, and messenger routes",
      "Segregation of duties between settings.manage and risk.intervene",
      "That every kill-switch execution is logged to spine + audit",
    ],
    collaborates: [
      "Risk Control — which kill-switches exist and who may arm them",
      "AI — source freshness and pipeline SLAs for detectors",
      "Operations — payment-rail and banking-file incidents",
      "SUPER_ADMIN — break-glass access and privilege reviews",
    ],
    outOfScope: [
      "Limit policy and book-risk decisions (Risk Control)",
      "Client case handling and recon ownership (Operations)",
      "Model training and RCA narrative quality (AI)",
      "Accepting residual market or credit risk after an incident",
    ],
    escalatesTo: [
      "SUPER_ADMIN on privilege, data-loss or multi-system outage",
      "RISK_OWNER when infrastructure failure creates market or wallet risk",
    ],
  },
};

export const ROLE_CHARTERS: Record<RoleCode, RoleCharter> = {
  SUPER_ADMIN: {
    code: "SUPER_ADMIN",
    name: "Super Admin",
    department: null,
    intro:
      "Cross-department platform administrator. Holds break-glass access to users, settings, detectors and AI Admin without a single-BU RACI constraint. Used for the demo platform owner and exceptional incidents — not for daily book risk.",
    owns: [
      "User and role assignment, including emergency privilege",
      "Platform-wide settings, feature flags and kill-switch configuration",
      "Break-glass override of maker/checker after an incident is declared",
      "Audit-log retention and the admin-access security blocklist",
    ],
    does: [
      "Create, disable and reassign users across departments",
      "Review any admin page; operate AI Admin when no departmental checker is available",
      "Reset demo data and documentation overlays in this prototype",
      "Authorise System to execute a platform-wide kill-switch",
    ],
    doesNot: [
      "Own the daily CFD or crypto risk book (that is the Risk Owner)",
      "Replace departmental decision rights on client-facing interventions unless escalated",
      "Act as the default maker on detector training or shadow runs (AI Engineer)",
    ],
    escalatesTo: [
      "Named demo platform owner (haixiang.yan@hytechc.com) / board for capital or licence events",
    ],
  },
  RISK_OWNER: {
    code: "RISK_OWNER",
    name: "Risk Owner",
    department: "RISK_CONTROL",
    intro:
      "Department owner for Risk Control. Accountable for limit policy, escalations, war-room, and the human gate on high-severity interventions across forex CFD and the crypto exchange.",
    owns: [
      "Limit policy, breach authority, and residual-risk acceptance",
      "Escalation routes into Risk Control Desk and Crypto Exchange Risk",
      "Checker role on live detector promotion and risk-facing AI Admin settings",
      "Approve / reject Human Intervention for halt, leverage, LP disable and wallet pause",
    ],
    does: [
      "Chair BREACH/CRITICAL war-rooms until residual risk is signed",
      "Tune risk thresholds this BU owns (not System-only flags)",
      "Assign Risk Analysts on-call and review the daily risk dashboard",
      "Challenge AI RCA when the second-AI verdict is DISAGREE or PARTIAL",
      "Sign entity-aware leverage or product-group changes before they go live",
    ],
    doesNot: [
      "Process funding tickets or speak to clients as case owner (Operations)",
      "Patch bridges, LPs or wallets (System)",
      "Auto-execute halt / close-only — those stay human-gated, including for this role's own proposals when dual-control applies",
    ],
    escalatesTo: [
      "SUPER_ADMIN / demo platform owner on entity-capital, multi-entity or licence-limit events",
    ],
  },
  RISK_ANALYST: {
    code: "RISK_ANALYST",
    name: "Risk Analyst",
    department: "RISK_CONTROL",
    intro:
      "First-line Risk Control operator. Monitors alerts, investigates with AI RCA and evidence, proposes actions, and pages the Risk Owner when a human gate is required.",
    owns: [
      "Live alert queue for Risk Control domains during the shift",
      "Investigation packs: Monitor evidence, RAG, market intel, messenger thread",
      "Draft intervention recommendations (maker) for the Risk Owner to check",
    ],
    does: [
      "Ack, annotate and escalate alerts on Demo Messenger",
      "Run detectors in operate mode and attach evidence to the spine",
      "Propose halt / leverage / LP / pause — never confirm high-severity actions alone",
      "Feed post-incident notes into the case thread for RAG later",
    ],
    doesNot: [
      "Approve high-severity interventions or change limit policy",
      "Manage users, platform settings, or AI Admin checker steps",
      "Close a CRITICAL without Risk Owner (or dual-control) sign-off",
    ],
    escalatesTo: [
      "RISK_OWNER (primary) → SUPER_ADMIN if the owner is unreachable past SLA",
    ],
  },
  OPS_LEAD: {
    code: "OPS_LEAD",
    name: "Operations Lead",
    department: "OPERATIONS",
    intro:
      "Owns Operations queues: funding exceptions, EOD recon, ticket SLA, and client-facing execution of risk decisions. Checker for ops-side interventions; maker for case assignment.",
    owns: [
      "Ops Funding & Recon team SLA and on-call roster",
      "Withdrawal / deposit exception policy inside rails Risk has not frozen",
      "Client communication after a Risk decision (halted symbol, paused withdrawal)",
      "Ops dashboard scope (dashboard.ops)",
    ],
    does: [
      "Prioritise recon breaks before the daily dashboard is published",
      "Approve ops-severity interventions; escalate credit or fraud to Risk",
      "Manage Lark channels used by Ops Funding & Recon",
      "Dual-control with Risk when a funding freeze is credit-related",
    ],
    doesNot: [
      "Set leverage, halt, LP or wallet-float policy",
      "Promote detectors or edit RAG as owner",
      "Grant admin privileges or change platform kill-switches",
    ],
    escalatesTo: [
      "RISK_OWNER when a case becomes credit, fraud or market risk",
      "SYSTEM_ADMIN when payment rails or wallets are down",
    ],
  },
  OPS_ANALYST: {
    code: "OPS_ANALYST",
    name: "Operations Analyst",
    department: "OPERATIONS",
    intro:
      "Handles operational tickets and case work: funding exceptions, recon items, client contact, and evidence capture for AI fraud/bonus skills.",
    owns: [
      "Assigned tickets in Ops Funding & Recon",
      "Case notes and client-contact logs that the spine can audit",
      "First-pass recon exception classification",
    ],
    does: [
      "Work the ops queue, update ticket status, notify via messenger",
      "Collect payment-rail / on-chain evidence for AI and Risk",
      "Execute a freeze or release only after the documented approval",
    ],
    doesNot: [
      "Close credit-impacted withdrawals without the Operations Lead",
      "Change Monitor thresholds, detectors or platform settings",
      "Tell a client a risk decision that Risk has not signed",
    ],
    escalatesTo: [
      "OPS_LEAD → RISK_OWNER if the case is credit or fraud",
    ],
  },
  AI_ENGINEER: {
    code: "AI_ENGINEER",
    name: "AI Engineer",
    department: "AI",
    intro:
      "Maintains detectors, RCA models, skill playbooks, RAG pipelines and the challenger. Maker on AI Admin; cannot be the sole checker on live promotion.",
    owns: [
      "Detector catalogue health, shadow runs, and drift monitors",
      "Skill playbook accuracy and Knowledge Tree links",
      "RAG corpus freshness and source citations",
      "AI analysis pipeline as maker (auto-on-alarm, certainty gate, challenger settings)",
    ],
    does: [
      "Propose AI Admin changes, training runs and skill edits",
      "Investigate false positives with the Risk Analyst",
      "Keep human-only AI access blocklist recommendations current",
      "Operate detectors and attach RCA evidence",
    ],
    doesNot: [
      "Approve their own live detector promotion (Risk Owner or a different checker)",
      "Execute halt / leverage / LP / withdrawal actions",
      "Change platform-wide kill-switches (System)",
    ],
    escalatesTo: [
      "RISK_OWNER for live promotion and intervention recommendations",
      "SYSTEM_ADMIN for source or pipeline outages",
    ],
  },
  SYSTEM_ADMIN: {
    code: "SYSTEM_ADMIN",
    name: "System Admin",
    department: "SYSTEM",
    intro:
      "Infra, LP endpoints, bridges, servers, wallets, config change-control and platform configuration. Executes kill-switches that Risk has armed; does not set book-risk policy.",
    owns: [
      "Trading Infra & Bridges on-call",
      "Data-source connectors, credentials and refresh cadence",
      "settings.manage for non-risk flags, sessions and the audit store",
      "User / team management within System (and support for other BUs)",
    ],
    does: [
      "Patch, failover and health-check LP / bridge / wallet / server",
      "Arm or execute a kill-switch when Risk (or Super Admin) has authorised it",
      "Register new internal and external sources",
      "Investigate tech-domain alerts (stale quotes from feed, API errors, wallet daemons)",
    ],
    doesNot: [
      "Accept residual market or credit risk",
      "Train models or write RCA as owner",
      "Handle client funding cases",
    ],
    escalatesTo: [
      "RISK_OWNER when infra failure creates book or wallet risk",
      "SUPER_ADMIN on privilege, data-loss or multi-system outage",
    ],
  },
  VIEWER: {
    code: "VIEWER",
    name: "Viewer",
    department: null,
    intro:
      "Read-only observer of dashboards, org chart, source registry, analyses and docs. Cannot operate alerts, interventions, AI Admin or settings. Typical board / auditor persona.",
    owns: [
      "No operational RACI — may raise questions in messenger threads they can read",
    ],
    does: [
      "Open dashboards, docs, RAG, skills (read), alerts (read) and org pages",
      "Follow the spine log and the audit trail they are permitted to see",
    ],
    doesNot: [
      "Ack, escalate, intervene, edit users, change settings, or run AI Admin",
      "Be assigned as on-call or as maker/checker",
    ],
    escalatesTo: [
      "Sponsoring BU owner (usually RISK_OWNER or SUPER_ADMIN) outside the product",
    ],
  },
};

export const DEPARTMENT_LIST = Object.values(DEPARTMENT_CHARTERS);
export const ROLE_LIST = Object.values(ROLE_CHARTERS);

export function departmentCharter(code: string | null | undefined): DepartmentCharter | undefined {
  if (!code) return undefined;
  return DEPARTMENT_CHARTERS[code as DepartmentCode];
}

export function roleCharter(code: string | null | undefined): RoleCharter | undefined {
  if (!code) return undefined;
  return ROLE_CHARTERS[code as RoleCode];
}
