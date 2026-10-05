"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Bell,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  GitBranch,
  LayoutDashboard,
  Pause,
  Play,
  Sparkles,
  Ticket,
  UserCheck,
} from "lucide-react";
import { EnZh } from "@/components/EnZh";
import { useUiLocale } from "@/hooks/useUiLocale";
import { cn } from "@/lib/utils";

export type SpineStepStat = {
  id: string;
  href: string;
  labelEn: string;
  labelZh: string;
  detailEn: string;
  detailZh: string;
  /** Primary count — prefer tickets / incidents over raw spine events */
  count: number;
  countLabelEn: string;
  countLabelZh: string;
  /** Optional secondary (e.g. spine events) */
  secondaryCount?: number;
  secondaryLabelEn?: string;
  secondaryLabelZh?: string;
  latestTitle?: string | null;
  latestAt?: string | null;
};

const ICONS = {
  DETECT: Activity,
  ALARM: Bell,
  AI_RCA: BrainCircuit,
  SKILL_EXECUTE: Sparkles,
  HUMAN_INTERVENTION: UserCheck,
  RESOLVED: CheckCircle2,
  DASHBOARD: LayoutDashboard,
  ticket: Ticket,
  escalate: GitBranch,
} as const;

type IconKey = keyof typeof ICONS;

function iconFor(id: string): IconKey {
  if (id in ICONS) return id as IconKey;
  return "DETECT";
}

