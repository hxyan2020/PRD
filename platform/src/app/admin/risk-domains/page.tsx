import { getDb } from "@/lib/db";
import { PageHeader, DeptBadge, Badge } from "@/components/ui";

export default function RiskDomainsPage() {
  const domains = getDb().prepare(`SELECT * FROM risk_domains ORDER BY priority, name`).all() as Array<{
    id: number;
    code: string;
    name: string;
    description: string;
    owner_department: string;
    supporting_departments_json: string;
    product_coverage: string;
    priority: number;
    status: string;
  }>;

  return (
    <div>
      <PageHeader
        title="Risk Domains Under Management"
        subtitle="Canonical catalogue the CRMP must detect, enrich, escalate and report on — CFD and crypto exchange inclusive."
      />
      <div className="grid lg:grid-cols-2 gap-3">
        {domains.map((d) => {
          const supporting = JSON.parse(d.supporting_departments_json) as string[];
          return (
            <article key={d.id} className="panel p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-[var(--muted)]">P{d.priority} · {d.code}</div>
                  <h2 className="font-[family-name:var(--font-display)] text-lg mt-0.5">{d.name}</h2>
                </div>
                <Badge className="bg-orange-50 text-orange-900 border-orange-200">{d.product_coverage}</Badge>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">{d.description}</p>
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <span className="text-xs text-[var(--muted)]">Owner</span>
                <DeptBadge code={d.owner_department} />
                <span className="text-xs text-[var(--muted)] ml-2">Supporting</span>
                {supporting.map((s) => (
                  <DeptBadge key={s} code={s} />
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
