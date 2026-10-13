"use client";

import Link from "next/link";
import { useId, useMemo } from "react";
import { Badge, StatCard, StatusBadge } from "@/components/ui";
import { EnZh } from "@/components/EnZh";
import { MonitorCode } from "@/components/MonitorCode";
import { useUiLocale } from "@/hooks/useUiLocale";
import { cn } from "@/lib/utils";

type EvalData = {
  kpis: {
    analyses_total: number;
    skill_match_rate: number;
    skill_match_count?: number;
    rag_count?: number;
    avg_confidence: number;
    needs_human: number;
    human_agree_rate: number;
    feedback_correct_rate: number;
    feedback_total: number;
    challenged_count?: number;
    challenge_rate?: number;
    challenge_agree?: number;
    challenge_partial?: number;
    challenge_disagree?: number;
    challenge_agree_rate?: number;
    challenge_total?: number;
    improvements_total?: number;
    improvements_open?: number;
    improvements_satisfactory?: number;
    training_completed?: number;
    training_running?: number;
    training_queued?: number;
    training_avg_accuracy?: number;
    training_avg_f1?: number;
    severity_feedback_month?: number;
    severity_upgrades?: number;
    severity_downgrades?: number;
  };
  line_settings?: {
    line1_model: string;
    line2_model: string;
    second_opinion_severity: string;
  };
  accuracy_history: Array<{
    snapshot_date: string;
    skill_match_rate: number;
    human_agree_rate: number;
    feedback_correct_rate: number;
    analyses_total: number;
  }>;
  feedback_breakdown?: {
    total: number;
    correct: number;
    incorrect: number;
    partial: number;
  };
  recent_analyses: Array<{
    id: number;
    analysis_id: string;
    indicator_monitor_id: string;
    mode: string;
    confidence: number;
    status: string;
    needs_human: number;
    created_at: string;
    summary: string;
    latest_feedback: string | null;
  }>;
  recent_training: Array<{
    run_id: string;
    name: string;
    model_name: string;
    status: string;
    accuracy: number | null;
    precision_score: number | null;
    recall_score: number | null;
    f1_score: number | null;
    samples: number | null;
    completed_at: string | null;
    started_at: string | null;
  }>;
  recent_feedback: Array<{
    id: number;
    label: string;
    note: string | null;
    created_at: string;
    analysis_id: string;
    mode: string;
    confidence: number;
    indicator_monitor_id: string;
    rated_by_name: string | null;
  }>;
  severity_weight_pack?: {
    month_key: string;
    sample_count: number;
    upgrades: number;
    downgrades: number;
    same: number;
    p_histogram: Record<"P0" | "P1" | "P2" | "P3", number>;
    current_coefficients: Record<string, number>;
    suggested_coefficients: Record<string, number>;
    rationale_en: string;
    rationale_zh: string;
    applied: boolean;
  };
  recent_severity_feedback?: Array<{
    feedback_id: string;
    ai_severity: string;
    ai_p: number;
    recommended_p: number;
    recommended_ops: string;
    reason: string;
    rated_by_name: string | null;
    created_at: string;
  }>;
};

const COLORS = {
  good: "#15803d",
  goodBg: "#dcfce7",
  goodBorder: "#bbf7d0",
  warn: "#b45309",
  warnBg: "#fef3c7",
  warnBorder: "#fde68a",
  bad: "#b91c1c",
  badBg: "#fee2e2",
  badBorder: "#fecaca",
  muted: "#64748b",
  mutedBg: "#f1f5f9",
  skill: "#0f766e",
  human: "#1d4ed8",
  feedback: "#7c3aed",
} as const;

function pct(n: number) {
  return `${Math.round((n || 0) * 1000) / 10}%`;
}

function rateTone(rate: number): "good" | "warn" | "bad" | "muted" {
  if (!Number.isFinite(rate) || rate <= 0) return "muted";
  if (rate >= 0.7) return "good";
  if (rate >= 0.4) return "warn";
  return "bad";
}

