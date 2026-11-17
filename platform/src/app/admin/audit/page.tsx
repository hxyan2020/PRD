import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { AuditBoard } from "@/components/AuditBoard";
import { redirect } from "next/navigation";
import type { AuditLogRow } from "@/lib/audit";

export default async function AuditPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "audit.read")) redirect("/admin");

  const logs = getDb()
    .prepare(`SELECT * FROM audit_logs ORDER BY id DESC LIMIT 200`)
    .all() as AuditLogRow[];

  return (
    <div>
      <AdminPageHeader pageKey="audit" />
      <AuditBoard logs={logs} />
    </div>
  );
}
