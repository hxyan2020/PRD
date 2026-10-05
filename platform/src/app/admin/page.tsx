import Link from "next/link";
import {
  Bell,
  ChevronRight,
  Database,
  GitBranch,
  MessageSquare,
  MessagesSquare,
  Ticket,
  Users,
  Waypoints,
} from "lucide-react";
import { getDb } from "@/lib/db";
import { StatCard, DeptBadge } from "@/components/ui";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { T } from "@/components/T";
import { ActionLabel } from "@/components/ActionLabel";
import { EnZh } from "@/components/EnZh";
import { Phrase } from "@/components/Phrase";
import { SignInOwnerCard } from "@/components/SignInOwnerCard";
import { PUBLIC_MESSENGER_URL } from "@/lib/static-export";
import { cn } from "@/lib/utils";
import { listAlertTrackerPacks } from "@/lib/alert-tracker";
import { AlertTrackerList } from "@/components/AlertTrackerBoard";
import { HomeSpineViz } from "@/components/HomeSpineViz";

const DEPT_DEST: Record<
  string,
  { href: string; en: string; zh: string; stripe: string }
> = {
  RISK_CONTROL: { href: "/admin/alerts", en: "Realtime Alert & Tracker", zh: "即時警報與追蹤", stripe: "bg-teal-600" },
  OPERATIONS: {
    href: "/admin/interventions",
    en: "Human Intervention",
    zh: "人工干預",
    stripe: "bg-orange-500",
  },
  AI: { href: "/admin/alerts", en: "Realtime Alert & Tracker", zh: "即時警報與追蹤", stripe: "bg-violet-600" },
  SYSTEM: { href: "/admin/settings", en: "Platform Settings", zh: "平台設定", stripe: "bg-slate-600" },
};

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

  const recentPacks = listAlertTrackerPacks({ limit: 5, order: "recent" });

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
          icon={<Users aria-hidden />}
          label={<T k="home.stat.users" />}
          value={counts.users}
          hint={<T k="home.stat.usersHint" />}
          cta={openCta}
        />
        <StatCard
          href="/admin/teams"
          icon={<Users aria-hidden />}
          label={<T k="home.stat.teams" />}
          value={counts.teams}
          hint={<T k="home.stat.teamsHint" />}
          cta={openCta}
        />
        <StatCard
          href="/admin/data-sources"
          icon={<Database aria-hidden />}
          label={<T k="home.stat.sources" />}
          value={counts.sources}
          hint={<T k="home.stat.sourcesHint" />}
          cta={openCta}
        />
        <StatCard
          href="/admin/risk-domains"
          icon={<Waypoints aria-hidden />}
          label={<T k="home.stat.domains" />}
          value={counts.domains}
          hint={<T k="home.stat.domainsHint" />}
          cta={openCta}
        />
        <StatCard
          href="/admin/alerts"
          icon={<Bell aria-hidden />}
          tone={counts.openAlerts > 0 ? "alert" : "default"}
          label={<T k="home.stat.openAlerts" />}
          value={counts.openAlerts}
          hint={<T k="home.stat.openAlertsHint" />}
          cta={openCta}
        />
        <StatCard
          href="/admin/monitor-2"
          icon={<Ticket aria-hidden />}
          label={<T k="home.stat.openTickets" />}
          value={counts.openTickets}
          hint={<T k="home.stat.openTicketsHint" />}
          cta={openCta}
        />
        <StatCard
          href="/admin/lark"
          icon={<MessageSquare aria-hidden />}
          label={<T k="home.stat.lark" />}
          value={counts.larkChannels}
          hint={<T k="home.stat.larkHint" />}
          cta={openCta}
        />
        <StatCard
          href="/admin/escalation"
          icon={<GitBranch aria-hidden />}
          label={<T k="home.stat.routes" />}
          value={counts.routes}
          hint={<T k="home.stat.routesHint" />}
          cta={openCta}
        />
      </div>

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
              const responsibilities = (() => {
                try {
                  return JSON.parse(d.primary_responsibilities) as string[];
                } catch {
                  return [];
                }
              })();
              const preview = responsibilities.slice(0, 4);
              const rest = Math.max(0, responsibilities.length - preview.length);
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
                        aria-hidden />
                    </div>
                  </div>
                  <p className="text-sm text-[var(--muted)] mt-1 pl-2"><Phrase>{d.description}</Phrase></p>
                  <ul className="mt-2 grid sm:grid-cols-2 gap-1 text-xs text-slate-700 pl-2">
                    {preview.map((r) => (
                      <li key={r} className="before:content-['•'] before:mr-1.5 before:text-teal-700 break-word">
                        <Phrase>{r}</Phrase>
                      </li>
                    ))}
                  </ul>
                  {rest > 0 ? (
                    <div className="mt-1.5 pl-2 text-xs text-[var(--muted)]">
                      <T k="home.deptMore" vars={{ n: rest }} />
                    </div>
                  ) : null}
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
          <div className="mt-3">
            <AlertTrackerList packs={recentPacks} canOperate={false} compact />
          </div>

          <HomeSpineViz />
        </section>
      </div>
    </div>
  );
}
