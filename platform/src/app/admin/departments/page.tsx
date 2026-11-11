import { getDb } from "@/lib/db";
import { PageHeader, DeptBadge } from "@/components/ui";

export default function DepartmentsPage() {
  const departments = getDb().prepare(`SELECT * FROM departments ORDER BY id`).all() as Array<{
    id: number;
    code: string;
    name: string;
    description: string;
    primary_responsibilities: string;
  }>;

  const teamCounts = getDb()
    .prepare(`SELECT department_code, COUNT(*) AS c FROM teams GROUP BY department_code`)
    .all() as Array<{ department_code: string; c: number }>;
  const userCounts = getDb()
    .prepare(`SELECT department_code, COUNT(*) AS c FROM users WHERE department_code IS NOT NULL GROUP BY department_code`)
    .all() as Array<{ department_code: string; c: number }>;

  const tc = Object.fromEntries(teamCounts.map((t) => [t.department_code, t.c]));
  const uc = Object.fromEntries(userCounts.map((t) => [t.department_code, t.c]));

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle="Four owning departments for the CRMP: Risk Control, Operations, AI, and System (admin / infra / LP / bridges / servers)."
      />
      <div className="grid lg:grid-cols-2 gap-4">
        {departments.map((d) => {
          const responsibilities = JSON.parse(d.primary_responsibilities) as string[];
          return (
            <article key={d.id} className="panel p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-xl">{d.name}</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">{d.description}</p>
                </div>
                <DeptBadge code={d.code} />
              </div>
              <div className="mt-4 flex gap-4 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Teams</div>
                  <div className="text-lg font-semibold">{tc[d.code] ?? 0}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Users</div>
                  <div className="text-lg font-semibold">{uc[d.code] ?? 0}</div>
                </div>
              </div>
              <h3 className="mt-4 text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Primary responsibilities</h3>
              <ul className="mt-2 space-y-1.5 text-sm">
                {responsibilities.map((r) => (
                  <li key={r} className="rounded-lg bg-slate-50 border border-[var(--line)] px-3 py-2">
                    {r}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}
