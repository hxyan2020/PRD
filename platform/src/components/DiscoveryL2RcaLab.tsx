"use client";

import { useMemo, useState } from "react";
import { AdminLink } from "@/components/AdminLink";
import { EnZh } from "@/components/EnZh";
import { useUiLocale } from "@/hooks/useUiLocale";
import { publicBasePath } from "@/lib/static-export";

/**
 * Hosts the Monitor 2.0 Discovery → L1/L2 → AI RCA HTML lab inside CRMP Admin.
 * After L2 dispatch the prototype links into the AI Incident Workspace (INC-1028).
 */
export function DiscoveryL2RcaLab() {
  const { locale } = useUiLocale();
  const zh = locale === "zh-Hant";
  const [surfaceHint, setSurfaceHint] = useState<"embedded" | "blank">("embedded");

  const prototypeSrc = useMemo(() => {
    const base = publicBasePath();
    const lang = zh ? "zh-Hant" : "en";
    const q = new URLSearchParams({ embed: "1", lang, base, tab: "aggregate" });
    return `${base}/prototypes/monitor2-discovery-l2-rca.html?${q.toString()}`;
  }, [zh]);

  return (
    <div className="space-y-4" data-testid="discovery-l2-rca-lab">
      <div className="panel p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--brand)]">
              Monitor 2.0 · Discovery → L2 → AI RCA
            </div>
            <p className="text-sm text-[var(--muted)] max-w-3xl leading-relaxed">
              <EnZh
                en="Integrated lab from Monitor2_Integrated_Discovery_L2_RCA_v6 — known-incident reverse engineering → unknown-risk models → L1→L2 live aggregate (AND/OR/SEQUENCE) → AI RCA draft. After L2 dispatch, open the bilingual AI Incident Workspace (INC-1028). Demo data only."
                zh="來自 Monitor2_Integrated_Discovery_L2_RCA_v6 的整合實驗室 — 已知事故反推 → 未知風險模型 → L1→L2 即時聚合（AND／OR／SEQUENCE）→ AI RCA 草稿。L2 發車後開啟雙語 AI 事故工作台（INC-1028）。僅示範資料。"
              />
            </p>
          </div>
          <div className="action-row">
            <a className="btn" href={prototypeSrc} target="_blank" rel="noreferrer" data-testid="l2rca-open-blank">
              <EnZh en="Open full-page demo" zh="開全頁演示" />
            </a>
            <AdminLink className="btn" href="/admin/indicator-aggregation" data-testid="l2rca-open-agg">
              <EnZh en="L1→L2 board" zh="L1→L2 聚合台" />
            </AdminLink>
            <AdminLink className="btn btn-primary" href="/admin/ai-incident" data-testid="l2rca-open-ai">
              <EnZh en="AI Incident Workspace" zh="AI 事故工作台" />
            </AdminLink>
            <AdminLink className="btn" href="/admin/discovery">
              <EnZh en="Unknown Risk Discovery" zh="未知風險探索" />
            </AdminLink>
          </div>
        </div>
        <ul className="text-xs text-[var(--muted)] grid sm:grid-cols-2 gap-x-4 gap-y-1.5 list-disc pl-4">
          <li>
            <EnZh
              en="Tab ③: run L1→L2 scenarios A–G, then Risk Ops confirm → L2 INC-1028"
              zh="分頁③：跑 L1→L2 場景 A–G，Risk Ops 確認 → L2 INC-1028"
            />
          </li>
          <li>
            <EnZh
              en="After L2, the embedded CTA opens /admin/ai-incident (AI RCA report)"
              zh="L2 之後，內嵌 CTA 開啟 /admin/ai-incident（AI RCA 報告）"
            />
          </li>
          <li>
            <EnZh
              en="L2 correlation uses read-only SQL / rules — AI starts only after incident dispatch"
              zh="L2 關聯用只讀 SQL／規則 — AI 僅在事故發車後啟動"
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

      <div className="panel overflow-hidden" data-testid="l2rca-frame-wrap">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-[var(--line)] bg-[var(--panel)]">
          <span className="text-xs font-semibold text-[var(--ink)]">
            <EnZh en="Embedded Discovery → L2 → AI RCA lab" zh="內嵌 發現 → L2 → AI RCA 實驗室" />
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
            title={zh ? "發現→L2→AI RCA 演示" : "Discovery → L2 → AI RCA demo"}
            src={prototypeSrc}
            className="w-full border-0 bg-[var(--bg)]"
            style={{ height: "min(85vh, 980px)" }}
            data-testid="discovery-l2-rca-iframe"
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
