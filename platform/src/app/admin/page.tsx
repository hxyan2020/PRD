import Link from "next/link";
import {
  Bell,
  BookOpen,
  Brain,
  ChevronRight,
  CircuitBoard,
  Database,
  FileText,
  GitBranch,
  LineChart,
  MessageSquare,
  MessagesSquare,
  Network,
  Radio,
  Settings,
  Sparkles,
  Ticket,
  UserCheck,
  Users,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import { getDb } from "@/lib/db";
import { StatCard, SeverityBadge, StatusBadge, DeptBadge } from "@/components/ui";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { T } from "@/components/T";
import { ActionLabel } from "@/components/ActionLabel";
import { EnZh } from "@/components/EnZh";
import { Phrase } from "@/components/Phrase";
import { SignInOwnerCard } from "@/components/SignInOwnerCard";
import { PUBLIC_MESSENGER_URL } from "@/lib/static-export";
import { cn } from "@/lib/utils";

const DEPT_DEST: Record<
  string,
  { href: string; en: string; zh: string; stripe: string }
> = {
  RISK_CONTROL: { href: "/admin/alerts", en: "Live Alerts", zh: "即時警報", stripe: "bg-teal-600" },
  OPERATIONS: {
    href: "/admin/interventions",
    en: "Human Intervention",
    zh: "人工干預",
    stripe: "bg-orange-500",
  },
  AI: { href: "/admin/ai-analyses", en: "AI Analyses", zh: "AI 分析", stripe: "bg-violet-600" },
  SYSTEM: { href: "/admin/settings", en: "Platform Settings", zh: "平台設定", stripe: "bg-slate-600" },
};

const JUMPS: Array<{ href: string; en: string; zh: string; icon: LucideIcon }> = [
  { href: "/admin/dashboard", en: "Daily Performance", zh: "每日績效", icon: LineChart },
  { href: "/admin/market-intel", en: "Market Intelligence", zh: "市場情報", icon: Radio },
  { href: "/admin/monitor-2", en: "Monitor 2.0", zh: "Monitor 2.0", icon: CircuitBoard },
  { href: "/admin/alerts", en: "Live Alerts", zh: "即時警報", icon: Bell },
  { href: "/admin/ai-analyses", en: "AI Analyses", zh: "AI 分析", icon: Brain },
  { href: "/admin/skills", en: "AI Skills", zh: "AI 技能", icon: Sparkles },
  { href: "/admin/knowledge-tree", en: "Knowledge Tree", zh: "知識樹", icon: Network },
  { href: "/admin/interventions", en: "Human Intervention", zh: "人工干預", icon: UserCheck },
  { href: "/admin/messenger", en: "Demo Messenger", zh: "示範 Messenger", icon: MessagesSquare },
  { href: "/admin/settings", en: "Settings", zh: "平台設定", icon: Settings },
  { href: "/admin/docs/user-guide", en: "User Guide", zh: "使用手冊", icon: BookOpen },
  { href: "/admin/docs/prd", en: "PRD", zh: "PRD", icon: FileText },
];

const SPINE: Array<{ href: string; en: string; zh: string }> = [
  { href: "/admin/monitor-2", en: "Monitor 2.0 emits indicator warning / breach", zh: "Monitor 2.0 發出指標警告／違規" },
  { href: "/admin/alerts", en: "CRMP creates / syncs ticket and attaches evidence", zh: "CRMP 建立／同步工單並附上證據" },
  { href: "/admin/escalation", en: "Escalation route selects team + Lark channel + SLA", zh: "升級路徑選定團隊＋Lark 頻道＋SLA" },
  { href: "/admin/ai-analyses", en: "AI drafts RCA; human approves intervention", zh: "AI 草擬根因；人工核准干預" },
  { href: "/admin/dashboard", en: "Audit log + daily performance dashboard", zh: "稽核日誌＋每日績效儀表板" },
];

export default async function AdminDashboardPage() {
  const db = getDb();
  const counts = {
    users: (db.prepare(`SELECT COUNT(*) AS c FROM users`).get() as { c: number }).c,
    teams: (db.prepare(`SELECT COUNT(*) AS c FROM teams`).get() as { c: number }).c,
    sources: (db.prepare(`SELECT COUNT(*) AS c FROM data_sources`).get() as { c: number }).c,
    domains: (db.prepare(`SELECT COUNT(*) AS c FROM risk_domains`).get() as { c: number }).c,
    openAlerts: (
      db.prepare(`SELECT COUNT(*) AS c FROM monitor_alerts WHERE status IN ('OPEN','ACKNOWLEDGED')`).get() as {
        c: number;
      }
    ).c,
    openTickets: (
      db.prepare(`SELECT COUNT(*) AS c FROM monitor_tickets WHERE status NOT IN ('RESOLVED','CLOSED')`).get() as {
        c: number;
      }
    ).c,
    larkChannels: (db.prepare(`SELECT COUNT(*) AS c FROM lark_channels WHERE enabled = 1`).get() as { c: number }).c,
    routes: (db.prepare(`SELECT COUNT(*) AS c FROM escalation_routes WHERE enabled = 1`).get() as { c: number }).c,
  };

  const departments = db.prepare(`SELECT * FROM departments ORDER BY id`).all() as Array<{
    code: string;
    name: string;
    description: string;
    primary_responsibilities: string;
  }>;

  const recentAlerts = db
    .prepare(
      `SELECT a.alert_id, a.severity, a.title, a.status, a.created_at, i.name AS indicator_name
       FROM monitor_alerts a
       JOIN monitor_indicators i ON i.id = a.indicator_id
       ORDER BY a.created_at DESC LIMIT 5`
    )
    .all() as Array<{
    alert_id: string;
    severity: string;
    title: string;
    status: string;
    created_at: string;
    indicator_name: string;
  }>;

  const openCta = <T k="home.open" />;

  const actions = (
    <>
      <Link className="btn" href="/admin/messenger">
        <ActionLabel href="/admin/messenger" />
      </Link>
      <Link className="btn" href="/admin/docs/user-guide">
        <ActionLabel href="/admin/docs/user-guide" />
      </Link>
      <Link className="btn btn-primary" href="/admin/dashboard">
        <ActionLabel href="/admin/dashboard" />
      </Link>
    </>
  );

  return (
    <div>
      <AdminPageHeader pageKey="home" actions={actions} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 mb-4">
        <SignInOwnerCard />

        <Link
          href="/admin/messenger"
          className="panel card-link group relative overflow-hidden p-4 bg-gradient-to-br from-teal-50 via-white to-white"
        >
          <div className="absolute left-0 top-0 h-full w-1 bg-teal-600" aria-hidden />
          <div className="flex items-start justify-between gap-3 pl-2">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-teal-800">
                <MessagesSquare className="h-3.5 w-3.5" aria-hidden />
                <EnZh en="Messenger demo" zh="Messenger 示範" />
              </div>
              <div className="font-semibold mt-1">
                <T k="home.larkDemo" />
              </div>
              <p className="text-xs text-[var(--muted)] mt-2 break-all">
                <EnZh en="Permanent URL" zh="永久網址" />
                {": "}
                {PUBLIC_MESSENGER_URL}
              </p>
              <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-teal-800">
                <T k="home.larkDemoCta" />
                <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
              </div>
            </div>
            <span className="hidden sm:inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white">
              <MessagesSquare className="h-5 w-5" aria-hidden />
            </span>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-3">
        <StatCard
          href="/admin/users"
          icon={Users}
          label={<T k="home.stat.users" />}
          value={counts.users}
          hint={<T k="home.stat.usersHint" />}
          cta={openCta}
        />
        <StatCard
          href="/admin/teams"
          icon={Users}
          label={<T k="home.stat.teams" />}
          value={counts.teams}
          hint={<T k="home.stat.teamsHint" />}
          cta={openCta}
        />
        <StatCard
          href="/admin/data-sources"
          icon={Database}
          label={<T k="home.stat.sources" />}
          value={counts.sources}
          hint={<T k="home.stat.sourcesHint" />}
          cta={openCta}
        />
        <StatCard
          href="/admin/risk-domains"
          icon={Waypoints}
          label={<T k="home.stat.domains" />}
          value={counts.domains}
          hint={<T k="home.stat.domainsHint" />}
          cta={openCta}
        />
        <StatCard
          href="/admin/alerts"
          icon={Bell}
          tone={counts.openAlerts > 0 ? "alert" : "default"}
          label={<T k="home.stat.openAlerts" />}
          value={counts.openAlerts}
          hint={<T k="home.stat.openAlertsHint" />}
          cta={openCta}
        />
        <StatCard
          href="/admin/monitor-2"
          icon={Ticket}
          label={<T k="home.stat.openTickets" />}
          value={counts.openTickets}
          hint={<T k="home.stat.openTicketsHint" />}
          cta={openCta}
        />
        <StatCard
          href="/admin/lark"
          icon={MessageSquare}
          label={<T k="home.stat.lark" />}
          value={counts.larkChannels}
          hint={<T k="home.stat.larkHint" />}
          cta={openCta}
        />
        <StatCard
          href="/admin/escalation"
          icon={GitBranch}
          label={<T k="home.stat.routes" />}
          value={counts.routes}
          hint={<T k="home.stat.routesHint" />}
          cta={openCta}
        />
      </div>

      <section className="mt-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg">
          <T k="home.jumpTitle" />
        </h2>
        <p className="text-sm text-[var(--muted)] mt-1">
          <T k="home.jumpSub" />
        </p>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
          {JUMPS.map((c) => {
            const Icon = c.icon;
            return (
              <Link key={c.href} href={c.href} className="panel card-link group p-3 flex items-center gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">
                    <EnZh en={c.en} zh={c.zh} />
                  </div>
                  <div className="text-xs text-teal-800 mt-0.5">
                    <T k="home.openPage" />
                  </div>
                </div>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-teal-700"
                  aria-hidden
                />
              </Link>
            );
          })}
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        <section className="panel p-3 sm:p-4 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-lg">
                <T k="home.deptTitle" />
              </h2>
              <p className="text-sm text-[var(--muted)] mt-1">
                <T k="home.deptSub" />
              </p>
            </div>
            <Link
              href="/admin/departments"
              className="text-sm text-teal-800 font-semibold shrink-0 inline-flex items-center gap-0.5"
            >
              <T k="home.viewAll" />
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {departments.map((d) => {
              const responsibilities = JSON.parse(d.primary_responsibilities) as string[];
              const dest = DEPT_DEST[d.code] ?? { href: "/admin/departments", en: "Departments", zh: "部門", stripe: "bg-teal-600" };
              return (
                <Link
                  key={d.code}
                  href={dest.href}
                  className="group relative block overflow-hidden rounded-xl border border-[var(--line)] p-3 card-link"
                >
                  <span className={cn("absolute left-0 top-0 h-full w-1", dest.stripe)} aria-hidden />
                  <div className="flex items-center justify-between gap-2 pl-2">
                    <div className="font-semibold"><Phrase>{d.name}</Phrase></div>
                    <div className="flex items-center gap-2">
                      <DeptBadge code={d.code} />
                      <ChevronRight
                        className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-teal-700"
                        aria-hidden
                      />
                    </div>
                  </div>
                  <p className="text-sm text-[var(--muted)] mt-1 pl-2"><Phrase>{d.description}</Phrase></p>
                  <ul className="mt-2 grid sm:grid-cols-2 gap-1 text-xs text-slate-700 pl-2">
                    {responsibilities.map((r) => (
                      <li key={r} className="before:content-['•'] before:mr-1.5 before:text-teal-700 break-word">
                        <Phrase>{r}</Phrase>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 pl-2 text-xs font-semibold text-teal-800">
                    <EnZh en={`Open ${dest.en}`} zh={`開啟${dest.zh}`} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="panel p-3 sm:p-4 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-[family-name:var(--font-display)] text-lg">
              <T k="home.recentAlerts" />
            </h2>
            <Link
              href="/admin/alerts"
              className="text-sm text-teal-800 font-semibold shrink-0 inline-flex items-center gap-0.5"
            >
              <T k="home.viewAll" />
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-[var(--line)] rounded-xl border border-[var(--line)] overflow-hidden">
            {recentAlerts.map((a) => (
              <li key={a.alert_id}>
                <Link
                  href={`/admin/alerts#${a.alert_id}`}
                  className="group flex items-start gap-3 px-3 py-3 hover:bg-slate-50 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium"><Phrase>{a.title}</Phrase></div>
                    <div className="text-xs text-[var(--muted)] mt-0.5">
                      {a.alert_id} · <Phrase>{a.indicator_name}</Phrase>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <SeverityBadge value={a.severity} />
                      <StatusBadge value={a.status} />
                    </div>
                  </div>
                  <ChevronRight
                    className="h-4 w-4 mt-1 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-teal-700"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-4 rounded-xl bg-slate-50 border border-[var(--line)] p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold">
                <EnZh en="Integration spine" zh="整合脊柱" />
              </div>
              <Link
                href="/admin/spine"
                className="text-xs font-semibold text-teal-800 inline-flex items-center gap-0.5"
              >
                <EnZh en="Spine log" zh="脊柱日誌" />
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
            <ol className="mt-2 space-y-1">
              {SPINE.map((step, i) => (
                <li key={step.href + i}>
                  <Link
                    href={step.href}
                    className="group flex items-start gap-2 rounded-lg px-2 py-1.5 -mx-1 hover:bg-white hover:shadow-sm transition"
                  >
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-[var(--muted)] group-hover:text-[var(--ink)]">
                      <EnZh en={step.en} zh={step.zh} />
                    </span>
                    <ChevronRight
                      className="h-4 w-4 mt-0.5 shrink-0 text-slate-300 group-hover:text-teal-700"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}
