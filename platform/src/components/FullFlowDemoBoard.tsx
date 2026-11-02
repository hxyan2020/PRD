"use client";

import Link from "next/link";
import {
  DESK_12_SCENARIOS,
  DESK_AUDIENCE_LABEL,
  FULL_FLOW_STEPS,
  type DeskAudience,
} from "@/lib/demo/desk-12-pack";
import { EnZh } from "@/components/EnZh";
import { useUiLocale } from "@/hooks/useUiLocale";
import { cn } from "@/lib/utils";

const AUDIENCES: DeskAudience[] = ["broker_admin", "cfd_pricing", "cfd_dealing", "perp_exchange"];

export function FullFlowDemoBoard() {
  const { locale } = useUiLocale();
  const zh = locale === "zh-Hant";

  return (
    <div className="space-y-5" data-testid="full-flow-demo">
      <section className="rounded-2xl border border-black/10 bg-gradient-to-br from-slate-50 via-white to-teal-50/40 p-4 sm:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-800">
          <EnZh en="Full-flow demo · desk-12 pack" zh="全流程demo · desk-12 組合" />
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl sm:text-2xl leading-snug">
          <EnZh
            en="Walk Risk Domains → Open Alerts → Indicators → Discovery → Aggregation → Market Intel → AI RCA → Noise → Closed Log → Daily"
            zh="依序走完：風險領域 → 未結警報 → 已知指標 → 未知探索 → 聚合 → 市場情報 → AI根因 → 降噪 → 已結日誌 → 每日績效"
          />
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)] max-w-3xl">
          <EnZh
            en="Twelve realistic scenarios (3 broker admin · 3 pricing · 3 dealing · 3 perpetual). Closed Risk Log and Daily Performance only reflect real closes and live refreshes — nothing is seed-faked as closed."
            zh="十二則真實情境（管理／Pricing／Dealing／永續各 3）。已結風險日誌與每日績效只反映真實關單與即時刷新 — 不做種子假裝已結。"
          />
        </p>
      </section>

      <nav aria-label={zh ? "全流程步驟" : "Full-flow steps"} className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {FULL_FLOW_STEPS.map((step, i) => (
          <Link
            key={step.id}
            href={step.href}
            className="group rounded-xl border border-black/10 bg-white/90 px-3 py-2.5 hover:border-teal-400 hover:bg-teal-50/50 transition-colors"
            data-testid={`full-flow-step-${step.id}`}
          >
            <div className="flex items-baseline gap-2">
              <span className="text-[11px] font-bold tabular-nums text-teal-800">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-sm font-semibold leading-snug group-hover:text-teal-900">
                {zh ? step.zh : step.en}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[var(--muted)] leading-snug">{zh ? step.hintZh : step.hintEn}</p>
          </Link>
        ))}
      </nav>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          <EnZh en="12 desk scenarios" zh="12 則櫃台情境" />
        </h3>
        <div className="grid gap-3 lg:grid-cols-2">
          {AUDIENCES.map((aud) => {
            const label = DESK_AUDIENCE_LABEL[aud];
            const rows = DESK_12_SCENARIOS.filter((s) => s.audience === aud);
            return (
              <article
                key={aud}
                className="rounded-2xl border border-black/10 bg-white/90 p-3 sm:p-4"
                data-testid={`desk-audience-${aud}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-sm">{zh ? label.zh : label.en}</h4>
                  <span className="text-[11px] font-bold text-teal-800">{rows.length}</span>
                </div>
                <ul className="mt-2 space-y-2">
                  {rows.map((s) => (
                    <li key={s.code} className="rounded-lg border border-black/5 bg-slate-50/80 px-2.5 py-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold",
                            s.priority === 0
                              ? "bg-rose-600 text-white"
                              : s.priority === 1
                                ? "bg-orange-500 text-white"
                                : "bg-amber-400 text-amber-950"
                          )}
                        >
                          P{s.priority}
                        </span>
                        <code className="text-[10px] text-[var(--muted)]">{s.code}</code>
                        <code className="text-[10px] text-teal-800">{s.alert_id}</code>
                      </div>
                      <p className="mt-1 text-sm font-medium leading-snug">{zh ? s.name.zh : s.name.en}</p>
                      <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                        {s.symbol} · {s.venue} · {s.primary_indicators.join(", ")}
                      </p>
                      <p className="mt-1 text-[11px] text-[var(--muted)]">
                        <span className="font-semibold text-slate-700">
                          <EnZh en="Noise method" zh="降噪方法" />:
                        </span>{" "}
                        {zh ? s.noise.zh : s.noise.en}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                        <span className="font-semibold text-slate-700">Skill</span> {s.skill_code} ·{" "}
                        <span className="font-semibold text-slate-700">RAG</span> {s.rag_topics.join(" · ")}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Link className="btn text-[11px] py-1" href={`/admin/alerts?q=${encodeURIComponent(s.alert_id)}`}>
                          <EnZh en="Open alert" zh="未結警報" />
                        </Link>
                        <Link
                          className="btn text-[11px] py-1"
                          href={`/admin/monitor-2?monitor_id=${encodeURIComponent(s.primary_indicators[0])}`}
                        >
                          <EnZh en="Indicator" zh="指標" />
                        </Link>
                        <Link className="btn text-[11px] py-1" href="/admin/ai-incident">
                          <EnZh en="AI RCA" zh="AI根因" />
                        </Link>
                        <Link className="btn text-[11px] py-1" href="/admin/noise-reduction">
                          <EnZh en="Noise" zh="降噪" />
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
