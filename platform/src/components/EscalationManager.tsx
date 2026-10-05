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
  { key: "need_human_intervention", en: "Need human", zh: "需人工干預" },
];

function parseInvolved(raw: string | null | undefined): string[] {
  try {
    return JSON.parse(raw || "[]") as string[];
  } catch {
    return [];
  }
}

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
    involved_teams: "",
    pending_minutes_threshold: "",
    requires_human: true,
  });
  const [formCoeffs, setFormCoeffs] = useState<EscalationCoefficients>({ ...DEFAULT_ESCALATION_COEFFICIENTS });
  const [msg, setMsg] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [coeffs, setCoeffs] = useState<EscalationCoefficients>({ ...DEFAULT_ESCALATION_COEFFICIENTS });
  const [editMeta, setEditMeta] = useState({
    risk_scenario: "",
    pending_minutes_threshold: "",
    involved_teams: "",
    requires_human: true,
  });
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
      result: `${m.route_code} · ${m.match_kind} · SLA ${m.sla_minutes}m → ${m.primary_team}`,
    }));
  }

  async function create() {
    const res = await fetch("/api/escalation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name || form.route_code || `${form.severity}-${form.domain_code}`,
        domain_code: form.domain_code,
        severity: form.severity,
        primary_team_id: Number(form.primary_team_id),
        secondary_team_id: form.secondary_team_id ? Number(form.secondary_team_id) : null,
        lark_channel_id: form.lark_channel_id ? Number(form.lark_channel_id) : null,
        sla_minutes: Number(form.sla_minutes) || defaultSlaMinutes,
        route_code: form.route_code || null,
        risk_scenario: form.risk_scenario || null,
        involved_teams: form.involved_teams
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        pending_minutes_threshold: form.pending_minutes_threshold
          ? Number(form.pending_minutes_threshold)
          : null,
        requires_human: form.requires_human,
        coefficients: formCoeffs,
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
    setEditMeta({
      risk_scenario: r.risk_scenario || "",
      pending_minutes_threshold: r.pending_minutes_threshold != null ? String(r.pending_minutes_threshold) : "",
      involved_teams: parseInvolved(r.involved_teams_json).join(", "),
      requires_human: Boolean(r.requires_human),
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
        requires_human: editMeta.requires_human,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || t("common.failed"));
      return;
    }
    setEditId(null);
    setMsg(zh ? "已儲存維度與係數" : "Dimensions & coefficients saved");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="panel p-4 border-amber-300 bg-amber-50/50 space-y-3" data-testid="esc-default-panel">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.12em] text-amber-950">
              {zh ? "預設升級路徑（兜底）" : "Default escalation path (catch-all)"}
            </div>
            <h3 className="font-semibold text-lg mt-1 text-amber-950 font-mono">{DEFAULT_ROUTE_CODE}</h3>
            <p className="text-sm mt-1 text-amber-950 max-w-3xl">
              {zh
                ? "路徑由維度定義：嚴重度、涉入團隊、風險情境、待處理時間、是否需人工干預，並為各因子設定可編輯係數。未匹配／異常事件一律走 ESC-DEFAULT。"
                : "Paths are defined by dimensions: severity, involved teams, risk scenario, pending time, need human intervention — each with an editable coefficient. Unmatched / exotic events always use ESC-DEFAULT."}
            </p>
          </div>
          <Badge className="bg-amber-200 text-amber-950 border-amber-400">{zh ? "預設" : "DEFAULT"}</Badge>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <div>
            <span className="text-[var(--muted)]">{zh ? "主責" : "Primary"}:</span>{" "}
            {defaultRoute ? phrase(defaultRoute.primary_team) : "—"}
          </div>
          <div>
            <span className="text-[var(--muted)]">SLA:</span> {defaultRoute?.sla_minutes || defaultSlaMinutes}m
          </div>
          <div>
            <span className="text-[var(--muted)]">{zh ? "情境" : "Scenario"}:</span>{" "}
            {phrase(defaultRoute?.risk_scenario || "exotic_or_unmatched")}
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
          {zh ? "維度 × 係數" : "Dimensions × coefficients"}
        </div>
        <p className="text-sm mt-1 text-teal-950">
          {zh
            ? "已移除「路徑」名稱欄。每列以嚴重度、涉入團隊、風險情境、待處理門檻、需人工干預定義；人類可編輯各因子係數。技能頁綁定且僅綁定一條路徑代碼。"
            : "The Path name column is removed. Each row is defined by severity, involved teams, risk scenario, pending threshold, and need-human; humans edit factor coefficients. Each skill binds exactly one route code."}
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {COEFF_KEYS.map((k) => (
            <Badge key={k.key} className="bg-teal-50 text-teal-900 border-teal-200">
              {zh ? k.zh : k.en}
            </Badge>
          ))}
        </div>
      </div>

      {canManage && (
        <div className="panel p-4" data-testid="esc-create-form">
          <h3 className="font-semibold">{t("esc.create")}</h3>
          <div className="mt-3 grid md:grid-cols-3 gap-3">
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
                placeholder="margin_cascade"
              />
            </div>
            <div>
              <label className="label">{zh ? "涉入團隊（逗號）" : "Involved teams (comma)"}</label>
              <input
                className="input"
                value={form.involved_teams}
                onChange={(e) => setForm({ ...form, involved_teams: e.target.value })}
              />
            </div>
            <div>
              <label className="label">{zh ? "待處理門檻（分）" : "Pending threshold (min)"}</label>
              <input
                className="input"
                value={form.pending_minutes_threshold}
                onChange={(e) => setForm({ ...form, pending_minutes_threshold: e.target.value })}
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
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.requires_human}
                  onChange={(e) => setForm({ ...form, requires_human: e.target.checked })}
                />
                {zh ? "需人工干預" : "Need human intervention"}
              </label>
            </div>
          </div>
          <div className="mt-3 grid md:grid-cols-5 gap-2">
            {COEFF_KEYS.map((k) => (
              <div key={k.key}>
                <label className="label">
                  {zh ? k.zh : k.en} {zh ? "係數" : "coeff"}
                </label>
                <input
                  className="input"
                  type="number"
                  step="0.1"
                  value={formCoeffs[k.key]}
                  onChange={(e) => setFormCoeffs({ ...formCoeffs, [k.key]: Number(e.target.value) || 0 })}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-3 items-center">
            <button className="btn btn-primary" onClick={create}>
              {t("esc.save")}
            </button>
            {msg && <span className="text-sm text-[var(--muted)]">{msg}</span>}
          </div>
        </div>
      )}

      <div className="panel table-wrap" data-testid="esc-dimensions-table">
        <table className="data">
          <thead>
            <tr>
              <th>{zh ? "代碼" : "Code"}</th>
              <th>{t("common.severity")}</th>
              <th>{zh ? "涉入團隊" : "Involved teams"}</th>
              <th>{zh ? "風險情境" : "Risk scenario"}</th>
              <th>{zh ? "待處理（分）" : "Pending (min)"}</th>
              <th>{zh ? "需人工" : "Need human"}</th>
              <th>{zh ? "係數（可編輯）" : "Coefficients (editable)"}</th>
              <th>{t("common.sla")}</th>
              <th>{t("common.lark")}</th>
              <th>{t("common.status")}</th>
              {canManage && <th />}
            </tr>
          </thead>
          <tbody>
            {routes.map((r) => {
              const c = parseCoefficients(r.coefficients_json);
              const def = isDefault(r);
              const involved = parseInvolved(r.involved_teams_json);
              const teamLabels = [
                phrase(r.primary_team),
                r.secondary_team ? phrase(r.secondary_team) : null,
                ...involved.map((x) => phrase(x)),
              ].filter(Boolean) as string[];
              return (
                <tr
                  key={r.id}
                  className={def ? "bg-amber-50/60" : undefined}
                  data-testid={def ? "esc-default-row" : `esc-row-${r.route_code || r.id}`}
                >
                  <td className="align-top">
                    <div className="flex flex-wrap items-center gap-1">
                      <code className="font-semibold text-sm">{r.route_code || `ESC-${r.id}`}</code>
                      {def && (
                        <Badge className="bg-amber-100 text-amber-950 border-amber-300">
                          {zh ? "預設" : "DEFAULT"}
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--muted)] mt-0.5">{phrase(r.domain_code)}</div>
                  </td>
                  <td className="align-top">
                    <SeverityBadge value={r.severity} />
                  </td>
                  <td className="align-top text-sm">
                    <ul className="space-y-0.5">
                      {teamLabels.map((label, i) => (
                        <li key={`${label}-${i}`}>{label}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="align-top text-sm font-mono text-xs">
                    {r.risk_scenario ? phrase(r.risk_scenario) : "—"}
                  </td>
                  <td className="align-top tabular-nums">
                    {r.pending_minutes_threshold != null ? r.pending_minutes_threshold : "—"}
                  </td>
                  <td className="align-top">{r.requires_human ? t("common.yes") : t("common.no")}</td>
                  <td className="align-top text-xs tabular-nums">
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
                              onChange={(e) => setCoeffs({ ...coeffs, [k.key]: Number(e.target.value) || 0 })}
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
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={editMeta.requires_human}
                            onChange={(e) => setEditMeta({ ...editMeta, requires_human: e.target.checked })}
                          />
                          {zh ? "需人工干預" : "Need human"}
                        </label>
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
                      <div className="space-y-0.5" data-testid={`esc-coeffs-${r.route_code || r.id}`}>
                        {COEFF_KEYS.map((k) => (
                          <div key={k.key}>
                            {zh ? k.zh : k.en}: <strong>{c[k.key]}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="align-top tabular-nums">
                    {r.sla_minutes > 0 ? `${r.sla_minutes}m` : `${defaultSlaMinutes}m*`}
                  </td>
                  <td className="align-top text-sm">{r.lark_channel ? phrase(r.lark_channel) : "—"}</td>
                  <td className="align-top">
                    <StatusBadge value={r.enabled ? "ACTIVE" : "DISABLED"} />
                  </td>
                  {canManage && (
                    <td className="align-top">
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
                          <button className="btn" onClick={() => openEdit(r)} data-testid={`esc-edit-${r.id}`}>
                            {zh ? "編輯維度／係數" : "Edit dims / coeffs"}
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
