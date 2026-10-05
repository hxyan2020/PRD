export type UrlEntry = {
  category: string;
  title: string;
  path: string;
  description: string;
  permission?: string;
};

/** Permanent GitHub Pages URL for CRMP Admin (`/admin`). */
export const PUBLIC_ADMIN_URL = "https://hxyan2020.github.io/PRD/crmp-admin/admin/";
export const PUBLIC_ADMIN_ORIGIN = "https://hxyan2020.github.io/PRD/crmp-admin";
export const PUBLIC_MESSENGER_URL = `${PUBLIC_ADMIN_ORIGIN}/admin/messenger/`;

export const PLATFORM_URLS: UrlEntry[] = [
  // Auth
  { category: "Auth", title: "Login", path: "/login", description: "Full-page credential login (bookmark). Prefer /admin/login from the desk." },
  { category: "Auth", title: "Admin Login", path: "/admin/login", description: "Sign in inside the admin shell — never 404s on GitHub Pages" },
  { category: "API", title: "Auth Login", path: "/api/auth/login", description: "POST email/password → session cookie" },
  { category: "API", title: "Auth Me", path: "/api/auth/me", description: "GET current session user" },
  { category: "API", title: "Auth Logout", path: "/api/auth/logout", description: "POST clear session cookie" },

  // Home
  { category: "Home", title: "Admin Home", path: "/admin", description: "Control-plane overview, stats, expandable alert tracker, and home spine with stage ticket counts (Spine Log tab removed)", permission: "admin.access" },

  // Risk
  { category: "Risk", title: "Daily Performance", path: "/admin/dashboard", description: "PnL / exposure performance board", permission: "dashboard.read" },
  { category: "Risk", title: "Risk Log Analytics", path: "/admin/risk-log", description: "Closed tracker packs + 90-day historical charts (alerts/open book, loss vs prevented, latency) + timeline", permission: "monitor.read" },
  { category: "Risk", title: "Market Intelligence", path: "/admin/market-intel", description: "5-min news/social scan + messenger outbox", permission: "monitor.read" },
  { category: "Risk", title: "Detectors (redirect)", path: "/admin/detectors", description: "Redirects to Monitor 2.0 — detectors merged into indicator registry", permission: "detectors.read" },
  { category: "Risk", title: "Realtime Alert & Tracker", path: "/admin/alerts", description: "Open Monitor 2.0 tickets only + grouped AI pipeline controls (rank note) + AI RCA; M2-* MonitorCode tooltips/links; closed tickets → Risk Log", permission: "monitor.read" },
  { category: "Risk", title: "Monitor 2.0", path: "/admin/monitor-2", description: "Unified indicator + detector registry, thresholds, sampling runs & sync — deep-link targets for M2-* codes", permission: "monitor.read" },
  { category: "Risk", title: "Risk Domains", path: "/admin/risk-domains", description: "CFD + Crypto domains with P0–P3 scenarios linked to Monitor 2.0 (M2-* chips)", permission: "monitor.read" },

  // AI
  { category: "AI", title: "AI Analyses (redirect)", path: "/admin/ai-analyses", description: "Redirects to Realtime Alert & Tracker", permission: "ai.read" },
  { category: "AI", title: "AI Analysis Detail", path: "/admin/ai-analyses/[id]", description: "Single analysis pack + AiChallengePanel", permission: "ai.read" },
  { category: "AI", title: "AI Admin", path: "/admin/ai-admin", description: "First-line + second-line AI Admin cards, maker/checker, propose_rag, training & accuracy", permission: "ai.admin" },
  { category: "AI", title: "Human Intervention", path: "/admin/interventions", description: "Human gates from skill/RAG actions — samples show actioner email", permission: "intervene.operate" },
  { category: "AI", title: "Spine (redirect → Home)", path: "/admin/spine", description: "Redirects to Admin Home — stage ticket counts live on the home spine viz (dedicated Spine Log tab removed)", permission: "spine.read" },
  { category: "AI", title: "RAG Knowledge Base", path: "/admin/rag", description: "Internal + external evidence corpus (AI write blocked — human / propose_rag maker-checker)", permission: "rag.read" },
  { category: "AI", title: "AI Skills", path: "/admin/skills", description: "Playbooks & enriched risk scenarios — Enter opens the full SKILL.md page; each skill binds one escalation path (ESC-DEFAULT fallback)", permission: "skills.read" },
  { category: "AI", title: "Skill playbook detail", path: "/admin/skills/[code]", description: "Full when-to-use / prechecks / evidence / stop / success playbook for one skill", permission: "skills.read" },
  { category: "AI", title: "Knowledge Tree", path: "/admin/knowledge-tree", description: "Visual map of domains, skills, linked timelines and RAG document leaves with deep links", permission: "rag.read" },
  { category: "AI", title: "AI Access Security", path: "/admin/security/ai-access", description: "Human-only pages/functions/fields blocklist (includes FN-RAG-WRITE / propose_rag only)", permission: "audit.read" },

  // Messenger
  { category: "Messenger", title: "Demo Messenger", path: "/admin/messenger", description: "Alert + AI report inbox with inline actions", permission: "lark.read" },
  { category: "Messenger", title: "Lark Integration", path: "/admin/lark", description: "Channel registry & mock notify", permission: "lark.read" },
  { category: "Messenger", title: "Escalation Routes", path: "/admin/escalation", description: "Severity → team → SLA paths; catch-all ESC-DEFAULT + coefficients; skill binds one path", permission: "escalation.read" },

  // Org
  { category: "Org", title: "BU and Teams", path: "/admin/departments", description: "Combined hub: Risk / Ops / AI / System BUs with nested on-call teams (editable mission / rotation)", permission: "teams.read" },
  { category: "Org", title: "Teams (redirect)", path: "/admin/teams", description: "Redirects to combined BU and Teams hub", permission: "teams.read" },
  { category: "Org", title: "Roles & Permissions (editable)", path: "/admin/roles", description: "Editable RBAC matrix — name, description, BU, permission pills; users.manage; AI blocked", permission: "users.read" },
  { category: "API", title: "Roles API", path: "/api/roles", description: "GET roles + catalog; POST update_role (users.manage; AI actors forbidden)", permission: "users.read" },
  { category: "Org", title: "Roles & Permissions", path: "/admin/roles", description: "RBAC matrix plus owns / does / does-not / escalation charters", permission: "users.read" },
  { category: "Org", title: "Users", path: "/admin/users", description: "User directory", permission: "users.read" },
  { category: "API", title: "Org API", path: "/api/org", description: "Departments + teams read; update_team for mission / on-call", permission: "teams.read" },

  // System
  { category: "System", title: "Data Sources", path: "/admin/data-sources", description: "Internal/external source registry", permission: "sources.read" },
  { category: "System", title: "Audit Log", path: "/admin/audit", description: "Immutable admin audit trail", permission: "audit.read" },
  { category: "System", title: "Platform Settings", path: "/admin/settings", description: "Feature flags & thresholds", permission: "settings.manage" },

  // Docs
  { category: "Docs", title: "TSD", path: "/admin/docs/tsd", description: "Technical Specification Design (EN/ZH)", permission: "admin.access" },
  { category: "Docs", title: "PRD", path: "/admin/docs/prd", description: "Product Requirements (EN/ZH)", permission: "admin.access" },
  { category: "Docs", title: "User Guide", path: "/admin/docs/user-guide", description: "Operator handbook (EN/ZH)", permission: "admin.access" },
  { category: "Docs", title: "UAT Checklist", path: "/admin/docs/uat", description: "Risk Owner UAT pack", permission: "admin.access" },
  { category: "Docs", title: "Improvement Roadmap", path: "/admin/docs/roadmap", description: "RM-01…15 cards: today / build / done-when / skip risk", permission: "admin.access" },
  { category: "Docs", title: "Ecosystem Adoption", path: "/admin/docs/ecosystem", description: "Foundations, people, budget, risks", permission: "admin.access" },
  { category: "Docs", title: "Open Issues", path: "/admin/docs/open-issues", description: "Checklist of open programme issues — ETA, responsible BU, dependencies (tentative through 2027)", permission: "admin.access" },
  { category: "Docs", title: "Progress Tracker", path: "/admin/docs/progress", description: "Interactive board: X=issues, Y=timeline now→end-2027, status + BU labels", permission: "admin.access" },
  { category: "Docs", title: "URL Catalog", path: "/admin/docs/urls", description: "This page — all admin/API/DB paths", permission: "admin.access" },

  // APIs
  { category: "API", title: "AI API", path: "/api/ai", description: "GET analyses · POST analyze/simulate/backfill challenges" },
  { category: "API", title: "AI improve chat", path: "/api/ai-improve", description: "GET/POST how-to-improve review · pull data / add fact / challenge / regenerate / accept" },
  { category: "API", title: "Desk selection chat", path: "/api/ai-chat", description: "POST selected text + follow-ups → grounded CRMP explanation" },
  { category: "API", title: "AI Admin API", path: "/api/ai-admin", description: "Propose/approve settings, training, feedback" },
  { category: "API", title: "Messenger API", path: "/api/messenger", description: "GET threads · POST evidence/chat/escalate/dismiss/close/recommend/confirm/checker" },
  { category: "API", title: "Lark API", path: "/api/lark", description: "Channel management & test notify" },
  { category: "API", title: "Market Intel API", path: "/api/market-intel", description: "Scan / findings / outbox" },
  { category: "API", title: "Monitor API", path: "/api/monitor", description: "Indicators, alerts, sync" },
  { category: "API", title: "Detectors API", path: "/api/detectors", description: "Detector CRUD / run" },
  { category: "API", title: "Escalation API", path: "/api/escalation", description: "Escalation routes" },
  { category: "API", title: "Interventions API", path: "/api/interventions", description: "Human gates approve/reject" },
  { category: "API", title: "Spine API", path: "/api/spine", description: "Spine event feed" },
  { category: "API", title: "Skills API", path: "/api/skills", description: "AI skills & scenarios" },
  { category: "API", title: "RAG API", path: "/api/rag", description: "RAG corpus" },
  { category: "API", title: "Risk Log API", path: "/api/risk-log", description: "Risk analytics feed" },
  { category: "API", title: "Dashboard API", path: "/api/dashboard", description: "Daily performance metrics" },
  { category: "API", title: "Data Sources API", path: "/api/data-sources", description: "Source registry" },
  { category: "API", title: "Docs API", path: "/api/docs", description: "GET/PUT/DELETE admin document overlays (markdown + structured UAT/roadmap/URLs)" },
  { category: "API", title: "Settings API", path: "/api/settings", description: "Platform settings" },
  { category: "API", title: "Users API", path: "/api/users", description: "User directory mutations" },

  // Data — file
  {
    category: "Data",
    title: "SQLite DB (local file)",
    path: "platform/data/vantage_risk.db",
    description: "Prototype persistence (filesystem path, not HTTP). Reset: npm run db:reset",
  },

  // Data — core tables
  { category: "DB Tables", title: "users / sessions", path: "tables:users,sessions", description: "Auth directory + session cookies" },
  { category: "DB Tables", title: "roles / departments / teams", path: "tables:roles,departments,teams", description: "RBAC + org structure" },
  { category: "DB Tables", title: "monitor_indicators / alerts / tickets", path: "tables:monitor_*", description: "Monitor 2.0 registry and open alerts" },
  { category: "DB Tables", title: "detectors / detector_runs", path: "tables:detectors,detector_runs", description: "Threshold sampling engine" },
  { category: "DB Tables", title: "ai_analyses / evidence / challenges / improvements", path: "tables:ai_analyses,ai_analysis_evidence,ai_analysis_challenges,ai_improvement_reviews", description: "Primary RCA + second-AI packs + how-to-improve reviews" },
  { category: "DB Tables", title: "ai_skills / skill_runs / scenario_chains", path: "tables:ai_skills,ai_skill_runs,risk_scenario_chains", description: "Playbooks and multi-indicator chains" },
  { category: "DB Tables", title: "rag_documents / external_macro_events", path: "tables:rag_documents,external_macro_events", description: "Evidence corpus" },
  { category: "DB Tables", title: "messenger_*", path: "tables:messenger_threads,messenger_messages,messenger_pending_actions", description: "Demo Messenger inbox + pending controls" },
  { category: "DB Tables", title: "lark_channels / escalation_routes", path: "tables:lark_channels,escalation_routes", description: "Channel registry and severity paths" },
  { category: "DB Tables", title: "interventions / spine_events", path: "tables:interventions,spine_events", description: "Human gates and end-to-end spine" },
  { category: "DB Tables", title: "ai_change_requests / training / feedback", path: "tables:ai_change_requests,ai_training_runs,ai_feedback,ai_accuracy_snapshots", description: "AI Admin maker/checker + quality" },
  { category: "DB Tables", title: "market_intel_*", path: "tables:market_intel_sources,findings,scans,lark_outbox", description: "Market intelligence scanner + outbox" },
  { category: "DB Tables", title: "daily_performance / alert_impacts / risk_log_daily", path: "tables:daily_performance,alert_impacts,risk_log_daily", description: "Dashboard + risk-log analytics + 90-day historical series" },
  { category: "DB Tables", title: "audit_logs / platform_settings / data_sources", path: "tables:audit_logs,platform_settings,data_sources", description: "Audit trail, flags, source registry" },
  { category: "DB Tables", title: "admin_doc_edits", path: "tables:admin_doc_edits", description: "In-admin edits to TSD/PRD/UG/Ecosystem/UAT/Roadmap/URL catalog overlays" },
];
