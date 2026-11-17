import { UsersManager } from "@/components/UsersManager";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { OwnerIdentityPanel } from "@/components/OwnerIdentityPanel";
import { PLATFORM_OWNER } from "@/lib/platform-owner";
import { redirect } from "next/navigation";

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "users.read")) redirect("/admin");

  const users = getDb()
    .prepare(
      `SELECT u.id, u.email, u.name, u.role_code, u.department_code, u.team_id, u.status,
              u.last_login_at, t.name AS team_name
       FROM users u
       LEFT JOIN teams t ON t.id = u.team_id
       ORDER BY CASE
         WHEN u.email IN (?, ?) THEN 0
         ELSE 1
       END, u.id`
    )
    .all(PLATFORM_OWNER.email, PLATFORM_OWNER.githubEmail) as React.ComponentProps<typeof UsersManager>["initialUsers"];
  const roles = getDb().prepare(`SELECT code, name FROM roles ORDER BY id`).all() as React.ComponentProps<
    typeof UsersManager
  >["roles"];
  const teams = getDb()
    .prepare(`SELECT id, name, department_code FROM teams ORDER BY name`)
    .all() as React.ComponentProps<typeof UsersManager>["teams"];
  const canManage = hasPermission(user.role_code, "users.manage");

  return (
    <div>
      <AdminPageHeader pageKey="users" />
      <OwnerIdentityPanel />
      <UsersManager initialUsers={users} roles={roles} teams={teams} canManage={canManage} />
    </div>
  );
}
