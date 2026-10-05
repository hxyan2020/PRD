import { getDb } from "@/lib/db";
import { DeptBadge, Badge } from "@/components/ui";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { T } from "@/components/T";
import { Phrase } from "@/components/Phrase";
import { RoleCharterView } from "@/components/OrgCharter";
import { roleCharter } from "@/lib/org-catalog";

export default function RolesPage() {
  const roles = getDb().prepare(`SELECT * FROM roles ORDER BY id`).all() as Array<{
    id: number;
    code: string;
    name: string;
    description: string;
    department_code: string | null;
    permissions_json: string;
  }>;

  return (
    <div>
      <AdminPageHeader pageKey="roles" />
      <div className="space-y-3">
        {roles.map((r) => {
          const perms = JSON.parse(r.permissions_json) as string[];
          const charter = roleCharter(r.code);
          return (
            <article key={r.id} className="panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-lg">
                    <Phrase>{r.name}</Phrase>
                  </h2>
                  <div className="text-xs text-[var(--muted)] mt-0.5">
                    <Phrase>{r.code}</Phrase>
                  </div>
                  <p className="text-sm text-[var(--muted)] mt-2 max-w-3xl">
                    <Phrase>{charter?.intro ?? r.description}</Phrase>
                  </p>
                </div>
                <DeptBadge code={r.department_code} />
              </div>
              {charter ? <RoleCharterView charter={charter} /> : null}
              <h3 className="mt-4 text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
                <T k="org.permissions" />
              </h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {perms.map((p) => (
                  <Badge key={p} className="bg-teal-50 text-teal-900 border-teal-200">
                    {p}
                  </Badge>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
