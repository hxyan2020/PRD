"use client";

import { useMemo, useState } from "react";
import { AdminLink } from "@/components/AdminLink";
import { EnZh } from "@/components/EnZh";
import { useUiLocale } from "@/hooks/useUiLocale";
import { publicBasePath } from "@/lib/static-export";

/**
 * Hosts the Monitor 2.0 Noise Reduction end-to-end HTML lab inside CRMP Admin
 * with demo data only (quality → bypass → threshold → persistence → dedup → L2 → AI → feedback).
 */
export function NoiseReductionLab() {
  const { locale } = useUiLocale();
  const zh = locale === "zh-Hant";
  const [surfaceHint, setSurfaceHint] = useState<"embedded" | "blank">("embedded");

  const prototypeSrc = useMemo(() => {
    const base = publicBasePath();
    const lang = zh ? "zh-Hant" : "en";
    return `${base}/prototypes/monitor2-noise-reduction.html?embed=1&lang=${lang}`;
  }, [zh]);

  return (
    <div className="space-y-4" data-testid="noise-reduction-lab">
      <div className="panel p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--brand)]">
              Monitor 2.0 · Noise Reduction
            </div>
            <p className="text-sm text-[var(--muted)] max-w-3xl leading-relaxed">
              <EnZh
                en="Interactive end-to-end lab from Monitor2_Noise_Reduction_End_to_End_Demo — six scenarios (cross-BU L2, spike, dedup, benign, unknown, P0 bypass), knobs for threshold / persistence / L2 score / window, AI evidence + human feedback → backtest / shadow / approve. Demo data only."
                zh="來自 Monitor2_Noise_Reduction_End_to_End_Demo 的端到端降噪實驗室 — 六場景（跨 BU L2、尖峰、去重、良性、未知、P0 旁路）、閾值／Persistence／L2 分數／視窗旋鈕、AI 證據＋人工回饋 → 回測／Shadow／核准。僅示範資料。"
              />
            </p>
          </div>
          <div className="action-row">
            <a className="btn" href={prototypeSrc} target="_blank" rel="noreferrer" data-testid="noise-open-blank">
              <EnZh en="Open full-page demo" zh="開全頁演示" />
            </a>
            <AdminLink className="btn" href="/admin/monitor-2" data-testid="noise-open-monitor">
              <EnZh en="Monitor 2.0" zh="Monitor 2.0" />
            </AdminLink>
            <AdminLink className="btn" href="/admin/indicator-aggregation">
              <EnZh en="L1→L2 board" zh="L1→L2 聚合台" />
            </AdminLink>
            <AdminLink className="btn" href="/admin/ai-incident">
              <EnZh en="AI Incident Workspace" zh="AI 事故工作台" />
            </AdminLink>
          </div>
        </div>
        <ul className="text-xs text-[var(--muted)] grid sm:grid-cols-2 gap-x-4 gap-y-1.5 list-disc pl-4">
          <li>
            <EnZh
              en="Pipeline: quality → critical bypass → dynamic threshold → persistence → dedup → L2 → severity → AI"
              zh="鏈路：品質 → 關鍵旁路 → 動態閾值 → Persistence → 去重 → L2 → 嚴重度 → AI"
            />
          </li>
          <li>
            <EnZh
              en="P0 critical path never waits for Persistence, L2 window, or AI"
              zh="P0 關鍵路徑不等待 Persistence、L2 視窗或 AI"
            />
          </li>
          <li>
            <EnZh
              en="Unknown outcomes stay OPEN — never auto-marked false positive"
              zh="未知結果維持 OPEN — 不得自動標成誤報"
            />
          </li>
          <li>
            <EnZh
              en="Toolbar 繁中 ↔ EN follows the CRMP shell language"
              zh="工具列 繁中 ↔ EN 跟隨 CRMP 殼層語言"
            />
          </li>
        </ul>
      </div>

      <div className="panel overflow-hidden" data-testid="noise-frame-wrap">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-[var(--line)] bg-[var(--panel)]">
          <span className="text-xs font-semibold text-[var(--ink)]">
            <EnZh en="Embedded noise-reduction lab" zh="內嵌降噪實驗室" />
          </span>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setSurfaceHint((s) => (s === "embedded" ? "blank" : "embedded"))}
          >
            {surfaceHint === "embedded" ? (
              <EnZh en="Reload" zh="重新載入" />
            ) : (
              <EnZh en="Show embedded" zh="顯示內嵌" />
            )}
          </button>
        </div>
        {surfaceHint === "embedded" ? (
          <iframe
            key={prototypeSrc}
            title={zh ? "降噪實驗室演示" : "Noise reduction lab demo"}
            src={prototypeSrc}
            className="w-full border-0 bg-[var(--bg)]"
            style={{ height: "min(85vh, 980px)" }}
            data-testid="noise-reduction-iframe"
          />
        ) : (
          <div className="p-6 text-sm text-[var(--muted)]">
            <EnZh en="Frame hidden — use Open full-page demo." zh="內嵌已隱藏 — 請用「開全頁演示」。" />
          </div>
        )}
      </div>
    </div>
  );
}
