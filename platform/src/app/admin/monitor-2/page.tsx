import Link from "next/link";
import { MonitorActions } from "@/components/MonitorActions";
import { IndicatorThresholdEditor } from "@/components/IndicatorThresholdEditor";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { SeverityBadge, StatusBadge, DeptBadge, Badge } from "@/components/ui";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { T } from "@/components/T";
import { Phrase } from "@/components/Phrase";
import { EnZh } from "@/components/EnZh";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import { readSearchParams } from "@/lib/static-export";
import { getIndicatorMeta } from "@/lib/monitor-indicator-meta";

type Tab = "indicators" | "alerts" | "tickets";

export default async function Monitor2Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; monitor_id?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "monitor.read")) redirect("/admin");

  const sp = await readSearchParams(searchParams);
  const tab = (["indicators", "alerts", "tickets"].includes(sp.tab ?? "") ? sp.tab : "indicators") as Tab;
  const filterMonitorId = (sp.monitor_id || "").trim();
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
    last_checked_at: string | null;
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
      `SELECT t.*, u.name AS assignee_name, i.monitor_id AS monitor_id
       FROM monitor_tickets t
       LEFT JOIN users u ON u.id = t.assignee_user_id
       LEFT JOIN monitor_alerts a ON a.id = t.alert_id
       LEFT JOIN monitor_indicators i ON i.id = a.indicator_id
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
    monitor_id: string | null;
  }>;
  const setting = db
    .prepare(`SELECT value FROM platform_settings WHERE key = 'monitor2.base_url'`)
    .get() as { value: string } | undefined;

  const visibleTickets = filterMonitorId
    ? tickets.filter((t) => t.monitor_id === filterMonitorId || t.title.includes(filterMonitorId))
    : tickets;

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
            <div className="text-xs uppercase tracking-wide text-[var(--muted)]">
              <T k="m2.upstream" />
            </div>
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
          <div className="panel table-wrap" data-testid="monitor-indicators-table">
            <table className="data">
              <thead>
                <tr>
                  <th><T k="common.indicator" /></th>
                  <th><T k="m2.description" /></th>
                  <th><T k="common.domain" /></th>
                  <th><T k="common.product" /></th>
                  <th><T k="m2.warnBreach" /></th>
                  <th><T k="m2.frequency" /></th>
                  <th><T k="m2.riskScenarios" /></th>
                  <th><T k="m2.combinations" /></th>
                  <th><T k="common.status" /></th>
                  <th><T k="m2.lastRefreshed" /></th>
                  <th><T k="common.openTickets" /></th>
                </tr>
              </thead>
              <tbody>
                {indicators.map((i) => {
                  const meta = getIndicatorMeta(i.monitor_id, { unit: i.unit, name: i.name });
                  const unit = i.unit ? ` ${i.unit}` : "";
                  return (
                    <tr key={i.id} id={i.monitor_id} data-testid={`monitor-indicator-${i.monitor_id}`}>
                      <td className="min-w-[11rem]">
                        <div className="font-medium"><Phrase>{i.name}</Phrase></div>
                        <div className="text-xs text-[var(--muted)]">{i.monitor_id}</div>
                        <div className="text-xs text-[var(--muted)] mt-1 tabular-nums">
                          <T k="m2.currentValue" />: {i.last_value}
                          {unit}
                        </div>
                      </td>
                      <td className="text-sm max-w-[14rem]">
                        <Phrase>{meta.description}</Phrase>
                      </td>
                      <td className="text-sm whitespace-nowrap"><Phrase>{i.domain_code}</Phrase></td>
                      <td className="whitespace-nowrap">{i.product}</td>
                      <td>
                        <IndicatorThresholdEditor
                          indicatorId={i.id}
                          monitorId={i.monitor_id}
                          warn={i.threshold_warn}
                          breach={i.threshold_breach}
                          unit={i.unit}
                          canOperate={canOperate}
                        />
                      </td>
                      <td className="text-sm whitespace-nowrap">
                        <EnZh en={meta.frequency} zh={meta.frequency_zh} />
                      </td>
                      <td className="text-sm min-w-[12rem]">
                        {meta.risk_scenarios.length ? (
                          <ul className="list-disc pl-4 space-y-0.5">
                            {meta.risk_scenarios.map((s) => (
                              <li key={s}><Phrase>{s}</Phrase></li>
                            ))}
                          </ul>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="text-sm min-w-[13rem]">
                        {meta.combinations.length ? (
                          <div className="space-y-2">
                            {meta.combinations.map((c) => (
                              <div key={c.code} className="rounded-lg border border-[var(--line)] bg-slate-50/80 px-2 py-1.5">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <Badge
                                    className={
                                      c.mode === "sequence"
                                        ? "bg-teal-50 text-teal-900 border-teal-200"
                                        : "bg-amber-50 text-amber-900 border-amber-200"
                                    }
                                  >
                                    {c.mode === "sequence" ? (
                                      <T k="m2.comboSequence" />
                                    ) : (
                                      <T k="m2.comboTogether" />
                                    )}
                                  </Badge>
                                  <span className="font-medium text-xs"><Phrase>{c.name}</Phrase></span>
                                </div>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {c.partners.map((p) => (
                                    <Link
                                      key={p}
                                      href={`#${p}`}
                                      className="text-[11px] font-semibold text-teal-800 underline"
                                    >
                                      {p}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[var(--muted)]"><T k="m2.noCombo" /></span>
                        )}
                      </td>
                      <td>
                        <StatusBadge value={i.status} />
                      </td>
                      <td className="text-xs whitespace-nowrap tabular-nums">
                        {i.last_checked_at || "—"}
                      </td>
                      <td>
                        {i.ticket_open_count > 0 ? (
                          <Link
                            href={`/admin/monitor-2?tab=tickets&monitor_id=${encodeURIComponent(i.monitor_id)}`}
                            className="font-semibold text-teal-800 underline tabular-nums"
                            data-testid={`monitor-tickets-link-${i.monitor_id}`}
                          >
                            {i.ticket_open_count}
                          </Link>
                        ) : (
                          <span className="tabular-nums text-[var(--muted)]">0</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
                      <div className="font-medium"><Phrase>{a.title}</Phrase></div>
                      <div className="text-xs text-[var(--muted)]">
                        {a.alert_id} · {a.monitor_id} · <Phrase>{a.indicator_name}</Phrase>
                      </div>
                      <div className="text-sm mt-1"><Phrase>{a.message}</Phrase></div>
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
          <div className="space-y-3">
            {filterMonitorId ? (
              <div className="panel p-3 text-sm flex flex-wrap items-center justify-between gap-2" data-testid="monitor-ticket-filter">
                <div>
                  <T k="m2.filteredByIndicator" />{" "}
                  <span className="font-semibold">{filterMonitorId}</span>
                  <span className="text-[var(--muted)]"> · {visibleTickets.length}</span>
                </div>
                <Link href="/admin/monitor-2?tab=tickets" className="text-teal-800 font-semibold underline">
                  <T k="m2.clearFilter" />
                </Link>
              </div>
            ) : null}
            <div className="panel table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th><T k="common.ticket" /></th>
                    <th><T k="common.indicator" /></th>
                    <th><T k="common.severity" /></th>
                    <th><T k="common.status" /></th>
                    <th><T k="common.assignee" /></th>
                    <th><T k="common.department" /></th>
                    <th><T k="m2.larkMsg" /></th>
                    {canOperate && <th />}
                  </tr>
                </thead>
                <tbody>
                  {visibleTickets.length === 0 ? (
                    <tr>
                      <td colSpan={canOperate ? 8 : 7} className="text-sm text-[var(--muted)] py-6">
                        <T k="m2.noTickets" />
                      </td>
                    </tr>
                  ) : (
                    visibleTickets.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <div className="font-medium"><Phrase>{t.title}</Phrase></div>
                          <div className="text-xs text-[var(--muted)]">{t.ticket_id}</div>
                        </td>
                        <td className="text-xs font-semibold text-teal-900">{t.monitor_id || "—"}</td>
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
