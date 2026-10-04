import {
  Activity,
  Bell,
  BookOpen,
  Brain,
  Building2,
  CircuitBoard,
  ClipboardCheck,
  Compass,
  Database,
  FileText,
  GitBranch,
  Globe2,
  LayoutDashboard,
  Library,
  LineChart,
  ListTree,
  Lock,
  MessageSquare,
  MessagesSquare,
  Network,
  Radio,
  ScrollText,
  Settings,
  Shield,
  SlidersHorizontal,
  Sparkles,
  UserCheck,
  Users,
  Waypoints,
  Workflow,
} from "lucide-react";

export type NavGroupId =
  | "overview"
  | "monitor"
  | "ai"
  | "response"
  | "org"
  | "platform"
  | "docs";

export const NAV_GROUPS: Array<{ id: NavGroupId; en: string; "zh-Hant": string }> = [
  { id: "overview", en: "Overview", "zh-Hant": "總覽" },
  { id: "monitor", en: "Monitor & risk", "zh-Hant": "監控與風險" },
  { id: "ai", en: "AI & knowledge", "zh-Hant": "AI 與知識" },
  { id: "response", en: "Response", "zh-Hant": "應變" },
  { id: "org", en: "Organisation", "zh-Hant": "組織" },
  { id: "platform", en: "Platform", "zh-Hant": "平台" },
  { id: "docs", en: "Docs", "zh-Hant": "文件" },
];

/**
 * Left-pane order follows the desk workflow:
 * see the day → detect → understand → act → org → platform → docs.
 */
export const NAV_ITEMS = [
  { href: "/admin", label: "Admin Home", icon: LayoutDashboard, permission: "admin.access", group: "overview" },

  { href: "/admin/dashboard", label: "Daily Performance", icon: LineChart, permission: "dashboard.read", group: "monitor" },
  { href: "/admin/monitor-2", label: "Monitor 2.0", icon: Activity, permission: "monitor.read", group: "monitor" },
  { href: "/admin/detectors", label: "Detectors", icon: CircuitBoard, permission: "detectors.read", group: "monitor" },
  { href: "/admin/alerts", label: "Live Alerts", icon: Bell, permission: "monitor.read", group: "monitor" },
  { href: "/admin/market-intel", label: "Market Intelligence", icon: Radio, permission: "monitor.read", group: "monitor" },
  { href: "/admin/risk-log", label: "Risk Log Analytics", icon: ScrollText, permission: "monitor.read", group: "monitor" },
  { href: "/admin/risk-domains", label: "Risk Domains", icon: Waypoints, permission: "monitor.read", group: "monitor" },

  { href: "/admin/ai-analyses", label: "AI Analyses", icon: Brain, permission: "ai.read", group: "ai" },
  { href: "/admin/skills", label: "AI Skills", icon: Sparkles, permission: "skills.read", group: "ai" },
  { href: "/admin/knowledge-tree", label: "Knowledge Tree", icon: Network, permission: "rag.read", group: "ai" },
  { href: "/admin/rag", label: "RAG Knowledge Base", icon: Library, permission: "rag.read", group: "ai" },
  { href: "/admin/ai-admin", label: "AI Admin", icon: SlidersHorizontal, permission: "ai.admin", group: "ai" },

  { href: "/admin/messenger", label: "Demo Messenger", icon: MessagesSquare, permission: "lark.read", group: "response" },
  { href: "/admin/interventions", label: "Human Intervention", icon: UserCheck, permission: "intervene.operate", group: "response" },
  { href: "/admin/escalation", label: "Escalation Routes", icon: GitBranch, permission: "escalation.read", group: "response" },
  { href: "/admin/lark", label: "Lark Integration", icon: MessageSquare, permission: "lark.read", group: "response" },
  { href: "/admin/spine", label: "Spine Log", icon: Workflow, permission: "spine.read", group: "response" },

  { href: "/admin/departments", label: "Departments", icon: Building2, permission: "teams.read", group: "org" },
  { href: "/admin/teams", label: "Teams", icon: Users, permission: "teams.read", group: "org" },
  { href: "/admin/users", label: "Users", icon: Users, permission: "users.read", group: "org" },
  { href: "/admin/roles", label: "Roles & Permissions", icon: Shield, permission: "users.read", group: "org" },

  { href: "/admin/data-sources", label: "Data Sources", icon: Database, permission: "sources.read", group: "platform" },
  { href: "/admin/settings", label: "Platform Settings", icon: Settings, permission: "settings.manage", group: "platform" },
  { href: "/admin/audit", label: "Audit Log", icon: BookOpen, permission: "audit.read", group: "platform" },
  { href: "/admin/security/ai-access", label: "AI Access Security", icon: Lock, permission: "audit.read", group: "platform" },

  { href: "/admin/docs/user-guide", label: "User Guide", icon: BookOpen, permission: "admin.access", group: "docs" },
  { href: "/admin/docs/urls", label: "URL Catalog", icon: ListTree, permission: "admin.access", group: "docs" },
  { href: "/admin/docs/uat", label: "UAT Checklist", icon: ClipboardCheck, permission: "admin.access", group: "docs" },
  { href: "/admin/docs/prd", label: "PRD", icon: FileText, permission: "admin.access", group: "docs" },
  { href: "/admin/docs/tsd", label: "TSD", icon: FileText, permission: "admin.access", group: "docs" },
  { href: "/admin/docs/roadmap", label: "Improvement Roadmap", icon: Compass, permission: "admin.access", group: "docs" },
  { href: "/admin/docs/ecosystem", label: "Ecosystem Eval", icon: Globe2, permission: "admin.access", group: "docs" },
] as const;
