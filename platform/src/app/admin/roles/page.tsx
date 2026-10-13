import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { RolesEditorBoard } from "@/components/RolesEditorBoard";
import { isStaticExport } from "@/lib/static-export";

export default async function RolesPage() {
  const user = await getCurrentUser();
  if (!isStaticExport() && (!user || !hasPermission(user.role_code, "users.read"))) {
    redirect("/admin");
  }

  const db = getDb();
  const roles = db.prepare(`SELECT * FROM roles ORDER BY id`).all() as Array<{
    id: number;
    code: string;
    name: string;
    description: string;
    department_code: string | null;
    permissions_json: string;
  }>;
  const departments = db
    .prepare(`SELECT code, name FROM departments ORDER BY id`)
    .all() as Array<{ code: string; name: string }>;

  return (
    <div>
      <AdminPageHeader pageKey="roles" />
      <RolesEditorBoard
        roles={roles}
        departments={departments}
        canManage={Boolean(user && hasPermission(user.role_code, "users.manage"))}
      />
    </div>
  );
}
