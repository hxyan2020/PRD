"use client";

import Link from "next/link";
import { Badge, StatCard, StatusBadge } from "@/components/ui";
import { EnZh } from "@/components/EnZh";
import { MonitorCode } from "@/components/MonitorCode";
import { useUiLocale } from "@/hooks/useUiLocale";

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
};

function pct(n: number) {
  return `${Math.round((n || 0) * 1000) / 10}%`;
}

export function AiPerformanceBoard({ initial }: { initial: EvalData }) {
  const { locale } = useUiLocale();
  const zh = locale === "zh-Hant";
  const k = initial.kpis;
  const fb = initial.feedback_breakdown;

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
          <Badge>
            L1: {initial.line_settings?.line1_model || "—"}
          </Badge>
          <Badge>
            L2: {initial.line_settings?.line2_model || "—"}
          </Badge>
          <Badge>
            <EnZh en="2nd AI from" zh="第二意見自" />{" "}
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
        <StatCard
          label={zh ? "分析總數" : "Analyses"}
          value={k.analyses_total}
          hint={zh ? `技能 ${k.skill_match_count ?? 0} · RAG ${k.rag_count ?? 0}` : `Skill ${k.skill_match_count ?? 0} · RAG ${k.rag_count ?? 0}`}
        />
        <StatCard
          label={zh ? "技能匹配率" : "Skill match rate"}
          value={pct(k.skill_match_rate)}
          hint={zh ? "SKILL_MATCH / 全部" : "SKILL_MATCH / all"}
        />
        <StatCard
          label={zh ? "平均信心" : "Avg confidence"}
          value={pct(k.avg_confidence)}
        />
        <StatCard
          label={zh ? "需人工" : "Needs human"}
          value={k.needs_human}
        />
        <StatCard
          label={zh ? "挑戰率" : "Challenge rate"}
          value={pct(k.challenge_rate ?? 0)}
          hint={zh ? `${k.challenged_count ?? 0} 筆已挑戰` : `${k.challenged_count ?? 0} challenged`}
        />
        <StatCard
          label={zh ? "挑戰者一致率" : "Challenger agree rate"}
          value={pct(k.challenge_agree_rate ?? 0)}
          hint={`${k.challenge_agree ?? 0} / ${k.challenge_total ?? 0}`}
        />
        <StatCard
          label={zh ? "回饋準確率" : "Feedback accuracy"}
          value={pct(k.feedback_correct_rate)}
          hint={zh ? `${k.feedback_total} 則評分` : `${k.feedback_total} ratings`}
        />
        <StatCard
          label={zh ? "人工同意率" : "Human agree rate"}
          value={pct(k.human_agree_rate)}
          hint={zh ? "干預核准／已決策" : "Interventions approved / decided"}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-3">
        <section className="panel p-4 space-y-3" data-testid="ai-perf-challenger">
          <h2 className="font-semibold">
            <EnZh en="Second AI (challenger)" zh="第二 AI（挑戰者）" />
          </h2>
          <div className="grid grid-cols-3 gap-2">
            <StatCard label={zh ? "同意" : "Agree"} value={k.challenge_agree ?? 0} />
            <StatCard label={zh ? "部分" : "Partial"} value={k.challenge_partial ?? 0} />
            <StatCard label={zh ? "不同意" : "Disagree"} value={k.challenge_disagree ?? 0} />
          </div>
        </section>

        <section className="panel p-4 space-y-3" data-testid="ai-perf-feedback">
          <h2 className="font-semibold">
            <EnZh en="Human feedback labels" zh="人工回饋標籤" />
          </h2>
          <div className="grid grid-cols-3 gap-2">
            <StatCard label={zh ? "正確" : "Correct"} value={fb?.correct ?? 0} />
            <StatCard label={zh ? "部分" : "Partial"} value={fb?.partial ?? 0} />
            <StatCard label={zh ? "不正確" : "Incorrect"} value={fb?.incorrect ?? 0} />
          </div>
        </section>

        <section className="panel p-4 space-y-3" data-testid="ai-perf-improve">
          <h2 className="font-semibold">
            <EnZh en="How-to-improve reviews" zh="如何改進審查" />
          </h2>
          <div className="grid grid-cols-3 gap-2">
            <StatCard label={zh ? "總數" : "Total"} value={k.improvements_total ?? 0} />
            <StatCard label={zh ? "開放" : "Open"} value={k.improvements_open ?? 0} />
            <StatCard label={zh ? "滿意" : "Satisfied"} value={k.improvements_satisfactory ?? 0} />
          </div>
        </section>
      </div>

      <section className="panel p-4 space-y-3" data-testid="ai-perf-training">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">
            <EnZh en="Training quality" zh="訓練品質" />
          </h2>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge>
              <EnZh en="Completed" zh="已完成" /> {k.training_completed ?? 0}
            </Badge>
            <Badge>
              <EnZh en="Running" zh="執行中" /> {k.training_running ?? 0}
            </Badge>
            <Badge>
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
              {initial.recent_training.map((tr) => (
                <tr key={tr.run_id} className="border-t border-[var(--line)]">
                  <td className="py-2 pr-3">
                    <div className="font-medium">{tr.name}</div>
                    <div className="font-mono text-[11px] text-[var(--muted)]">{tr.run_id}</div>
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs">{tr.model_name}</td>
                  <td className="py-2 pr-3">
                    <StatusBadge value={tr.status} />
                  </td>
                  <td className="py-2 pr-3 tabular-nums">
                    {tr.accuracy != null ? pct(tr.accuracy) : "—"}
                  </td>
                  <td className="py-2 pr-3 tabular-nums text-xs">
                    {tr.precision_score != null ? pct(tr.precision_score) : "—"} /{" "}
                    {tr.recall_score != null ? pct(tr.recall_score) : "—"} /{" "}
                    {tr.f1_score != null ? pct(tr.f1_score) : "—"}
                  </td>
                  <td className="py-2 tabular-nums">{tr.samples ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel p-4 space-y-3" data-testid="ai-perf-history">
        <h2 className="font-semibold">
          <EnZh en="14-day accuracy snapshots" zh="14 日準確率快照" />
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {initial.accuracy_history.slice(0, 8).map((h) => (
            <div key={h.snapshot_date} className="rounded-lg border border-[var(--line)] p-3 text-sm">
              <div className="font-mono text-xs text-[var(--muted)]">{h.snapshot_date}</div>
              <div className="mt-1 grid grid-cols-3 gap-1 text-xs">
                <div>
                  <div className="text-[var(--muted)]">{zh ? "技能" : "Skill"}</div>
                  <div className="font-semibold tabular-nums">{pct(h.skill_match_rate)}</div>
                </div>
                <div>
                  <div className="text-[var(--muted)]">{zh ? "人工" : "Human"}</div>
                  <div className="font-semibold tabular-nums">{pct(h.human_agree_rate)}</div>
                </div>
                <div>
                  <div className="text-[var(--muted)]">{zh ? "回饋" : "Feedback"}</div>
                  <div className="font-semibold tabular-nums">{pct(h.feedback_correct_rate)}</div>
                </div>
              </div>
              <div className="mt-1 text-[11px] text-[var(--muted)]">
                n={h.analyses_total}
              </div>
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
                  {a.latest_feedback ? <Badge>{a.latest_feedback}</Badge> : null}
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
                <EnZh en="No human ratings yet — rate from AI Admin History." zh="尚無人工評分 — 請在 AI 管理「歷史與準確率」評分。" />
              </li>
            ) : (
              initial.recent_feedback.map((f) => (
                <li key={f.id} className="rounded-lg border border-[var(--line)] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{f.label}</Badge>
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
