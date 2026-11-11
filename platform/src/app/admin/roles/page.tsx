import { getDb } from "@/lib/db";
import { PageHeader, DeptBadge, Badge } from "@/components/ui";

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
      <PageHeader
        title="Roles & Permissions"
        subtitle="Role-based access for admin functions. Super Admin has wildcard (*). Risk Owner retains intervention and settings authority."
      />
      <div className="space-y-3">
        {roles.map((r) => {
          const perms = JSON.parse(r.permissions_json) as string[];
          return (
            <article key={r.id} className="panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-lg">{r.name}</h2>
                  <div className="text-xs text-[var(--muted)] mt-0.5">{r.code}</div>
                  <p className="text-sm text-[var(--muted)] mt-2 max-w-3xl">{r.description}</p>
                </div>
                <DeptBadge code={r.department_code} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
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
