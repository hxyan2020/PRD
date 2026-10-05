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
import { FINISHED_AT, finishedAtLabel } from "@/lib/build-stamp";
import { getUiLocale } from "@/lib/i18n-server";

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
  const ui = await getUiLocale();
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
      countLabelEn: "open alerts",
      countLabelZh: "未結警報",
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
      countLabelZh: "未結工單",
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
      countLabelEn: "open RCA packs",
      countLabelZh: "未結根因包",
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
      countLabelEn: "skill runs",
      countLabelZh: "技能執行",
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
      countLabelEn: "pending gates",
      countLabelZh: "待審關卡",
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
      countLabelEn: "tickets / 24h",
      countLabelZh: "工單／24h",
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
