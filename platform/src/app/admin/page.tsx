import Link from "next/link";
import {
  BarChart3,
  Bell,
  ChevronRight,
  ClipboardList,
  Database,
  GitBranch,
  Headphones,
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
import { PUBLIC_MESSENGER_URL, PUBLIC_CS_DESK_URL, PUBLIC_CS_DASHBOARD_URL, PUBLIC_CS_LOG_URL, PUBLIC_CS_PORTAL_URL, PUBLIC_ADMIN_URL, readSearchParams } from "@/lib/static-export";
import { ORIGINAL_CRMP_ADMIN_URL } from "@/lib/platform-site";
import { listAlertTrackerPacks } from "@/lib/alert-tracker";
import { AlertTrackerList } from "@/components/AlertTrackerBoard";
import { HomeSpineViz, type SpineStepStat } from "@/components/HomeSpineViz";
import { HomeDummyAlertButtons } from "@/components/HomeDummyAlertButtons";
import { spineStageCounts } from "@/lib/ai/spine";
import { FINISHED_AT, finishedAtLabel } from "@/lib/build-stamp";
import { getUiLocale } from "@/lib/i18n-server";
import { DUMMY_HOME_STAGES } from "@/lib/ai/dummy-spine";

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

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ dummy?: string }>;
}) {
  const db = getDb();
  const ui = await getUiLocale();
  const sp = await readSearchParams(searchParams);
  const dummyIds = String(sp.dummy || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
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
  const detectLatest = latestSpineEvent(db, ["DETECT"]);
  const alarmLatest = latestSpineEvent(db, ["ALARM", "ESCALATION"]);
  const rcaLatest = latestSpineEvent(db, ["AI_RCA"]);
  const skillLatest = latestSpineEvent(db, ["SKILL_EXECUTE"]);
  const humanLatest = latestSpineEvent(db, ["HUMAN_INTERVENTION"]);
  const resolvedLatest = latestSpineEvent(db, ["RESOLVED"]);
  const dashLatest = latestSpineEvent(db, ["DASHBOARD"]);

  const openAlerts = counts.openAlerts;
  const pendingInterventions = (
    db
      .prepare(
        `SELECT COUNT(*) AS c FROM interventions WHERE status IN ('PENDING','AWAITING_CHECKER','AWAITING_HUMAN')`
      )
      .get() as { c: number }
  ).c;
  const skillRunsOpen = (() => {
    try {
      return (
        db
          .prepare(
            `SELECT COUNT(*) AS c FROM ai_skill_runs WHERE status IN ('PENDING','AWAITING_HUMAN','QUEUED','RUNNING')`
          )
          .get() as { c: number }
      ).c;
    } catch {
      return stageMap.SKILL_EXECUTE ?? 0;
    }
  })();
  const closedTickets24h = (
    db
      .prepare(
        `SELECT COUNT(*) AS c FROM monitor_tickets
         WHERE status IN ('RESOLVED','CLOSED') AND updated_at >= datetime('now','-1 day')`
      )
      .get() as { c: number }
  ).c;
  const aiAnalysesOpen = (() => {
    try {
      return (
        db.prepare(`SELECT COUNT(*) AS c FROM ai_analyses WHERE status NOT IN ('CLOSED','DISMISSED','ARCHIVED')`).get() as {
          c: number;
        }
      ).c;
    } catch {
      return stageMap.AI_RCA ?? 0;
    }
  })();

  const spineSteps: SpineStepStat[] = [
    {
      id: "DETECT",
      href: "/admin/monitor-2",
      labelEn: "DETECT",
      labelZh: "偵測",
      detailEn: "Monitor 2.0 samples indicators and raises DETECT spine events for warn / breach candidates.",
      detailZh: "Monitor 2.0 取樣指標，對警告／違規候選發出 DETECT 脊柱事件。",
      count: openAlerts,
      countLabelEn: "tickets (alerts)",
      countLabelZh: "工單（警報）",
      secondaryCount: stageMap.DETECT ?? 0,
      secondaryLabelEn: "DETECT / 24h",
      secondaryLabelZh: "DETECT／24h",
      latestTitle: detectLatest?.title ?? null,
      latestAt: detectLatest?.created_at ?? null,
    },
    {
      id: "ALARM",
      href: "/admin/alerts",
      labelEn: "ALARM",
      labelZh: "警報",
      detailEn: "Tracker tickets and ALARM stage — open incidents awaiting desk action.",
      detailZh: "追蹤工單與 ALARM 階段 — 待台面處理的未結事件。",
      count: counts.openTickets,
      countLabelEn: "open tickets",
      countLabelZh: "未結工單數",
      secondaryCount: stageMap.ALARM ?? 0,
      secondaryLabelEn: "ALARM / 24h",
      secondaryLabelZh: "ALARM／24h",
      latestTitle: alarmLatest?.title ?? null,
      latestAt: alarmLatest?.created_at ?? null,
    },
    {
      id: "AI_RCA",
      href: "/admin/alerts",
      labelEn: "AI_RCA",
      labelZh: "AI 根因",
      detailEn: "AI root-cause packs on open tickets; humans review before control actions.",
      detailZh: "未結工單上的 AI 根因包；控制動作前由人工審視。",
      count: aiAnalysesOpen,
      countLabelEn: "tickets w/ RCA",
      countLabelZh: "有根因工單",
      secondaryCount: stageMap.AI_RCA ?? 0,
      secondaryLabelEn: "AI_RCA / 24h",
      secondaryLabelZh: "AI_RCA／24h",
      latestTitle: rcaLatest?.title ?? null,
      latestAt: rcaLatest?.created_at ?? null,
    },
    {
      id: "SKILL_EXECUTE",
      href: "/admin/skills",
      labelEn: "SKILL",
      labelZh: "技能",
      detailEn: "Matched skill playbooks executing or queued against open incidents.",
      detailZh: "已匹配技能劇本對未結事件執行或排隊。",
      count: skillRunsOpen,
      countLabelEn: "tickets in skill",
      countLabelZh: "技能中工單",
      secondaryCount: stageMap.SKILL_EXECUTE ?? 0,
      secondaryLabelEn: "SKILL / 24h",
      secondaryLabelZh: "SKILL／24h",
      latestTitle: skillLatest?.title ?? null,
      latestAt: skillLatest?.created_at ?? null,
    },
    {
      id: "HUMAN_INTERVENTION",
      href: "/admin/interventions",
      labelEn: "HUMAN",
      labelZh: "人工",
      detailEn: "Human gates — approve / reject high-impact steps before execution.",
      detailZh: "人工關卡 — 高影響步驟執行前核准／駁回。",
      count: pendingInterventions,
      countLabelEn: "tickets at gate",
      countLabelZh: "關卡工單",
      secondaryCount: stageMap.HUMAN_INTERVENTION ?? 0,
      secondaryLabelEn: "HUMAN / 24h",
      secondaryLabelZh: "HUMAN／24h",
      latestTitle: humanLatest?.title ?? null,
      latestAt: humanLatest?.created_at ?? null,
    },
    {
      id: "RESOLVED",
      href: "/admin/risk-log",
      labelEn: "RESOLVED",
      labelZh: "已解決",
      detailEn: "Tickets closed in the last 24h — outcomes feed Risk Log Analytics.",
      detailZh: "近 24 小時結案工單 — 結果進入風險日誌分析。",
      count: closedTickets24h,
      countLabelEn: "tickets closed / 24h",
      countLabelZh: "24h 結案工單",
      secondaryCount: stageMap.RESOLVED ?? 0,
      secondaryLabelEn: "RESOLVED / 24h",
      secondaryLabelZh: "RESOLVED／24h",
      latestTitle: resolvedLatest?.title ?? null,
      latestAt: resolvedLatest?.created_at ?? null,
    },
    {
      id: "DASHBOARD",
      href: "/admin/dashboard",
      labelEn: "DASHBOARD",
      labelZh: "儀表板",
      detailEn: "Daily CFD / Exchange performance — closed outcomes roll into the desk board.",
      detailZh: "每日 CFD／交易所績效 — 結案結果進入台面儀表板。",
      count: (stageMap.DASHBOARD ?? 0) + closedTickets24h,
      countLabelEn: "closes reflected",
      countLabelZh: "已反映結案",
      secondaryCount: stageMap.DASHBOARD ?? 0,
      secondaryLabelEn: "DASHBOARD / 24h",
      secondaryLabelZh: "DASHBOARD／24h",
      latestTitle: dashLatest?.title ?? null,
      latestAt: dashLatest?.created_at ?? null,
    },
  ];

  const dummyPacks = dummyIds.length ? listAlertTrackerPacks({ alertIds: dummyIds }) : [];
  const recentOpen = listAlertTrackerPacks({ limit: 8, order: "recent", status: "open" }).slice(0, 5);
  const dummySet = new Set(dummyPacks.map((p) => p.alert_id));
  const recentPacks = [...dummyPacks, ...recentOpen.filter((p) => !dummySet.has(p.alert_id))].slice(0, 8);

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

      <div className="panel p-3 sm:p-4 mb-4 text-sm border-teal-200 bg-teal-50 text-teal-950" data-testid="crmp-plus-banner">
        <p className="font-semibold">
          <T k="home.plusBanner" />
        </p>
        <p className="mt-2 break-all">
          <EnZh en="This platform" zh="本平台" />
          {": "}
          <a className="underline text-teal-900" href={PUBLIC_ADMIN_URL}>
            {PUBLIC_ADMIN_URL}
          </a>
        </p>
        <p className="mt-1 break-all">
          <EnZh en="Original CRMP Admin (frozen)" zh="原 CRMP 管理後台（凍結）" />
          {": "}
          <a className="underline text-teal-900" href={ORIGINAL_CRMP_ADMIN_URL}>
            {ORIGINAL_CRMP_ADMIN_URL}
          </a>
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4 mb-4">
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

        <Link
          href="/admin/cs-desk"
          className="panel card-link group relative overflow-hidden p-4 bg-gradient-to-br from-amber-50 via-white to-white"
          data-testid="home-cs-desk"
        >
          <div className="absolute left-0 top-0 h-full w-1 bg-amber-600" aria-hidden />
          <div className="flex items-start justify-between gap-3 pl-2">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-900">
                <Headphones className="h-3.5 w-3.5" aria-hidden />
                <EnZh en="CS / TR desk" zh="CS／TR 台" />
              </div>
              <div className="font-semibold mt-1">
                <T k="home.csDesk" />
              </div>
              <p className="text-xs text-[var(--muted)] mt-2 break-all">
                <EnZh en="Permanent URL" zh="永久網址" />
                {": "}
                {PUBLIC_CS_DESK_URL}
              </p>
              <p className="text-xs text-[var(--muted)] mt-1 break-all">
                <EnZh en="Client portal" zh="客戶入口" />
                {": "}
                {PUBLIC_CS_PORTAL_URL}
              </p>
              <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-amber-900">
                <T k="home.csDeskCta" />
                <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
              </div>
            </div>
            <span className="hidden sm:inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white">
              <Headphones className="h-5 w-5" aria-hidden />
            </span>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
        <Link
          href="/admin/cs-dashboard"
          className="panel card-link group relative overflow-hidden p-4"
          data-testid="home-cs-dashboard"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-900">
                <BarChart3 className="h-3.5 w-3.5" aria-hidden />
                <EnZh en="CS / TR dashboard" zh="CS／TR 儀表板" />
              </div>
              <div className="font-semibold mt-1">
                <T k="home.csDash" />
              </div>
              <p className="text-xs text-[var(--muted)] mt-2 break-all">
                <EnZh en="Permanent URL" zh="永久網址" />
                {": "}
                {PUBLIC_CS_DASHBOARD_URL}
              </p>
              <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-cyan-900">
                <T k="home.csDashCta" />
                <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
              </div>
            </div>
            <span className="hidden sm:inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-700 text-white">
              <BarChart3 className="h-5 w-5" aria-hidden />
            </span>
          </div>
        </Link>
        <Link
          href="/admin/cs-log"
          className="panel card-link group relative overflow-hidden p-4"
          data-testid="home-cs-log"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-800">
                <ClipboardList className="h-3.5 w-3.5" aria-hidden />
                <EnZh en="CS / TR log" zh="CS／TR 日誌" />
              </div>
              <div className="font-semibold mt-1">
                <T k="home.csLog" />
              </div>
              <p className="text-xs text-[var(--muted)] mt-2 break-all">
                <EnZh en="Permanent URL" zh="永久網址" />
                {": "}
                {PUBLIC_CS_LOG_URL}
              </p>
              <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-slate-800">
                <T k="home.csLogCta" />
                <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
              </div>
            </div>
            <span className="hidden sm:inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white">
              <ClipboardList className="h-5 w-5" aria-hidden />
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
          href="/admin/departments"
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

      <HomeDummyAlertButtons />

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
          <AlertTrackerList
            packs={recentPacks}
            canOperate={false}
            compact
            highlightIds={dummyIds}
            openId={dummyIds[0]}
          />
        </div>
      </section>

      <HomeSpineViz
        steps={spineSteps}
        highlightStages={dummyIds.length ? [...DUMMY_HOME_STAGES] : []}
        demoPulse={dummyIds.length > 0}
      />

      <footer
        className="mt-8 pt-4 border-t border-[var(--line)] text-[11px] text-[var(--muted)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
        data-testid="admin-build-stamp"
      >
        <span>{finishedAtLabel(ui === "zh-Hant" ? "zh-Hant" : "en")}</span>
        <span className="font-mono tabular-nums break-all">{FINISHED_AT}</span>
      </footer>
    </div>
  );
}
