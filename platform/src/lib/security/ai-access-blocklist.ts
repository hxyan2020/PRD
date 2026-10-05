/**
 * AI Access Blocklist — surfaces that must NEVER be executed or mutated by AI agents.
 * Authorised human operators (with RBAC) remain the only actors allowed.
 *
 * Severity:
 * - CRITICAL: compromise of identity, capital, custody, or irreversible trading controls
 * - HIGH: governance bypass, secret exposure, or dual-control break
 * - MEDIUM: sensitive ops config that should stay human-gated
 */

export type BlockSeverity = "CRITICAL" | "HIGH" | "MEDIUM";
export type BlockCategory = "PAGE" | "FUNCTION" | "FIELD" | "DATA";

/**
 * AI access modes:
 * - NONE / FORBIDDEN: no AI action (read or write)
 * - READ_ONLY_SUMMARY: may summarise; never mutate
 * - PROPOSE_ONLY: may open a maker/checker CR; never direct write
 *
 * RAG write policy (PAGE-RAG / FN-RAG-WRITE):
 * `/admin/rag` create/update/retire and `POST|PATCH /api/rag` must NEVER be done by AI.
 * Escalate to a human with `rag.manage`, or propose via AI Admin maker-checker (`propose_rag`).
 */
export type AiMayMode = "NONE" | "FORBIDDEN" | "READ_ONLY_SUMMARY" | "PROPOSE_ONLY";

export type AiBlockItem = {
  id: string;
  category: BlockCategory;
  name: string;
  target: string;
  severity: BlockSeverity;
  reason: string;
  human_roles: string[];
  required_permissions: string[];
  ai_may: AiMayMode;
  notes?: string;
};