export function HomeSpineViz({ steps }: { steps: SpineStepStat[] }) {
  const { locale } = useUiLocale();
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const step = steps[active] ?? steps[0];
  const Icon = ICONS[iconFor(step?.id || "DETECT")];

  useEffect(() => {
    if (!playing || steps.length < 2) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % steps.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, [playing, steps.length]);

  if (!steps.length || !step) return null;

  const cols = Math.min(steps.length, 7);

  return (
    <section
      className="panel relative mt-4 overflow-hidden p-3 sm:p-4"
      data-testid="home-spine-viz"
      aria-label={locale === "zh-Hant" ? "整合脊柱" : "Integration spine"}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(13,148,136,0.12),transparent_55%),linear-gradient(135deg,#f8fafc_0%,#ffffff_45%,#f0fdfa_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-teal-400/10 blur-2xl"
        aria-hidden
      />

      <div className="relative flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-[family-name:var(--font-display)] text-lg font-semibold">
            <EnZh en="Integration spine" zh="整合脊柱" />
          </div>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            <EnZh
              en="DETECT → ALARM → AI_RCA → SKILL → HUMAN → RESOLVED → DASHBOARD. Each stage badge shows live ticket / incident count. Spine Log tab removed — use Realtime Alerts & Risk Log."
              zh="DETECT → ALARM → AI_RCA → SKILL → HUMAN → RESOLVED → DASHBOARD。各階段徽章顯示即時工單／事件數。脊柱日誌分頁已移除 — 請用即時警報與風險日誌。"
            />
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn"
            onClick={() => setPlaying((p) => !p)}
            aria-pressed={playing}
            data-testid="home-spine-play"
          >
            {playing ? <Pause className="h-3.5 w-3.5" aria-hidden /> : <Play className="h-3.5 w-3.5" aria-hidden />}
            <EnZh en={playing ? "Pause tour" : "Play tour"} zh={playing ? "暫停導覽" : "播放導覽"} />
          </button>
        </div>
      </div>

      <div className="relative mt-5 hidden sm:block" data-testid="home-spine-desktop">
        <div className="absolute left-8 right-8 top-[22px] h-[3px] rounded-full bg-slate-200" aria-hidden>
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-500 via-teal-600 to-cyan-500 transition-all duration-700 ease-out"
            style={{ width: `${(active / Math.max(steps.length - 1, 1)) * 100}%` }}
          />
        </div>
        <ol
          className="relative grid gap-2"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {steps.map((s, i) => {
            const StepIcon = ICONS[iconFor(s.id)];
            const selected = active === i;
            const reached = i <= active;
            return (
              <li key={s.id} className="flex flex-col items-center text-center">
                <button
                  type="button"
                  onClick={() => {
                    setPlaying(false);
                    setActive(i);
                  }}
                  className={cn(
                    "relative z-[1] flex h-11 w-11 items-center justify-center rounded-full border-2 transition duration-300",
                    selected
                      ? "scale-110 border-teal-600 bg-teal-600 text-white shadow-[0_0_0_6px_rgba(13,148,136,0.18)]"
                      : reached
                        ? "border-teal-500 bg-white text-teal-700 hover:border-teal-600"
                        : "border-slate-200 bg-white text-slate-400 hover:border-teal-300 hover:text-teal-700"
                  )}
                  aria-current={selected ? "step" : undefined}
                  aria-label={`${s.labelEn}: ${s.count} ${s.countLabelEn}`}
                  data-testid={`home-spine-node-${s.id}`}
                  data-count={s.count}
                >
                  <StepIcon className="h-5 w-5" aria-hidden />
                  {selected ? (
                    <span className="absolute inset-0 animate-ping rounded-full bg-teal-400/30" aria-hidden />
                  ) : null}
                  <span
                    className={cn(
                      "absolute -right-1 -top-1 min-w-[1.35rem] rounded-full px-1 py-0.5 text-center text-[10px] font-bold tabular-nums leading-none shadow-sm",
                      s.count > 0
                        ? "bg-rose-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    )}
                    data-testid={`home-spine-count-${s.id}`}
                  >
                    {s.count}
                  </span>
                </button>
                <div className="mt-2 text-xs font-semibold">
                  <span className="text-[10px] text-[var(--muted)]">{i + 1}. </span>
                  <EnZh en={s.labelEn} zh={s.labelZh} />
                </div>
                <div
                  className={cn(
                    "mt-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                    selected ? "bg-teal-50 text-teal-900" : "text-[var(--muted)]"
                  )}
                  data-testid={`home-spine-label-${s.id}`}
                >
                  {s.count}
                  <span className="ml-1 font-normal">
                    <EnZh en={s.countLabelEn} zh={s.countLabelZh} />
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <ol className="relative mt-4 space-y-0 sm:hidden" data-testid="home-spine-mobile">
        <div className="absolute bottom-3 left-[15px] top-3 w-[2px] bg-slate-200" aria-hidden>
          <div
            className="w-full bg-teal-600 transition-all duration-700"
            style={{ height: `${(active / Math.max(steps.length - 1, 1)) * 100}%` }}
          />
        </div>
        {steps.map((s, i) => {
          const StepIcon = ICONS[iconFor(s.id)];
          const selected = active === i;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  setPlaying(false);
                  setActive(i);
                }}
                className={cn(
                  "relative flex w-full items-center gap-3 rounded-xl px-1 py-2.5 text-left transition",
                  selected ? "bg-white/80" : "hover:bg-white/50"
                )}
                data-testid={`home-spine-mnode-${s.id}`}
              >
                <span
                  className={cn(
                    "relative z-[1] inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                    selected
                      ? "border-teal-600 bg-teal-600 text-white"
                      : "border-slate-200 bg-white text-teal-700"
                  )}
                >
                  <StepIcon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="block text-sm font-semibold">
                      <EnZh en={s.labelEn} zh={s.labelZh} />
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                        s.count > 0 ? "bg-rose-600 text-white" : "bg-slate-200 text-slate-600"
                      )}
                      data-testid={`home-spine-mcount-${s.id}`}
                    >
                      {s.count}
                    </span>
                  </span>
                  <span className="block text-xs text-[var(--muted)]">
                    {s.count} <EnZh en={s.countLabelEn} zh={s.countLabelZh} />
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div
        key={step.id}
        className="relative mt-4 rounded-xl border border-teal-200/80 bg-white/90 p-3 sm:p-4 shadow-sm transition duration-300"
        data-testid="home-spine-detail"
      >
        <div className="flex flex-wrap items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">
                <span className="text-teal-700">{active + 1}.</span>{" "}
                <EnZh en={step.labelEn} zh={step.labelZh} />
              </h3>
              <span className="rounded-md bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-900 tabular-nums">
                {step.count} <EnZh en={step.countLabelEn} zh={step.countLabelZh} />
              </span>
              {step.secondaryCount != null ? (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700 tabular-nums">
                  {step.secondaryCount}{" "}
                  <EnZh en={step.secondaryLabelEn || "events"} zh={step.secondaryLabelZh || "事件"} />
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">
              <EnZh en={step.detailEn} zh={step.detailZh} />
            </p>
            {step.latestTitle ? (
              <p className="mt-2 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">
                  <EnZh en="Latest" zh="最新" />
                </span>
                {": "}
                {step.latestTitle}
                {step.latestAt ? <span className="text-[var(--muted)]"> · {step.latestAt}</span> : null}
              </p>
            ) : null}
          </div>
          <Link className="btn btn-primary shrink-0" href={step.href} data-testid="home-spine-open">
            <EnZh en="Open stage" zh="開啟此階段" />
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