function toneCardClass(tone: "good" | "warn" | "bad" | "muted" | "default") {
  switch (tone) {
    case "good":
      return "border-emerald-200 bg-emerald-50/50";
    case "warn":
      return "border-amber-200 bg-amber-50/50";
    case "bad":
      return "border-rose-200 bg-rose-50/50";
    case "muted":
      return "border-slate-200 bg-slate-50/40";
    default:
      return "";
  }
}

function toneValueClass(tone: "good" | "warn" | "bad" | "muted" | "default") {
  switch (tone) {
    case "good":
      return "text-emerald-800";
    case "warn":
      return "text-amber-800";
    case "bad":
      return "text-rose-800";
    default:
      return "";
  }
}

function feedbackLabelClass(label: string | null | undefined) {
  const u = (label || "").toUpperCase();
  if (u.includes("CORRECT") && !u.includes("INCORRECT")) {
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }
  if (u.includes("INCORRECT") || u.includes("WRONG") || u.includes("DISAGREE")) {
    return "bg-rose-100 text-rose-800 border-rose-200";
  }
  if (u.includes("PARTIAL") || u.includes("PART")) {
    return "bg-amber-100 text-amber-900 border-amber-200";
  }
  return "";
}

type Slice = { key: string; label: string; value: number; color: string; bg: string };

