import Link from "next/link";
import { getDb } from "@/lib/db";
import { PageHeader, StatCard, SeverityBadge, StatusBadge, DeptBadge } from "@/components/ui";

export default function AdminDashboardPage() {
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

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Control plane for roles, teams, data sources, Monitor 2.0 linkage and Lark escalation — foundation for the semi-automated CRMP."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link className="btn" href="/admin/detectors">
              Detectors
            </Link>
            <Link className="btn" href="/admin/interventions">
              Interventions
            </Link>
            <Link className="btn" href="/admin/spine">
              Spine
            </Link>
            <Link className="btn btn-primary" href="/admin/dashboard">
              Daily Performance
            </Link>
          </div>
        }
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Users" value={counts.users} hint="Across 4 departments" />
        <StatCard label="Teams" value={counts.teams} hint="On-call ready" />
        <StatCard label="Data Sources" value={counts.sources} hint="Internal + external registry" />
        <StatCard label="Risk Domains" value={counts.domains} hint="CFD + Crypto Exchange" />
        <StatCard label="Open Alerts" value={counts.openAlerts} hint="Synced from Monitor 2.0" />
        <StatCard label="Open Tickets" value={counts.openTickets} hint="Tracked cases" />
        <StatCard label="Lark Channels" value={counts.larkChannels} hint="Messenger routes" />
        <StatCard label="Escalation Routes" value={counts.routes} hint="Severity → team → SLA" />
      </div>

      <div className="mt-6 grid xl:grid-cols-2 gap-4">
        <section className="panel p-4">
          <h2 className="font-[family-name:var(--font-display)] text-lg">Department Division</h2>
          <p className="text-sm text-[var(--muted)] mt-1">RACI-aligned ownership for the CRMP spine.</p>
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
                      <li key={r} className="before:content-['•'] before:mr-1.5 before:text-teal-700">
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-lg">Latest Monitor 2.0 Alerts</h2>
            <Link href="/admin/alerts" className="text-sm text-teal-800 font-semibold">
              View all
            </Link>
          </div>
          <div className="table-wrap mt-3">
            <table className="data">
              <thead>
                <tr>
                  <th>Alert</th>
                  <th>Severity</th>
                  <th>Status</th>
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
            <div className="font-semibold">Integration spine</div>
            <ol className="mt-2 space-y-1 text-[var(--muted)] list-decimal list-inside">
              <li>Monitor 2.0 emits indicator warning / breach</li>
              <li>CRMP creates / syncs ticket and attaches evidence</li>
              <li>Escalation route selects team + Lark channel + SLA</li>
              <li>AI drafts RCA; human approves intervention</li>
              <li>Audit log + daily performance dashboard</li>
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}
