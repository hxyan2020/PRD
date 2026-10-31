"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, DeptBadge } from "@/components/ui";
import { Phrase } from "@/components/Phrase";
import { T } from "@/components/T";
import { EnZh } from "@/components/EnZh";
import { RoleCharterView } from "@/components/OrgCharter";
import { roleCharter } from "@/lib/org-catalog";
import { ALL_PERMISSIONS, PERMISSION_GROUPS } from "@/lib/permissions-catalog";
import { useT } from "@/hooks/useUiLocale";

type Role = {
  id: number;
  code: string;
  name: string;
  description: string;
  department_code: string | null;
  permissions_json: string;
};

function parsePerms(raw: string): string[] {
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function RolesEditorBoard({
  roles,
  canManage,
  departments,
}: {
  roles: Role[];
  canManage: boolean;
  departments: Array<{ code: string; name: string }>;
}) {
  const router = useRouter();
  const { t, phrase, locale } = useT();
  const zh = locale === "zh-Hant";
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [departmentCode, setDepartmentCode] = useState("");
  const [perms, setPerms] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const catalog = useMemo(() => {
    const fromRoles = new Set<string>();
    for (const r of roles) parsePerms(r.permissions_json).forEach((p) => fromRoles.add(p));
    return Array.from(new Set([...ALL_PERMISSIONS, ...fromRoles])).sort((a, b) => {
      if (a === "*") return -1;
      if (b === "*") return 1;
      return a.localeCompare(b);
    });
  }, [roles]);

  function openEdit(r: Role) {
    setEditId(r.id);
    setName(r.name);
    setDescription(r.description);
    setDepartmentCode(r.department_code || "");
    setPerms(parsePerms(r.permissions_json));
    setMsg(null);
  }

  function togglePerm(key: string) {
    if (key === "*") {
      setPerms((prev) => (prev.includes("*") ? [] : ["*"]));
      return;
    }
    setPerms((prev) => {
      const withoutStar = prev.filter((p) => p !== "*");
      if (withoutStar.includes(key)) return withoutStar.filter((p) => p !== key);
      return [...withoutStar, key].sort();
    });
  }

  async function save(r: Role) {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_role",
          id: r.id,
          name,
          description,
          department_code: departmentCode || null,
          permissions: perms,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || t("common.failed"));
        return;
      }
      setEditId(null);
      setMsg(zh ? "已儲存角色" : "Role saved");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3" data-testid="roles-editor-board">
      <div className="panel p-4 border-teal-200 bg-teal-50/40">
        <div className="text-xs uppercase tracking-[0.12em] text-teal-900">
          <EnZh en="Editable RBAC matrix" zh="可編輯 RBAC 矩陣" />
        </div>
        <p className="text-sm mt-1 text-teal-950 max-w-3xl">
          {canManage ? (
            <EnZh
              en="Authorised humans (users.manage) can edit role name, description, BU, and permission pills. AI service actors are blocked — escalate role changes to a human."
              zh="具 users.manage 的授權人類可編輯角色名稱、說明、BU 與權限標籤。AI 服務角色禁止寫入 — 角色變更須升級給人類。"
            />
          ) : (
            <EnZh
              en="Read-only for your role. Ask a Super Admin / System Admin with users.manage to edit permissions."
              zh="您的角色為唯讀。請具 users.manage 的超級管理員／系統管理員編輯權限。"
            />
          )}
        </p>
        {msg && <p className="text-sm mt-2 text-[var(--muted)]">{msg}</p>}
      </div>

      {roles.map((r) => {
        const current = parsePerms(r.permissions_json);
        const charter = roleCharter(r.code);
        const editing = editId === r.id;
        return (
          <article
            key={r.id}
            className="panel p-4"
            data-testid={`role-card-${r.code}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {editing ? (
                  <div className="grid md:grid-cols-2 gap-3 max-w-3xl">
                    <div>
                      <label className="label">{t("common.name")}</label>
                      <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div>
                      <label className="label">{zh ? "所屬 BU" : "BU"}</label>
                      <select
                        className="select"
                        value={departmentCode}
                        onChange={(e) => setDepartmentCode(e.target.value)}
                      >
                        <option value="">{t("common.none")}</option>
                        {departments.map((d) => (
                          <option key={d.code} value={d.code}>
                            {phrase(d.name)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">{zh ? "說明" : "Description"}</label>
                      <textarea
                        className="textarea"
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="font-semibold text-lg">
                      <Phrase>{r.name}</Phrase>
                    </h2>
                    <div className="text-xs text-[var(--muted)] mt-0.5 font-mono">{r.code}</div>
                    <p className="text-sm text-[var(--muted)] mt-2 max-w-3xl">
                      <Phrase>{charter?.intro ?? r.description}</Phrase>
                    </p>
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <DeptBadge code={editing ? departmentCode || null : r.department_code} />
                {canManage && !editing && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => openEdit(r)}
                    data-testid={`role-edit-${r.code}`}
                  >
                    {t("common.edit")}
                  </button>
                )}
              </div>
            </div>

            {!editing && charter ? <RoleCharterView charter={charter} /> : null}

            <h3 className="mt-4 text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
              <T k="org.permissions" />
              {editing ? (
                <span className="ml-2 normal-case tracking-normal text-teal-800">
                  {zh ? "— 點選切換" : "— click to toggle"}
                </span>
              ) : null}
            </h3>

            {editing ? (
              <div className="mt-2 space-y-3" data-testid={`role-edit-perms-${r.code}`}>
                {PERMISSION_GROUPS.map((g) => (
                  <div key={g.en}>
                    <div className="text-[11px] font-semibold text-[var(--muted)] mb-1">
                      {zh ? g.zh : g.en}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {g.keys
                        .filter((k) => catalog.includes(k))
                        .map((p) => {
                          const on = perms.includes("*") || perms.includes(p);
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => togglePerm(p)}
                              className={
                                on
                                  ? "rounded-full border border-teal-400 bg-teal-100 px-2.5 py-1 text-xs font-medium text-teal-950"
                                  : "rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-500 hover:border-teal-300"
                              }
                              data-testid={`perm-toggle-${r.code}-${p}`}
                            >
                              {p}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
                {/* Any catalog keys not in groups */}
                {catalog.some((p) => !PERMISSION_GROUPS.some((g) => g.keys.includes(p))) && (
                  <div>
                    <div className="text-[11px] font-semibold text-[var(--muted)] mb-1">
                      {zh ? "其他" : "Other"}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {catalog
                        .filter((p) => !PERMISSION_GROUPS.some((g) => g.keys.includes(p)))
                        .map((p) => {
                          const on = perms.includes("*") || perms.includes(p);
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => togglePerm(p)}
                              className={
                                on
                                  ? "rounded-full border border-teal-400 bg-teal-100 px-2.5 py-1 text-xs font-medium text-teal-950"
                                  : "rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-500"
                              }
                            >
                              {p}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={saving}
                    onClick={() => save(r)}
                    data-testid={`role-save-${r.code}`}
                  >
                    {saving ? t("common.saving") : t("common.save")}
                  </button>
                  <button type="button" className="btn" onClick={() => setEditId(null)}>
                    {t("common.cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {current.map((p) => (
                  <Badge key={p} className="bg-teal-50 text-teal-900 border-teal-200">
                    {p}
                  </Badge>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
