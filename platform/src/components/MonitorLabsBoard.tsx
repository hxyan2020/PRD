"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileSearch, Filter, GitMerge } from "lucide-react";
import { useUiLocale } from "@/hooks/useUiLocale";
import { EnZh } from "@/components/EnZh";
import { DiscoveryL2RcaLab } from "@/components/DiscoveryL2RcaLab";
import { AiIncidentWorkspace } from "@/components/AiIncidentWorkspace";
import { NoiseReductionLab } from "@/components/NoiseReductionLab";

export type MonitorLabTab = "l2-rca" | "ai-incident" | "noise-reduction";

const TABS: Array<{
  id: MonitorLabTab;
  icon: typeof GitMerge;
  en: string;
  zh: string;
  href: string;
}> = [
  { id: "l2-rca", icon: GitMerge, en: "L2 → AI RCA", zh: "L2 → AI RCA", href: "/admin/l2-rca" },
  {
    id: "ai-incident",
    icon: FileSearch,
    en: "AI Incident (INC-1028)",
    zh: "AI 事故（INC-1028）",
    href: "/admin/ai-incident",
  },
  {
    id: "noise-reduction",
    icon: Filter,
    en: "Noise Reduction",
    zh: "降噪",
    href: "/admin/noise-reduction",
  },
];

function readTab(): MonitorLabTab {
  if (typeof window === "undefined") return "l2-rca";
  const q = new URLSearchParams(window.location.search).get("tab");
  if (q === "ai-incident" || q === "noise-reduction" || q === "l2-rca") return q;
  return "l2-rca";
}

export function MonitorLabsBoard({ initialTab }: { initialTab?: MonitorLabTab }) {
  const { locale } = useUiLocale();
  const zh = locale === "zh-Hant";
  const [tab, setTab] = useState<MonitorLabTab>(initialTab || "l2-rca");

  useEffect(() => {
    setTab(initialTab || readTab());
  }, [initialTab]);

  function select(next: MonitorLabTab) {
    setTab(next);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState({}, "", url.toString());
  }

  return (
    <div className="space-y-4">
      <div className="panel p-3 sm:p-4 text-sm border-amber-200 bg-amber-50/70 text-amber-950">
        <EnZh
          en="HTML end-to-end labs (demo data only). Production desk path stays Monitor 2.0 → Open Alerts → Messenger / Interventions → Closed Risk Log. Deep links to each lab URL still work."
          zh="HTML 端到端實驗室（僅示範資料）。正式台面路徑仍是 Monitor 2.0 → 未結警報 → Messenger／人工干預 → 已結風險日誌。各實驗室舊網址仍可用。"
        />
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label={zh ? "監控實驗室" : "Monitor labs"}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`btn ${active ? "btn-primary" : ""}`}
              onClick={() => select(t.id)}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {zh ? t.zh : t.en}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-[var(--muted)]">
        <EnZh en="Canonical deep link:" zh="正式深連結：" />{" "}
        <Link className="underline" href={TABS.find((t) => t.id === tab)?.href || "/admin/monitor-labs"}>
          {TABS.find((t) => t.id === tab)?.href}
        </Link>
      </p>

      {tab === "l2-rca" ? <DiscoveryL2RcaLab /> : null}
      {tab === "ai-incident" ? <AiIncidentWorkspace /> : null}
      {tab === "noise-reduction" ? <NoiseReductionLab /> : null}
    </div>
  );
}