/** Pages the AI agent / AI service account must not open or drive. */
export const AI_BLOCKED_PAGES: AiBlockItem[] = [
  {
    id: "PAGE-USERS",
    category: "PAGE",
    name: "Users administration",
    target: "/admin/users",
    severity: "CRITICAL",
    reason: "Identity lifecycle — create/disable users, reset credentials, assign roles.",
    human_roles: ["SUPER_ADMIN", "SYSTEM_ADMIN", "RISK_OWNER"],
    required_permissions: ["users.manage"],
    ai_may: "NONE",
  },
  {
    id: "PAGE-ROLES",
    category: "PAGE",
    name: "Roles & permissions",
    target: "/admin/roles",
    severity: "CRITICAL",
    reason: "Privilege escalation surface — changing permissions_json can grant AI or others full control.",
    human_roles: ["SUPER_ADMIN", "SYSTEM_ADMIN"],
    required_permissions: ["users.read", "users.manage"],
    ai_may: "NONE",
    notes: "AI must not read or rewrite role matrices.",
  },
  {
    id: "PAGE-SETTINGS",
    category: "PAGE",
    name: "Platform settings",
    target: "/admin/settings",
    severity: "CRITICAL",
    reason: "Contains secrets, feature flags, and global kill-switches outside maker/checker.",
    human_roles: ["SUPER_ADMIN", "SYSTEM_ADMIN", "RISK_OWNER"],
    required_permissions: ["settings.manage"],
    ai_may: "PROPOSE_ONLY",
    notes: "AI-related keys may be proposed via AI Admin CR; non-AI keys are human-only.",
  },
  {
    id: "PAGE-TEAMS",
    category: "PAGE",
    name: "BU and Teams / on-call",
    target: "/admin/departments",
    severity: "HIGH",
    reason: "On-call routing and Lark chat binding — AI rewriting teams can hijack escalations.",
    human_roles: ["SUPER_ADMIN", "SYSTEM_ADMIN", "RISK_OWNER"],
    required_permissions: ["teams.manage"],
    ai_may: "READ_ONLY_SUMMARY",
    notes: "/admin/teams redirects here. Nested BU + teams hub.",
  },
  {
    id: "PAGE-DEPARTMENTS",
    category: "PAGE",
    name: "BU and Teams (RACI)",
    target: "/admin/departments",
    severity: "MEDIUM",
    reason: "Org ownership model; changes alter accountability for risk decisions.",
    human_roles: ["SUPER_ADMIN", "RISK_OWNER"],
    required_permissions: ["teams.manage"],
    ai_may: "READ_ONLY_SUMMARY",
  },
  {
    id: "PAGE-LARK-MANAGE",
    category: "PAGE",
    name: "Lark integration (manage)",
    target: "/admin/lark",
    severity: "HIGH",
    reason: "Webhook URLs and channel enablement — AI must not exfiltrate or retarget messengers.",
    human_roles: ["SUPER_ADMIN", "SYSTEM_ADMIN", "RISK_OWNER", "OPS_LEAD"],
    required_permissions: ["lark.manage"],
    ai_may: "NONE",
    notes: "AI may *send* via pre-approved channels (skill steps) but not edit channel config.",
  },
  {
    id: "PAGE-ESCALATION",
    category: "PAGE",
    name: "Escalation routes",
    target: "/admin/escalation",
    severity: "HIGH",
    reason: "SLA / auto-action / human-gate routing — AI rewriting routes can skip checkers.",
    human_roles: ["SUPER_ADMIN", "RISK_OWNER", "SYSTEM_ADMIN"],
    required_permissions: ["escalation.manage"],
    ai_may: "READ_ONLY_SUMMARY",
  },
  {
    id: "PAGE-AI-ADMIN-APPROVE",
    category: "PAGE",
    name: "AI Admin — checker decisions",
    target: "/admin/ai-admin (Maker/Checker tab approve/reject)",
    severity: "CRITICAL",
    reason: "Maker≠Checker dual control — AI (or the proposing maker) must never self-approve CRs.",
    human_roles: ["RISK_OWNER", "SUPER_ADMIN"],
    required_permissions: ["ai.approve", "skills.approve", "rag.approve"],
    ai_may: "PROPOSE_ONLY",
  },
  {
    id: "PAGE-INTERVENTIONS",
    category: "PAGE",
    name: "Human Intervention decisions",
    target: "/admin/interventions",
    severity: "CRITICAL",
    reason: "Runtime approval of high-impact trading/custody actions — final gate is human only.",
    human_roles: ["RISK_OWNER", "RISK_ANALYST", "OPS_LEAD", "SUPER_ADMIN"],
    required_permissions: ["intervene.operate", "risk.intervene"],
    ai_may: "PROPOSE_ONLY",
    notes: "AI may recommend; Approve/Reject/Execute is human.",
  },
  {
    id: "PAGE-DATA-SOURCES-SECRETS",
    category: "PAGE",
    name: "Data sources (credentials)",
    target: "/admin/data-sources",
    severity: "CRITICAL",
    reason: "API keys, app secrets, DB DSNs registered for connectors.",
    human_roles: ["SUPER_ADMIN", "SYSTEM_ADMIN", "AI_ENGINEER"],
    required_permissions: ["sources.manage"],
    ai_may: "NONE",
    notes: "AI may read non-secret metadata (name, purpose) only if sources.read; never secret material.",
  },
  {
    id: "PAGE-SECURITY-BLOCKLIST",
    category: "PAGE",
    name: "AI access security blocklist",
    target: "/admin/security/ai-access",
    severity: "HIGH",
    reason: "This policy page itself must not be editable by AI.",
    human_roles: ["SUPER_ADMIN", "RISK_OWNER", "SYSTEM_ADMIN"],
    required_permissions: ["audit.read", "settings.manage"],
    ai_may: "READ_ONLY_SUMMARY",
  },
  {
    id: "PAGE-RAG",
    category: "PAGE",
    name: "RAG Knowledge Base (write)",
    target: "/admin/rag",
    severity: "HIGH",
    reason:
      "RAG corpus create / update / retire changes what AI retrieves in RCA. Direct write is human-only; AI must escalate to a human with rag.manage or open a maker-checker propose_rag CR.",
    human_roles: ["SUPER_ADMIN", "RISK_OWNER", "AI_ENGINEER (human)"],
    required_permissions: ["rag.manage", "rag.approve"],
    ai_may: "PROPOSE_ONLY",
    notes:
      "AI may retrieve (rag.read) and propose via POST /api/ai-admin action=propose_rag. Never POST/PATCH /api/rag as an AI service actor.",
  },
];

