/**
 * CS/TR operational data contract — constants only (no DB).
 * Seeded into teams, lark_channels, data_sources, escalation_routes, platform_settings.
 */

export const CS_INTAKE_DEMO_TOKEN = "demo-c1";
export const CS_INTAKE_TOKEN_HEADER = "x-cs-intake-token";

export const CS_FOLLOWUP_CAP_DEFAULT = 3;

export const CS_BU_CODES = ["CUSTOMER_SERVICE", "TRADING"] as const;

export const CS_TEAM_SPECS = [
  {
    name: "CS 24/7 Desk",
    department_code: "CUSTOMER_SERVICE",
    mission: "24/7 C1 live chat, web form and official mailbox intake; AI follow-up until the client replies.",
    lark_chat_id: "oc_cs_c1",
    on_call_rotation: "CS Agent → CS Lead",
  },
  {
    name: "CS KYC Vault",
    department_code: "CUSTOMER_SERVICE",
    mission:
      "Identity-verification cases only — UID / KYC status flags, never ID-image blobs on the ticket. Holds ID_VERIFY until the client replies or CS Lead waives.",
    lark_chat_id: "oc_cs_kyc",
    on_call_rotation: "CS Agent (KYC) → CS Lead",
  },
  {
    name: "TR Dealing Support",
    department_code: "TRADING",
    mission: "Order, fill, slippage and MT4/MT5 execution complaints routed from CS.",
    lark_chat_id: "oc_tr_dealing",
    on_call_rotation: "TR Dealer → TR Lead",
  },
] as const;

export const CS_POC_SPECS = [
  {
    email: "cs.lead@vantagemarkets.com",
    name: "Maya Santos",
    password: "cs123",
    role: "CS_LEAD",
    department: "CUSTOMER_SERVICE",
    team: "CS 24/7 Desk",
  },
  {
    email: "cs.agent@vantagemarkets.com",
    name: "Elena Rossi",
    password: "cs123",
    role: "CS_AGENT",
    department: "CUSTOMER_SERVICE",
    team: "CS 24/7 Desk",
  },
  {
    email: "cs.kyc@vantagemarkets.com",
    name: "Nadia Okonkwo",
    password: "cs123",
    role: "CS_AGENT",
    department: "CUSTOMER_SERVICE",
    team: "CS KYC Vault",
  },
  {
    email: "tr.lead@vantagemarkets.com",
    name: "Kenji Watanabe",
    password: "tr123",
    role: "TR_LEAD",
    department: "TRADING",
    team: "TR Dealing Support",
  },
  {
    email: "tr.dealer@vantagemarkets.com",
    name: "Omar Haddad",
    password: "tr123",
    role: "TR_DEALER",
    department: "TRADING",
    team: "TR Dealing Support",
  },
] as const;

export const CS_LARK_SPECS = [
  {
    name: "CS C1 Live",
    chat_id: "oc_cs_c1",
    purpose: "24/7 C1 live chat bridge into CRMP",
    department_code: "CUSTOMER_SERVICE",
    webhook_url: "https://open.larksuite.com/hook/mock-cs-c1",
  },
  {
    name: "CS KYC Vault",
    chat_id: "oc_cs_kyc",
    purpose: "ID-verify holds — status flags only, no ID images",
    department_code: "CUSTOMER_SERVICE",
    webhook_url: "https://open.larksuite.com/hook/mock-cs-kyc",
  },
  {
    name: "TR Dealing Support",
    chat_id: "oc_tr_dealing",
    purpose: "Trading execution complaints from CS",
    department_code: "TRADING",
    webhook_url: "https://open.larksuite.com/hook/mock-tr-deal",
  },
] as const;

export const CS_SOURCE_SPECS = [
  {
    name: "C1 Live Chat Gateway",
    category: "MESSAGING",
    url: "/api/cs/intake",
    description: "Platform 24/7 live chat (C1) webhook into the CS/TR desk.",
    owner_department: "CUSTOMER_SERVICE",
    auth_type: "TOKEN",
    refresh_cadence: "Real-time",
    tags_json: '["cs","c1","live-chat"]',
    notes: "Prototype token x-cs-intake-token: demo-c1",
  },
  {
    name: "Website CS submission form",
    category: "INTERNAL_PLATFORM",
    url: "/api/cs/intake",
    description: "Website / app contact form posts into the CS/TR desk.",
    owner_department: "CUSTOMER_SERVICE",
    auth_type: "TOKEN",
    refresh_cadence: "Event-driven",
    tags_json: '["cs","form"]',
    notes: "Same intake API as C1; channel=WEB_FORM",
  },
  {
    name: "Official support mailbox",
    category: "MESSAGING",
    url: "/api/cs/intake",
    description: "Official support and complaints mailboxes ingested as CS requests.",
    owner_department: "CUSTOMER_SERVICE",
    auth_type: "APP_SECRET",
    refresh_cadence: "Event-driven",
    tags_json: '["cs","email"]',
    notes: "AI follow-up mail is sent from this mailbox until the client replies.",
  },
  {
    name: "Official mailbox support@",
    category: "MESSAGING",
    url: "mailto:support@vantagemarkets.com",
    description: "Named support@ gateway — same POST /api/cs/intake as Official support mailbox.",
    owner_department: "CUSTOMER_SERVICE",
    auth_type: "APP_SECRET",
    refresh_cadence: "Event-driven",
    tags_json: '["cs","email","support"]',
    notes: "cs.mailbox_support parameter",
  },
  {
    name: "Official mailbox complaints@",
    category: "MESSAGING",
    url: "mailto:complaints@vantagemarkets.com",
    description: "Named complaints@ gateway for complaint-grade mail.",
    owner_department: "CUSTOMER_SERVICE",
    auth_type: "APP_SECRET",
    refresh_cadence: "Event-driven",
    tags_json: '["cs","email","complaints"]',
    notes: "cs.mailbox_complaints parameter",
  },
  {
    name: "CS KYC Vault",
    category: "INTERNAL_PLATFORM",
    url: "internal://cs-kyc-vault",
    description: "KYC / ID-verify status flags for CS. Never stores ID-image blobs on cs_requests.",
    owner_department: "CUSTOMER_SERVICE",
    auth_type: "SSO",
    refresh_cadence: "On demand",
    tags_json: '["cs","kyc","vault"]',
    notes: "Process vault — UID last-four and status only.",
  },
  {
    name: "MT4/MT5 dealing tape",
    category: "INTERNAL_PLATFORM",
    url: "internal://tr-dealing-tape",
    description: "Execution reconstruct for TR — fills, slippage, rejects vs LP. CS does not read this tape.",
    owner_department: "TRADING",
    auth_type: "VPN",
    refresh_cadence: "Tick / 1s",
    tags_json: '["tr","dealing","mt4","mt5"]',
    notes: "TR Dealing Support owns reconstruct; Risk owns residual book risk.",
  },
] as const;

