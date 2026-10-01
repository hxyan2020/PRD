"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, StatusBadge, StatCard } from "@/components/ui";

type Metric = {
  product: string;
  metric_key: string;
  metric_label: string;
  value: number;
  unit: string | null;
  target: number | null;
  status: string;
  notes: string | null;
};

export function DailyDashboardView({
  reportDate,
  cfd,
  crypto,
  summary,
}: {
  reportDate: string;
  cfd: Metric[];
  crypto: Metric[];
  summary: {
    cfd_warn: number;
    cfd_breach: number;
    crypto_warn: number;
    crypto_breach: number;
  };
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/dashboard", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Refresh failed");
      return;
    }
    setMsg(`Refreshed ${data.date} · ${data.metrics} live metrics`);
    router.refresh();
  }

  function MetricGrid({ title, rows, product }: { title: string; rows: Metric[]; product: string }) {
    return (
      <section className="panel p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-[family-name:var(--font-display)] text-xl">{title}</h2>
          <Badge className="bg-orange-50 text-orange-900 border-orange-200">{product}</Badge>
        </div>
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          {rows.map((m) => (
            <div key={m.metric_key} className="rounded-xl border border-[var(--line)] p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{m.metric_label}</div>
                <StatusBadge value={m.status === "OK" ? "HEALTHY" : m.status} />
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">
                {typeof m.value === "number" ? m.value.toLocaleString() : m.value}
                {m.unit ? <span className="text-sm font-normal text-[var(--muted)] ml-1">{m.unit}</span> : null}
              </div>
              <div className="text-xs text-[var(--muted)] mt-1">
                {m.target != null ? `target ${m.target}${m.unit ?? ""} · ` : ""}
                {m.notes ?? ""}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <div className="panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Report date</div>
          <div className="font-semibold text-lg">{reportDate}</div>
          <p className="text-sm text-[var(--muted)] mt-1">
            Daily performance across CFD book and crypto exchange — refreshed from live detectors / Monitor / interventions.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={refresh}>
          Refresh live metrics
        </button>
      </div>
      {msg && (
        <div role="status" className="text-sm bg-teal-50 border border-teal-200 text-teal-900 rounded-lg px-3 py-2">
          {msg}
        </div>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="CFD WARN" value={summary.cfd_warn} />
        <StatCard label="CFD BREACH" value={summary.cfd_breach} />
        <StatCard label="Crypto WARN" value={summary.crypto_warn} />
        <StatCard label="Crypto BREACH" value={summary.crypto_breach} />
      </div>

      <div className="grid xl:grid-cols-2 gap-4">
        <MetricGrid title="CFD book" rows={cfd} product="CFD" />
        <MetricGrid title="Crypto exchange" rows={crypto} product="CRYPTO" />
      </div>
    </div>
  );
}
