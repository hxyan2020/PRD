import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { PageHeader, Badge, DeptBadge, StatusBadge } from "@/components/ui";

export default async function SkillsPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "skills.read")) redirect("/admin");

  const skills = getDb().prepare(`SELECT * FROM ai_skills ORDER BY code`).all() as Array<{
    id: number;
    code: string;
    name: string;
    description: string;
    indicator_patterns_json: string;
    conditions_json: string;
    steps_json: string;
    auto_execute: number;
    owner_department: string;
    status: string;
  }>;

  return (
    <div>
      <PageHeader
        title="AI Skills (Playbooks)"
        subtitle="Dummy but realistic skills: when an indicator alarm matches patterns + conditions with certainty, AI executes these steps automatically. Otherwise it falls back to RAG + external evidence."
      />
      <div className="space-y-3">
        {skills.map((s) => {
          const patterns = JSON.parse(s.indicator_patterns_json) as string[];
          const conditions = JSON.parse(s.conditions_json) as Record<string, unknown>;
          const steps = JSON.parse(s.steps_json) as Array<{
            action: string;
            description: string;
            requires_human?: boolean;
          }>;
          return (
            <article key={s.id} className="panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-[var(--muted)]">{s.code}</div>
                  <h2 className="font-[family-name:var(--font-display)] text-xl">{s.name}</h2>
                  <p className="text-sm text-[var(--muted)] mt-1 max-w-3xl">{s.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <DeptBadge code={s.owner_department} />
                  <StatusBadge value={s.status} />
                  <Badge className="bg-teal-50 text-teal-900 border-teal-200">
                    {s.auto_execute ? "auto-execute" : "manual"}
                  </Badge>
                </div>
              </div>

              <div className="mt-3 grid md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-[var(--line)] p-3">
                  <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Indicator patterns</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {patterns.map((p) => (
                      <Badge key={p} className="bg-orange-50 text-orange-900 border-orange-200">
                        {p}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-xs uppercase tracking-wide text-[var(--muted)] mt-3">Conditions</div>
                  <pre className="mt-1 text-xs bg-slate-50 rounded-lg p-2 overflow-auto">
                    {JSON.stringify(conditions, null, 2)}
                  </pre>
                </div>
                <div className="rounded-xl border border-[var(--line)] p-3">
                  <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Steps</div>
                  <ol className="mt-2 space-y-2">
                    {steps.map((st, i) => (
                      <li key={i} className="text-sm rounded-lg bg-slate-50 border border-[var(--line)] px-3 py-2">
                        <div className="font-semibold">
                          {i + 1}. {st.action}
                          {st.requires_human ? " · human gate" : ""}
                        </div>
                        <div className="text-[var(--muted)]">{st.description}</div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
