"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge, SeverityBadge, StatCard, StatusBadge } from "@/components/ui";
import { AlertTrackerList } from "@/components/AlertTrackerBoard";
import type { AlertTrackerPack } from "@/lib/alert-tracker";
import { navLabel } from "@/lib/i18n";
import { useT } from "@/hooks/useUiLocale";

type Dashboard = {
  summary: {
    alerts_total: number;
    open_alerts: number;
    total_loss_usd: number;
    total_prevented_usd: number;
    total_exposure_usd: number;
    net_risk_usd: number;
    loss_events: number;
    prevented_events: number;
    near_miss_events: number;
    false_positive_events: number;
    open_events: number;
    avg_ack_minutes: number | null;
    avg_resolve_minutes: number | null;
    avg_human_handling_minutes: number | null;
    sla_breach_count: number;
    decided_interventions: number;
    pending_interventions: number;
  };
  by_category: Array<{
    category: string;
    category_name: string;
    product: string;
    severity: string;
    alert_count: number;
    open_count: number;
    avg_loss_usd: number;
    prevented_usd: number;
    loss_usd: number;
  }>;
  by_domain: Array<{
    category: string;
    category_name: string;
    alert_count: number;
    breach_count: number;
    breach_rate_pct: number;
    loss_usd: number;
    prevented_usd: number;
    exposure_usd: number;
  }>;
  loopholes: Array<{
    loophole_tag: string;
    domain_code: string;
    category_name: string;
    product: string;
    incidents: number;
    breach_incidents: number;
    loss_usd: number;
    prevented_usd: number;
    avg_ack_minutes: number | null;
  }>;
  records: Array<{
    id: number;
    alert_id: string;
    created_at: string;
    acknowledged_at: string | null;
    severity: string;
    status: string;
    title: string;
    message: string;
    indicator_name: string;
    monitor_id: string;
    domain_code: string;
    product: string;
    category_name: string;
    ticket_id: string | null;
    ticket_status: string | null;
    ticket_resolved_at: string | null;
    outcome: string | null;
    estimated_loss_usd: number | null;
    prevented_loss_usd: number | null;
    exposure_usd: number | null;
    loophole_tag: string | null;
    impact_notes: string | null;
    ack_minutes: number | null;
    resolve_minutes: number | null;
    human_handling_minutes: number | null;
    sla_minutes: number | null;
    sla_breached: boolean;
  }>;
  timeline: Array<{
    kind: string;
    at: string;
    ref: string;
    title: string;
    severity: string;
    category: string;
    product: string;
  }>;
};

const TABS = [
  { id: "overview", labelKey: "rl.overview" },
  { id: "categories", labelKey: "rl.categories" },
  { id: "records", labelKey: "rl.records" },
  { id: "handling", labelKey: "rl.handling" },
  { id: "money", labelKey: "rl.money" },
  { id: "loopholes", labelKey: "rl.loopholes" },
] as const;

function usd(n: number | null | undefined) {
  const v = Number(n || 0);
  const abs = Math.abs(v);
  const formatted = abs >= 1_000_000 ? `${(abs / 1_000_000).toFixed(2)}M` : abs >= 1000 ? `${(abs / 1000).toFixed(1)}k` : `${abs.toFixed(0)}`;
  return `${v < 0 ? "-" : ""}$${formatted}`;
}

function mins(n: number | null | undefined) {
  if (n == null) return "—";
  if (n < 60) return `${n}m`;
  const h = Math.floor(n / 60);
  const m = Math.round(n % 60);
  return `${h}h ${m}m`;
}

