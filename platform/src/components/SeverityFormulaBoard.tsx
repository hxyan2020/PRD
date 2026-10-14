"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui";
import { EnZh } from "@/components/EnZh";
import { Phrase } from "@/components/Phrase";
import { useUiLocale } from "@/hooks/useUiLocale";
import { phrase } from "@/lib/i18n";
import type {
  SeverityFormula,
  WeeklyFormulaSuggestion,
} from "@/lib/severity-formula";
import {
  DEMO_ALERT_OBSERVATIONS,
  SEVERITY_REASON_CODES,
  scoreSeverityFormula,
} from "@/lib/severity-formula";

type FeedbackLite = {
  feedback_id: string;
  ai_p: number;
  recommended_p: number;
  reason: string;
  reason_codes_json?: string | null;
  rated_by_name: string | null;
  week_key?: string | null;
};

export function SeverityFormulaBoard({
  liveFormula,
  weekly,
  recentFeedback,
  canPropose,
  canApprove,
}: {
  liveFormula: SeverityFormula;
  weekly: WeeklyFormulaSuggestion;
  recentFeedback: FeedbackLite[];
  canPropose: boolean;
  canApprove: boolean;
}) {
  const router = useRouter();
  const { locale } = useUiLocale();
  const zh = locale === "zh-Hant";
  const [pack, setPack] = useState(weekly);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const demo = useMemo(() => scoreSeverityFormula(liveFormula, DEMO_ALERT_OBSERVATIONS), [liveFormula]);
  const suggestedDemo = useMemo(
    () => scoreSeverityFormula(pack.suggested, DEMO_ALERT_OBSERVATIONS),
    [pack.suggested]
  );

  async function proposeWeekly() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/escalation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "propose_severity_formula", week: pack.week_key }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Propose failed");
      setPack(data.suggestion);
      setMsg(zh ? "已提交每週公式變更申請，待風險負責人核准" : "Weekly formula CR submitted — awaiting Risk Owner approval");
      router.refresh();
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      setMsg(phrase(raw, zh ? "zh-Hant" : "en") || raw);
    } finally {
      setBusy(false);
    }
  }

  async function decide(decision: "APPROVED" | "REJECTED") {
    if (!pack.pending_cr_id) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/ai-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "decide",
          id: pack.pending_cr_id,
          decision,
          note:
            decision === "APPROVED"
              ? zh
                ? "RO 核准每週嚴重度公式"
                : "RO approved weekly severity formula"
              : zh
                ? "RO 駁回每週嚴重度公式"
                : "RO rejected weekly severity formula",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Decide failed");
      setMsg(
        decision === "APPROVED"
          ? zh
            ? "已核准並套用新嚴重度公式"
            : "Approved — new severity formula is live"
          : zh
            ? "已駁回公式建議"
            : "Rejected formula suggestion"
      );
      router.refresh();
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      setMsg(phrase(raw, zh ? "zh-Hant" : "en") || raw);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel p-4 border-indigo-200 bg-indigo-50/30 space-y-4" data-testid="sev-formula-loop">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-[0.12em] text-indigo-900">
            <EnZh
              en="Severity formula optimisation loop (P0–P3)"
              zh="嚴重度公式優化迴路（P0–P3）"
            />
          </div>
          <p className="text-sm mt-1 text-indigo-950 max-w-3xl">
            <EnZh
              en="Alert → formula assigns P → 24/7 ops corrects on AI incident with reason codes → AI weekly formula recommend → Risk Owner approve."
              zh="警報 → 公式分到 P → 24/7 值班在 AI 事故上勾選原因並更正 → AI 每週推薦新公式 → 風險負責人核准。"
            />
          </p>
        </div>
        <Badge className="bg-white border-indigo-200 font-mono">{liveFormula.version}</Badge>
      </div>

      <ol className="grid md:grid-cols-5 gap-2 text-xs" data-testid="sev-formula-steps">
        {[
          {
            n: "1",
            en: "Formula scores alert",
            zh: "公式打分分級",
            detail: `P${demo.p} · ${demo.ops} (${demo.score})`,
          },
          {
            n: "2",
            en: "Ops overrides on AI incident",
            zh: "值班在 AI 事故覆寫",
            detail: zh ? "Messenger 勾選不准原因" : "Messenger reason codes",
          },
          {
            n: "3",
            en: "Weekly aggregate",
            zh: "每週彙總",
            detail: `${pack.week_key} · ${pack.sample_count}`,
          },
          {
            n: "4",
            en: "AI new formula",
            zh: "AI 新公式",
            detail: pack.suggested.version,
          },
          {
            n: "5",
            en: "RO approve",
            zh: "RO 核准",
            detail: pack.pending_status || (zh ? "待提案" : "await propose"),
          },
        ].map((s) => (
          <li key={s.n} className="rounded-lg border border-indigo-200 bg-white px-3 py-2">
            <div className="font-semibold text-indigo-900">
              {s.n}. {zh ? s.zh : s.en}
            </div>
            <div className="mt-1 font-mono text-[11px] text-slate-700">{s.detail}</div>
          </li>
        ))}
      </ol>

      <div className="grid lg:grid-cols-2 gap-3">
        <div className="rounded-lg border border-indigo-200 bg-white p-3 space-y-2" data-testid="sev-formula-live">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
            <EnZh en="Live formula → sample alert" zh="線上公式 → 範例警報" />
          </div>
          <p className="text-sm">
            <EnZh
              en="Margin utilisation spike scored"
              zh="保證金使用率尖峰打分結果"
            />{" "}
            <span className="font-mono font-semibold">
              P{demo.p} · {demo.ops}
            </span>{" "}
            <span className="text-[var(--muted)]">(score {demo.score})</span>
          </p>
          <p className="text-xs text-[var(--muted)] font-mono">
            {zh ? "分帶：" : "Bands: "}
            P0≥{liveFormula.thresholds.p0} · P1≥{liveFormula.thresholds.p1} · P2≥
            {liveFormula.thresholds.p2}
          </p>
          <ul className="space-y-1 text-xs max-h-44 overflow-auto">
            {liveFormula.factors.map((f) => {
              const c = demo.contributions.find((x) => x.id === f.id);
              return (
                <li
                  key={f.id}
                  className={`flex flex-wrap justify-between gap-2 rounded border px-2 py-1 ${
                    f.enabled ? "border-[var(--line)] bg-slate-50/80" : "border-dashed border-slate-200 text-slate-400"
                  }`}
                >
                  <span>
                    {zh ? f.zh : f.en}{" "}
                    {!f.enabled ? (
                      <Badge className="ml-1 bg-slate-100">
                        <EnZh en="off" zh="關閉" />
                      </Badge>
                    ) : null}
                  </span>
                  <span className="font-mono tabular-nums">
                    w={f.weight.toFixed(2)}
                    {c ? ` · ${c.raw.toFixed(1)}→${c.weighted.toFixed(2)}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 space-y-2" data-testid="sev-formula-weekly">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-amber-900">
              <EnZh en="Weekly AI formula recommendation" zh="每週 AI 公式建議" />
            </div>
            <div className="flex flex-wrap gap-1 text-xs">
              <Badge className="bg-white border-amber-200">{pack.week_key}</Badge>
              <Badge className="bg-white border-amber-200">
                <EnZh en="Samples" zh="樣本" /> {pack.sample_count}
              </Badge>
              {pack.pending_status ? (
                <Badge
                  className={
                    pack.pending_status === "APPROVED"
                      ? "bg-emerald-100 border-emerald-200 text-emerald-900"
                      : pack.pending_status === "REJECTED"
                        ? "bg-rose-100 border-rose-200 text-rose-900"
                        : "bg-amber-100 border-amber-200 text-amber-950"
                  }
                >
                  {pack.pending_request_id || pack.pending_status}
                </Badge>
              ) : null}
            </div>
          </div>
          <p className="text-sm text-amber-950">{zh ? pack.rationale_zh : pack.rationale_en}</p>
          <p className="text-xs">
            <EnZh en="Same sample alert under suggested formula →" zh="同一範例警報在建議公式下 →" />{" "}
            <span className="font-mono font-semibold">
              P{suggestedDemo.p} · {suggestedDemo.ops}
            </span>{" "}
            <span className="text-[var(--muted)]">(score {suggestedDemo.score})</span>
          </p>
          <ul className="space-y-1 text-xs max-h-36 overflow-auto">
            {pack.factor_changes
              .filter((c) => c.change !== "unchanged")
              .map((c) => (
                <li key={c.id} className="rounded border border-amber-200 bg-white px-2 py-1 flex flex-wrap gap-2 justify-between">
                  <span>
                    {zh ? c.zh : c.en}{" "}
                    <Badge className="bg-indigo-50 border-indigo-200 text-indigo-900">
                      {c.change === "enable"
                        ? zh
                          ? "新增／啟用"
                          : "enable"
                        : c.change === "disable"
                          ? zh
                            ? "移除／停用"
                            : "disable"
                          : c.change === "weight_up"
                            ? zh
                              ? "提高權重"
                              : "weight ↑"
                            : zh
                              ? "降低權重"
                              : "weight ↓"}
                    </Badge>
                  </span>
                  <span className="font-mono">
                    {c.from_enabled ? "on" : "off"}/{c.from_weight.toFixed(2)} →{" "}
                    {c.to_enabled ? "on" : "off"}/{c.to_weight.toFixed(2)}
                  </span>
                </li>
              ))}
            {!pack.factor_changes.some((c) => c.change !== "unchanged") ? (
              <li className="text-[var(--muted)]">
                <EnZh en="No factor diffs this week." zh="本週因子無差異。" />
              </li>
            ) : null}
          </ul>

          <div className="flex flex-wrap gap-2 items-center pt-1">
            {canPropose && pack.pending_status !== "PENDING" && !pack.applied ? (
              <button
                type="button"
                className="btn btn-primary !min-h-10 text-xs"
                disabled={busy || pack.sample_count === 0}
                onClick={() => void proposeWeekly()}
                data-testid="sev-formula-propose"
              >
                <EnZh en="Propose weekly formula (AI maker)" zh="提案每週公式（AI Maker）" />
              </button>
            ) : null}
            {canApprove && pack.pending_status === "PENDING" && pack.pending_cr_id ? (
              <>
                <button
                  type="button"
                  className="btn btn-primary !min-h-10 text-xs"
                  disabled={busy}
                  onClick={() => void decide("APPROVED")}
                  data-testid="sev-formula-ro-approve"
                >
                  <EnZh en="RO approve & apply" zh="RO 核准並套用" />
                </button>
                <button
                  type="button"
                  className="btn !min-h-10 text-xs"
                  disabled={busy}
                  onClick={() => void decide("REJECTED")}
                  data-testid="sev-formula-ro-reject"
                >
                  <EnZh en="RO reject" zh="RO 駁回" />
                </button>
              </>
            ) : null}
            <a className="text-xs text-teal-800 underline" href="/admin/messenger">
              <EnZh en="Ops feedback on AI incident →" zh="值班在 AI 事故回饋 →" />
            </a>
            <a className="text-xs text-teal-800 underline" href="/admin/ai-admin">
              <EnZh en="AI Admin change requests →" zh="AI 管理變更申請 →" />
            </a>
          </div>
          {msg ? <p className="text-sm text-teal-900">{msg}</p> : null}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        <div className="rounded-lg border border-[var(--line)] bg-white p-3 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
            <EnZh en="Reason-code taxonomy (ops checkboxes)" zh="不准原因代碼（值班勾選）" />
          </div>
          <ul className="flex flex-wrap gap-1.5 text-xs">
            {SEVERITY_REASON_CODES.map((c) => (
              <li key={c.id}>
                <Badge className="bg-slate-50 border-slate-200">
                  {zh ? c.zh : c.en}
                  {pack.reason_histogram[c.id] ? (
                    <span className="ml-1 font-mono text-indigo-800">×{pack.reason_histogram[c.id]}</span>
                  ) : null}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-white p-3 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
            <EnZh en="Recent ops overrides" zh="近期值班覆寫" />
          </div>
          <ul className="space-y-1.5 text-xs max-h-36 overflow-auto" data-testid="sev-formula-feedback-list">
            {recentFeedback.slice(0, 8).map((f) => {
              let codes: string[] = [];
              try {
                codes = JSON.parse(f.reason_codes_json || "[]") as string[];
              } catch {
                codes = [];
              }
              return (
                <li key={f.feedback_id} className="rounded border border-[var(--line)] px-2 py-1.5">
                  <span className="font-mono">
                    P{f.ai_p}→P{f.recommended_p}
                  </span>{" "}
                  <span className="text-[var(--muted)]">· {f.rated_by_name || "—"}</span>
                  <div className="text-slate-700 line-clamp-2">
                    <Phrase>{f.reason}</Phrase>
                  </div>
                  {codes.length ? (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {codes.map((code) => {
                        const hit = SEVERITY_REASON_CODES.find((c) => c.id === code);
                        return (
                          <Badge key={code} className="bg-indigo-50 border-indigo-200 text-indigo-900">
                            {hit ? (zh ? hit.zh : hit.en) : code}
                          </Badge>
                        );
                      })}
                    </div>
                  ) : null}
                </li>
              );
            })}
            {!recentFeedback.length ? (
              <li className="text-[var(--muted)]">
                <EnZh en="No ops severity overrides yet." zh="尚無值班嚴重度覆寫。" />
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </section>
  );
}
