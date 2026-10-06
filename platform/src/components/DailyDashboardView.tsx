"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CandlestickChart, Coins } from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui";
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

function MetricTile({
  metric,
  tone,
}: {
  metric: Metric;
  tone: "cfd" | "ex";
}) {
  const { t } = useT();
  const cfd = tone === "cfd";
  return (
    <div
      className={cn(
        "rounded-2xl border p-3 backdrop-blur-sm transition hover:-translate-y-0.5",
        cfd
          ? "border-teal-200/80 bg-white/85 shadow-[inset_0_1px_0_rgba(228,87,41,0.08)]"
          : "border-amber-200/80 bg-white/85 shadow-[inset_0_1px_0_rgba(217,119,6,0.08)]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs uppercase tracking-wide text-[var(--muted)] leading-snug">{metric.metric_label}</div>
        <StatusBadge value={metric.status === "OK" ? "HEALTHY" : metric.status} />
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
        {typeof metric.value === "number" ? metric.value.toLocaleString() : metric.value}
        {metric.unit ? <span className="ml-1 text-sm font-normal text-[var(--muted)]">{metric.unit}</span> : null}
      </div>
      <div className="mt-1 text-xs text-[var(--muted)]">
        {metric.target != null ? `${t("dash.target", { n: `${metric.target}${metric.unit ?? ""}` })} · ` : ""}
        {metric.notes ?? ""}
      </div>
    </div>
  );
}

function SphereOrb({ tone, warn, breach }: { tone: "cfd" | "ex"; warn: number; breach: number }) {
  const cfd = tone === "cfd";
  const pressure = warn + breach * 2;
  const ring =
    breach > 0 ? (cfd ? "border-rose-400" : "border-rose-500") : warn > 0 ? (cfd ? "border-amber-400" : "border-orange-400") : cfd ? "border-teal-400" : "border-amber-400";
  return (
    <div className="relative mx-auto h-36 w-36 sm:h-40 sm:w-40" aria-hidden>
      <div
        className={cn(
          "absolute inset-0 rounded-full opacity-70 blur-xl",
          cfd ? "bg-teal-400/35" : "bg-amber-400/35"
        )}
      />
      <div
        className={cn(
          "absolute inset-2 rounded-full border-[3px]",
          ring,
          "bg-gradient-to-br",
          cfd ? "from-teal-500 via-teal-600 to-slate-800" : "from-amber-400 via-orange-500 to-slate-900"
        )}
      />
      <div className="absolute inset-[18%] rounded-full border border-white/25 bg-black/10" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        {cfd ? <CandlestickChart className="h-7 w-7 opacity-90" /> : <Coins className="h-7 w-7 opacity-90" />}
        <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] opacity-90">
          {cfd ? "CFD" : "EX"}
        </div>
        <div className="mt-0.5 text-lg font-bold tabular-nums">{pressure}</div>
        <div className="text-[10px] opacity-80">W+B</div>
      </div>
    </div>
  );
}

function Sphere({
  tone,
  title,
  hint,
  product,
  rows,
  warn,
  breach,
}: {
  tone: "cfd" | "ex";
  title: string;
  hint: string;
  product: string;
  rows: Metric[];
  warn: number;
  breach: number;
}) {
  const { t } = useT();
  const cfd = tone === "cfd";

  return (
    <section
      data-testid={cfd ? "dash-sphere-cfd" : "dash-sphere-ex"}
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] border p-4 sm:p-5",
        cfd
          ? "border-teal-300/80 bg-[radial-gradient(circle_at_20%_0%,rgba(228,87,41,0.22),transparent_42%),linear-gradient(160deg,#fef6f3_0%,#ffffff_48%,#fff7ed_100%)]"
          : "border-amber-300/80 bg-[radial-gradient(circle_at_80%_0%,rgba(251,191,36,0.28),transparent_42%),linear-gradient(200deg,#fffbeb_0%,#ffffff_48%,#fff7ed_100%)]"
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -left-8 top-10 h-44 w-44 rounded-full border opacity-30",
          cfd ? "border-teal-400" : "border-amber-400"
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-10 -bottom-16 h-56 w-56 rounded-full opacity-40 blur-3xl",
          cfd ? "bg-teal-300" : "bg-amber-300"
        )}
      />
      <div
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-1.5",
          cfd ? "bg-gradient-to-b from-teal-500 via-teal-600 to-cyan-500" : "bg-gradient-to-b from-amber-400 via-orange-500 to-amber-700"
        )}
      />

      <div className="relative grid gap-4 lg:grid-cols-[auto_1fr] lg:items-center">
        <SphereOrb tone={tone} warn={warn} breach={breach} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div
                className={cn(
                  "text-xs font-semibold uppercase tracking-[0.14em]",
                  cfd ? "text-teal-800" : "text-amber-900"
                )}
              >
                {cfd ? t("dash.sphereCfd") : t("dash.sphereEx")}
              </div>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl sm:text-3xl">{title}</h2>
              <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">{hint}</p>
            </div>
            <Badge
              className={
                cfd
                  ? "bg-teal-600 text-white border-teal-700"
                  : "bg-amber-600 text-white border-amber-700"
              }
            >
              {product}
            </Badge>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div
              className={cn(
                "rounded-2xl border px-3 py-2.5",
                cfd ? "border-teal-200 bg-white/70" : "border-amber-200 bg-white/70"
              )}
            >
              <div className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
                {cfd ? t("dash.cfdWarn") : t("dash.cryptoWarn")}
              </div>
              <div className={cn("mt-1 text-2xl font-semibold tabular-nums", warn > 0 ? "text-amber-700" : "")}>
                {warn}
              </div>
            </div>
            <div
              className={cn(
                "rounded-2xl border px-3 py-2.5",
                breach > 0
                  ? "border-rose-300 bg-rose-50/80"
                  : cfd
                    ? "border-teal-200 bg-white/70"
                    : "border-amber-200 bg-white/70"
              )}
            >
              <div className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
                {cfd ? t("dash.cfdBreach") : t("dash.cryptoBreach")}
              </div>
              <div className={cn("mt-1 text-2xl font-semibold tabular-nums", breach > 0 ? "text-rose-700" : "")}>
                {breach}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-5 grid sm:grid-cols-2 gap-3">
        {rows.map((m) => (
          <MetricTile key={m.metric_key} metric={m} tone={tone} />
        ))}
      </div>
    </section>
  );
}

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

  return (
    <div className="space-y-4">
      <div className="panel relative overflow-hidden p-4">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(228,87,41,0.08),transparent_40%,transparent_60%,rgba(217,119,6,0.10))]"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{t("dash.reportDate")}</div>
            <div className="font-semibold text-lg">{reportDate}</div>
            <p className="text-sm text-[var(--muted)] mt-1 max-w-2xl">{t("dash.intro")}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-teal-900">
                <CandlestickChart className="h-3.5 w-3.5" aria-hidden />
                {t("dash.sphereCfd")}
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-slate-500">
                {t("dash.vs")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-950">
                <Coins className="h-3.5 w-3.5" aria-hidden />
                {t("dash.sphereEx")}
              </span>
            </div>
          </div>
          <button type="button" className="btn btn-primary" onClick={refresh}>
            {t("dash.refresh")}
          </button>
        </div>
      </div>

      {msg && (
        <div role="status" className="text-sm bg-teal-50 border border-teal-200 text-teal-900 rounded-lg px-3 py-2">
          {msg}
        </div>
      )}

      <div className="grid xl:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
        <Sphere
          tone="cfd"
          title={t("dash.cfdBook")}
          hint={t("dash.cfdHint")}
          product="CFD"
          rows={cfd}
          warn={summary.cfd_warn}
          breach={summary.cfd_breach}
        />
        <div className="hidden xl:flex items-center justify-center" aria-hidden>
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-bold tracking-[0.18em] text-slate-500 shadow-sm">
            {t("dash.vs")}
          </div>
        </div>
        <Sphere
          tone="ex"
          title={t("dash.cryptoEx")}
          hint={t("dash.exHint")}
          product="EXCHANGE"
          rows={crypto}
          warn={summary.crypto_warn}
          breach={summary.crypto_breach}
        />
      </div>
    </div>
  );
}
