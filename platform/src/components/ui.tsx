import { deptLabel, severityClass, statusClass } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--muted)] max-w-3xl">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="panel p-4">
      <div className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">{label}</div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-[var(--muted)]">{hint}</div>}
    </div>
  );
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={`badge ${className ?? ""}`}>{children}</span>;
}

export function SeverityBadge({ value }: { value: string }) {
  return <Badge className={severityClass(value)}>{value}</Badge>;
}

export function StatusBadge({ value }: { value: string }) {
  return <Badge className={statusClass(value)}>{value}</Badge>;
}

export function DeptBadge({ code }: { code: string | null | undefined }) {
  return <Badge className="bg-slate-100 text-slate-700 border-slate-200">{deptLabel(code)}</Badge>;
}
