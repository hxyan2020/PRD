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
import { StatCard } from "@/components/ui";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { T } from "@/components/T";
import { ActionLabel } from "@/components/ActionLabel";
import { EnZh } from "@/components/EnZh";
import { SignInOwnerCard } from "@/components/SignInOwnerCard";
import { PUBLIC_MESSENGER_URL } from "@/lib/static-export";
import { listAlertTrackerPacks } from "@/lib/alert-tracker";
import { AlertTrackerList } from "@/components/AlertTrackerBoard";
import { HomeSpineViz, type SpineStepStat } from "@/components/HomeSpineViz";
import { spineStageCounts } from "@/lib/ai/spine";

function latestSpineEvent(db: ReturnType<typeof getDb>, stages: string[]) {
  const placeholders = stages.map(() => "?").join(",");
  return db
    .prepare(
      `SELECT title, created_at FROM spine_events
       WHERE stage IN (${placeholders})
       ORDER BY id DESC LIMIT 1`
    )
    .get(...stages) as { title: string; created_at: string } | undefined;
}

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

  const stageMap = Object.fromEntries(spineStageCounts(db, 24).map((r) => [r.stage, r.c]));
  const detectLatest = latestSpineEvent(db, ["DETECT", "ALARM"]);
  const ticketLatest = latestSpineEvent(db, ["ALARM", "ESCALATION"]);
  const escLatest = latestSpineEvent(db, ["ESCALATION"]);
  const rcaLatest = latestSpineEvent(db, ["AI_RCA", "SKILL_EXECUTE", "HUMAN_INTERVENTION"]);
  const dashLatest = latestSpineEvent(db, ["DASHBOARD", "RESOLVED"]);
  const aiCount = (db.prepare(`SELECT COUNT(*) AS c FROM ai_analyses`).get() as { c: number }).c;

  const spineSteps: SpineStepStat[] = [
    {
      id: "detect",
      href: "/admin/monitor-2",
      labelEn: "Detect",
      labelZh: "偵測",
      detailEn: "Monitor 2.0 evaluates indicators and emits warning / breach alarms into the spine.",
      detailZh: "Monitor 2.0 評估指標，並把警告／違規警報送入脊柱。",
      count: (stageMap.DETECT ?? 0) + (stageMap.ALARM ?? 0),
      countLabelEn: "events / 24h",
      countLabelZh: "事件／24h",
      latestTitle: detectLatest?.title ?? null,
      latestAt: detectLatest?.created_at ?? null,
    },
    {
      id: "ticket",
      href: "/admin/alerts",
      labelEn: "Ticket",
      labelZh: "工單",
      detailEn: "CRMP creates / syncs the tracker ticket, attaches evidence, and keeps open alerts visible.",
      detailZh: "CRMP 建立／同步追蹤工單、附上證據，並讓未結警報可展開查看。",
      count: counts.openTickets,
      countLabelEn: "open tickets",
      countLabelZh: "未結工單",
      latestTitle: ticketLatest?.title ?? null,
      latestAt: ticketLatest?.created_at ?? null,
    },
    {
      id: "escalate",
      href: "/admin/escalation",
      labelEn: "Escalate",
      labelZh: "升級",
      detailEn: "Escalation routes pick the on-call team, Lark channel, and SLA for domain + severity.",
      detailZh: "升級路徑依領域與嚴重度選定值班團隊、Lark 頻道與 SLA。",
      count: counts.routes,
      countLabelEn: "live routes",
      countLabelZh: "啟用路徑",
      latestTitle: escLatest?.title ?? null,
      latestAt: escLatest?.created_at ?? null,
    },
    {
      id: "rca",
      href: "/admin/alerts",
      labelEn: "AI RCA",
      labelZh: "AI 根因",
      detailEn: "AI drafts root-cause on the same tracker card; humans approve interventions when needed.",
      detailZh: "AI 在同一張追蹤卡片草擬根因；必要時由人工核准干預。",
      count: (stageMap.AI_RCA ?? 0) || aiCount,
      countLabelEn: "RCA / 24h",
      countLabelZh: "根因／24h",
      latestTitle: rcaLatest?.title ?? null,
      latestAt: rcaLatest?.created_at ?? null,
    },
    {
      id: "dashboard",
      href: "/admin/dashboard",
      labelEn: "Dashboard",
      labelZh: "儀表板",
      detailEn: "Closed outcomes land in the audit trail and the daily CFD / Exchange performance board.",
      detailZh: "結案結果進入稽核軌跡與每日 CFD／交易所績效儀表板。",
      count: (stageMap.DASHBOARD ?? 0) + (stageMap.RESOLVED ?? 0),
      countLabelEn: "closes / 24h",
      countLabelZh: "結案／24h",
      latestTitle: dashLatest?.title ?? null,
      latestAt: dashLatest?.created_at ?? null,
    },
  ];

  const recentPacks = listAlertTrackerPacks({ limit: 8, order: "recent", status: "open" }).slice(0, 5);

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

      <section className="panel p-3 sm:p-4 min-w-0 mt-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg">
              <T k="home.recentAlerts" />
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              <T k="home.expandHint" />
            </p>
          </div>
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
      </section>

      <HomeSpineViz steps={spineSteps} />
    </div>
  );
}