export function RiskLogDashboard({ data, closedPacks = [] }: { data: Dashboard; closedPacks?: AlertTrackerPack[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("overview");
  const { t, locale, phrase } = useT();
  const [filter, setFilter] = useState("ALL");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState("");

  const domains = useMemo(() => {
    const set = new Set(data.by_domain.map((d) => d.category));
    return ["ALL", ...Array.from(set)];
  }, [data.by_domain]);

  const filteredRecords = useMemo(() => {
    return data.records.filter((r) => {
      if (filter !== "ALL" && r.domain_code !== filter) return false;
      if (!q) return true;
      const hay = `${r.alert_id} ${r.title} ${r.indicator_name} ${r.category_name} ${r.loophole_tag || ""}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [data.records, filter, q]);

  const maxDomainAlerts = Math.max(1, ...data.by_domain.map((d) => d.alert_count));

  useEffect(() => {
    const apply = () => {
      const id = window.location.hash.replace(/^#/, "");
      setOpenId(id);
      if (!id) return;
      setTab("overview");
      window.requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (el instanceof HTMLDetailsElement) el.open = true;
        el?.scrollIntoView({ block: "start" });
      });
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [closedPacks]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map((tabBtn) => (
          <button
            key={tabBtn.id}
            type="button"
            className={`btn ${tab === tabBtn.id ? "btn-primary" : ""}`}
            onClick={() => setTab(tabBtn.id)}
          >
            {t(tabBtn.labelKey)}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <StatCard label={t("rl.alertsAll")} value={data.summary.alerts_total} hint={t("rl.openAcked", { n: data.summary.open_alerts })} />
            <StatCard label={t("rl.estLoss")} value={usd(data.summary.total_loss_usd)} hint={t("rl.lossEvents", { n: data.summary.loss_events })} />
            <StatCard
              label={t("rl.prevented")}
              value={usd(data.summary.total_prevented_usd)}
              hint={t("rl.preventedHint", { p: data.summary.prevented_events, nm: data.summary.near_miss_events })}
            />
            <StatCard
              label={t("rl.net")}
              value={usd(data.summary.net_risk_usd)}
              hint={t("rl.exposure", { n: usd(data.summary.total_exposure_usd) })}
            />
            <StatCard label={t("rl.avgAck")} value={mins(data.summary.avg_ack_minutes)} hint={t("rl.slaBreaches", { n: data.summary.sla_breach_count })} />
            <StatCard label={t("rl.avgResolve")} value={mins(data.summary.avg_resolve_minutes)} />
            <StatCard label={t("rl.avgHuman")} value={mins(data.summary.avg_human_handling_minutes)} hint={t("rl.intvHint")} />
            <StatCard
              label={t("rl.humanQueue")}
              value={`${data.summary.pending_interventions} / ${data.summary.decided_interventions + data.summary.pending_interventions}`}
              hint={t("rl.pendingTotal")}
            />
          </div>

          <div className="panel p-4">
            <h3 className="font-semibold">{t("rl.byDomain")}</h3>
            <p className="text-sm text-[var(--muted)] mt-1">{t("rl.byDomainHint")}</p>
            <div className="mt-4 space-y-3">
              {data.by_domain.map((d) => (
                <div key={d.category}>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div className="font-medium">{phrase(d.category_name)}</div>
                    <div className="text-[var(--muted)]">
                      {t("rl.domainLine", { n: d.alert_count, b: d.breach_count, pct: d.breach_rate_pct })}
                    </div>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-teal-600/80"
                      style={{ width: `${(d.alert_count / maxDomainAlerts) * 100}%` }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    {t("rl.lossPrevExp", { loss: usd(d.loss_usd), prev: usd(d.prevented_usd), exp: usd(d.exposure_usd) })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3" data-testid="risk-log-closed-cards">
            <div>
              <h3 className="font-semibold">{t("rl.closedTickets")}</h3>
              <p className="text-sm text-[var(--muted)] mt-1">{t("rl.closedHint")}</p>
            </div>
            {closedPacks.length ? (
              <AlertTrackerList packs={closedPacks} canOperate={false} openId={openId} />
            ) : (
              <div className="panel p-6 text-sm text-[var(--muted)]">{t("rl.closedEmpty")}</div>
            )}
          </div>
        </div>
      )}

      {tab === "categories" && (
        <div className="panel table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{t("common.category")}</th>
                <th>{t("common.product")}</th>
                <th>{t("common.severity")}</th>
                <th>{t("rl.alerts")}</th>
                <th>{t("rl.open")}</th>
                <th>{t("rl.loss")}</th>
                <th>{t("rl.prevented")}</th>
              </tr>
            </thead>
            <tbody>
              {data.by_category.map((r, idx) => (
                <tr key={`${r.category}-${r.product}-${r.severity}-${idx}`}>
                  <td>
                    <div className="font-medium">{phrase(r.category_name)}</div>
                    <div className="text-xs text-[var(--muted)]">{phrase(r.category)}</div>
                  </td>
                  <td>
                    <Badge className="bg-orange-50 text-orange-900 border-orange-200">{phrase(r.product)}</Badge>
                  </td>
                  <td>
                    <SeverityBadge value={r.severity} />
                  </td>
                  <td className="tabular-nums">{r.alert_count}</td>
                  <td className="tabular-nums">{r.open_count}</td>
                  <td className="tabular-nums">{usd(r.loss_usd)}</td>
                  <td className="tabular-nums">{usd(r.prevented_usd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "records" && (
        <div className="space-y-3">
          <div className="panel p-3 flex flex-wrap gap-2 items-end">
            <div>
              <label className="label">{t("common.domain")}</label>
              <select className="input" value={filter} onChange={(e) => setFilter(e.target.value)}>
                {domains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="label">{t("common.search")}</label>
              <input
                className="input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("rl.searchPh")}
              />
            </div>
          </div>
          {filteredRecords.map((r) => (
            <article key={r.id} className="panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <SeverityBadge value={r.severity} />
                    <StatusBadge value={r.status} />
                    {r.outcome && <Badge className="bg-slate-100 text-slate-700 border-slate-200">{phrase(r.outcome)}</Badge>}
                    <Badge className="bg-orange-50 text-orange-900 border-orange-200">{phrase(r.product)}</Badge>
                    <Badge className="bg-teal-50 text-teal-900 border-teal-200">{phrase(r.category_name)}</Badge>
                    {r.sla_breached && (
                      <Badge className="bg-rose-50 text-rose-900 border-rose-200">{t("rl.slaBreach")}</Badge>
                    )}
                  </div>
                  <h3 className="mt-2 font-semibold text-lg">
                    {r.alert_id} · {phrase(r.title)}
                  </h3>
                  <div className="text-xs text-[var(--muted)] mt-1">
                    {r.created_at} · {r.monitor_id} · {phrase(r.indicator_name)}
                    {r.ticket_id ? ` · ${t("common.ticket")} ${r.ticket_id} (${phrase(r.ticket_status)})` : ""}
                  </div>
                  <p className="text-sm mt-2 text-slate-700">{phrase(r.message)}</p>
                  {r.impact_notes && <p className="text-sm mt-1 text-[var(--muted)]">{phrase(r.impact_notes)}</p>}
                </div>
                <div className="text-sm space-y-1 text-right">
                  <div>{t("rl.ack")} {mins(r.ack_minutes)}</div>
                  <div>{t("rl.resolve")} {mins(r.resolve_minutes)}</div>
                  <div>{t("rl.humanGate")} {mins(r.human_handling_minutes)}</div>
                  <div className="tabular-nums">{t("rl.loss")} {usd(r.estimated_loss_usd)}</div>
                  <div className="tabular-nums">{t("rl.prevented")} {usd(r.prevented_loss_usd)}</div>
                  {r.loophole_tag && (
                    <Badge className="bg-amber-50 text-amber-900 border-amber-200">{r.loophole_tag}</Badge>
                  )}
                </div>
              </div>
            </article>
          ))}
          {!filteredRecords.length && (
            <div className="panel p-6 text-sm text-[var(--muted)]">{t("rl.empty")}</div>
          )}
        </div>
      )}

      {tab === "handling" && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <StatCard label={t("rl.avgAckTitle")} value={mins(data.summary.avg_ack_minutes)} hint={t("rl.avgAckHint")} />
            <StatCard label={t("rl.avgResTitle")} value={mins(data.summary.avg_resolve_minutes)} hint={t("rl.avgResHint")} />
            <StatCard
              label={t("rl.avgHumTitle")}
              value={mins(data.summary.avg_human_handling_minutes)}
              hint={t("rl.avgHumHint")}
            />
          </div>
          <div className="panel table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>{t("common.when")}</th>
                  <th>{t("common.alert")}</th>
                  <th>{t("common.category")}</th>
                  <th>{t("rl.ack")}</th>
                  <th>{t("rl.resolve")}</th>
                  <th>{t("common.human")}</th>
                  <th>{t("common.sla")}</th>
                </tr>
              </thead>
              <tbody>
                {data.records.map((r) => (
                  <tr key={r.id}>
                    <td className="text-sm whitespace-nowrap">{r.created_at}</td>
                    <td>
                      <div className="font-medium">{r.alert_id}</div>
                      <div className="text-xs text-[var(--muted)]">{phrase(r.title)}</div>
                    </td>
                    <td className="text-sm">{phrase(r.category_name)}</td>
                    <td className="tabular-nums">{mins(r.ack_minutes)}</td>
                    <td className="tabular-nums">{mins(r.resolve_minutes)}</td>
                    <td className="tabular-nums">{mins(r.human_handling_minutes)}</td>
                    <td>
                      {r.sla_breached ? (
                        <Badge className="bg-rose-50 text-rose-900 border-rose-200">{t("rl.breachNm", { n: r.sla_minutes ?? 0 })}</Badge>
                      ) : (
                        <span className="text-sm text-[var(--muted)]">{r.sla_minutes ? `${r.sla_minutes}m` : "—"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "money" && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <StatCard label={t("rl.totalLoss")} value={usd(data.summary.total_loss_usd)} />
            <StatCard label={t("rl.totalPrev")} value={usd(data.summary.total_prevented_usd)} />
            <StatCard label={t("rl.expCovered")} value={usd(data.summary.total_exposure_usd)} />
            <StatCard
              label={t("rl.prevRatio")}
              value={
                data.summary.total_prevented_usd + data.summary.total_loss_usd > 0
                  ? `${Math.round(
                      (100 * data.summary.total_prevented_usd) /
                        (data.summary.total_prevented_usd + data.summary.total_loss_usd)
                    )}%`
                  : "—"
              }
              hint={t("rl.prevRatioHint")}
            />
          </div>
          <div className="panel table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>{t("common.alert")}</th>
                  <th>{t("rl.outcome")}</th>
                  <th>{t("common.category")}</th>
                  <th>{t("rl.loss")}</th>
                  <th>{t("rl.prevented")}</th>
                  <th>{t("rl.expCovered")}</th>
                  <th>{t("common.notes")}</th>
                </tr>
              </thead>
              <tbody>
                {data.records.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="font-medium">{r.alert_id}</div>
                      <div className="text-xs text-[var(--muted)]">{phrase(r.title)}</div>
                    </td>
                    <td>
                      <StatusBadge value={r.outcome || "OPEN"} />
                    </td>
                    <td className="text-sm">{phrase(r.category_name)}</td>
                    <td className="tabular-nums">{usd(r.estimated_loss_usd)}</td>
                    <td className="tabular-nums">{usd(r.prevented_loss_usd)}</td>
                    <td className="tabular-nums">{usd(r.exposure_usd)}</td>
                    <td className="text-sm text-[var(--muted)] max-w-xs">{phrase(r.impact_notes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "loopholes" && (
        <div className="space-y-4">
          <div className="panel p-4">
            <h3 className="font-semibold">{t("rl.loopTitle")}</h3>
            <p className="text-sm text-[var(--muted)] mt-1">{t("rl.loopHint")}</p>
          </div>
          <div className="panel table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>{t("rl.loopGap")}</th>
                  <th>{t("common.domain")}</th>
                  <th>{t("common.product")}</th>
                  <th>{t("rl.incidents")}</th>
                  <th>{t("rl.breaches")}</th>
                  <th>{t("rl.avgAckTitle")}</th>
                  <th>{t("rl.loss")}</th>
                  <th>{t("rl.prevented")}</th>
                </tr>
              </thead>
              <tbody>
                {data.loopholes.map((l, idx) => (
                  <tr key={`${l.loophole_tag}-${l.domain_code}-${l.product}-${idx}`}>
                    <td>
                      <Badge className="bg-amber-50 text-amber-900 border-amber-200">{l.loophole_tag}</Badge>
                    </td>
                    <td className="text-sm">{l.category_name}</td>
                    <td>
                      <Badge className="bg-orange-50 text-orange-900 border-orange-200">{l.product}</Badge>
                    </td>
                    <td className="tabular-nums">{l.incidents}</td>
                    <td className="tabular-nums font-semibold">{l.breach_incidents}</td>
                    <td className="tabular-nums">{mins(l.avg_ack_minutes)}</td>
                    <td className="tabular-nums">{usd(l.loss_usd)}</td>
                    <td className="tabular-nums">{usd(l.prevented_usd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel p-4">
            <h3 className="font-semibold">{t("rl.chrono")}</h3>
            <p className="text-sm text-[var(--muted)] mt-1">{t("rl.chronoHint")}</p>
            <div className="mt-3 space-y-2 max-h-[480px] overflow-auto">
              {data.timeline.map((t, idx) => (
                <div
                  key={`${t.kind}-${t.ref}-${idx}`}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
                >
                  <span className="text-xs text-[var(--muted)] whitespace-nowrap">{t.at}</span>
                  <Badge className="bg-slate-100 text-slate-700 border-slate-200">{phrase(t.kind)}</Badge>
                  <SeverityBadge value={t.severity || "INFO"} />
                  <span className="font-medium">{phrase(t.title)}</span>
                  <span className="text-xs text-[var(--muted)]">{t.ref}</span>
                  {t.category && (
                    <Badge className="bg-teal-50 text-teal-900 border-teal-200">{t.category}</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-[var(--muted)]">
            {t("rl.related")} <Link className="underline" href="/admin/alerts">{navLabel("/admin/alerts", locale, "Realtime Alert & Tracker")}</Link> ·{" "}
            <Link className="underline" href="/admin/spine">{navLabel("/admin/spine", locale, "Spine Log")}</Link> ·{" "}
            <Link className="underline" href="/admin/audit">{navLabel("/admin/audit", locale, "Audit Log")}</Link>
          </p>
        </div>
      )}
    </div>
  );
}
