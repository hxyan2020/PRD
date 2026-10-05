import { T } from "@/components/T";
import { Phrase } from "@/components/Phrase";
import type { DepartmentCharter, RoleCharter } from "@/lib/org-catalog";
import { cn } from "@/lib/utils";

type Variant = "default" | "muted" | "warn" | "teal";

const ITEM_CLASS: Record<Variant, string> = {
  default: "rounded-lg bg-slate-50 border border-[var(--line)] px-3 py-2",
  muted: "rounded-lg bg-white border border-dashed border-[var(--line)] px-3 py-2 text-[var(--muted)]",
  warn: "rounded-lg bg-amber-50 border border-amber-200 px-3 py-2",
  teal: "rounded-lg bg-teal-50 border border-teal-200 px-3 py-2",
};

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
          <li key={item} className={ITEM_CLASS[variant]}>
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
      <CharterBlock titleKey="org.owns" items={charter.owns} />
      <CharterBlock titleKey="org.accountable" items={charter.accountable} variant="teal" />
      <CharterBlock titleKey="org.collaborates" items={charter.collaborates} />
      <CharterBlock titleKey="org.outOfScope" items={charter.outOfScope} variant="muted" />
      <CharterBlock titleKey="org.escalatesTo" items={charter.escalatesTo} variant="warn" />
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
