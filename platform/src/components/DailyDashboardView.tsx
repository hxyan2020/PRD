"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, StatusBadge, StatCard } from "@/components/ui";
import { useT } from "@/hooks/useUiLocale";
import { cn } from "@/lib/utils";

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
  const { t } = useT();
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/dashboard", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || t("dash.refreshFailed"));
      return;
    }
    setMsg(t("dash.refreshed", { date: data.date, n: data.metrics }));
    router.refresh();
  }

  function Sphere({
    tone,
    title,
    product,
    rows,
    warn,
    breach,
  }: {
    tone: "cfd" | "ex";
    title: string;
    product: string;
    rows: Metric[];
    warn: number;
    breach: number;
  }) {
    const cfdTone = tone === "cfd";
    return (
      <section
        className={cn(
          "relative overflow-hidden rounded-3xl border p-4 sm:p-5",
          cfdTone
            ? "border-teal-200 bg-gradient-to-br from-teal-50 via-white to-white"
            : "border-violet-200 bg-gradient-to-br from-violet-50 via-white to-white"
        )}
      >
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full opacity-35 blur-2xl",
            cfdTone ? "bg-teal-300" : "bg-violet-300"
          )}
        />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <div
              className={cn(
                "text-xs font-semibold uppercase tracking-[0.14em]",
                cfdTone ? "text-teal-800" : "text-violet-800"
              )}
            >
              {cfdTone ? t("dash.sphereCfd") : t("dash.sphereEx")}
            </div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl mt-1">{title}</h2>
          </div>
          <Badge className={cfdTone ? "bg-teal-50 text-teal-900 border-teal-200" : "bg-violet-50 text-violet-900 border-violet-200"}>
            {product}
          </Badge>
        </div>
        <div className="relative mt-4 grid grid-cols-2 gap-2">
          <StatCard label={cfdTone ? t("dash.cfdWarn") : t("dash.cryptoWarn")} value={warn} />
          <StatCard
            label={cfdTone ? t("dash.cfdBreach") : t("dash.cryptoBreach")}
            value={breach}
            tone={breach > 0 ? "alert" : "default"}
          />
        </div>
        <div className="relative mt-4 grid sm:grid-cols-2 gap-3">
          {rows.map((m) => (
            <div key={m.metric_key} className="rounded-xl border border-[var(--line)] bg-white/80 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{m.metric_label}</div>
                <StatusBadge value={m.status === "OK" ? "HEALTHY" : m.status} />
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">
                {typeof m.value === "number" ? m.value.toLocaleString() : m.value}
                {m.unit ? <span className="text-sm font-normal text-[var(--muted)] ml-1">{m.unit}</span> : null}
              </div>
              <div className="text-xs text-[var(--muted)] mt-1">
                {m.target != null ? `${t("dash.target", { n: `${m.target}${m.unit ?? ""}` })} · ` : ""}
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
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{t("dash.reportDate")}</div>
          <div className="font-semibold text-lg">{reportDate}</div>
          <p className="text-sm text-[var(--muted)] mt-1">{t("dash.intro")}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={refresh}>
          {t("dash.refresh")}
        </button>
      </div>
      {msg && (
        <div role="status" className="text-sm bg-teal-50 border border-teal-200 text-teal-900 rounded-lg px-3 py-2">
          {msg}
        </div>
      )}

      <div className="grid xl:grid-cols-2 gap-4">
        <Sphere tone="cfd" title={t("dash.cfdBook")} product="CFD" rows={cfd} warn={summary.cfd_warn} breach={summary.cfd_breach} />
        <Sphere
          tone="ex"
          title={t("dash.cryptoEx")}
          product="EXCHANGE"
          rows={crypto}
          warn={summary.crypto_warn}
          breach={summary.crypto_breach}
        />
      </div>
    </div>
  );
}