export const CS_SETTING_SEED: Array<{ key: string; value: string; description: string }> = [
  {
    key: "cs.auto_reply_max_severity",
    value: "MEDIUM",
    description: "AI may email the client directly at or below this severity (LOW|MEDIUM|HIGH|CRITICAL)",
  },
  {
    key: "cs.sensitive_categories",
    value: "complaint,kyc,trading",
    description: "Categories that always hold the AI draft for a named POC before send",
  },
  {
    key: "cs.followup_cap",
    value: String(CS_FOLLOWUP_CAP_DEFAULT),
    description: "Auto-email wait-loop cap; CS Lead human after this many mails",
  },
  {
    key: "cs.wait_sla_minutes",
    value: "30",
    description: "SLA minutes while AWAITING_CLIENT on ESC-CS-24-7",
  },
  {
    key: "cs.id_verify_sla_minutes",
    value: "60",
    description: "SLA minutes while ID_VERIFY on ESC-CS-KYC",
  },
  {
    key: "cs.tr_sla_minutes",
    value: "15",
    description: "SLA minutes for TR dealing on ESC-TR-DEAL",
  },
  {
    key: "cs.risk_sla_minutes",
    value: "10",
    description: "SLA minutes after CS/TR book-risk escalate on ESC-CS-RISK",
  },
  {
    key: "cs.intake_token",
    value: CS_INTAKE_DEMO_TOKEN,
    description: "Prototype webhook token for header x-cs-intake-token",
  },
  {
    key: "cs.mailbox_support",
    value: "support@vantagemarkets.com",
    description: "From-address for official support auto-mail",
  },
  {
    key: "cs.mailbox_complaints",
    value: "complaints@vantagemarkets.com",
    description: "From-address for complaint-grade auto-mail",
  },
  {
    key: "cs.lark_cs",
    value: "oc_cs_c1",
    description: "Lark chat id for CS 24/7 Desk",
  },
  {
    key: "cs.lark_kyc",
    value: "oc_cs_kyc",
    description: "Lark chat id for CS KYC Vault",
  },
  {
    key: "cs.lark_tr",
    value: "oc_tr_dealing",
    description: "Lark chat id for TR Dealing Support",
  },
];

export const CS_ROUTE_CODES = ["ESC-CS-24-7", "ESC-CS-KYC", "ESC-TR-DEAL", "ESC-CS-RISK"] as const;

export const CS_ROUTE_HOPS: Record<
  string,
  Array<{ step: number; team: string; poc_role: string; sla_minutes: number }>
> = {
  "ESC-CS-24-7": [
    { step: 1, team: "CS 24/7 Desk", poc_role: "CS_AGENT", sla_minutes: 30 },
    { step: 2, team: "CS 24/7 Desk", poc_role: "CS_LEAD", sla_minutes: 30 },
  ],
  "ESC-CS-KYC": [
    { step: 1, team: "CS KYC Vault", poc_role: "CS_AGENT", sla_minutes: 60 },
    { step: 2, team: "CS 24/7 Desk", poc_role: "CS_LEAD", sla_minutes: 60 },
  ],
  "ESC-TR-DEAL": [
    { step: 1, team: "TR Dealing Support", poc_role: "TR_DEALER", sla_minutes: 15 },
    { step: 2, team: "TR Dealing Support", poc_role: "TR_LEAD", sla_minutes: 15 },
  ],
  "ESC-CS-RISK": [
    { step: 1, team: "Risk Control Desk", poc_role: "RISK_OWNER", sla_minutes: 10 },
    { step: 2, team: "CS 24/7 Desk", poc_role: "CS_LEAD", sla_minutes: 10 },
  ],
};

export function assignedBuFor(input: { desk?: string | null; status?: string | null; category?: string | null }): string {
  if (input.status === "ESCALATED_RISK") return "RISK_CONTROL";
  if (input.desk === "TR" || input.status === "ASSIGNED_TR" || input.category === "trading") return "TRADING";
  return "CUSTOMER_SERVICE";
}
