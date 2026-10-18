"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { GitMerge, Pause, Play, RotateCcw, ShieldCheck } from "lucide-react";
import { useUiLocale } from "@/hooks/useUiLocale";
import { EnZh } from "@/components/EnZh";
import { Badge } from "@/components/ui";
import {
  L1_L2_LABELS,
  POST_L2_FLOW_STAGES,
  computeL2Severity,
} from "@/lib/indicator-aggregation-shared";

type DemoPhase =
  | "idle"
  | "l1_fire"
  | "wait"
  | "partial"
  | "force"
  | "l2_ready"
  | "post_flow"
  | "done";

const DEMO_L1 = [
  { id: "M2-FEED-003", t: 0, en: "Stale quotes", zh: "陳舊行情", severity: "WARN" },
  { id: "M2-MRG-014", t: 8, en: "Margin spike", zh: "保證金尖峰", severity: "BREACH" },
  { id: "M2-EQ-001", t: 18, en: "Equity drawdown", zh: "權益回撤", severity: "CRITICAL" },
] as const;

/** Demo weight: strong enough that multi-L1 BREACH can justify one-band upgrade. */
const DEMO_SEVERITY_WEIGHT = 1.25;

const WINDOW_SEC = 12;
const L2_CODE = "CHAIN-FEED-LIQUIDATION-ERROR";

/**
 * Homepage animated demo: L1 single-point → wait window → optional RO force L2
 * when not all L1 arrived → continue post-L2 spine. Does not mutate DB; API
 * path lives on /admin/indicator-aggregation.
 */
