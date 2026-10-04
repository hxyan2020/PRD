"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, SeverityBadge, StatusBadge } from "@/components/ui";
import { useT } from "@/hooks/useUiLocale";

type Route = {
  id: number;
  name: string;
  domain_code: string;
  severity: string;
  primary_team: string;
  secondary_team: string | null;
  lark_channel: string | null;
  sla_minutes: number;
  auto_actions_json: string;
  requires_human: number;
  enabled: number;
};

export function EscalationManager({
  routes,
  teams,
  channels,
  domains,
  canManage,
}: {
  routes: Route[];
  teams: Array<{ id: number; name: string }>;
  channels: Array<{ id: number; name: string }>;
  domains: Array<{ code: string; name: string }>;
  canManage: boolean;
}) {
  const router = useRouter();
  const { t, phrase } = useT();
  const [form, setForm] = useState({
    name: "",
    domain_code: domains[0]?.code ?? "CREDIT_CLIENT",
    severity: "BREACH",
    primary_team_id: String(teams[0]?.id ?? 1),
    secondary_team_id: "",
    lark_channel_id: String(channels[0]?.id ?? 1),
    sla_minutes: "15",
  });
  const [msg, setMsg] = useState<string | null>(null);

  async function toggle(r: Route) {
    await fetch("/api/escalation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle", id: r.id, enabled: !r.enabled }),
    });
    router.refresh();
  }

  async function create() {
    const res = await fetch("/api/escalation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        primary_team_id: Number(form.primary_team_id),
        secondary_team_id: form.secondary_team_id ? Number(form.secondary_team_id) : null,
        lark_channel_id: form.lark_channel_id ? Number(form.lark_channel_id) : null,
        sla_minutes: Number(form.sla_minutes),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || t("common.failed"));
      return;
    }
    setMsg(t("esc.created", { id: data.id }));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="panel p-4">
          <h3 className="font-semibold">{t("esc.create")}</h3>
          <div className="mt-3 grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="label">{t("common.name")}</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">{t("common.severity")}</label>
              <select
                className="select"
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
              >
                <option>INFO</option>
                <option>WARN</option>
                <option>BREACH</option>
                <option>CRITICAL</option>
              </select>
            </div>
            <div>
              <label className="label">{t("common.domain")}</label>
              <select
                className="select"
                value={form.domain_code}
                onChange={(e) => setForm({ ...form, domain_code: e.target.value })}
              >
                {domains.map((d) => (
                  <option key={d.code} value={d.code}>
                    {phrase(d.name)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t("esc.primary")}</label>
              <select
                className="select"
                value={form.primary_team_id}
                onChange={(e) => setForm({ ...form, primary_team_id: e.target.value })}
              >
                {teams.map((teamRow) => (
                  <option key={teamRow.id} value={teamRow.id}>
                    {phrase(teamRow.name)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t("esc.secondary")}</label>
              <select
                className="select"
                value={form.secondary_team_id}
                onChange={(e) => setForm({ ...form, secondary_team_id: e.target.value })}
              >
                <option value="">{t("common.none")}</option>
                {teams.map((teamRow) => (
                  <option key={teamRow.id} value={teamRow.id}>
                    {phrase(teamRow.name)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t("esc.larkChannel")}</label>
              <select
                className="select"
                value={form.lark_channel_id}
                onChange={(e) => setForm({ ...form, lark_channel_id: e.target.value })}
              >
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    {phrase(c.name)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t("esc.slaMin")}</label>
              <input
                className="input"
                value={form.sla_minutes}
                onChange={(e) => setForm({ ...form, sla_minutes: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-3 flex gap-3 items-center">
            <button className="btn btn-primary" onClick={create}>
              {t("esc.save")}
            </button>
            {msg && <span className="text-sm text-[var(--muted)]">{msg}</span>}
          </div>
        </div>
      )}

      <div className="panel table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>{t("common.route")}</th>
              <th>{t("common.severity")}</th>
              <th>{t("org.teams")}</th>
              <th>{t("common.lark")}</th>
              <th>{t("common.sla")}</th>
              <th>{t("common.auto")}</th>
              <th>{t("common.human")}</th>
              <th>{t("common.status")}</th>
              {canManage && <th />}
            </tr>
          </thead>
          <tbody>
            {routes.map((r) => {
              const actions = JSON.parse(r.auto_actions_json || "[]") as string[];
              return (
                <tr key={r.id}>
                  <td>
                    <div className="font-semibold">{phrase(r.name)}</div>
                    <div className="text-xs text-[var(--muted)]">{phrase(r.domain_code)}</div>
                  </td>
                  <td>
                    <SeverityBadge value={r.severity} />
                  </td>
                  <td className="text-sm">
                    <div>{phrase(r.primary_team)}</div>
                    <div className="text-xs text-[var(--muted)]">{r.secondary_team ? phrase(r.secondary_team) : "—"}</div>
                  </td>
                  <td className="text-sm">{r.lark_channel ? phrase(r.lark_channel) : "—"}</td>
                  <td className="tabular-nums">{r.sla_minutes}m</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {actions.map((a) => (
                        <Badge key={a} className="bg-slate-100 text-slate-700 border-slate-200">
                          {phrase(a)}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td>{r.requires_human ? t("common.yes") : t("common.no")}</td>
                  <td>
                    <StatusBadge value={r.enabled ? "ACTIVE" : "DISABLED"} />
                  </td>
                  {canManage && (
                    <td>
                      <button className="btn" onClick={() => toggle(r)}>
                        {r.enabled ? t("common.disable") : t("common.enable")}
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
