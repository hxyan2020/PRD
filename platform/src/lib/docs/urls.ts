export type UrlEntry = {
  category: string;
  title: string;
  path: string;
  description: string;
  permission?: string;
};

export const PLATFORM_URLS: UrlEntry[] = [
  { category: "Auth", title: "Login", path: "/login", description: "Credential login for CRMP Admin" },
  { category: "Home", title: "Admin Home", path: "/admin", description: "Control-plane overview & department RACI", permission: "admin.access" },
  { category: "Risk", title: "Daily Performance", path: "/admin/dashboard", description: "PnL / exposure performance board", permission: "dashboard.read" },
  { category: "Risk", title: "Risk Log Analytics", path: "/admin/risk-log", description: "Timeline of risk events & BU corrections", permission: "monitor.read" },
  { category: "Risk", title: "Market Intelligence", path: "/admin/market-intel", description: "5-min news/social scan + messenger outbox", permission: "monitor.read" },
  { category: "Risk", title: "Detectors", path: "/admin/detectors", description: "Threshold detectors that raise Monitor alarms", permission: "detectors.read" },
  { category: "Risk", title: "Live Alerts", path: "/admin/alerts", description: "Open Monitor 2.0 alerts", permission: "monitor.read" },
  { category: "Risk", title: "Monitor 2.0", path: "/admin/monitor-2", description: "Indicator registry & sync", permission: "monitor.read" },
  { category: "Risk", title: "Risk Domains", path: "/admin/risk-domains", description: "CFD + Crypto domain catalogue", permission: "monitor.read" },
  { category: "AI", title: "AI Analyses", path: "/admin/ai-analyses", description: "Primary RCA + second-AI challenger", permission: "ai.read" },
  { category: "AI", title: "AI Admin", path: "/admin/ai-admin", description: "Maker/checker config for AI settings & models", permission: "ai.admin" },
  { category: "AI", title: "Human Intervention", path: "/admin/interventions", description: "Human gates from skill/RAG actions", permission: "intervene.operate" },
  { category: "AI", title: "Spine Log", path: "/admin/spine", description: "End-to-end event spine", permission: "spine.read" },
  { category: "AI", title: "RAG Knowledge Base", path: "/admin/rag", description: "Internal + external evidence corpus", permission: "rag.read" },
  { category: "AI", title: "AI Skills", path: "/admin/skills", description: "Playbooks & enriched risk scenarios", permission: "skills.read" },
  { category: "AI", title: "AI Access Security", path: "/admin/security/ai-access", description: "Human-only pages/functions/fields blocklist", permission: "audit.read" },
  { category: "Messenger", title: "Demo Messenger", path: "/admin/messenger", description: "Interactive alert/AI chat with inline actions", permission: "lark.read" },
  { category: "Messenger", title: "Lark Integration", path: "/admin/lark", description: "Channel registry & mock notify", permission: "lark.read" },
  { category: "Messenger", title: "Escalation Routes", path: "/admin/escalation", description: "Severity → team → SLA paths", permission: "escalation.read" },
  { category: "Org", title: "Departments", path: "/admin/departments", description: "Risk / Ops / AI / System", permission: "teams.read" },
  { category: "Org", title: "Teams", path: "/admin/teams", description: "On-call teams", permission: "teams.read" },
  { category: "Org", title: "Roles & Permissions", path: "/admin/roles", description: "RBAC matrix", permission: "users.read" },
  { category: "Org", title: "Users", path: "/admin/users", description: "User directory", permission: "users.read" },
  { category: "System", title: "Data Sources", path: "/admin/data-sources", description: "Internal/external source registry", permission: "sources.read" },
  { category: "System", title: "Audit Log", path: "/admin/audit", description: "Immutable admin audit trail", permission: "audit.read" },
  { category: "System", title: "Platform Settings", path: "/admin/settings", description: "Feature flags & thresholds", permission: "settings.manage" },
  { category: "Docs", title: "TSD", path: "/admin/docs/tsd", description: "Technical Specification Design (EN/ZH)", permission: "admin.access" },
  { category: "Docs", title: "PRD", path: "/admin/docs/prd", description: "Product Requirements (EN/ZH)", permission: "admin.access" },
  { category: "Docs", title: "User Guide", path: "/admin/docs/user-guide", description: "Operator handbook (EN/ZH)", permission: "admin.access" },
  { category: "Docs", title: "UAT Checklist", path: "/admin/docs/uat", description: "Risk Owner UAT pack", permission: "admin.access" },
  { category: "Docs", title: "Ecosystem Adoption", path: "/admin/docs/ecosystem", description: "Foundations, people, budget, risks", permission: "admin.access" },
  { category: "Docs", title: "Improvement Roadmap", path: "/admin/docs/roadmap", description: "Next-wave platform improvements", permission: "admin.access" },
  { category: "Docs", title: "URL Catalog", path: "/admin/docs/urls", description: "This page — all admin/API URLs", permission: "admin.access" },
  { category: "API", title: "AI API", path: "/api/ai", description: "GET analyses · POST analyze/simulate/backfill challenges" },
  { category: "API", title: "Messenger API", path: "/api/messenger", description: "GET threads · POST escalate/dismiss/close/actions" },
  { category: "API", title: "Lark API", path: "/api/lark", description: "Channel management & test notify" },
  { category: "API", title: "Market Intel API", path: "/api/market-intel", description: "Scan / findings / outbox" },
  { category: "API", title: "Auth Login", path: "/api/auth/login", description: "POST email/password → session cookie" },
  { category: "Data", title: "SQLite DB (local)", path: "platform/data/vantage_risk.db", description: "Prototype persistence (file path, not HTTP)" },
];