export function HomeL1L2AggregationDemo() {
  const { locale } = useUiLocale();
  const zh = locale === "zh-Hant";
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [fired, setFired] = useState<string[]>([]);
  const [waitLeft, setWaitLeft] = useState(WINDOW_SEC);
  const [postIdx, setPostIdx] = useState(-1);
  const [auto, setAuto] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setPhase("idle");
    setFired([]);
    setWaitLeft(WINDOW_SEC);
    setPostIdx(-1);
    setAuto(false);
  }, [clearTimer]);

  const missing = useMemo(
    () => DEMO_L1.filter((m) => !fired.includes(m.id)).map((m) => m.id),
    [fired]
  );

  const l2SeverityCalc = useMemo(() => {
    if (fired.length === 0) return null;
    if (phase !== "l2_ready" && phase !== "post_flow" && phase !== "done" && phase !== "force") {
      return null;
    }
    const l1_severities: Record<string, string> = {};
    for (const m of DEMO_L1) {
      if (fired.includes(m.id)) l1_severities[m.id] = m.severity;
    }
    return computeL2Severity({
      l1_severities,
      severity_weight: DEMO_SEVERITY_WEIGHT,
    });
  }, [fired, phase]);

  const fireNextL1 = useCallback(() => {
    setFired((prev) => {
      const next = DEMO_L1.find((m) => !prev.includes(m.id));
      if (!next) return prev;
      return [...prev, next.id];
    });
  }, []);

  useEffect(() => {
    if (phase === "l1_fire" && fired.length === 0) {
      fireNextL1();
      setPhase("wait");
      setWaitLeft(WINDOW_SEC);
    }
  }, [phase, fired.length, fireNextL1]);

  useEffect(() => {
    clearTimer();
    if (phase !== "wait" && phase !== "partial") return;
    timerRef.current = setInterval(() => {
      setWaitLeft((s) => {
        if (s <= 1) {
          clearTimer();
          setPhase((p) => (p === "wait" || p === "partial" ? "partial" : p));
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return clearTimer;
  }, [phase, clearTimer]);

  // Auto-play scripted walkthrough
  useEffect(() => {
    if (!auto) return;
    if (phase === "idle") {
      setPhase("l1_fire");
      return;
    }
    if (phase === "wait" && fired.length === 1 && waitLeft === WINDOW_SEC - 3) {
      fireNextL1(); // second L1 arrives mid-window
      return;
    }
    if (phase === "wait" && fired.length === 2 && waitLeft <= 6) {
      setPhase("partial");
      return;
    }
    if (phase === "partial" && waitLeft === 0) {
      const t = setTimeout(() => setPhase("force"), 600);
      return () => clearTimeout(t);
    }
    if (phase === "force") {
      const t = setTimeout(() => setPhase("l2_ready"), 900);
      return () => clearTimeout(t);
    }
    if (phase === "l2_ready") {
      const t = setTimeout(() => {
        setPostIdx(0);
        setPhase("post_flow");
      }, 700);
      return () => clearTimeout(t);
    }
    if (phase === "post_flow" && postIdx >= 0 && postIdx < POST_L2_FLOW_STAGES.length - 1) {
      const t = setTimeout(() => setPostIdx((i) => i + 1), 900);
      return () => clearTimeout(t);
    }
    if (phase === "post_flow" && postIdx === POST_L2_FLOW_STAGES.length - 1) {
      const t = setTimeout(() => {
        setPhase("done");
        setAuto(false);
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [auto, phase, fired.length, waitLeft, postIdx, fireNextL1]);

  function startManual() {
    reset();
    setTimeout(() => setPhase("l1_fire"), 0);
  }

  function startAuto() {
    reset();
    setTimeout(() => {
      setAuto(true);
      setPhase("l1_fire");
    }, 0);
  }

  function onForce() {
    if (phase !== "wait" && phase !== "partial") return;
    clearTimer();
    setPhase("force");
    setTimeout(() => setPhase("l2_ready"), 500);
  }

  function onContinue() {
    if (phase !== "l2_ready" && phase !== "done") return;
    setPostIdx(0);
    setPhase("post_flow");
  }

  const progressPct =
    phase === "idle"
      ? 0
      : phase === "done"
        ? 100
        : phase === "post_flow"
          ? 70 + ((postIdx + 1) / POST_L2_FLOW_STAGES.length) * 30
          : phase === "l2_ready" || phase === "force"
            ? 65
            : phase === "partial"
              ? 45
              : phase === "wait"
                ? 20 + ((WINDOW_SEC - waitLeft) / WINDOW_SEC) * 20
                : 10;

  return (
    <section
      className="panel p-3 sm:p-4 mt-4 border-indigo-200 bg-gradient-to-br from-indigo-50/60 via-white to-teal-50/40"
      data-testid="home-l1-l2-demo"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-[family-name:var(--font-display)] text-lg flex items-center gap-2">
            <GitMerge className="h-5 w-5 text-indigo-700" aria-hidden />
            <EnZh en="L1 → L2 aggregation demo" zh="L1 → L2 指標聚合動態演示" />
          </h2>
          <p className="text-xs text-[var(--muted)] mt-1 max-w-3xl">
            <EnZh
              en="Watch L1 single-point monitors fire, wait inside the correlation window, RO force-aggregate L2 when L1 is incomplete, then continue RCA → Messenger → human gate."
              zh="觀看 L1 單點指標觸發、在關聯時間視窗內等待、L1 未齊時由 RO 強制聚合為 L2，再繼續 RCA → Messenger → 人工關卡。"
            />
          </p>
        </div>
        <div className="action-row shrink-0">
          <button
            type="button"
            className="btn btn-primary !min-h-9 text-xs"
            data-testid="home-l1-l2-auto"
            onClick={startAuto}
            disabled={auto}
          >
            <Play className="h-3.5 w-3.5" aria-hidden />
            <EnZh en="Play demo" zh="播放演示" />
          </button>
          <button
            type="button"
            className="btn !min-h-9 text-xs"
            data-testid="home-l1-l2-step"
            onClick={startManual}
            disabled={auto}
          >
            <EnZh en="Step from L1" zh="從 L1 逐步開始" />
          </button>
          <button
            type="button"
            className="btn !min-h-9 text-xs"
            data-testid="home-l1-l2-reset"
            onClick={reset}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            <EnZh en="Reset" zh="重設" />
          </button>
        </div>
      </div>

      <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden" aria-hidden>
        <div
          className="h-full bg-indigo-500 transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="mt-4 grid lg:grid-cols-[1.2fr_1fr] gap-3">
        {/* L1 lane */}
        <div className="rounded-xl border border-slate-200 bg-white/90 p-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge className="bg-teal-50 text-teal-900 border-teal-200">
              {zh ? L1_L2_LABELS.l1_zh : L1_L2_LABELS.l1_en}
            </Badge>
            {(phase === "wait" || phase === "partial") && (
              <span
                className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-900"
                data-testid="home-l1-l2-wait"
              >
                <Pause className="h-3.5 w-3.5" aria-hidden />
                {zh ? L1_L2_LABELS.wait_zh : L1_L2_LABELS.wait_en}: {waitLeft}s
              </span>
            )}
          </div>
          <ul className="space-y-2">
            {DEMO_L1.map((m, i) => {
              const on = fired.includes(m.id);
              const isMissing = missing.includes(m.id) && (phase === "force" || phase === "l2_ready" || phase === "post_flow" || phase === "done");
              return (
                <li
                  key={m.id}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-all duration-500 ${
                    on
                      ? "border-teal-400 bg-teal-50 shadow-sm scale-[1.01]"
                      : isMissing
                        ? "border-dashed border-orange-300 bg-orange-50/50 text-orange-900/80"
                        : "border-dashed border-slate-200 text-slate-400"
                  }`}
                  data-testid={`home-l1-chip-${m.id}`}
                  data-fired={on ? "1" : "0"}
                >
                  <span>
                    <span className="font-mono font-semibold">{m.id}</span>{" "}
                    <span className="text-xs">{zh ? m.zh : m.en}</span>
                  </span>
                  <span className="text-[11px] font-mono">
                    {on ? (
                      <EnZh
                        en={`fired · ${m.severity} · T+${m.t}m`}
                        zh={`已觸發 · ${m.severity} · T+${m.t}m`}
                      />
                    ) : isMissing ? (
                      <EnZh en={`missing · would be ${m.severity}`} zh={`缺失 · 本為 ${m.severity}`} />
                    ) : (
                      <EnZh en={`slot ${i + 1} · ${m.severity}`} zh={`槽位 ${i + 1} · ${m.severity}`} />
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
          {(phase === "wait" || phase === "partial") && !auto ? (
            <div className="flex flex-wrap gap-2">
              {missing.slice(0, 1).map((id) => (
                <button
                  key={id}
                  type="button"
                  className="btn !min-h-9 text-xs"
                  onClick={fireNextL1}
                  data-testid="home-l1-l2-inject"
                >
                  <EnZh en={`Fire next L1: ${id}`} zh={`觸發下一 L1：${id}`} />
                </button>
              ))}
              <button
                type="button"
                className="btn !min-h-9 text-xs border-orange-300 text-orange-950"
                onClick={onForce}
                data-testid="home-l1-l2-force"
              >
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                {zh ? L1_L2_LABELS.force_zh : L1_L2_LABELS.force_en}
              </button>
            </div>
          ) : null}
        </div>

        {/* L2 + post flow */}
        <div className="space-y-3">
          <div
            className={`rounded-xl border p-3 transition-all duration-500 ${
              phase === "l2_ready" || phase === "post_flow" || phase === "done" || phase === "force"
                ? "border-indigo-400 bg-indigo-50 shadow-sm"
                : "border-dashed border-slate-200 bg-slate-50/80"
            }`}
            data-testid="home-l2-pack"
            data-ready={
              phase === "l2_ready" || phase === "post_flow" || phase === "done" ? "1" : "0"
            }
          >
            <Badge className="bg-indigo-100 text-indigo-950 border-indigo-200">
              {zh ? L1_L2_LABELS.l2_zh : L1_L2_LABELS.l2_en}
            </Badge>
            <div className="mt-2 font-mono text-sm font-semibold">{L2_CODE}</div>
            <p className="text-xs text-indigo-950/80 mt-1">
              {phase === "force" ||
              ((phase === "l2_ready" || phase === "post_flow" || phase === "done") &&
                missing.length > 0) ? (
                <EnZh
                  en={`Force-aggregated · missing L1: ${missing.join(", ") || "—"}`}
                  zh={`已強制聚合 · 缺 L1：${missing.join("、") || "—"}`}
                />
              ) : phase === "l2_ready" || phase === "post_flow" || phase === "done" ? (
                <EnZh en="All required L1 in window — natural L2" zh="視窗內 L1 齊全 — 自然聚合 L2" />
              ) : (
                <EnZh
                  en="L2 forms after wait, full L1 set, or RO force-approve"
                  zh="等待、L1 齊全或 RO 強制核准後形成 L2"
                />
              )}
            </p>
            {l2SeverityCalc ? (
              <div
                className="mt-3 rounded-lg border border-indigo-200 bg-white/90 px-2.5 py-2 space-y-1.5"
                data-testid="home-l2-severity-calc"
              >
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-indigo-900">
                    <EnZh en="L2 severity calc" zh="L2 嚴重度計算" />
                  </span>
                  <span data-testid="home-l2-severity-final">
                    <Badge
                      className={
                        l2SeverityCalc.final === "CRITICAL"
                          ? "bg-rose-100 text-rose-950 border-rose-200"
                          : l2SeverityCalc.final === "BREACH"
                            ? "bg-orange-100 text-orange-950 border-orange-200"
                            : "bg-amber-100 text-amber-950 border-amber-200"
                      }
                    >
                      L2 = {l2SeverityCalc.final}
                      {l2SeverityCalc.upgraded ? (zh ? " · 已升檔" : " · upgraded") : ""}
                    </Badge>
                  </span>
                </div>
                <p className="text-[11px] font-mono text-indigo-950/90" data-testid="home-l2-severity-formula">
                  {zh ? l2SeverityCalc.formula_zh : l2SeverityCalc.formula_en}
                </p>
                <ol className="list-decimal pl-4 space-y-0.5 text-[11px] text-slate-700">
                  {(zh ? l2SeverityCalc.steps_zh : l2SeverityCalc.steps_en).map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <p className="text-[10px] text-[var(--muted)]">
                  <EnZh
                    en="Rule: L2 ≥ max(fired L1); severity weight can raise one band so the pack stays severe enough."
                    zh="規則：L2 ≥ max(已觸發 L1)；嚴重度權重最多升一檔，確保聚合包足夠嚴重。"
                  />
                </p>
              </div>
            ) : null}
            {(phase === "l2_ready" || phase === "done") && !auto ? (
              <button
                type="button"
                className="btn btn-primary !min-h-9 text-xs mt-3"
                onClick={onContinue}
                data-testid="home-l1-l2-continue"
              >
                {zh ? L1_L2_LABELS.continue_zh : L1_L2_LABELS.continue_en}
              </button>
            ) : null}
          </div>

          <ol className="grid grid-cols-2 gap-1.5" data-testid="home-l1-l2-post-flow">
            {POST_L2_FLOW_STAGES.map((s, i) => {
              const on = postIdx >= i;
              const current = phase === "post_flow" && postIdx === i;
              return (
                <li
                  key={s.id}
                  className={`rounded-lg border px-2 py-1.5 text-[11px] transition-all duration-300 ${
                    current
                      ? "border-teal-500 bg-white ring-1 ring-teal-200"
                      : on
                        ? "border-teal-200 bg-teal-50/80"
                        : "border-dashed border-slate-200 text-slate-400"
                  }`}
                >
                  <div className="font-mono text-[10px] opacity-70">{s.id}</div>
                  <div className="font-medium">{zh ? s.zh : s.en}</div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
        <span data-testid="home-l1-l2-phase">
          <EnZh en="Phase" zh="階段" />:{" "}
          <span className="font-mono text-slate-800">{phase}</span>
          {fired.length ? (
            <>
              {" · "}
              L1 {fired.length}/{DEMO_L1.length}
            </>
          ) : null}
        </span>
        <Link
          href="/admin/indicator-aggregation"
          className="text-indigo-800 font-semibold inline-flex items-center gap-0.5"
        >
          <EnZh en="Open full aggregation board" zh="開啟完整聚合流程台" />
        </Link>
      </div>
    </section>
  );
}
