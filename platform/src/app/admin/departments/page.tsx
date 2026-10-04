import { getDb } from "@/lib/db";
import { DeptBadge } from "@/components/ui";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { T } from "@/components/T";
import { Phrase } from "@/components/Phrase";

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
      <AdminPageHeader pageKey="departments" />
      <div className="grid lg:grid-cols-2 gap-4">
        {departments.map((d) => {
          const responsibilities = JSON.parse(d.primary_responsibilities) as string[];
          return (
            <article key={d.id} className="panel p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-xl"><Phrase>{d.name}</Phrase></h2>
                  <p className="mt-1 text-sm text-[var(--muted)]"><Phrase>{d.description}</Phrase></p>
                </div>
                <DeptBadge code={d.code} />
              </div>
              <div className="mt-4 flex gap-4 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wide text-[var(--muted)]"><T k="org.teams" /></div>
                  <div className="text-lg font-semibold">{tc[d.code] ?? 0}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-[var(--muted)]"><T k="org.users" /></div>
                  <div className="text-lg font-semibold">{uc[d.code] ?? 0}</div>
                </div>
              </div>
              <h3 className="mt-4 text-xs uppercase tracking-[0.08em] text-[var(--muted)]"><T k="org.primary" /></h3>
              <ul className="mt-2 space-y-1.5 text-sm">
                {responsibilities.map((r) => (
                  <li key={r} className="rounded-lg bg-slate-50 border border-[var(--line)] px-3 py-2">
                    <Phrase>{r}</Phrase>
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
