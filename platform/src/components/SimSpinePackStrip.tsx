"use client";

import Link from "next/link";
import { AdminLink } from "@/components/AdminLink";
import { EnZh } from "@/components/EnZh";
import { useUiLocale } from "@/hooks/useUiLocale";
import {
  FOREX_INCIDENT_1028,
  forexIncidentChip,
  forexPrimaryNextSteps,
} from "@/lib/demo/forex-incident-1028";
import type { ForexPackLiveMonitor, ForexPackLiveSpine } from "@/lib/demo/forex-pack-live";

/**
 * Shows live vantage_risk.db pack values above labs / Discovery / aggregation
 * so SQL and desk modules share one visible simulation spine (no second banner).
 */
export function SimSpinePackStrip({
  monitors = [],
  spine,
  context = "lab",
  showDeskLinks = true,
}: {
  monitors?: ForexPackLiveMonitor[];
  spine?: Pick<
    ForexPackLiveSpine,
    "analysis_id" | "thread_id" | "discovery_candidates" | "aggregation_sessions" | "detector_runs" | "risk_log_days"
  > | null;
  context?: "lab" | "compact";
  /** Desk next-step chips — replaces a separate ForexDeskPackLinks when true. */
  showDeskLinks?: boolean;
}) {
  const { locale } = useUiLocale();
  const zh = locale === "zh-Hant";
  const fx = FOREX_INCIDENT_1028;
  const rows = monitors.length ? monitors : [];
  if (!rows.length && !spine) return null;

  return (
    <div
      className="panel p-3 sm:p-4 border-teal-200 bg-teal-50/50 space-y-2"
      data-testid="sim-spine-pack-strip"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-teal-900">
            <EnZh
              en={`Live SQLite spine · ${fx.incident_id} pack`}
              zh={`即時 SQLite 脊柱 · ${fx.incident_id} 組合`}
            />
          </div>
          <div className="font-mono text-[11px] font-semibold text-teal-950/90 mt-0.5">
            {forexIncidentChip(locale)}
          </div>
        </div>
        <div className="action-row">
          <AdminLink className="btn btn-sm" href="/admin/docs/simulated-data">
            <EnZh en="Simulated Data / SQL" zh="模擬資料／SQL" />
          </AdminLink>
          <AdminLink className="btn btn-sm" href="/admin/discovery">
            <EnZh en="Discovery" zh="探索" />
          </AdminLink>
          <AdminLink className="btn btn-sm" href={fx.aggregation_path}>
            <EnZh en="L2 aggregation" zh="L2 聚合" />
          </AdminLink>
        </div>
      </div>
      {context === "lab" ? (
        <p className="text-[11px] text-teal-900/80">
          <EnZh
            en="HTML labs below may use offline scenarios. These values come from vantage_risk.db — the same seed SQL explorer, Discovery, L2 aggregation, RCA, and Messenger query."
            zh="下方 HTML 實驗室可能使用離線場景。這些數值來自 vantage_risk.db — 與 SQL 探索器、探索、L2 聚合、RCA、Messenger 同一種子。"
          />
        </p>
      ) : null}
      {spine ? (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-teal-950/90 font-mono">
          <span>AIA={spine.analysis_id || "—"}</span>
          <span>THR={spine.thread_id || "—"}</span>
          <span>discovery={spine.discovery_candidates}</span>
          <span>agg_sessions={spine.aggregation_sessions}</span>
          <span>detector_runs={spine.detector_runs}</span>
          <span>risk_log_days={spine.risk_log_days}</span>
        </div>
      ) : null}
      {rows.length ? (
        <ul className="grid sm:grid-cols-2 gap-2 text-xs">
          {rows.map((m) => (
            <li
              key={m.monitor_id}
              className="rounded-md border border-teal-200/80 bg-white/70 px-2.5 py-2 flex items-start justify-between gap-2"
            >
              <div className="min-w-0">
                <AdminLink
                  className="font-mono text-[12px] text-teal-950 underline-offset-2 hover:underline"
                  href={`/admin/monitor-2?monitor_id=${m.monitor_id}`}
                >
                  {m.monitor_id}
                </AdminLink>
                <div className="text-[11px] text-[var(--muted)] truncate">{m.name}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-semibold tabular-nums">
                  {m.last_value ?? "—"}
                  {m.unit ? ` ${m.unit}` : ""}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{m.status}</div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {showDeskLinks ? (
        <div className="flex flex-wrap gap-1.5 pt-1" data-testid="sim-spine-desk-links">
          {forexPrimaryNextSteps().map((l) => (
            <Link key={l.href} className="btn btn-sm" href={l.href}>
              {zh ? l.zh : l.en}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
