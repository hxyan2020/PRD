"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DeptBadge } from "@/components/ui";
import { Phrase } from "@/components/Phrase";
import { T } from "@/components/T";
import { EnZh } from "@/components/EnZh";
import { DepartmentCharterView } from "@/components/OrgCharter";
import { departmentCharter } from "@/lib/org-catalog";
import { useT } from "@/hooks/useUiLocale";

type Dept = {
  id: number;
  code: string;
  name: string;
  description: string;
  primary_responsibilities: string;
};

type Team = {
  id: number;
  name: string;
  department_code: string;
  mission: string;
  lark_chat_id: string | null;
  on_call_rotation: string | null;
  member_count: number;
};

export function BuTeamsBoard({
  departments,
  teams,
  userCounts,
  canManage,
}: {
  departments: Dept[];
  teams: Team[];
  userCounts: Record<string, number>;
  canManage: boolean;
}) {
  const router = useRouter();
  const { t } = useT();
  const [editId, setEditId] = useState<number | null>(null);
  const [mission, setMission] = useState("");
  const [onCall, setOnCall] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function saveTeam(team: Team) {
    const res = await fetch("/api/org", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_team",
        id: team.id,
        mission,
        on_call_rotation: onCall,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || t("common.failed"));
      return;
    }
    setEditId(null);
    setMsg(null);
    router.refresh();
  }

  return (
    <div className="space-y-4" data-testid="bu-teams-board">
      <div className="panel p-4 border-teal-200 bg-teal-50/30">
        <div className="text-xs uppercase tracking-[0.12em] text-teal-900">
          <EnZh en="BU and Teams" zh="BU 與團隊" />
        </div>
        <p className="text-sm mt-1 text-[var(--muted)]">
          <EnZh
            en="Departments and Teams are one tab. Each business unit lists nested on-call teams — edit mission and rotation when you have teams.manage."
            zh="部門與團隊已合併為同一個分頁。每個業務單位下列出嵌套值班團隊 — 具 teams.manage 時可編輯任務與輪值。"
          />
        </p>
      </div>

      {msg && <div className="text-sm text-rose-800">{msg}</div>}

      <div className="grid lg:grid-cols-2 gap-4">
        {departments.map((d) => {
          const charter = departmentCharter(d.code);
          const deptTeams = teams.filter((tm) => tm.department_code === d.code);
          const fallbackOwns = (() => {
            try {
              return JSON.parse(d.primary_responsibilities) as string[];
            } catch {
              return [];
            }
          })();
          return (
            <article key={d.id} className="panel p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-xl">
                    <Phrase>{d.name}</Phrase>
                  </h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    <Phrase>{charter?.mandate ?? d.description}</Phrase>
                  </p>
                </div>
                <DeptBadge code={d.code} />
              </div>
              <div className="mt-4 flex gap-4 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wide text-[var(--muted)]">
                    <T k="org.teams" />
                  </div>
                  <div className="text-lg font-semibold">{deptTeams.length}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-[var(--muted)]">
                    <T k="org.users" />
                  </div>
                  <div className="text-lg font-semibold">{userCounts[d.code] ?? 0}</div>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
                  <EnZh en="Teams in this BU" zh="此 BU 下的團隊" />
                </h3>
                <div className="mt-2 space-y-2">
                  {deptTeams.map((tm) => (
                    <div key={tm.id} className="rounded-lg border border-[var(--line)] bg-slate-50/80 px-3 py-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-sm">
                            <Phrase>{tm.name}</Phrase>
                          </div>
                          <div className="text-xs text-[var(--muted)]">
                            {tm.member_count} <T k="common.members" />
                            {tm.lark_chat_id ? (
                              <>
                                {" · "}
                                <code>{tm.lark_chat_id}</code>
                              </>
                            ) : null}
                          </div>
                        </div>
                        {canManage && editId !== tm.id && (
                          <button
                            type="button"
                            className="btn"
                            onClick={() => {
                              setEditId(tm.id);
                              setMission(tm.mission);
                              setOnCall(tm.on_call_rotation || "");
                            }}
                          >
                            {t("common.edit")}
                          </button>
                        )}
                      </div>
                      {editId === tm.id ? (
                        <div className="mt-2 space-y-2">
                          <div>
                            <label className="label">{t("common.mission")}</label>
                            <textarea className="textarea" value={mission} onChange={(e) => setMission(e.target.value)} />
                          </div>
                          <div>
                            <label className="label">
                              <T k="org.onCall" />
                            </label>
                            <input className="input" value={onCall} onChange={(e) => setOnCall(e.target.value)} />
                          </div>
                          <div className="flex gap-2">
                            <button type="button" className="btn btn-primary" onClick={() => saveTeam(tm)}>
                              {t("common.save")}
                            </button>
                            <button type="button" className="btn" onClick={() => setEditId(null)}>
                              {t("common.cancel")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1 text-sm text-[var(--muted)]">
                          <Phrase>{tm.mission}</Phrase>
                          {tm.on_call_rotation ? (
                            <div className="text-xs mt-1">
                              <T k="org.onCall" />: <Phrase>{tm.on_call_rotation}</Phrase>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  ))}
                  {!deptTeams.length && (
                    <p className="text-sm text-[var(--muted)]">
                      <EnZh en="No teams under this BU yet." zh="此 BU 尚無團隊。" />
                    </p>
                  )}
                </div>
              </div>

              {charter ? (
                <DepartmentCharterView charter={charter} />
              ) : (
                <div className="mt-4">
                  <h3 className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
                    <T k="org.owns" />
                  </h3>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {fallbackOwns.map((r) => (
                      <li key={r} className="rounded-lg bg-slate-50 border border-[var(--line)] px-3 py-2">
                        <Phrase>{r}</Phrase>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
