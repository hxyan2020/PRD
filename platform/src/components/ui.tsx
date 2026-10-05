"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn, deptLabel, severityClass, statusClass } from "@/lib/utils";
import { stageLabel, statusLabel } from "@/lib/i18n";
import { useUiLocale } from "@/hooks/useUiLocale";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-4 sm:mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-[family-name:var(--font-display)] text-xl sm:text-2xl tracking-tight break-word">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-[var(--muted)] max-w-3xl break-word">{subtitle}</p>
        )}
      </div>
      {actions ? (
        <div className="page-actions shrink-0 [&>.flex]:contents [&>div]:contents">{actions}</div>
      ) : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  href,
  icon,
  tone = "default",
  cta,
}: {
  label: ReactNode;
  value: string | number;
  hint?: ReactNode;
  href?: string;
  icon?: ReactNode;
  tone?: "default" | "alert";
  cta?: ReactNode;
}) {
  const alert = tone === "alert";
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {icon ? (
            <span
              className={cn(
                "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg [&>svg]:h-4 [&>svg]:w-4",
                alert ? "bg-orange-50 text-orange-700" : "bg-teal-50 text-teal-800"
              )}
            >
              {icon}
            </span>
          ) : null}
          <div className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">{label}</div>
        </div>
        {href ? (
          <ChevronRight
            className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-teal-700"
            aria-hidden
          />
        ) : null}
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
      {(hint || (href && cta)) && (
        <div className="mt-1 flex items-end justify-between gap-2">
          {hint ? <div className="text-xs text-[var(--muted)]">{hint}</div> : <span />}
          {href && cta ? (
            <div className="text-xs font-semibold text-teal-800 whitespace-nowrap">{cta}</div>
          ) : null}
        </div>
      )}
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "panel card-link group p-4 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40",
          alert && "border-orange-200"
        )}
      >
        {inner}
      </Link>
    );
  }
  return <div className="panel p-4">{inner}</div>;
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={`badge ${className ?? ""}`}>{children}</span>;
}

export function SeverityBadge({ value }: { value: string }) {
  const { locale } = useUiLocale();
  return <Badge className={severityClass(value)}>{statusLabel(value, locale)}</Badge>;
}

export function StatusBadge({ value }: { value: string }) {
  const { locale } = useUiLocale();
  return <Badge className={statusClass(value)}>{statusLabel(value, locale)}</Badge>;
}

export function DeptBadge({ code }: { code: string | null | undefined }) {
  const { locale } = useUiLocale();
  return (
    <Badge className="bg-slate-100 text-slate-700 border-slate-200 whitespace-nowrap shrink-0">{deptLabel(code, locale)}</Badge>
  );
}

export function StageLabel({ stage, hours }: { stage: string; hours?: boolean }) {
  const { locale } = useUiLocale();
  const label = stageLabel(stage, locale);
  return <>{hours ? (locale === "zh-Hant" ? `${label}（24 小時）` : `${label} (24h)`) : label}</>;
}