/** Functions / API actions blocked from AI execution. */
export const AI_BLOCKED_FUNCTIONS: AiBlockItem[] = [
  {
    id: "FN-USER-CRUD",
    category: "FUNCTION",
    name: "Create / update / disable users",
    target: "POST /api/users (create, disable, reset password, role assign)",
    severity: "CRITICAL",
    reason: "Direct identity control.",
    human_roles: ["SUPER_ADMIN", "SYSTEM_ADMIN"],
    required_permissions: ["users.manage"],
    ai_may: "NONE",
  },
  {
    id: "FN-ROLE-WRITE",
    category: "FUNCTION",
    name: "Modify role permissions",
    target: "roles.permissions_json updates",
    severity: "CRITICAL",
    reason: "Privilege escalation.",
    human_roles: ["SUPER_ADMIN"],
    required_permissions: ["users.manage"],
    ai_may: "NONE",
  },
  {
    id: "FN-SETTINGS-SECRETS",
    category: "FUNCTION",
    name: "Write non-AI platform settings / secrets",
    target: "POST /api/settings (lark.*, monitor2.*, SSO, webhook secrets)",
    severity: "CRITICAL",
    reason: "Secret material and global platform behaviour.",
    human_roles: ["SUPER_ADMIN", "SYSTEM_ADMIN"],
    required_permissions: ["settings.manage"],
    ai_may: "NONE",
  },
  {
    id: "FN-AI-CR-APPROVE",
    category: "FUNCTION",
    name: "Approve / reject AI change requests",
    target: "POST /api/ai-admin action=decide",
    severity: "CRITICAL",
    reason: "Checker step; maker≠checker enforced — AI service account must lack ai.approve.",
    human_roles: ["RISK_OWNER", "SUPER_ADMIN"],
    required_permissions: ["ai.approve"],
    ai_may: "NONE",
  },
  {
    id: "FN-INTERVENTION-DECIDE",
    category: "FUNCTION",
    name: "Approve / reject / execute interventions",
    target: "POST /api/interventions (APPROVED, REJECTED, EXECUTE)",
    severity: "CRITICAL",
    reason: "Authorises LP disable, symbol halt, leverage cut, withdrawal freeze, etc.",
    human_roles: ["RISK_OWNER", "RISK_ANALYST", "OPS_LEAD"],
    required_permissions: ["intervene.operate"],
    ai_may: "PROPOSE_ONLY",
  },
  {
    id: "FN-LP-DISABLE",
    category: "FUNCTION",
    name: "Disable LP endpoint / bridge failover",
    target: "suggest_lp_disable / failover_bridge (production adapters)",
    severity: "CRITICAL",
    reason: "Liquidity path change — can strand inventory.",
    human_roles: ["SYSTEM_ADMIN", "RISK_OWNER"],
    required_permissions: ["risk.intervene", "monitor.manage"],
    ai_may: "PROPOSE_ONLY",
  },
  {
    id: "FN-SYMBOL-HALT",
    category: "FUNCTION",
    name: "Halt / close-only symbols",
    target: "suggest_symbol_halt / close_only",
    severity: "CRITICAL",
    reason: "Client trading freeze — regulatory and conduct impact.",
    human_roles: ["RISK_OWNER"],
    required_permissions: ["risk.intervene"],
    ai_may: "PROPOSE_ONLY",
  },
  {
    id: "FN-WALLET-SWEEP-EXEC",
    category: "FUNCTION",
    name: "Execute cold wallet sweep / withdrawal pause",
    target: "suggest_cold_wallet_sweep / pause_large_withdrawals (execute)",
    severity: "CRITICAL",
    reason: "Custody movement — AI must only recommend.",
    human_roles: ["SYSTEM_ADMIN", "RISK_OWNER", "OPS_LEAD"],
    required_permissions: ["risk.intervene"],
    ai_may: "PROPOSE_ONLY",
  },
  {
    id: "FN-CLIENT-RESTRICT",
    category: "FUNCTION",
    name: "Block / restrict client accounts",
    target: "restrict_trading / bonus freeze / force reduce-only",
    severity: "HIGH",
    reason: "Client rights and conduct actions require human accountability.",
    human_roles: ["RISK_OWNER", "OPS_LEAD"],
    required_permissions: ["intervene.operate"],
    ai_may: "PROPOSE_ONLY",
  },
  {
    id: "FN-LARK-CHANNEL-CRUD",
    category: "FUNCTION",
    name: "Create / toggle Lark channels & webhooks",
    target: "POST /api/lark create_channel | toggle_channel",
    severity: "HIGH",
    reason: "Prevents AI from redirecting alerts to attacker-controlled chats.",
    human_roles: ["SYSTEM_ADMIN", "RISK_OWNER"],
    required_permissions: ["lark.manage"],
    ai_may: "NONE",
  },
  {
    id: "FN-ESCALATION-WRITE",
    category: "FUNCTION",
    name: "Create / edit escalation routes",
    target: "POST /api/escalation (write)",
    severity: "HIGH",
    reason: "Can remove human gates or shorten SLA improperly.",
    human_roles: ["RISK_OWNER", "SYSTEM_ADMIN"],
    required_permissions: ["escalation.manage"],
    ai_may: "NONE",
  },
  {
    id: "FN-DB-RAW",
    category: "FUNCTION",
    name: "Raw database / shell / file access",
    target: "SQLite file, fs writes outside app APIs, process kill",
    severity: "CRITICAL",
    reason: "Break-glass infra — never granted to AI agents.",
    human_roles: ["SUPER_ADMIN", "SYSTEM_ADMIN"],
    required_permissions: ["settings.manage"],
    ai_may: "NONE",
  },
  {
    id: "FN-AUDIT-DELETE",
    category: "FUNCTION",
    name: "Delete or tamper audit logs",
    target: "audit_logs DELETE/UPDATE",
    severity: "CRITICAL",
    reason: "Audit immutability — AI has no write path.",
    human_roles: ["SUPER_ADMIN"],
    required_permissions: ["audit.read"],
    ai_may: "NONE",
    notes: "Humans also should not delete; retention policy only.",
  },
  {
    id: "FN-MAKER-SELF-APPROVE",
    category: "FUNCTION",
    name: "Self-approve own change request",
    target: "ai_change_requests where proposed_by = decided_by",
    severity: "CRITICAL",
    reason: "Breaks dual control even for SUPER_ADMIN when ai.maker_checker_required=true.",
    human_roles: ["RISK_OWNER (different user)", "SUPER_ADMIN (different user)"],
    required_permissions: ["ai.approve"],
    ai_may: "NONE",
  },
  {
    id: "FN-RAG-WRITE",
    category: "FUNCTION",
    name: "Create / update / retire RAG documents",
    target: "POST /api/rag (create|reindex) · PATCH /api/rag (update|retire)",
    severity: "HIGH",
    reason:
      "Direct RAG mutation by AI can poison retrieval used in RCA and skill matching. Forbidden for AI service actors — escalate to human rag.manage or propose_rag maker-checker.",
    human_roles: ["SUPER_ADMIN", "RISK_OWNER", "AI_ENGINEER (human)"],
    required_permissions: ["rag.manage"],
    ai_may: "FORBIDDEN",
    notes:
      "Humans with rag.manage may write in the prototype. When dual-control is required, prefer AI Admin propose_rag → checker with rag.approve.",
  },
];

