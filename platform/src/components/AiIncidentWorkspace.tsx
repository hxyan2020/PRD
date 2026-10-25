"use client";

import { useMemo, useState } from "react";
import { AdminLink } from "@/components/AdminLink";
import { EnZh } from "@/components/EnZh";
import { useUiLocale } from "@/hooks/useUiLocale";
import { publicBasePath } from "@/lib/static-export";

/**
 * Hosts the Monitor 2.0 bilingual AI Incident Workspace HTML prototype
 * (INC-1028 LP-A / XAUUSD demo) inside CRMP Admin with demo data only.
 */
export function AiIncidentWorkspace() {
  const { locale } = useUiLocale();
  const zh = locale === "zh-Hant";
  const [surfaceHint, setSurfaceHint] = useState<"embedded" | "blank">("embedded");

  const prototypeSrc = useMemo(() => {
    const base = publicBasePath();
    return `${base}/prototypes/monitor2-ai-report.html`;
  }, []);

  return (
    <div className="space-y-3" data-testid="ai-incident-workspace">
      <div className="panel p-3 sm:p-4 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
              INC-1028 · LP-A · XAUUSD · P2
            </div>
            <p className="text-sm text-[var(--muted)] mt-1 max-w-3xl">
              <EnZh
                en="Interactive bilingual prototype from Monitor2_AI_Report_Web_Bilingual_v3 — Web Console + Lark, Static (read-only) vs Dynamic (multi-turn investigation), E-01…E-08 evidence, nested human feedback. All actions use simulated demo data (no production AI / Lark)."
                zh="來自 Monitor2_AI_Report_Web_Bilingual_v3 的雙語互動原型 — 網頁＋Lark、靜態（只讀）／動態（多輪調查）、E-01…E-08 證據、巢狀人工回饋。所有動作皆為模擬示範資料（無正式 AI／Lark）。"
              />
            </p>
          </div>
          <div className="action-row">
            <a className="btn" href={prototypeSrc} target="_blank" rel="noreferrer" data-testid="ai-incident-open-blank">
              <EnZh en="Open full-page demo" zh="開全頁演示" />
            </a>
            <AdminLink className="btn" href="/admin/messenger" data-testid="ai-incident-open-messenger">
              <EnZh en="Demo Messenger" zh="示範 Messenger" />
            </AdminLink>
            <AdminLink className="btn" href="/admin/indicator-aggregation">
              <EnZh en="L1→L2 board" zh="L1→L2 聚合台" />
            </AdminLink>
          </div>
        </div>
        <ul className="text-xs text-[var(--muted)] grid sm:grid-cols-2 gap-1 list-disc pl-4">
          <li>
            <EnZh
              en="Static mode: read RCA + evidence only — ACK / assign / escalate disabled"
              zh="靜態模式：只讀 RCA＋證據 — 停用 ACK／轉派／升級"
            />
          </li>
          <li>
            <EnZh
              en="Dynamic mode: investigate Fallback / impact / history / market / Admin logs"
              zh="動態模式：調查 Fallback／影響／歷史／市場／Admin 日誌"
            />
          </li>
          <li>
            <EnZh
              en="Toolbar: Web ↔ Lark · 中文 ↔ EN · export demo JSON"
              zh="工具列：網頁 ↔ Lark · 中文 ↔ EN · 匯出示範 JSON"
            />
          </li>
          <li>
            <EnZh
              en="Messenger thread INC-1028 links here from AI_REPORT surfaces"
              zh="Messenger 執行緒 INC-1028 可自 AI_REPORT 介面連到此頁"
            />
          </li>
        </ul>
      </div>

      <div className="panel overflow-hidden" data-testid="ai-incident-frame-wrap">
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[var(--border)] bg-[var(--panel-2,#f8fafc)]">
          <span className="text-xs font-semibold text-[var(--ink)]">
            {zh ? "內嵌原型工作台" : "Embedded prototype workspace"}
          </span>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setSurfaceHint((s) => (s === "embedded" ? "blank" : "embedded"))}
          >
            {surfaceHint === "embedded"
              ? zh
                ? "重新載入"
                : "Reload"
              : zh
                ? "顯示內嵌"
                : "Show embedded"}
          </button>
        </div>
        {surfaceHint === "embedded" ? (
          <iframe
            key={prototypeSrc}
            title={zh ? "AI 事故工作台演示" : "AI Incident Workspace demo"}
            src={prototypeSrc}
            className="w-full border-0 bg-white"
            style={{ height: "min(82vh, 920px)" }}
            data-testid="ai-incident-iframe"
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
