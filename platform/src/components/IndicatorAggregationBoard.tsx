"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui";
import { EnZh } from "@/components/EnZh";
import { useUiLocale } from "@/hooks/useUiLocale";
import { phrase } from "@/lib/i18n";
import {
  LINEAR_AGGREGATION_STEPS,
  type AggregateDefinition,
  type AggregationSession,
  type AggregationStepId,
} from "@/lib/indicator-aggregation-shared";

function stepIndex(step: AggregationStepId): number {
  const order: AggregationStepId[] = [
    "SINGLE_ALERT",
    "SKILL_RAG_LOOKUP",
    "AGGREGATE_CHECK",
    "SINGLE_CONTINUE",
    "CORRELATED_WAIT",
    "RO_SINGLE",
    "AGGREGATE_READY",
    "RO_AGGREGATE",
  ];
  return order.indexOf(step);
}

function outcomeTone(outcome: AggregationSession["outcome"]) {
  if (outcome === "AGGREGATED") return "bg-indigo-100 border-indigo-200 text-indigo-950";
  if (outcome === "FORCE_AGGREGATED") return "bg-orange-100 border-orange-200 text-orange-950";
  if (outcome === "PENDING") return "bg-amber-100 border-amber-200 text-amber-950";
  return "bg-slate-100 border-slate-200 text-slate-800";
}

function pathVisited(session: AggregationSession): Set<AggregationStepId> {
  return new Set(session.events.map((e) => e.step));
}

