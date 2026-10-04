import Link from "next/link";
import { getDb } from "@/lib/db";
import { StatCard, SeverityBadge, StatusBadge, DeptBadge } from "@/components/ui";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { T } from "@/components/T";
import { ActionLabel } from "@/components/ActionLabel";
import { EnZh } from "@/components/EnZh";

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

  const actions = (
    <>
      <Link className="btn" href="/admin/messenger">
        <ActionLabel href="/admin/messenger" />
      </Link>
      <Link className="btn" href="/admin/docs/urls">
        <ActionLabel href="/admin/docs/urls" />
      </Link>
      <Link className="btn" href="/admin/docs/prd">
        <ActionLabel href="/admin/docs/prd" />
      </Link>
      <Link className="btn" href="/admin/docs/user-guide">
        <ActionLabel href="/admin/docs/user-guide" />
      </Link>
      <Link className="btn" href="/admin/docs/uat">
        <ActionLabel href="/admin/docs/uat" />
      </Link>
      <Link className="btn" href="/admin/ai-admin">
        <ActionLabel href="/admin/ai-admin" />
      </Link>
      <Link className="btn" href="/admin/security/ai-access">
        <ActionLabel href="/admin/security/ai-access" />
      </Link>
      <Link className="btn btn-primary" href="/admin/dashboard">
        <ActionLabel href="/admin/dashboard" />
      </Link>
    </>
  );

  return (
    <div>
      <AdminPageHeader pageKey="home" actions={actions} />

      <section className="panel p-3 sm:p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
            <EnZh en="Platform owner" zh="平台負責人" />
          </div>
          <div className="font-semibold">YAN Haixiang</div>
          <div className="text-sm text-[var(--muted)]">yan.haixiang@vantagemarkets.com</div>
        </div>
        <Link className="btn" href="/login">
          <EnZh en="Sign in as platform owner" zh="以平台負責人登入" />
        </Link>
      </section>

      <section className="panel p-3 sm:p-4 mb-4">
        <div className="font-semibold"><T k="home.larkDemo" /></div>
        <p className="text-sm text-[var(--muted)] mt-1">
          <EnZh en="Permanent URL (GitHub Pages)" zh="永久網址（GitHub Pages）" />
          {": "}
          <a className="text-teal-800 underline break-all" href="https://hxyan2020.github.io/PRD/crmp-admin/admin/messenger/">
            https://hxyan2020.github.io/PRD/crmp-admin/admin/messenger/
          </a>
        </p>
        <Link className="btn btn-primary mt-3 inline-flex" href="/admin/messenger">
          <T k="home.larkDemoCta" />
        </Link>
      </section>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-3">
        <StatCard href="/admin/users" label={<T k="home.stat.users" />} value={counts.users} hint={<T k="home.stat.usersHint" />} />
        <StatCard href="/admin/teams" label={<T k="home.stat.teams" />} value={counts.teams} hint={<T k="home.stat.teamsHint" />} />
        <StatCard
          href="/admin/data-sources"
          label={<T k="home.stat.sources" />}
          value={counts.sources}
          hint={<T k="home.stat.sourcesHint" />}
        />
        <StatCard
          href="/admin/risk-domains"
          label={<T k="home.stat.domains" />}
          value={counts.domains}
          hint={<T k="home.stat.domainsHint" />}
        />
        <StatCard
          href="/admin/alerts"
          label={<T k="home.stat.openAlerts" />}
          value={counts.openAlerts}
          hint={<T k="home.stat.openAlertsHint" />}
        />
        <StatCard
          href="/admin/monitor-2"
          label={<T k="home.stat.openTickets" />}
          value={counts.openTickets}
          hint={<T k="home.stat.openTicketsHint" />}
        />
        <StatCard href="/admin/lark" label={<T k="home.stat.lark" />} value={counts.larkChannels} hint={<T k="home.stat.larkHint" />} />
        <StatCard
          href="/admin/escalation"
          label={<T k="home.stat.routes" />}
          value={counts.routes}
          hint={<T k="home.stat.routesHint" />}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        {[
          { href: "/admin/market-intel", en: "Market Intelligence", zh: "市場情報" },
          { href: "/admin/skills", en: "AI Skills", zh: "AI 技能" },
          { href: "/admin/ai-analyses", en: "AI Analyses", zh: "AI 分析" },
          { href: "/admin/knowledge-tree", en: "Knowledge Tree", zh: "知識樹" },
          { href: "/admin/settings", en: "Settings", zh: "平台設定" },
          { href: "/admin/docs/user-guide", en: "User Guide", zh: "使用手冊" },
          { href: "/admin/docs/prd", en: "PRD", zh: "PRD" },
          { href: "/admin/docs/tsd", en: "TSD", zh: "TSD" },
        ].map((c) => (
          <Link key={c.href} href={c.href} className="panel p-3 hover:border-teal-300 transition">
            <div className="text-sm font-semibold">
              <EnZh en={c.en} zh={c.zh} />
            </div>
            <div className="text-xs text-teal-800 mt-1">
              <EnZh en="Open page" zh="開啟頁面" />
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        <section className="panel p-3 sm:p-4 min-w-0">
          <h2 className="font-[family-name:var(--font-display)] text-lg"><T k="home.deptTitle" /></h2>
          <p className="text-sm text-[var(--muted)] mt-1"><T k="home.deptSub" /></p>
          <div className="mt-4 space-y-3">
            {departments.map((d) => {
              const responsibilities = JSON.parse(d.primary_responsibilities) as string[];
              return (
                <div key={d.code} className="rounded-xl border border-[var(--line)] p-3">
                  <Link href="/admin/departments" className="flex items-center justify-between gap-2">
                    <div className="font-semibold">{d.name}</div>
                    <DeptBadge code={d.code} />
                  </Link>
                  <p className="text-sm text-[var(--muted)] mt-1">{d.description}</p>
                  <ul className="mt-2 grid sm:grid-cols-2 gap-1 text-xs text-slate-700">
                    {responsibilities.map((r) => (
                      <li key={r} className="before:content-['•'] before:mr-1.5 before:text-teal-700 break-word">
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel p-3 sm:p-4 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-[family-name:var(--font-display)] text-lg"><T k="home.recentAlerts" /></h2>
            <Link href="/admin/alerts" className="text-sm text-teal-800 font-semibold shrink-0">
              <T k="home.viewAll" />
            </Link>
          </div>
          <div className="table-wrap mt-3 max-w-full">
            <table className="data">
              <thead>
                <tr>
                  <th><EnZh en="Alert" zh="警報" /></th>
                  <th><EnZh en="Severity" zh="嚴重度" /></th>
                  <th><EnZh en="Status" zh="狀態" /></th>
                </tr>
              </thead>
              <tbody>
                {recentAlerts.map((a) => (
                  <tr key={a.alert_id}>
                    <td>
                      <div className="font-medium">{a.title}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {a.alert_id} · {a.indicator_name}
                      </div>
                    </td>
                    <td>
                      <SeverityBadge value={a.severity} />
                    </td>
                    <td>
                      <StatusBadge value={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 border border-[var(--line)] p-3 text-sm">
            <div className="font-semibold"><EnZh en="Integration spine" zh="整合脊柱" /></div>
            <ol className="mt-2 space-y-1 text-[var(--muted)] list-decimal list-inside">
              <EnZh
                en={
                  <>
                    <li>Monitor 2.0 emits indicator warning / breach</li>
                    <li>CRMP creates / syncs ticket and attaches evidence</li>
                    <li>Escalation route selects team + Lark channel + SLA</li>
                    <li>AI drafts RCA; human approves intervention</li>
                    <li>Audit log + daily performance dashboard</li>
                  </>
                }
                zh={
                  <>
                    <li>Monitor 2.0 發出指標警告／違規</li>
                    <li>CRMP 建立／同步工單並附上證據</li>
                    <li>升級路徑選定團隊＋Lark 頻道＋SLA</li>
                    <li>AI 草擬根因；人工核准干預</li>
                    <li>稽核日誌＋每日績效儀表板</li>
                  </>
                }
              />
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}
