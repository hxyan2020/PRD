import { ChevronDown } from "lucide-react";
import { T } from "@/components/T";
import { Phrase } from "@/components/Phrase";
import type { DepartmentCharter, Duty, RoleCharter } from "@/lib/org-catalog";
import { cn } from "@/lib/utils";

type Variant = "default" | "muted" | "warn" | "teal";

const ITEM_CLASS: Record<Variant, string> = {
  default: "rounded-lg bg-slate-50 border border-[var(--line)]",
  muted: "rounded-lg bg-white border border-dashed border-[var(--line)]",
  warn: "rounded-lg bg-amber-50 border border-amber-200",
  teal: "rounded-lg bg-teal-50 border border-teal-200",
};

function DutyDropdown({ duty, variant }: { duty: Duty; variant: Variant }) {
  return (
    <details className={cn("group", ITEM_CLASS[variant])}>
      <summary className="flex cursor-pointer list-none items-start gap-2 px-3 py-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <Phrase>{duty.title}</Phrase>
        </span>
        <ChevronDown
          className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180 group-open:text-teal-700"
          aria-hidden
        />
        <span className="sr-only">
          <T k="org.dutyToggle" />
        </span>
      </summary>
      <div className="border-t border-[var(--line)] px-3 py-2.5 text-sm leading-relaxed text-[var(--muted)]">
        <p>
          <Phrase>{duty.detail}</Phrase>
        </p>
      </div>
    </details>
  );
}

export function DutyList({
  titleKey,
  items,
  variant = "default",
  className,
}: {
  titleKey: string;
  items: Duty[];
  variant?: Variant;
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <div className={cn("mt-4", className)}>
      <h3 className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
        <T k={titleKey} />
      </h3>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item.title}>
            <DutyDropdown duty={item} variant={variant} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CharterBlock({
  titleKey,
  items,
  variant = "default",
  className,
}: {
  titleKey: string;
  items: string[];
  variant?: Variant;
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <div className={cn("mt-4", className)}>
      <h3 className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
        <T k={titleKey} />
      </h3>
      <ul className="mt-2 space-y-1.5 text-sm">
        {items.map((item) => (
          <li key={item} className={cn("px-3 py-2", ITEM_CLASS[variant])}>
            <Phrase>{item}</Phrase>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DepartmentCharterView({ charter }: { charter: DepartmentCharter }) {
  return (
    <div>
      <p className="mt-4 text-xs text-[var(--muted)]">
        <T k="org.dutyHint" />
      </p>
      <DutyList titleKey="org.owns" items={charter.owns} />
      <DutyList titleKey="org.accountable" items={charter.accountable} variant="teal" />
      <DutyList titleKey="org.collaborates" items={charter.collaborates} />
      <DutyList titleKey="org.outOfScope" items={charter.outOfScope} variant="muted" />
      <DutyList titleKey="org.escalatesTo" items={charter.escalatesTo} variant="warn" />
    </div>
  );
}

export function RoleCharterView({ charter }: { charter: RoleCharter }) {
  return (
    <div className="mt-1 grid md:grid-cols-2 gap-x-4">
      <CharterBlock titleKey="org.owns" items={charter.owns} />
      <CharterBlock titleKey="org.does" items={charter.does} variant="teal" />
      <CharterBlock titleKey="org.doesNot" items={charter.doesNot} variant="muted" />
      <CharterBlock titleKey="org.escalatesTo" items={charter.escalatesTo} variant="warn" />
    </div>
  );
}
