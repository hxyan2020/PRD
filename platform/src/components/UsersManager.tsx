"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DeptBadge, StatusBadge } from "@/components/ui";

type UserRow = {
  id: number;
  email: string;
  name: string;
  role_code: string;
  department_code: string | null;
  team_id: number | null;
  status: string;
  last_login_at: string | null;
  team_name: string | null;
};

export function UsersManager({
  initialUsers,
  roles,
  teams,
  canManage,
}: {
  initialUsers: UserRow[];
  roles: Array<{ code: string; name: string }>;
  teams: Array<{ id: number; name: string; department_code: string }>;
  canManage: boolean;
}) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role_code: "RISK_ANALYST",
    department_code: "RISK_CONTROL",
    team_id: String(teams[0]?.id ?? ""),
  });
  const [message, setMessage] = useState<string | null>(null);

  const roleOptions = useMemo(() => roles, [roles]);

  async function createUser() {
    setMessage(null);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        team_id: form.team_id ? Number(form.team_id) : null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Failed to create user");
      return;
    }
    setMessage(`Created user #${data.id}`);
    router.refresh();
    const list = await fetch("/api/users").then((r) => r.json());
    setUsers(list.users);
  }

  async function toggleStatus(u: UserRow) {
    const status = u.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, status }),
    });
    const list = await fetch("/api/users").then((r) => r.json());
    setUsers(list.users);
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="panel p-4">
          <h3 className="font-semibold">Add user</h3>
          <div className="mt-3 grid md:grid-cols-3 gap-3">
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Temp password</label>
              <input
                className="input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Role</label>
              <select
                className="select"
                value={form.role_code}
                onChange={(e) => setForm({ ...form, role_code: e.target.value })}
              >
                {roleOptions.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Department</label>
              <select
                className="select"
                value={form.department_code}
                onChange={(e) => setForm({ ...form, department_code: e.target.value })}
              >
                <option value="RISK_CONTROL">Risk Control</option>
                <option value="OPERATIONS">Operations</option>
                <option value="AI">AI</option>
                <option value="SYSTEM">System</option>
              </select>
            </div>
            <div>
              <label className="label">Team</label>
              <select
                className="select"
                value={form.team_id}
                onChange={(e) => setForm({ ...form, team_id: e.target.value })}
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button className="btn btn-primary" onClick={createUser}>
              Create user
            </button>
            {message && <span className="text-sm text-[var(--muted)]">{message}</span>}
          </div>
        </div>
      )}

      <div className="panel table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Department</th>
              <th>Team</th>
              <th>Status</th>
              <th>Last login</th>
              {canManage && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-[var(--muted)]">{u.email}</div>
                </td>
                <td>{u.role_code}</td>
                <td>
                  <DeptBadge code={u.department_code} />
                </td>
                <td>{u.team_name ?? "—"}</td>
                <td>
                  <StatusBadge value={u.status} />
                </td>
                <td className="text-sm text-[var(--muted)]">{u.last_login_at ?? "—"}</td>
                {canManage && (
                  <td>
                    <button className="btn" onClick={() => toggleStatus(u)}>
                      {u.status === "ACTIVE" ? "Disable" : "Enable"}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
