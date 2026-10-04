import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { Badge } from "@/components/ui";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { T } from "@/components/T";
import { redirect } from "next/navigation";

export default async function AuditPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "audit.read")) redirect("/admin");

  const logs = getDb()
    .prepare(
      `SELECT * FROM audit_logs ORDER BY id DESC LIMIT 200`
    )
    .all() as Array<{
    id: number;
    actor_name: string | null;
    action: string;
    entity_type: string;
    entity_id: string | null;
    details_json: string;
    created_at: string;
  }>;

  return (
    <div>
      <AdminPageHeader pageKey="audit" />
      <div className="panel table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th><T k="common.when" /></th>
              <th><T k="common.actor" /></th>
              <th><T k="common.actions" /></th>
              <th><T k="common.entity" /></th>
              <th><T k="common.details" /></th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="text-sm whitespace-nowrap">{l.created_at}</td>
                <td>{l.actor_name ?? <T k="common.system" />}</td>
                <td>
                  <Badge className="bg-teal-50 text-teal-900 border-teal-200">{l.action}</Badge>
                </td>
                <td className="text-sm">
                  {l.entity_type}
                  {l.entity_id ? ` / ${l.entity_id}` : ""}
                </td>
                <td className="text-xs break-all max-w-xl text-[var(--muted)]">{l.details_json}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
