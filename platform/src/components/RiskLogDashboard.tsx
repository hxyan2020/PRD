"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge, SeverityBadge, StatCard, StatusBadge } from "@/components/ui";

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
  { id: "overview", label: "Overview" },
  { id: "categories", label: "By category" },
  { id: "records", label: "Chronological log" },
  { id: "handling", label: "Handling time" },
  { id: "money", label: "Loss vs prevented" },
  { id: "loopholes", label: "Loophole areas" },
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

export function RiskLogDashboard({ data }: { data: Dashboard }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("overview");
  const [filter, setFilter] = useState("ALL");
  const [q, setQ] = useState("");

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`btn ${tab === t.id ? "btn-primary" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <StatCard label="Alerts (all)" value={data.summary.alerts_total} hint={`${data.summary.open_alerts} open/acked`} />
            <StatCard label="Est. loss" value={usd(data.summary.total_loss_usd)} hint={`${data.summary.loss_events} loss events`} />
            <StatCard
              label="Prevented"
              value={usd(data.summary.total_prevented_usd)}
              hint={`${data.summary.prevented_events} prevented · ${data.summary.near_miss_events} near-miss`}
            />
            <StatCard
              label="Net (loss − prevented)"
              value={usd(data.summary.net_risk_usd)}
              hint={`Exposure ${usd(data.summary.total_exposure_usd)}`}
            />
            <StatCard label="Avg ack time" value={mins(data.summary.avg_ack_minutes)} hint={`${data.summary.sla_breach_count} SLA breaches`} />
            <StatCard label="Avg resolve time" value={mins(data.summary.avg_resolve_minutes)} />
            <StatCard label="Avg human gate" value={mins(data.summary.avg_human_handling_minutes)} hint="Intervention request → decision" />
            <StatCard
              label="Human queue"
              value={`${data.summary.pending_interventions} / ${data.summary.decided_interventions + data.summary.pending_interventions}`}
              hint="Pending / total interventions"
            />
          </div>

          <div className="panel p-4">
            <h3 className="font-semibold">Alerts by risk domain</h3>
            <p className="text-sm text-[var(--muted)] mt-1">Where volume and breaches concentrate.</p>
            <div className="mt-4 space-y-3">
              {data.by_domain.map((d) => (
                <div key={d.category}>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div className="font-medium">{d.category_name}</div>
                    <div className="text-[var(--muted)]">
                      {d.alert_count} alerts · {d.breach_count} breach · {d.breach_rate_pct}% breach rate
                    </div>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-teal-600/80"
                      style={{ width: `${(d.alert_count / maxDomainAlerts) * 100}%` }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    Loss {usd(d.loss_usd)} · Prevented {usd(d.prevented_usd)} · Exposure {usd(d.exposure_usd)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "categories" && (
        <div className="panel table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Category</th>
                <th>Product</th>
                <th>Severity</th>
                <th>Alerts</th>
                <th>Open</th>
                <th>Loss</th>
                <th>Prevented</th>
              </tr>
            </thead>
            <tbody>
              {data.by_category.map((r, idx) => (
                <tr key={`${r.category}-${r.product}-${r.severity}-${idx}`}>
                  <td>
                    <div className="font-medium">{r.category_name}</div>
                    <div className="text-xs text-[var(--muted)]">{r.category}</div>
                  </td>
                  <td>
                    <Badge className="bg-orange-50 text-orange-900 border-orange-200">{r.product}</Badge>
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
              <label className="label">Domain</label>
              <select className="input" value={filter} onChange={(e) => setFilter(e.target.value)}>
                {domains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="label">Search</label>
              <input
                className="input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Alert id, title, loophole…"
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
                    {r.outcome && <Badge className="bg-slate-100 text-slate-700 border-slate-200">{r.outcome}</Badge>}
                    <Badge className="bg-orange-50 text-orange-900 border-orange-200">{r.product}</Badge>
                    <Badge className="bg-teal-50 text-teal-900 border-teal-200">{r.category_name}</Badge>
                    {r.sla_breached && (
                      <Badge className="bg-rose-50 text-rose-900 border-rose-200">SLA breach</Badge>
                    )}
                  </div>
                  <h3 className="mt-2 font-semibold text-lg">
                    {r.alert_id} · {r.title}
                  </h3>
                  <div className="text-xs text-[var(--muted)] mt-1">
                    {r.created_at} · {r.monitor_id} · {r.indicator_name}
                    {r.ticket_id ? ` · ticket ${r.ticket_id} (${r.ticket_status})` : ""}
                  </div>
                  <p className="text-sm mt-2 text-slate-700">{r.message}</p>
                  {r.impact_notes && <p className="text-sm mt-1 text-[var(--muted)]">{r.impact_notes}</p>}
                </div>
                <div className="text-sm space-y-1 text-right">
                  <div>Ack {mins(r.ack_minutes)}</div>
                  <div>Resolve {mins(r.resolve_minutes)}</div>
                  <div>Human gate {mins(r.human_handling_minutes)}</div>
                  <div className="tabular-nums">Loss {usd(r.estimated_loss_usd)}</div>
                  <div className="tabular-nums">Prevented {usd(r.prevented_loss_usd)}</div>
                  {r.loophole_tag && (
                    <Badge className="bg-amber-50 text-amber-900 border-amber-200">{r.loophole_tag}</Badge>
                  )}
                </div>
              </div>
            </article>
          ))}
          {!filteredRecords.length && (
            <div className="panel p-6 text-sm text-[var(--muted)]">No records match filters.</div>
          )}
        </div>
      )}

      {tab === "handling" && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <StatCard label="Average ack" value={mins(data.summary.avg_ack_minutes)} hint="Alert created → acknowledged" />
            <StatCard label="Average resolve" value={mins(data.summary.avg_resolve_minutes)} hint="Ticket created → resolved" />
            <StatCard
              label="Average human handling"
              value={mins(data.summary.avg_human_handling_minutes)}
              hint="Intervention requested → decided"
            />
          </div>
          <div className="panel table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Alert</th>
                  <th>Category</th>
                  <th>Ack</th>
                  <th>Resolve</th>
                  <th>Human</th>
                  <th>SLA</th>
                </tr>
              </thead>
              <tbody>
                {data.records.map((r) => (
                  <tr key={r.id}>
                    <td className="text-sm whitespace-nowrap">{r.created_at}</td>
                    <td>
                      <div className="font-medium">{r.alert_id}</div>
                      <div className="text-xs text-[var(--muted)]">{r.title}</div>
                    </td>
                    <td className="text-sm">{r.category_name}</td>
                    <td className="tabular-nums">{mins(r.ack_minutes)}</td>
                    <td className="tabular-nums">{mins(r.resolve_minutes)}</td>
                    <td className="tabular-nums">{mins(r.human_handling_minutes)}</td>
                    <td>
                      {r.sla_breached ? (
                        <Badge className="bg-rose-50 text-rose-900 border-rose-200">BREACH {r.sla_minutes}m</Badge>
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
            <StatCard label="Total loss" value={usd(data.summary.total_loss_usd)} />
            <StatCard label="Total prevented" value={usd(data.summary.total_prevented_usd)} />
            <StatCard label="Exposure covered" value={usd(data.summary.total_exposure_usd)} />
            <StatCard
              label="Prevention ratio"
              value={
                data.summary.total_prevented_usd + data.summary.total_loss_usd > 0
                  ? `${Math.round(
                      (100 * data.summary.total_prevented_usd) /
                        (data.summary.total_prevented_usd + data.summary.total_loss_usd)
                    )}%`
                  : "—"
              }
              hint="Prevented ÷ (prevented + loss)"
            />
          </div>
          <div className="panel table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Alert</th>
                  <th>Outcome</th>
                  <th>Category</th>
                  <th>Loss</th>
                  <th>Prevented</th>
                  <th>Exposure</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.records.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="font-medium">{r.alert_id}</div>
                      <div className="text-xs text-[var(--muted)]">{r.title}</div>
                    </td>
                    <td>
                      <StatusBadge value={r.outcome || "OPEN"} />
                    </td>
                    <td className="text-sm">{r.category_name}</td>
                    <td className="tabular-nums">{usd(r.estimated_loss_usd)}</td>
                    <td className="tabular-nums">{usd(r.prevented_loss_usd)}</td>
                    <td className="tabular-nums">{usd(r.exposure_usd)}</td>
                    <td className="text-sm text-[var(--muted)] max-w-xs">{r.impact_notes}</td>
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
            <h3 className="font-semibold">Areas more subject to loopholes</h3>
            <p className="text-sm text-[var(--muted)] mt-1">
              Ranked by breach incidents, recurrence, and residual loss after controls.
            </p>
          </div>
          <div className="panel table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Loophole / gap</th>
                  <th>Domain</th>
                  <th>Product</th>
                  <th>Incidents</th>
                  <th>Breaches</th>
                  <th>Avg ack</th>
                  <th>Loss</th>
                  <th>Prevented</th>
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
            <h3 className="font-semibold">Unified chronological stream</h3>
            <p className="text-sm text-[var(--muted)] mt-1">Alerts + interventions + spine events.</p>
            <div className="mt-3 space-y-2 max-h-[480px] overflow-auto">
              {data.timeline.map((t, idx) => (
                <div
                  key={`${t.kind}-${t.ref}-${idx}`}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
                >
                  <span className="text-xs text-[var(--muted)] whitespace-nowrap">{t.at}</span>
                  <Badge className="bg-slate-100 text-slate-700 border-slate-200">{t.kind}</Badge>
                  <SeverityBadge value={t.severity || "INFO"} />
                  <span className="font-medium">{t.title}</span>
                  <span className="text-xs text-[var(--muted)]">{t.ref}</span>
                  {t.category && (
                    <Badge className="bg-teal-50 text-teal-900 border-teal-200">{t.category}</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-[var(--muted)]">
            Related: <Link className="underline" href="/admin/alerts">Live Alerts</Link> ·{" "}
            <Link className="underline" href="/admin/spine">Spine Log</Link> ·{" "}
            <Link className="underline" href="/admin/audit">Audit Log</Link>
          </p>
        </div>
      )}
    </div>
  );
}
