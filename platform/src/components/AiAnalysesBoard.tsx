"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, SeverityBadge, StatusBadge } from "@/components/ui";
import { AdminLink } from "@/components/AdminLink";
import { EnZh } from "@/components/EnZh";
import { MonitorCode } from "@/components/MonitorCode";
import { publicAdminHref } from "@/lib/static-export";
import { bumpNavBadge } from "@/lib/nav-badges";
import { useT } from "@/hooks/useUiLocale";

type Analysis = {
  id: number;
  analysis_id: string;
  mode: string;
  confidence: number;
  summary: string;
  status: string;
  needs_human: number;
  created_at: string;
  monitor_alert_id: string;
  alert_title: string;
  severity: string;
  skill_code: string | null;
  indicator_monitor_id: string;
  challenged?: number;
  challenge_verdict?: string | null;
};

export function AiAnalysesBoard({
  analyses,
  canOperate,
  llmAvailable = false,
  llmEnabled = false,
  llmProvider = null,
  llmModel = null,
}: {
  analyses: Analysis[];
  canOperate: boolean;
  llmAvailable?: boolean;
  llmEnabled?: boolean;
  llmProvider?: string | null;
  llmModel?: string | null;
}) {
  const router = useRouter();
  const { t } = useT();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: string, body: Record<string, unknown> = {}) {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...body }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || t("common.failed"));
      return;
    }
    const detailId = data.analysis?.id;
    const pct = Math.round((data.analysis?.confidence || 0) * 100);
    const llmBit =
      data.llm?.source || data.llm_enabled === false
        ? ` · LLM ${String(data.llm?.source || (data.llm_enabled ? "ready" : "off"))}`
        : data.llm_runs
          ? ` · LLM runs ${Array.isArray(data.llm_runs) ? data.llm_runs.length : ""}`
          : "";
    setMsg(
      action === "analyze_open"
        ? `${t("ai.ensured", { n: data.count })}${llmBit}`
        : action === "simulate_alarm"
          ? `${t("ai.alarmRaised", { id: data.analysis?.analysis_id, mode: data.analysis?.mode, pct })}${
              data.challenge ? ` · ${t("ai.challenged", { verdict: data.challenge.verdict })}` : ""
            }${llmBit}`
          : action === "backfill_challenges"
            ? t("ai.backfilled", { n: data.count })
            : `${t("ai.done")}${llmBit}`
    );
    router.refresh();
    if (action === "simulate_alarm") {
      bumpNavBadge("/admin/alerts", 1);
      bumpNavBadge("/admin/alerts", 1);
    } else if (action === "analyze_open") {
      bumpNavBadge("/admin/alerts", Number(data.count) || 1);
    } else if (action === "backfill_challenges") {
      bumpNavBadge("/admin/alerts", Number(data.count) || 1);
    }
    if (action === "simulate_alarm" && detailId) {
      // Hard navigate so detail is immediately visible
      window.location.href = publicAdminHref(`/admin/ai-analyses/${detailId}`);
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`panel p-3 text-sm ${
          llmEnabled
            ? "border-teal-200 bg-teal-50/70 text-teal-950"
            : "border-amber-200 bg-amber-50/80 text-amber-950"
        }`}
        data-testid="ai-llm-status"
      >
        {llmEnabled ? (
          <EnZh
            en={`LLM enrichment ON (${llmProvider || "auto"}${llmModel ? ` / ${llmModel}` : ""}) — analyze / simulate / detectors call ChatGPT, DeepSeek, Gemini, or Claude and store a thinking trail on each RCA.`}
            zh={`LLM 強化已開啟（${llmProvider || "auto"}${llmModel ? ` / ${llmModel}` : ""}）— 分析／模擬／偵測器會呼叫 ChatGPT／DeepSeek／Gemini／Claude，並在每次 RCA 寫入思考軌跡。`}
          />
        ) : (
          <EnZh
            en={`LLM enrichment OFF (${llmAvailable ? "disabled by CRMP_AI_LLM" : "no ChatGPT/DeepSeek/Gemini/Claude key"}). Heuristic RCA still runs; set a server secret to call real AI.`}
            zh={`LLM 強化關閉（${llmAvailable ? "被 CRMP_AI_LLM 停用" : "缺少 ChatGPT／DeepSeek／Gemini／Claude 金鑰"}）。啟發式 RCA 仍會執行；請在伺服器設定密鑰以呼叫真實 AI。`}
          />
        )}
      </div>
      {canOperate && (
        <div className="panel p-4" data-testid="ai-pipeline-controls">
          <h3 className="font-semibold">{t("ai.pipeline")}</h3>
          <p className="text-sm text-[var(--muted)] mt-1">{t("ai.pipelineIntro")}</p>
          <p className="text-xs text-[var(--muted)] mt-1">{t("ai.pipelineRankNote")}</p>
          <div className="mt-3 action-row">
            <button
              type="button"
              className="btn btn-primary"
              data-testid="ai-btn-analyze-open"
              disabled={busy}
              onClick={() => run("analyze_open")}
            >
              {t("ai.analyzeOpen")}
            </button>
            <button
              type="button"
              className="btn"
              data-testid="ai-btn-backfill"
              disabled={busy}
              onClick={() => run("backfill_challenges")}
            >
              {t("ai.backfill")}
            </button>
          </div>
          <details className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--panel-2,#f8fafc)] px-3 py-2">
            <summary className="cursor-pointer text-sm font-medium select-none">{t("ai.demoSims")}</summary>
            <div className="mt-2 action-row">
              <button
                type="button"
                className="btn"
                data-testid="ai-btn-sim-copy"
                disabled={busy}
                onClick={() =>
                  run("simulate_alarm", {
                    monitor_id: "M2-COPY-009",
                    severity: "BREACH",
                    observed_value: 33,
                    title: "Simulated copy concentration breach",
                    message: "Top signal provider now at 33% of copy equity after viral strategy share.",
                  })
                }
              >
                {t("ai.simCopy")}
              </button>
              <button
                type="button"
                className="btn"
                data-testid="ai-btn-sim-eq"
                disabled={busy}
                onClick={() =>
                  run("simulate_alarm", {
                    monitor_id: "M2-EQ-001",
                    severity: "WARN",
                    observed_value: 3.8,
                    title: "Simulated equity drawdown warn",
                    message: "Company CFD book drawdown rising through US session after CPI volatility.",
                  })
                }
              >
                {t("ai.simEq")}
              </button>
              <button
                type="button"
                className="btn"
                data-testid="ai-btn-sim-crit"
                disabled={busy}
                onClick={() =>
                  run("simulate_alarm", {
                    monitor_id: "M2-MRG-014",
                    severity: "CRITICAL",
                    observed_value: 220,
                    title: "Simulated margin utilisation CRITICAL",
                    message: "Book-wide margin utilisation spiked; LP rejects rising. Requires dual-AI RCA.",
                  })
                }
              >
                {t("ai.simCrit")}
              </button>
            </div>
          </details>
          {msg && (
            <div
              role="status"
              data-testid="ai-action-status"
              className="mt-3 text-sm bg-teal-50 border border-teal-200 text-teal-900 rounded-lg px-3 py-2 sticky top-[72px] z-20"
            >
              {msg}
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {analyses.map((a) => (
          <article key={a.id} className="panel p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start sm:justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge
                    className={
                      a.mode === "SKILL_MATCH"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-amber-50 text-amber-900 border-amber-200"
                    }
                  >
                    {a.mode}
                  </Badge>
                  <SeverityBadge value={a.severity} />
                  <StatusBadge value={a.status} />
                  {a.needs_human ? (
                    <Badge className="bg-rose-50 text-rose-800 border-rose-200">{t("common.needsHuman")}</Badge>
                  ) : null}
                  {a.challenged ? (
                    <Badge
                      className={
                        a.challenge_verdict === "AGREE"
                          ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                          : a.challenge_verdict === "DISAGREE"
                            ? "bg-rose-50 text-rose-900 border-rose-200"
                            : "bg-amber-50 text-amber-900 border-amber-200"
                      }
                    >
                      {t("ai.challenged", { verdict: a.challenge_verdict || "challenged" })}
                    </Badge>
                  ) : a.severity === "BREACH" || a.severity === "CRITICAL" ? (
                    <Badge className="bg-slate-100 text-slate-600 border-slate-200">{t("ai.pending2nd")}</Badge>
                  ) : null}
                </div>
                <h2 className="mt-2 font-semibold text-base sm:text-lg break-word">{a.alert_title}</h2>
                <div className="text-xs text-[var(--muted)] mt-1 break-word flex flex-wrap items-center gap-x-1 gap-y-1">
                  <span>{a.analysis_id}</span>
                  <span>· {t("common.alert")} {a.monitor_alert_id}</span>
                  <span>·</span>
                  <MonitorCode id={a.indicator_monitor_id} tone="inline" />
                  {a.skill_code ? <span>· {a.skill_code}</span> : null}
                  <span>
                    · {t("common.confidence")} {(a.confidence * 100).toFixed(0)}% · {a.created_at}
                  </span>
                </div>
                <p className="text-sm mt-2 text-slate-700 break-word">{a.summary}</p>
              </div>
              <AdminLink
                className="btn btn-primary w-full sm:w-auto shrink-0"
                href={`/admin/ai-analyses/${a.id}`}
              >
                {t("ai.openEvidence")}
              </AdminLink>
            </div>
          </article>
        ))}
        {!analyses.length && (
          <div className="panel p-6 text-sm text-[var(--muted)]">
            {t("ai.empty")}
          </div>
        )}
      </div>
    </div>
  );
}
