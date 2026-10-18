"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Gauge, Pause, Play, RotateCcw } from "lucide-react";
import { useUiLocale } from "@/hooks/useUiLocale";
import { EnZh } from "@/components/EnZh";
import { Badge } from "@/components/ui";
import {
  THRESHOLD_FLOW_LABELS,
  THRESHOLD_FLOW_STAGES,
  type ThresholdFlowStageId,
} from "@/lib/threshold-flow-shared";

type Phase = "idle" | "running" | "done";

/**
 * Animated full-flow demo: observe → AI X→Y → CR → maker/checker → Monitor 2.0 apply → audit.
 * Mounted on Monitor 2.0 and Admin Home; does not mutate live thresholds.
 */
export function ThresholdAdjustmentFlowDemo({ compact = false }: { compact?: boolean }) {
  const { locale } = useUiLocale();
  const zh = locale === "zh-Hant";
  const [phase, setPhase] = useState<Phase>("idle");
  const [stageIdx, setStageIdx] = useState(-1);
  const [auto, setAuto] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setPhase("idle");
    setStageIdx(-1);
    setAuto(false);
  }, [clearTimer]);

  const activeId: ThresholdFlowStageId | null =
    stageIdx >= 0 && stageIdx < THRESHOLD_FLOW_STAGES.length
      ? THRESHOLD_FLOW_STAGES[stageIdx].id
      : null;

  useEffect(() => {
    if (!auto || phase === "done") return;
    if (phase === "idle") {
      setPhase("running");
      setStageIdx(0);
      return;
    }
    if (phase === "running" && stageIdx >= 0 && stageIdx < THRESHOLD_FLOW_STAGES.length - 1) {
      timerRef.current = setTimeout(() => setStageIdx((i) => i + 1), 1100);
      return () => clearTimer();
    }
    if (phase === "running" && stageIdx === THRESHOLD_FLOW_STAGES.length - 1) {
      timerRef.current = setTimeout(() => {
        setPhase("done");
        setAuto(false);
      }, 1400);
      return () => clearTimer();
    }
  }, [auto, phase, stageIdx, clearTimer]);

  function startAuto() {
    reset();
    setTimeout(() => {
      setAuto(true);
      setPhase("running");
      setStageIdx(0);
    }, 0);
  }

  function stepNext() {
    if (phase === "idle") {
      setPhase("running");
      setStageIdx(0);
      return;
    }
    if (stageIdx < THRESHOLD_FLOW_STAGES.length - 1) {
      setStageIdx((i) => i + 1);
      setPhase("running");
      return;
    }
    setPhase("done");
  }

  const progressPct =
    phase === "idle"
      ? 0
      : phase === "done"
        ? 100
        : ((stageIdx + 1) / THRESHOLD_FLOW_STAGES.length) * 100;

  const band = useMemo(() => {
    const applied = stageIdx >= 4; // APPLY_M2 or later
    return {
      warn: applied ? THRESHOLD_FLOW_LABELS.to_warn : THRESHOLD_FLOW_LABELS.from_warn,
      breach: applied ? THRESHOLD_FLOW_LABELS.to_breach : THRESHOLD_FLOW_LABELS.from_breach,
      applied,
    };
  }, [stageIdx]);

  const L = THRESHOLD_FLOW_LABELS;

  return (
    <section
      id="threshold-flow-demo"
      className={`panel p-3 sm:p-4 border-teal-200 bg-gradient-to-br from-teal-50/50 via-white to-amber-50/40 ${
        compact ? "mt-3" : "mt-4"
      }`}
      data-testid="threshold-flow-demo"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-[family-name:var(--font-display)] text-lg flex items-center gap-2">
            <Gauge className="h-5 w-5 text-teal-800" aria-hidden />
            <EnZh en={L.title_en} zh={L.title_zh} />
          </h2>
          <p className="text-xs text-[var(--muted)] mt-1 max-w-3xl">
            <EnZh en={L.blurb_en} zh={L.blurb_zh} />
          </p>
        </div>
        <div className="action-row shrink-0">
          <button
            type="button"
            className="btn btn-primary !min-h-9 text-xs"
            data-testid="threshold-flow-auto"
            onClick={startAuto}
            disabled={auto}
          >
            <Play className="h-3.5 w-3.5" aria-hidden />
            <EnZh en="Play flow" zh="播放流程" />
          </button>
          <button
            type="button"
            className="btn !min-h-9 text-xs"
            data-testid="threshold-flow-step"
            onClick={stepNext}
            disabled={auto || phase === "done"}
          >
            <EnZh en="Step" zh="下一步" />
          </button>
          <button
            type="button"
            className="btn !min-h-9 text-xs"
            data-testid="threshold-flow-reset"
            onClick={reset}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            <EnZh en="Reset" zh="重設" />
          </button>
        </div>
      </div>

      <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden" aria-hidden>
        <div
          className="h-full bg-teal-600 transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className={`mt-4 grid gap-3 ${compact ? "" : "lg:grid-cols-[1.1fr_1fr]"}`}>
        <div className="space-y-2">
          <ol className="space-y-1.5" data-testid="threshold-flow-stages">
            {THRESHOLD_FLOW_STAGES.map((s, i) => {
              const on = stageIdx >= i;
              const current = phase !== "idle" && stageIdx === i;
              return (
                <li
                  key={s.id}
                  className={`rounded-lg border px-3 py-2 text-sm transition-all duration-300 ${
                    current
                      ? "border-teal-500 bg-white ring-1 ring-teal-200 scale-[1.01] shadow-sm"
                      : on
                        ? "border-teal-200 bg-teal-50/70"
                        : "border-dashed border-slate-200 text-slate-400"
                  }`}
                  data-testid={`threshold-flow-stage-${s.id}`}
                  data-on={on ? "1" : "0"}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{zh ? s.zh : s.en}</span>
                    <span className="font-mono text-[10px] opacity-70">{s.id}</span>
                  </div>
                  {(current || on) && (
                    <p className="text-[11px] text-slate-700 mt-1 leading-snug">
                      {zh ? s.detail_zh : s.detail_en}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="space-y-3">
          <div
            className={`rounded-xl border p-3 transition-all duration-500 ${
              stageIdx >= 0
                ? "border-teal-300 bg-white shadow-sm"
                : "border-dashed border-slate-200 bg-slate-50/80"
            }`}
            data-testid="threshold-flow-band"
          >
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <Badge className="bg-teal-100 text-teal-950 border-teal-200 font-mono">
                {L.demo_monitor}
              </Badge>
              {band.applied ? (
                <span data-testid="threshold-flow-applied">
                  <Badge className="bg-emerald-100 text-emerald-950 border-emerald-200">
                    <EnZh en="Live band applied" zh="線上分帶已套用" />
                  </Badge>
                </span>
              ) : stageIdx >= 1 ? (
                <span data-testid="threshold-flow-proposed">
                  <Badge className="bg-amber-100 text-amber-950 border-amber-200">
                    <EnZh en="Suggest only — not live" zh="僅建議 — 未上線" />
                  </Badge>
                </span>
              ) : (
                <span className="text-[11px] text-[var(--muted)] inline-flex items-center gap-1">
                  <Pause className="h-3 w-3" aria-hidden />
                  <EnZh en="Waiting for flow" zh="等待流程" />
                </span>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-2.5 py-2">
                <div className="text-[10px] uppercase tracking-wide text-amber-900">Warn</div>
                <div className="font-mono font-semibold tabular-nums text-lg" data-testid="threshold-flow-warn">
                  {band.warn}
                  {L.unit}
                </div>
              </div>
              <div className="rounded-lg border border-rose-200 bg-rose-50/80 px-2.5 py-2">
                <div className="text-[10px] uppercase tracking-wide text-rose-900">Breach</div>
                <div className="font-mono font-semibold tabular-nums text-lg" data-testid="threshold-flow-breach">
                  {band.breach}
                  {L.unit}
                </div>
              </div>
            </div>
            <p className="mt-2 text-[11px] font-mono text-slate-700" data-testid="threshold-flow-xy">
              {L.from_warn}/{L.from_breach}
              {L.unit} → {L.to_warn}/{L.to_breach}
              {L.unit}
              {stageIdx >= 1 && stageIdx < 4
                ? zh
                  ? "（建議）"
                  : " (proposed)"
                : band.applied
                  ? zh
                    ? "（已套用）"
                    : " (applied)"
                  : ""}
            </p>
            {activeId === "MAKER_CHECKER" || stageIdx >= 3 ? (
              <p className="mt-2 text-[11px] text-slate-600 leading-snug">
                <EnZh
                  en="Owner BU + System approve — AI cannot change production Monitor 2.0 numbers."
                  zh="負責 BU＋系統核准 — AI 不能改正式 Monitor 2.0 數字。"
                />
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-[11px] text-[var(--muted)] space-y-1">
            <div data-testid="threshold-flow-phase">
              <EnZh en="Phase" zh="階段" />:{" "}
              <span className="font-mono text-slate-800">
                {phase}
                {activeId ? ` · ${activeId}` : ""}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <Link href="/admin/monitor-2" className="text-teal-800 font-semibold underline">
                <EnZh en="Monitor 2.0 editor" zh="Monitor 2.0 編輯器" />
              </Link>
              <Link href="/admin/alerts" className="text-teal-800 font-semibold underline">
                <EnZh en="Realtime alerts + how-to-improve" zh="即時警報＋如何改進" />
              </Link>
              <Link href="/admin/audit" className="text-teal-800 font-semibold underline">
                <EnZh en="Audit / rollback" zh="稽核／回滾" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
