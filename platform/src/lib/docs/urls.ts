import {
  ORIGINAL_CRMP_ADMIN_URL,
  ORIGINAL_CRMP_MESSENGER_URL,
  ORIGINAL_CRMP_ORIGIN,
  PUBLIC_ADMIN_ORIGIN,
  PUBLIC_ADMIN_URL,
  PUBLIC_CS_DESK_URL,
  PUBLIC_CS_PORTAL_URL,
  PUBLIC_MESSENGER_URL,
} from "@/lib/platform-site";

export type UrlEntry = {
  category: string;
  title: string;
  path: string;
  description: string;
  permission?: string;
};

export {
  ORIGINAL_CRMP_ADMIN_URL,
  ORIGINAL_CRMP_MESSENGER_URL,
  ORIGINAL_CRMP_ORIGIN,
  PUBLIC_ADMIN_ORIGIN,
  PUBLIC_ADMIN_URL,
  PUBLIC_CS_DESK_URL,
  PUBLIC_CS_PORTAL_URL,
  PUBLIC_MESSENGER_URL,
};

export const PLATFORM_URLS: UrlEntry[] = [
  {
    category: "Public",
    title: "CRMP Plus (this platform)",
    path: PUBLIC_ADMIN_URL,
    description: "Permanent GitHub Pages URL for the upgraded CRMP platform (original spine + 24/7 CS/TR). Future requirements land only here.",
  },
  {
    category: "Public",
    title: "CRMP Plus Messenger",
    path: PUBLIC_MESSENGER_URL,
    description: "Permanent Lark-style messenger demo on CRMP Plus",
  },
  {
    category: "Public",
    title: "CRMP Plus CS / TR Desk",
    path: PUBLIC_CS_DESK_URL,
    description: "Permanent 24/7 CS/TR intake desk on CRMP Plus",
  },
  {
    category: "Public",
    title: "CRMP Plus CS client portal",
    path: PUBLIC_CS_PORTAL_URL,
    description: "Client-facing C1 live chat, submission form and official mailbox — same POST /api/cs/intake as the desk",
  },
  {
    category: "Public",
    title: "Original CRMP Admin (frozen)",
    path: ORIGINAL_CRMP_ADMIN_URL,
    description: "Original CRMP Admin snapshot — left intact at /PRD/crmp-admin/. This codebase does not overwrite it.",
  },

  // Auth
  { category: "Public", title: "CS client portal", path: "/cs", description: "Client-facing C1 live chat, website form and official email into POST /api/cs/intake; replies with CSR-XXXX close the auto-email wait loop" },
  { category: "Auth", title: "Login", path: "/login", description: "Full-page credential login (bookmark). Prefer /admin/login from the desk." },
  { category: "Auth", title: "Admin Login", path: "/admin/login", description: "Sign in inside the admin shell — never 404s on GitHub Pages" },
  { category: "API", title: "Auth Login", path: "/api/auth/login", description: "POST email/password → session cookie" },
  { category: "API", title: "Auth Me", path: "/api/auth/me", description: "GET current session user" },
  { category: "API", title: "Auth Logout", path: "/api/auth/logout", description: "POST clear session cookie" },

  // Home
  { category: "Home", title: "Admin Home", path: "/admin", description: "Control-plane overview, dummy spine buttons (single alert or linked group walk DETECT→close), stats, expandable alert tracker, and home spine with stage ticket counts (Spine Log tab removed)", permission: "admin.access" },

  // Risk
  { category: "Risk", title: "Daily Performance", path: "/admin/dashboard", description: "PnL / exposure performance board", permission: "dashboard.read" },
  { category: "Risk", title: "Risk Log Analytics", path: "/admin/risk-log", description: "Closed tracker packs + 90-day historical charts (alerts/open book, loss vs prevented, latency) + timeline", permission: "monitor.read" },
  { category: "Risk", title: "Market Intelligence", path: "/admin/market-intel", description: "5-min news/social scan + messenger outbox", permission: "monitor.read" },
  { category: "Risk", title: "Monitor 2.0", path: "/admin/monitor-2", description: "Unified indicator + detector registry (Run all / Sync / Pause / recent runs); alerts & tickets live on Realtime Alert & Tracker; deep-link targets for M2-* codes", permission: "monitor.read" },
  { category: "Risk", title: "Detectors (redirect)", path: "/admin/detectors", description: "Not in left nav — redirects to Monitor 2.0 (detectors merged into indicator registry)", permission: "detectors.read" },
  { category: "Risk", title: "Realtime Alert & Tracker", path: "/admin/alerts", description: "Open Monitor 2.0 tickets only + grouped AI pipeline controls (rank note) + AI RCA; M2-* MonitorCode tooltips/links; closed tickets → Risk Log; AI Analyses list redirects here", permission: "monitor.read" },
  { category: "Risk", title: "Risk Domains", path: "/admin/risk-domains", description: "CFD + Crypto domains with P0–P3 scenarios linked to Monitor 2.0 (M2-* chips)", permission: "monitor.read" },

  // AI
  { category: "AI", title: "AI Analyses (redirect)", path: "/admin/ai-analyses", description: "Redirects to Realtime Alert & Tracker", permission: "ai.read" },
  { category: "AI", title: "AI Analysis Detail", path: "/admin/ai-analyses/[id]", description: "Single analysis pack + AiChallengePanel", permission: "ai.read" },
  { category: "AI", title: "AI Admin", path: "/admin/ai-admin", description: "First-line + second-line AI Admin cards, maker/checker, propose_rag, training & accuracy", permission: "ai.admin" },
  { category: "AI", title: "Spine (redirect → Home)", path: "/admin/spine", description: "Not in left nav — redirects to Admin Home; stage ticket counts live on the home spine viz (Spine Log tab removed)", permission: "spine.read" },
  { category: "AI", title: "RAG Knowledge Base", path: "/admin/rag", description: "Internal + external evidence corpus — AI write blocked (human-gate: pages AI cannot edit escalate to human / propose_rag maker-checker)", permission: "rag.read" },
  { category: "AI", title: "AI Skills", path: "/admin/skills", description: "Playbooks & enriched risk scenarios — Enter opens the full SKILL.md page; each skill binds one escalation path (ESC-DEFAULT fallback)", permission: "skills.read" },
  { category: "AI", title: "Skill playbook detail", path: "/admin/skills/[code]", description: "Full when-to-use / prechecks / evidence / stop / success playbook for one skill", permission: "skills.read" },
  { category: "AI", title: "Knowledge Tree", path: "/admin/knowledge-tree", description: "Visual map of domains (incl. CS_SERVICE / TRADING_EXEC), dedicated CS/TR skills, linked timelines and RAG document leaves with deep links", permission: "rag.read" },
  { category: "AI", title: "AI Access Security", path: "/admin/security/ai-access", description: "Human-only pages/functions/fields blocklist (includes FN-RAG-WRITE / propose_rag only)", permission: "audit.read" },

  // Response (messenger / intervention / escalation)
  { category: "Messenger", title: "Demo Messenger", path: "/admin/messenger", description: "Alert + AI report inbox; chat windows split by POC on the escalation path (bird-eye relay); evidence, chat, escalate, dismiss, close, controls", permission: "lark.read" },
  { category: "Messenger", title: "CS / TR Desk", path: "/admin/cs-desk", description: "24/7 CS + Trading intake: public /cs portal plus C1 live chat, web form and official email via POST /api/cs/intake; replies match CSR-XXXX / channel_ref; AI stamps dedicated SKILL.md playbooks, emails when unclear or ID is needed and waits for a reply (max 3)", permission: "cs.read" },
  { category: "Messenger", title: "Human Intervention", path: "/admin/interventions", description: "Checker desk for runtime controls — samples show actioner email; decisions write spine + audit (CRMP plane)", permission: "intervene.operate" },
  { category: "Messenger", title: "Lark Integration", path: "/admin/lark", description: "Channel registry & mock notify", permission: "lark.read" },
  { category: "Messenger", title: "Escalation Routes", path: "/admin/escalation", description: "Dimension-defined paths (severity, teams, scenario, pending time, need-human) × editable coefficients; ESC-DEFAULT catch-all; skill binds one route code; no separate Path name column", permission: "escalation.read" },

  // Org
  { category: "Org", title: "BU and Teams", path: "/admin/departments", description: "Combined hub: Risk / Ops / AI / System / CS / TR BUs with nested on-call teams (editable mission / rotation); former Departments + Teams", permission: "teams.read" },
  { category: "Org", title: "Teams (redirect)", path: "/admin/teams", description: "Redirects to combined BU and Teams hub", permission: "teams.read" },
  { category: "Org", title: "Roles & Permissions (editable)", path: "/admin/roles", description: "Editable RBAC matrix — name, description, BU, permission pills + owns/does/does-not/escalation charters; POST /api/roles; users.manage; AI blocked", permission: "users.read" },
  { category: "API", title: "Roles API", path: "/api/roles", description: "GET roles + catalog; POST update_role (users.manage; AI actors forbidden)", permission: "users.read" },
  { category: "Org", title: "Users", path: "/admin/users", description: "User directory", permission: "users.read" },
  { category: "API", title: "Org API", path: "/api/org", description: "Departments + teams read; update_team for mission / on-call", permission: "teams.read" },

  // System
  { category: "System", title: "Data Sources", path: "/admin/data-sources", description: "Internal/external source registry", permission: "sources.read" },
  { category: "System", title: "Audit Log", path: "/admin/audit", description: "Two tabs — CRMP logs (alerts/AI/skills/escalation/interventions/messenger) and Vantage Markets Admin logs (rights, transaction pulls, Lark, BU POC responses, settings/org/RAG); Roll back via before-state snapshot", permission: "audit.read" },
  { category: "API", title: "Audit Rollback API", path: "/api/audit/rollback", description: "POST { audit_id } restores before-state snapshot when available (audit.read + manage)", permission: "audit.read" },
  { category: "System", title: "Platform Settings", path: "/admin/settings", description: "Feature flags & thresholds", permission: "settings.manage" },

  // Docs
  { category: "Docs", title: "TSD", path: "/admin/docs/tsd", description: "Technical Specification Design (EN/ZH)", permission: "admin.access" },
  { category: "Docs", title: "PRD", path: "/admin/docs/prd", description: "Product Requirements (EN/ZH)", permission: "admin.access" },
  { category: "Docs", title: "User Guide", path: "/admin/docs/user-guide", description: "Operator handbook (EN/ZH)", permission: "admin.access" },
  { category: "Docs", title: "UAT Checklist", path: "/admin/docs/uat", description: "Risk Owner UAT pack", permission: "admin.access" },
  { category: "Docs", title: "Improvement Roadmap", path: "/admin/docs/roadmap", description: "RM-01…15 cards: today / build / done-when / skip risk", permission: "admin.access" },
  { category: "Docs", title: "Ecosystem Adoption", path: "/admin/docs/ecosystem", description: "Foundations, people, budget, risks", permission: "admin.access" },
  { category: "Docs", title: "Open Issues", path: "/admin/docs/open-issues", description: "20-issue checklist by BU (AI, System, RO, Pricing, Ops, Monitor, GRC, Product, CS, TR) — ETA, dependencies, detailed ticks; includes C1/form/mailbox connectors and CS/TR ID vault", permission: "admin.access" },
  { category: "Docs", title: "Progress Tracker", path: "/admin/docs/progress", description: "X = open issues (columns), Y = timeline now→end-2027 (rows); status colours; responsible BU on every column", permission: "admin.access" },
  { category: "Docs", title: "URL Catalog", path: "/admin/docs/urls", description: "This page — all admin/API/DB paths", permission: "admin.access" },

  // APIs
  { category: "API", title: "AI API", path: "/api/ai", description: "GET analyses · POST analyze/simulate/dummy_spine (home dummy alert or group, auto-walk to closure)/backfill challenges" },
  { category: "API", title: "AI improve chat", path: "/api/ai-improve", description: "GET/POST how-to-improve review · pull data / add fact / challenge / regenerate / accept" },
  { category: "API", title: "Desk selection chat", path: "/api/ai-chat", description: "POST selected text + follow-ups → grounded CRMP explanation" },
  { category: "API", title: "AI Admin API", path: "/api/ai-admin", description: "Propose/approve settings, training, feedback" },
  { category: "API", title: "Messenger API", path: "/api/messenger", description: "GET threads · POST evidence/chat/escalate/dismiss/close/recommend/confirm/checker" },
  { category: "API", title: "CS / TR Desk API", path: "/api/cs", description: "GET inbox · POST triage / followup / client_reply / reply / assign_tr / escalate_risk / resolve / simulate_c1|form|email" },
  { category: "API", title: "CS intake webhook", path: "/api/cs/intake", description: "GET connector catalog / ticket status · POST C1 live chat, web form and official-email ingest or continue (request_id / in_reply_to / channel_ref / CSR-XXXX) — session, mock_webhook, portal, or header x-cs-intake-token: demo-c1" },
  { category: "API", title: "Lark API", path: "/api/lark", description: "Channel management & test notify" },
  { category: "API", title: "Market Intel API", path: "/api/market-intel", description: "Scan / findings / outbox" },
  { category: "API", title: "Monitor API", path: "/api/monitor", description: "Indicators + detectors: run_detectors, toggle_pause, threshold edit, sync" },
  { category: "API", title: "Detectors API", path: "/api/detectors", description: "Legacy detector CRUD / run (UI lives on Monitor 2.0)" },
  { category: "API", title: "Escalation API", path: "/api/escalation", description: "Routes CRUD + dimension coefficients + ESC-DEFAULT; probe match for domain/severity" },
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
  { category: "DB Tables", title: "detectors / detector_runs", path: "tables:detectors,detector_runs", description: "Threshold sampling engine — UI joined on Monitor 2.0 (no Detectors left-nav)" },
  { category: "DB Tables", title: "ai_analyses / evidence / challenges / improvements", path: "tables:ai_analyses,ai_analysis_evidence,ai_analysis_challenges,ai_improvement_reviews", description: "Primary RCA + second-AI packs + how-to-improve reviews" },
  { category: "DB Tables", title: "ai_skills / skill_runs / scenario_chains", path: "tables:ai_skills,ai_skill_runs,risk_scenario_chains", description: "Playbooks and multi-indicator chains" },
  { category: "DB Tables", title: "rag_documents / external_macro_events", path: "tables:rag_documents,external_macro_events", description: "Evidence corpus" },
  { category: "DB Tables", title: "messenger_*", path: "tables:messenger_threads,messenger_messages,messenger_pending_actions", description: "Demo Messenger inbox + pending controls" },
  { category: "DB Tables", title: "cs_*", path: "tables:cs_channels,cs_requests,cs_messages,cs_followups", description: "CS/TR intake channels, requests (incl. skill_code), transcript, auto-email follow-ups waiting for client reply" },
  { category: "DB Tables", title: "lark_channels / escalation_routes", path: "tables:lark_channels,escalation_routes", description: "Channel registry; routes with route_code, is_default, coefficients_json, risk_scenario, involved_teams, pending threshold (ESC-DEFAULT)" },
  { category: "DB Tables", title: "interventions / spine_events", path: "tables:interventions,spine_events", description: "Human gates and end-to-end spine" },
  { category: "DB Tables", title: "ai_change_requests / training / feedback", path: "tables:ai_change_requests,ai_training_runs,ai_feedback,ai_accuracy_snapshots", description: "AI Admin maker/checker + quality" },
  { category: "DB Tables", title: "market_intel_*", path: "tables:market_intel_sources,findings,scans,lark_outbox", description: "Market intelligence scanner + outbox" },
  { category: "DB Tables", title: "daily_performance / alert_impacts / risk_log_daily", path: "tables:daily_performance,alert_impacts,risk_log_daily", description: "Dashboard + risk-log analytics + 90-day historical series" },
  { category: "DB Tables", title: "audit_logs / platform_settings / data_sources", path: "tables:audit_logs,platform_settings,data_sources", description: "Audit trail (details_json.plane crmp|vantage + before-state for Roll back), grouped flags, source registry" },
  { category: "DB Tables", title: "admin_doc_edits", path: "tables:admin_doc_edits", description: "In-admin edits to TSD/PRD/UG/Ecosystem/UAT/Roadmap/URL catalog overlays" },
];