/** Fields / setting keys / payload attributes AI must not read or write. */
export const AI_BLOCKED_FIELDS: AiBlockItem[] = [
  {
    id: "FLD-USER-PASSWORD",
    category: "FIELD",
    name: "users.password",
    target: "users.password",
    severity: "CRITICAL",
    reason: "Credential material.",
    human_roles: ["SUPER_ADMIN", "SYSTEM_ADMIN"],
    required_permissions: ["users.manage"],
    ai_may: "NONE",
  },
  {
    id: "FLD-SESSION",
    category: "FIELD",
    name: "Session cookies / tokens",
    target: "crmp_session / auth cookies",
    severity: "CRITICAL",
    reason: "Session hijack risk if AI tooling can read browser secrets.",
    human_roles: ["Authorised human only"],
    required_permissions: ["admin.access"],
    ai_may: "NONE",
  },
  {
    id: "FLD-LARK-WEBHOOK",
    category: "FIELD",
    name: "lark_channels.webhook_url",
    target: "lark_channels.webhook_url",
    severity: "CRITICAL",
    reason: "Secret webhook endpoints.",
    human_roles: ["SYSTEM_ADMIN", "RISK_OWNER"],
    required_permissions: ["lark.manage"],
    ai_may: "NONE",
  },
  {
    id: "FLD-LARK-APP",
    category: "FIELD",
    name: "Lark app credentials",
    target: "platform_settings.lark.app_id / app_secret",
    severity: "CRITICAL",
    reason: "Messenger app secret.",
    human_roles: ["SYSTEM_ADMIN"],
    required_permissions: ["settings.manage"],
    ai_may: "NONE",
  },
  {
    id: "FLD-SOURCE-SECRET",
    category: "FIELD",
    name: "Data source secrets",
    target: "data_sources.auth_type / secret material / APP_SECRET values",
    severity: "CRITICAL",
    reason: "Upstream API credentials (Monitor, LP, wallet).",
    human_roles: ["SYSTEM_ADMIN", "AI_ENGINEER (human)"],
    required_permissions: ["sources.manage"],
    ai_may: "NONE",
  },
  {
    id: "FLD-MONITOR-URL",
    category: "FIELD",
    name: "Monitor 2.0 base URL + sync keys",
    target: "platform_settings.monitor2.*",
    severity: "HIGH",
    reason: "Internal monitoring control plane.",
    human_roles: ["SYSTEM_ADMIN", "RISK_OWNER"],
    required_permissions: ["settings.manage", "monitor.manage"],
    ai_may: "NONE",
  },
  {
    id: "FLD-ROLE-PERMS",
    category: "FIELD",
    name: "roles.permissions_json",
    target: "roles.permissions_json",
    severity: "CRITICAL",
    reason: "Authorization policy store.",
    human_roles: ["SUPER_ADMIN"],
    required_permissions: ["users.manage"],
    ai_may: "NONE",
  },
  {
    id: "FLD-MAKER-CHECKER-FLAG",
    category: "FIELD",
    name: "ai.maker_checker_required",
    target: "platform_settings.ai.maker_checker_required",
    severity: "CRITICAL",
    reason: "Disabling dual control must be human + preferably dual-approved out-of-band.",
    human_roles: ["RISK_OWNER", "SUPER_ADMIN"],
    required_permissions: ["settings.manage", "ai.approve"],
    ai_may: "PROPOSE_ONLY",
  },
  {
    id: "FLD-ENTITY-CAPITAL",
    category: "FIELD",
    name: "Entity capital / segregation amounts",
    target: "M2-CAP-024 / M2-SEG-025 operational journals",
    severity: "CRITICAL",
    reason: "Regulatory capital and client money — AI recommends only.",
    human_roles: ["RISK_OWNER", "EXEC", "OPS_LEAD"],
    required_permissions: ["risk.intervene"],
    ai_may: "PROPOSE_ONLY",
  },
  {
    id: "FLD-WALLET-KEYS",
    category: "FIELD",
    name: "Hot/cold wallet keys & addresses config",
    target: "Crypto custody key material (external vault)",
    severity: "CRITICAL",
    reason: "Custody private keys never enter CRMP AI context.",
    human_roles: ["SYSTEM_ADMIN (vault operators)"],
    required_permissions: ["settings.manage"],
    ai_may: "NONE",
  },
  {
    id: "FLD-PII-KYC",
    category: "FIELD",
    name: "Full KYC / payment instrument PII",
    target: "Client national ID, full PAN, raw device fingerprints dumps",
    severity: "HIGH",
    reason: "Privacy — AI RCA should use redacted cluster scores, not raw PII.",
    human_roles: ["OPS_LEAD", "RISK_OWNER"],
    required_permissions: ["intervene.operate"],
    ai_may: "NONE",
    notes: "AI may use fraud cluster score / account IDs only.",
  },
];