export function IndicatorAggregationBoard({
  definitions,
  initialSessions,
  canOperate,
}: {
  definitions: AggregateDefinition[];
  initialSessions: AggregationSession[];
  canOperate: boolean;
}) {
  const router = useRouter();
  const { locale } = useUiLocale();
  const zh = locale === "zh-Hant";
  const [sessions, setSessions] = useState(initialSessions);
  const [activeId, setActiveId] = useState(initialSessions[0]?.session_id || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [demoMonitor, setDemoMonitor] = useState(
    definitions[0]?.member_monitors[0] || "M2-COPY-009"
  );

  const active = useMemo(
    () => sessions.find((s) => s.session_id === activeId) || sessions[0] || null,
    [sessions, activeId]
  );
  const activeDef = useMemo(
    () => (active?.aggregate_code ? definitions.find((d) => d.code === active.aggregate_code) : null),
    [active, definitions]
  );
  const visited = active ? pathVisited(active) : new Set<AggregationStepId>();

  async function run(action: string, body: Record<string, unknown> = {}) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/indicator-aggregation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      if (Array.isArray(data.sessions)) setSessions(data.sessions);
      if (data.session?.session_id) setActiveId(data.session.session_id);
      setMsg(
        zh
          ? data.message_zh || data.message || "已更新"
          : data.message || data.message_zh || "Updated"
      );
      router.refresh();
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      setMsg(phrase(raw, zh ? "zh-Hant" : "en") || raw);
    } finally {
      setBusy(false);
    }
  }

  const waitingRelated =
    active &&
    active.step === "CORRELATED_WAIT" &&
    active.outcome === "PENDING" &&
    active.member_monitors.filter((m) => m !== active.trigger_monitor);

  return (
    <div className="space-y-4" data-testid="indicator-agg-board">
      <section className="panel p-4 border-teal-200 bg-teal-50/30 space-y-3">
        <div>
          <div className="text-xs uppercase tracking-[0.12em] text-teal-900">
            <EnZh en="Linear indicator aggregation flow" zh="線型指標聚合流程" />
          </div>
          <p className="text-sm mt-1 text-teal-950 max-w-4xl">
            <EnZh
              en="Single alert → skill/RAG lookup → membership check → (no) single path, or (yes) mark correlation + wait window → timeout = RO as single / related alerts = aggregate then RO as aggregate."
              zh="單一告警 → Skill／RAG 檢索 → 成員資格檢查 →（否）單一路徑，或（是）標記關聯＋等待視窗 → 逾時＝RO 按單一處理／出現關聯＝界面聚合後再報 RO。"
            />
          </p>
        </div>

        <ol
          className="grid md:grid-cols-4 xl:grid-cols-8 gap-2 text-xs"
          data-testid="indicator-agg-linear-steps"
        >
          {LINEAR_AGGREGATION_STEPS.map((s) => {
            const on = active?.step === s.id || visited.has(s.id);
            const current = active?.step === s.id;
            return (
              <li
                key={s.id}
                className={`rounded-lg border px-2 py-2 ${
                  current
                    ? "border-teal-500 bg-white shadow-sm ring-1 ring-teal-200"
                    : on
                      ? "border-teal-200 bg-white"
                      : "border-dashed border-slate-200 bg-slate-50/80 text-slate-400"
                }`}
                data-step={s.id}
              >
                <div className={`font-semibold ${current ? "text-teal-900" : ""}`}>
                  {zh ? s.zh : s.en}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid lg:grid-cols-[1.1fr_1.4fr] gap-3">
        <section className="panel p-4 space-y-3" data-testid="indicator-agg-sessions">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
              <EnZh en="Live aggregation sessions" zh="即時聚合工作階段" />
            </div>
            {canOperate ? (
              <div className="flex flex-wrap gap-2 items-center">
                <select
                  className="input !min-h-9 text-xs max-w-[10rem]"
                  value={demoMonitor}
                  onChange={(e) => setDemoMonitor(e.target.value)}
                  data-testid="indicator-agg-monitor-select"
                >
                  {Array.from(
                    new Set([
                      ...definitions.flatMap((d) => d.member_monitors),
                      "M2-ORPHAN-999",
                    ])
                  ).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-primary !min-h-9 text-xs"
                  disabled={busy}
                  onClick={() =>
                    void run("start", {
                      trigger_monitor: demoMonitor,
                      trigger_severity: "BREACH",
                    })
                  }
                  data-testid="indicator-agg-start"
                >
                  <EnZh en="Fire demo alert" zh="觸發示範告警" />
                </button>
              </div>
            ) : null}
          </div>

          <ul className="space-y-2 max-h-[28rem] overflow-auto">
            {sessions.map((s) => (
              <li key={s.session_id}>
                <button
                  type="button"
                  className={`w-full text-left rounded-lg border px-3 py-2 text-sm ${
                    active?.session_id === s.session_id
                      ? "border-teal-400 bg-teal-50/60"
                      : "border-[var(--line)] bg-white hover:bg-slate-50"
                  }`}
                  onClick={() => setActiveId(s.session_id)}
                  data-testid={`indicator-agg-session-${s.session_id}`}
                >
                  <div className="flex flex-wrap gap-2 items-center justify-between">
                    <span className="font-mono text-xs">{s.session_id}</span>
                    <Badge className={outcomeTone(s.outcome)}>{s.outcome}</Badge>
                  </div>
                  <div className="mt-1 font-mono text-xs text-slate-700">
                    {s.trigger_monitor} · {s.trigger_severity}
                    {s.aggregate_code ? ` · ${s.aggregate_code}` : ""}
                  </div>
                  <div className="text-xs text-[var(--muted)] mt-0.5">
                    {zh ? LINEAR_AGGREGATION_STEPS.find((x) => x.id === s.step)?.zh : s.step}
                  </div>
                </button>
              </li>
            ))}
            {!sessions.length ? (
              <li className="text-sm text-[var(--muted)]">
                <EnZh en="No sessions yet." zh="尚無工作階段。" />
              </li>
            ) : null}
          </ul>
          {msg ? <p className="text-sm text-teal-900">{msg}</p> : null}
        </section>

        <section className="panel p-4 space-y-3" data-testid="indicator-agg-detail">
          {!active ? (
            <p className="text-sm text-[var(--muted)]">
              <EnZh en="Select or fire a session." zh="請選擇或觸發一個工作階段。" />
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-sm font-semibold">{active.session_id}</div>
                  <p className="text-sm mt-1">
                    <EnZh en="Trigger" zh="觸發" />{" "}
                    <span className="font-mono">
                      {active.trigger_monitor} · {active.trigger_severity}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge className={outcomeTone(active.outcome)}>{active.outcome}</Badge>
                  {active.correlation_marked ? (
                    <Badge className="bg-orange-100 border-orange-200 text-orange-950">
                      <EnZh en="Correlation possible" zh="可能存在指標關聯" />
                    </Badge>
                  ) : null}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-2 text-xs">
                <div className="rounded border border-[var(--line)] bg-slate-50/80 px-2 py-1.5">
                  <div className="text-[var(--muted)] uppercase tracking-[0.08em]">
                    <EnZh en="Skill / RAG" zh="技能／RAG" />
                  </div>
                  <div className="mt-1 font-mono">{active.skill_hit || "—"}</div>
                  <div className="text-slate-600 mt-0.5">{active.rag_hit || "—"}</div>
                </div>
                <div className="rounded border border-[var(--line)] bg-slate-50/80 px-2 py-1.5">
                  <div className="text-[var(--muted)] uppercase tracking-[0.08em]">
                    <EnZh en="Aggregate / window" zh="聚合／視窗" />
                  </div>
                  <div className="mt-1 font-mono">
                    {active.aggregate_code || (zh ? "（無）" : "(none)")}
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    {active.window_minutes
                      ? `${active.window_minutes}m · seen ${active.related_seen.length}`
                      : zh
                        ? "無等待視窗"
                        : "no wait window"}
                  </div>
                </div>
              </div>

              {activeDef ? (
                <div
                  className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-3 space-y-2"
                  data-testid="indicator-agg-members"
                >
                  <div className="text-xs font-semibold text-indigo-950">
                    {zh ? activeDef.name_zh : activeDef.name}
                  </div>
                  <p className="text-xs text-indigo-900/90">
                    {zh ? activeDef.description_zh : activeDef.description}
                  </p>
                  <ul className="space-y-1.5">
                    {activeDef.sequence.map((ev, i) => {
                      const fired =
                        ev.monitor_id === active.trigger_monitor ||
                        active.related_seen.includes(ev.monitor_id);
                      return (
                        <li
                          key={`${ev.monitor_id}-${i}`}
                          className={`flex flex-wrap gap-2 items-center justify-between rounded border px-2 py-1 text-xs ${
                            fired
                              ? "border-indigo-300 bg-white"
                              : "border-dashed border-slate-200 text-slate-400"
                          }`}
                        >
                          <span>
                            <span className="font-mono">T+{ev.t_minutes}m</span>{" "}
                            <span className="font-mono font-semibold">{ev.monitor_id}</span>{" "}
                            {ev.severity}
                          </span>
                          <span className="text-[11px]">{ev.signal}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)] mb-1.5">
                  <EnZh en="Event trail" zh="事件軌跡" />
                </div>
                <ol className="space-y-1.5 max-h-56 overflow-auto text-xs" data-testid="indicator-agg-events">
                  {active.events.map((ev, i) => (
                    <li
                      key={`${ev.at}-${i}`}
                      className="rounded border border-[var(--line)] bg-white px-2 py-1.5"
                    >
                      <div className="flex flex-wrap gap-2 justify-between">
                        <Badge className="bg-slate-50 border-slate-200 font-mono text-[10px]">
                          {ev.step}
                        </Badge>
                        <span className="font-mono text-[10px] text-[var(--muted)]">
                          {ev.at.slice(11, 19)}Z
                        </span>
                      </div>
                      <p className="mt-1 text-slate-800">{zh ? ev.zh : ev.en}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {canOperate && active.outcome === "PENDING" && active.step === "CORRELATED_WAIT" ? (
                <div className="flex flex-wrap gap-2 pt-1" data-testid="indicator-agg-actions">
                  {(waitingRelated || []).slice(0, 3).map((m) => (
                    <button
                      key={m}
                      type="button"
                      className="btn btn-primary !min-h-10 text-xs"
                      disabled={busy}
                      onClick={() =>
                        void run("inject_related", {
                          session_id: active.session_id,
                          related_monitor: m,
                          severity: "BREACH",
                        })
                      }
                      data-testid={`indicator-agg-inject-${m}`}
                    >
                      <EnZh en={`Related alert: ${m}`} zh={`關聯告警：${m}`} />
                    </button>
                  ))}
                  <button
                    type="button"
                    className="btn !min-h-10 text-xs border-orange-300 text-orange-950"
                    disabled={busy}
                    onClick={() =>
                      void run("force_aggregate", {
                        session_id: active.session_id,
                        reason: "RO force L2 while L1 incomplete (desk demo)",
                      })
                    }
                    data-testid="indicator-agg-force"
                  >
                    <EnZh
                      en="Force-aggregate L2 (L1 incomplete)"
                      zh="強制聚合 L2（L1 未齊）"
                    />
                  </button>
                  <button
                    type="button"
                    className="btn !min-h-10 text-xs"
                    disabled={busy}
                    onClick={() =>
                      void run("close_window", { session_id: active.session_id })
                    }
                    data-testid="indicator-agg-timeout"
                  >
                    <EnZh en="End window → RO as single" zh="結束視窗 → RO 按單一處理" />
                  </button>
                </div>
              ) : null}

              {(active.outcome === "AGGREGATED" || active.outcome === "FORCE_AGGREGATED") &&
              active.l2_severity_calc ? (
                <div
                  className="rounded-lg border border-indigo-200 bg-indigo-50/60 px-3 py-2 space-y-1.5"
                  data-testid="indicator-agg-l2-severity"
                >
                  <div className="flex flex-wrap items-center gap-2 justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-indigo-900">
                      <EnZh en="L2 severity = max(L1) × weight" zh="L2 嚴重度 = max(L1) × 權重" />
                    </span>
                    <span data-testid="indicator-agg-l2-severity-final">
                      <Badge
                        className={
                          active.l2_severity === "CRITICAL"
                            ? "bg-rose-100 text-rose-950 border-rose-200"
                            : active.l2_severity === "BREACH"
                              ? "bg-orange-100 text-orange-950 border-orange-200"
                              : "bg-amber-100 text-amber-950 border-amber-200"
                        }
                      >
                        L2 = {active.l2_severity || active.l2_severity_calc.final}
                        {active.l2_severity_calc.upgraded
                          ? zh
                            ? " · 已升檔"
                            : " · upgraded"
                          : ""}
                      </Badge>
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-indigo-950/90">
                    {zh
                      ? active.l2_severity_calc.formula_zh
                      : active.l2_severity_calc.formula_en}
                  </p>
                  <ul className="text-[11px] text-slate-700 space-y-0.5 font-mono">
                    {active.l2_severity_calc.l1.map((row) => (
                      <li key={row.monitor_id}>
                        {row.monitor_id} = {row.severity}
                      </li>
                    ))}
                  </ul>
                  <ol className="list-decimal pl-4 space-y-0.5 text-[11px] text-slate-700">
                    {(zh
                      ? active.l2_severity_calc.steps_zh
                      : active.l2_severity_calc.steps_en
                    ).map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
              ) : null}

              {canOperate &&
              (active.outcome === "AGGREGATED" || active.outcome === "FORCE_AGGREGATED") ? (
                <div className="flex flex-wrap gap-2 pt-1" data-testid="indicator-agg-post-flow">
                  {active.force_aggregated ? (
                    <Badge className="bg-orange-100 border-orange-200 text-orange-950">
                      <EnZh
                        en={`Forced · missing L1: ${(active.missing_l1_at_force || []).join(", ") || "—"}`}
                        zh={`已強制 · 缺 L1：${(active.missing_l1_at_force || []).join("、") || "—"}`}
                      />
                    </Badge>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn-primary !min-h-10 text-xs"
                    disabled={busy}
                    onClick={() =>
                      void run("continue_post_flow", { session_id: active.session_id })
                    }
                    data-testid="indicator-agg-continue"
                  >
                    <EnZh en="Continue post-L2 flow" zh="繼續 L2 之後流程" />
                  </button>
                </div>
              ) : null}

              <p className="text-[11px] text-[var(--muted)]">
                <EnZh
                  en={`Pipeline depth ${Math.max(0, stepIndex(active.step)) + 1} / ${LINEAR_AGGREGATION_STEPS.length}`}
                  zh={`流程深度 ${Math.max(0, stepIndex(active.step)) + 1} / ${LINEAR_AGGREGATION_STEPS.length}`}
                />
              </p>
            </>
          )}
        </section>
      </div>

      <section className="panel p-4 space-y-2" data-testid="indicator-agg-definitions">
        <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
          <EnZh
            en="Aggregate definitions (from linked timeline chains)"
            zh="聚合指標定義（來自連結時間鏈）"
          />
        </div>
        <ul className="grid md:grid-cols-2 gap-2">
          {definitions.slice(0, 8).map((d) => (
            <li
              key={d.code}
              className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-xs space-y-1"
            >
              <div className="flex flex-wrap gap-2 justify-between">
                <span className="font-mono font-semibold">{d.code}</span>
                <Badge className="bg-slate-50">{d.window_minutes}m</Badge>
              </div>
              <div className="font-medium">{zh ? d.name_zh : d.name}</div>
              <div className="font-mono text-[11px] text-slate-600">
                {d.member_monitors.join(" · ")}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
