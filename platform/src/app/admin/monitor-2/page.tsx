import Link from "next/link";
import { MonitorActions } from "@/components/MonitorActions";
import { IndicatorThresholdEditor } from "@/components/IndicatorThresholdEditor";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { StatusBadge, Badge } from "@/components/ui";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { T } from "@/components/T";
import { Phrase } from "@/components/Phrase";
import { EnZh } from "@/components/EnZh";
import { redirect } from "next/navigation";
import { readSearchParams } from "@/lib/static-export";
import { getIndicatorMeta } from "@/lib/monitor-indicator-meta";

export default async function Monitor2Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; monitor_id?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "monitor.read")) redirect("/admin");

  const sp = await readSearchParams(searchParams);
  // Alerts / tickets live on Realtime Alert & Tracker — bounce legacy tab deep-links.
  if (sp.tab === "alerts" || sp.tab === "tickets") {
    const mid = (sp.monitor_id || "").trim();
    redirect(mid ? `/admin/alerts?monitor_id=${encodeURIComponent(mid)}` : "/admin/alerts");
  }

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
  const setting = db
    .prepare(`SELECT value FROM platform_settings WHERE key = 'monitor2.base_url'`)
    .get() as { value: string } | undefined;

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
            <p className="text-sm text-[var(--muted)] mt-1">
              <T k="m2.alertsTicketsMoved" />{" "}
              <Link href="/admin/alerts" className="font-semibold text-teal-800 underline">
                <T k="m2.gotoRealtimeAlerts" />
              </Link>
            </p>
          </div>
          {canOperate && <MonitorActions mode="sync" />}
        </div>

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
                          href={`/admin/alerts?monitor_id=${encodeURIComponent(i.monitor_id)}`}
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
      </div>
    </div>
  );
}
