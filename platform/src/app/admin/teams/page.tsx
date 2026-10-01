import { getDb } from "@/lib/db";
import { DeptBadge } from "@/components/ui";
import { AdminPageHeader } from "@/components/AdminPageHeader";

export default function TeamsPage() {
  const teams = getDb()
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

  return (
    <div>
      <AdminPageHeader pageKey="teams" />
      <div className="panel table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Team</th>
              <th>Department</th>
              <th>Members</th>
              <th>Lark Chat</th>
              <th>On-call</th>
              <th>Mission</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.id}>
                <td className="font-semibold">{t.name}</td>
                <td>
                  <DeptBadge code={t.department_code} />
                </td>
                <td>{t.member_count}</td>
                <td>
                  <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{t.lark_chat_id}</code>
                </td>
                <td className="text-sm">{t.on_call_rotation}</td>
                <td className="text-sm text-[var(--muted)] max-w-md">{t.mission}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
