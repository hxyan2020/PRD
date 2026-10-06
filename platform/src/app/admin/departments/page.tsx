import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { BuTeamsBoard } from "@/components/BuTeamsBoard";
import { redirect } from "next/navigation";

export default async function DepartmentsPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "teams.read")) redirect("/admin");

  const db = getDb();
  const departments = db.prepare(`SELECT * FROM departments ORDER BY id`).all() as Array<{
    id: number;
    code: string;
    name: string;
    description: string;
    primary_responsibilities: string;
  }>;

  const teams = db
    .prepare(
      `SELECT t.*,
              (SELECT COUNT(*) FROM users u WHERE u.team_id = t.id) AS member_count
       FROM teams t
       ORDER BY t.department_code, t.name`
    )
    .all() as Array<{
    id: number;
    name: string;
    department_code: string;
    mission: string;
    lark_chat_id: string | null;
    on_call_rotation: string | null;
    member_count: number;
  }>;

  const userCounts = db
    .prepare(`SELECT department_code, COUNT(*) AS c FROM users WHERE department_code IS NOT NULL GROUP BY department_code`)
    .all() as Array<{ department_code: string; c: number }>;

  return (
    <div>
      <AdminPageHeader pageKey="departments" />
      <BuTeamsBoard
        departments={departments}
        teams={teams}
        userCounts={Object.fromEntries(userCounts.map((u) => [u.department_code, u.c]))}
        canManage={hasPermission(user.role_code, "teams.manage")}
      />
    </div>
  );
}