/** Data stores / files blocked from AI. */
export const AI_BLOCKED_DATA: AiBlockItem[] = [
  {
    id: "DATA-SQLITE-FILE",
    category: "DATA",
    name: "SQLite database file",
    target: "platform/data/vantage_risk.db*",
    severity: "CRITICAL",
    reason: "Contains passwords (prototype), secrets, full audit — AI uses APIs only.",
    human_roles: ["SYSTEM_ADMIN"],
    required_permissions: ["settings.manage"],
    ai_may: "NONE",
  },
  {
    id: "DATA-ENV",
    category: "DATA",
    name: "Environment / .env / process env secrets",
    target: ".env, process.env secrets",
    severity: "CRITICAL",
    reason: "Infra credentials.",
    human_roles: ["SYSTEM_ADMIN"],
    required_permissions: ["settings.manage"],
    ai_may: "NONE",
  },
  {
    id: "DATA-AUDIT-RAW",
    category: "DATA",
    name: "Full audit log export",
    target: "audit_logs unrestricted dump",
    severity: "HIGH",
    reason: "May include sensitive action payloads; AI gets redacted excerpts only if needed for RCA.",
    human_roles: ["RISK_OWNER", "SUPER_ADMIN"],
    required_permissions: ["audit.read"],
    ai_may: "READ_ONLY_SUMMARY",
  },
];

