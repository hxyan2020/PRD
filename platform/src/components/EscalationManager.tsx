"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, SeverityBadge, StatusBadge } from "@/components/ui";
import { useT } from "@/hooks/useUiLocale";
import {
  DEFAULT_ESCALATION_COEFFICIENTS,
  DEFAULT_ROUTE_CODE,
  parseCoefficients,
  type EscalationCoefficients,
} from "@/lib/escalation/match";

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
  route_code?: string | null;
  is_default?: number;
  coefficients_json?: string | null;
  risk_scenario?: string | null;
  involved_teams_json?: string | null;
  pending_minutes_threshold?: number | null;
};

const COEFF_KEYS: Array<{ key: keyof EscalationCoefficients; en: string; zh: string }> = [
  { key: "severity", en: "Severity", zh: "嚴重度" },
  { key: "involved_teams", en: "Involved teams", zh: "涉入團隊" },
  { key: "risk_scenario", en: "Risk scenario", zh: "風險情境" },
  { key: "pending_time", en: "Pending time", zh: "待處理時間" },
  { key: "need_human_intervention", en: "Need human intervention", zh: "需人工干預" },
];

export function EscalationManager({
  routes,
  teams,
  channels,
  domains,
  canManage,
  defaultSlaMinutes = 30,
}: {
  routes: Route[];
  teams: Array<{ id: number; name: string }>;
  channels: Array<{ id: number; name: string }>;
  domains: Array<{ code: string; name: string }>;
  canManage: boolean;
  defaultSlaMinutes?: number;
}) {
  const router = useRouter();
  const { t, phrase, locale } = useT();
  const zh = locale === "zh-Hant";
  const [form, setForm] = useState({
    name: "",
    domain_code: domains[0]?.code ?? "CREDIT_CLIENT",
    severity: "BREACH",
    primary_team_id: String(teams[0]?.id ?? 1),
    secondary_team_id: "",
    lark_channel_id: String(channels[0]?.id ?? 1),
    sla_minutes: String(defaultSlaMinutes),
    route_code: "",
    risk_scenario: "",
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [coeffs, setCoeffs] = useState<EscalationCoefficients>({ ...DEFAULT_ESCALATION_COEFFICIENTS });
  const [editMeta, setEditMeta] = useState({ risk_scenario: "", pending_minutes_threshold: "", involved_teams: "" });
  const [probe, setProbe] = useState<{
    domain: string;
    severity: string;
    result: string | null;
  }>({ domain: "EXOTIC_EVENT", severity: "WARN", result: null });

  const defaultRoute = useMemo(
    () =>
      routes.find(
        (r) => Boolean(r.is_default) || r.route_code === DEFAULT_ROUTE_CODE || r.domain_code === "*"
      ) || null,
    [routes]
  );

  function isDefault(r: Route) {
    return Boolean(r.is_default) || r.domain_code === "*" || r.route_code === DEFAULT_ROUTE_CODE;
  }

  async function toggle(r: Route) {
    if (isDefault(r) && r.enabled) {
      setMsg(zh ? "不可停用預設路徑 ESC-DEFAULT" : "Cannot disable ESC-DEFAULT");
      return;
    }
    const res = await fetch("/api/escalation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle", id: r.id, enabled: !r.enabled }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.error || t("common.failed"));
      return;
    }
    router.refresh();
  }

  async function probeMatch() {
    const res = await fetch(
      `/api/escalation?match=1&domain=${encodeURIComponent(probe.domain)}&severity=${encodeURIComponent(probe.severity)}`
    );
    const data = await res.json();
    if (!res.ok || !data.matched) {
      setProbe((p) => ({ ...p, result: zh ? "比對失敗" : "Match failed" }));
      return;
    }
    const m = data.matched;
    setProbe((p) => ({
      ...p,
      result: `${m.route_code} · ${m.match_kind} · ${m.name} · SLA ${m.sla_minutes}m → ${m.primary_team}`,
    }));
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
        sla_minutes: Number(form.sla_minutes) || defaultSlaMinutes,
        coefficients: DEFAULT_ESCALATION_COEFFICIENTS,
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

  function openEdit(r: Route) {
    setEditId(r.id);
    setCoeffs(parseCoefficients(r.coefficients_json));
    let teamsList: string[] = [];
    try {
      teamsList = JSON.parse(r.involved_teams_json || "[]") as string[];
    } catch {
      teamsList = [];
    }
    setEditMeta({
      risk_scenario: r.risk_scenario || "",
      pending_minutes_threshold: r.pending_minutes_threshold != null ? String(r.pending_minutes_threshold) : "",
      involved_teams: teamsList.join(", "),
    });
  }

  async function saveEdit(r: Route) {
    const res = await fetch("/api/escalation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update",
        id: r.id,
        coefficients: coeffs,
        risk_scenario: editMeta.risk_scenario || null,
        pending_minutes_threshold: editMeta.pending_minutes_threshold
          ? Number(editMeta.pending_minutes_threshold)
          : null,
        involved_teams: editMeta.involved_teams
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || t("common.failed"));
      return;
    }
    setEditId(null);
    setMsg(zh ? "已儲存係數" : "Coefficients saved");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div
        className="panel p-4 border-amber-300 bg-amber-50/50 space-y-3"
        data-testid="esc-default-panel"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.12em] text-amber-950">
              {zh ? "預設升級路徑（兜底）" : "Default escalation path (catch-all)"}
            </div>
            <h3 className="font-semibold text-lg mt-1 text-amber-950">
              {defaultRoute ? phrase(defaultRoute.name) : "Default catch-all (exotic / unmatched)"}
            </h3>
            <p className="text-sm mt-1 text-amber-950 max-w-3xl">
              {zh
                ? "當沒有明確升級路徑時（尤其是異常／罕見事件），一律走 ESC-DEFAULT。比對順序：精確領域＋嚴重度 → 領域萬用 → 預設路徑。每個警報一定有路徑，不可停用此預設。"
                : "When no clear path matches — especially exotic / rare events — always use ESC-DEFAULT. Match order: exact domain+severity → domain wild → default. Every alert gets a path; this default cannot be disabled."}
            </p>
          </div>
          <Badge className="bg-amber-200 text-amber-950 border-amber-400 text-sm px-3 py-1">
            {DEFAULT_ROUTE_CODE}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <div>
            <span className="text-[var(--muted)]">{zh ? "主責團隊" : "Primary"}:</span>{" "}
            {defaultRoute ? phrase(defaultRoute.primary_team) : "—"}
          </div>
          <div>
            <span className="text-[var(--muted)]">SLA:</span>{" "}
            {defaultRoute?.sla_minutes || defaultSlaMinutes}m
          </div>
          <div>
            <span className="text-[var(--muted)]">Lark:</span>{" "}
            {defaultRoute?.lark_channel ? phrase(defaultRoute.lark_channel) : "—"}
          </div>
          <div>
            <span className="text-[var(--muted)]">{zh ? "情境" : "Scenario"}:</span>{" "}
            {defaultRoute?.risk_scenario || "exotic_or_unmatched"}
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-white/80 p-3">
          <div className="text-xs font-semibold text-amber-950 mb-2">
            {zh ? "測試異常事件比對" : "Probe exotic event match"}
          </div>
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="label">{zh ? "領域" : "Domain"}</label>
              <input
                className="input w-44"
                value={probe.domain}
                onChange={(e) => setProbe({ ...probe, domain: e.target.value })}
              />
            </div>
            <div>
              <label className="label">{t("common.severity")}</label>
              <select
                className="select"
                value={probe.severity}
                onChange={(e) => setProbe({ ...probe, severity: e.target.value })}
              >
                <option>INFO</option>
                <option>WARN</option>
                <option>BREACH</option>
                <option>CRITICAL</option>
              </select>
            </div>
            <button type="button" className="btn btn-primary" onClick={probeMatch} data-testid="esc-probe-match">
              {zh ? "比對" : "Match"}
            </button>
            {probe.result && (
              <span className="text-sm font-mono text-amber-950" data-testid="esc-probe-result">
                {probe.result}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="panel p-4 border-teal-200 bg-teal-50/40">
        <div className="text-xs uppercase tracking-[0.12em] text-teal-900">
          {zh ? "比對順序" : "Match order"}
        </div>
        <p className="text-sm mt-1 text-teal-950">
          {zh
            ? "精確領域＋嚴重度 → 領域萬用嚴重度 → 預設路徑（ESC-DEFAULT）。每個警報一定有升級路徑；缺 SLA 時使用 escalation.default_sla_minutes。"
            : "Exact domain+severity → domain wild severity → default path (ESC-DEFAULT). Every alert gets a route; missing SLA uses escalation.default_sla_minutes."}
        </p>
        <p className="text-xs text-[var(--muted)] mt-2">
          {zh ? `預設 SLA：${defaultSlaMinutes} 分鐘` : `Default SLA: ${defaultSlaMinutes} minutes`}
        </p>
      </div>

      {canManage && (
        <div className="panel p-4">
          <h3 className="font-semibold">{t("esc.create")}</h3>
          <div className="mt-3 grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="label">{t("common.name")}</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">{zh ? "路徑代碼" : "Route code"}</label>
              <input
                className="input"
                value={form.route_code}
                onChange={(e) => setForm({ ...form, route_code: e.target.value })}
                placeholder="ESC-…"
              />
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
                <option>ANY</option>
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
                <option value="*">* ({zh ? "預設／萬用" : "default / wild"})</option>
              </select>
            </div>
            <div>
              <label className="label">{zh ? "風險情境" : "Risk scenario"}</label>
              <input
                className="input"
                value={form.risk_scenario}
                onChange={(e) => setForm({ ...form, risk_scenario: e.target.value })}
              />
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
              <th>{zh ? "升級路徑" : "Escalation path"}</th>
              <th>{t("common.severity")}</th>
              <th>{t("org.teams")}</th>
              <th>{t("common.lark")}</th>
              <th>{t("common.sla")}</th>
              <th>{zh ? "係數" : "Coefficients"}</th>
              <th>{t("common.human")}</th>
              <th>{t("common.status")}</th>
              {canManage && <th />}
            </tr>
          </thead>
          <tbody>
            {routes.map((r) => {
              const actions = JSON.parse(r.auto_actions_json || "[]") as string[];
              const c = parseCoefficients(r.coefficients_json);
              const def = isDefault(r);
              return (
                <tr
                  key={r.id}
                  className={def ? "bg-amber-50/60" : undefined}
                  data-testid={def ? "esc-default-row" : `esc-row-${r.route_code || r.id}`}
                >
                  <td>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold">{phrase(r.name)}</div>
                      {def && (
                        <Badge className="bg-amber-100 text-amber-950 border-amber-300">
                          {zh ? "預設路徑" : "DEFAULT"}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-[var(--muted)] font-mono">
                      {r.route_code || `ESC-${r.id}`} · {phrase(r.domain_code)}
                      {r.risk_scenario ? ` · ${r.risk_scenario}` : ""}
                    </div>
                  </td>
                  <td>
                    <SeverityBadge value={r.severity} />
                  </td>
                  <td className="text-sm">
                    <div>{phrase(r.primary_team)}</div>
                    <div className="text-xs text-[var(--muted)]">{r.secondary_team ? phrase(r.secondary_team) : "—"}</div>
                  </td>
                  <td className="text-sm">{r.lark_channel ? phrase(r.lark_channel) : "—"}</td>
                  <td className="tabular-nums">{r.sla_minutes > 0 ? `${r.sla_minutes}m` : `${defaultSlaMinutes}m*`}</td>
                  <td className="text-xs tabular-nums">
                    {editId === r.id ? (
                      <div className="space-y-2 min-w-[220px]">
                        {COEFF_KEYS.map((k) => (
                          <label key={k.key} className="flex items-center justify-between gap-2">
                            <span>{zh ? k.zh : k.en}</span>
                            <input
                              className="input w-20"
                              type="number"
                              step="0.1"
                              value={coeffs[k.key]}
                              onChange={(e) =>
                                setCoeffs({ ...coeffs, [k.key]: Number(e.target.value) || 0 })
                              }
                            />
                          </label>
                        ))}
                        <div>
                          <label className="label">{zh ? "風險情境" : "Risk scenario"}</label>
                          <input
                            className="input"
                            value={editMeta.risk_scenario}
                            onChange={(e) => setEditMeta({ ...editMeta, risk_scenario: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="label">{zh ? "待處理門檻（分）" : "Pending threshold (min)"}</label>
                          <input
                            className="input"
                            value={editMeta.pending_minutes_threshold}
                            onChange={(e) =>
                              setEditMeta({ ...editMeta, pending_minutes_threshold: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <label className="label">{zh ? "涉入團隊（逗號）" : "Involved teams (comma)"}</label>
                          <input
                            className="input"
                            value={editMeta.involved_teams}
                            onChange={(e) => setEditMeta({ ...editMeta, involved_teams: e.target.value })}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button type="button" className="btn btn-primary" onClick={() => saveEdit(r)}>
                            {t("common.save")}
                          </button>
                          <button type="button" className="btn" onClick={() => setEditId(null)}>
                            {t("common.cancel")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {COEFF_KEYS.map((k) => (
                          <div key={k.key}>
                            {zh ? k.zh : k.en}: {c[k.key]}
                          </div>
                        ))}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {actions.map((a) => (
                            <Badge key={a} className="bg-slate-100 text-slate-700 border-slate-200">
                              {phrase(a)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </td>
                  <td>{r.requires_human ? t("common.yes") : t("common.no")}</td>
                  <td>
                    <StatusBadge value={r.enabled ? "ACTIVE" : "DISABLED"} />
                  </td>
                  {canManage && (
                    <td>
                      <div className="flex flex-col gap-1">
                        {def ? (
                          <span className="text-[11px] text-amber-900">
                            {zh ? "預設 · 不可停用" : "Default · locked on"}
                          </span>
                        ) : (
                          <button className="btn" onClick={() => toggle(r)}>
                            {r.enabled ? t("common.disable") : t("common.enable")}
                          </button>
                        )}
                        {editId !== r.id && (
                          <button className="btn" onClick={() => openEdit(r)}>
                            {zh ? "編輯係數" : "Edit coeffs"}
                          </button>
                        )}
                      </div>
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
