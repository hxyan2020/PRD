"use client";

import Link from "next/link";
import { Compass, ChevronRight, Sparkles } from "lucide-react";
import { EnZh } from "@/components/EnZh";

export type DiscoveryLaneStat = {
  pending: number;
  inMonitoring: number;
  latestTitle?: string | null;
  latestAt?: string | null;
};

export function HomeDiscoveryLane({ stats }: { stats: DiscoveryLaneStat }) {
  return (
    <section
      className="panel relative mt-4 overflow-hidden p-3 sm:p-4 border-amber-200"
      data-testid="home-discovery-lane"
      aria-label="Unknown risk discovery lane"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.12),transparent_55%),linear-gradient(135deg,#fffbeb_0%,#ffffff_50%,#f8fafc_100%)]"
        aria-hidden
      />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-900">
            <Compass className="h-3.5 w-3.5" aria-hidden />
            <EnZh en="Parallel lane" zh="平行通道" />
          </div>
          <div className="font-[family-name:var(--font-display)] text-lg font-semibold mt-1">
            <EnZh en="Unknown risk discovery" zh="未知風險探索" />
          </div>
          <p className="mt-1 text-xs text-[var(--muted)] max-w-2xl leading-relaxed">
            <EnZh
              en="DISCOVER → RO review → skill + monitor (maker≠checker). Runs beside DETECT→DASHBOARD; joins daily monitoring only after RO approval."
              zh="DISCOVER → RO 審核 → 技能＋監控（制作者≠覆核者）。與 DETECT→DASHBOARD 並行；僅在 RO 核准後加入每日監控。"
            />
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-md bg-amber-600 text-white px-2 py-1 text-xs font-bold tabular-nums"
            data-testid="home-discovery-pending"
          >
            {stats.pending}{" "}
            <EnZh en="pending RO" zh="待 RO" />
          </span>
          <span
            className="rounded-md bg-teal-50 text-teal-900 px-2 py-1 text-xs font-semibold tabular-nums inline-flex items-center gap-1"
            data-testid="home-discovery-monitoring"
          >
            <Sparkles className="h-3 w-3" aria-hidden />
            {stats.inMonitoring} <EnZh en="in skills/monitor" zh="已入技能／監控" />
          </span>
          <Link className="btn btn-primary" href="/admin/discovery" data-testid="home-discovery-open">
            <EnZh en="Open discovery" zh="開啟探索" />
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
      {stats.latestTitle ? (
        <p className="relative mt-3 text-xs text-slate-700">
          <span className="font-semibold">
            <EnZh en="Latest" zh="最新" />
          </span>
          {": "}
          {stats.latestTitle}
          {stats.latestAt ? <span className="text-[var(--muted)]"> · {stats.latestAt}</span> : null}
        </p>
      ) : null}
    </section>
  );
}