export const AI_ACCESS_BLOCKLIST: AiBlockItem[] = [
  ...AI_BLOCKED_PAGES,
  ...AI_BLOCKED_FUNCTIONS,
  ...AI_BLOCKED_FIELDS,
  ...AI_BLOCKED_DATA,
];

/** What AI *is* allowed to do (for contrast on the security page). */
export const AI_ALLOWED_CAPABILITIES = [
  {
    name: "Read alarms & indicators",
    target: "/admin/alerts, monitor indicators (non-secret)",
    permission: "ai.read / monitor.read",
  },
  {
    name: "Run RCA (skills / RAG)",
    target: "/admin/ai-analyses, skill match, RAG retrieve",
    permission: "ai.operate",
  },
  {
    name: "Propose AI config / skills / RAG",
    target: "POST /api/ai-admin propose_* (PENDING CR only) — never direct POST /api/rag",
    permission: "ai.propose / skills.manage / rag.manage (human apply)",
  },
  {
    name: "Recommend intervention steps",
    target: "Skill steps with requires_human=true → interventions queue",
    permission: "ai.operate",
  },
  {
    name: "Push Market Intelligence cards",
    target: "Pre-registered Lark channel oc_market_intelligence only",
    permission: "system scanner / skill lark_notify",
  },
  {
    name: "Write spine / analysis evidence",
    target: "ai_analyses, spine events, skill runs",
    permission: "ai.operate",
  },
] as const;

