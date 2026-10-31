"use client";

import Link from "next/link";
import { useUiLocale } from "@/hooks/useUiLocale";
import { EnZh } from "@/components/EnZh";
import {
  FOREX_COMPANION_CASES,
  FOREX_INCIDENT_1028,
  forexIncidentChip,
  forexIncidentDeskLinks,
  forexPrimaryNextSteps,
} from "@/lib/demo/forex-incident-1028";

type Mode = "full" | "compact" | "banner";

/**
 * Shared forex CFD pack chrome — same INC-1028 story + next-step links on every desk surface.
 */
export function ForexDeskPackLinks({
  mode = "compact",
  className = "",
}: {
  mode?: Mode;
  className?: string;
}) {
  const { locale } = useUiLocale();
  const zh = locale === "zh-Hant";
  const fx = FOREX_INCIDENT_1028;
  const links = mode === "full" ? forexIncidentDeskLinks() : forexPrimaryNextSteps();

  if (mode === "banner") {
    return (
      <div
        className={`panel p-3 sm:p-4 border-teal-200 bg-teal-50/70 text-teal-950 ${className}`}
        data-testid="forex-desk-pack-banner"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-teal-800">
              <EnZh en="Forex CFD desk pack" zh="外匯 CFD 台面組合" />
            </div>
            <div className="font-semibold mt-0.5 font-mono text-sm">{forexIncidentChip(locale)}</div>
            <p className="text-xs mt-1 text-teal-900/85">{zh ? fx.title_zh : fx.title_en}</p>
            <p className="text-[11px] mt-1 text-teal-800/75">
              <EnZh
                en="Same story across Monitor → Alerts → Aggregation → Labs → Messenger → Risk Log. Companions share the LP/XAU book."
                zh="同一故事貫穿 監控 → 警報 → 聚合 → 實驗室 → Messenger → 風險日誌。伴隨案例共用 LP／XAU 帳簿。"
              />
            </p>
          </div>
          <Link className="btn btn-sm btn-primary shrink-0" href={fx.workspace_path}>
            <EnZh en="Open INC-1028 workspace" zh="開啟 INC-1028 工作台" />
          </Link>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {forexPrimaryNextSteps().map((l) => (
            <Link key={l.href} className="btn btn-sm" href={l.href}>
              {zh ? l.zh : l.en}
            </Link>
          ))}
        </div>
        <div className="mt-3 text-[11px] text-teal-900/80">
          <span className="font-semibold">
            <EnZh en="Companions:" zh="伴隨案例：" />
          </span>{" "}
          {FOREX_COMPANION_CASES.map((c, idx) => (
            <span key={c.id}>
              {idx ? " · " : ""}
              {zh ? c.title_zh : c.title_en}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`panel p-3 ${className}`} data-testid="forex-desk-pack-links">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
            <EnZh en="Shared forex use-case" zh="共用外匯用例" />
          </div>
          <div className="font-mono text-xs font-semibold mt-0.5">{forexIncidentChip(locale)}</div>
        </div>
        <Link className="text-xs underline text-teal-800" href="/admin/docs/indicators-scenarios">
          <EnZh en="Full catalog" zh="完整目錄" />
        </Link>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {links.map((l) => (
          <Link key={l.href} className="btn btn-sm" href={l.href}>
            {zh ? l.zh : l.en}
          </Link>
        ))}
      </div>
    </div>
  );
}
