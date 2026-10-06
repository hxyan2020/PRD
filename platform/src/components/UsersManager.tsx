"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DeptBadge, StatusBadge } from "@/components/ui";
import { useT } from "@/hooks/useUiLocale";
import { deptLabelI18n, phrase } from "@/lib/i18n";

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
  const { t, locale } = useT();
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
      setMessage(data.error || t("users.createFailed"));
      return;
    }
    setMessage(t("users.created", { id: data.id }));
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
          <h3 className="font-semibold">{t("users.add")}</h3>
          <div className="mt-3 grid md:grid-cols-3 gap-3">
            <div>
              <label className="label">{t("common.name")}</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">{t("common.email")}</label>
              <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">{t("users.tempPassword")}</label>
              <input
                className="input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div>
              <label className="label">{t("common.role")}</label>
              <select
                className="select"
                value={form.role_code}
                onChange={(e) => setForm({ ...form, role_code: e.target.value })}
              >
                {roleOptions.map((r) => (
                  <option key={r.code} value={r.code}>
                    {phrase(r.name, locale)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t("common.department")}</label>
              <select
                className="select"
                value={form.department_code}
                onChange={(e) => setForm({ ...form, department_code: e.target.value })}
              >
                <option value="RISK_CONTROL">{deptLabelI18n("RISK_CONTROL", locale)}</option>
                <option value="OPERATIONS">{deptLabelI18n("OPERATIONS", locale)}</option>
                <option value="AI">{deptLabelI18n("AI", locale)}</option>
                <option value="SYSTEM">{deptLabelI18n("SYSTEM", locale)}</option>
              </select>
            </div>
            <div>
              <label className="label">{t("common.team")}</label>
              <select
                className="select"
                value={form.team_id}
                onChange={(e) => setForm({ ...form, team_id: e.target.value })}
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {phrase(team.name, locale)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button className="btn btn-primary" onClick={createUser}>
              {t("users.create")}
            </button>
            {message && <span className="text-sm text-[var(--muted)]">{message}</span>}
          </div>
        </div>
      )}

      <ul className="space-y-2 sm:hidden" data-testid="users-mobile">
        {users.map((u) => (
          <li key={u.id} className="panel p-3 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="font-semibold break-words">{u.name}</div>
                <div className="text-xs text-[var(--muted)] break-all">{u.email}</div>
              </div>
              <StatusBadge value={u.status} />
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <span className="badge border bg-slate-100 text-slate-700 border-slate-200">
                {phrase(u.role_code, locale)}
              </span>
              <DeptBadge code={u.department_code} />
              <span className="text-[var(--muted)]">
                {u.team_name ? phrase(u.team_name, locale) : "—"}
              </span>
            </div>
            <div className="text-xs text-[var(--muted)]">
              {t("common.lastLogin")}: {u.last_login_at ?? "—"}
            </div>
            {canManage && (
              <button type="button" className="btn text-xs w-full" onClick={() => toggleStatus(u)}>
                {u.status === "ACTIVE" ? t("common.disable") : t("common.enable")}
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="panel table-wrap hidden sm:block overflow-x-auto">
        <table className="data">
          <thead>
            <tr>
              <th>{t("common.user")}</th>
              <th>{t("common.role")}</th>
              <th>{t("common.department")}</th>
              <th>{t("common.team")}</th>
              <th>{t("common.status")}</th>
              <th>{t("common.lastLogin")}</th>
              {canManage && <th>{t("common.actions")}</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-[var(--muted)]">{u.email}</div>
                </td>
                <td>{phrase(u.role_code, locale)}</td>
                <td>
                  <DeptBadge code={u.department_code} />
                </td>
                <td>{u.team_name ? phrase(u.team_name, locale) : "—"}</td>
                <td>
                  <StatusBadge value={u.status} />
                </td>
                <td className="text-sm text-[var(--muted)]">{u.last_login_at ?? "—"}</td>
                {canManage && (
                  <td>
                    <button className="btn" onClick={() => toggleStatus(u)}>
                      {u.status === "ACTIVE" ? t("common.disable") : t("common.enable")}
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