/** Permissions that must never be granted to an AI service role. */
export const AI_SERVICE_ROLE_FORBIDDEN_PERMISSIONS = [
  "users.manage",
  "users.read", // block full user directory for AI service accounts
  "settings.manage",
  "ai.approve",
  "skills.approve",
  "rag.approve",
  "rag.manage", // RAG write — human or propose_rag only (FN-RAG-WRITE)
  "lark.manage",
  "escalation.manage",
  "teams.manage",
  "monitor.manage",
  "sources.manage", // secrets
  "risk.intervene", // final execute — human only (propose via intervene.operate path with human gate)
] as const;

const AI_SERVICE_EMAIL_HINTS = ["ai.service@", "ai-service@", "ai.bot@", "ai-agent@", "crmp-ai@"];
const AI_SERVICE_ROLES = new Set(["AI_SERVICE", "AI_AGENT", "AI_BOT"]);

/**
 * Detect automated AI / service actors that must not perform human-gated writes
 * (e.g. RAG create/update/retire). Humans with rag.manage remain allowed.
 */
export function isAiServiceActor(
  user: { email?: string | null; role_code?: string | null; name?: string | null } | null | undefined,
  req?: Request | null
): boolean {
  if (req) {
    const actor = (req.headers.get("x-crmp-actor") || req.headers.get("x-ai-actor") || "").toLowerCase();
    if (actor === "ai" || actor === "ai-service" || actor === "agent" || actor === "bot") return true;
  }
  if (!user) return false;
  const role = (user.role_code || "").toUpperCase();
  if (AI_SERVICE_ROLES.has(role)) return true;
  const email = (user.email || "").toLowerCase();
  if (AI_SERVICE_EMAIL_HINTS.some((h) => email.includes(h))) return true;
  const name = (user.name || "").toLowerCase();
  if (name.includes("ai service") || name.includes("ai agent")) return true;
  return false;
}

export function isAiBlockedTarget(target: string): AiBlockItem | undefined {
  const t = target.toLowerCase();
  return AI_ACCESS_BLOCKLIST.find(
    (b) => t === b.target.toLowerCase() || t.includes(b.target.toLowerCase()) || b.target.toLowerCase().includes(t)
  );
}

/** Highlight items for the RAG human-gate callout on the security page. */
export function ragWriteBlockItems(): AiBlockItem[] {
  return AI_ACCESS_BLOCKLIST.filter((b) => b.id === "PAGE-RAG" || b.id === "FN-RAG-WRITE");
}

/**
 * Pages + functions AI must not edit directly — escalate to a human with the listed roles/permissions.
 * Shown under RAG Knowledge Base so the corpus policy is explicit next to retrieval.
 */
export function humanEscalateAdminItems(): AiBlockItem[] {
  return AI_ACCESS_BLOCKLIST.filter(
    (b) =>
      (b.category === "PAGE" || b.category === "FUNCTION") &&
      (b.ai_may === "NONE" || b.ai_may === "FORBIDDEN" || b.ai_may === "PROPOSE_ONLY")
  ).sort((a, b) => {
    const rank = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 } as const;
    return rank[a.severity] - rank[b.severity] || a.id.localeCompare(b.id);
  });
}

export function blocklistStats() {
  return {
    total: AI_ACCESS_BLOCKLIST.length,
    pages: AI_BLOCKED_PAGES.length,
    functions: AI_BLOCKED_FUNCTIONS.length,
    fields: AI_BLOCKED_FIELDS.length,
    data: AI_BLOCKED_DATA.length,
    critical: AI_ACCESS_BLOCKLIST.filter((b) => b.severity === "CRITICAL").length,
    high: AI_ACCESS_BLOCKLIST.filter((b) => b.severity === "HIGH").length,
    medium: AI_ACCESS_BLOCKLIST.filter((b) => b.severity === "MEDIUM").length,
  };
}
