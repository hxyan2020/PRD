"use client";

import { AdminLink } from "@/components/AdminLink";
import { getIndicatorMeta, isMonitorCode } from "@/lib/monitor-indicator-meta";
import { useUiLocale } from "@/hooks/useUiLocale";
import { cn } from "@/lib/utils";

type Tone = "badge" | "inline" | "status";

/**
 * Clickable Monitor 2.0 indicator code with hover tooltip.
 * Links to the indicator definition on /admin/monitor-2#M2-…
 */
export function MonitorCode({
  id,
  name,
  unit,
  status,
  tone = "badge",
  className,
}: {
  id: string;
  name?: string | null;
  unit?: string | null;
  status?: string | null;
  tone?: Tone;
  className?: string;
}) {
  const { locale } = useUiLocale();
  const code = (id || "").trim();
  if (!code || !isMonitorCode(code)) {
    return <span className={className}>{id}</span>;
  }

  const meta = getIndicatorMeta(code, { name, unit });
  const href = `/admin/monitor-2#${encodeURIComponent(code)}`;
  const definedLabel =
    locale === "zh-Hant" ? "定義於 Monitor 2.0 → 點此開啟" : "Defined in Monitor 2.0 → open";
  const freq = locale === "zh-Hant" ? meta.frequency_zh : meta.frequency;
  const tipTitle = meta.name;
  const tipBody = meta.description;

  const statusCls =
    status === "BREACH" || status === "CRITICAL"
      ? "border-rose-300 bg-rose-50 text-rose-900"
      : status === "WARN"
        ? "border-amber-300 bg-amber-50 text-amber-950"
        : status
          ? "border-teal-200 bg-teal-50 text-teal-900"
          : "";

  const chipCls =
    tone === "inline"
      ? "font-mono text-[inherit] text-teal-800 underline decoration-dotted underline-offset-2 hover:text-teal-950"
      : tone === "status"
        ? cn(
            "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-mono hover:underline",
            statusCls || "border-teal-200 bg-teal-50 text-teal-900"
          )
        : "inline-flex items-center rounded-md border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-[11px] font-mono font-semibold text-orange-950 hover:bg-orange-100 hover:underline";

  return (
    <span className={cn("relative inline-flex group/m2 align-baseline", className)}>
      <AdminLink href={href} className={chipCls}>
        <span title={`${tipTitle} — ${tipBody}`}>{code}</span>
        {tone === "status" && unit ? (
          <span className="font-sans opacity-70">· {unit}</span>
        ) : null}
      </AdminLink>
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-0 top-full z-40 mt-1.5 w-72 max-w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-3 text-left shadow-lg",
          "opacity-0 translate-y-1 transition duration-150",
          "group-hover/m2:opacity-100 group-hover/m2:translate-y-0 group-hover/m2:pointer-events-auto",
          "group-focus-within/m2:opacity-100 group-focus-within/m2:translate-y-0 group-focus-within/m2:pointer-events-auto"
        )}
      >
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-700">
          Monitor 2.0
        </div>
        <div className="mt-0.5 font-mono text-xs font-semibold text-slate-900">{code}</div>
        <div className="mt-0.5 text-sm font-semibold text-slate-900 leading-snug">{tipTitle}</div>
        <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{tipBody}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
          <span>
            {locale === "zh-Hant" ? "採樣" : "Cadence"}: {freq}
          </span>
          {unit ? (
            <span>
              {locale === "zh-Hant" ? "單位" : "Unit"}: {unit}
            </span>
          ) : null}
        </div>
        {meta.risk_scenarios[0] ? (
          <div className="mt-2 text-[11px] text-slate-500 line-clamp-2">
            {locale === "zh-Hant" ? "相關情境" : "Related"}: {meta.risk_scenarios[0]}
          </div>
        ) : null}
        <AdminLink
          href={href}
          className="mt-2 inline-flex text-[11px] font-semibold text-teal-800 underline underline-offset-2 hover:text-teal-950"
        >
          {definedLabel}
        </AdminLink>
      </span>
    </span>
  );
}
