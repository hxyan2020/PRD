"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, SeverityBadge, StatusBadge } from "@/components/ui";
import { AdminLink } from "@/components/AdminLink";
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
}: {
  analyses: Analysis[];
  canOperate: boolean;
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
    setMsg(
      action === "analyze_open"
        ? t("ai.ensured", { n: data.count })
        : action === "simulate_alarm"
          ? `${t("ai.alarmRaised", { id: data.analysis?.analysis_id, mode: data.analysis?.mode, pct })}${
              data.challenge ? ` · ${t("ai.challenged", { verdict: data.challenge.verdict })}` : ""
            }`
          : action === "backfill_challenges"
            ? t("ai.backfilled", { n: data.count })
            : t("ai.done")
    );
    router.refresh();
    if (action === "simulate_alarm") {
      bumpNavBadge("/admin/alerts", 1);
      bumpNavBadge("/admin/spine", 1);
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
      {canOperate && (
        <div className="panel p-4">
          <h3 className="font-semibold">{t("ai.pipeline")}</h3>
          <p className="text-sm text-[var(--muted)] mt-1">{t("ai.pipelineIntro")}</p>
          <div className="mt-3 action-row">
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => run("analyze_open")}>
              {t("ai.analyzeOpen")}
            </button>
            <button
              type="button"
              className="btn"
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
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => run("backfill_challenges")}
            >
              {t("ai.backfill")}
            </button>
          </div>
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
