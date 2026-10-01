"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, SeverityBadge, StatusBadge } from "@/components/ui";

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
      setMsg(data.error || "Failed");
      return;
    }
    setMsg(`Route #${data.id} created`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="panel p-4">
          <h3 className="font-semibold">Create escalation route</h3>
          <div className="mt-3 grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Severity</label>
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
              <label className="label">Domain</label>
              <select
                className="select"
                value={form.domain_code}
                onChange={(e) => setForm({ ...form, domain_code: e.target.value })}
              >
                {domains.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Primary team</label>
              <select
                className="select"
                value={form.primary_team_id}
                onChange={(e) => setForm({ ...form, primary_team_id: e.target.value })}
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Secondary team</label>
              <select
                className="select"
                value={form.secondary_team_id}
                onChange={(e) => setForm({ ...form, secondary_team_id: e.target.value })}
              >
                <option value="">None</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Lark channel</label>
              <select
                className="select"
                value={form.lark_channel_id}
                onChange={(e) => setForm({ ...form, lark_channel_id: e.target.value })}
              >
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">SLA (minutes)</label>
              <input
                className="input"
                value={form.sla_minutes}
                onChange={(e) => setForm({ ...form, sla_minutes: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-3 flex gap-3 items-center">
            <button className="btn btn-primary" onClick={create}>
              Save route
            </button>
            {msg && <span className="text-sm text-[var(--muted)]">{msg}</span>}
          </div>
        </div>
      )}

      <div className="panel table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Route</th>
              <th>Severity</th>
              <th>Teams</th>
              <th>Lark</th>
              <th>SLA</th>
              <th>Auto actions</th>
              <th>Human</th>
              <th>Status</th>
              {canManage && <th />}
            </tr>
          </thead>
          <tbody>
            {routes.map((r) => {
              const actions = JSON.parse(r.auto_actions_json || "[]") as string[];
              return (
                <tr key={r.id}>
                  <td>
                    <div className="font-semibold">{r.name}</div>
                    <div className="text-xs text-[var(--muted)]">{r.domain_code}</div>
                  </td>
                  <td>
                    <SeverityBadge value={r.severity} />
                  </td>
                  <td className="text-sm">
                    <div>{r.primary_team}</div>
                    <div className="text-xs text-[var(--muted)]">{r.secondary_team ?? "—"}</div>
                  </td>
                  <td className="text-sm">{r.lark_channel ?? "—"}</td>
                  <td className="tabular-nums">{r.sla_minutes}m</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {actions.map((a) => (
                        <Badge key={a} className="bg-slate-100 text-slate-700 border-slate-200">
                          {a}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td>{r.requires_human ? "Yes" : "No"}</td>
                  <td>
                    <StatusBadge value={r.enabled ? "ACTIVE" : "DISABLED"} />
                  </td>
                  {canManage && (
                    <td>
                      <button className="btn" onClick={() => toggle(r)}>
                        {r.enabled ? "Disable" : "Enable"}
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
