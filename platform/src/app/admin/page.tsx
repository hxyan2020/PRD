import Link from "next/link";
import { getDb } from "@/lib/db";
import { StatCard, SeverityBadge, StatusBadge, DeptBadge } from "@/components/ui";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { actionLabel, t } from "@/lib/i18n";
import { getUiLocale } from "@/lib/i18n-server";

export default async function AdminDashboardPage() {
  const locale = await getUiLocale();
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
        {actionLabel("/admin/messenger", locale)}
      </Link>
      <Link className="btn" href="/admin/docs/urls">
        {actionLabel("/admin/docs/urls", locale)}
      </Link>
      <Link className="btn" href="/admin/docs/prd">
        {actionLabel("/admin/docs/prd", locale)}
      </Link>
      <Link className="btn" href="/admin/docs/user-guide">
        {actionLabel("/admin/docs/user-guide", locale)}
      </Link>
      <Link className="btn" href="/admin/docs/uat">
        {actionLabel("/admin/docs/uat", locale)}
      </Link>
      <Link className="btn" href="/admin/ai-admin">
        {actionLabel("/admin/ai-admin", locale)}
      </Link>
      <Link className="btn" href="/admin/security/ai-access">
        {actionLabel("/admin/security/ai-access", locale)}
      </Link>
      <Link className="btn btn-primary" href="/admin/dashboard">
        {actionLabel("/admin/dashboard", locale)}
      </Link>
    </>
  );

  return (
    <div>
      <AdminPageHeader pageKey="home" actions={actions} />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-3">
        <StatCard label={t("home.stat.users", locale)} value={counts.users} hint={t("home.stat.usersHint", locale)} />
        <StatCard label={t("home.stat.teams", locale)} value={counts.teams} hint={t("home.stat.teamsHint", locale)} />
        <StatCard
          label={t("home.stat.sources", locale)}
          value={counts.sources}
          hint={t("home.stat.sourcesHint", locale)}
        />
        <StatCard
          label={t("home.stat.domains", locale)}
          value={counts.domains}
          hint={t("home.stat.domainsHint", locale)}
        />
        <StatCard
          label={t("home.stat.openAlerts", locale)}
          value={counts.openAlerts}
          hint={t("home.stat.openAlertsHint", locale)}
        />
        <StatCard
          label={t("home.stat.openTickets", locale)}
          value={counts.openTickets}
          hint={t("home.stat.openTicketsHint", locale)}
        />
        <StatCard label={t("home.stat.lark", locale)} value={counts.larkChannels} hint={t("home.stat.larkHint", locale)} />
        <StatCard
          label={t("home.stat.routes", locale)}
          value={counts.routes}
          hint={t("home.stat.routesHint", locale)}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        <section className="panel p-3 sm:p-4 min-w-0">
          <h2 className="font-[family-name:var(--font-display)] text-lg">{t("home.deptTitle", locale)}</h2>
          <p className="text-sm text-[var(--muted)] mt-1">{t("home.deptSub", locale)}</p>
          <div className="mt-4 space-y-3">
            {departments.map((d) => {
              const responsibilities = JSON.parse(d.primary_responsibilities) as string[];
              return (
                <div key={d.code} className="rounded-xl border border-[var(--line)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold">{d.name}</div>
                    <DeptBadge code={d.code} />
                  </div>
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
            <h2 className="font-[family-name:var(--font-display)] text-lg">{t("home.recentAlerts", locale)}</h2>
            <Link href="/admin/alerts" className="text-sm text-teal-800 font-semibold shrink-0">
              {t("home.viewAll", locale)}
            </Link>
          </div>
          <div className="table-wrap mt-3 max-w-full">
            <table className="data">
              <thead>
                <tr>
                  <th>{locale === "zh-Hant" ? "警報" : "Alert"}</th>
                  <th>{locale === "zh-Hant" ? "嚴重度" : "Severity"}</th>
                  <th>{locale === "zh-Hant" ? "狀態" : "Status"}</th>
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
            <div className="font-semibold">{locale === "zh-Hant" ? "整合脊柱" : "Integration spine"}</div>
            <ol className="mt-2 space-y-1 text-[var(--muted)] list-decimal list-inside">
              {locale === "zh-Hant" ? (
                <>
                  <li>Monitor 2.0 發出指標警告／違規</li>
                  <li>CRMP 建立／同步工單並附上證據</li>
                  <li>升級路徑選定團隊＋Lark 頻道＋SLA</li>
                  <li>AI 草擬根因；人工核准干預</li>
                  <li>稽核日誌＋每日績效儀表板</li>
                </>
              ) : (
                <>
                  <li>Monitor 2.0 emits indicator warning / breach</li>
                  <li>CRMP creates / syncs ticket and attaches evidence</li>
                  <li>Escalation route selects team + Lark channel + SLA</li>
                  <li>AI drafts RCA; human approves intervention</li>
                  <li>Audit log + daily performance dashboard</li>
                </>
              )}
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}