function DonutChart({
  title,
  slices,
  emptyLabel,
}: {
  title: string;
  slices: Slice[];
  emptyLabel: string;
}) {
  const gid = useId().replace(/:/g, "");
  const total = slices.reduce((a, s) => a + Math.max(0, s.value), 0);
  const size = 140;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  let offset = 0;
  const arcs = slices.map((s) => {
    const frac = total > 0 ? s.value / total : 0;
    const len = frac * c;
    const item = { ...s, dash: len, gap: c - len, offset };
    offset += len;
    return item;
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3" data-testid="ai-perf-donut">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-28 w-28 shrink-0" role="img" aria-label={title}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={COLORS.mutedBg} strokeWidth={stroke} />
        {total > 0
          ? arcs.map((a) =>
              a.value > 0 ? (
                <circle
                  key={a.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={a.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${a.dash} ${a.gap}`}
                  strokeDashoffset={-a.offset}
                  strokeLinecap="butt"
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
              ) : null
            )
          : null}
        <text
          x="50%"
          y="48%"
          textAnchor="middle"
          className="fill-[var(--ink)]"
          fontSize={18}
          fontWeight={600}
        >
          {total}
        </text>
        <text x="50%" y="62%" textAnchor="middle" className="fill-[var(--muted)]" fontSize={9}>
          {title}
        </text>
        <defs>
          <clipPath id={`${gid}-clip`}>
            <circle cx={size / 2} cy={size / 2} r={r - stroke / 2} />
          </clipPath>
        </defs>
      </svg>
      <ul className="w-full space-y-1.5 text-sm">
        {total === 0 ? (
          <li className="text-[var(--muted)] text-xs">{emptyLabel}</li>
        ) : (
          slices.map((s) => (
            <li
              key={s.key}
              className="flex items-center justify-between gap-2 rounded-md border px-2 py-1"
              style={{ background: s.bg, borderColor: `${s.color}33` }}
            >
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
                <span className="truncate">{s.label}</span>
              </span>
              <span className="font-semibold tabular-nums" style={{ color: s.color }}>
                {s.value}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function StackedBar({ slices }: { slices: Slice[] }) {
  const total = slices.reduce((a, s) => a + Math.max(0, s.value), 0) || 1;
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 flex" data-testid="ai-perf-stack">
      {slices.map((s) =>
        s.value > 0 ? (
          <div
            key={s.key}
            title={`${s.label}: ${s.value}`}
            style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
            className="h-full"
          />
        ) : null
      )}
    </div>
  );
}

function AccuracyHistoryChart({
  history,
  zh,
}: {
  history: EvalData["accuracy_history"];
  zh: boolean;
}) {
  const gid = useId().replace(/:/g, "");
  const width = 720;
  const height = 200;
  const pad = { top: 16, right: 12, bottom: 28, left: 40 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const series = useMemo(
    () => [
      { key: "skill_match_rate" as const, label: zh ? "技能" : "Skill", color: COLORS.skill },
      { key: "human_agree_rate" as const, label: zh ? "人工" : "Human", color: COLORS.human },
      {
        key: "feedback_correct_rate" as const,
        label: zh ? "回饋" : "Feedback",
        color: COLORS.feedback,
      },
    ],
    [zh]
  );

  const ordered = useMemo(
    () => [...history].sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date)),
    [history]
  );

  const { pointsByKey, xLabels } = useMemo(() => {
    const n = Math.max(ordered.length - 1, 1);
    const pointsByKey: Record<string, Array<{ x: number; y: number }>> = {};
    for (const s of series) {
      pointsByKey[s.key] = ordered.map((d, i) => {
        const v = Math.min(1, Math.max(0, d[s.key] || 0));
        return {
          x: pad.left + (i / n) * innerW,
          y: pad.top + innerH - v * innerH,
        };
      });
    }
    const step = ordered.length > 10 ? 2 : 1;
    const xLabels = ordered
      .map((d, i) => ({ i, date: d.snapshot_date }))
      .filter(({ i }) => i === 0 || i === ordered.length - 1 || i % step === 0)
      .map(({ i, date }) => ({
        x: pad.left + (i / n) * innerW,
        label: date.slice(5),
      }));
    return { pointsByKey, xLabels };
  }, [ordered, series, innerH, innerW, pad.left, pad.top]);

  function pathFor(points: Array<{ x: number; y: number }>) {
    if (!points.length) return "";
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const cx = (p0.x + p1.x) / 2;
      d += ` C ${cx.toFixed(1)} ${p0.y.toFixed(1)}, ${cx.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }
    return d;
  }

  if (!ordered.length) {
    return (
      <p className="text-sm text-[var(--muted)]">
        <EnZh en="No accuracy snapshots yet." zh="尚無準確率快照。" />
      </p>
    );
  }

  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="space-y-2" data-testid="ai-perf-history-chart">
      <div className="flex flex-wrap gap-3 text-xs text-[var(--muted)]">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[480px] h-auto"
          role="img"
          aria-label={zh ? "14 日準確率趨勢" : "14-day accuracy trend"}
        >
          {yTicks.map((p) => {
            const y = pad.top + innerH * (1 - p);
            return (
              <g key={p}>
                <line
                  x1={pad.left}
                  x2={width - pad.right}
                  y1={y}
                  y2={y}
                  stroke="var(--line)"
                  strokeWidth={1}
                />
                <text x={pad.left - 6} y={y + 3} textAnchor="end" className="fill-[var(--muted)]" fontSize={10}>
                  {Math.round(p * 100)}%
                </text>
              </g>
            );
          })}
          {series.map((s, idx) => {
            const pts = pointsByKey[s.key] || [];
            const gradId = `${gid}-g${idx}`;
            return (
              <g key={s.key}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={s.color} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                {idx === 0 && pts.length ? (
                  <path
                    d={`${pathFor(pts)} L ${pts[pts.length - 1].x.toFixed(1)} ${(pad.top + innerH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(pad.top + innerH).toFixed(1)} Z`}
                    fill={`url(#${gradId})`}
                    stroke="none"
                  />
                ) : null}
                <path d={pathFor(pts)} fill="none" stroke={s.color} strokeWidth={2.25} strokeLinejoin="round" />
                {pts.map((pt, i) => (
                  <circle key={`${s.key}-${i}`} cx={pt.x} cy={pt.y} r={2.5} fill={s.color} />
                ))}
              </g>
            );
          })}
          {xLabels.map((l) => (
            <text
              key={`${l.label}-${l.x}`}
              x={l.x}
              y={height - 8}
              textAnchor="middle"
              className="fill-[var(--muted)]"
              fontSize={10}
            >
              {l.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

function RateStat({
  label,
  value,
  hint,
  rate,
}: {
  label: string;
  value: string | number;
  hint?: string;
  rate?: number;
}) {
  const tone = rate == null ? "default" : rateTone(rate);
  return (
    <div className={cn("panel p-4", toneCardClass(tone))}>
      <div className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">{label}</div>
      <div className={cn("mt-2 text-2xl font-semibold tabular-nums", toneValueClass(tone))}>{value}</div>
      {hint ? <div className="mt-1 text-xs text-[var(--muted)]">{hint}</div> : null}
    </div>
  );
}

function CountStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "good" | "warn" | "bad" | "muted" | "default";
}) {
  return (
    <div className={cn("rounded-lg border px-2 py-2 text-center", toneCardClass(tone))}>
      <div className="text-[11px] text-[var(--muted)]">{label}</div>
      <div className={cn("text-xl font-semibold tabular-nums", toneValueClass(tone))}>{value}</div>
    </div>
  );
}

export function AiPerformanceBoard({ initial }: { initial: EvalData }) {
  const { locale } = useUiLocale();
  const zh = locale === "zh-Hant";
  const k = initial.kpis;
  const fb = initial.feedback_breakdown;

  const challengerSlices: Slice[] = [
    {
      key: "agree",
      label: zh ? "同意" : "Agree",
      value: k.challenge_agree ?? 0,
      color: COLORS.good,
      bg: COLORS.goodBg,
    },
    {
      key: "partial",
      label: zh ? "部分" : "Partial",
      value: k.challenge_partial ?? 0,
      color: COLORS.warn,
      bg: COLORS.warnBg,
    },
    {
      key: "disagree",
      label: zh ? "不同意" : "Disagree",
      value: k.challenge_disagree ?? 0,
      color: COLORS.bad,
      bg: COLORS.badBg,
    },
  ];

  const feedbackSlices: Slice[] = [
    {
      key: "correct",
      label: zh ? "正確" : "Correct",
      value: fb?.correct ?? 0,
      color: COLORS.good,
      bg: COLORS.goodBg,
    },
    {
      key: "partial",
      label: zh ? "部分" : "Partial",
      value: fb?.partial ?? 0,
      color: COLORS.warn,
      bg: COLORS.warnBg,
    },
    {
      key: "incorrect",
      label: zh ? "不正確" : "Incorrect",
      value: fb?.incorrect ?? 0,
      color: COLORS.bad,
      bg: COLORS.badBg,
    },
  ];

  const improveSlices: Slice[] = [
    {
      key: "satisfied",
      label: zh ? "滿意" : "Satisfied",
      value: k.improvements_satisfactory ?? 0,
      color: COLORS.good,
      bg: COLORS.goodBg,
    },
    {
      key: "open",
      label: zh ? "開放" : "Open",
      value: k.improvements_open ?? 0,
      color: COLORS.warn,
      bg: COLORS.warnBg,
    },
    {
      key: "other",
      label: zh ? "其他" : "Other",
      value: Math.max(
        0,
        (k.improvements_total ?? 0) - (k.improvements_satisfactory ?? 0) - (k.improvements_open ?? 0)
      ),
      color: COLORS.muted,
      bg: COLORS.mutedBg,
    },
  ];

  const modeSlices: Slice[] = [
    {
      key: "skill",
      label: zh ? "技能" : "Skill",
      value: k.skill_match_count ?? 0,
      color: COLORS.skill,
      bg: "#ccfbf1",
    },
    {
      key: "rag",
      label: "RAG",
      value: k.rag_count ?? 0,
      color: COLORS.feedback,
      bg: "#ede9fe",
    },
  ];

  return (
    <div className="space-y-4" data-testid="ai-performance-board">
      <div className="panel p-4 space-y-2">
        <p className="font-semibold">
          <EnZh
            en="AI performance evaluation — skill match, challenger agreement, human feedback, training quality"
            zh="AI 績效評估 — 技能匹配、挑戰者一致率、人工回饋、訓練品質"
          />
        </p>
        <p className="text-sm text-[var(--muted)]">
          <EnZh
            en="Read-only health board. Queue training or rate analyses in AI Admin (maker≠checker)."
            zh="唯讀健康看板。排隊訓練或評分分析請至 AI 管理（Maker≠Checker）。"
          />
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge>L1: {initial.line_settings?.line1_model || "—"}</Badge>
          <Badge>L2: {initial.line_settings?.line2_model || "—"}</Badge>
          <Badge>
            <EnZh en="2nd AI from" zh="第二意見來自" />{" "}
            {initial.line_settings?.second_opinion_severity || "BREACH"}
          </Badge>
          <Link className="btn btn-primary" href="/admin/ai-admin">
            <EnZh en="Open AI Admin" zh="開啟 AI 管理" />
          </Link>
          <Link className="btn" href="/admin/alerts">
            <EnZh en="Realtime Alert & Tracker" zh="即時警報與追蹤" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="ai-perf-kpis">
        <div className="panel p-4 space-y-2">
          <div className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
            {zh ? "分析總數" : "Analyses"}
          </div>
          <div className="text-2xl font-semibold tabular-nums">{k.analyses_total}</div>
          <StackedBar slices={modeSlices} />
          <div className="text-xs text-[var(--muted)]">
            {zh
              ? `技能 ${k.skill_match_count ?? 0} · RAG ${k.rag_count ?? 0}`
              : `Skill ${k.skill_match_count ?? 0} · RAG ${k.rag_count ?? 0}`}
          </div>
        </div>
        <RateStat
          label={zh ? "技能匹配率" : "Skill match rate"}
          value={pct(k.skill_match_rate)}
          hint={zh ? "SKILL_MATCH / 全部" : "SKILL_MATCH / all"}
          rate={k.skill_match_rate}
        />
        <RateStat label={zh ? "平均信心" : "Avg confidence"} value={pct(k.avg_confidence)} rate={k.avg_confidence} />
        <StatCard label={zh ? "需人工" : "Needs human"} value={k.needs_human} />
        <RateStat
          label={zh ? "挑戰率" : "Challenge rate"}
          value={pct(k.challenge_rate ?? 0)}
          hint={zh ? `${k.challenged_count ?? 0} 筆已挑戰` : `${k.challenged_count ?? 0} challenged`}
          rate={k.challenge_rate ?? 0}
        />
        <RateStat
          label={zh ? "挑戰者一致率" : "Challenger agree rate"}
          value={pct(k.challenge_agree_rate ?? 0)}
          hint={`${k.challenge_agree ?? 0} / ${k.challenge_total ?? 0}`}
          rate={k.challenge_agree_rate ?? 0}
        />
        <RateStat
          label={zh ? "回饋準確率" : "Feedback accuracy"}
          value={pct(k.feedback_correct_rate)}
          hint={zh ? `${k.feedback_total} 則評分` : `${k.feedback_total} ratings`}
          rate={k.feedback_correct_rate}
        />
        <RateStat
          label={zh ? "人工同意率" : "Human agree rate"}
          value={pct(k.human_agree_rate)}
          hint={zh ? "干預核准／已決策" : "Interventions approved / decided"}
          rate={k.human_agree_rate}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-3">
        <section className="panel p-4 space-y-3" data-testid="ai-perf-challenger">
          <h2 className="font-semibold">
            <EnZh en="Second AI (challenger)" zh="第二 AI（挑戰者）" />
          </h2>
          <StackedBar slices={challengerSlices} />
          <div className="grid grid-cols-3 gap-2">
            <CountStat label={zh ? "同意" : "Agree"} value={k.challenge_agree ?? 0} tone="good" />
            <CountStat label={zh ? "部分" : "Partial"} value={k.challenge_partial ?? 0} tone="warn" />
            <CountStat label={zh ? "不同意" : "Disagree"} value={k.challenge_disagree ?? 0} tone="bad" />
          </div>
          <DonutChart
            title={zh ? "挑戰" : "Challenge"}
            slices={challengerSlices}
            emptyLabel={zh ? "尚無挑戰結果" : "No challenger results yet"}
          />
        </section>

        <section className="panel p-4 space-y-3" data-testid="ai-perf-feedback">
          <h2 className="font-semibold">
            <EnZh en="Human feedback labels" zh="人工回饋標籤" />
          </h2>
          <StackedBar slices={feedbackSlices} />
          <div className="grid grid-cols-3 gap-2">
            <CountStat label={zh ? "正確" : "Correct"} value={fb?.correct ?? 0} tone="good" />
            <CountStat label={zh ? "部分" : "Partial"} value={fb?.partial ?? 0} tone="warn" />
            <CountStat label={zh ? "不正確" : "Incorrect"} value={fb?.incorrect ?? 0} tone="bad" />
          </div>
          <DonutChart
            title={zh ? "回饋" : "Feedback"}
            slices={feedbackSlices}
            emptyLabel={zh ? "尚無人工評分" : "No human ratings yet"}
          />
        </section>

        <section className="panel p-4 space-y-3" data-testid="ai-perf-improve">
          <h2 className="font-semibold">
            <EnZh en="How-to-improve reviews" zh="如何改進審查" />
          </h2>
          <StackedBar slices={improveSlices} />
          <div className="grid grid-cols-3 gap-2">
            <CountStat label={zh ? "總數" : "Total"} value={k.improvements_total ?? 0} tone="default" />
            <CountStat label={zh ? "開放" : "Open"} value={k.improvements_open ?? 0} tone="warn" />
            <CountStat label={zh ? "滿意" : "Satisfied"} value={k.improvements_satisfactory ?? 0} tone="good" />
          </div>
          <DonutChart
            title={zh ? "改進" : "Improve"}
            slices={improveSlices}
            emptyLabel={zh ? "尚無改進審查" : "No improvement reviews yet"}
          />
        </section>
      </div>

      <section className="panel p-4 space-y-3" data-testid="ai-perf-severity-weights">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-semibold">
              <EnZh
                en="P0–P3 severity re-recommendations → monthly factor weights"
                zh="P0–P3 嚴重度重推薦 → 每月因子權重"
              />
            </h2>
            <p className="text-sm text-[var(--muted)] mt-1 max-w-3xl">
              {zh
                ? initial.severity_weight_pack?.rationale_zh ||
                  "Lark AI 事故報告上的嚴重度回饋，每月整合為升級路徑係數建議。"
                : initial.severity_weight_pack?.rationale_en ||
                  "Severity feedback on Lark AI incident reports aggregates monthly into escalation coefficient suggestions."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge>
              <EnZh en="Month samples" zh="本月樣本" /> {k.severity_feedback_month ?? 0}
            </Badge>
            <Badge className="bg-rose-50 border-rose-200 text-rose-900">
              <EnZh en="Upgrades" zh="升級" /> {k.severity_upgrades ?? 0}
            </Badge>
            <Badge className="bg-slate-50">
              <EnZh en="Downgrades" zh="降級" /> {k.severity_downgrades ?? 0}
            </Badge>
            <Link className="btn !min-h-9 text-xs" href="/admin/escalation">
              <EnZh en="Open Escalation pack" zh="開啟升級權重組合" />
            </Link>
            <Link className="btn !min-h-9 text-xs" href="/admin/messenger">
              <EnZh en="Messenger AI report" zh="Messenger AI 報告" />
            </Link>
          </div>
        </div>
        {initial.severity_weight_pack ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
            {(
              [
                ["severity", zh ? "嚴重度" : "Severity"],
                ["involved_teams", zh ? "涉入團隊" : "Involved teams"],
                ["risk_scenario", zh ? "風險情境" : "Risk scenario"],
                ["pending_time", zh ? "待處理時間" : "Pending time"],
                ["need_human_intervention", zh ? "需人工" : "Need human"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="rounded-lg border border-[var(--line)] bg-slate-50/80 px-3 py-2">
                <div className="text-[var(--muted)]">{label}</div>
                <div className="mt-1 font-mono tabular-nums">
                  {Number(initial.severity_weight_pack?.current_coefficients[key] ?? 1).toFixed(2)}
                  {" → "}
                  <span className="font-semibold text-teal-900">
                    {Number(initial.severity_weight_pack?.suggested_coefficients[key] ?? 1).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <ul className="space-y-1.5 text-xs max-h-36 overflow-auto">
          {(initial.recent_severity_feedback || []).map((f) => (
            <li
              key={f.feedback_id}
              className="rounded-md border border-[var(--line)] bg-white px-2 py-1.5 flex flex-wrap gap-2"
            >
              <span className="font-mono shrink-0">
                P{f.ai_p}→P{f.recommended_p}
              </span>
              <span className="text-[var(--muted)] shrink-0">{f.rated_by_name || "—"}</span>
              <span className="min-w-0 flex-1 line-clamp-2 text-slate-700">{f.reason}</span>
            </li>
          ))}
          {!initial.recent_severity_feedback?.length ? (
            <li className="text-[var(--muted)]">
              <EnZh en="No severity re-recommendations this month yet." zh="本月尚無嚴重度重推薦。" />
            </li>
          ) : null}
        </ul>
      </section>

      <section className="panel p-4 space-y-3" data-testid="ai-perf-training">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">
            <EnZh en="Training quality" zh="訓練品質" />
          </h2>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
              <EnZh en="Completed" zh="已完成" /> {k.training_completed ?? 0}
            </Badge>
            <Badge className="bg-sky-100 text-sky-800 border-sky-200">
              <EnZh en="Running" zh="執行中" /> {k.training_running ?? 0}
            </Badge>
            <Badge className="bg-slate-100 text-slate-700 border-slate-200">
              <EnZh en="Queued" zh="佇列" /> {k.training_queued ?? 0}
            </Badge>
            <Badge>
              <EnZh en="Avg accuracy" zh="平均準確率" /> {pct(k.training_avg_accuracy ?? 0)}
            </Badge>
            <Badge>
              <EnZh en="Avg F1" zh="平均 F1" /> {pct(k.training_avg_f1 ?? 0)}
            </Badge>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--muted)]">
                <th className="py-2 pr-3">{zh ? "執行" : "Run"}</th>
                <th className="py-2 pr-3">{zh ? "模型" : "Model"}</th>
                <th className="py-2 pr-3">{zh ? "狀態" : "Status"}</th>
                <th className="py-2 pr-3">{zh ? "準確率" : "Accuracy"}</th>
                <th className="py-2 pr-3">P / R / F1</th>
                <th className="py-2">{zh ? "樣本" : "Samples"}</th>
              </tr>
            </thead>
            <tbody>
              {initial.recent_training.map((tr) => {
                const accTone = tr.accuracy == null ? "muted" : rateTone(tr.accuracy);
                return (
                  <tr key={tr.run_id} className="border-t border-[var(--line)]">
                    <td className="py-2 pr-3">
                      <div className="font-medium">{tr.name}</div>
                      <div className="font-mono text-[11px] text-[var(--muted)]">{tr.run_id}</div>
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs">{tr.model_name}</td>
                    <td className="py-2 pr-3">
                      <StatusBadge value={tr.status} />
                    </td>
                    <td className={cn("py-2 pr-3 tabular-nums font-semibold", toneValueClass(accTone))}>
                      {tr.accuracy != null ? pct(tr.accuracy) : "—"}
                    </td>
                    <td className="py-2 pr-3 tabular-nums text-xs">
                      {tr.precision_score != null ? pct(tr.precision_score) : "—"} /{" "}
                      {tr.recall_score != null ? pct(tr.recall_score) : "—"} /{" "}
                      {tr.f1_score != null ? pct(tr.f1_score) : "—"}
                    </td>
                    <td className="py-2 tabular-nums">{tr.samples ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel p-4 space-y-3" data-testid="ai-perf-history">
        <h2 className="font-semibold">
          <EnZh en="14-day accuracy snapshots" zh="14 日準確率快照" />
        </h2>
        <AccuracyHistoryChart history={initial.accuracy_history} zh={zh} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {initial.accuracy_history.slice(0, 8).map((h) => (
            <div key={h.snapshot_date} className="rounded-lg border border-[var(--line)] p-3 text-sm">
              <div className="font-mono text-xs text-[var(--muted)]">{h.snapshot_date}</div>
              <div className="mt-1 grid grid-cols-3 gap-1 text-xs">
                <div>
                  <div className="text-[var(--muted)]">{zh ? "技能" : "Skill"}</div>
                  <div className={cn("font-semibold tabular-nums", toneValueClass(rateTone(h.skill_match_rate)))}>
                    {pct(h.skill_match_rate)}
                  </div>
                </div>
                <div>
                  <div className="text-[var(--muted)]">{zh ? "人工" : "Human"}</div>
                  <div className={cn("font-semibold tabular-nums", toneValueClass(rateTone(h.human_agree_rate)))}>
                    {pct(h.human_agree_rate)}
                  </div>
                </div>
                <div>
                  <div className="text-[var(--muted)]">{zh ? "回饋" : "Feedback"}</div>
                  <div
                    className={cn("font-semibold tabular-nums", toneValueClass(rateTone(h.feedback_correct_rate)))}
                  >
                    {pct(h.feedback_correct_rate)}
                  </div>
                </div>
              </div>
              <div className="mt-1 text-[11px] text-[var(--muted)]">n={h.analyses_total}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-3">
        <section className="panel p-4 space-y-3" data-testid="ai-perf-recent-analyses">
          <h2 className="font-semibold">
            <EnZh en="Recent analyses" zh="最近分析" />
          </h2>
          <ul className="space-y-2 text-sm">
            {initial.recent_analyses.slice(0, 8).map((a) => (
              <li key={a.id} className="rounded-lg border border-[var(--line)] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Link className="font-mono text-xs underline" href={`/admin/ai-analyses/${a.id}`}>
                    {a.analysis_id}
                  </Link>
                  <Badge>{a.mode}</Badge>
                  <StatusBadge value={a.status} />
                  {a.latest_feedback ? (
                    <Badge className={feedbackLabelClass(a.latest_feedback)}>{a.latest_feedback}</Badge>
                  ) : null}
                </div>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                  <MonitorCode id={a.indicator_monitor_id} />
                  <span className="tabular-nums">{pct(a.confidence)}</span>
                  <span>{a.created_at}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-[var(--muted)]">{a.summary}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel p-4 space-y-3" data-testid="ai-perf-recent-feedback">
          <h2 className="font-semibold">
            <EnZh en="Recent feedback ratings" zh="最近回饋評分" />
          </h2>
          <ul className="space-y-2 text-sm">
            {initial.recent_feedback.length === 0 ? (
              <li className="text-[var(--muted)]">
                <EnZh
                  en="No human ratings yet — rate from AI Admin History."
                  zh="尚無人工評分 — 請在 AI 管理「歷史與準確率」評分。"
                />
              </li>
            ) : (
              initial.recent_feedback.map((f) => (
                <li key={f.id} className="rounded-lg border border-[var(--line)] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={feedbackLabelClass(f.label)}>{f.label}</Badge>
                    <span className="font-mono text-xs">{f.analysis_id}</span>
                    <Badge>{f.mode}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    {f.rated_by_name || "—"} · {f.created_at} · <MonitorCode id={f.indicator_monitor_id} />
                  </div>
                  {f.note ? <p className="mt-1 text-[var(--muted)]">{f.note}</p> : null}
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
