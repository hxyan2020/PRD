import Link from "next/link";
import { MonitorActions } from "@/components/MonitorActions";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { SeverityBadge, StatusBadge, DeptBadge } from "@/components/ui";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { T } from "@/components/T";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import { readSearchParams } from "@/lib/static-export";

type Tab = "indicators" | "alerts" | "tickets";

export default async function Monitor2Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "monitor.read")) redirect("/admin");

  const sp = await readSearchParams(searchParams);
  const tab = (["indicators", "alerts", "tickets"].includes(sp.tab ?? "") ? sp.tab : "indicators") as Tab;
  const canOperate = hasPermission(user.role_code, "monitor.operate");

  const db = getDb();
  const indicators = db.prepare(`SELECT * FROM monitor_indicators ORDER BY status DESC, name`).all() as Array<{
    id: number;
    monitor_id: string;
    name: string;
    domain_code: string;
    product: string;
    threshold_warn: number | null;
    threshold_breach: number | null;
    unit: string | null;
    status: string;
    last_value: number | null;
    ticket_open_count: number;
  }>;
  const alerts = db
    .prepare(
      `SELECT a.*, i.name AS indicator_name, i.monitor_id
       FROM monitor_alerts a
       JOIN monitor_indicators i ON i.id = a.indicator_id
       ORDER BY a.created_at DESC`
    )
    .all() as Array<{
    id: number;
    alert_id: string;
    severity: string;
    title: string;
    message: string;
    observed_value: number | null;
    status: string;
    monitor20_ticket_id: string | null;
    indicator_name: string;
    monitor_id: string;
  }>;
  const tickets = db
    .prepare(
      `SELECT t.*, u.name AS assignee_name
       FROM monitor_tickets t
       LEFT JOIN users u ON u.id = t.assignee_user_id
       ORDER BY t.updated_at DESC`
    )
    .all() as Array<{
    id: number;
    ticket_id: string;
    title: string;
    status: string;
    severity: string;
    department_code: string | null;
    assignee_name: string | null;
    lark_message_id: string | null;
  }>;
  const setting = db
    .prepare(`SELECT value FROM platform_settings WHERE key = 'monitor2.base_url'`)
    .get() as { value: string } | undefined;

  const tabs: Array<{ key: Tab; labelKey: string }> = [
    { key: "indicators", labelKey: "m2.tabIndicators" },
    { key: "alerts", labelKey: "m2.tabAlerts" },
    { key: "tickets", labelKey: "m2.tabTickets" },
  ];

  return (
    <div>
      <AdminPageHeader pageKey="monitor-2" />

      <div className="space-y-4">
        <div className="panel p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-[var(--muted)]"><T k="m2.upstream" /></div>
            <a
              href={setting?.value ?? "#"}
              className="font-semibold text-teal-800 break-all"
              target="_blank"
              rel="noreferrer"
            >
              {setting?.value}
            </a>
            <p className="text-sm text-[var(--muted)] mt-1">
              <T k="m2.hint" />
            </p>
          </div>
          {canOperate && <MonitorActions mode="sync" />}
        </div>

        <div className="flex gap-2" role="tablist" aria-label="Monitor 2.0">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/admin/monitor-2?tab=${t.key}`}
              role="tab"
              aria-selected={tab === t.key}
              data-testid={`monitor-tab-${t.key}`}
              className={cn("btn", tab === t.key && "btn-primary")}
            >
              <T k={t.labelKey} />
            </Link>
          ))}
        </div>

        {tab === "indicators" && (
          <div className="panel table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th><T k="common.indicator" /></th>
                  <th><T k="common.domain" /></th>
                  <th><T k="common.product" /></th>
                  <th><T k="common.last" /></th>
                  <th><T k="m2.warnBreach" /></th>
                  <th><T k="common.status" /></th>
                  <th><T k="common.openTickets" /></th>
                </tr>
              </thead>
              <tbody>
                {indicators.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <div className="font-medium">{i.name}</div>
                      <div className="text-xs text-[var(--muted)]">{i.monitor_id}</div>
                    </td>
                    <td className="text-sm">{i.domain_code}</td>
                    <td>{i.product}</td>
                    <td className="tabular-nums">
                      {i.last_value}
                      {i.unit ? ` ${i.unit}` : ""}
                    </td>
                    <td className="text-sm tabular-nums">
                      {i.threshold_warn} / {i.threshold_breach}
                    </td>
                    <td>
                      <StatusBadge value={i.status} />
                    </td>
                    <td>{i.ticket_open_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "alerts" && (
          <div className="panel table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th><T k="common.alert" /></th>
                  <th><T k="common.severity" /></th>
                  <th><T k="common.status" /></th>
                  <th><T k="m2.monitorTicket" /></th>
                  {canOperate && <th />}
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="font-medium">{a.title}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {a.alert_id} · {a.monitor_id} · {a.indicator_name}
                      </div>
                      <div className="text-sm mt-1">{a.message}</div>
                    </td>
                    <td>
                      <SeverityBadge value={a.severity} />
                    </td>
                    <td>
                      <StatusBadge value={a.status} />
                    </td>
                    <td className="text-sm">{a.monitor20_ticket_id}</td>
                    {canOperate && (
                      <td>{a.status === "OPEN" && <MonitorActions mode="ack" alertId={a.id} />}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "tickets" && (
          <div className="panel table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th><T k="common.ticket" /></th>
                  <th><T k="common.severity" /></th>
                  <th><T k="common.status" /></th>
                  <th><T k="common.assignee" /></th>
                  <th><T k="common.department" /></th>
                  <th><T k="m2.larkMsg" /></th>
                  {canOperate && <th />}
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div className="font-medium">{t.title}</div>
                      <div className="text-xs text-[var(--muted)]">{t.ticket_id}</div>
                    </td>
                    <td>
                      <SeverityBadge value={t.severity} />
                    </td>
                    <td>
                      <StatusBadge value={t.status} />
                    </td>
                    <td>{t.assignee_name ?? <T k="common.unassigned" />}</td>
                    <td>
                      <DeptBadge code={t.department_code} />
                    </td>
                    <td className="text-xs">{t.lark_message_id ?? "—"}</td>
                    {canOperate && (
                      <td className="space-x-1">
                        {t.status !== "RESOLVED" && (
                          <MonitorActions mode="ticket" ticketId={t.id} status="IN_PROGRESS" label="Progress" />
                        )}
                        {t.status !== "RESOLVED" && (
                          <MonitorActions mode="ticket" ticketId={t.id} status="RESOLVED" label="Resolve" />
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
